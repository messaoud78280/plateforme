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
  mergeClientCoordsIfEmpty,
} from "@/lib/commercial/import/match-client";
import type { ImportedCustomer } from "@/lib/commercial/import/types";
import type { BeworkQuoteBundleV1 } from "@/lib/commercial/chatgpt-bundle/types";
import {
  buildClientNotesFromBundle,
  buildInternalNotesFromBundle,
  clientDisplayName,
  clientIsExploitable,
  computeBundleTotals,
  mergeNotes,
  primaryEmail,
} from "@/lib/commercial/chatgpt-bundle/notes";
import { mapChantierToProjectStatus } from "@/lib/chantier-lifecycle";
import { ensureChantierFolders } from "@/lib/chantier-dossier/folders";

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
  const display = clientDisplayName(bundle);
  const company = bundle.client.company?.trim() || null;
  const name =
    display !== "Client à préciser"
      ? display
      : company;
  const trade =
    company && name && normSoft(company) !== normSoft(name) ? company : null;
  return {
    name: name || null,
    company: trade,
    addressLine1: bundle.client.address.line1,
    postalCode: bundle.client.address.postalCode,
    city: bundle.client.address.city,
    email,
    phone: bundle.client.phone,
    confidence: clientIsExploitable(bundle) ? "ok" : "warn",
  };
}

function normSoft(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function fixCustomerName(
  customer: ImportedCustomer,
  bundle: BeworkQuoteBundleV1,
): ImportedCustomer {
  return toImportedCustomer(bundle, customer.email);
}

async function resolveClientId(opts: {
  orgId: string;
  bundle: BeworkQuoteBundleV1;
  selection: BundleImportSelection;
}): Promise<string | null> {
  if (!opts.selection.importClient) return null;
  if (opts.selection.clientExternalOrgId) return opts.selection.clientExternalOrgId;

  const customer = fixCustomerName(
    toImportedCustomer(opts.bundle, opts.selection.primaryEmailOverride),
    opts.bundle,
  );
  if (!customer.name) return null;

  const matches = await matchClientsInOrganization(opts.orgId, customer);
  const best = matches[0];
  if (best && best.score >= 70) {
    await mergeClientCoordsIfEmpty(best.id, customer);
    return best.id;
  }

  // Création auto dès qu’un client exploitable est dans le JSON
  if (opts.selection.createClientIfMissing || clientIsExploitable(opts.bundle)) {
    const created = await createCommercialClientFromImport({
      orgId: opts.orgId,
      customer,
    });
    const secondaryEmails = opts.bundle.client.emails
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
    return created.id;
  }
  return null;
}

function siteAddressParts(bundle: BeworkQuoteBundleV1): {
  line1: string | null;
  postalCode: string | null;
  city: string | null;
  label: string | null;
} {
  const addr = bundle.site.sameAsClientAddress
    ? bundle.client.address
    : bundle.site.address ?? bundle.client.address;
  const label =
    [addr.line1, [addr.postalCode, addr.city].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join(", ") || null;
  return {
    line1: addr.line1,
    postalCode: addr.postalCode,
    city: addr.city,
    label,
  };
}

function siteTitle(bundle: BeworkQuoteBundleV1): string | null {
  return (
    bundle.site.name?.trim() ||
    bundle.site.projectType?.trim() ||
    bundle.quote.title?.trim() ||
    null
  );
}

async function resolveProjectId(opts: {
  orgId: string;
  bundle: BeworkQuoteBundleV1;
  selection: BundleImportSelection;
  actorUserId: string;
}): Promise<string | null> {
  if (!opts.selection.importSite) return null;
  if (opts.selection.projectId) return opts.selection.projectId;

  const title = siteTitle(opts.bundle);
  const addr = siteAddressParts(opts.bundle);
  if (!title && !addr.city && !addr.label) return null;

  if (title) {
    const existing = await prisma.project.findFirst({
      where: {
        organizationId: opts.orgId,
        title: { equals: title, mode: "insensitive" },
        ...(addr.city
          ? { siteCity: { equals: addr.city, mode: "insensitive" } }
          : {}),
      },
      select: { id: true },
    });
    if (existing) return existing.id;
  }

  const org = await prisma.organization.findFirst({
    where: { id: opts.orgId },
    select: { ownerUserId: true },
  });
  const clientUserId = org?.ownerUserId ?? opts.actorUserId;
  const projectTitle = title || `Chantier ${addr.city || "import ChatGPT"}`;

  const project = await prisma.project.create({
    data: {
      title: projectTitle,
      clientId: clientUserId,
      organizationId: opts.orgId,
      siteAddress: addr.label,
      siteCity: addr.city,
      chantierStatus: "ETUDE",
      status: mapChantierToProjectStatus("ETUDE"),
      description: "Créé depuis import ChatGPT (bework_quote_bundle_v1).",
    },
    select: { id: true },
  });
  await ensureChantierFolders(project.id).catch(() => null);
  return project.id;
}

function siteAddressLabel(bundle: BeworkQuoteBundleV1): string | null {
  const addr = siteAddressParts(bundle);
  const surface =
    bundle.site.surfaceValue != null
      ? `${bundle.site.surfaceValue} ${bundle.site.surfaceUnit ?? "M²"}`
      : null;
  const type = bundle.site.name || bundle.site.projectType;
  return [type, surface, addr.label].filter(Boolean).join(" — ") || null;
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

  const city = siteAddressParts(bundle).city;
  const siteName = siteTitle(bundle);

  const projectMatches =
    city || siteName
      ? await prisma.project.findMany({
          where: {
            organizationId: opts.orgId,
            OR: [
              ...(city
                ? [{ siteCity: { contains: city, mode: "insensitive" as const } }]
                : []),
              ...(siteName
                ? [{ title: { contains: siteName.slice(0, 40), mode: "insensitive" as const } }]
                : []),
            ],
          },
          select: { id: true, title: true, siteCity: true },
          take: 8,
          orderBy: { updatedAt: "desc" },
        })
      : [];

  // Totaux d’aperçu : TVA JSON si présente, sinon 20 uniquement pour l’estimation visuelle
  const defaultVat = bundle.quote.vatSuggestedRate;
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
        vatRate: item.vatRate ?? defaultVat ?? null,
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
      ...(!bundle.client.emails.length
        ? ["Email du client non renseigné"]
        : []),
      ...(!bundle.client.address.line1
        ? ["Adresse de facturation à compléter"]
        : []),
      ...(!bundle.client.address.postalCode || !bundle.client.address.city
        ? ["Code postal / ville client à compléter"]
        : []),
      ...(!bundle.client.phone ? ["Téléphone du client non renseigné"] : []),
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

  const clientId = await resolveClientId({
    orgId: opts.orgId,
    bundle,
    selection,
  });

  const projectId = await resolveProjectId({
    orgId: opts.orgId,
    bundle,
    selection,
    actorUserId: opts.userId,
  });

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
    ? siteAddressParts(bundle).label
    : undefined;

  const subject =
    bundle.quote.title?.trim() ||
    bundle.site.name?.trim() ||
    quote.subject ||
    "Devis import ChatGPT";

  const customerSnap = toImportedCustomer(bundle, selection.primaryEmailOverride);
  const clientSnapshotJson: Prisma.InputJsonValue | undefined =
    selection.importClient && !clientId && customerSnap.name
      ? {
          name: customerSnap.name,
          tradeName: customerSnap.company,
          email: customerSnap.email,
          phone: customerSnap.phone,
          addressLine1: customerSnap.addressLine1,
          postalCode: customerSnap.postalCode,
          city: customerSnap.city,
          emails: bundle.client.emails,
        }
      : undefined;

  await updateQuoteMeta(opts.orgId, opts.quoteId, {
    subject,
    ...(selection.importClient && clientId
      ? { clientExternalOrgId: clientId }
      : {}),
    ...(selection.importSite && projectId ? { projectId } : {}),
    ...(siteAddr !== undefined ? { siteAddressSnapshot: siteAddr } : {}),
    ...(bundle.quote.validityDays != null
      ? {
          validityDate: new Date(
            Date.now() + bundle.quote.validityDays * 86_400_000,
          ),
        }
      : {}),
    ...(bundle.quote.vatSuggestedRate != null
      ? { defaultVatRate: bundle.quote.vatSuggestedRate }
      : {}),
    clientNotes: mergeNotes(quote.clientNotes, clientNotesParts.join("\n\n")),
    internalNotes: mergeNotes(quote.internalNotes, internalExtra),
  });

  if (clientSnapshotJson) {
    await prisma.commercialQuote.update({
      where: { id: opts.quoteId },
      data: { clientSnapshotJson },
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

    const defaultVat = bundle.quote.vatSuggestedRate;
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
          // Priorité : TVA ligne → TVA devis JSON → 20 uniquement en dernier recours moteur
          vatRate: item.vatRate ?? defaultVat ?? 20,
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
    bundle.site.name?.trim() ||
    bundle.site.projectType?.trim() ||
    "Devis import ChatGPT";

  const validityDate =
    bundle.quote.validityDays != null
      ? new Date(Date.now() + bundle.quote.validityDays * 86_400_000)
      : null;

  const siteAddr = selection.importSite
    ? siteAddressParts(bundle).label
    : null;

  const clientId = await resolveClientId({
    orgId: opts.orgId,
    bundle,
    selection,
  });

  const projectId = await resolveProjectId({
    orgId: opts.orgId,
    bundle,
    selection,
    actorUserId: opts.userId,
  });

  const quote = await createQuote({
    orgId: opts.orgId,
    userId: opts.userId,
    subject,
    clientExternalOrgId: selection.importClient ? clientId : null,
    projectId: selection.importSite ? projectId : null,
    siteAddressSnapshot: siteAddr,
    validityDate,
  });

  if (bundle.quote.vatSuggestedRate != null) {
    await prisma.commercialQuote.update({
      where: { id: quote.id },
      data: { defaultVatRate: bundle.quote.vatSuggestedRate },
    });
  }

  // Sur devis neuf : REPLACE pour retirer la section vide « Ouvrages » par défaut
  const commitSelection: BundleImportSelection = {
    ...selection,
    pricingMode: selection.importPricing ? "REPLACE" : selection.pricingMode,
    clientExternalOrgId: clientId,
    projectId,
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
