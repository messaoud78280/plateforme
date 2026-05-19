import {
  DEFAULT_BEWORK_FAMILY_CODE,
  getBeWorkFamilyLabel,
  isKnownFamilyCode,
  normalizeBeWorkMatchString,
  suggestFamilyCodeFromWorkItem,
} from "@/lib/bework-devis-family-codes";

export type NormalizedWorkItemLot = {
  lot: string;
  subLot: string | null;
  familyCode: string;
};

/** Découpe un libellé lot en segments (/, -, —). */
function splitLotSegments(raw: string): string[] {
  return raw
    .split(/\s*(?:\/|–|—|-)\s*/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

function pushSubLotPart(parts: string[], value: string | null | undefined, canonicalLot: string) {
  const t = value?.trim();
  if (!t) return;
  const tn = normalizeBeWorkMatchString(t);
  const cn = normalizeBeWorkMatchString(canonicalLot);
  if (tn === cn || cn.includes(tn) && tn.length < cn.length * 0.6) return;
  if (parts.some((p) => normalizeBeWorkMatchString(p) === tn)) return;
  parts.push(t);
}

/**
 * Harmonise lot / sous-lot / famille vers un corps de métier canonique (lexique BeWork).
 * Ex. « Électricité / Chauffage électrique » → lot « Électricité / VMC… », sous-lot « Chauffage électrique ».
 */
export function normalizeWorkItemLotFields(input: {
  lot: string;
  subLot?: string | null;
  family?: string | null;
  familyCode?: string | null;
  title?: string | null;
  shortDescription?: string | null;
  fullDescription?: string | null;
  itemType?: string | null;
}): NormalizedWorkItemLot {
  const rawLot = input.lot.trim();
  if (!rawLot) {
    return { lot: "Non classé", subLot: null, familyCode: DEFAULT_BEWORK_FAMILY_CODE };
  }

  const existingSub = input.subLot?.trim() || null;
  const familyField = input.family?.trim() || null;

  const hinted = input.familyCode?.trim().toUpperCase();
  const suggested = suggestFamilyCodeFromWorkItem({
    lot: rawLot,
    subLot: existingSub,
    family: familyField,
    title: input.title,
    shortDescription: input.shortDescription,
    fullDescription: input.fullDescription,
    itemType: input.itemType,
  });

  let familyCode: string;
  if (hinted && isKnownFamilyCode(hinted)) {
    if (hinted === "GAR" && suggested && suggested !== "GAR") {
      familyCode = suggested;
    } else if (hinted !== "GAR" || input.itemType === "garantie_assurance") {
      familyCode = hinted;
    } else {
      familyCode = suggested ?? DEFAULT_BEWORK_FAMILY_CODE;
    }
  } else {
    familyCode = suggested ?? DEFAULT_BEWORK_FAMILY_CODE;
  }

  const canonicalLot = getBeWorkFamilyLabel(familyCode) ?? rawLot;
  const subLotParts: string[] = [];

  pushSubLotPart(subLotParts, existingSub, canonicalLot);

  const segments = splitLotSegments(rawLot);
  if (segments.length > 1) {
    pushSubLotPart(subLotParts, segments.slice(1).join(" / "), canonicalLot);
    const firstNorm = normalizeBeWorkMatchString(segments[0]);
    const canonNorm = normalizeBeWorkMatchString(canonicalLot);
    if (!canonNorm.includes(firstNorm) && firstNorm.length > 2) {
      pushSubLotPart(subLotParts, segments[0], canonicalLot);
    }
  } else if (normalizeBeWorkMatchString(rawLot) !== normalizeBeWorkMatchString(canonicalLot)) {
    pushSubLotPart(subLotParts, rawLot, canonicalLot);
  }

  return {
    lot: canonicalLot,
    subLot: subLotParts.length > 0 ? subLotParts.join(" · ") : null,
    familyCode,
  };
}

/** Indique si une mise à jour est nécessaire. */
export function workItemLotNeedsNormalization(input: {
  lot: string;
  subLot?: string | null;
  family?: string | null;
  familyCode?: string | null;
  title?: string | null;
  shortDescription?: string | null;
  fullDescription?: string | null;
  itemType?: string | null;
}): boolean {
  const n = normalizeWorkItemLotFields(input);
  const curCode = input.familyCode?.trim().toUpperCase() || null;

  if (curCode === "GAR" && n.familyCode !== "GAR") return true;

  return (
    n.lot !== input.lot.trim() ||
    (n.subLot ?? null) !== (input.subLot?.trim() || null) ||
    n.familyCode !== (curCode && isKnownFamilyCode(curCode) && curCode !== "GAR" ? curCode : n.familyCode)
  );
}
