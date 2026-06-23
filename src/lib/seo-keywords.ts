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
  "assistance technique et administrative BTP",
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
  "assistance travaux entreprise",
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
  "BTP assistance travaux Auvergne-Rhône-Alpes",
  "artisan bâtiment Nouvelle-Aquitaine gestion",
  "conducteur de travaux Grand Est administratif",
  "externalisation administrative Occitanie",
  "gestion bureau chantier Hauts-de-France",
] as const;

/** Exécution de marché public après attribution (7 blocs BeWork). */
export const SEO_KEYWORDS_MARCHES_PUBLIC_EXECUTION = [
  "gestion administrative marché public BTP",
  "assistant travaux marché public",
  "suivi administratif accord-cadre travaux",
  "suivi documents exécution marché public",
  "facturation Chorus Pro travaux",
  "DOE marché public BTP",
  "suivi pénalités marché public travaux",
  "amiante SS4 logement occupé",
  "suivi réserves marché public",
  "assistant conducteur de travaux marché public",
  "tableau anti-pénalités marché public",
  "bons de commande accord-cadre BTP",
  "milieu occupé marché public travaux",
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
  "suivi administratif accord-cadre travaux",
  "suivi réserves marché public",
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
/** Marchés travaux — homepage & signaux SEO globaux assistance technique BTP. */
export const SEO_KEYWORDS_MARCHES_TRAVAUX = [
  "assistant travaux BTP",
  "assistance technique BTP",
  "assistant conducteur de travaux",
  "gestion administrative chantier",
  "aide appel d'offres BTP",
  "analyse DCE",
  "mémoire technique BTP",
  "suivi marché public travaux",
  "gestion accord-cadre BTP",
  "DOE chantier",
  "Chorus Pro travaux",
  "suivi réserves chantier",
  "assistance administrative marchés travaux",
  "gestion administrative marchés publics BTP",
  "suivi administratif chantier",
  "marchés privés BTP",
  "accords-cadres BTP",
  "comptes rendus chantier",
  "situations travaux",
  "coordination documentaire chantier",
  ...SEO_KEYWORDS_MARCHES_PUBLIC_EXECUTION.slice(0, 6),
] as const;

export const SEO_KEYWORDS_HOME: string[] = [
  ...SEO_KEYWORDS_MARCHES_TRAVAUX,
  ...SEO_KEYWORDS_PARTENAIRE_CORE,
  ...SEO_KEYWORDS_BTP_PME,
  ...SEO_KEYWORDS_PERSONAS_BTP,
  ...SEO_KEYWORDS_GEO_SCOPE,
  ...SEO_KEYWORDS_TECHNIQUE,
  "aide au chiffrage BTP",
  "assistance à conduite de travaux",
  "BeWork BTP",
  "vidéo présentation BeWork",
  "conducteur de travaux France Belgique",
];

/** Slogan BeWork — réutilisable contenu, OG, JSON-LD, llms.txt. */
export const BEWORK_SLOGAN = "On tient le bureau, vous tenez le chantier.";

/** Phrase de positionnement citables par les IA / extraits AEO. */
export const BEWORK_AEO_DEFINITION =
  "BeWork est une plateforme d’assistants travaux augmentés par l’IA pour les entreprises du BTP : assistance technique et administrative pour appels d’offres, analyse DCE, aide au chiffrage, mémoire technique, suivi de chantier, marchés publics, Chorus Pro, DOE, réserves et coordination documentaire terrain ↔ bureau.";

/** Meta description site (layout racine) — ~155 car., périmètre francophonie. */
export const SEO_VALUE_PROPOSITION =
  "Assistance technique et administrative BTP par assistants travaux IA : appels d'offres, DCE, mémoire technique, chantier, marchés publics, Chorus Pro, DOE. On tient le bureau, vous tenez le chantier — forfaits HT. FR · BE · CH · LU.";

/** Proposition courte (OG, Twitter). */
export const SEO_VALUE_PROPOSITION_SHORT =
  "Assistants travaux augmentés par l’IA — assistance technique et administrative BTP. Forfaits HT. France, Belgique, Suisse, Luxembourg.";
