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
  "Conduite de travaux & pilotage TCE";

export const BEWORK_BRAND_INSTITUTIONAL =
  "Prestations de conduite de travaux. Pilotage TCE. Ingénierie opérationnelle.";

export const BEWORK_SLOGAN =
  "Des professionnels pour vos chantiers. Des méthodes pour vos performances. Des outils IA pour mieux piloter vos opérations.";

export const BEWORK_SLOGAN_DECISION =
  "Renforcez votre organisation avec des missions de conduite de travaux, d’encadrement opérationnel et de coordination TCE.";

export const BEWORK_AEO_DEFINITION =
  "BeWork propose des prestations de conduite de travaux externalisée, de pilotage de chantier et d’assistance aux marchés publics et privés, appuyées par une plateforme collaborative et des outils IA développés en interne.";

export const SEO_SITE_TITLE_DEFAULT =
  "BeWork | Conduite de travaux & pilotage TCE";

export const SEO_SITE_TITLE_OG =
  "BeWork — Conduite de travaux & pilotage TCE";

export const SEO_VALUE_PROPOSITION =
  "BeWork : conduite de travaux, pilotage TCE et assistance aux marchés. Plateforme collaborative et outils IA pour organiser délais, coûts et avancement.";

export const SEO_VALUE_PROPOSITION_SHORT =
  "Prestations de conduite de travaux et pilotage TCE, renforcées par une plateforme collaborative et des outils IA.";

export const BEWORK_TECH_AROUND_YOU =
  "Expertise terrain. Méthode. Outils IA pour le chantier.";

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
