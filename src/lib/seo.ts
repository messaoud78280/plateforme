/**
 * Constantes et helpers SEO / GEO / AEO partagés (titres, définitions citables par les IA, métadonnées).
 */
import { BEWORK_AEO_DEFINITION, BEWORK_BRAND_SIGNATURE } from "@/lib/seo-keywords";
export { BEWORK_VALUE_PILLAR_LABELS, BEWORK_VALUE_PILLARS } from "@/lib/bework-value-pillars";
export { buildTarifsPageJsonLd, buildLlmsTarifsOffersSection, TARIFS_SEO_DESCRIPTION, TARIFS_SEO_TITLE } from "@/lib/seo-tarifs";
export type { BeWorkValuePillar } from "@/lib/bework-value-pillars";
export {
  BEWORK_AEO_DEFINITION,
  BEWORK_BRAND_SIGNATURE,
  BEWORK_SLOGAN,
  BEWORK_SLOGAN_DECISION,
  SEO_KEYWORDS_GLOBAL,
  SEO_KEYWORDS_HOME,
  SEO_KEYWORDS_PARTENAIRE_CORE,
  SEO_SITE_TITLE_DEFAULT,
  SEO_SITE_TITLE_OG,
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

/** Réponses courtes aux questions GEO/AEO — positionnement commercial BTP. */
export function getGeoAeoBriefItems(_priceFromLabel?: string): readonly GeoAeoBriefItem[] {
  return [
    {
      question: "Qui est BeWork ?",
      answer: `BeWork — ${BEWORK_BRAND_SIGNATURE}. ${BEWORK_AEO_DEFINITION} Société française établie à Guyancourt (Yvelines).`,
    },
    {
      question: "À qui s’adresse BeWork ?",
      answer:
        "Aux entreprises du BTP — PME, entreprises générales, dirigeants d’exploitation — qui ont besoin de renforcer leur encadrement chantier ou leur réponse aux marchés.",
    },
    {
      question: "Quel problème BeWork résout-il ?",
      answer:
        "Manque de conducteur de travaux, coordination TCE difficile, visibilité insuffisante sur délais et coûts, préparation de marchés à structurer — via des missions contractualisées et des outils numériques internes.",
    },
    {
      question: "Quels services BeWork propose-t-il ?",
      answer:
        "Conduite de travaux, chef de chantier, direction de travaux, pilotage TCE, audit de chantier, assistance marchés publics et privés, études de prix — appuyés par une plateforme collaborative et des outils IA sous contrôle humain.",
    },
    {
      question: "Pourquoi faire confiance à BeWork ?",
      answer:
        "Approche fondée sur l’expérience terrain du fondateur, des missions à périmètre défini et une plateforme développée pour le chantier. Aucune référence client, certification ou pourcentage d’amélioration n’est inventé sur le site.",
    },
    {
      question: "Combien coûte BeWork ?",
      answer:
        "Les prestations sont proposées sur devis personnalisé selon le profil, la durée et le périmètre de mission. Aucun tarif forfaitaire inventé n’est publié comme engagement contractuel.",
    },
    {
      question: "Comment commencer avec BeWork ?",
      answer:
        "Décrivez votre besoin via /demande-de-devis (prestation préremplie possible) ou /contact. BeWork étudie l’opération et propose une intervention adaptée.",
    },
    {
      question: "BeWork propose-t-il du travail temporaire ?",
      answer:
        "Non. BeWork propose des missions de prestation de services contractualisées, avec périmètre, responsabilités et livrables — pas du prêt de salariés.",
    },
  ] as const;
}
