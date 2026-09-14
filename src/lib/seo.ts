/**
 * Constantes et helpers SEO / GEO / AEO partagés (titres, définitions citables par les IA, métadonnées).
 */
import { BEWORK_AEO_DEFINITION, BEWORK_BRAND_SIGNATURE } from "@/lib/seo-keywords";
import { TRAINING_OFFERS } from "@/lib/bework-formation";
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

/** Réponses courtes aux questions GEO/AEO — alignées formation V3 (pas de BTP / SaaS). */
export function getGeoAeoBriefItems(priceFromLabel: string): readonly GeoAeoBriefItem[] {
  const priceHint = priceFromLabel
    ? ` Tarifs publics : à partir de ${priceFromLabel} € / participant (7 h), parcours 14 h disponible.`
    : ` Tarifs publics : ${TRAINING_OFFERS.essential.price} € (${TRAINING_OFFERS.essential.hours} h) ou ${TRAINING_OFFERS.complete.price} € (${TRAINING_OFFERS.complete.hours} h) par participant.`;

  return [
    {
      question: "Qui est BeWork ?",
      answer: `BeWork — ${BEWORK_BRAND_SIGNATURE}. ${BEWORK_AEO_DEFINITION} Société française (Guyancourt), sessions pour la francophonie.`,
    },
    {
      question: "À qui s’adresse BeWork ?",
      answer:
        "Entrepreneurs, artisans, indépendants, TPE/PME, porteurs de projet et professionnels curieux de l’IA qui veulent apprendre à créer sites, apps ou outils — sans prérequis en programmation.",
    },
    {
      question: "Quel problème BeWork résout-il ?",
      answer:
        "Passer de l’idée à une première construction concrète avec l’IA : structurer un besoin, guider la création, tester et améliorer — sans devoir devenir développeur ni dépendre d’un abonnement logiciel BeWork.",
    },
    {
      question: "Quels services BeWork propose-t-il ?",
      answer:
        "Une formation progressive en petit groupe pour apprendre à créer avec l’IA (7 h ou 14 h), des démonstrations illustratives sur le site, et une méthode réutilisable après la session. Pas de plateforme SaaS ni de catalogue d’outils imposé.",
    },
    {
      question: "Pourquoi faire confiance à BeWork ?",
      answer:
        "Promesse claire et bornée : 7 h pour apprendre à commencer, 14 h pour pratiquer davantage — pas pour devenir expert instantanément. Démos en données fictives. Aucun avis, note ou volume clients inventé.",
    },
    {
      question: "Combien coûte BeWork ?",
      answer: `Formation BeWork : parcours 7 h ou 14 h, tarifs publiés sur bework.fr/tarifs.${priceHint} Pas d’abonnement lié à cette offre.`,
    },
    {
      question: "Comment commencer avec BeWork ?",
      answer:
        "Explorez les démonstrations, lisez le déroulé sur /formation, puis demandez une place via /contact#participer. Indiquez votre idée ou votre activité pour préparer la session.",
    },
    {
      question: "Faut-il savoir coder pour BeWork ?",
      answer:
        "Non. Les deux parcours sont conçus pour des débutants. Vous apprenez à créer avec l’IA ; vous ne suivez pas une formation développeur.",
    },
  ] as const;
}
