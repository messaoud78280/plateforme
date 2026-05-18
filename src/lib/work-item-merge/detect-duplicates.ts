import { scoreWorkItemDesignationSimilarity } from "@/lib/work-item-merge/similarity";
import { findWorkItemMergeBlocker } from "@/lib/work-item-merge/merge-blockers";
import {
  normalizeWorkItemDesignation,
  workItemDesignationForMerge,
} from "@/lib/work-item-merge/normalize-designation";
import { canonicalDesignationFromItem, pickCanonicalWorkItem } from "@/lib/work-item-merge/pick-canonical";

export type WorkItemForDuplicateScan = {
  id: string;
  code: string;
  title: string;
  shortDescription?: string | null;
  fullDescription?: string | null;
  lot: string;
  family?: string | null;
  unit: string;
  normalizedDesignation?: string | null;
  updatedAt?: Date;
};

export type DuplicateCluster = {
  normalizedKey: string;
  members: WorkItemForDuplicateScan[];
  canonical: WorkItemForDuplicateScan;
  canonicalDesignation: string;
  maxSimilarity: number;
  matchReasons: string[];
  mergeMode: "exact" | "auto" | "manual_review";
};

export type DuplicateAnalysisResult = {
  analyzed: number;
  exactDuplicateGroups: number;
  quasiDuplicateGroups: number;
  autoMergeGroups: DuplicateCluster[];
  reviewGroups: DuplicateCluster[];
  skippedWithBlocker: number;
};

const AUTO_THRESHOLD = 90;
const REVIEW_MIN = 75;

class UnionFind {
  parent = new Map<string, string>();

  find(id: string): string {
    const p = this.parent.get(id);
    if (!p || p === id) {
      this.parent.set(id, id);
      return id;
    }
    const root = this.find(p);
    this.parent.set(id, root);
    return root;
  }

  union(a: string, b: string) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent.set(rb, ra);
  }
}

function blockingBucket(item: WorkItemForDuplicateScan, normalized: string): string {
  const lot = item.lot.trim().toLowerCase().slice(0, 40);
  const first = normalized.split(" ").find((t) => t.length > 2) ?? normalized.slice(0, 8);
  return `${lot}::${first}`;
}

function normalizedKeyOf(item: WorkItemForDuplicateScan): string {
  return (
    item.normalizedDesignation?.trim() ||
    normalizeWorkItemDesignation(workItemDesignationForMerge(item))
  );
}

function buildCluster(
  members: WorkItemForDuplicateScan[],
  mergeMode: DuplicateCluster["mergeMode"],
  maxSimilarity: number,
  matchReasons: string[],
): DuplicateCluster {
  const canonical = pickCanonicalWorkItem(members);
  return {
    normalizedKey: normalizeWorkItemDesignation(canonicalDesignationFromItem(canonical)),
    members,
    canonical,
    canonicalDesignation: canonicalDesignationFromItem(canonical),
    maxSimilarity,
    matchReasons,
    mergeMode,
  };
}

export function analyzeWorkItemDuplicates(items: WorkItemForDuplicateScan[]): DuplicateAnalysisResult {
  const uf = new UnionFind();
  const reviewPairs: { a: WorkItemForDuplicateScan; b: WorkItemForDuplicateScan; score: number; reasons: string[] }[] =
    [];
  let blockers = 0;
  let exactPairs = 0;

  for (const item of items) uf.find(item.id);

  const buckets = new Map<string, WorkItemForDuplicateScan[]>();
  for (const item of items) {
    const n = normalizedKeyOf(item);
    const b = blockingBucket(item, n);
    const list = buckets.get(b) ?? [];
    list.push(item);
    buckets.set(b, list);
  }

  for (const members of buckets.values()) {
    if (members.length < 2) continue;
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const a = members[i]!;
        const b = members[j]!;
        const da = workItemDesignationForMerge(a);
        const db = workItemDesignationForMerge(b);
        const na = normalizedKeyOf(a);
        const nb = normalizedKeyOf(b);

        if (na === nb) {
          uf.union(a.id, b.id);
          exactPairs += 1;
          continue;
        }

        const blocker = findWorkItemMergeBlocker(da, db);
        if (blocker) {
          blockers += 1;
          continue;
        }

        const sim = scoreWorkItemDesignationSimilarity(da, db, { unitA: a.unit, unitB: b.unit });
        if (sim.score >= AUTO_THRESHOLD) {
          uf.union(a.id, b.id);
        } else if (sim.score >= REVIEW_MIN) {
          reviewPairs.push({ a, b, score: sim.score, reasons: sim.reasons });
        }
      }
    }
  }

  const autoGroups = new Map<string, WorkItemForDuplicateScan[]>();
  for (const item of items) {
    const root = uf.find(item.id);
    const list = autoGroups.get(root) ?? [];
    list.push(item);
    autoGroups.set(root, list);
  }

  const autoMergeGroups: DuplicateCluster[] = [];
  let exactDuplicateGroups = 0;

  for (const members of autoGroups.values()) {
    if (members.length < 2) continue;
    const keys = new Set(members.map((m) => normalizedKeyOf(m)));
    const isExact = keys.size === 1;
    if (isExact) exactDuplicateGroups += 1;
    autoMergeGroups.push(
      buildCluster(
        members,
        isExact ? "exact" : "auto",
        isExact ? 100 : AUTO_THRESHOLD,
        isExact ? ["Clé normalisée identique"] : ["Similarité ≥ 90 %"],
      ),
    );
  }

  const reviewUf = new UnionFind();
  for (const p of reviewPairs) {
    if (uf.find(p.a.id) === uf.find(p.b.id)) continue;
    reviewUf.union(p.a.id, p.b.id);
  }

  const reviewGroups: DuplicateCluster[] = [];
  const reviewClusters = new Map<string, WorkItemForDuplicateScan[]>();
  for (const item of items) {
    if (uf.find(item.id) !== item.id) continue;
    const root = reviewUf.find(item.id);
    if (reviewUf.parent.get(item.id) === item.id && reviewPairs.every((p) => p.a.id !== item.id && p.b.id !== item.id)) {
      continue;
    }
    const list = reviewClusters.get(root) ?? [];
    if (!list.some((x) => x.id === item.id)) list.push(item);
    reviewClusters.set(root, list);
  }

  for (const members of reviewClusters.values()) {
    if (members.length < 2) continue;
    const maxScore = Math.max(
      ...reviewPairs
        .filter((p) => members.some((m) => m.id === p.a.id) && members.some((m) => m.id === p.b.id))
        .map((p) => p.score),
      REVIEW_MIN,
    );
    const reasons = reviewPairs.flatMap((p) => p.reasons).slice(0, 6);
    reviewGroups.push(buildCluster(members, "manual_review", maxScore, [...new Set(reasons)]));
  }

  return {
    analyzed: items.length,
    exactDuplicateGroups,
    quasiDuplicateGroups: autoMergeGroups.filter((g) => g.mergeMode === "auto").length + reviewGroups.length,
    autoMergeGroups,
    reviewGroups,
    skippedWithBlocker: blockers,
  };
}

export function clusterExactDuplicates(items: WorkItemForDuplicateScan[]): DuplicateCluster[] {
  return analyzeWorkItemDuplicates(items).autoMergeGroups.filter((g) => g.mergeMode === "exact");
}
