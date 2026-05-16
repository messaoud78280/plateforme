/**
 * Unités ouvrage BeWork Devis : valeurs canoniques + normalisation des variantes BTP (BPU, devis, etc.).
 * À réutiliser pour tout champ « unité » textuel (ex. `WorkItem.unit`, ou plus tard une unité sur une ligne de prix)
 * sans modifier les montants ni les désignations.
 */

export const WORK_ITEM_UNITS = [
  "m²",
  "ml",
  "m³",
  "unité",
  "forfait",
  "kg",
  "t",
  "h",
  "jour",
] as const;

export type WorkItemUnit = (typeof WORK_ITEM_UNITS)[number];

/** Clé de comparaison : insensible à la casse, accents, espaces ; m² → m2, m³ → m3. */
export function unitComparisonKey(raw: string): string {
  return raw
    .trim()
    .replace(/²/g, "2")
    .replace(/³/g, "3")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Alias (clé normalisée) → unité canonique `WORK_ITEM_UNITS`. */
const ALIAS_TO_CANONICAL: Record<string, WorkItemUnit> = {
  // unité (ex. U, u, BPU)
  u: "unité",
  unite: "unité",
  unites: "unité",
  // forfait (ex. Ft, F, ensemble / ens sur devis) — la valeur canonique « forfait » est déjà couverte par la boucle sur WORK_ITEM_UNITS
  f: "forfait",
  ft: "forfait",
  ensemble: "forfait",
  ens: "forfait",
  // surfaces / linéaires
  m2: "m²",
  m3: "m³",
  ml: "ml",
  "metre lineaire": "ml",
  "metres lineaires": "ml",
  // masses, temps
  kg: "kg",
  t: "t",
  h: "h",
  jour: "jour",
  jours: "jour",
};

/**
 * Retourne une valeur de `WORK_ITEM_UNITS` ou `null` si aucune correspondance.
 * N’altère pas les désignations : à utiliser uniquement sur le champ unité.
 */
export function normalizeUnit(raw: string): WorkItemUnit | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const key = unitComparisonKey(trimmed);

  for (const canonical of WORK_ITEM_UNITS) {
    if (unitComparisonKey(canonical) === key) {
      return canonical;
    }
  }

  const fromAlias = ALIAS_TO_CANONICAL[key];
  if (fromAlias) return fromAlias;

  return null;
}

export function isWorkItemUnit(v: string): boolean {
  return normalizeUnit(v) !== null;
}
