/** Lexique synonymes BTP + garde-fous anti-fusion abusive. */

export const BTP_SYNONYM_GROUPS: string[][] = [
  ["parpaing", "bloc beton", "agglo", "agglomere creux", "bloc creux"],
  ["placo", "plaque de platre", "plaque platre"],
  ["ba13", "plaque de platre ba13", "ba 13", "platre 12.5", "12.5 mm"],
  ["ciment gris", "ciment courant", "ciment portland"],
  ["sable a maconner", "sable 0/4", "sable maconner"],
  ["gaine electrique", "gaine icta", "icta"],
  ["polyane", "film polyethylene", "film polyane"],
  ["placostil", "ossature metallique placo", "montant metallique"],
  ["ferraille", "acier ha", "treillis", "armature"],
];

/** Paires ou motifs qui ne doivent PAS être fusionnés automatiquement (score plafonné). */
export const MERGE_BLOCKERS: { patternA: RegExp; patternB: RegExp; reason: string }[] = [
  {
    patternA: /hydro|h1|humide/i,
    patternB: /^(?!.*hydro).*ba13|standard/i,
    reason: "BA13 hydrofuge ≠ BA13 standard",
  },
  {
    patternA: /laine de verre/i,
    patternB: /laine de roche/i,
    reason: "Laine de verre ≠ laine de roche",
  },
  {
    patternA: /evacuation|ep/i,
    patternB: /pression|eau chaude/i,
    reason: "PVC évacuation ≠ PVC pression",
  },
  {
    patternA: /cem\s*i\b|cem1/i,
    patternB: /cem\s*ii\b|cem2/i,
    reason: "Ciment CEM I ≠ CEM II",
  },
  {
    patternA: /3g1[,.]5|1[,.]5\s*mm²/i,
    patternB: /3g2[,.]5|2[,.]5\s*mm²/i,
    reason: "Sections câble différentes",
  },
  {
    patternA: /icta\s*16|d16|ø\s*16/i,
    patternB: /icta\s*25|d25|ø\s*25/i,
    reason: "Diamètres gaines différents",
  },
];

export function expandWithSynonyms(normalized: string): string[] {
  const tokens = new Set<string>([normalized]);
  for (const group of BTP_SYNONYM_GROUPS) {
    if (group.some((g) => normalized.includes(g))) {
      for (const g of group) tokens.add(g);
    }
  }
  return [...tokens];
}

export function findMergeBlocker(a: string, b: string): string | null {
  for (const block of MERGE_BLOCKERS) {
    const match =
      (block.patternA.test(a) && block.patternB.test(b)) || (block.patternA.test(b) && block.patternB.test(a));
    if (match) return block.reason;
  }
  return null;
}
