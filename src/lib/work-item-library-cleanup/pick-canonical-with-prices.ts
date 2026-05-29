import { canonicalDesignationFromItem, type WorkItemMergeCandidate } from "@/lib/work-item-merge/pick-canonical";
import type { WorkItemPriceStats } from "@/lib/work-item-library-cleanup/price-stats";

export type WorkItemMergeCandidateWithPrices = WorkItemMergeCandidate & {
  code: string;
  familyCode?: string | null;
};

function designationQualityScore(item: WorkItemMergeCandidate): number {
  const d = canonicalDesignationFromItem(item);
  let score = d.length;
  if (/\d+\s*x\s*\d+|\d+x\d+/i.test(d)) score += 40;
  if (/\b(cm|mm|m2|m3|ml)\b/i.test(d)) score += 25;
  if (d.length < 30) score -= 30;
  if (/\.{3}$|…$/.test(d.trim())) score -= 50;
  return score;
}

function codeQualityScore(code: string): number {
  const u = code.trim().toUpperCase();
  if (/^BW-[A-Z]{3}-\d+$/.test(u)) return 100;
  if (u.startsWith("BW-")) return 50;
  return 0;
}

/**
 * Choisit l’ouvrage maître selon priorités métier :
 * 1. plus de prix observés
 * 2. prix max le plus élevé
 * 3. désignation la plus propre
 * 4. code BeWork le plus cohérent
 */
export function pickCanonicalWorkItemWithPrices<T extends WorkItemMergeCandidateWithPrices>(
  members: T[],
  priceStats: Map<string, WorkItemPriceStats>,
): T {
  return [...members].sort((a, b) => {
    const pa = priceStats.get(a.id);
    const pb = priceStats.get(b.id);
    const ca = pa?.priceCount ?? 0;
    const cb = pb?.priceCount ?? 0;
    if (cb !== ca) return cb - ca;

    const maxA = pa?.maxHt ?? -1;
    const maxB = pb?.maxHt ?? -1;
    if (maxB !== maxA) return maxB - maxA;

    const da = designationQualityScore(a);
    const db = designationQualityScore(b);
    if (db !== da) return db - da;

    const codeA = codeQualityScore(a.code);
    const codeB = codeQualityScore(b.code);
    if (codeB !== codeA) return codeB - codeA;

    return b.updatedAt && a.updatedAt ? b.updatedAt.getTime() - a.updatedAt.getTime() : 0;
  })[0]!;
}
