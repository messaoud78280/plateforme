/**
 * Contrôles de conformité avant émission / envoi d’un devis.
 * Déterministe — aucune IA, aucun conseil juridique automatique.
 *
 * Références métier (évolutives) :
 * - identité émetteur / client / prestations / TVA
 * - mentions BTP (assurance, déchets) selon paramétrage org
 * - validité / paiement / chantier
 */
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import { ensureCommercialOrgSettings } from "@/lib/commercial/settings";
import {
  parseQuoteDocumentSettings,
  type QuoteDocumentSettings,
} from "@/lib/commercial/pdf/document-settings";

export type IssuanceSeverity = "ERROR" | "WARNING" | "INFO";

export type IssuanceCheckItem = {
  code: string;
  severity: IssuanceSeverity;
  message: string;
};

export type QuoteIssuanceValidation = {
  ok: boolean;
  canEmit: boolean;
  canDownloadDraft: boolean;
  items: IssuanceCheckItem[];
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
};

function summarize(items: IssuanceCheckItem[]): QuoteIssuanceValidation {
  const errors = items.filter((i) => i.severity === "ERROR").length;
  const warnings = items.filter((i) => i.severity === "WARNING").length;
  const infos = items.filter((i) => i.severity === "INFO").length;
  return {
    ok: errors === 0,
    canEmit: errors === 0,
    canDownloadDraft: true,
    items,
    summary: { errors, warnings, infos },
  };
}

export function validateQuoteIssuancePayload(input: {
  number: string | null | undefined;
  subject: string | null | undefined;
  clientPresent: boolean;
  issuerName: string | null | undefined;
  workLineCount: number;
  totalSellHt: number;
  totalVat: number;
  totalTtc: number;
  hasInvalidVat: boolean;
  siteAddress: string | null | undefined;
  paymentTerms: string | null | undefined;
  hasPaymentSchedule: boolean;
  validityDate: Date | null | undefined;
  insuranceMentions: string | null | undefined;
  executionDurationNote: string | null | undefined;
  documentSettings: QuoteDocumentSettings;
}): QuoteIssuanceValidation {
  const items: IssuanceCheckItem[] = [];
  const ds = input.documentSettings;

  if (!input.number?.trim()) {
    items.push({
      code: "QUOTE_NUMBER",
      severity: "ERROR",
      message: "Numéro de devis absent",
    });
  }
  if (!input.clientPresent) {
    items.push({
      code: "CLIENT",
      severity: "ERROR",
      message: "Client absent",
    });
  }
  if (!input.issuerName?.trim()) {
    items.push({
      code: "ISSUER",
      severity: "ERROR",
      message: "Entreprise émettrice incomplète (raison sociale)",
    });
  }
  if (input.workLineCount < 1) {
    items.push({
      code: "LINES",
      severity: "ERROR",
      message: "Aucune prestation chiffrée",
    });
  }
  if (input.hasInvalidVat) {
    items.push({
      code: "VAT",
      severity: "ERROR",
      message: "Taux de TVA invalide sur une ligne",
    });
  }
  const expectedTtc = Math.round((input.totalSellHt + input.totalVat) * 100) / 100;
  if (Math.abs(expectedTtc - input.totalTtc) > 0.05) {
    items.push({
      code: "TOTALS",
      severity: "ERROR",
      message: "Totaux incohérents (HT + TVA ≠ TTC)",
    });
  }
  if (!input.subject?.trim()) {
    items.push({
      code: "SUBJECT",
      severity: "WARNING",
      message: "Objet des travaux non renseigné",
    });
  }
  if (ds.requireSiteAddress !== false && !input.siteAddress?.trim()) {
    items.push({
      code: "SITE",
      severity: "WARNING",
      message: "Adresse chantier absente",
    });
  }
  if (!input.validityDate) {
    items.push({
      code: "VALIDITY",
      severity: "WARNING",
      message: "Date de validité non renseignée",
    });
  }
  if (!input.paymentTerms?.trim() && !input.hasPaymentSchedule) {
    items.push({
      code: "PAYMENT",
      severity: "WARNING",
      message: "Conditions de paiement absentes",
    });
  }
  if (ds.requireInsurance && !input.insuranceMentions?.trim() && !ds.decennaleInsurer) {
    items.push({
      code: "INSURANCE",
      severity: "WARNING",
      message: "Assurance / décennale non renseignée",
    });
  }
  if (ds.requireWaste && !ds.wasteManagementText?.trim()) {
    items.push({
      code: "WASTE",
      severity: "WARNING",
      message: "Gestion des déchets non renseignée",
    });
  }
  if (ds.requireExecutionDuration && !input.executionDurationNote?.trim()) {
    items.push({
      code: "EXECUTION",
      severity: "WARNING",
      message: "Durée d’exécution non renseignée",
    });
  }
  if (!ds.cgvText?.trim()) {
    items.push({
      code: "CGV",
      severity: "INFO",
      message: "CGV non configurées (annexe absente)",
    });
  }

  return summarize(items);
}

export async function validateQuoteForIssuance(
  orgId: string,
  quoteId: string,
): Promise<QuoteIssuanceValidation | null> {
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: quoteId, organizationId: orgId },
    select: {
      number: true,
      subject: true,
      clientExternalOrgId: true,
      clientSnapshotJson: true,
      issuerSnapshotJson: true,
      siteAddressSnapshot: true,
      paymentTerms: true,
      paymentScheduleJson: true,
      validityDate: true,
      currentVersionId: true,
    },
  });
  if (!quote?.currentVersionId) return null;

  const version = await prisma.commercialQuoteVersion.findFirst({
    where: {
      id: quote.currentVersionId,
      organizationId: orgId,
    },
    select: {
      totalSellHt: true,
      totalVat: true,
      totalTtc: true,
      paymentTerms: true,
      paymentScheduleJson: true,
      lines: {
        select: {
          kind: true,
          isOptional: true,
          vatRate: true,
        },
      },
    },
  });
  if (!version) return null;

  const settings = await ensureCommercialOrgSettings(orgId);
  const issuer = quote.issuerSnapshotJson as {
    name?: string;
    tradeName?: string;
  } | null;
  const clientSnap = quote.clientSnapshotJson as { name?: string } | null;
  const workLineCount = version.lines.filter(
    (l) => l.kind === "WORK" && !l.isOptional,
  ).length;
  const hasInvalidVat = version.lines.some((l) => {
    if (l.kind !== "WORK") return false;
    const rate = d(l.vatRate);
    return !Number.isFinite(rate) || rate < 0 || rate > 100;
  });

  return validateQuoteIssuancePayload({
    number: quote.number,
    subject: quote.subject,
    clientPresent: Boolean(quote.clientExternalOrgId || clientSnap?.name),
    issuerName: issuer?.tradeName || issuer?.name || null,
    workLineCount,
    totalSellHt: d(version.totalSellHt),
    totalVat: d(version.totalVat),
    totalTtc: d(version.totalTtc),
    hasInvalidVat,
    siteAddress: quote.siteAddressSnapshot,
    paymentTerms: version.paymentTerms || quote.paymentTerms,
    hasPaymentSchedule: Boolean(
      version.paymentScheduleJson || quote.paymentScheduleJson,
    ),
    validityDate: quote.validityDate,
    insuranceMentions: settings.insuranceMentions,
    executionDurationNote: null,
    documentSettings: parseQuoteDocumentSettings(
      settings.quoteDocumentSettingsJson,
    ),
  });
}
