/**
 * SEO / GEO / JSON-LD — page /tarifs (méthode de tarification, sans grille publique).
 */

import { BEWORK_TARIFS_FAQ } from "@/lib/bework-public-offers";
import { SEO_KEYWORDS_BTP_PME } from "@/lib/seo-keywords";
import { SCHEMA_ORG_ID, buildWebPageAndBreadcrumbJsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";

export const TARIFS_PAGE_PATH = "/tarifs" as const;

export const TARIFS_SEO_TITLE = "Tarification BeWork | Solutions IA et plateforme sur étude";

export const TARIFS_SEO_DESCRIPTION =
  "Tarification BeWork : projet IA sur mesure ou plateforme métier BTP. Le tarif dépend du périmètre, des utilisateurs, des intégrations, de la formation et de l’accompagnement — sans grille publique fixe.";

export const TARIFS_SEO_KEYWORDS = [
  "tarification solution IA BTP",
  "étude projet IA BeWork",
  "plateforme métier BTP",
  "modules IA BTP",
  "abonnement plateforme BTP",
  "conception solution IA sur mesure",
  ...SEO_KEYWORDS_BTP_PME.slice(0, 6),
] as const;

export const TARIFS_H1 = "Une solution adaptée à votre organisation";

/** Section llms.txt — pas de prix inventés ; renvoi vers étude. */
export function buildLlmsTarifsOffersSection(): string {
  return [
    "- **Tarification sur étude** — utilisateurs, modules, personnalisation, outils IA et accompagnement.",
    "- Demander une démonstration ou une étude personnalisée via /contact.",
  ].join("\n");
}

/** @graph JSON-LD complet pour /tarifs (sans AggregateOffer chiffré). */
export function buildTarifsPageJsonLd() {
  const pageUrl = absoluteUrl(TARIFS_PAGE_PATH);

  const webPage = buildWebPageAndBreadcrumbJsonLd({
    pagePath: TARIFS_PAGE_PATH,
    h1: TARIFS_H1,
    description: TARIFS_SEO_DESCRIPTION,
    breadcrumbItems: [
      { name: "Accueil", href: "/" },
      { name: "Tarification", href: TARIFS_PAGE_PATH },
    ],
  });

  return {
    "@context": "https://schema.org",
    "@graph": [
      ...webPage["@graph"],
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        url: pageUrl,
        inLanguage: "fr-FR",
        mainEntity: BEWORK_TARIFS_FAQ.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
      {
        "@type": "Service",
        "@id": `${pageUrl}#service-tarifs`,
        name: "Plateforme interne BeWork pour entreprises du BTP",
        description:
          "Socle technologique BeWork configuré selon l’organisation : modules, workflows, outils IA et accompagnement optionnel.",
        url: pageUrl,
        provider: { "@id": SCHEMA_ORG_ID },
        offers: {
          "@type": "Offer",
          priceCurrency: "EUR",
          description:
            "Tarification sur étude personnalisée — contacter BeWork pour une démonstration.",
          url: absoluteUrl("/contact"),
        },
      },
    ],
  };
}
