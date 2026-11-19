/**
 * Helpers metadata marketing + registry legacy (anciennes URLs formation IA).
 * Les pages /formation, /tarifs, /pour-qui, etc. sont redirigées vers le site BTP.
 * Ce registry ne doit plus exposer le positionnement « créer avec l’IA ».
 */

import type { Metadata } from "next";
import {
  BEWORK_BRAND_SIGNATURE,
  SEO_PUBLIC_ROBOTS,
  clampMetaDescription,
  hreflangFrancophonieLanguages,
} from "@/lib/seo";
import { absoluteUrl, SITE_URL } from "@/lib/site";
import {
  BEWORK_COMPLETE_PRICE_EUR,
  BEWORK_SESSION_PRICE_EUR,
  TRAINING_OFFERS,
} from "@/lib/bework-formation";

const OG_IMAGE = absoluteUrl("/opengraph-image");

export type MarketingSeoInput = {
  path: string;
  /** Title segment (sans « | BeWork » si template layout). Pour absolute, passer absoluteTitle. */
  title: string;
  description: string;
  /** Remplace le template layout. */
  absoluteTitle?: string;
  ogTitle?: string;
  ogDescription?: string;
  noIndex?: boolean;
};

/** Construit metadata Next cohérentes (canonical, hreflang, OG, Twitter, robots). */
export function buildMarketingPageMetadata(input: MarketingSeoInput): Metadata {
  const pageUrl = absoluteUrl(input.path);
  const titleAbsolute = input.absoluteTitle ?? `${input.title} | BeWork`;
  const ogTitle = input.ogTitle ?? titleAbsolute;
  const ogDescription = input.ogDescription ?? input.description;

  return {
    title: input.absoluteTitle ? { absolute: input.absoluteTitle } : input.title,
    description: input.description,
    alternates: {
      canonical: pageUrl,
      languages: hreflangFrancophonieLanguages(input.path),
    },
    robots: input.noIndex
      ? { index: false, follow: false }
      : SEO_PUBLIC_ROBOTS,
    openGraph: {
      type: "website",
      locale: "fr_FR",
      url: pageUrl,
      siteName: "BeWork",
      title: ogTitle,
      description: ogDescription,
      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `BeWork — ${BEWORK_BRAND_SIGNATURE}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [OG_IMAGE],
    },
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** Offre parcours 7 h — réutilisable Course / Product. */
export function beworkSessionOfferJsonLd(
  path = "/contact?parcours=essential#participer",
): Record<string, unknown> {
  return {
    "@type": "Offer",
    name: `${TRAINING_OFFERS.essential.title} — ${TRAINING_OFFERS.essential.hours} h`,
    price: String(TRAINING_OFFERS.essential.price),
    priceCurrency: "EUR",
    url: absoluteUrl(path),
    category: "Formation",
  };
}

/** Offre parcours 14 h. */
export function beworkCompleteOfferJsonLd(
  path = "/contact?parcours=complete#participer",
): Record<string, unknown> {
  return {
    "@type": "Offer",
    name: `${TRAINING_OFFERS.complete.title} — ${TRAINING_OFFERS.complete.hours} h`,
    price: String(TRAINING_OFFERS.complete.price),
    priceCurrency: "EUR",
    url: absoluteUrl(path),
    category: "Formation",
  };
}

/**
 * JSON-LD Course — silo formation BTP (sans tarifs IA hérités).
 * Les anciennes URLs /formation restent redirigées ; ne plus publier 300 € / 600 €.
 */
export function beworkCourseJsonLd(overrides?: {
  name?: string;
  description?: string;
  url?: string;
}): Record<string, unknown> {
  const courseUrl =
    overrides?.url ?? absoluteUrl("/formation-professionnelle-btp");
  return {
    "@type": "Course",
    "@id": `${courseUrl}#course`,
    name:
      overrides?.name ??
      "Formation professionnelle BTP — pratiques sur chantier",
    description:
      overrides?.description ??
      "Formations pratiques orientées conduite de travaux, encadrement de chantier, équipes TP/VRD et modes opératoires — offre en développement, sur devis.",
    provider: { "@id": `${SITE_URL}/#organization` },
    url: courseUrl,
    inLanguage: "fr-FR",
    isAccessibleForFree: false,
    educationalLevel: "Professionnel BTP",
    audience: {
      "@type": "Audience",
      audienceType:
        "Salariés et entreprises du BTP — conducteurs, chefs de chantier, chefs d’équipe, compagnons",
    },
    teaches: [
      "Organisation et pilotage de chantier",
      "Modes opératoires et exigences techniques",
      "Encadrement d’équipes TP/VRD",
      "Contrôle qualité et exécution",
    ],
    about: [
      { "@type": "Thing", name: "Formation professionnelle BTP" },
      { "@type": "Thing", name: "Formation conducteur de travaux" },
      { "@type": "Thing", name: "Formation modes opératoires chantier" },
    ],
  };
}

/**
 * Registry legacy — métadonnées BTP si une ancienne page est encore rendue.
 * Les URLs correspondantes sont redirigées (301) vers le site BTP.
 */
export const SEO_PAGES = {
  home: {
    path: "/",
    absoluteTitle: "BeWork | Conduite de travaux externalisée & ingénierie BTP",
    description:
      "BeWork accompagne les entreprises du BTP : conduite de travaux externalisée, équipes TP/VRD en régie, ingénierie, marchés publics et formation sur chantier.",
  },
  formation: {
    path: "/formation",
    title: "Formation professionnelle BTP",
    absoluteTitle: "Formation professionnelle BTP | BeWork",
    description:
      "Formations pratiques sur chantier pour conducteurs, chefs de chantier, chefs d’équipe TP/VRD et compagnons — offre BeWork en développement.",
  },
  demonstrations: {
    path: "/demonstrations",
    title: "Méthode et outils de pilotage de chantier",
    description:
      "Outils collaboratifs et méthode BeWork utilisés en interne pour préparer, suivre et documenter les missions de chantier BTP.",
  },
  pourQui: {
    path: "/pour-qui",
    title: "Entreprises BTP accompagnées par BeWork",
    description:
      "BeWork s’adresse aux entreprises du BTP qui ont besoin de conduite de travaux externalisée, d’équipes TP/VRD en régie ou d’ingénierie.",
  },
  tarifs: {
    path: "/tarifs",
    title: "Devis prestations BTP BeWork",
    description:
      "Les prestations BeWork (conduite de travaux, équipes TP/VRD, ingénierie, formation) sont proposées sur devis après étude du besoin.",
  },
  faq: {
    path: "/faq",
    title: "FAQ — Prestations BTP BeWork",
    description:
      "Questions fréquentes sur la conduite de travaux externalisée, les équipes TP/VRD en régie, l’ingénierie et la formation BTP BeWork.",
  },
  contact: {
    path: "/contact",
    title: "Contact BeWork — Devis BTP",
    description:
      "Contactez BeWork pour une conduite de travaux, une équipe TP/VRD en régie, une assistance marchés ou une formation sur chantier.",
  },
  organismeFormation: {
    path: "/organisme-formation",
    title: "Organisme de formation BeWork",
    absoluteTitle: "Organisme de formation BeWork | Formation BTP",
    description:
      "Présentation de l’activité formation BeWork pour les entreprises du BTP. Aucune certification Qualiopi ni éligibilité CPF affirmée sans vérification.",
  },
} as const;

export function demoPageMetadata(slug: string, title: string, usage: string): Metadata {
  return buildMarketingPageMetadata({
    path: `/demonstrations/${slug}`,
    title: `Démo ${title}`,
    description: clampMetaDescription(
      `${usage} Démonstration BeWork interactive avec des données fictives.`,
    ),
    ogTitle: `${title} — démonstration BeWork`,
  });
}
