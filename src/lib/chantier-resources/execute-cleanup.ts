/**
 * Nettoyage batch ressources chantier (sans session UI) — alias + fiches doublons.
 */

import type { Prisma, PrismaClient, SiteResourceType } from "@prisma/client";
import { Prisma as PrismaNS } from "@prisma/client";
import {
  aliasIdsToRemoveKeepingOnePerNormalized,
  createSiteResourceAliasIfAbsent,
} from "@/lib/chantier-resources/alias-dedup";
import {
  buildDuplicateCleanupPreview,
  resourceToDedupRow,
  type DuplicateCleanupPreview,
  type PriceObservationDraft,
} from "@/lib/chantier-resources/deduplication";
import { buildPriceObservationKey, normalizeResourceLabel } from "@/lib/chantier-resources/normalize-label";
import { suggestTaxonomyFromText } from "@/lib/chantier-resources/taxonomy";

type Db = PrismaClient | Prisma.TransactionClient;

export type AliasDedupeResult = {
  removed: number;
  resourcesAffected: number;
};

export type ResourceCleanupResult = {
  merged: number;
  removed: number;
  pricesAdded: number;
  groups: number;
  classificationFixes: number;
};

export type FullCleanupResult = {
  aliases: AliasDedupeResult;
  resources: ResourceCleanupResult;
};

async function upsertPriceObservationsForResource(
  db: Db,
  siteResourceId: string,
  drafts: PriceObservationDraft[],
) {
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

  await upsertPriceObservationsForResource(tx, targetId, extraPrices);

  await tx.siteResource.update({
    where: { id: sourceId },
    data: { status: "fusionne", mergedIntoId: targetId },
  });
}

export async function dedupeAllResourceAliases(prisma: PrismaClient): Promise<AliasDedupeResult> {
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
  return { removed, resourcesAffected };
}

async function loadResourcesForDedupIndex(prisma: PrismaClient) {
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

async function buildPriceMapForResources(
  prisma: PrismaClient,
  resourceIds: string[],
): Promise<Map<string, PriceObservationDraft[]>> {
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

export async function buildResourceDuplicateCleanupPreview(prisma: PrismaClient): Promise<DuplicateCleanupPreview> {
  const rows = await loadResourcesForDedupIndex(prisma);
  const priceMap = await buildPriceMapForResources(
    prisma,
    rows.map((r) => r.id),
  );
  const preview = buildDuplicateCleanupPreview(rows, priceMap);

  for (const r of rows) {
    const tax = suggestTaxonomyFromText(r.shortName);
    const misclassified =
      r.resourceType !== tax.resourceType ||
      r.family !== tax.family ||
      (tax.subFamily != null && r.subFamily !== tax.subFamily);
    if (misclassified && /attestation|garantie|baignoire|lavabo|beton|laine|parpaing|echafaud|nacelle/.test(normalizeResourceLabel(r.shortName))) {
      preview.classificationFixes.push({
        id: r.id,
        shortName: r.shortName,
        suggestedType: tax.resourceType,
        suggestedFamily: tax.family,
      });
    }
  }

  return preview;
}

export async function applyResourceDuplicateCleanup(
  prisma: PrismaClient,
  preview: DuplicateCleanupPreview,
): Promise<ResourceCleanupResult> {
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
      await upsertPriceObservationsForResource(prisma, g.canonicalId, g.priceObservationsToAdd);
      pricesAdded += g.priceObservationsToAdd.length;
    }
  }

  let classificationFixes = 0;
  for (const fix of preview.classificationFixes) {
    const tax = suggestTaxonomyFromText(fix.shortName);
    await prisma.siteResource.update({
      where: { id: fix.id },
      data: {
        resourceType: tax.resourceType as SiteResourceType,
        family: tax.family,
        subFamily: tax.subFamily,
        normalizedDesignation: normalizeResourceLabel(fix.shortName),
      },
    });
    classificationFixes += 1;
  }

  return {
    merged,
    removed,
    pricesAdded,
    groups: preview.groups.length,
    classificationFixes,
  };
}

/** Alias en double puis fusion des fiches ressources strictement identiques. */
export async function runFullChantierResourceCleanup(prisma: PrismaClient): Promise<FullCleanupResult> {
  const aliases = await dedupeAllResourceAliases(prisma);
  const preview = await buildResourceDuplicateCleanupPreview(prisma);
  const resources = await applyResourceDuplicateCleanup(prisma, preview);
  return { aliases, resources };
}
