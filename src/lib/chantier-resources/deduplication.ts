/**
 * Déduplication ressources chantier — dry-run et fusion sécurisée.
 */

import type { SiteResource, SiteResourceConfidence, SiteResourceStatus, SiteResourceType } from "@prisma/client";
import { scoreSimilarity } from "@/lib/chantier-resources/similarity";
import {
  buildPriceObservationKey,
  buildResourceGroupingKey,
  buildResourceStrictFingerprint,
  normalizeResourceLabel,
} from "@/lib/chantier-resources/normalize-label";

export type ResourceRowForDedup = {
  id: string;
  shortName: string;
  fullDescription: string;
  resourceType: SiteResourceType;
  family: string;
  subFamily: string | null;
  orderUnit: string;
  status: SiteResourceStatus;
  confidenceLevel: SiteResourceConfidence;
  mainCharacteristics: string | null;
  siteUsage: string | null;
  businessNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  aliasCount: number;
  variantCount: number;
  workItemLinkCount: number;
  priceObservationCount: number;
};

export type PriceObservationDraft = {
  amountHT: number;
  orderUnit: string;
  sourceName: string | null;
  sourceWorkItemId: string | null;
  notes: string | null;
  observationKey: string;
};

export type MergeGroupPlan = {
  groupingKey: string;
  canonicalId: string;
  canonicalShortName: string;
  memberIds: string[];
  strictDuplicateIds: string[];
  mergeWithPriceIds: string[];
  priceObservationsToAdd: PriceObservationDraft[];
  sourcesToPreserve: string[];
  workItemIdsToPreserve: string[];
};

export type DuplicateCleanupPreview = {
  totalAnalyzed: number;
  strictDuplicateGroups: number;
  strictDuplicatesRemovable: number;
  groupingMergeGroups: number;
  resourcesAfterGrouping: number;
  pricesToPreserve: number;
  sourcesPreserved: number;
  workItemLinksPreserved: number;
  groups: MergeGroupPlan[];
  classificationFixes: { id: string; shortName: string; suggestedType: string; suggestedFamily: string }[];
};

const CONFIDENCE_RANK: Record<SiteResourceConfidence, number> = {
  faible: 0,
  moyen: 1,
  eleve: 2,
};

const STATUS_RANK: Record<SiteResourceStatus, number> = {
  fusionne: -1,
  archive: 0,
  brouillon: 1,
  a_verifier: 2,
  valide: 3,
};

export function scoreCanonicalCandidate(r: ResourceRowForDedup): number {
  let score = 0;
  score += STATUS_RANK[r.status] * 100;
  score += CONFIDENCE_RANK[r.confidenceLevel] * 20;
  score += r.aliasCount * 3;
  score += r.workItemLinkCount * 2;
  score += r.priceObservationCount * 5;
  score += r.variantCount;
  score += Math.min(r.shortName.length, 80);
  score += r.updatedAt.getTime() / 1_000_000_000_000;
  return score;
}

export function pickCanonicalResource(members: ResourceRowForDedup[]): ResourceRowForDedup {
  return [...members].sort((a, b) => scoreCanonicalCandidate(b) - scoreCanonicalCandidate(a))[0]!;
}

export function canMergeByGrouping(members: ResourceRowForDedup[]): boolean {
  if (members.length < 2) return false;
  const canonical = members[0]!;
  for (let i = 1; i < members.length; i++) {
    const other = members[i]!;
    const sim = scoreSimilarity(canonical.shortName, other.shortName, {
      unitA: canonical.orderUnit,
      unitB: other.orderUnit,
    });
    if (sim.blocker) return false;
    if (sim.score < 85 && canonical.shortName !== other.shortName) return false;
  }
  return true;
}

export function buildDuplicateCleanupPreview(
  rows: ResourceRowForDedup[],
  priceMap: Map<string, PriceObservationDraft[]>,
): DuplicateCleanupPreview {
  const byGrouping = new Map<string, ResourceRowForDedup[]>();
  const byStrict = new Map<string, ResourceRowForDedup[]>();

  for (const r of rows) {
    const gk = buildResourceGroupingKey(r);
    const listG = byGrouping.get(gk) ?? [];
    listG.push(r);
    byGrouping.set(gk, listG);

    const sk = buildResourceStrictFingerprint(r);
    const listS = byStrict.get(sk) ?? [];
    listS.push(r);
    byStrict.set(sk, listS);
  }

  const groups: MergeGroupPlan[] = [];
  let strictDuplicatesRemovable = 0;
  let strictDuplicateGroups = 0;
  let groupingMergeGroups = 0;
  let pricesToPreserve = 0;
  const sourcesPreserved = new Set<string>();
  const workItemIds = new Set<string>();

  for (const [groupingKey, members] of byGrouping) {
    if (members.length < 2) continue;
    if (!canMergeByGrouping(members)) continue;

    const canonical = pickCanonicalResource(members);
    const strictDup: string[] = [];
    const mergeWithPrice: string[] = [];

    for (const m of members) {
      if (m.id === canonical.id) continue;
      const strictKey = buildResourceStrictFingerprint(m);
      const canonicalStrict = buildResourceStrictFingerprint(canonical);
      if (strictKey === canonicalStrict) {
        strictDup.push(m.id);
      } else {
        mergeWithPrice.push(m.id);
      }
    }

    if (strictDup.length === 0 && mergeWithPrice.length === 0) continue;

    groupingMergeGroups += 1;
    if (strictDup.length > 0) {
      strictDuplicateGroups += 1;
      strictDuplicatesRemovable += strictDup.length;
    }

    const priceObservationsToAdd: PriceObservationDraft[] = [];
    const groupSources = new Set<string>();
    const groupWorkItems = new Set<string>();
    for (const mid of [canonical.id, ...strictDup, ...mergeWithPrice]) {
      const obs = priceMap.get(mid) ?? [];
      for (const o of obs) {
        const exists = priceObservationsToAdd.some((x) => x.observationKey === o.observationKey);
        if (!exists) {
          priceObservationsToAdd.push(o);
          pricesToPreserve += 1;
          if (o.sourceName) {
            groupSources.add(o.sourceName);
            sourcesPreserved.add(o.sourceName);
          }
          if (o.sourceWorkItemId) {
            groupWorkItems.add(o.sourceWorkItemId);
            workItemIds.add(o.sourceWorkItemId);
          }
        }
      }
    }

    groups.push({
      groupingKey,
      canonicalId: canonical.id,
      canonicalShortName: canonical.shortName,
      memberIds: members.map((m) => m.id),
      strictDuplicateIds: strictDup,
      mergeWithPriceIds: mergeWithPrice,
      priceObservationsToAdd,
      sourcesToPreserve: [...groupSources],
      workItemIdsToPreserve: [...groupWorkItems],
    });
  }

  return {
    totalAnalyzed: rows.length,
    strictDuplicateGroups,
    strictDuplicatesRemovable,
    groupingMergeGroups,
    resourcesAfterGrouping: rows.length - strictDuplicatesRemovable,
    pricesToPreserve,
    sourcesPreserved: sourcesPreserved.size,
    workItemLinksPreserved: workItemIds.size,
    groups,
    classificationFixes: [],
  };
}

export function resourceToDedupRow(
  r: SiteResource & {
    _count?: { aliases: number; variants: number; workItemLinks: number; priceObservations?: number };
  },
): ResourceRowForDedup {
  return {
    id: r.id,
    shortName: r.shortName,
    fullDescription: r.fullDescription,
    resourceType: r.resourceType,
    family: r.family,
    subFamily: r.subFamily,
    orderUnit: r.orderUnit,
    status: r.status,
    confidenceLevel: r.confidenceLevel,
    mainCharacteristics: r.mainCharacteristics,
    siteUsage: r.siteUsage,
    businessNotes: r.businessNotes,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    aliasCount: r._count?.aliases ?? 0,
    variantCount: r._count?.variants ?? 0,
    workItemLinkCount: r._count?.workItemLinks ?? 0,
    priceObservationCount: r._count?.priceObservations ?? 0,
  };
}

/** Trouve une ressource existante pour éviter recréation à l'extraction. */
export function findMatchingExistingResource(
  existing: ResourceRowForDedup[],
  candidate: {
    shortName: string;
    resourceType: SiteResourceType;
    family: string;
    subFamily?: string | null;
    orderUnit?: string | null;
  },
): ResourceRowForDedup | null {
  const gk = buildResourceGroupingKey({
    shortName: candidate.shortName,
    resourceType: candidate.resourceType,
    family: candidate.family,
    subFamily: candidate.subFamily,
    orderUnit: candidate.orderUnit,
  });

  const sameGroup = existing.filter(
    (e) =>
      buildResourceGroupingKey(e) === gk ||
      normalizeResourceLabel(e.shortName) === normalizeResourceLabel(candidate.shortName),
  );

  if (!sameGroup.length) return null;

  for (const e of sameGroup) {
    const sim = scoreSimilarity(candidate.shortName, e.shortName, {
      unitA: candidate.orderUnit,
      unitB: e.orderUnit,
    });
    if (!sim.blocker && sim.score >= 85) return e;
  }

  return sameGroup[0] ?? null;
}
