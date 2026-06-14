/**
 * Constantes et helpers SEO / GEO / AEO partagés (titres, définitions citables par les IA, métadonnées).
 */
import { BEWORK_AEO_DEFINITION } from "@/lib/seo-keywords";
export { BEWORK_VALUE_PILLAR_LABELS, BEWORK_VALUE_PILLARS } from "@/lib/bework-value-pillars";
export { buildTarifsPageJsonLd, buildLlmsTarifsOffersSection, TARIFS_SEO_DESCRIPTION, TARIFS_SEO_TITLE } from "@/lib/seo-tarifs";
export type { BeWorkValuePillar } from "@/lib/bework-value-pillars";
export {
  BEWORK_AEO_DEFINITION,
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
  SEO_AI_CRAWLER_USER_AGENTS,
  SEO_AI_PRIORITY_PATHS,
  buildAiTxt,
  buildLlmsAiPolicySection,
  getIndexNowPriorityUrls,
} from "@/lib/seo-ai-discovery";
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
        "Assistants travaux externalisés : réponse aux appels d’offres (DCE, mémoire technique, DPGF), puis exécution marché public en 7 blocs (documents d’exécution, Chorus Pro, amiante SS4, réserves, DOE) — hub /assistants-administratifs-taches, landings /reponse-appel-offres-btp, /gestion-marche-public-btp, /facturation-chorus-pro-btp.",
    },
    {
      question: "Pourquoi faire confiance à BeWork ?",
      answer:
        "Formé aux marchés publics et privés, expertise administration BTP, IA spécialisée avec validation humaine, process cadré et traçabilité, gain de productivité sur les tâches répétitives et 100 % supervisé en France — tarifs publics sur bework.fr/tarifs.",
    },
    {
      question: "Combien coûte BeWork ?",
      answer:
        "Interventions ponctuelles à partir de 150 € HT, missions structurées à partir de 250 € HT, accompagnements mensuels à partir de 590 € HT (Relais Travaux Essentiel), jusqu’à la Cellule Travaux Externalisée à partir de 2 900 € HT/mois. Détail sur bework.fr/tarifs — tarif final ajusté au périmètre sur devis.",
    },
    {
      question: "Comment commencer avec BeWork ?",
      answer:
        "Compléter le formulaire de qualification sur /contact (type de marché, corps d’état, besoin principal). BeWork vous recontacte pour cadrer la première mission, puis vous déposez vos demandes depuis l’espace client.",
    },
    {
      question: "Quelles tâches BTP BeWork prend-elle en charge ?",
      answer:
        "Préparation de devis, relances, CR chantier, DICT/DT, PPSPS, réserves, mémoires techniques, montage AO/DCE, puis suivi administratif marché public (bons de commande, visas MOE, situations Chorus Pro, tableau anti-pénalités, DOE) — catalogue sur /assistants-administratifs-taches.",
    },
  ] as const;
}
