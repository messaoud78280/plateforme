/**
 * SEO / JSON-LD — ancienne page /tarifs (redirigée vers /demande-de-devis).
 * Métadonnées alignées BTP ; ne plus exposer les tarifs formation IA.
 */

import { SEO_KEYWORDS_PLATFORM_IA } from "@/lib/seo-keywords";
import { absoluteUrl, SITE_URL } from "@/lib/site";

export const TARIFS_PAGE_PATH = "/tarifs" as const;

/** /tarifs est redirigé vers /demande-de-devis — métadonnées alignées BTP. */
export const TARIFS_SEO_TITLE =
  "Devis prestations BTP BeWork | Conduite de travaux & équipes";

export const TARIFS_SEO_DESCRIPTION =
  "Les prestations BeWork (conduite de travaux, équipes TP/VRD, ingénierie, formation) sont proposées sur devis après étude du besoin — Yvelines et Île-de-France.";

export const TARIFS_SEO_KEYWORDS = [
  "devis conduite de travaux",
  "tarif conducteur de travaux externalisé",
  "devis équipe TP VRD",
  "prestation BTP sur devis",
  ...SEO_KEYWORDS_PLATFORM_IA.slice(0, 6),
] as const;

export const TARIFS_H1 = "Prestations BeWork sur devis.";

/** Section llms — plus de prix formation IA publics. */
export function buildLlmsTarifsOffersSection(): string {
  return [
    "- Prestations BeWork proposées **sur devis** après étude du besoin.",
    "- Conduite de travaux externalisée, équipes TP/VRD en régie, ingénierie et formation BTP.",
    "- Demande : /demande-de-devis ou /contact.",
  ].join("\n");
}

/** @graph JSON-LD pour /tarifs (WebPage BTP — pas d’Offers formation IA). */
export function buildTarifsPageJsonLd() {
  const pageUrl = absoluteUrl(TARIFS_PAGE_PATH);
  const devisUrl = absoluteUrl("/demande-de-devis");

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: devisUrl,
        name: TARIFS_SEO_TITLE,
        description: TARIFS_SEO_DESCRIPTION,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        inLanguage: "fr-FR",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Accueil",
            item: absoluteUrl("/"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Demande de devis",
            item: devisUrl,
          },
        ],
      },
    ],
  };
}
