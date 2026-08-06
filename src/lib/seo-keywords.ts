/**
 * Expressions cibles — positionnement éditeur / plateforme interne BTP.
 * Google utilise surtout le contenu et les titres ; `keywords` reste un signal secondaire.
 */

/** Niche principale : plateforme interne intelligente pour entreprises du BTP. */
export const SEO_KEYWORDS_PLATEFORME = [
  "plateforme interne BTP",
  "plateforme intelligente BTP",
  "éditeur plateforme BTP",
  "logiciel chantier BTP",
  "environnement numérique BTP",
  "plateforme métier BTP",
  "outils IA BTP",
  "IA spécialisée BTP",
  "centralisation documents chantier",
  "pilotage chantier BTP",
  "gestion documentaire BTP",
  "workflow chantier BTP",
] as const;

/**
 * Requêtes historiques « assistant travaux » — conservées pour capturer l’intention,
 * reformulées vers plateforme + outils IA pour les équipes du client (pas exécution externalisée).
 */
export const SEO_KEYWORDS_ASSISTANT_TRAVAUX = [
  "assistant travaux BTP",
  "assistante travaux BTP",
  "assistant conducteur de travaux",
  "assistant chef de chantier",
  "outils IA conducteur de travaux",
  "gestion administrative BTP",
  "documents chantier BTP",
  "plateforme assistant BTP",
  "assistant IA BTP",
  "aide administrative chantier",
] as const;

/** Partenaire d’évolution / intégrateur (remplace prestataire administratif externalisé). */
export const SEO_KEYWORDS_PARTENAIRE_CORE = [
  "partenaire technologique BTP",
  "intégrateur plateforme BTP",
  "éditeur logiciel BTP",
  "déploiement plateforme métier",
  "évolution plateforme chantier",
  "accompagnement digitalisation BTP",
  "configuration plateforme BTP",
  "maintenance plateforme métier",
] as const;

export const SEO_KEYWORDS_BTP_PME = [
  "administratif BTP",
  "pilotage administratif PME",
  "gestion administrative artisan",
  "entreprise du bâtiment administratif",
  "devis facturation chantier",
  "organisation administrative bâtiment",
  "retenue de garantie BTP",
  "devis BTP",
  "DPGF budget chantier",
  "plis techniques DCE BTP",
  "traçabilité chantier",
] as const;

/** Personae terrain & direction. */
export const SEO_KEYWORDS_PERSONAS_BTP = [
  "conducteur de travaux plateforme",
  "suivi administratif chantier",
  "coordination documentaire chantier",
  "chef de chantier documents",
  "artisans du bâtiment organisation",
  "TPE BTP gestion dossiers",
  "entreprises du bâtiment France",
  "dirigeant PME BTP digitalisation",
] as const;

/** Signaux géographiques francophones. */
export const SEO_KEYWORDS_GEO_SCOPE = [
  "plateforme BTP France",
  "logiciel chantier Belgique",
  "plateforme métier BTP Suisse",
  "organisation administrative BTP Luxembourg",
  "Île-de-France BTP gestion bureau",
  "BTP Wallonie plateforme",
  "Suisse romande digitalisation chantier",
  "plateforme BTP PACA",
  "BTP Auvergne-Rhône-Alpes outils",
  "conducteur de travaux Grand Est",
  "BTP Occitanie plateforme",
  "Hauts-de-France gestion chantier",
] as const;

/** Exécution de marché public (capacités plateforme). */
export const SEO_KEYWORDS_MARCHES_PUBLIC_EXECUTION = [
  "gestion marché public BTP",
  "suivi administratif accord-cadre travaux",
  "suivi documents exécution marché public",
  "facturation Chorus Pro travaux",
  "DOE marché public BTP",
  "suivi pénalités marché public travaux",
  "amiante SS4 logement occupé",
  "suivi réserves marché public",
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
  "conducteur de travaux débordé",
] as const;

/** Techniques & intention. */
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

/** Liste fusionnée layout racine. */
export const SEO_KEYWORDS_GLOBAL: string[] = [
  ...SEO_KEYWORDS_PLATEFORME,
  ...SEO_KEYWORDS_PARTENAIRE_CORE,
  ...SEO_KEYWORDS_BTP_PME,
  ...SEO_KEYWORDS_PERSONAS_BTP,
  ...SEO_KEYWORDS_GEO_SCOPE.slice(0, 8),
  ...SEO_KEYWORDS_TECHNIQUE.slice(0, 6),
  "BeWork",
  "mise en place plateforme BTP",
  "abonnement plateforme métier",
  "France Belgique Suisse Luxembourg",
  "démonstration plateforme BTP",
];

/** Marchés travaux — capacités plateforme (pas prestation exécutante). */
export const SEO_KEYWORDS_MARCHES_TRAVAUX = [
  "analyse DCE",
  "mémoire technique BTP",
  "suivi marché public travaux",
  "gestion accord-cadre BTP",
  "DOE chantier",
  "Chorus Pro travaux",
  "suivi réserves chantier",
  "préparation candidature marché public",
  "suivi administratif de marché",
  "marchés privés BTP",
  "accords-cadres BTP",
  "comptes rendus chantier",
  "situations travaux",
  "coordination documentaire chantier",
  "gestion administrative chantier",
  "aide appel d'offres BTP",
  ...SEO_KEYWORDS_MARCHES_PUBLIC_EXECUTION.slice(0, 6),
] as const;

export const SEO_KEYWORDS_HOME: string[] = [
  ...SEO_KEYWORDS_PLATEFORME,
  ...SEO_KEYWORDS_MARCHES_TRAVAUX,
  ...SEO_KEYWORDS_BTP_PME,
  ...SEO_KEYWORDS_PERSONAS_BTP,
  ...SEO_KEYWORDS_GEO_SCOPE,
  ...SEO_KEYWORDS_TECHNIQUE,
  "BeWork BTP",
];

/** Slogan BeWork — contenu, OG, JSON-LD, llms.txt. */
export const BEWORK_SLOGAN = "Vos équipes pilotent. BeWork équipe la plateforme.";

/** Accroche complémentaire (home / AEO). */
export const BEWORK_SLOGAN_DECISION =
  "BeWork construit et fait évoluer l’environnement numérique. Vous restez maître des opérations, des données et des décisions.";

/** Phrase de positionnement citables par les IA / extraits AEO. */
export const BEWORK_AEO_DEFINITION =
  "BeWork conçoit, déploie et fait évoluer des plateformes internes intelligentes pour les entreprises du BTP. Chaque solution repose sur un socle technologique commun, enrichi de modules, de workflows et d’outils IA adaptés à l’organisation du client. Les collaborateurs de l’entreprise utilisent la plateforme au quotidien, tandis que BeWork assure son hébergement, sa maintenance, sa sécurité et son évolution.";

/** Title SEO / OG racine (aligné home). */
export const SEO_SITE_TITLE_DEFAULT = "BeWork | Plateformes internes avec IA pour le BTP";

export const SEO_SITE_TITLE_OG =
  "BeWork — Plateformes internes intelligentes pour les entreprises du BTP";

/** Meta description site (layout racine) — ≤160 car. */
export const SEO_VALUE_PROPOSITION =
  "BeWork conçoit, déploie et fait évoluer des plateformes internes BTP : vos équipes les utilisent au quotidien. FR · BE · CH · LU.";

/** Proposition courte (OG, Twitter). */
export const SEO_VALUE_PROPOSITION_SHORT =
  "Plateformes internes BTP : socle BeWork, modules adaptés, IA métier, évolution continue. FR · BE · CH · LU.";
