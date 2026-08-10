/**
 * Expressions cibles SEO / AEO — positionnement BeWork :
 * concepteur de solutions IA sur mesure + plateformes métier pour le BTP.
 * Google utilise surtout le contenu et les titres ; `keywords` reste un signal secondaire.
 */

/** Niche principale : solutions IA sur mesure BTP. */
export const SEO_KEYWORDS_SOLUTIONS_IA = [
  "solutions IA sur mesure BTP",
  "conception solution IA BTP",
  "IA métier BTP",
  "automatisation BTP",
  "analyse documentaire BTP",
  "agent IA chantier",
  "assistant IA BTP",
  "intégration IA entreprise BTP",
  "outil métier IA BTP",
  "recherche intelligente documents BTP",
  "IA CCTP CCAP DCE",
  "technologie construite autour de l'entreprise",
] as const;

/** Plateforme BeWork — offre majeure et preuve de savoir-faire (conservée pour SEO). */
export const SEO_KEYWORDS_PLATEFORME = [
  "plateforme métier BTP",
  "plateforme interne BTP",
  "plateforme intelligente BTP",
  "plateformes internes intelligentes pour le BTP",
  "logiciel chantier BTP",
  "environnement numérique BTP",
  "outils IA BTP",
  "centralisation documents chantier",
  "pilotage chantier BTP",
  "gestion documentaire BTP",
  "workflow chantier BTP",
  "éditeur logiciel BTP",
] as const;

/**
 * Requêtes historiques « assistant travaux » — conservées pour capturer l’intention,
 * reformulées vers solutions IA + plateforme (pas exécution externalisée).
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

/** Partenaire de conception / déploiement / évolution. */
export const SEO_KEYWORDS_PARTENAIRE_CORE = [
  "partenaire technologique BTP",
  "concepteur solution IA BTP",
  "intégrateur IA BTP",
  "déploiement solution métier BTP",
  "accompagnement digitalisation BTP",
  "formation équipes IA BTP",
  "adoption outil IA entreprise",
  "évolution solution métier",
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
  "conducteur de travaux IA",
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
  "solutions IA BTP France",
  "plateforme BTP France",
  "IA chantier Belgique",
  "plateforme métier BTP Suisse",
  "organisation administrative BTP Luxembourg",
  "Île-de-France BTP gestion bureau",
  "BTP Wallonie IA",
  "Suisse romande digitalisation chantier",
  "plateforme BTP PACA",
  "BTP Auvergne-Rhône-Alpes outils",
  "conducteur de travaux Grand Est",
  "BTP Occitanie plateforme",
  "Hauts-de-France gestion chantier",
] as const;

/** Exécution de marché public (capacités plateforme / IA documentaire). */
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
  ...SEO_KEYWORDS_SOLUTIONS_IA,
  ...SEO_KEYWORDS_PLATEFORME,
  ...SEO_KEYWORDS_PARTENAIRE_CORE,
  ...SEO_KEYWORDS_BTP_PME,
  ...SEO_KEYWORDS_PERSONAS_BTP,
  ...SEO_KEYWORDS_GEO_SCOPE.slice(0, 8),
  ...SEO_KEYWORDS_TECHNIQUE.slice(0, 6),
  "BeWork",
  "étude besoin IA BTP",
  "France Belgique Suisse Luxembourg",
];

/** Marchés travaux — capacités plateforme / IA (pas prestation exécutante). */
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
  ...SEO_KEYWORDS_SOLUTIONS_IA,
  ...SEO_KEYWORDS_PLATEFORME,
  ...SEO_KEYWORDS_MARCHES_TRAVAUX,
  ...SEO_KEYWORDS_BTP_PME,
  ...SEO_KEYWORDS_PERSONAS_BTP,
  ...SEO_KEYWORDS_GEO_SCOPE,
  ...SEO_KEYWORDS_TECHNIQUE,
  "BeWork BTP",
];

/**
 * Signature courte officielle BeWork (header, titres SEO, OG, JSON-LD, llms.txt).
 */
export const BEWORK_BRAND_SIGNATURE = "Solutions IA sur mesure pour le BTP";

/** Signature institutionnelle (footer, clôture). */
export const BEWORK_BRAND_INSTITUTIONAL = "Plateformes métier. Solutions IA. Expertise BTP.";

/** Slogan BeWork — contenu, OG, JSON-LD, llms.txt. */
export const BEWORK_SLOGAN = "Vous imaginez le besoin. Nous concevons la solution.";

/** Accroche complémentaire (home / AEO). */
export const BEWORK_SLOGAN_DECISION =
  "Nous partons de votre métier, formons vos équipes et faisons évoluer la solution avec vous — jusqu’à l’usage réel au quotidien.";

/** Phrase de positionnement citables par les IA / extraits AEO. */
export const BEWORK_AEO_DEFINITION =
  "BeWork conçoit des solutions IA sur mesure et des plateformes métier pour les entreprises du BTP. Nous partons d’un problème, d’un processus, de documents ou d’outils existants, puis étudions et construisons la solution adaptée : applications, automatisations, assistants, analyse documentaire, intégrations ou environnement complet. La plateforme BeWork est une offre majeure et une démonstration de ce savoir-faire. Les équipes du client utilisent la solution ; BeWork conçoit, déploie, forme, accompagne et fait évoluer.";

/** Title SEO / OG racine (aligné home). */
export const SEO_SITE_TITLE_DEFAULT = `BeWork | ${BEWORK_BRAND_SIGNATURE}`;

export const SEO_SITE_TITLE_OG = `BeWork — ${BEWORK_BRAND_SIGNATURE}`;

/** Meta description site (layout racine) — ≤160 car. avant suffixe geo éventuel. */
export const SEO_VALUE_PROPOSITION =
  "BeWork : solutions IA sur mesure et plateformes métier pour le BTP. Expliquez votre besoin — conception, déploiement, formation. FR · BE · CH · LU.";

/** Proposition courte (OG, Twitter). */
export const SEO_VALUE_PROPOSITION_SHORT =
  "Solutions IA sur mesure et plateformes métier pour le BTP — conçues autour de votre entreprise.";

/** Tagline institutionnelle (OG image, footer). */
export const BEWORK_TECH_AROUND_YOU = "La technologie construite autour de votre entreprise.";
