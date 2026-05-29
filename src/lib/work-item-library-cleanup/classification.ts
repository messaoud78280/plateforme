/**
 * Reclassement automatique ouvrages mal rangés (DIV, Non classé…).
 * Retourne famille proposée + confiance + raison.
 */

import {
  DEFAULT_BEWORK_FAMILY_CODE,
  BEWORK_DEVIS_FAMILY_LEXICON,
  buildWorkItemClassificationHaystack,
  getBeWorkFamilyLabel,
  normalizeBeWorkMatchString,
  suggestFamilyCodeFromWorkItem,
  type WorkItemFamilySuggestionInput,
} from "@/lib/bework-devis-family-codes";
import {
  isGenericFamilyCode,
  isGenericFamilyField,
  isGenericLot,
  workItemHasGenericClassification,
} from "@/lib/be-work-devis-import-classification";

export type ClassificationConfidence = "haute" | "moyenne" | "faible";

export type ClassificationSuggestion = {
  proposedFamilyCode: string;
  proposedFamily: string;
  proposedLot: string;
  confidence: ClassificationConfidence;
  matchReason: string;
  matchedTerm?: string;
};

export type WorkItemForClassification = WorkItemFamilySuggestionInput & {
  id: string;
  familyCode?: string | null;
  lot: string;
  unit: string;
};

function findBestMatchingTerm(hay: string): { code: string; term: string; termLen: number } | null {
  let best: { code: string; term: string; termLen: number } | null = null;

  for (const fam of BEWORK_DEVIS_FAMILY_LEXICON) {
    if (fam.code === "DIV" || fam.code === "GAR") continue;
    for (const term of fam.matchTerms) {
      const t = normalizeBeWorkMatchString(term);
      if (!t || t.length < 3) continue;
      if (!hay.includes(t)) continue;
      if (!best || t.length > best.termLen) {
        best = { code: fam.code.toUpperCase(), term, termLen: t.length };
      }
    }
  }

  return best;
}

/** Ouvrage éligible au reclassement automatique (famille/lot générique). */
export function workItemNeedsReclassification(
  item: Pick<WorkItemForClassification, "familyCode" | "lot" | "family" | "unit">,
): boolean {
  return workItemHasGenericClassification({
    familyCode: item.familyCode ?? null,
    lot: item.lot,
    family: item.family ?? null,
    unit: item.unit,
  });
}

/**
 * Propose un reclassement à partir de la désignation et du contexte.
 * Retourne null si aucune amélioration crédible ou si déjà bien classé.
 */
export function suggestWorkItemReclassification(
  item: WorkItemForClassification,
): ClassificationSuggestion | null {
  if (!workItemNeedsReclassification(item)) return null;

  const hay = buildWorkItemClassificationHaystack(item);
  const bestTerm = findBestMatchingTerm(hay);
  const inferred = suggestFamilyCodeFromWorkItem(item);

  const proposedFamilyCode = bestTerm?.code ?? inferred;
  if (!proposedFamilyCode || proposedFamilyCode === DEFAULT_BEWORK_FAMILY_CODE) return null;
  if (proposedFamilyCode === item.familyCode?.trim().toUpperCase()) return null;

  const proposedFamily = getBeWorkFamilyLabel(proposedFamilyCode) ?? proposedFamilyCode;
  const proposedLot = proposedFamily;

  let confidence: ClassificationConfidence = "faible";
  let matchReason = "Correspondance faible sur le libellé";

  if (bestTerm) {
    if (bestTerm.termLen >= 12) {
      confidence = "haute";
      matchReason = `Mot-clé « ${bestTerm.term} »`;
    } else if (bestTerm.termLen >= 6) {
      confidence = "moyenne";
      matchReason = `Mot-clé « ${bestTerm.term} » (terme court)`;
    } else {
      matchReason = `Mot-clé « ${bestTerm.term} » (à vérifier)`;
    }
  } else if (inferred) {
    confidence = "moyenne";
    matchReason = "Inférence lot / type d’ouvrage";
  }

  if (isGenericLot(item.lot) && confidence === "faible") {
    confidence = "moyenne";
  }

  return {
    proposedFamilyCode,
    proposedFamily,
    proposedLot,
    confidence,
    matchReason,
    matchedTerm: bestTerm?.term,
  };
}

/** Familles compatibles pour fusion (même code ou paires proches). */
const COMPATIBLE_FAMILY_PAIRS = new Set(
  [
    ["MAC", "FON"],
    ["MAC", "DAL"],
    ["COU", "ETA"],
    ["PLA", "PEI"],
    ["CHF", "PLO"],
    ["MIN", "MEX"],
  ].flatMap(([a, b]) => [`${a}|${b}`, `${b}|${a}`]),
);

export function areFamilyCodesCompatible(a: string | null | undefined, b: string | null | undefined): boolean {
  const fa = a?.trim().toUpperCase();
  const fb = b?.trim().toUpperCase();
  if (!fa || !fb) return true;
  if (fa === fb) return true;
  if (fa === DEFAULT_BEWORK_FAMILY_CODE || fb === DEFAULT_BEWORK_FAMILY_CODE) return true;
  return COMPATIBLE_FAMILY_PAIRS.has(`${fa}|${fb}`);
}

export function isMisclassifiedGenericItem(item: Pick<WorkItemForClassification, "familyCode" | "lot" | "family">): boolean {
  return (
    isGenericFamilyCode(item.familyCode) ||
    isGenericLot(item.lot) ||
    isGenericFamilyField(item.family)
  );
}
