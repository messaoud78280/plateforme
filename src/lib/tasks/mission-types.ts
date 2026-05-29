/** Types de mission BTP BeWork (stockés dans Task.missionType) */
export const MISSION_TYPES = [
  "DEVIS_CHIFFRAGE",
  "COMPTE_RENDU_CHANTIER",
  "DOSSIER_SOUS_TRAITANT",
  "COMMANDES_BL_FOURNISSEURS",
  "PLANNING_CHANTIER",
  "SITUATION_TRAVAUX",
  "DOE",
  "PPSPS",
  "ANALYSE_DCE",
  "MEMOIRE_TECHNIQUE",
  "RELANCE_CLIENT_FOURNISSEUR",
  "ADMINISTRATIF_CHANTIER",
  "AUTRE",
] as const;

export type MissionType = (typeof MISSION_TYPES)[number];

export const MISSION_TYPE_LABELS: Record<MissionType, string> = {
  DEVIS_CHIFFRAGE: "Devis / chiffrage",
  COMPTE_RENDU_CHANTIER: "Compte rendu chantier",
  DOSSIER_SOUS_TRAITANT: "Dossier sous-traitant",
  COMMANDES_BL_FOURNISSEURS: "Commandes / BL / fournisseurs",
  PLANNING_CHANTIER: "Planning chantier",
  SITUATION_TRAVAUX: "Situation de travaux",
  DOE: "DOE",
  PPSPS: "PPSPS",
  ANALYSE_DCE: "Analyse DCE",
  MEMOIRE_TECHNIQUE: "Mémoire technique",
  RELANCE_CLIENT_FOURNISSEUR: "Relance client / fournisseur",
  ADMINISTRATIF_CHANTIER: "Administratif chantier",
  AUTRE: "Autre",
};

export function missionTypeLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return MISSION_TYPE_LABELS[value as MissionType] ?? value;
}

/** Exemples rapides pour création depuis un chantier */
export const MISSION_TITLES_BY_TYPE: Partial<Record<MissionType, string>> = {
  COMPTE_RENDU_CHANTIER: "Préparer un compte rendu chantier",
  COMMANDES_BL_FOURNISSEURS: "Vérifier les BL fournisseurs",
  DOSSIER_SOUS_TRAITANT: "Relancer les pièces sous-traitants",
  DEVIS_CHIFFRAGE: "Préparer un devis modificatif",
  DOE: "Classer les documents DOE",
  PLANNING_CHANTIER: "Mettre à jour le tableau de suivi chantier",
};

/** Rubrique classeur chantier recommandée selon le type de mission (code 01–11) */
export const MISSION_TYPE_FOLDER_CODE: Partial<Record<MissionType, string>> = {
  DEVIS_CHIFFRAGE: "01",
  DOSSIER_SOUS_TRAITANT: "04",
  COMMANDES_BL_FOURNISSEURS: "05",
  COMPTE_RENDU_CHANTIER: "06",
  PLANNING_CHANTIER: "08",
  SITUATION_TRAVAUX: "09",
  DOE: "11",
  ADMINISTRATIF_CHANTIER: "02",
};
