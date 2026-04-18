/**
 * Expressions cibles pour le positionnement « partenaire / prestataire administratif externalisé »
 * (réutilisées dans layout, page d’accueil et pages vitrine).
 * Google utilise surtout le contenu et les titres ; ce champ `keywords` reste un signal secondaire.
 */

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
] as const;

/** Liste fusionnée pour le layout racine (meta keywords). */
export const SEO_KEYWORDS_GLOBAL: string[] = [
  ...SEO_KEYWORDS_PARTENAIRE_CORE,
  ...SEO_KEYWORDS_BTP_PME,
  "BeWork",
  "sans recruter",
  "forfait administratif TTC",
  "France Belgique Suisse Luxembourg",
  "Île-de-France administratif BTP",
  "rendez-vous découverte administratif",
  "assistant IA entreprise",
];

/** Phrases pour enrichir les descriptions (réutilisables en intro de meta). */
export const SEO_VALUE_PROPOSITION =
  "Partenaire administratif externalisé pour artisans et PME : pilotage administratif encadré (devis, facturation, relances, dossiers chantier) sans embauche.";
