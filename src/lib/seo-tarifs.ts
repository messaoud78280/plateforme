/**
 * SEO / GEO / JSON-LD — page /tarifs (journée BeWork, tarif public unique).
 * Conservé pour exports historiques ; la page /tarifs utilise aussi seo-formation-pages.
 */

import { BEWORK_SESSION_PRICE_EUR } from "@/lib/bework-formation";
import { SEO_KEYWORDS_FORMATION_IA } from "@/lib/seo-keywords";
import { SCHEMA_ORG_ID, buildWebPageAndBreadcrumbJsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";
import { beworkSessionOfferJsonLd } from "@/lib/seo-formation-pages";

export const TARIFS_PAGE_PATH = "/tarifs" as const;

export const TARIFS_SEO_TITLE = `Tarif formation IA — ${BEWORK_SESSION_PRICE_EUR} € | BeWork`;

export const TARIFS_SEO_DESCRIPTION = `Tarif unique BeWork : ${BEWORK_SESSION_PRICE_EUR} € / participant pour une journée pratique. Inclus : démos, accompagnement, méthode. Pas d’abonnement.`;

export const TARIFS_SEO_KEYWORDS = [
  "tarif formation IA",
  "prix formation créer avec IA",
  `formation IA ${BEWORK_SESSION_PRICE_EUR} euros`,
  "journée BeWork tarif",
  ...SEO_KEYWORDS_FORMATION_IA.slice(0, 6),
] as const;

export const TARIFS_H1 = "Une session, un tarif clair";

/** Section llms.txt — tarif public journée. */
export function buildLlmsTarifsOffersSection(): string {
  return [
    `- **Journée BeWork** — ${BEWORK_SESSION_PRICE_EUR} € / participant (tarif unique publié).`,
    "- Pas d’abonnement lié à cette offre. Demander une place via /contact#participer.",
  ].join("\n");
}

/** @graph JSON-LD pour /tarifs (Offer chiffrée = tarif public). */
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
      {
        "@type": "Product",
        "@id": `${pageUrl}#product`,
        name: "Journée BeWork",
        description: TARIFS_SEO_DESCRIPTION,
        brand: { "@type": "Brand", name: "BeWork" },
        category: "Formation professionnelle",
        offers: beworkSessionOfferJsonLd(),
        provider: { "@id": SCHEMA_ORG_ID },
      },
    ],
  };
}
