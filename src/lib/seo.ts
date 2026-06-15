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
      answer: `${BEWORK_AEO_DEFINITION} Société française : assistance technique et administrative supervisée depuis la France, pour le bâtiment en France, Belgique, Suisse et Luxembourg.`,
    },
    {
      question: "À qui s’adresse BeWork ?",
      answer:
        "PME BTP, entreprises générales, artisans structurés, titulaires de marchés publics, répondants aux appels d’offres, conducteurs de travaux, chargés d’affaires et dirigeants qui veulent sécuriser dossiers, délais et rentabilité sans recruter.",
    },
    {
      question: "Quel problème BeWork résout-il ?",
      answer:
        "DCE à analyser, devis et chiffrages à préparer, marchés publics à suivre, relances MOE/MOA, réserves, DOE, facturation Chorus Pro et pénalités évitables — pendant que les équipes sont sur le terrain. BeWork structure le suivi sans remplacer vos validations techniques ni vos engagements.",
    },
    {
      question: "Quels services BeWork propose-t-il ?",
      answer:
        "Assistance aux appels d’offres (analyse DCE, mémoire technique, aide au chiffrage, dépôt électronique), suivi administratif et technique des chantiers (documents d’exécution, comptes rendus, relances), puis marchés publics et clôture (Chorus Pro, réserves, DOE, pénalités) — hub /assistants-administratifs-taches, /reponse-appel-offres-btp, /gestion-marche-public-btp, /facturation-chorus-pro-btp.",
    },
    {
      question: "Pourquoi faire confiance à BeWork ?",
      answer:
        "Expertise BTP terrain et administrative, IA spécialisée avec validation humaine, process cadré et traçabilité, gain de productivité sur les dossiers répétitifs et 100 % supervisé en France — tarifs publics sur bework.fr/tarifs. BeWork n’est pas un secrétariat généraliste ni un bureau d’études réglementé.",
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
        "Analyse DCE, aide au chiffrage, mémoires techniques, comptes rendus, suivi documentaire chantier, marchés publics (Chorus Pro, réserves, DOE), relances et coordination bureau-chantier — catalogue sur /assistants-administratifs-taches. BeWork ne remplace pas le conducteur de travaux.",
    },
  ] as const;
}
