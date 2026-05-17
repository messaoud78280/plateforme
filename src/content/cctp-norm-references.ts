/** Familles DTU / normes sélectionnables — libellés sans numéro inventé. */
export type CctpNormReferenceOption = {
  id: string;
  label: string;
  hint: string;
};

export const CCTP_NORM_REFERENCE_OPTIONS: CctpNormReferenceOption[] = [
  {
    id: "dtu-go",
    label: "DTU — Gros œuvre / structure",
    hint: "Terrassements, fondations, maçonnerie, béton — numéros à valider selon ouvrage.",
  },
  {
    id: "dtu-charpente",
    label: "DTU — Charpente / couverture / étanchéité",
    hint: "Charpente bois/métal, couverture, zinguerie — références à confirmer.",
  },
  {
    id: "dtu-second-oeuvre",
    label: "DTU — Second œuvre (cloisons, plâtrerie, menuiseries)",
    hint: "Cloisons, doublages, plafonds, menuiseries intérieures.",
  },
  {
    id: "dtu-plomberie",
    label: "DTU / normes — Plomberie sanitaire",
    hint: "Eau froide/chaude, évacuations — conformité réseaux.",
  },
  {
    id: "dtu-cvc",
    label: "DTU / normes — CVC (chauffage, ventilation, climatisation)",
    hint: "Production, distribution, régulation — performances à préciser.",
  },
  {
    id: "dtu-electricite",
    label: "NF C 15-100 / électricité",
    hint: "Installations électriques — niveaux de sécurité et schémas.",
  },
  {
    id: "dtu-vrd",
    label: "DTU — VRD / réseaux extérieurs",
    hint: "Voirie, réseaux enterrés, assainissement.",
  },
  {
    id: "feu-acoustique",
    label: "Réglementation feu / acoustique / accessibilité",
    hint: "ERP, habitat, RE2020 — classes et performances à citer explicitement.",
  },
  {
    id: "environnement",
    label: "Environnement / déchets / REACH",
    hint: "Gestion des déchets de chantier, produits dangereux.",
  },
];

export function cctpNormLabelsByIds(ids: string[]): string[] {
  const set = new Set(ids);
  return CCTP_NORM_REFERENCE_OPTIONS.filter((o) => set.has(o.id)).map((o) => o.label);
}
