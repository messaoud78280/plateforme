import { scoreSimilarity, type SimilarityResult } from "@/lib/chantier-resources/similarity";
import { parseDimensionsFromLabel } from "@/lib/chantier-resources/normalize-label";
import { findWorkItemMergeBlocker } from "@/lib/work-item-merge/merge-blockers";
import { normalizeWorkItemDesignation } from "@/lib/work-item-merge/normalize-designation";

function tokenOverlapScore(na: string, nb: string): { score: number; reason?: string } {
  const ta = new Set(na.split(" ").filter((t) => t.length > 2));
  const tb = new Set(nb.split(" ").filter((t) => t.length > 2));
  if (ta.size === 0 || tb.size === 0) return { score: 0 };
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter += 1;
  const shorter = Math.min(ta.size, tb.size);
  const longer = Math.max(ta.size, tb.size);
  const coverage = inter / shorter;
  const jaccard = inter / (ta.size + tb.size - inter);
  let score = Math.round(Math.max(coverage * 94, jaccard * 88));
  if (coverage >= 0.8) score = Math.max(score, 90);
  return {
    score,
    reason: `Recouvrement tokens ${Math.round(coverage * 100)} %`,
  };
}

/** Similarité adaptée aux longues désignations ouvrages (0–100). */
export function scoreWorkItemDesignationSimilarity(
  labelA: string,
  labelB: string,
  opts?: { unitA?: string | null; unitB?: string | null },
): SimilarityResult {
  const na = normalizeWorkItemDesignation(labelA);
  const nb = normalizeWorkItemDesignation(labelB);

  if (na === nb) {
    return {
      score: 100,
      reasons: ["Désignations identiques après normalisation"],
      blocker: null,
      proposalHint: "merge_as_alias",
    };
  }

  const blocker = findWorkItemMergeBlocker(labelA, labelB);
  if (blocker) {
    return {
      score: Math.min(69, 55),
      reasons: [blocker],
      blocker,
      proposalHint: "keep_separate",
    };
  }

  const base = scoreSimilarity(labelA, labelB, opts);
  const overlap = tokenOverlapScore(na, nb);
  let score = Math.max(base.score, overlap.score);
  const reasons = [...base.reasons];
  if (overlap.reason) reasons.push(overlap.reason);

  if (na.includes(nb) || nb.includes(na)) {
    score = Math.max(score, 88);
    reasons.push("Inclusion après normalisation");
  }

  const da = parseDimensionsFromLabel(labelA);
  const db = parseDimensionsFromLabel(labelB);
  const dimMatch =
    (da.thicknessCm != null && da.thicknessCm === db.thicknessCm) ||
    (da.lengthMm != null && da.lengthMm === db.lengthMm && da.widthMm === db.widthMm);
  if (dimMatch && overlap.score >= 70) {
    score = Math.max(score, 91);
    reasons.push("Dimensions compatibles");
  }

  score = Math.min(100, score);

  let proposalHint = base.proposalHint;
  if (score >= 90) proposalHint = "merge_as_alias";
  else if (score >= 75) proposalHint = "create_variant";
  else if (score >= 50) proposalHint = "keep_separate";
  else proposalHint = "new_resource";

  return { score, reasons: [...new Set(reasons)].slice(0, 6), blocker: null, proposalHint };
}
