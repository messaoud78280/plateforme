import { RESOURCE_GUIDE_CATEGORIES } from "@/content/resource-categories";
import type { ServicePageDefinition, ServicePageSlug } from "@/content/service-pages";
import { SERVICE_PAGES, servicePagePath } from "@/content/service-pages";
import { jsonLdExpandedAreaServed } from "@/lib/jsonld-area-served";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * Service (schema.org) pour une page /services/[slug] — référence l’Organization globale, sans offre tarifaire fictive.
 */
export function buildServiceOfferingJsonLd(d: ServicePageDefinition, pageUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${pageUrl}#offering`,
    name: d.h1,
    description: d.metaDescription,
    url: pageUrl,
    serviceType: "Assistant travaux BTP augmenté par l’IA",
    provider: { "@id": ORG_ID },
    areaServed: jsonLdExpandedAreaServed(),
    audience: {
      "@type": "BusinessAudience",
      audienceType: "Entreprises du bâtiment et travaux publics (France, Belgique, Suisse, Luxembourg)",
    },
  };
}

/** ItemList pour le hub /services (complète WebPage + fil d’Ariane existants). */
export function buildServicesHubItemListJsonLd(slugs: ServicePageSlug[]) {
  const pageUrl = absoluteUrl("/services");
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${pageUrl}#service-list`,
    name: "Pages services BeWork",
    numberOfItems: slugs.length,
    itemListElement: slugs.map((slug, i) => {
      const p = SERVICE_PAGES[slug];
      const url = absoluteUrl(servicePagePath(slug));
      return {
        "@type": "ListItem",
        position: i + 1,
        name: p.h1,
        description: p.metaDescription,
        item: url,
      };
    }),
  };
}

/** CollectionPage + ItemList thématique pour /ressources (GEO / maillage). */
export function buildResourcesHubCollectionJsonLd(description: string) {
  const pageUrl = absoluteUrl("/ressources");
  const entries: { name: string; url: string }[] = [];
  for (const cat of RESOURCE_GUIDE_CATEGORIES) {
    for (const l of cat.links) {
      entries.push({ name: `${cat.title} — ${l.label}`, url: absoluteUrl(l.href) });
    }
  }
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#collection`,
        name: "Ressources BeWork — Tutoriels, guides & cas clients",
        description,
        url: pageUrl,
        isPartOf: { "@id": WEBSITE_ID },
        inLanguage: "fr-FR",
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#theme-links`,
        name: "Thèmes et liens utiles",
        numberOfItems: entries.length,
        itemListElement: entries.map((e, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: e.name,
          item: e.url,
        })),
      },
    ],
  };
}
