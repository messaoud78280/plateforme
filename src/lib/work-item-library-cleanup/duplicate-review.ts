import { normalizeUnit } from "@/lib/be-work-devis-units";
import {
  analyzeWorkItemDuplicates,
  normalizeWorkItemDesignation,
  workItemDesignationForMerge,
  type DuplicateCluster,
  type WorkItemForDuplicateScan,
} from "@/lib/work-item-merge";
import { areFamilyCodesCompatible } from "@/lib/work-item-library-cleanup/classification";
import { pickCanonicalWorkItemWithPrices } from "@/lib/work-item-library-cleanup/pick-canonical-with-prices";
import {
  buildPriceStatsMap,
  type WorkItemPriceStats,
} from "@/lib/work-item-library-cleanup/price-stats";

export type DuplicateReviewMember = WorkItemForDuplicateScan & {
  code: string;
  familyCode?: string | null;
  designation: string;
  priceStats: WorkItemPriceStats;
};

export type DuplicateReviewGroup = {
  groupKey: string;
  normalizedKey: string;
  members: DuplicateReviewMember[];
  recommendedCanonicalId: string;
  recommendedCanonical: DuplicateReviewMember;
  mergeMode: DuplicateCluster["mergeMode"];
  maxSimilarity: number;
  matchReasons: string[];
  /** Fusion auto autorisée uniquement si unité identique + confiance haute. */
  autoMergeAllowed: boolean;
  autoMergeBlockReason?: string;
  unitsMatch: boolean;
  familiesCompatible: boolean;
};

function unitsAreEquivalent(a: string, b: string): boolean {
  const na = normalizeUnit(a) ?? a.trim().toLowerCase();
  const nb = normalizeUnit(b) ?? b.trim().toLowerCase();
  return na === nb;
}

function groupUnitsMatch(members: WorkItemForDuplicateScan[]): boolean {
  if (members.length < 2) return true;
  const u0 = members[0]!.unit;
  return members.every((m) => unitsAreEquivalent(m.unit, u0));
}

function groupFamiliesCompatible(members: (WorkItemForDuplicateScan & { familyCode?: string | null })[]): boolean {
  const codes = [...new Set(members.map((m) => m.familyCode?.trim().toUpperCase()).filter(Boolean))];
  if (codes.length <= 1) return true;
  const first = codes[0];
  return codes.every((c) => areFamilyCodesCompatible(first, c));
}

export function buildDuplicateReviewGroups(
  items: (WorkItemForDuplicateScan & { code: string; familyCode?: string | null })[],
  priceEntries: { workItemId: string; unitPriceHT: { toString(): string } | number }[],
): DuplicateReviewGroup[] {
  const priceStats = buildPriceStatsMap(priceEntries);
  const analysis = analyzeWorkItemDuplicates(items);
  const allClusters = [...analysis.autoMergeGroups, ...analysis.reviewGroups];

  const groups: DuplicateReviewGroup[] = [];

  for (const cluster of allClusters) {
    const unitsMatch = groupUnitsMatch(cluster.members);
    const familiesCompatible = groupFamiliesCompatible(cluster.members as (WorkItemForDuplicateScan & { familyCode?: string | null })[]);

    const enrichedMembers: DuplicateReviewMember[] = cluster.members.map((m) => ({
      ...m,
      designation: workItemDesignationForMerge(m),
      priceStats: priceStats.get(m.id) ?? {
        workItemId: m.id,
        priceCount: 0,
        minHt: null,
        maxHt: null,
        avgHt: null,
        referenceHt: null,
      },
    }));

    const recommended = pickCanonicalWorkItemWithPrices(enrichedMembers, priceStats);

    let autoMergeAllowed = false;
    let autoMergeBlockReason: string | undefined;

    const sameNormalized =
      new Set(cluster.members.map((m) => m.normalizedDesignation ?? normalizeWorkItemDesignation(workItemDesignationForMerge(m))))
        .size === 1;

    if (!unitsMatch) {
      autoMergeBlockReason = "Unités différentes — validation manuelle requise";
    } else if (!familiesCompatible) {
      autoMergeBlockReason = "Familles incompatibles — validation manuelle requise";
    } else if (!sameNormalized && cluster.mergeMode !== "exact") {
      autoMergeBlockReason = "Désignations normalisées différentes — validation manuelle requise";
    } else if (cluster.mergeMode === "exact" || (sameNormalized && cluster.maxSimilarity >= 90)) {
      autoMergeAllowed = true;
    } else {
      autoMergeBlockReason = "Confiance insuffisante — validation manuelle requise";
    }

    groups.push({
      groupKey: cluster.normalizedKey,
      normalizedKey: cluster.normalizedKey,
      members: enrichedMembers,
      recommendedCanonicalId: recommended.id,
      recommendedCanonical: recommended,
      mergeMode: cluster.mergeMode,
      maxSimilarity: cluster.maxSimilarity,
      matchReasons: cluster.matchReasons,
      autoMergeAllowed,
      autoMergeBlockReason,
      unitsMatch,
      familiesCompatible,
    });
  }

  return groups.sort((a, b) => b.members.length - a.members.length);
}
