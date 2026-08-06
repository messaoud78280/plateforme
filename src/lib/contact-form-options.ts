export const MARKET_TYPE_OPTIONS = [
  { value: "marche_public", label: "Marché public" },
  { value: "marche_prive", label: "Marché privé" },
  { value: "accord_cadre", label: "Accord-cadre" },
  { value: "contrat_recurrent", label: "Contrat récurrent" },
  { value: "autre", label: "Autre" },
] as const;

/** Besoins alignés plateforme / AO / suivi — labels vitrine (values stables pour historique formulaires). */
export const MAIN_NEED_OPTIONS = [
  { value: "preparation_candidature", label: "Préparation d’une candidature" },
  { value: "analyse_classement_dce", label: "Analyse et classement d’un DCE" },
  { value: "verification_pieces_admin", label: "Vérification des pièces administratives" },
  { value: "assistance_memoire_technique", label: "Assistance au mémoire technique" },
  { value: "preparation_reponse_ao", label: "Préparation d’une réponse à un appel d’offres" },
  { value: "suivi_echeances", label: "Suivi des échéances" },
  { value: "preparation_depot", label: "Préparation du dépôt" },
  { value: "suivi_apres_attribution", label: "Suivi administratif après attribution" },
  { value: "situations_chorus", label: "Situations et Chorus Pro" },
  { value: "reserves_doe", label: "Réserves et DOE" },
  { value: "renfort_admin_travaux", label: "Outiller l’admin travaux (plateforme)" },
  { value: "demarrage_chantier", label: "Démarrage de chantier" },
  { value: "conducteur_surcharge", label: "Conducteur de travaux surchargé / documents en retard" },
  { value: "autre", label: "Autre besoin à préciser" },
] as const;

/** Étape du prospect dans le cycle AO / marché (optionnel, joint au message). */
export const PROJECT_STAGE_OPTIONS = [
  { value: "recherche_opportunite", label: "Recherche d’une opportunité" },
  { value: "ao_identifie", label: "Appel d’offres identifié" },
  { value: "candidature_preparation", label: "Candidature en préparation" },
  { value: "reponse_en_cours", label: "Réponse en cours" },
  { value: "avant_depot", label: "Dossier avant dépôt" },
  { value: "marche_attribue", label: "Marché attribué" },
  { value: "chantier_en_cours", label: "Chantier en cours" },
  { value: "cloture_marche", label: "Clôture du marché" },
] as const;

export type MarketTypeValue = (typeof MARKET_TYPE_OPTIONS)[number]["value"];
export type MainNeedValue = (typeof MAIN_NEED_OPTIONS)[number]["value"];
export type ProjectStageValue = (typeof PROJECT_STAGE_OPTIONS)[number]["value"];

const marketLabels = Object.fromEntries(MARKET_TYPE_OPTIONS.map((o) => [o.value, o.label])) as Record<
  string,
  string
>;
const needLabels = Object.fromEntries(MAIN_NEED_OPTIONS.map((o) => [o.value, o.label])) as Record<string, string>;
const stageLabels = Object.fromEntries(PROJECT_STAGE_OPTIONS.map((o) => [o.value, o.label])) as Record<
  string,
  string
>;

export function labelMarketType(value: string): string {
  return marketLabels[value] ?? value;
}

export function labelMainNeed(value: string): string {
  return needLabels[value] ?? value;
}

export function labelProjectStage(value: string): string {
  return stageLabels[value] ?? value;
}
