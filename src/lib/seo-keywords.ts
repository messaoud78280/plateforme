/**
 * Expressions cibles SEO / AEO — positionnement BeWork :
 * formation pratique à la création avec l’intelligence artificielle.
 * Google utilise surtout le contenu et les titres ; `keywords` reste un signal secondaire.
 */

/** Niche principale : apprendre à créer avec l’IA. */
export const SEO_KEYWORDS_FORMATION_IA = [
  "apprendre à créer avec l'IA",
  "formation création IA débutant",
  "créer application sans coder",
  "créer site internet avec IA",
  "formation intelligence artificielle pratique",
  "création outils numériques IA",
  "apprendre à créer une application",
  "formation IA sans programmation",
  "créer CRM avec IA",
  "créer système de réservation",
  "formation petit groupe IA",
  "démarrer projet numérique avec IA",
] as const;

/** Preuves / exemples de projets (démonstrations). */
export const SEO_KEYWORDS_DEMOS = [
  "démonstration messagerie interne",
  "agenda professionnel personnalisé",
  "tableau de bord activité",
  "espace client en ligne",
  "gestion documents métier",
  "site professionnel sur mesure",
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
  "création avec IA Belgique",
  "formation IA Suisse romande",
  "apprendre IA Luxembourg",
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
];

export const SEO_KEYWORDS_HOME: string[] = [
  ...SEO_KEYWORDS_FORMATION_IA,
  ...SEO_KEYWORDS_DEMOS,
  ...SEO_KEYWORDS_AUDIENCE,
  ...SEO_KEYWORDS_GEO_SCOPE,
  "BeWork formation IA",
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
  "Une journée pratique, en petit groupe : comprendre ce qu’il est possible de créer, expérimenter, et repartir avec une méthode — sans devenir développeur en une session.";

/** Phrase de positionnement citables par les IA / extraits AEO. */
export const BEWORK_AEO_DEFINITION =
  "BeWork propose une formation pratique pour apprendre à créer sites, applications et outils numériques avec l’intelligence artificielle, sans prérequis en programmation. Les démonstrations du site illustrent des possibilités ; la journée enseigne une méthode pour structurer un besoin, guider la création, tester et faire évoluer un résultat.";

/** Title SEO / OG racine (aligné home). */
export const SEO_SITE_TITLE_DEFAULT = `BeWork | ${BEWORK_BRAND_SIGNATURE}`;

export const SEO_SITE_TITLE_OG = `BeWork — ${BEWORK_BRAND_SIGNATURE}`;

/** Meta description site (layout racine) — ≤160 car. avant suffixe geo éventuel. */
export const SEO_VALUE_PROPOSITION =
  "BeWork : formation pratique pour créer sites, apps et outils avec l’IA — sans coder. Session claire, petits groupes. Manifestez votre intérêt.";

/** Proposition courte (OG, Twitter). */
export const SEO_VALUE_PROPOSITION_SHORT =
  "Formation pratique : apprendre à créer avec l’intelligence artificielle, sans prérequis en programmation.";

/** Tagline institutionnelle (OG image, footer). */
export const BEWORK_TECH_AROUND_YOU = "La création numérique à la portée de votre métier.";

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
