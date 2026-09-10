/**
 * Expressions cibles SEO / AEO — positionnement BeWork :
 * formation pratique à la création avec l’intelligence artificielle.
 * Google utilise surtout le contenu et les titres ; `keywords` reste un signal secondaire.
 */

/** Niche principale : apprendre à créer avec l’IA (intentions de recherche). */
export const SEO_KEYWORDS_FORMATION_IA = [
  "créer avec l'IA sans coder",
  "formation IA débutant",
  "créer application sans programmer",
  "créer site internet avec IA",
  "formation intelligence artificielle pratique",
  "apprendre à créer avec l'IA",
  "formation créer outils numériques",
  "formation IA une journée",
  "créer CRM avec IA",
  "créer système de réservation IA",
  "devenir autonome avec l'IA",
  "passer de l'idée au projet numérique",
] as const;

/** Preuves / exemples de projets (démonstrations). */
export const SEO_KEYWORDS_DEMOS = [
  "démonstration messagerie interne",
  "exemple agenda professionnel IA",
  "exemple CRM créé avec IA",
  "démonstration tableau de bord",
  "espace client démonstration",
  "créer outil métier avec IA",
] as const;

/** Publics cibles. */
export const SEO_KEYWORDS_AUDIENCE = [
  "formation IA entrepreneurs",
  "formation IA artisans",
  "formation IA indépendants",
  "formation IA TPE PME",
  "formation IA porteurs de projet",
  "créer outil métier sans développeur",
] as const;

/** Signaux géographiques francophones (conservés, reformulés). */
export const SEO_KEYWORDS_GEO_SCOPE = [
  "formation IA France",
  "formation créer avec IA Belgique",
  "formation IA Suisse romande",
  "formation IA Luxembourg",
  "formation création numérique francophone",
] as const;

/** Liste fusionnée layout racine. */
export const SEO_KEYWORDS_GLOBAL: string[] = [
  ...SEO_KEYWORDS_FORMATION_IA,
  ...SEO_KEYWORDS_DEMOS,
  ...SEO_KEYWORDS_AUDIENCE,
  ...SEO_KEYWORDS_GEO_SCOPE,
  "BeWork",
  "formation BeWork",
  "journée BeWork",
];

export const SEO_KEYWORDS_HOME: string[] = [
  ...SEO_KEYWORDS_FORMATION_IA,
  ...SEO_KEYWORDS_AUDIENCE,
  "BeWork formation IA",
  "en une journée apprendre à créer",
];

/**
 * Signature courte officielle BeWork (header, titres SEO, OG, JSON-LD).
 */
export const BEWORK_BRAND_SIGNATURE = "Créer à l’ère de l’IA";

/** Signature institutionnelle (footer, clôture). */
export const BEWORK_BRAND_INSTITUTIONAL = "Formation pratique. Création avec l’IA. Méthode réutilisable.";

/** Slogan BeWork — contenu, OG, JSON-LD. */
export const BEWORK_SLOGAN = "Vous avez une idée. Nous vous apprenons à la construire avec l’IA.";

/** Accroche complémentaire (home / AEO). */
export const BEWORK_SLOGAN_DECISION =
  "Une journée pratique, en petit groupe : comprendre ce qu’il est possible de créer, expérimenter, et repartir capable de commencer — sans devenir développeur.";

/** Phrase de positionnement citables par les IA / extraits AEO. */
export const BEWORK_AEO_DEFINITION =
  "BeWork propose une formation pratique d’une journée pour apprendre à créer sites, applications et outils numériques avec l’intelligence artificielle, sans prérequis en programmation. Le site montre ce qu’il est possible de réaliser ; la journée enseigne comment structurer un besoin, guider la création, tester et continuer.";

/** Title SEO / OG racine (aligné home). */
export const SEO_SITE_TITLE_DEFAULT = "BeWork | Créer avec l’IA sans savoir coder";

export const SEO_SITE_TITLE_OG = "BeWork — Créer avec l’IA sans savoir coder";

/** Meta description site (layout racine) — ≤160 car. */
export const SEO_VALUE_PROPOSITION =
  "En une journée, apprenez à créer sites, apps et outils avec l’IA — sans coder. Méthode pratique, petit groupe, 200 €. Demandez une place BeWork.";

/** Proposition courte (OG, Twitter). */
export const SEO_VALUE_PROPOSITION_SHORT =
  "Formation pratique : créer avec l’IA sans savoir coder. Une journée, petits groupes, 200 €.";

/** Tagline institutionnelle (OG image, footer). */
export const BEWORK_TECH_AROUND_YOU = "Sans savoir coder. Créez ce que vous imaginez.";

/** Alias historiques — évite les imports cassés ailleurs (orientés formation). */
export const SEO_KEYWORDS_SOLUTIONS_IA = SEO_KEYWORDS_FORMATION_IA;
export const SEO_KEYWORDS_PLATEFORME = SEO_KEYWORDS_DEMOS;
export const SEO_KEYWORDS_PARTENAIRE_CORE = SEO_KEYWORDS_AUDIENCE;
export const SEO_KEYWORDS_BTP_PME = SEO_KEYWORDS_AUDIENCE;
export const SEO_KEYWORDS_PERSONAS_BTP = SEO_KEYWORDS_AUDIENCE;
export const SEO_KEYWORDS_TECHNIQUE = SEO_KEYWORDS_DEMOS;
export const SEO_KEYWORDS_MARCHES_TRAVAUX = SEO_KEYWORDS_FORMATION_IA;
export const SEO_KEYWORDS_ASSISTANT_TRAVAUX = SEO_KEYWORDS_FORMATION_IA;
export const SEO_KEYWORDS_APPELS_OFFRES = SEO_KEYWORDS_FORMATION_IA;
export const SEO_KEYWORDS_CHANTIER_ADMIN = SEO_KEYWORDS_DEMOS;
export const SEO_KEYWORDS_MARCHES_PUBLIC_EXECUTION = SEO_KEYWORDS_DEMOS;
