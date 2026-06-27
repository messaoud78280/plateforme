/**
 * Résout « Qui le réalise ? » depuis les champs JSON pédagogiques.
 * Ne doit jamais retomber sur le lot, le lot_nom ou le corps_metier.
 */
export function resolveWhoDoesItFromJsonSources(
  fiche: Record<string, unknown>,
  comprehension: Record<string, unknown>,
  ficheMere: Record<string, unknown>,
): string {
  const candidates = [
    comprehension.qui_le_realise,
    comprehension.realise_par,
    comprehension.acteur_realisation,
    comprehension.qui_realise,
    comprehension.who_does_it,
    fiche.qui_le_realise,
    fiche.realise_par,
    fiche.acteur_realisation,
    ficheMere.qui_le_realise,
    ficheMere.realise_par,
    ficheMere.acteur_realisation,
    ficheMere.intervenant_concerne,
    fiche.intervenant_concerne,
  ];

  for (const c of candidates) {
    const s = String(c ?? "").trim();
    if (s) return s;
  }

  return "";
}

/** Détecte si whoDoesIt a probablement été rempli par erreur avec lot / corps d'état. */
export function isWhoDoesItLikelyMisassigned(
  whoDoesIt: string,
  linkedLots: string,
  familyName: string,
  corpsMetier: string,
): boolean {
  const w = whoDoesIt.trim().toLowerCase();
  if (!w) return false;

  const compare = [linkedLots, familyName, corpsMetier]
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  return compare.some((ref) => ref === w || w.includes(ref) || ref.includes(w));
}
