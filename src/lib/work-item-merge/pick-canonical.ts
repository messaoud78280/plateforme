import { workItemDesignationForMerge } from "@/lib/work-item-merge/normalize-designation";

export type WorkItemMergeCandidate = {
  id: string;
  code: string;
  title: string;
  shortDescription?: string | null;
  fullDescription?: string | null;
  lot: string;
  unit: string;
  updatedAt?: Date;
};

function designationScore(item: WorkItemMergeCandidate): number {
  const d = workItemDesignationForMerge(item);
  let score = d.length;
  if (/\d+\s*x\s*\d+|\d+x\d+/i.test(d)) score += 40;
  if (/\bcm\b|\bmm\b|\bm²\b|\bm2\b/i.test(d)) score += 25;
  if (/\b(beton|acier|laine|placo|peinture|baignoire|gaine|cable)\b/i.test(d)) score += 15;
  if (d.length < 30) score -= 30;
  if (/\.{3}$|…$/.test(d.trim())) score -= 50;
  return score;
}

/** Choisit la désignation canonique la plus complète et professionnelle. */
export function pickCanonicalWorkItem<T extends WorkItemMergeCandidate>(members: T[]): T {
  return [...members].sort((a, b) => {
    const sa = designationScore(a);
    const sb = designationScore(b);
    if (sb !== sa) return sb - sa;
    const da = workItemDesignationForMerge(a).length;
    const db = workItemDesignationForMerge(b).length;
    if (db !== da) return db - da;
    return b.updatedAt && a.updatedAt ? b.updatedAt.getTime() - a.updatedAt.getTime() : 0;
  })[0]!;
}

export function canonicalDesignationFromItem(item: WorkItemMergeCandidate): string {
  return workItemDesignationForMerge(item);
}
