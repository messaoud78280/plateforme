import { findMergeBlocker, expandWithSynonyms } from "@/lib/chantier-resources/synonyms-btp";
import { normalizeResourceLabel, parseDimensionsFromLabel, tokenSet } from "@/lib/chantier-resources/normalize-label";

export type SimilarityResult = {
  score: number;
  reasons: string[];
  blocker: string | null;
  proposalHint: "merge_as_alias" | "create_variant" | "new_resource" | "keep_separate";
};

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function dimensionCompatibility(a: string, b: string): { bonus: number; penalty: number; note?: string } {
  const da = parseDimensionsFromLabel(a);
  const db = parseDimensionsFromLabel(b);
  if (da.thicknessCm != null && db.thicknessCm != null && da.thicknessCm !== db.thicknessCm) {
    return { bonus: 0, penalty: 35, note: `Épaisseurs différentes (${da.thicknessCm} vs ${db.thicknessCm} cm)` };
  }
  if (da.thicknessCm != null && db.thicknessCm != null && da.thicknessCm === db.thicknessCm) {
    return { bonus: 15, penalty: 0, note: `Même épaisseur ${da.thicknessCm} cm` };
  }
  return { bonus: 0, penalty: 0 };
}

/** Score 0–100 entre deux libellés (+ contexte unité optionnel). */
export function scoreSimilarity(
  labelA: string,
  labelB: string,
  opts?: { unitA?: string | null; unitB?: string | null },
): SimilarityResult {
  const na = normalizeResourceLabel(labelA);
  const nb = normalizeResourceLabel(labelB);
  const reasons: string[] = [];

  if (!na || !nb) {
    return { score: 0, reasons: ["Libellé vide"], blocker: null, proposalHint: "new_resource" };
  }

  if (na === nb) {
    return { score: 100, reasons: ["Libellés identiques après normalisation"], blocker: null, proposalHint: "merge_as_alias" };
  }

  const blocker = findMergeBlocker(labelA, labelB);
  if (blocker) {
    return {
      score: Math.min(69, 50),
      reasons: [blocker],
      blocker,
      proposalHint: "create_variant",
    };
  }

  let score = Math.round(jaccard(tokenSet(na), tokenSet(nb)) * 70);

  const synA = expandWithSynonyms(na);
  const synB = expandWithSynonyms(nb);
  if (synA.some((s) => nb.includes(s) || synB.some((t) => na.includes(t)))) {
    score += 20;
    reasons.push("Synonymes métier détectés");
  }

  if (na.includes(nb) || nb.includes(na)) {
    score += 15;
    reasons.push("Inclusion de libellé");
  }

  const dim = dimensionCompatibility(labelA, labelB);
  score += dim.bonus - dim.penalty;
  if (dim.note) reasons.push(dim.note);

  if (opts?.unitA && opts?.unitB) {
    const ua = opts.unitA.trim().toLowerCase();
    const ub = opts.unitB.trim().toLowerCase();
    if (ua && ub && ua !== ub) {
      score -= 15;
      reasons.push(`Unités différentes (${opts.unitA} vs ${opts.unitB})`);
    } else if (ua && ub && ua === ub) {
      score += 5;
    }
  }

  score = Math.max(0, Math.min(100, score));

  let proposalHint: SimilarityResult["proposalHint"] = "keep_separate";
  if (score >= 90) proposalHint = "merge_as_alias";
  else if (score >= 70) proposalHint = "create_variant";
  else if (score >= 50) proposalHint = "keep_separate";
  else proposalHint = "new_resource";

  if (/hydro|feu|phonique|h1|h2/i.test(labelA) !== /hydro|feu|phonique|h1|h2/i.test(labelB)) {
    proposalHint = "create_variant";
    score = Math.min(score, 85);
    reasons.push("Variante technique possible (qualificatif différent)");
  }

  return { score, reasons, blocker, proposalHint };
}
