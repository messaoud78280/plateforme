/**
 * SEO / GEO / JSON-LD — page /tarifs (offres publiques bework-public-offers).
 */

import {
  BEWORK_PUBLIC_OFFERS,
  BEWORK_TARIFS_FAQ,
  beworkOffersForJsonLd,
  formatOfferPriceLabel,
  getMarketingAggregateOfferDescription,
} from "@/lib/bework-public-offers";
import { SEO_KEYWORDS_ASSISTANT_TRAVAUX, SEO_KEYWORDS_BTP_PME } from "@/lib/seo-keywords";
import { SCHEMA_ORG_ID, buildOfferCatalogJsonLd, buildWebPageAndBreadcrumbJsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";

export const TARIFS_PAGE_PATH = "/tarifs" as const;

export const TARIFS_SEO_TITLE = "Tarifs BeWork | Renfort assistants travaux BTP";

export const TARIFS_SEO_DESCRIPTION =
  "Tarifs BeWork : forfaits HT pour un renfort sur candidatures, analyse DCE et suivi admin des marchés — validation client. Ponctuel dès 150 €, mensuel dès 590 €.";

export const TARIFS_SEO_KEYWORDS = [
  "tarifs assistant travaux",
  "tarifs renfort administratif BTP",
  "assistant travaux appels d’offres",
  "analyse DCE tarif",
  "suivi administratif marché BTP",
  "assistance candidature marché public",
  "cellule travaux externalisée",
  "externalisation administrative BTP",
  "mission ponctuelle BTP",
  "DCE BTP",
  "DOE BTP",
  "facturation Chorus Pro travaux",
  ...SEO_KEYWORDS_ASSISTANT_TRAVAUX.slice(0, 6),
  ...SEO_KEYWORDS_BTP_PME.slice(0, 4),
] as const;

export const TARIFS_H1 = "Tarifs BeWork : renfort assistants travaux pour AO et marchés";

/** Section llms.txt — offres publiques citables par les IA. */
export function buildLlmsTarifsOffersSection(): string {
  return BEWORK_PUBLIC_OFFERS.map(
    (o) => `- **${o.name}** — ${formatOfferPriceLabel(o)}. ${o.tagline}`,
  ).join("\n");
}

/** @graph JSON-LD complet pour /tarifs. */
export function buildTarifsPageJsonLd() {
  const pageUrl = absoluteUrl(TARIFS_PAGE_PATH);

  const webPage = buildWebPageAndBreadcrumbJsonLd({
    pagePath: TARIFS_PAGE_PATH,
    h1: TARIFS_H1,
    description: TARIFS_SEO_DESCRIPTION,
    breadcrumbItems: [
      { name: "Accueil", href: "/" },
      { name: "Tarifs", href: TARIFS_PAGE_PATH },
    ],
  });

  return {
    "@context": "https://schema.org",
    "@graph": [
      ...webPage["@graph"],
      buildOfferCatalogJsonLd(beworkOffersForJsonLd(), pageUrl),
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
        name: "Assistants travaux externalisés — assistance technique et administrative BTP",
        description: getMarketingAggregateOfferDescription(),
        url: pageUrl,
        provider: { "@id": SCHEMA_ORG_ID },
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "EUR",
          lowPrice: "150",
          highPrice: "2900",
          offerCount: String(BEWORK_PUBLIC_OFFERS.length),
          description: getMarketingAggregateOfferDescription(),
        },
      },
    ],
  };
}
