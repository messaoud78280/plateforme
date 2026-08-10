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

/** Réponses courtes aux 8 questions GEO/AEO — le tarif est complété côté composant si besoin. */
export function getGeoAeoBriefItems(priceFromLabel: string): readonly GeoAeoBriefItem[] {
  return [
    {
      question: "Qui est BeWork ?",
      answer: `BeWork — ${BEWORK_BRAND_SIGNATURE}. ${BEWORK_AEO_DEFINITION} Société française : concepteur de solutions IA et de plateformes métier en France, Belgique, Suisse et Luxembourg.`,
    },
    {
      question: "À qui s’adresse BeWork ?",
      answer:
        "PME BTP, entreprises générales, artisans structurés, dirigeants, chargés d’affaires et conducteurs de travaux qui veulent une solution IA, une automatisation, une analyse documentaire, une intégration à leurs outils, ou une plateforme métier — sans devoir tout reconstruire seuls.",
    },
    {
      question: "Quel problème BeWork résout-il ?",
      answer:
        "Temps perdu sur des tâches répétitives, documents difficiles à exploiter, information dispersée, outils qui ne dialoguent pas, idées métier sans logiciel adapté. BeWork étudie le besoin et construit la solution autour de l’entreprise — sans se substituer aux décisions ni aux engagements contractuels du client.",
    },
    {
      question: "Quels services BeWork propose-t-il ?",
      answer:
        "Conception de solutions IA sur mesure (applications, agents, automatisations, analyse documentaire, recherche, intégrations), conception de plateformes métier, formation des équipes, accompagnement à l’adoption et évolution continue. La plateforme BeWork est une offre majeure et une preuve de savoir-faire.",
    },
    {
      question: "Pourquoi faire confiance à BeWork ?",
      answer:
        "Expertise métier BTP, solutions pensées pour être utilisées (simples devant), confidentialité et isolation multi-entreprises, hébergement principal en Europe selon les engagements contractuels. BeWork n’est ni un secrétariat exécutant, ni un bureau d’études, ni un cabinet juridique.",
    },
    {
      question: "Combien coûte BeWork ?",
      answer:
        `Projet IA sur mesure ou plateforme BeWork : proposition sur étude (périmètre, utilisateurs, intégrations, formation, accompagnement). Aucune grille publique fixe — détail sur bework.fr/tarifs. ${priceFromLabel ? `Référence historique éventuelle à partir de ${priceFromLabel} € HT : à confirmer selon le modèle retenu.` : ""}`.trim(),
    },
    {
      question: "Comment commencer avec BeWork ?",
      answer:
        "Parler de votre besoin via bework.fr/#besoin ou /contact. Expliquez ce que vous voulez améliorer, automatiser ou créer — sans jargon technique. BeWork étudie la faisabilité, propose une approche, puis conçoit, déploie et forme.",
    },
    {
      question: "Dois-je adopter toute la plateforme BeWork ?",
      answer:
        "Non. Vous pouvez venir pour un besoin IA précis, une intégration à vos logiciels existants, ou une plateforme complète. BeWork part de votre besoin, pas d’un catalogue obligatoire.",
    },
  ] as const;
}
