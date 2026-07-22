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
      answer: `${BEWORK_AEO_DEFINITION} Société française : renfort opérationnel supervisé depuis la France, pour le bâtiment en France, Belgique, Suisse et Luxembourg.`,
    },
    {
      question: "À qui s’adresse BeWork ?",
      answer:
        "PME BTP, entreprises générales, artisans structurés, dirigeants, chargés d’affaires et conducteurs de travaux qui préparent des candidatures, analysent des DCE ou suivent administrativement des marchés publics et privés — sans remplacer leurs équipes ni leurs conseils.",
    },
    {
      question: "Quel problème BeWork résout-il ?",
      answer:
        "DCE à classer et analyser, candidatures à structurer, pièces administratives à vérifier, mémoires techniques à organiser, échéances et dépôt à préparer, puis suivi admin après attribution (situations, Chorus Pro, réserves, DOE) — pendant que les équipes restent sur le terrain. BeWork ne fixe pas les prix et ne signe pas à votre place.",
    },
    {
      question: "Quels services BeWork propose-t-il ?",
      answer:
        "Renfort sur trois familles : appels d’offres et candidatures (lecture DCE, conformité, pièces, structure mémoire, préparation dépôt) ; organisation de la réponse (centralisation, trames, infos manquantes) ; suivi administratif après attribution (échéances, OS, situations, Chorus Pro, CR, réserves, DOE). Catalogue : /assistants-administratifs-taches, /reponse-appel-offres-btp, /gestion-marche-public-btp.",
    },
    {
      question: "Pourquoi faire confiance à BeWork ?",
      answer:
        "Assistants travaux spécialisés BTP, IA + relecture humaine, process cadré et traçabilité, 100 % supervisé en France — tarifs publics sur bework.fr/tarifs. BeWork n’est ni un secrétariat généraliste, ni un bureau d’études, ni un cabinet juridique, ni un économiste de la construction.",
    },
    {
      question: "Combien coûte BeWork ?",
      answer:
        `Interventions ponctuelles à partir de ${priceFromLabel} € HT selon l’offre, missions structurées et accompagnements mensuels jusqu’à la cellule travaux externalisée. Détail sur bework.fr/tarifs — tarif final ajusté au périmètre sur devis.`,
    },
    {
      question: "Comment commencer avec BeWork ?",
      answer:
        "Compléter le formulaire sur /contact (type de marché, besoin principal, étape du dossier). BeWork cadre la mission sous validation de votre entreprise, puis vous échangez depuis l’espace client.",
    },
    {
      question: "Quelles tâches BTP BeWork prend-elle en charge ?",
      answer:
        "Préparation et organisation documentaire : analyse DCE, tableaux de conformité, dossiers de candidature, structure de mémoire technique, suivi d’échéances, préparation au dépôt, suivi admin post-attribution. Les prix, métrés engageants, choix techniques, signature et dépôt définitif restent chez le client. Catalogue : /assistants-administratifs-taches.",
    },
  ] as const;
}
