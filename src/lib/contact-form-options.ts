export const MARKET_TYPE_OPTIONS = [
  { value: "1_5", label: "1 à 5 collaborateurs" },
  { value: "6_20", label: "6 à 20 collaborateurs" },
  { value: "21_50", label: "21 à 50 collaborateurs" },
  { value: "51_plus", label: "Plus de 50 collaborateurs" },
  { value: "autre", label: "Autre / à préciser" },
] as const;

/** Besoins plateforme — values stables pour historique formulaires (réinterprétées). */
export const MAIN_NEED_OPTIONS = [
  { value: "preparation_candidature", label: "Gestion des chantiers" },
  { value: "analyse_classement_dce", label: "Communication interne" },
  { value: "verification_pieces_admin", label: "Gestion documentaire" },
  { value: "assistance_memoire_technique", label: "Marchés publics et privés" },
  { value: "preparation_reponse_ao", label: "Analyse CCTP / CCAP" },
  { value: "suivi_echeances", label: "Comptes rendus" },
  { value: "preparation_depot", label: "IA documentaire" },
  { value: "suivi_apres_attribution", label: "Tâches et validations" },
  { value: "situations_chorus", label: "Réserves et DOE" },
  { value: "reserves_doe", label: "Tableaux de bord" },
  { value: "renfort_admin_travaux", label: "Suivi financier" },
  { value: "demarrage_chantier", label: "Fournisseurs / sous-traitants" },
  { value: "conducteur_surcharge", label: "Déploiement plateforme complète" },
  { value: "autre", label: "Autre besoin à préciser" },
] as const;

/** Outils actuels (réutilise le champ projectStage côté API). */
export const PROJECT_STAGE_OPTIONS = [
  { value: "recherche_opportunite", label: "Email / messagerie" },
  { value: "ao_identifie", label: "WhatsApp / SMS" },
  { value: "candidature_preparation", label: "Excel / tableurs" },
  { value: "reponse_en_cours", label: "Drive / SharePoint" },
  { value: "avant_depot", label: "ERP / logiciel métier" },
  { value: "marche_attribue", label: "Logiciel chantier" },
  { value: "chantier_en_cours", label: "Plusieurs outils dispersés" },
  { value: "cloture_marche", label: "Autre" },
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
  if (needLabels[value]) return needLabels[value];
  // Intents formulaire « idée » (homepage repositionnée)
  const ideaLabels: Record<string, string> = {
    automatiser_processus: "Automatiser un processus",
    exploiter_documents_ia: "Exploiter mes documents avec l'IA",
    creer_outil_metier: "Créer un outil métier",
    connecter_logiciels: "Connecter mes logiciels",
    creer_plateforme: "Créer une plateforme",
    decouvrir_bework: "Découvrir BeWork",
    ne_sais_pas_encore: "Je ne sais pas encore",
  };
  return ideaLabels[value] ?? value;
}

export function labelProjectStage(value: string): string {
  return stageLabels[value] ?? value;
}
