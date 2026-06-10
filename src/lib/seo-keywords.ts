/**
 * Expressions cibles pour le positionnement « partenaire / prestataire administratif externalisé »
 * (réutilisées dans layout, page d’accueil et pages vitrine).
 * Google utilise surtout le contenu et les titres ; ce champ `keywords` reste un signal secondaire.
 */

/** Positionnement « assistant travaux » (prioritaire sur secrétariat générique). */
export const SEO_KEYWORDS_ASSISTANT_TRAVAUX = [
  "assistant travaux augmenté par l’IA",
  "assistant travaux BTP",
  "assistante travaux BTP",
  "assistant conducteur de travaux",
  "assistant chef de chantier",
  "assistant chargé d’affaires BTP",
  "gestion administrative BTP",
  "externalisation administrative BTP",
  "relais bureau-chantier",
  "documents chantier BTP",
  "plateforme assistant BTP",
  "assistant IA BTP",
  "assistant virtuel BTP",
  "assistant MOA BTP",
  "assistant maîtrise d’ouvrage",
] as const;

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

/** Appels d'offres & marchés publics travaux. */
export const SEO_KEYWORDS_APPELS_OFFRES = [
  "réponse appel d'offres BTP",
  "réponse appel d'offres bâtiment",
  "aide réponse marché public BTP",
  "mémoire technique BTP",
  "analyse DCE",
  "analyse dossier consultation entreprise",
  "DPGF BTP",
  "BPU BTP",
  "DQE BTP",
  "marché public travaux",
  "dossier appel d'offres BTP",
  "appels d'offres artisans BTP",
  "appels d'offres PME bâtiment",
  "dépôt plateforme marché public",
  "gestion administrative marché public",
] as const;

/** Administratif chantier & facturation publique. */
export const SEO_KEYWORDS_CHANTIER_ADMIN = [
  "gestion administrative chantier",
  "gestion administrative BTP",
  "facturation Chorus Pro BTP",
  "situation de travaux",
  "DOE BTP",
  "PPSPS BTP",
  "DICT travaux",
  "compte rendu chantier",
  "relance impayé BTP",
  "suivi bons de commande travaux",
  "externalisation administrative BTP",
  "secrétariat BTP externalisé",
  "assistant chantier",
  "conducteur de travaux débordé",
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
  "forfait administratif HT",
  "France Belgique Suisse Luxembourg",
  "Île-de-France administratif BTP",
  "rendez-vous découverte administratif",
  "assistant administratif IA BTP",
];

/** Meta keywords homepage : fusion optimisée (personae + géo + technique). */
/** Marchés travaux — homepage repositionnée relais administratif. */
export const SEO_KEYWORDS_MARCHES_TRAVAUX = [
  "relais administratif marchés travaux",
  "gestion administrative marchés publics BTP",
  "assistant administratif BTP",
  "suivi administratif chantier",
  "marchés privés BTP",
  "accords-cadres BTP",
  "comptes rendus chantier",
  "situations travaux",
  "attachements travaux",
  "suivi donneurs d'ordre",
  "entreprises BTP titulaires de marchés",
  "dossiers d'intervention BTP",
  "DOE marché travaux",
  "coordination documentaire chantier",
] as const;

export const SEO_KEYWORDS_HOME: string[] = [
  ...SEO_KEYWORDS_MARCHES_TRAVAUX,
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

/** Slogan BeWork — réutilisable contenu, OG, JSON-LD, llms.txt. */
export const BEWORK_SLOGAN = "On tient le bureau, vous tenez le chantier.";

/** Meta description site (layout racine) — ~155 car., périmètre francophonie. */
export const SEO_VALUE_PROPOSITION =
  "Assistants travaux augmentés par l’IA pour le BTP : appels d’offres, devis, Chorus Pro, DOE, PPSPS et dossiers chantier. Relais bureau-chantier, forfaits HT. FR · BE · CH · LU.";

/** Proposition courte (OG, Twitter). */
export const SEO_VALUE_PROPOSITION_SHORT =
  "Assistants travaux augmentés par l’IA — relais bureau-chantier et documents chantier. Forfaits HT. France, Belgique, Suisse, Luxembourg.";
