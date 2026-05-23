"use server";

import { revalidatePath } from "next/cache";
import type {
  SiteResourceConfidence,
  SiteResourceExtractedFrom,
  SiteResourceGroupingProposalType,
  SiteResourceStatus,
  SiteResourceType,
} from "@prisma/client";
import { Prisma } from "@prisma/client";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { extractCandidatesFromWorkItem } from "@/lib/chantier-resources/extract-from-work-item";
import {
  bucketProposals,
  normalizeAndGroupResources,
  type GroupingProposalDraft,
} from "@/lib/chantier-resources/normalize-and-group";
import {
  buildDuplicateCleanupPreview,
  findMatchingExistingResource,
  resourceToDedupRow,
  type DuplicateCleanupPreview,
  type PriceObservationDraft,
} from "@/lib/chantier-resources/deduplication";
import {
  aliasIdsToRemoveKeepingOnePerNormalized,
  createSiteResourceAliasIfAbsent,
} from "@/lib/chantier-resources/alias-dedup";
import { buildPriceObservationKey, normalizeResourceLabel } from "@/lib/chantier-resources/normalize-label";
import { suggestTaxonomyFromText } from "@/lib/chantier-resources/taxonomy";
import { prisma } from "@/lib/prisma";

const REVALIDATE = ["/dashboard/devis/ressources-chantier", "/dashboard/devis/ressources-chantier/extraction"];

async function loadExistingResourceIndex() {
  const rows = await prisma.siteResource.findMany({
    where: { status: { not: "fusionne" }, mergedIntoId: null },
    select: {
      id: true,
      shortName: true,
      orderUnit: true,
      aliases: { select: { label: true, normalizedLabel: true } },
    },
  });
  return rows;
}

export async function fetchChantierResourcesList(filters?: {
  type?: SiteResourceType;
  family?: string;
  subFamily?: string;
  q?: string;
  status?: SiteResourceStatus;
}) {
  await requireBeWorkDevisSession();
  const q = filters?.q?.trim();
  return prisma.siteResource.findMany({
    where: {
      mergedIntoId: null,
      status: filters?.status ? filters.status : { not: "fusionne" },
      ...(filters?.type ? { resourceType: filters.type } : {}),
      ...(filters?.family ? { family: filters.family } : {}),
      ...(filters?.subFamily ? { subFamily: filters.subFamily } : {}),
      ...(q
        ? {
            OR: [
              { shortName: { contains: q, mode: "insensitive" } },
              { fullDescription: { contains: q, mode: "insensitive" } },
              { aliases: { some: { label: { contains: q, mode: "insensitive" } } } },
            ],
          }
        : {}),
    },
    include: {
      _count: {
        select: { aliases: true, variants: true, workItemLinks: true, priceObservations: true },
      },
      priceObservations: { select: { amountHT: true } },
    },
    orderBy: [{ resourceType: "asc" }, { family: "asc" }, { shortName: "asc" }],
    take: 500,
  }).then((rows) =>
    rows.map((r) => {
      const amounts = r.priceObservations.map((p) => Number(p.amountHT)).filter((n) => n > 0);
      const min = amounts.length ? Math.min(...amounts) : null;
      const max = amounts.length ? Math.max(...amounts) : null;
      const avg = amounts.length ? amounts.reduce((a, b) => a + b, 0) / amounts.length : null;
      const { priceObservations: _po, ...rest } = r;
      return {
        ...rest,
        priceStats: {
          count: r._count.priceObservations,
          min,
          max,
          avg,
        },
      };
    }),
  );
}

export async function fetchChantierResourceDetail(id: string) {
  await requireBeWorkDevisSession();
  return prisma.siteResource.findUnique({
    where: { id },
    include: {
      aliases: { orderBy: { createdAt: "desc" } },
      variants: { orderBy: { updatedAt: "desc" } },
      workItemLinks: {
        include: {
          workItem: { select: { id: true, code: true, title: true, lot: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      mergedInto: { select: { id: true, shortName: true } },
      mergedFrom: {
        where: { status: "fusionne" },
        select: { id: true, shortName: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 20,
      },
      priceObservations: { orderBy: { importedAt: "desc" } },
    },
  });
}

export async function createExtractionPreview(opts?: { workItemLimit?: number; lot?: string }) {
  await requireBeWorkDevisSession();
  const limit = Math.min(opts?.workItemLimit ?? 200, 500);

  const workItems = await prisma.workItem.findMany({
    where: {
      status: { not: "archive" },
      ...(opts?.lot?.trim() ? { lot: { equals: opts.lot.trim(), mode: "insensitive" } } : {}),
    },
    select: {
      id: true,
      code: true,
      title: true,
      unit: true,
      lot: true,
      includedItems: true,
      fullDescription: true,
      shortDescription: true,
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  let existing = await loadExistingResourceIndex();
  const allCandidates: GroupingProposalDraft[] = [];
  const virtualCreated: typeof existing = [];

  for (const wi of workItems) {
    const candidates = extractCandidatesFromWorkItem(wi);
    if (!candidates.length) continue;
    const proposals = normalizeAndGroupResources({
      candidates,
      existingResources: [...existing, ...virtualCreated],
      sourceWorkItemId: wi.id,
    });
    for (const p of proposals) {
      if (p.proposalType === "new_resource" || p.proposalType === "keep_separate") {
        virtualCreated.push({
          id: `virtual-${wi.id}-${p.normalizedSourceLabel}`,
          shortName: p.candidate.suggestedShortName,
          orderUnit: p.candidate.suggestedUnit,
          aliases: [{ label: p.sourceLabel, normalizedLabel: p.normalizedSourceLabel }],
        });
      }
    }
    allCandidates.push(...proposals);
  }

  const run = await prisma.siteResourceExtractionRun.create({
    data: {
      label: `Extraction ${new Date().toLocaleDateString("fr-FR")}`,
      status: "preview",
      workItemCount: workItems.length,
      candidateCount: allCandidates.length,
      proposalCount: allCandidates.length,
      meta: {
        buckets: (() => {
          const b = bucketProposals(allCandidates);
          return {
            newResource: b.newResource.length,
            mergeAsAlias: b.mergeAsAlias.length,
            createVariant: b.createVariant.length,
            toReview: b.toReview.length,
          };
        })(),
      },
    },
  });

  if (allCandidates.length) {
    await prisma.siteResourceGroupingProposal.createMany({
      data: allCandidates.map((p) => ({
        extractionRunId: run.id,
        proposalType: p.proposalType,
        status: "pending",
        similarityScore: p.similarityScore,
        sourceLabel: p.sourceLabel,
        normalizedSourceLabel: p.normalizedSourceLabel,
        targetSiteResourceId: p.targetSiteResourceId,
        sourceWorkItemId: p.sourceWorkItemId,
        sourceField: p.sourceField,
        sourceSnippet: p.sourceSnippet,
        matchReasons: p.matchReasons,
      })),
    });
  }

  revalidatePath("/dashboard/devis/ressources-chantier/extraction");
  return { runId: run.id, proposalCount: allCandidates.length, workItemCount: workItems.length };
}

export async function fetchExtractionRun(runId: string) {
  await requireBeWorkDevisSession();
  return prisma.siteResourceExtractionRun.findUnique({
    where: { id: runId },
    include: {
      proposals: {
        where: { status: "pending" },
        orderBy: [{ similarityScore: "desc" }, { sourceLabel: "asc" }],
        take: 500,
        include: {
          targetSiteResource: { select: { id: true, shortName: true } },
          sourceWorkItem: { select: { id: true, code: true, title: true } },
        },
      },
    },
  });
}

export type PendingProposalFilters = {
  runId?: string;
  proposalType?: SiteResourceGroupingProposalType;
  minScore?: number;
  maxScore?: number;
};

function buildPendingProposalWhere(filters?: PendingProposalFilters): Prisma.SiteResourceGroupingProposalWhereInput {
  const minScore = filters?.minScore;
  const maxScore = filters?.maxScore;
  return {
    status: "pending",
    ...(filters?.runId ? { extractionRunId: filters.runId } : {}),
    ...(filters?.proposalType ? { proposalType: filters.proposalType } : {}),
    ...(minScore != null || maxScore != null
      ? {
          similarityScore: {
            ...(minScore != null ? { gte: minScore } : {}),
            ...(maxScore != null ? { lte: maxScore } : {}),
          },
        }
      : {}),
  };
}

/** Toutes les propositions en attente (tous lots confondus sauf filtre runId). */
export async function fetchPendingGroupingProposals(filters?: PendingProposalFilters) {
  await requireBeWorkDevisSession();
  return prisma.siteResourceGroupingProposal.findMany({
    where: buildPendingProposalWhere(filters),
    orderBy: [{ similarityScore: "desc" }, { sourceLabel: "asc" }],
    take: 500,
    include: {
      targetSiteResource: { select: { id: true, shortName: true } },
      sourceWorkItem: { select: { id: true, code: true, title: true } },
      extractionRun: { select: { id: true, label: true, createdAt: true } },
    },
  });
}

export async function countPendingGroupingProposals(filters?: PendingProposalFilters) {
  await requireBeWorkDevisSession();
  return prisma.siteResourceGroupingProposal.count({
    where: buildPendingProposalWhere(filters),
  });
}

function defaultFullDescription(shortName: string): string {
  return `${shortName}, caractéristiques exactes à vérifier selon fournisseur ou CCTP.`;
}

async function createSiteResourceFromCandidate(
  p: GroupingProposalDraft,
  status: SiteResourceStatus = "a_verifier",
) {
  const tax = p.candidate.taxonomy;
  return prisma.siteResource.create({
    data: {
      shortName: p.candidate.suggestedShortName,
      fullDescription: defaultFullDescription(p.candidate.suggestedShortName),
      resourceType: tax.resourceType,
      family: tax.family,
      subFamily: tax.subFamily,
      orderUnit: p.candidate.suggestedUnit,
      siteUsage: "Usage chantier à préciser selon ouvrages liés.",
      characteristicsToVerify: "Dimensions, norme, conditionnement, fournisseur.",
      confidenceLevel: p.similarityScore >= 90 ? "eleve" : p.similarityScore >= 70 ? "moyen" : "faible",
      status,
      normalizedDesignation: normalizeResourceLabel(p.candidate.suggestedShortName),
      aliases: {
        create: {
          label: p.sourceLabel,
          normalizedLabel: p.normalizedSourceLabel,
          aliasKind: "extraction_ouvrage",
          sourceWorkItemId: p.sourceWorkItemId ?? undefined,
          sourceField: p.sourceField,
          sourceSnippet: p.sourceSnippet,
          confidenceScore: p.similarityScore,
        },
      },
    },
  });
}

async function upsertPriceObservationsForResource(
  siteResourceId: string,
  drafts: PriceObservationDraft[],
  tx?: Prisma.TransactionClient,
) {
  const db = tx ?? prisma;
  for (const o of drafts) {
    await db.siteResourcePriceObservation.upsert({
      where: {
        siteResourceId_observationKey: { siteResourceId, observationKey: o.observationKey },
      },
      create: {
        siteResourceId,
        amountHT: new Prisma.Decimal(o.amountHT),
        orderUnit: o.orderUnit,
        sourceName: o.sourceName,
        sourceWorkItemId: o.sourceWorkItemId,
        notes: o.notes,
        observationKey: o.observationKey,
      },
      update: {},
    });
  }
}

async function syncWorkItemPricesToResource(siteResourceId: string, workItemId: string) {
  const wi = await prisma.workItem.findUnique({
    where: { id: workItemId },
    select: { id: true, code: true, unit: true, priceEntries: { take: 12, orderBy: { dateObserved: "desc" } } },
  });
  if (!wi?.priceEntries.length) return;
  const drafts: PriceObservationDraft[] = [];
  for (const pe of wi.priceEntries) {
    const amount = Number(pe.unitPriceHT);
    if (amount <= 0) continue;
    drafts.push({
      amountHT: amount,
      orderUnit: wi.unit,
      sourceName: pe.sourceName,
      sourceWorkItemId: wi.id,
      notes: `Ouvrage ${wi.code}`,
      observationKey: buildPriceObservationKey(amount, wi.unit, pe.sourceName),
    });
  }
  await upsertPriceObservationsForResource(siteResourceId, drafts);
}

async function linkWorkItemToResource(
  workItemId: string,
  siteResourceId: string,
  p: GroupingProposalDraft,
  extractionRunId?: string,
) {
  const snippet = p.sourceSnippet ?? "";
  await prisma.workItemSiteResource.upsert({
    where: {
      workItemId_siteResourceId_extractedFrom_sourceSnippet: {
        workItemId,
        siteResourceId,
        extractedFrom: p.sourceField,
        sourceSnippet: snippet,
      },
    },
    create: {
      workItemId,
      siteResourceId,
      extractedFrom: p.sourceField,
      sourceSnippet: snippet,
      extractionRunId,
      confidenceScore: p.similarityScore,
      linkRole: "fourniture",
    },
    update: { confidenceScore: p.similarityScore, extractionRunId },
  });
}

export async function approveGroupingProposal(proposalId: string) {
  await requireBeWorkDevisSession();
  const proposal = await prisma.siteResourceGroupingProposal.findUnique({
    where: { id: proposalId },
  });
  if (!proposal || proposal.status !== "pending") {
    return { ok: false as const, error: "Proposition introuvable ou déjà traitée." };
  }

  const draft: GroupingProposalDraft = {
    proposalType: proposal.proposalType,
    similarityScore: proposal.similarityScore,
    sourceLabel: proposal.sourceLabel,
    normalizedSourceLabel: proposal.normalizedSourceLabel,
    targetSiteResourceId: proposal.targetSiteResourceId,
    sourceWorkItemId: proposal.sourceWorkItemId,
    sourceField: proposal.sourceField ?? "includedItems",
    sourceSnippet: proposal.sourceSnippet ?? "",
    matchReasons: Array.isArray(proposal.matchReasons) ? (proposal.matchReasons as string[]) : [],
    candidate: {
      label: proposal.sourceLabel,
      normalizedLabel: proposal.normalizedSourceLabel,
      sourceField: proposal.sourceField ?? "includedItems",
      sourceSnippet: proposal.sourceSnippet ?? "",
      suggestedShortName: proposal.sourceLabel.slice(0, 48),
      suggestedUnit: "u",
      taxonomy: suggestTaxonomyFromText(proposal.sourceLabel),
    },
  };

  let resourceId = proposal.targetSiteResourceId;

  if (proposal.proposalType === "merge_as_alias" && resourceId) {
    await createSiteResourceAliasIfAbsent(prisma, {
      siteResourceId: resourceId,
      label: proposal.sourceLabel,
      normalizedLabel: proposal.normalizedSourceLabel,
      aliasKind: "extraction_ouvrage",
      sourceWorkItemId: proposal.sourceWorkItemId,
      sourceField: proposal.sourceField ?? undefined,
      sourceSnippet: proposal.sourceSnippet ?? undefined,
      confidenceScore: proposal.similarityScore,
    });
  } else if (proposal.proposalType === "create_variant" && resourceId) {
    await prisma.siteResourceVariant.create({
      data: {
        siteResourceId: resourceId,
        shortName: proposal.sourceLabel,
        fullDescription: defaultFullDescription(proposal.sourceLabel),
        distinguishingAttributes: proposal.matchReasons ? JSON.stringify(proposal.matchReasons) : null,
        orderUnit: draft.candidate.suggestedUnit,
        confidenceLevel: proposal.similarityScore >= 80 ? "moyen" : "faible",
        status: "a_verifier",
      },
    });
    await createSiteResourceAliasIfAbsent(prisma, {
      siteResourceId: resourceId,
      label: proposal.sourceLabel,
      normalizedLabel: proposal.normalizedSourceLabel,
      aliasKind: "variante_libelle",
      sourceWorkItemId: proposal.sourceWorkItemId,
      sourceField: proposal.sourceField ?? undefined,
      sourceSnippet: proposal.sourceSnippet ?? undefined,
      confidenceScore: proposal.similarityScore,
    });
  } else if (proposal.proposalType === "new_resource" || proposal.proposalType === "keep_separate") {
    const existingRows = await loadResourcesForDedupIndex();
    const match = findMatchingExistingResource(existingRows, {
      shortName: proposal.sourceLabel,
      resourceType: draft.candidate.taxonomy.resourceType,
      family: draft.candidate.taxonomy.family,
      subFamily: draft.candidate.taxonomy.subFamily,
      orderUnit: draft.candidate.suggestedUnit,
    });
    if (match) {
      resourceId = match.id;
      await createSiteResourceAliasIfAbsent(prisma, {
        siteResourceId: resourceId,
        label: proposal.sourceLabel,
        normalizedLabel: proposal.normalizedSourceLabel,
        aliasKind: "extraction_ouvrage",
        sourceWorkItemId: proposal.sourceWorkItemId,
        sourceField: proposal.sourceField ?? undefined,
        sourceSnippet: proposal.sourceSnippet ?? undefined,
        confidenceScore: proposal.similarityScore,
      });
    } else {
      const created = await createSiteResourceFromCandidate(draft, "a_verifier");
      resourceId = created.id;
      await prisma.siteResourceGroupingProposal.update({
        where: { id: proposalId },
        data: { createdSiteResourceId: created.id },
      });
    }
  }

  if (resourceId && proposal.sourceWorkItemId) {
    await linkWorkItemToResource(proposal.sourceWorkItemId, resourceId, draft, proposal.extractionRunId ?? undefined);
    await syncWorkItemPricesToResource(resourceId, proposal.sourceWorkItemId);
  }

  await prisma.siteResourceGroupingProposal.update({
    where: { id: proposalId },
    data: { status: "approved", reviewedAt: new Date() },
  });

  for (const p of REVALIDATE) revalidatePath(p);
  revalidatePath("/dashboard/devis/ressources-chantier");
  if (resourceId) revalidatePath(`/dashboard/devis/ressources-chantier/${resourceId}`);
  return { ok: true as const, resourceId };
}

export async function rejectGroupingProposal(proposalId: string, note?: string) {
  await requireBeWorkDevisSession();
  const existing = await prisma.siteResourceGroupingProposal.findUnique({
    where: { id: proposalId },
    select: { status: true },
  });
  if (!existing || existing.status !== "pending") {
    return { ok: false as const, error: "Proposition introuvable ou déjà traitée." };
  }
  await prisma.siteResourceGroupingProposal.update({
    where: { id: proposalId },
    data: { status: "rejected", reviewedAt: new Date(), reviewNote: note?.trim() || null },
  });
  for (const p of REVALIDATE) revalidatePath(p);
  revalidatePath("/dashboard/devis/ressources-chantier");
  return { ok: true as const };
}

export type BulkProposalActionResult = {
  ok: number;
  failed: number;
  total: number;
  errors: string[];
};

export async function approveAllMergeAliasProposals(opts?: { runId?: string | null }) {
  await requireBeWorkDevisSession();
  const pending = await prisma.siteResourceGroupingProposal.findMany({
    where: {
      status: "pending",
      proposalType: "merge_as_alias",
      similarityScore: { gte: 90 },
      ...(opts?.runId ? { extractionRunId: opts.runId } : {}),
    },
    select: { id: true },
  });
  if (pending.length === 0) {
    return { ok: 0, failed: 0, total: 0, errors: [], empty: true as const };
  }
  const res = await approveGroupingProposals(pending.map((p) => p.id));
  return { ...res, empty: false as const };
}

/** Valide toutes les propositions en attente avec score ≥ minScore (tous types). */
export async function approveAllHighScorePendingProposals(opts?: { runId?: string | null; minScore?: number }) {
  await requireBeWorkDevisSession();
  const minScore = opts?.minScore ?? 90;
  const pending = await prisma.siteResourceGroupingProposal.findMany({
    where: {
      status: "pending",
      similarityScore: { gte: minScore },
      ...(opts?.runId ? { extractionRunId: opts.runId } : {}),
    },
    select: { id: true },
  });
  if (pending.length === 0) {
    return { ok: 0, failed: 0, total: 0, errors: [], empty: true as const };
  }
  const res = await approveGroupingProposals(pending.map((p) => p.id));
  return { ...res, empty: false as const };
}

export async function approveGroupingProposals(proposalIds: string[]): Promise<BulkProposalActionResult> {
  await requireBeWorkDevisSession();
  const uniqueIds = [...new Set(proposalIds.filter(Boolean))];
  let ok = 0;
  let failed = 0;
  const errors: string[] = [];
  for (const id of uniqueIds) {
    const res = await approveGroupingProposal(id);
    if (res.ok) ok += 1;
    else {
      failed += 1;
      if (res.error) errors.push(res.error);
    }
  }
  for (const p of REVALIDATE) revalidatePath(p);
  revalidatePath("/dashboard/devis/ressources-chantier");
  return { ok, failed, total: uniqueIds.length, errors: errors.slice(0, 8) };
}

export async function rejectGroupingProposals(proposalIds: string[], note?: string): Promise<BulkProposalActionResult> {
  await requireBeWorkDevisSession();
  const uniqueIds = [...new Set(proposalIds.filter(Boolean))];
  let ok = 0;
  let failed = 0;
  const errors: string[] = [];
  for (const id of uniqueIds) {
    try {
      const res = await rejectGroupingProposal(id, note);
      if (res.ok) ok += 1;
      else {
        failed += 1;
        errors.push(`Proposition ${id} : déjà traitée.`);
      }
    } catch (e) {
      failed += 1;
      errors.push(e instanceof Error ? e.message : "Erreur lors du rejet.");
    }
  }
  for (const p of REVALIDATE) revalidatePath(p);
  revalidatePath("/dashboard/devis/ressources-chantier");
  return { ok, failed, total: uniqueIds.length, errors: errors.slice(0, 8) };
}

export async function createManualSiteResource(formData: FormData) {
  await requireBeWorkDevisSession();
  const shortName = String(formData.get("shortName") ?? "").trim();
  const fullDescription = String(formData.get("fullDescription") ?? "").trim();
  const resourceType = String(formData.get("resourceType") ?? "materiaux") as SiteResourceType;
  const family = String(formData.get("family") ?? "divers-materiaux").trim();
  const subFamily = String(formData.get("subFamily") ?? "").trim() || null;
  const orderUnit = String(formData.get("orderUnit") ?? "u").trim();

  if (!shortName || !fullDescription) {
    return { ok: false as const, error: "Nom court et désignation complète requis." };
  }

  const existingRows = await loadResourcesForDedupIndex();
  const match = findMatchingExistingResource(existingRows, {
    shortName,
    resourceType,
    family,
    subFamily,
    orderUnit,
  });
  if (match) {
    return {
      ok: false as const,
      error: `Ressource similaire déjà en bibliothèque : « ${match.shortName} ». Utilisez la fiche existante ou le nettoyage des doublons.`,
      existingId: match.id,
    };
  }

  const created = await prisma.siteResource.create({
    data: {
      shortName,
      fullDescription,
      resourceType,
      family,
      subFamily,
      orderUnit,
      normalizedDesignation: normalizeResourceLabel(shortName),
      status: "brouillon",
      confidenceLevel: "moyen",
      aliases: {
        create: {
          label: shortName,
          normalizedLabel: normalizeResourceLabel(shortName),
          aliasKind: "synonyme",
        },
      },
    },
  });

  revalidatePath("/dashboard/devis/ressources-chantier");
  return { ok: true as const, id: created.id };
}

export async function addAliasToSiteResource(siteResourceId: string, label: string) {
  await requireBeWorkDevisSession();
  const t = label.trim();
  if (!t) return { ok: false as const, error: "Alias vide." };
  const { created } = await createSiteResourceAliasIfAbsent(prisma, {
    siteResourceId,
    label: t,
    aliasKind: "synonyme",
  });
  revalidatePath(`/dashboard/devis/ressources-chantier/${siteResourceId}`);
  if (!created) {
    return { ok: true as const, duplicate: true as const, message: "Cet alias existe déjà sur cette fiche." };
  }
  return { ok: true as const, duplicate: false as const };
}

export async function dedupeAliasesForSiteResource(siteResourceId: string) {
  await requireBeWorkDevisSession();
  const aliases = await prisma.siteResourceAlias.findMany({
    where: { siteResourceId },
    select: {
      id: true,
      normalizedLabel: true,
      label: true,
      createdAt: true,
      confidenceScore: true,
      sourceWorkItemId: true,
    },
  });
  const idsToRemove = aliasIdsToRemoveKeepingOnePerNormalized(aliases);
  if (idsToRemove.length > 0) {
    await prisma.siteResourceAlias.deleteMany({ where: { id: { in: idsToRemove } } });
  }
  revalidatePath(`/dashboard/devis/ressources-chantier/${siteResourceId}`);
  revalidatePath("/dashboard/devis/ressources-chantier");
  return {
    ok: true as const,
    removed: idsToRemove.length,
    remaining: aliases.length - idsToRemove.length,
  };
}

export async function dedupeAllSiteResourceAliases() {
  await requireBeWorkDevisSession();
  const resources = await prisma.siteResource.findMany({
    where: { status: { not: "fusionne" } },
    select: {
      id: true,
      aliases: {
        select: {
          id: true,
          normalizedLabel: true,
          label: true,
          createdAt: true,
          confidenceScore: true,
          sourceWorkItemId: true,
        },
      },
    },
  });
  let removed = 0;
  let resourcesAffected = 0;
  for (const r of resources) {
    const ids = aliasIdsToRemoveKeepingOnePerNormalized(r.aliases);
    if (ids.length === 0) continue;
    await prisma.siteResourceAlias.deleteMany({ where: { id: { in: ids } } });
    removed += ids.length;
    resourcesAffected += 1;
  }
  revalidatePath("/dashboard/devis/ressources-chantier");
  return { ok: true as const, removed, resourcesAffected };
}

async function mergeSiteResourceIntoCanonical(
  tx: Prisma.TransactionClient,
  sourceId: string,
  targetId: string,
  extraPrices: PriceObservationDraft[] = [],
) {
  const aliases = await tx.siteResourceAlias.findMany({ where: { siteResourceId: sourceId } });
  for (const a of aliases) {
    await createSiteResourceAliasIfAbsent(tx, {
      siteResourceId: targetId,
      label: a.label,
      normalizedLabel: a.normalizedLabel,
      aliasKind: a.aliasKind,
      sourceWorkItemId: a.sourceWorkItemId,
      sourceField: a.sourceField,
      sourceSnippet: a.sourceSnippet,
      confidenceScore: a.confidenceScore,
    });
  }

  const sourcePrices = await tx.siteResourcePriceObservation.findMany({ where: { siteResourceId: sourceId } });
  for (const p of sourcePrices) {
    extraPrices.push({
      amountHT: Number(p.amountHT),
      orderUnit: p.orderUnit,
      sourceName: p.sourceName,
      sourceWorkItemId: p.sourceWorkItemId,
      notes: p.notes,
      observationKey: p.observationKey,
    });
  }

  const links = await tx.workItemSiteResource.findMany({
    where: { siteResourceId: sourceId },
    include: { workItem: { include: { priceEntries: { take: 5, orderBy: { dateObserved: "desc" } } } } },
  });
  for (const l of links) {
    await tx.workItemSiteResource.upsert({
      where: {
        workItemId_siteResourceId_extractedFrom_sourceSnippet: {
          workItemId: l.workItemId,
          siteResourceId: targetId,
          extractedFrom: l.extractedFrom,
          sourceSnippet: l.sourceSnippet ?? "",
        },
      },
      create: {
        workItemId: l.workItemId,
        siteResourceId: targetId,
        extractedFrom: l.extractedFrom,
        sourceSnippet: l.sourceSnippet ?? "",
        linkRole: l.linkRole,
        confidenceScore: l.confidenceScore,
      },
      update: {},
    });
    for (const pe of l.workItem.priceEntries) {
      const amount = Number(pe.unitPriceHT);
      if (amount <= 0) continue;
      extraPrices.push({
        amountHT: amount,
        orderUnit: l.workItem.unit,
        sourceName: pe.sourceName,
        sourceWorkItemId: l.workItemId,
        notes: `Importé depuis ouvrage ${l.workItem.code}`,
        observationKey: buildPriceObservationKey(amount, l.workItem.unit, pe.sourceName),
      });
    }
  }

  await upsertPriceObservationsForResource(targetId, extraPrices, tx);

  await tx.siteResource.update({
    where: { id: sourceId },
    data: { status: "fusionne", mergedIntoId: targetId },
  });
}

export async function mergeSiteResources(sourceId: string, targetId: string) {
  await requireBeWorkDevisSession();
  if (sourceId === targetId) return { ok: false as const, error: "Même fiche." };

  await prisma.$transaction(async (tx) => {
    await mergeSiteResourceIntoCanonical(tx, sourceId, targetId, []);
  });

  revalidatePath("/dashboard/devis/ressources-chantier");
  revalidatePath(`/dashboard/devis/ressources-chantier/${targetId}`);
  return { ok: true as const };
}

async function loadResourcesForDedupIndex() {
  const rows = await prisma.siteResource.findMany({
    where: { mergedIntoId: null, status: { not: "fusionne" } },
    include: {
      _count: {
        select: { aliases: true, variants: true, workItemLinks: true, priceObservations: true },
      },
    },
  });
  return rows.map(resourceToDedupRow);
}

async function buildPriceMapForResources(resourceIds: string[]): Promise<Map<string, PriceObservationDraft[]>> {
  const map = new Map<string, PriceObservationDraft[]>();
  if (!resourceIds.length) return map;

  const [observations, links] = await Promise.all([
    prisma.siteResourcePriceObservation.findMany({ where: { siteResourceId: { in: resourceIds } } }),
    prisma.workItemSiteResource.findMany({
      where: { siteResourceId: { in: resourceIds } },
      include: {
        workItem: {
          select: {
            id: true,
            code: true,
            unit: true,
            priceEntries: { take: 8, orderBy: { dateObserved: "desc" } },
          },
        },
      },
    }),
  ]);

  for (const id of resourceIds) map.set(id, []);

  for (const o of observations) {
    const list = map.get(o.siteResourceId) ?? [];
    list.push({
      amountHT: Number(o.amountHT),
      orderUnit: o.orderUnit,
      sourceName: o.sourceName,
      sourceWorkItemId: o.sourceWorkItemId,
      notes: o.notes,
      observationKey: o.observationKey,
    });
    map.set(o.siteResourceId, list);
  }

  for (const l of links) {
    const list = map.get(l.siteResourceId) ?? [];
    for (const pe of l.workItem.priceEntries) {
      const amount = Number(pe.unitPriceHT);
      if (amount <= 0) continue;
      list.push({
        amountHT: amount,
        orderUnit: l.workItem.unit,
        sourceName: pe.sourceName,
        sourceWorkItemId: l.workItem.id,
        notes: `Ouvrage ${l.workItem.code}`,
        observationKey: buildPriceObservationKey(amount, l.workItem.unit, pe.sourceName),
      });
    }
    map.set(l.siteResourceId, list);
  }

  return map;
}

export async function previewDuplicateResourceCleanup(): Promise<DuplicateCleanupPreview> {
  await requireBeWorkDevisSession();
  const rows = await loadResourcesForDedupIndex();
  const priceMap = await buildPriceMapForResources(rows.map((r) => r.id));
  const preview = buildDuplicateCleanupPreview(rows, priceMap);

  const { collectClassificationFixes, loadResourcesForClassification } = await import(
    "@/lib/chantier-resources/classification"
  );
  const classifiable = await loadResourcesForClassification(prisma);
  const fixes = collectClassificationFixes(classifiable);
  preview.classificationFixes = fixes.map((fix) => ({
    id: fix.id,
    shortName: fix.shortName,
    suggestedType: fix.suggestedType,
    suggestedFamily: fix.suggestedFamily,
  }));

  return preview;
}

export type ApplyDuplicateCleanupResult = {
  merged: number;
  removed: number;
  pricesAdded: number;
};

export async function applyDuplicateResourceCleanup(
  preview: DuplicateCleanupPreview,
): Promise<ApplyDuplicateCleanupResult> {
  await requireBeWorkDevisSession();
  let merged = 0;
  let removed = 0;
  let pricesAdded = 0;

  for (const g of preview.groups) {
    const sources = [...new Set([...g.strictDuplicateIds, ...g.mergeWithPriceIds])].filter((id) => id !== g.canonicalId);
    for (const sourceId of sources) {
      await prisma.$transaction(async (tx) => {
        await mergeSiteResourceIntoCanonical(tx, sourceId, g.canonicalId, []);
      });
      merged += 1;
      if (g.strictDuplicateIds.includes(sourceId)) removed += 1;
    }
    if (g.priceObservationsToAdd.length) {
      await upsertPriceObservationsForResource(g.canonicalId, g.priceObservationsToAdd);
      pricesAdded += g.priceObservationsToAdd.length;
    }
  }

  const { collectClassificationFixes, loadResourcesForClassification } = await import(
    "@/lib/chantier-resources/classification"
  );
  const classifiable = await loadResourcesForClassification(prisma);
  const fixes = collectClassificationFixes(classifiable);
  for (const fix of fixes) {
    await prisma.siteResource.update({
      where: { id: fix.id },
      data: {
        resourceType: fix.suggestedType,
        family: fix.suggestedFamily,
        subFamily: fix.suggestedSubFamily,
        normalizedDesignation: normalizeResourceLabel(fix.shortName),
      },
    });
  }

  for (const p of REVALIDATE) revalidatePath(p);
  return { merged, removed, pricesAdded };
}

export async function processLibrarySyncBatchAction(runId?: string | null) {
  await requireBeWorkDevisSession();
  try {
    const { processLibrarySyncBatch } = await import("@/lib/chantier-resources/automated-library-sync");
    const result = await processLibrarySyncBatch(prisma, { runId });
    if (result.done) {
      for (const p of REVALIDATE) revalidatePath(p);
      revalidatePath("/dashboard/devis/ressources-chantier/extraction");
    }
    return { ok: true as const, ...result };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors du traitement du lot.";
    return { ok: false as const, error: message };
  }
}

export async function finalizeLibrarySyncAction(runId: string) {
  await requireBeWorkDevisSession();
  try {
    const { finalizeLibrarySync } = await import("@/lib/chantier-resources/automated-library-sync");
    const result = await finalizeLibrarySync(prisma, runId);
    for (const p of REVALIDATE) revalidatePath(p);
    revalidatePath("/dashboard/devis/ressources-chantier/extraction");
    return { ok: true as const, ...result };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors de la finalisation.";
    return { ok: false as const, error: message };
  }
}

export async function syncLibraryToChantierResources(opts?: { batchSize?: number }) {
  await requireBeWorkDevisSession();
  const { syncLibraryToChantierResourcesCore } = await import("@/lib/chantier-resources/automated-library-sync");
  const result = await syncLibraryToChantierResourcesCore(prisma, opts);
  for (const p of REVALIDATE) revalidatePath(p);
  revalidatePath("/dashboard/devis/ressources-chantier/extraction");
  return { ok: true as const, ...result };
}

export async function fetchLastLibrarySyncRun() {
  await requireBeWorkDevisSession();
  const runs = await prisma.siteResourceExtractionRun.findMany({
    where: { status: "applied" },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return (
    runs.find((r) => {
      const meta = r.meta as { mode?: string } | null;
      return meta?.mode === "automated_library_sync";
    }) ?? null
  );
}

export async function fetchChantierResourceStats() {
  await requireBeWorkDevisSession();
  const [total, pendingProposals, byType] = await Promise.all([
    prisma.siteResource.count({ where: { mergedIntoId: null, status: { not: "fusionne" } } }),
    prisma.siteResourceGroupingProposal.count({ where: { status: "pending" } }),
    prisma.siteResource.groupBy({
      by: ["resourceType"],
      where: { mergedIntoId: null, status: { not: "fusionne" } },
      _count: true,
    }),
  ]);
  return { total, pendingProposals, byType };
}
