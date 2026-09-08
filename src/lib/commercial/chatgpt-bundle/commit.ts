/**
 * Commit d’un bework_quote_bundle_v1 dans un CommercialQuote existant.
 */
import { randomBytes } from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  addSection,
  upsertLine,
  updateQuoteMeta,
} from "@/lib/commercial/quotes";
import {
  createCommercialClientFromImport,
  matchClientsInOrganization,
} from "@/lib/commercial/import/match-client";
import type { ImportedCustomer } from "@/lib/commercial/import/types";
import type { BeworkQuoteBundleV1 } from "@/lib/commercial/chatgpt-bundle/types";
import {
  buildClientNotesFromBundle,
  buildInternalNotesFromBundle,
  clientDisplayName,
  computeBundleTotals,
  mergeNotes,
  primaryEmail,
} from "@/lib/commercial/chatgpt-bundle/notes";

export type BundleImportSelection = {
  importClient: boolean;
  importSite: boolean;
  importPricing: boolean;
  importAdvice: boolean;
  importReservations: boolean;
  importInternalNotes: boolean;
  importWorkStages: boolean;
  importMediaManifest: boolean;
  /** ADD = ajoute sections/lignes ; REPLACE = remplace le chiffrage courant. */
  pricingMode: "ADD" | "REPLACE";
  clientExternalOrgId: string | null;
  createClientIfMissing: boolean;
  primaryEmailOverride: string | null;
  projectId: string | null;
  forceDuplicate: boolean;
};

export type BundleImportPreview = {
  fingerprint: string;
  alreadyImported: boolean;
  clientName: string;
  clientPhone: string | null;
  clientEmails: string[];
  clientAddress: string | null;
  clientMatches: Array<{
    id: string;
    name: string;
    score: number;
    reason: string;
  }>;
  siteLabel: string | null;
  projectMatches: Array<{ id: string; title: string; city: string | null }>;
  lineCount: number;
  sectionCount: number;
  totalHt: number;
  totalVat: number;
  totalTtc: number;
  vatSuggestedRate: number | null;
  vatRequiresConfirmation: boolean;
  adviceCount: number;
  reservationsCount: number;
  internalNotesCount: number;
  workStagesCount: number;
  mediaCount: number;
  warnings: string[];
  sections: Array<{
    title: string;
    lines: Array<{
      designation: string;
      description: string | null;
      quantity: number;
      unit: string;
      unitPriceHt: number;
      vatRate: number | null;
      lineHt: number;
    }>;
  }>;
};

function toImportedCustomer(
  bundle: BeworkQuoteBundleV1,
  primaryOverride: string | null,
): ImportedCustomer {
  const email = primaryOverride ?? primaryEmail(bundle);
  const name = clientDisplayName(bundle);
  return {
    name: name === "Client à préciser" ? null : name,
    addressLine1: bundle.client.address.line1,
    postalCode: bundle.client.address.postalCode,
    city: bundle.client.address.city,
    email,
    phone: bundle.client.phone,
    confidence: name !== "Client à préciser" ? "ok" : "warn",
  };
}

function siteAddressLabel(bundle: BeworkQuoteBundleV1): string | null {
  const addr = bundle.site.sameAsClientAddress
    ? bundle.client.address
    : bundle.site.address ?? bundle.client.address;
  const parts = [
    addr.line1,
    [addr.postalCode, addr.city].filter(Boolean).join(" "),
  ].filter(Boolean);
  const base = parts.join(", ") || null;
  const surface =
    bundle.site.surfaceValue != null
      ? `${bundle.site.surfaceValue} ${bundle.site.surfaceUnit ?? "M²"}`
      : null;
  const type = bundle.site.projectType;
  return [type, surface, base].filter(Boolean).join(" — ") || null;
}

export async function buildBundleImportPreview(opts: {
  orgId: string;
  /** Absent = dry-run avant création d’un nouveau devis. */
  quoteId?: string | null;
  bundle: BeworkQuoteBundleV1;
  fingerprint: string;
  parseWarnings: string[];
}): Promise<BundleImportPreview> {
  const { bundle, fingerprint } = opts;
  const customer = toImportedCustomer(bundle, null);
  const matches = await matchClientsInOrganization(opts.orgId, customer);

  let alreadyImported = false;
  if (opts.quoteId) {
    const quote = await prisma.commercialQuote.findFirst({
      where: { id: opts.quoteId, organizationId: opts.orgId },
      select: { internalNotes: true },
    });
    alreadyImported = Boolean(
      quote?.internalNotes?.includes(`chatgptBundleHash:${fingerprint}`),
    );
  }

  const city = bundle.site.sameAsClientAddress
    ? bundle.client.address.city
    : bundle.site.address?.city ?? bundle.client.address.city;

  const projectMatches = city
    ? await prisma.project.findMany({
        where: {
          organizationId: opts.orgId,
          OR: [
            { siteCity: { contains: city, mode: "insensitive" } },
            { title: { contains: city, mode: "insensitive" } },
          ],
        },
        select: { id: true, title: true, siteCity: true },
        take: 8,
        orderBy: { updatedAt: "desc" },
      })
    : [];

  const defaultVat = bundle.quote.vatSuggestedRate ?? 20;
  const totals = computeBundleTotals(bundle);
  const sections = bundle.sections.map((sec) => ({
    title: sec.title,
    lines: sec.items.map((item) => {
      const qty = item.quantity;
      const pu = item.unitPriceHt;
      const disc = item.discountPercent ?? 0;
      const lineHt = Math.round(qty * pu * (1 - disc / 100) * 100) / 100;
      return {
        designation: item.designation,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPriceHt: item.unitPriceHt,
        vatRate: item.vatRate ?? defaultVat,
        lineHt,
      };
    }),
  }));

  return {
    fingerprint,
    alreadyImported,
    clientName: clientDisplayName(bundle),
    clientPhone: bundle.client.phone,
    clientEmails: bundle.client.emails.map((e) => e.email),
    clientAddress: [
      bundle.client.address.line1,
      [bundle.client.address.postalCode, bundle.client.address.city]
        .filter(Boolean)
        .join(" "),
    ]
      .filter(Boolean)
      .join(", ") || null,
    clientMatches: matches.map((m) => ({
      id: m.id,
      name: m.name,
      score: m.score,
      reason: m.reason,
    })),
    siteLabel: siteAddressLabel(bundle),
    projectMatches: projectMatches.map((p) => ({
      id: p.id,
      title: p.title,
      city: p.siteCity,
    })),
    lineCount: totals.lineCount,
    sectionCount: bundle.sections.length,
    totalHt: totals.totalHt,
    totalVat: totals.totalVat,
    totalTtc: totals.totalTtc,
    vatSuggestedRate: bundle.quote.vatSuggestedRate,
    vatRequiresConfirmation: bundle.quote.vatRequiresConfirmation,
    adviceCount: bundle.clientAdvice.filter((b) => b.visibility === "client").length,
    reservationsCount: bundle.reservations.filter((b) => b.visibility === "client")
      .length,
    internalNotesCount: bundle.internalNotes.length + bundle.warnings.length,
    workStagesCount: bundle.workStages.length,
    mediaCount: bundle.mediaManifest.length,
    warnings: [
      ...opts.parseWarnings,
      ...(bundle.quote.vatRequiresConfirmation && bundle.quote.vatSuggestedRate != null
        ? [`TVA proposée : ${bundle.quote.vatSuggestedRate} % — à confirmer`]
        : []),
      ...bundle.warnings.map((w) => `⚠ ${w}`),
    ],
    sections,
  };
}

export async function commitBundleIntoQuote(opts: {
  orgId: string;
  userId: string;
  quoteId: string;
  bundle: BeworkQuoteBundleV1;
  fingerprint: string;
  selection: BundleImportSelection;
}): Promise<{
  ok: true;
  batchId: string;
  createdLineIds: string[];
  createdSectionIds: string[];
  href: string;
}> {
  const { bundle, selection, fingerprint } = opts;

  const quote = await prisma.commercialQuote.findFirst({
    where: { id: opts.quoteId, organizationId: opts.orgId },
    select: {
      id: true,
      internalNotes: true,
      clientNotes: true,
      subject: true,
      defaultVatRate: true,
      currentVersionId: true,
    },
  });
  if (!quote) throw new Error("Devis introuvable");

  if (
    !selection.forceDuplicate &&
    quote.internalNotes?.includes(`chatgptBundleHash:${fingerprint}`)
  ) {
    throw new Error(
      "Ce dossier semble avoir déjà été importé. Confirmez « Importer quand même » si besoin.",
    );
  }

  const batchId = randomBytes(8).toString("hex");
  const createdLineIds: string[] = [];
  const createdSectionIds: string[] = [];

  let clientId = selection.clientExternalOrgId;
  if (selection.importClient) {
    if (!clientId && selection.createClientIfMissing) {
      const customer = toImportedCustomer(bundle, selection.primaryEmailOverride);
      if (customer.name) {
        const secondaryEmails = bundle.client.emails
          .map((e) => e.email)
          .filter((e) => e && e !== customer.email);
        const created = await createCommercialClientFromImport({
          orgId: opts.orgId,
          customer,
        });
        clientId = created.id;
        if (secondaryEmails.length) {
          await prisma.externalOrganization.update({
            where: { id: created.id },
            data: {
              notes: [
                "Emails complémentaires (import ChatGPT) :",
                ...secondaryEmails,
              ].join("\n"),
            },
          });
        }
      }
    }
  }

  const clientNotesParts: string[] = [];
  if (selection.importAdvice || selection.importReservations || selection.importWorkStages) {
    const filtered: BeworkQuoteBundleV1 = {
      ...bundle,
      clientAdvice: selection.importAdvice ? bundle.clientAdvice : [],
      reservations: selection.importReservations ? bundle.reservations : [],
      workStages: selection.importWorkStages ? bundle.workStages : [],
      quote: {
        ...bundle.quote,
        description: selection.importAdvice ? bundle.quote.description : null,
      },
    };
    clientNotesParts.push(buildClientNotesFromBundle(filtered));
  }

  let internalExtra = "";
  if (selection.importInternalNotes || selection.importMediaManifest) {
    const filtered: BeworkQuoteBundleV1 = {
      ...bundle,
      internalNotes: selection.importInternalNotes ? bundle.internalNotes : [],
      warnings: selection.importInternalNotes ? bundle.warnings : [],
      mediaManifest: selection.importMediaManifest ? bundle.mediaManifest : [],
    };
    internalExtra = buildInternalNotesFromBundle(filtered, fingerprint, batchId);
  } else {
    internalExtra = [
      `Import ChatGPT (${bundle.format})`,
      `chatgptBundleHash:${fingerprint}`,
      `chatgptImportBatch:${batchId}`,
    ].join("\n");
  }

  const siteAddr = selection.importSite
    ? (() => {
        const addr = bundle.site.sameAsClientAddress
          ? bundle.client.address
          : bundle.site.address ?? bundle.client.address;
        return (
          [addr.line1, [addr.postalCode, addr.city].filter(Boolean).join(" ")]
            .filter(Boolean)
            .join(", ") || null
        );
      })()
    : undefined;

  const subject =
    bundle.quote.title?.trim() || quote.subject;

  const clientSnapshotJson: Prisma.InputJsonValue | undefined =
    selection.importClient && !clientId
      ? {
          name: clientDisplayName(bundle),
          email: selection.primaryEmailOverride ?? primaryEmail(bundle),
          phone: bundle.client.phone,
          addressLine1: bundle.client.address.line1,
          postalCode: bundle.client.address.postalCode,
          city: bundle.client.address.city,
          emails: bundle.client.emails,
        }
      : undefined;

  await updateQuoteMeta(opts.orgId, opts.quoteId, {
    subject,
    ...(selection.importClient && clientId
      ? { clientExternalOrgId: clientId }
      : {}),
    ...(selection.importSite && selection.projectId
      ? { projectId: selection.projectId }
      : {}),
    ...(siteAddr !== undefined ? { siteAddressSnapshot: siteAddr } : {}),
    ...(bundle.quote.validityDays != null
      ? {
          validityDate: new Date(
            Date.now() + bundle.quote.validityDays * 86_400_000,
          ),
        }
      : {}),
    clientNotes: mergeNotes(quote.clientNotes, clientNotesParts.join("\n\n")),
    internalNotes: mergeNotes(quote.internalNotes, internalExtra),
  });

  if (bundle.quote.vatSuggestedRate != null || clientSnapshotJson) {
    await prisma.commercialQuote.update({
      where: { id: opts.quoteId },
      data: {
        ...(bundle.quote.vatSuggestedRate != null
          ? { defaultVatRate: bundle.quote.vatSuggestedRate }
          : {}),
        ...(clientSnapshotJson && !clientId
          ? { clientSnapshotJson }
          : {}),
      },
    });
  }
  if (selection.importPricing) {
    if (selection.pricingMode === "REPLACE" && quote.currentVersionId) {
      await prisma.commercialQuoteLine.deleteMany({
        where: { versionId: quote.currentVersionId },
      });
      await prisma.commercialQuoteSection.deleteMany({
        where: { versionId: quote.currentVersionId },
      });
    }

    const defaultVat = bundle.quote.vatSuggestedRate ?? 20;
    for (const sec of bundle.sections) {
      if (!sec.items.length) continue;
      const section = await addSection(opts.orgId, opts.quoteId, sec.title);
      createdSectionIds.push(section.id);
      for (const item of sec.items) {
        const line = await upsertLine(opts.orgId, opts.quoteId, {
          sectionId: section.id,
          kind: "WORK",
          designation: item.designation,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitSellHt: item.unitPriceHt,
          discountPercent: item.discountPercent ?? 0,
          vatRate: item.vatRate ?? defaultVat,
        });
        createdLineIds.push(line.id);
      }
    }

    // Marqueur d’annulation
    const undoPayload = JSON.stringify({
      batchId,
      lineIds: createdLineIds,
      sectionIds: createdSectionIds,
    });
    const q2 = await prisma.commercialQuote.findUnique({
      where: { id: opts.quoteId },
      select: { internalNotes: true },
    });
    await prisma.commercialQuote.update({
      where: { id: opts.quoteId },
      data: {
        internalNotes: mergeNotes(
          q2?.internalNotes,
          `<!--chatgpt_import_undo-->${undoPayload}<!--/chatgpt_import_undo-->`,
        ),
      },
    });
  }

  return {
    ok: true,
    batchId,
    createdLineIds,
    createdSectionIds,
    href: `/dashboard/devis-facturation/devis/${opts.quoteId}`,
  };
}

/**
 * Nouveau devis depuis un bundle : createQuote (moteur existant) puis commitBundleIntoQuote.
 */
export async function createQuoteFromChatgptBundle(opts: {
  orgId: string;
  userId: string;
  bundle: BeworkQuoteBundleV1;
  fingerprint: string;
  selection: BundleImportSelection;
}): Promise<{
  ok: true;
  quoteId: string;
  quoteNumber: string;
  batchId: string;
  createdLineIds: string[];
  createdSectionIds: string[];
  href: string;
}> {
  const { createQuote } = await import("@/lib/commercial/quotes");
  const { bundle, selection } = opts;

  const subject =
    bundle.quote.title?.trim() ||
    bundle.site.projectType?.trim() ||
    "Devis import ChatGPT";

  const validityDate =
    bundle.quote.validityDays != null
      ? new Date(Date.now() + bundle.quote.validityDays * 86_400_000)
      : null;

  const siteAddr = selection.importSite
    ? (() => {
        const addr = bundle.site.sameAsClientAddress
          ? bundle.client.address
          : bundle.site.address ?? bundle.client.address;
        return (
          [addr.line1, [addr.postalCode, addr.city].filter(Boolean).join(" ")]
            .filter(Boolean)
            .join(", ") || null
        );
      })()
    : null;

  // Client résolu avant create pour éviter un devis orphelin puis rattachement flou
  let clientId = selection.clientExternalOrgId;
  if (selection.importClient && !clientId && selection.createClientIfMissing) {
    const customer = toImportedCustomer(bundle, selection.primaryEmailOverride);
    if (customer.name) {
      const created = await createCommercialClientFromImport({
        orgId: opts.orgId,
        customer,
      });
      clientId = created.id;
      const secondaryEmails = bundle.client.emails
        .map((e) => e.email)
        .filter((e) => e && e !== customer.email);
      if (secondaryEmails.length) {
        await prisma.externalOrganization.update({
          where: { id: created.id },
          data: {
            notes: [
              "Emails complémentaires (import ChatGPT) :",
              ...secondaryEmails,
            ].join("\n"),
          },
        });
      }
    }
  }

  const quote = await createQuote({
    orgId: opts.orgId,
    userId: opts.userId,
    subject,
    clientExternalOrgId: selection.importClient ? clientId : null,
    projectId: selection.importSite ? selection.projectId : null,
    siteAddressSnapshot: siteAddr,
    validityDate,
  });

  // Sur devis neuf : REPLACE pour retirer la section vide « Ouvrages » par défaut
  const commitSelection: BundleImportSelection = {
    ...selection,
    pricingMode: selection.importPricing ? "REPLACE" : selection.pricingMode,
    // Client déjà créé / rattaché
    clientExternalOrgId: clientId,
    createClientIfMissing: false,
    forceDuplicate: true,
  };

  const committed = await commitBundleIntoQuote({
    orgId: opts.orgId,
    userId: opts.userId,
    quoteId: quote.id,
    bundle,
    fingerprint: opts.fingerprint,
    selection: commitSelection,
  });

  return {
    ok: true,
    quoteId: quote.id,
    quoteNumber: quote.number,
    batchId: committed.batchId,
    createdLineIds: committed.createdLineIds,
    createdSectionIds: committed.createdSectionIds,
    href: committed.href,
  };
}

export async function undoLastChatgptImport(opts: {
  orgId: string;
  quoteId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { recomputeAndSaveVersionTotals } = await import("@/lib/commercial/quotes");
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: opts.quoteId, organizationId: opts.orgId },
    select: { id: true, internalNotes: true, currentVersionId: true },
  });
  if (!quote?.internalNotes) {
    return { ok: false, error: "Aucun import ChatGPT à annuler." };
  }
  const m = quote.internalNotes.match(
    /<!--chatgpt_import_undo-->([\s\S]*?)<!--\/chatgpt_import_undo-->/,
  );
  if (!m?.[1]) {
    return { ok: false, error: "Aucun import ChatGPT récent à annuler." };
  }
  let payload: { lineIds?: string[]; sectionIds?: string[] };
  try {
    payload = JSON.parse(m[1]) as { lineIds?: string[]; sectionIds?: string[] };
  } catch {
    return { ok: false, error: "Marqueur d’annulation illisible." };
  }

  const lineIds = payload.lineIds ?? [];
  const sectionIds = payload.sectionIds ?? [];
  if (lineIds.length) {
    await prisma.commercialQuoteLine.deleteMany({
      where: { id: { in: lineIds }, organizationId: opts.orgId },
    });
  }
  if (sectionIds.length) {
    await prisma.commercialQuoteSection.deleteMany({
      where: { id: { in: sectionIds }, organizationId: opts.orgId },
    });
  }

  if (quote.currentVersionId) {
    await recomputeAndSaveVersionTotals(opts.orgId, quote.currentVersionId);
  }

  const cleaned = quote.internalNotes
    .replace(/<!--chatgpt_import_undo-->[\s\S]*?<!--\/chatgpt_import_undo-->/g, "")
    .trim();
  await prisma.commercialQuote.update({
    where: { id: opts.quoteId },
    data: { internalNotes: cleaned || null },
  });

  return { ok: true };
}
