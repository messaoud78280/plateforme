/**
 * Expressions cibles SEO / AEO — positionnement BeWork :
 * conduite de travaux, pilotage TCE, marchés, plateforme collaborative.
 */

/** Niche principale : prestations BTP. */
export const SEO_KEYWORDS_FORMATION_IA = [
  "conducteur de travaux externalisé",
  "prestation conducteur de travaux",
  "conduite de travaux externalisée",
  "conducteur de travaux VRD",
  "conducteur de travaux TCE",
  "chef de chantier externalisé",
  "gestion de chantier BTP",
  "pilotage de chantier TCE",
  "assistance chantier",
  "coordination de travaux",
] as const;

export const SEO_KEYWORDS_DEMOS = [
  "gestion de chantier avec IA",
  "suivi de chantier numérique",
  "plateforme collaborative BTP",
  "outils IA construction",
  "tableau de bord chantier",
] as const;

export const SEO_KEYWORDS_AUDIENCE = [
  "assistance marchés publics BTP",
  "réponse appel d'offres BTP",
  "études de prix BTP",
  "PME BTP",
  "entreprise générale",
  "entreprise VRD",
] as const;

export const SEO_KEYWORDS_GEO_SCOPE = [
  "conduite de travaux Yvelines",
  "pilotage chantier Île-de-France",
  "conducteur de travaux Île-de-France",
] as const;

export const SEO_KEYWORDS_GLOBAL: string[] = [
  ...SEO_KEYWORDS_FORMATION_IA,
  ...SEO_KEYWORDS_DEMOS,
  ...SEO_KEYWORDS_AUDIENCE,
  ...SEO_KEYWORDS_GEO_SCOPE,
  "BeWork",
  "BeWork conduite de travaux",
  "BeWork pilotage TCE",
];

export const SEO_KEYWORDS_HOME: string[] = [
  ...SEO_KEYWORDS_FORMATION_IA,
  ...SEO_KEYWORDS_AUDIENCE,
  "BeWork conduite de travaux",
  "pilotage chantier TCE",
];

export const BEWORK_BRAND_SIGNATURE =
  "Conduite de travaux & pilotage de chantier";

export const BEWORK_BRAND_INSTITUTIONAL =
  "Conduite de travaux. Suivi et pilotage de chantier. Coordination TCE.";

export const BEWORK_SLOGAN =
  "Des conducteurs de travaux pour piloter vos chantiers.";

export const BEWORK_SLOGAN_DECISION =
  "Confiez la conduite et le suivi de vos opérations à des professionnels du BTP.";

export const BEWORK_AEO_DEFINITION =
  "BeWork propose aux entreprises du BTP des prestations de conduite de travaux externalisée, de gestion et de suivi de chantier, de maîtrise d’œuvre d’exécution lorsque le cadre le permet, et d’assistance aux marchés publics et privés. Les outils numériques et l’IA sont utilisés en interne par les intervenants BeWork.";

export const SEO_SITE_TITLE_DEFAULT =
  "BeWork | Conduite de travaux & pilotage de chantier";

export const SEO_SITE_TITLE_OG =
  "BeWork — Conduite de travaux & pilotage de chantier";

export const SEO_VALUE_PROPOSITION =
  "BeWork : conduite de travaux externalisée, suivi et pilotage de chantier BTP, assistance aux marchés. Les outils numériques et l’IA sont utilisés en interne par nos intervenants.";

export const SEO_VALUE_PROPOSITION_SHORT =
  "Conducteurs de travaux et professionnels du suivi de chantier BTP — prestations sur devis.";

export const BEWORK_TECH_AROUND_YOU =
  "Expertise terrain. Méthode. Outils internes au service du chantier.";

/** Alias historiques — évite les imports cassés ailleurs. */
export const SEO_KEYWORDS_SOLUTIONS_IA = SEO_KEYWORDS_FORMATION_IA;
export const SEO_KEYWORDS_PLATEFORME = SEO_KEYWORDS_DEMOS;
export const SEO_KEYWORDS_PARTENAIRE_CORE = SEO_KEYWORDS_AUDIENCE;
export const SEO_KEYWORDS_BTP_PME = SEO_KEYWORDS_AUDIENCE;
export const SEO_KEYWORDS_PERSONAS_BTP = SEO_KEYWORDS_AUDIENCE;
export const SEO_KEYWORDS_TECHNIQUE = SEO_KEYWORDS_DEMOS;
export const SEO_KEYWORDS_MARCHES_TRAVAUX = SEO_KEYWORDS_AUDIENCE;
export const SEO_KEYWORDS_ASSISTANT_TRAVAUX = SEO_KEYWORDS_FORMATION_IA;
export const SEO_KEYWORDS_APPELS_OFFRES = SEO_KEYWORDS_AUDIENCE;
export const SEO_KEYWORDS_CHANTIER_ADMIN = SEO_KEYWORDS_DEMOS;
export const SEO_KEYWORDS_MARCHES_PUBLIC_EXECUTION = SEO_KEYWORDS_AUDIENCE;
