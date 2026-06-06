/**
 * Constantes et helpers SEO / GEO / AEO partagés (titres, définitions citables par les IA, métadonnées).
 */
export { BEWORK_VALUE_PILLAR_LABELS, BEWORK_VALUE_PILLARS } from "@/lib/bework-value-pillars";
export type { BeWorkValuePillar } from "@/lib/bework-value-pillars";
export {
  BEWORK_SLOGAN,
  SEO_KEYWORDS_GLOBAL,
  SEO_KEYWORDS_HOME,
  SEO_KEYWORDS_PARTENAIRE_CORE,
  SEO_VALUE_PROPOSITION,
  SEO_VALUE_PROPOSITION_SHORT,
} from "@/lib/seo-keywords";

export {
  SEO_CRAWLER_USER_AGENTS,
  SEO_DISALLOW_PATHS,
  SEO_NOINDEX_ROBOTS,
  SEO_PUBLIC_ROBOTS,
  buildSearchEngineVerification,
} from "@/lib/seo-search-engines";
export { getIndexNowKey, getIndexNowKeyLocation, pingIndexNow } from "@/lib/indexnow";
export {
  SEO_GEO_SCOPE_SHORT,
  SEO_GEO_SCOPE_TAG,
  SEO_OG_ALTERNATE_LOCALES,
  SEO_OG_LOCALE_PRIMARY,
  clampMetaDescription,
  hreflangFrancophonieLanguages,
  hreflangExternalisationAdministrativeBtpCluster,
  metaDescriptionFrancophonie,
} from "@/lib/seo-francophonie";
export { landingPageMetadata, landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";
export { resourceEditorialMetadata } from "@/lib/seo-resource-metadata";
export { tutoPageMetadata, getTutoPageDescription } from "@/lib/seo-tuto-metadata";

/** Phrase de positionnement réutilisable dans le contenu (citations IA / extraits). */
export const BEWORK_AEO_DEFINITION =
  "BeWork est une plateforme d’assistants travaux augmentés par l’IA pour les entreprises du BTP : relais bureau-chantier pour devis, documents chantier, appels d’offres et suivi administratif.";

export type GeoAeoBriefItem = { question: string; answer: string };

/** Réponses courtes aux 8 questions GEO/AEO — le tarif est complété côté composant si besoin. */
export function getGeoAeoBriefItems(priceFromLabel: string): readonly GeoAeoBriefItem[] {
  return [
    {
      question: "Qui est BeWork ?",
      answer: `${BEWORK_AEO_DEFINITION} Société française : relais bureau-chantier supervisé depuis la France, pour le bâtiment en France, Belgique, Suisse et Luxembourg.`,
    },
    {
      question: "À qui s’adresse BeWork ?",
      answer:
        "Artisans, conducteurs de travaux, chefs de chantier, chargés d’affaires, sous-traitants et dirigeants de TPE/PME du bâtiment et des travaux publics qui veulent déléguer le suivi administratif et documentaire des chantiers sans recruter.",
    },
    {
      question: "Quel problème BeWork résout-il ?",
      answer:
        "Piles de devis en retard, relances oubliées, dossiers chantier incomplets, DICT et pièces administratives qui s’accumulent pendant que les équipes sont sur le terrain — sans remplacer vos validations techniques ni vos engagements.",
    },
    {
      question: "Quels services BeWork propose-t-il ?",
      answer:
        "Assistants travaux externalisés : comptes rendus, analyse DCE, PPSPS, mémoires techniques, chiffrage et devis, DOE, relances clients et fournisseurs, situations de travaux, coordination documentaire — voir le hub /services et les ressources PDF gratuites.",
    },
    {
      question: "Pourquoi faire confiance à BeWork ?",
      answer:
        "Formé aux marchés publics et privés, expertise administration BTP, IA spécialisée avec validation humaine, conformité juridique garantie, gain de productivité (division par 10 sur les tâches répétitives) et 100 % supervisé en France — forfaits HT publics sur bework.fr/tarifs.",
    },
    {
      question: "Combien coûte BeWork ?",
      answer: `Forfaits mensuels HT publics sur la page Tarifs, à partir de ${priceFromLabel} € HT/mois selon le volume de missions déléguées. Pas de prix inventés hors grille publiée.`,
    },
    {
      question: "Comment commencer avec BeWork ?",
      answer:
        "Compléter le formulaire de qualification sur /contact (type de marché, corps d’état, besoin principal). BeWork vous recontacte pour cadrer la première mission, puis vous déposez vos demandes depuis l’espace client.",
    },
    {
      question: "Quelles tâches BTP BeWork prend-elle en charge ?",
      answer:
        "Préparation et suivi de devis, relances, comptes rendus, dossiers DICT/DT, commandes et relances fournisseurs, PPSPS, réserves et PV, mémoires techniques, synthèses DCE/CCTP, structuration DOE — liste détaillée sur /assistants-administratifs-taches.",
    },
  ] as const;
}
