/**
 * Expressions cibles pour le positionnement « partenaire / prestataire administratif externalisé »
 * (réutilisées dans layout, page d’accueil et pages vitrine).
 * Google utilise surtout le contenu et les titres ; ce champ `keywords` reste un signal secondaire.
 */

export const SEO_KEYWORDS_PARTENAIRE_CORE = [
  "partenaire administratif externalisé",
  "prestataire administratif externalisé",
  "externalisation administrative",
  "externalisation administrative PME",
  "externalisation administrative BTP",
  "sous-traitance administrative",
  "délégation administrative entreprise",
  "assistant administratif externalisé",
  "relais administratif entreprise",
] as const;

export const SEO_KEYWORDS_BTP_PME = [
  "administratif BTP",
  "pilotage administratif PME",
  "gestion administrative artisan",
  "entreprise du bâtiment administratif",
  "secrétariat externalisé BTP",
  "devis facturation chantier",
  "organisation administrative bâtiment",
  "retenue de garantie BTP",
  "devis BTP",
  "DPGF budget chantier",
  "plis techniques DCE BTP",
  "traçabilité chantier",
] as const;

/** Personae terrain & direction : complète les requêtes « qui » (CT, artisans, sous-traitance). */
export const SEO_KEYWORDS_PERSONAS_BTP = [
  "conducteur de travaux administratif",
  "conducteurs de travaux externalisation",
  "suivi administratif chantier",
  "coordination administrative chantier",
  "chef de chantier administratif",
  "artisans du bâtiment administratif",
  "TPE BTP gestion dossiers",
  "sous-traitant administratif chantier",
  "entreprises du bâtiment France",
  "secrétariat conducteur travaux",
] as const;

/** Signaux géographiques francophones (FR + Benelux + CH) sans pages locale dédiées : renforce intentions locales. */
export const SEO_KEYWORDS_GEO_SCOPE = [
  "externalisation administrative France",
  "administratif BTP Belgique",
  "prestataire administratif artisans Suisse",
  "organisation administrative BTP Luxembourg",
  "assistants francophones bâtiment",
  "Île-de-France BTP gestion bureau",
  "entreprise artisanale wallonie",
  "Suisse romande administratif chantier",
  "assistante travaux BTP distance France",
  "externalisation administrative PACA",
  "BTP relais administratif Auvergne-Rhône-Alpes",
  "artisan bâtiment Nouvelle-Aquitaine gestion",
  "conducteur de travaux Grand Est administratif",
  "externalisation administrative Occitanie",
  "gestion bureau chantier Hauts-de-France",
] as const;

/** Techniques & intention (conversion + entités reliées aux pages piliers). */
export const SEO_KEYWORDS_TECHNIQUE = [
  "relance devis BTP",
  "situation travaux artisan",
  "impayés chantier relances",
  "DICT travaux dossier",
  "avenants chantier suivi administratif",
  "logistique fournisseur chantier",
  "mémoires techniques AO",
  "conformité dossiers chantier",
] as const;

/** Liste fusionnée pour le layout racine (meta keywords — signal mineur mais cohérent avec le champ sémantique du site). */
export const SEO_KEYWORDS_GLOBAL: string[] = [
  ...SEO_KEYWORDS_PARTENAIRE_CORE,
  ...SEO_KEYWORDS_BTP_PME,
  ...SEO_KEYWORDS_PERSONAS_BTP,
  ...SEO_KEYWORDS_GEO_SCOPE,
  ...SEO_KEYWORDS_TECHNIQUE.slice(0, 6),
  "BeWork",
  "sans recruter",
  "forfait administratif TTC",
  "France Belgique Suisse Luxembourg",
  "Île-de-France administratif BTP",
  "rendez-vous découverte administratif",
  "assistant administratif IA BTP",
];

/** Meta keywords homepage : fusion optimisée (personae + géo + technique). */
export const SEO_KEYWORDS_HOME: string[] = [
  ...SEO_KEYWORDS_PARTENAIRE_CORE,
  ...SEO_KEYWORDS_BTP_PME,
  ...SEO_KEYWORDS_PERSONAS_BTP,
  ...SEO_KEYWORDS_GEO_SCOPE,
  ...SEO_KEYWORDS_TECHNIQUE,
  "agence pilotage administratif BTP",
  "secrétariat entreprise bâtiment",
  "situation de travaux administrative",
  "relances clients BTP",
  "sous-traitance administrative construction",
  "BeWork BTP",
  "vidéo présentation BeWork",
  "présentation agence administrative BTP",
  "conducteur de travaux France Belgique",
];

/** Phrases pour enrichir les descriptions (réutilisables en intro de meta). ≤ ~155 car. utiles en SERP. */
export const SEO_VALUE_PROPOSITION =
  "Assistants travaux pour le BTP : relais bureau-chantier, dossiers chantier et forfaits TTC clairs. France, Belgique, Suisse, Luxembourg.";

/** Proposition courte (OG, snippets secondaires). */
export const SEO_VALUE_PROPOSITION_SHORT =
  "Assistants travaux BTP : relais bureau-chantier et dossiers chantier. Forfaits TTC. FR · BE · CH · LU.";
