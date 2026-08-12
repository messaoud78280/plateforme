/**
 * Construit l’entrée PDF à partir d’une VERSION précise (pas « la courante »).
 * Snapshots contractuels de la version en priorité.
 */
import { d } from "@/lib/commercial/decimal";
import { roundMoney } from "@/lib/commercial/money";
import type {
  QuotePdfInput,
  QuotePdfSnapshot,
  QuotePdfVatSlice,
} from "@/lib/commercial/pdf-quote";
import { parsePaymentSchedule } from "@/lib/commercial/payment-schedule";
import {
  parseQuoteDocumentSettings,
  type QuoteDocumentSettings,
} from "@/lib/commercial/pdf/document-settings";

export type QuotePdfVersionSource = {
  id: string;
  versionNumber: number;
  clientSnapshotJson: unknown;
  issuerSnapshotJson: unknown;
  paymentTerms: string | null;
  paymentScheduleJson?: unknown;
  clientNotes: string | null;
  totalSellHt: unknown;
  totalVat: unknown;
  totalTtc: unknown;
  sections: Array<{ id: string; title: string; sortOrder: number }>;
  lines: Array<{
    sectionId: string | null;
    kind: string;
    reference: string | null;
    designation: string;
    description?: string | null;
    quantity: unknown;
    unit: string;
    unitSellHt: unknown;
    vatRate: unknown;
    lineSellHt: unknown;
    lineVat?: unknown;
    isOptional: boolean;
    sortOrder: number;
  }>;
};

export type QuotePdfHeaderSource = {
  number: string;
  subject: string;
  status: string;
  issueDate: Date;
  validityDate?: Date | null;
  paymentTerms?: string | null;
  paymentScheduleJson?: unknown;
  clientNotes?: string | null;
  siteAddressSnapshot?: string | null;
  clientSnapshotJson?: unknown;
  issuerSnapshotJson?: unknown;
  currency: string;
  projectTitle?: string | null;
  acceptedAt?: Date | null;
};

function asSnapshot(raw: unknown): QuotePdfSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as QuotePdfSnapshot;
}

function mapLine(l: QuotePdfVersionSource["lines"][number]) {
  return {
    kind: l.kind,
    reference: l.reference,
    designation: l.designation,
    description: l.description ?? null,
    quantity: d(l.quantity),
    unit: l.unit,
    unitSellHt: d(l.unitSellHt),
    vatRate: d(l.vatRate),
    lineSellHt: d(l.lineSellHt),
    isOptional: l.isOptional,
  };
}

/** Ventilation TVA depuis lignes incluses (WORK non optionnelles). */
export function buildVatBreakdownFromLines(
  lines: Array<{
    kind: string;
    isOptional: boolean;
    vatRate: number;
    lineSellHt: number;
    lineVat?: number;
  }>,
): QuotePdfVatSlice[] {
  const map = new Map<number, { baseHt: number; vat: number }>();
  for (const l of lines) {
    if (l.kind !== "WORK" || l.isOptional) continue;
    const rate = roundMoney(l.vatRate, 4);
    const base = l.lineSellHt;
    const vat =
      l.lineVat != null
        ? l.lineVat
        : roundMoney((base * rate) / 100, 2);
    const cur = map.get(rate) ?? { baseHt: 0, vat: 0 };
    cur.baseHt += base;
    cur.vat += vat;
    map.set(rate, cur);
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([rate, v]) => ({
      rate,
      baseHt: roundMoney(v.baseHt, 2),
      vat: roundMoney(v.vat, 2),
    }));
}

export function buildQuotePdfInputFromVersion(opts: {
  quote: QuotePdfHeaderSource;
  version: QuotePdfVersionSource;
  statusForPdf?: string;
  quoteMentions?: string | null;
  legalMentions?: string | null;
  insuranceMentions?: string | null;
  accentColor?: string | null;
  documentSettings?: QuoteDocumentSettings | null;
  bank?: QuotePdfInput["bank"];
  particularConditions?: string | null;
  executionDurationNote?: string | null;
  executionStartNote?: string | null;
  consumerContractContext?: string | null;
}): QuotePdfInput {
  const { quote, version } = opts;
  const sections = [...version.sections]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => ({
      title: s.title,
      lines: version.lines
        .filter((l) => l.sectionId === s.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(mapLine),
    }));

  const orphanLines = version.lines
    .filter((l) => !l.sectionId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (orphanLines.length) {
    sections.push({
      title: "Divers",
      lines: orphanLines.map(mapLine),
    });
  }

  const schedule =
    parsePaymentSchedule(version.paymentScheduleJson) ??
    parsePaymentSchedule(quote.paymentScheduleJson);

  const allMapped = version.lines.map((l) => ({
    kind: l.kind,
    isOptional: l.isOptional || l.kind === "OPTION",
    vatRate: d(l.vatRate),
    lineSellHt: d(l.lineSellHt),
    lineVat: l.lineVat != null ? d(l.lineVat) : undefined,
  }));

  return {
    number: quote.number,
    subject: quote.subject,
    status: opts.statusForPdf ?? quote.status,
    issueDate: quote.issueDate,
    validityDate: quote.validityDate ?? null,
    paymentTerms: version.paymentTerms ?? quote.paymentTerms ?? null,
    paymentSchedule: schedule,
    clientNotes: version.clientNotes ?? quote.clientNotes ?? null,
    siteAddressSnapshot: quote.siteAddressSnapshot ?? null,
    projectTitle: quote.projectTitle ?? null,
    versionNumber: version.versionNumber,
    issuer: asSnapshot(version.issuerSnapshotJson) ?? asSnapshot(quote.issuerSnapshotJson),
    client: asSnapshot(version.clientSnapshotJson) ?? asSnapshot(quote.clientSnapshotJson),
    currency: quote.currency,
    quoteMentions: opts.quoteMentions ?? null,
    legalMentions: opts.legalMentions ?? null,
    insuranceMentions: opts.insuranceMentions ?? null,
    accentColor: opts.accentColor ?? null,
    documentSettings: opts.documentSettings
      ? parseQuoteDocumentSettings(opts.documentSettings)
      : null,
    bank: opts.bank ?? null,
    acceptedAt: quote.acceptedAt ?? null,
    particularConditions: opts.particularConditions ?? null,
    executionDurationNote: opts.executionDurationNote ?? null,
    executionStartNote: opts.executionStartNote ?? null,
    consumerContractContext: opts.consumerContractContext ?? null,
    vatBreakdown: buildVatBreakdownFromLines(allMapped),
    totals: {
      totalSellHt: d(version.totalSellHt),
      totalVat: d(version.totalVat),
      totalTtc: d(version.totalTtc),
    },
    sections,
  };
}
