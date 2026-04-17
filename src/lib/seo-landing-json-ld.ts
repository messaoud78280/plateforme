import { absoluteUrl, SITE_URL } from "@/lib/site";

const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * WebPage + BreadcrumbList pour les landings (complète le WebSite / Organization du layout).
 */
export function buildWebPageAndBreadcrumbJsonLd(input: {
  pagePath: string;
  h1: string;
  description: string;
  breadcrumbItems: { name: string; href: string }[];
}) {
  const pageUrl = absoluteUrl(input.pagePath);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: input.h1,
        description: input.description,
        isPartOf: { "@id": WEBSITE_ID },
        inLanguage: "fr-FR",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: input.breadcrumbItems.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: absoluteUrl(item.href),
        })),
      },
    ],
  };
}
