/**
 * SEO / GEO / JSON-LD — page /tarifs (parcours 7 h / 14 h).
 * Conservé pour exports historiques ; la page /tarifs utilise aussi seo-formation-pages.
 */

import {
  BEWORK_COMPLETE_PRICE_EUR,
  BEWORK_SESSION_PRICE_EUR,
  TRAINING_OFFERS,
} from "@/lib/bework-formation";
import { SEO_KEYWORDS_FORMATION_IA } from "@/lib/seo-keywords";
import { SCHEMA_ORG_ID, buildWebPageAndBreadcrumbJsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";
import {
  beworkCompleteOfferJsonLd,
  beworkSessionOfferJsonLd,
} from "@/lib/seo-formation-pages";

export const TARIFS_PAGE_PATH = "/tarifs" as const;

export const TARIFS_SEO_TITLE = `Tarifs formation IA — ${BEWORK_SESSION_PRICE_EUR} € ou ${BEWORK_COMPLETE_PRICE_EUR} € | BeWork`;

export const TARIFS_SEO_DESCRIPTION = `Parcours BeWork : ${BEWORK_SESSION_PRICE_EUR} € (${TRAINING_OFFERS.essential.hours} h) ou ${BEWORK_COMPLETE_PRICE_EUR} € (${TRAINING_OFFERS.complete.hours} h) par participant. Même point de départ, prolongation possible. Pas d’abonnement.`;

export const TARIFS_SEO_KEYWORDS = [
  "tarif formation IA",
  "prix formation créer avec IA",
  `formation IA ${BEWORK_SESSION_PRICE_EUR} euros`,
  `formation IA ${BEWORK_COMPLETE_PRICE_EUR} euros`,
  "formation IA 7 heures",
  "formation IA 14 heures",
  ...SEO_KEYWORDS_FORMATION_IA.slice(0, 6),
] as const;

export const TARIFS_H1 = "Un même point de départ. À vous de choisir jusqu’où aller.";

/** Section llms.txt — tarifs publics. */
export function buildLlmsTarifsOffersSection(): string {
  return [
    `- **Parcours 7 h** — ${BEWORK_SESSION_PRICE_EUR} € / participant.`,
    `- **Parcours 14 h** — ${BEWORK_COMPLETE_PRICE_EUR} € / participant.`,
    `- Prolongation Jour 2 après 7 h : +${BEWORK_SESSION_PRICE_EUR} €.`,
    "- Pas d’abonnement lié à cette offre. Demander une place via /contact#participer.",
  ].join("\n");
}

/** @graph JSON-LD pour /tarifs (deux Offers). */
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
        name: "Formation BeWork",
        description: TARIFS_SEO_DESCRIPTION,
        brand: { "@type": "Brand", name: "BeWork" },
        category: "Formation professionnelle",
        offers: [beworkSessionOfferJsonLd(), beworkCompleteOfferJsonLd()],
        provider: { "@id": SCHEMA_ORG_ID },
      },
    ],
  };
}
