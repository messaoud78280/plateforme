import { RESOURCE_GUIDE_CATEGORIES } from "@/content/resource-categories";
import type { ServicePageDefinition, ServicePageSlug } from "@/content/service-pages";
import { SERVICE_PAGES, servicePagePath } from "@/content/service-pages";
import { jsonLdExpandedAreaServed } from "@/lib/jsonld-area-served";
import { absoluteUrl, SITE_URL } from "@/lib/site";

export const SCHEMA_ORG_ID = `${SITE_URL}/#organization`;
export const SCHEMA_WEBSITE_ID = `${SITE_URL}/#website`;

export type FaqItem = { q: string; a: string };
export type BreadcrumbItem = { name: string; href: string };

/** FAQPage — réutilisable sur landings, services, tarifs, FAQ. */
export function buildFaqPageJsonLd(faq: readonly FaqItem[], pageUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: pageUrl,
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/** WebPage + BreadcrumbList pour les landings (complète le WebSite / Organization du layout). */
export function buildWebPageAndBreadcrumbJsonLd(input: {
  pagePath: string;
  h1: string;
  description: string;
  breadcrumbItems: BreadcrumbItem[];
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
        isPartOf: { "@id": SCHEMA_WEBSITE_ID },
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

/** Service (schema.org) pour une landing SEO dédiée (hors hub /services). */
export function buildLandingServiceJsonLd(input: {
  name: string;
  description: string;
  pageUrl: string;
  serviceType?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${input.pageUrl}#offering`,
    name: input.name,
    description: input.description,
    url: input.pageUrl,
    serviceType: input.serviceType ?? "Assistance administrative BTP",
    provider: { "@id": SCHEMA_ORG_ID },
    areaServed: jsonLdExpandedAreaServed(),
  };
}

/** Service (schema.org) pour une page /services/[slug]. */
export function buildServiceOfferingJsonLd(d: ServicePageDefinition, pageUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${pageUrl}#offering`,
    name: d.h1,
    description: d.metaDescription,
    url: pageUrl,
    serviceType: "Assistant travaux BTP augmenté par l’IA",
    provider: { "@id": SCHEMA_ORG_ID },
    areaServed: jsonLdExpandedAreaServed(),
    audience: {
      "@type": "BusinessAudience",
      audienceType: "Entreprises du bâtiment et travaux publics (France, Belgique, Suisse, Luxembourg)",
    },
  };
}

/** ItemList pour le hub /services. */
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

/** CollectionPage + ItemList pour /ressources. */
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
        isPartOf: { "@id": SCHEMA_WEBSITE_ID },
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

/** Article (guides PDF, tutos longs, blog). */
export function buildArticleJsonLd(input: {
  headline: string;
  description: string;
  pageUrl: string;
  datePublished?: string;
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    url: input.pageUrl,
    mainEntityOfPage: input.pageUrl,
    author: { "@type": "Organization", name: "BeWork", url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "BeWork",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: absoluteUrl("/opengraph-image") },
    },
    inLanguage: "fr-FR",
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
  };
}

/** Offres tarifaires publiques (page /tarifs, JSON-LD home). */
export function buildPublicPlanOffersJsonLd(
  plans: readonly { name: string; price: string; description: string }[]
) {
  return plans.map((plan) => ({
    "@type": "Offer",
    name: plan.name,
    price: plan.price.replace(/\s/g, ""),
    priceCurrency: "EUR",
    description: plan.description,
    url: absoluteUrl("/tarifs"),
    availability: "https://schema.org/InStock",
    seller: { "@id": SCHEMA_ORG_ID },
  }));
}

/** OfferCatalog pour la page /tarifs. */
export function buildOfferCatalogJsonLd(
  plans: readonly { name: string; price: string; description: string; tagline?: string }[],
  pageUrl: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    "@id": `${pageUrl}#offer-catalog`,
    name: "Tarifs BeWork — relais bureau-chantier BTP (missions ponctuelles et accompagnements mensuels)",
    url: pageUrl,
    numberOfItems: plans.length,
    itemListElement: plans.map((plan, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Offer",
        name: `${plan.name} — BeWork`,
        description: plan.tagline ?? plan.description,
        price: plan.price.replace(/\s/g, ""),
        priceCurrency: "EUR",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: plan.price.replace(/\s/g, ""),
          priceCurrency: "EUR",
          valueAddedTaxIncluded: false,
        },
        url: pageUrl,
        availability: "https://schema.org/InStock",
        seller: { "@id": SCHEMA_ORG_ID },
      },
    })),
  };
}
