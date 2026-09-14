/**
 * Expressions cibles SEO / AEO — positionnement BeWork :
 * formation pratique à la création avec l’intelligence artificielle.
 * Cette liste guide le contenu ; elle n’est pas émise en meta keywords (ignorée par Google).
 */
import { TRAINING_OFFERS } from "@/lib/bework-formation";

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
  "formation création numérique en français",
] as const;

/** Liste fusionnée layout racine. */
export const SEO_KEYWORDS_GLOBAL: string[] = [
  ...SEO_KEYWORDS_FORMATION_IA,
  ...SEO_KEYWORDS_DEMOS,
  ...SEO_KEYWORDS_AUDIENCE,
  ...SEO_KEYWORDS_GEO_SCOPE,
  "BeWork",
  "formation BeWork",
  "parcours BeWork",
];

export const SEO_KEYWORDS_HOME: string[] = [
  ...SEO_KEYWORDS_FORMATION_IA,
  ...SEO_KEYWORDS_AUDIENCE,
  "BeWork formation IA",
  "formation IA débutant 7 heures",
  "formation IA pratique 14 heures",
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
  "Un parcours pratique de 7 h ou 14 h, en petit groupe : apprendre à commencer, puis approfondir si vous le souhaitez — sans devenir développeur.";

/** Phrase de positionnement citables par les IA / extraits AEO. */
export const BEWORK_AEO_DEFINITION =
  "BeWork propose une formation progressive de 7 h ou 14 h pour apprendre à créer sites, applications et outils numériques avec l’intelligence artificielle, sans prérequis en programmation. Le Jour 1 apprend à commencer et continuer seul ; le Jour 2 permet de pratiquer davantage et de construire plus loin.";

/** Title SEO / OG racine (aligné home). */
export const SEO_SITE_TITLE_DEFAULT = "BeWork | Créer avec l’IA sans savoir coder";

export const SEO_SITE_TITLE_OG = "BeWork — Créer avec l’IA sans savoir coder";

/** Meta description site (layout racine) — ≤160 car. */
export const SEO_VALUE_PROPOSITION =
  `Apprenez à créer avec l’IA sans coder. Parcours ${TRAINING_OFFERS.essential.hours} h (${TRAINING_OFFERS.essential.price} €) ou ${TRAINING_OFFERS.complete.hours} h (${TRAINING_OFFERS.complete.price} €). Demandez une place BeWork.`;

/** Proposition courte (OG, Twitter). */
export const SEO_VALUE_PROPOSITION_SHORT =
  `Formation progressive pour créer avec l’IA sans coder : ${TRAINING_OFFERS.essential.hours} h ou ${TRAINING_OFFERS.complete.hours} h, dès ${TRAINING_OFFERS.essential.price} €.`;

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
