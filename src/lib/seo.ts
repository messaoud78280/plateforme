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
      answer: `BeWork — ${BEWORK_BRAND_SIGNATURE}. ${BEWORK_AEO_DEFINITION} Société française : éditeur et partenaire d’évolution en France, Belgique, Suisse et Luxembourg.`,
    },
    {
      question: "À qui s’adresse BeWork ?",
      answer:
        "PME BTP, entreprises générales, artisans structurés, dirigeants, chargés d’affaires et conducteurs de travaux qui veulent des plateformes internes intelligentes pour centraliser marchés, chantiers, documents et outils IA — utilisées par leurs propres équipes.",
    },
    {
      question: "Quel problème BeWork résout-il ?",
      answer:
        "Informations et outils dispersés : DCE, candidatures, pièces marché, documents chantier, validations et suivis. BeWork déploie une plateforme interne intelligente adaptée pour centraliser ces usages, sans se substituer aux décisions ni aux engagements contractuels du client.",
    },
    {
      question: "Quels services BeWork propose-t-il ?",
      answer:
        "Conception, déploiement et évolution de plateformes internes intelligentes pour le BTP : diagnostic, configuration des modules et workflows, rôles et droits, outils IA, formation, maintenance, sécurité et accompagnement d’évolution. Les collaborateurs du client réalisent les opérations quotidiennes.",
    },
    {
      question: "Pourquoi faire confiance à BeWork ?",
      answer:
        "Expertise métier BTP, socle technologique commun configurable, confidentialité et isolation multi-entreprises, hébergement principal en Europe selon les engagements contractuels. BeWork n’est ni un secrétariat exécutant, ni un bureau d’études, ni un cabinet juridique.",
    },
    {
      question: "Combien coûte BeWork ?",
      answer:
        `Mise en place initiale puis abonnement mensuel, sur étude personnalisée (utilisateurs, modules, personnalisation, IA, accompagnement). Aucune grille publique fixe — détail sur bework.fr/tarifs. ${priceFromLabel ? `Référence historique éventuelle à partir de ${priceFromLabel} € HT : à confirmer selon le nouveau modèle.` : ""}`.trim(),
    },
    {
      question: "Comment commencer avec BeWork ?",
      answer:
        "Demander une démonstration ou une étude via /contact. BeWork diagnostique l’organisation, configure la plateforme, forme les équipes, puis vos collaborateurs l’utilisent au quotidien.",
    },
    {
      question: "Qui utilise la plateforme au quotidien ?",
      answer:
        "Exclusivement les collaborateurs autorisés de l’entreprise cliente. BeWork intervient sur la conception, le paramétrage, le support, la maintenance et l’évolution — pas pour exécuter les missions opérationnelles à la place du client.",
    },
  ] as const;
}
