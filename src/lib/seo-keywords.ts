/**
 * Expressions cibles SEO / AEO — positionnement BeWork :
 * conduite de travaux externalisée + équipes TP/VRD en régie (piliers),
 * ingénierie/marchés (complément), formation BTP (silo en développement).
 */

/** Niche principale : piliers commerciaux BTP. */
export const SEO_KEYWORDS_PLATFORM_IA = [
  "conducteur de travaux externalisé",
  "conducteur de travaux indépendant BTP",
  "conduite de travaux externalisée",
  "conduite de travaux en régie",
  "renfort conducteur de travaux",
  "prestation conducteur de travaux",
  "chef de chantier en régie",
  "chef de chantier externalisé",
  "équipe TP VRD en régie",
  "renfort équipe VRD",
  "maçon VRD en régie",
  "équipe TP VRD",
  "maçon VRD",
  "chef d’équipe VRD",
  "conducteur de travaux VRD",
  "conducteur de travaux TCE",
  "pilotage de chantier TCE",
  "gestion de chantier BTP",
  "coordination de travaux",
  "accompagnement technique chantier",
  "modes opératoires chantier",
  "assistance technique BTP",
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
  "mémoire technique BTP",
  "ingénierie BTP",
  "PME BTP",
  "entreprise générale",
  "entreprise VRD",
] as const;

export const SEO_KEYWORDS_FORMATION = [
  "formation professionnelle BTP sur chantier",
  "formation conducteur de travaux",
  "formation chef de chantier",
  "formation chef d’équipe TP/VRD",
  "formation compagnons chantier",
  "formation modes opératoires chantier",
] as const;

export const SEO_KEYWORDS_GEO_SCOPE = [
  "conduite de travaux Yvelines",
  "conducteur de travaux Yvelines",
  "équipe VRD Yvelines",
  "conduite de travaux Versailles",
  "conduite de travaux Saint-Quentin-en-Yvelines",
  "conduite de travaux Guyancourt",
  "pilotage chantier Île-de-France",
  "conducteur de travaux Île-de-France",
] as const;

export const SEO_KEYWORDS_GLOBAL: string[] = [
  ...SEO_KEYWORDS_PLATFORM_IA,
  ...SEO_KEYWORDS_DEMOS,
  ...SEO_KEYWORDS_AUDIENCE,
  ...SEO_KEYWORDS_FORMATION,
  ...SEO_KEYWORDS_GEO_SCOPE,
  "BeWork",
  "BeWork conduite de travaux",
  "BeWork équipes TP VRD",
];

export const SEO_KEYWORDS_HOME: string[] = [
  ...SEO_KEYWORDS_PLATFORM_IA,
  ...SEO_KEYWORDS_AUDIENCE,
  ...SEO_KEYWORDS_GEO_SCOPE.slice(0, 4),
  "BeWork conduite de travaux",
  "BeWork équipes TP VRD en régie",
];

export const BEWORK_BRAND_SIGNATURE =
  "Conduite de travaux externalisée & équipes TP/VRD en régie";

export const BEWORK_BRAND_INSTITUTIONAL =
  "Conduite de travaux externalisée. Équipes opérationnelles TP/VRD en régie. Ingénierie et marchés BTP.";

export const BEWORK_SLOGAN =
  "BeWork — Conduite de travaux externalisée et équipes opérationnelles BTP en régie.";

export const BEWORK_SLOGAN_DECISION =
  "Nous pilotons vos chantiers et renforçons vos équipes TP/VRD avec des professionnels expérimentés.";

export const BEWORK_AEO_DEFINITION =
  "BeWork accompagne les entreprises du BTP avec deux prestations principales : la conduite de travaux externalisée (conducteur, chef de chantier, pilotage et coordination) et des équipes opérationnelles TP/VRD en régie (chefs d’équipe, maçons VRD). L’ingénierie et l’assistance aux marchés publics et privés complètent l’offre. La formation professionnelle BTP sur chantier est en développement. Les outils numériques et l’IA sont utilisés en interne. Les missions sont contractualisées — BeWork n’est pas une entreprise de travail temporaire.";

export const SEO_SITE_TITLE_DEFAULT =
  "BeWork | Conduite de travaux externalisée & ingénierie BTP";

export const SEO_SITE_TITLE_OG =
  "BeWork | Conduite de travaux externalisée & ingénierie BTP";

export const SEO_VALUE_PROPOSITION =
  "BeWork accompagne les entreprises du BTP : conduite de travaux externalisée, équipes TP/VRD en régie, ingénierie, marchés publics et formation sur chantier.";

export const SEO_VALUE_PROPOSITION_SHORT =
  "Conduite de travaux externalisée, équipes TP/VRD en régie et ingénierie BTP — sur devis.";

export const BEWORK_TECH_AROUND_YOU =
  "Expertise terrain. Méthode. Renforts opérationnels au service du chantier.";

/** Alias historiques — évite les imports cassés ailleurs. */
export const SEO_KEYWORDS_SOLUTIONS_IA = SEO_KEYWORDS_PLATFORM_IA;
export const SEO_KEYWORDS_PLATEFORME = SEO_KEYWORDS_DEMOS;
export const SEO_KEYWORDS_PARTENAIRE_CORE = SEO_KEYWORDS_AUDIENCE;
export const SEO_KEYWORDS_BTP_PME = SEO_KEYWORDS_AUDIENCE;
export const SEO_KEYWORDS_PERSONAS_BTP = SEO_KEYWORDS_AUDIENCE;
export const SEO_KEYWORDS_TECHNIQUE = SEO_KEYWORDS_DEMOS;
export const SEO_KEYWORDS_MARCHES_TRAVAUX = SEO_KEYWORDS_AUDIENCE;
export const SEO_KEYWORDS_ASSISTANT_TRAVAUX = SEO_KEYWORDS_PLATFORM_IA;
export const SEO_KEYWORDS_APPELS_OFFRES = SEO_KEYWORDS_AUDIENCE;
export const SEO_KEYWORDS_CHANTIER_ADMIN = SEO_KEYWORDS_DEMOS;
export const SEO_KEYWORDS_MARCHES_PUBLIC_EXECUTION = SEO_KEYWORDS_AUDIENCE;
