/** Application directe d’un regroupement ressource (sans proposition en attente). */

import type { Prisma, PrismaClient, SiteResourceLinkRole, SiteResourceStatus } from "@prisma/client";
import { Prisma as PrismaNS } from "@prisma/client";
import { createSiteResourceAliasIfAbsent } from "@/lib/chantier-resources/alias-dedup";
import { findMatchingExistingResource, resourceToDedupRow, type PriceObservationDraft } from "@/lib/chantier-resources/deduplication";
import type { GroupingProposalDraft } from "@/lib/chantier-resources/normalize-and-group";
import { buildPriceObservationKey, normalizeResourceLabel } from "@/lib/chantier-resources/normalize-label";
import { isPersistedResourceId } from "@/lib/chantier-resources/resource-id";
import type { SiteResourceType } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

async function resolveActiveResourceId(db: Db, id: string | null | undefined): Promise<string | null> {
  if (!isPersistedResourceId(id)) return null;
  const row = await db.siteResource.findFirst({
    where: { id: id!, mergedIntoId: null, status: { not: "fusionne" } },
    select: { id: true },
  });
  return row?.id ?? null;
}

export type ResourceDedupRow = ReturnType<typeof resourceToDedupRow>;

export async function loadResourceDedupRowsForApply(db: PrismaClient): Promise<ResourceDedupRow[]> {
  const rows = await db.siteResource.findMany({
    where: { mergedIntoId: null, status: { not: "fusionne" } },
    include: {
      _count: {
        select: { aliases: true, variants: true, workItemLinks: true, priceObservations: true },
      },
    },
  });
  return rows.map(resourceToDedupRow);
}

function defaultFullDescription(shortName: string): string {
  return `${shortName}, caractéristiques exactes à vérifier selon fournisseur ou CCTP.`;
}

function linkRoleForResourceType(resourceType: SiteResourceType): SiteResourceLinkRole {
  switch (resourceType) {
    case "location_engin":
    case "location_outillage":
      return "location";
    case "consommables":
      return "consommable";
    case "equipements":
      return "equipement";
    case "services":
      return "service";
    default:
      return "fourniture";
  }
}

async function upsertPriceObservationsForResource(db: Db, siteResourceId: string, drafts: PriceObservationDraft[]) {
  for (const o of drafts) {
    await db.siteResourcePriceObservation.upsert({
      where: {
        siteResourceId_observationKey: { siteResourceId, observationKey: o.observationKey },
      },
      create: {
        siteResourceId,
        amountHT: new PrismaNS.Decimal(o.amountHT),
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

export async function syncWorkItemPricesToResource(db: Db, siteResourceId: string, workItemId: string) {
  const wi = await db.workItem.findUnique({
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
  await upsertPriceObservationsForResource(db, siteResourceId, drafts);
}

export async function linkWorkItemToResource(
  db: Db,
  workItemId: string,
  siteResourceId: string,
  p: GroupingProposalDraft,
  extractionRunId?: string,
) {
  const snippet = p.sourceSnippet ?? "";
  const resource = await db.siteResource.findUnique({
    where: { id: siteResourceId },
    select: { resourceType: true },
  });
  const linkRole = resource ? linkRoleForResourceType(resource.resourceType) : "fourniture";

  await db.workItemSiteResource.upsert({
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
      linkRole,
    },
    update: { confidenceScore: p.similarityScore, extractionRunId, linkRole },
  });
}

async function createSiteResourceFromCandidate(db: Db, p: GroupingProposalDraft, status: SiteResourceStatus = "a_verifier") {
  const tax = p.candidate.taxonomy;
  return db.siteResource.create({
    data: {
      shortName: p.candidate.suggestedShortName,
      fullDescription: defaultFullDescription(p.candidate.suggestedShortName),
      resourceType: tax.resourceType,
      family: tax.family,
      subFamily: tax.subFamily,
      orderUnit: p.candidate.suggestedUnit,
      siteUsage: tax.resourceType.startsWith("location_")
        ? "Location chantier — durée et conditions à confirmer au devis."
        : "Usage chantier à préciser selon ouvrages liés.",
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

export type ApplyGroupingDraftResult = {
  resourceId: string | null;
  action: "alias" | "variant" | "created" | "matched" | "skipped";
};

/** Applique un regroupement en base (création, alias, variante, lien ouvrage). */
export async function applyGroupingDraft(
  db: Db,
  p: GroupingProposalDraft,
  extractionRunId?: string,
  opts?: { dedupRows?: ResourceDedupRow[] },
): Promise<ApplyGroupingDraftResult & { dedupRows?: ResourceDedupRow[] }> {
  if (p.proposalType === "ignore") {
    return { resourceId: null, action: "skipped" };
  }

  let proposalType = p.proposalType;
  let resourceId = await resolveActiveResourceId(db, p.targetSiteResourceId);

  if (
    (proposalType === "merge_as_alias" || proposalType === "create_variant") &&
    p.targetSiteResourceId &&
    !resourceId
  ) {
    proposalType = "new_resource";
  }

  if (proposalType === "merge_as_alias" && resourceId) {
    await createSiteResourceAliasIfAbsent(db, {
      siteResourceId: resourceId,
      label: p.sourceLabel,
      normalizedLabel: p.normalizedSourceLabel,
      aliasKind: "extraction_ouvrage",
      sourceWorkItemId: p.sourceWorkItemId,
      sourceField: p.sourceField,
      sourceSnippet: p.sourceSnippet,
      confidenceScore: p.similarityScore,
    });
  } else if (proposalType === "create_variant" && resourceId) {
    const existingVariant = await db.siteResourceVariant.findFirst({
      where: {
        siteResourceId: resourceId,
        shortName: { equals: p.sourceLabel, mode: "insensitive" },
      },
    });
    if (!existingVariant) {
      await db.siteResourceVariant.create({
        data: {
          siteResourceId: resourceId,
          shortName: p.sourceLabel,
          fullDescription: defaultFullDescription(p.sourceLabel),
          distinguishingAttributes: p.matchReasons.length ? JSON.stringify(p.matchReasons) : null,
          orderUnit: p.candidate.suggestedUnit,
          confidenceLevel: p.similarityScore >= 80 ? "moyen" : "faible",
          status: "a_verifier",
        },
      });
    }
    await createSiteResourceAliasIfAbsent(db, {
      siteResourceId: resourceId,
      label: p.sourceLabel,
      normalizedLabel: p.normalizedSourceLabel,
      aliasKind: "variante_libelle",
      sourceWorkItemId: p.sourceWorkItemId,
      sourceField: p.sourceField,
      sourceSnippet: p.sourceSnippet,
      confidenceScore: p.similarityScore,
    });
  } else if (proposalType === "new_resource" || proposalType === "keep_separate") {
    let rows = opts?.dedupRows;
    if (!rows) {
      rows = await loadResourceDedupRowsForApply(db as PrismaClient);
    }
    const match = findMatchingExistingResource(rows, {
      shortName: p.candidate.suggestedShortName,
      resourceType: p.candidate.taxonomy.resourceType,
      family: p.candidate.taxonomy.family,
      subFamily: p.candidate.taxonomy.subFamily,
      orderUnit: p.candidate.suggestedUnit,
    });
    if (match) {
      resourceId = match.id;
      await createSiteResourceAliasIfAbsent(db, {
        siteResourceId: resourceId,
        label: p.sourceLabel,
        normalizedLabel: p.normalizedSourceLabel,
        aliasKind: "extraction_ouvrage",
        sourceWorkItemId: p.sourceWorkItemId,
        sourceField: p.sourceField,
        sourceSnippet: p.sourceSnippet,
        confidenceScore: p.similarityScore,
      });
      if (p.sourceWorkItemId) {
        await linkWorkItemToResource(db, p.sourceWorkItemId, resourceId, p, extractionRunId);
        await syncWorkItemPricesToResource(db, resourceId, p.sourceWorkItemId);
      }
      return { resourceId, action: "matched", dedupRows: rows };
    }
    const created = await createSiteResourceFromCandidate(db, p, "a_verifier");
    resourceId = created.id;
    if (p.sourceWorkItemId) {
      await linkWorkItemToResource(db, p.sourceWorkItemId, resourceId, p, extractionRunId);
      await syncWorkItemPricesToResource(db, resourceId, p.sourceWorkItemId);
    }
    const refreshed = await loadResourceDedupRowsForApply(db as PrismaClient);
    return { resourceId, action: "created", dedupRows: refreshed };
  }

  if (resourceId && p.sourceWorkItemId) {
    await linkWorkItemToResource(db, p.sourceWorkItemId, resourceId, p, extractionRunId);
    await syncWorkItemPricesToResource(db, resourceId, p.sourceWorkItemId);
  }

  return {
    resourceId,
    action:
      proposalType === "merge_as_alias" ? "alias" : proposalType === "create_variant" ? "variant" : "skipped",
  };
}
