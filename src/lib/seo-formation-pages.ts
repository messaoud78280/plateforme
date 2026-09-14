/**
 * SEO BeWork V3 — metadata & JSON-LD du cœur formation.
 * Intention : créer avec l’IA / sans coder / parcours pratique.
 * Pas de stuffing ; titres ≤ ~60 car. ; descriptions ≈ 150–160 car.
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

export function beworkCourseJsonLd(overrides?: {
  name?: string;
  description?: string;
  url?: string;
}): Record<string, unknown> {
  const courseUrl = overrides?.url ?? absoluteUrl("/formation");
  return {
    "@type": "Course",
    "@id": `${courseUrl}#course`,
    name: overrides?.name ?? "Formation BeWork — Créer avec l’IA sans savoir coder",
    description:
      overrides?.description ??
      `Formation progressive : ${TRAINING_OFFERS.essential.hours} h pour apprendre à commencer (${TRAINING_OFFERS.essential.price} €), ou ${TRAINING_OFFERS.complete.hours} h pour construire plus loin (${TRAINING_OFFERS.complete.price} €). Sans prérequis en programmation.`,
    provider: { "@id": `${SITE_URL}/#organization` },
    url: courseUrl,
    inLanguage: "fr-FR",
    isAccessibleForFree: false,
    educationalLevel: "Débutant",
    coursePrerequisites: "Aucune connaissance en programmation n’est nécessaire.",
    audience: {
      "@type": "Audience",
      audienceType:
        "Débutants, non-développeurs, entrepreneurs, artisans, indépendants, salariés et porteurs de projet",
    },
    teaches: [
      "Structurer une idée en projet numérique",
      "Guider une création assistée par l’IA",
      "Tester et améliorer un résultat",
      "Continuer un projet après la session",
    ],
    about: [
      { "@type": "Thing", name: "Créer avec l’IA" },
      { "@type": "Thing", name: "Créer sans savoir coder" },
      { "@type": "Thing", name: "Formation IA débutant" },
    ],
    offers: [beworkSessionOfferJsonLd(), beworkCompleteOfferJsonLd()],
  };
}

/** Metadata canoniques par page cœur. */
export const SEO_PAGES = {
  home: {
    path: "/",
    absoluteTitle: "BeWork | Créer avec l’IA sans savoir coder",
    description:
      `Apprenez à créer des sites, applications et outils avec l’IA, sans savoir coder. Parcours 7 h (${BEWORK_SESSION_PRICE_EUR} €) ou 14 h (${BEWORK_COMPLETE_PRICE_EUR} €).`,
  },
  formation: {
    path: "/formation",
    title: "Formation IA débutant — Créer sans savoir coder",
    absoluteTitle: "Formation IA débutant — Créer sans savoir coder | BeWork",
    description:
      `Formation pratique pour débutants : créez sites, applications et outils avec l’IA, sans coder. Parcours 7 h (${BEWORK_SESSION_PRICE_EUR} €) ou 14 h (${BEWORK_COMPLETE_PRICE_EUR} €), présentiel ou visio.`,
  },
  demonstrations: {
    path: "/demonstrations",
    title: "Démonstrations — exemples créés avec l’IA",
    description:
      "Essayez messagerie, agenda, CRM, réservation, dashboard… Démos BeWork interactives, données fictives. Voyez ce qu’il est possible de créer.",
  },
  pourQui: {
    path: "/pour-qui",
    title: "À qui s’adresse la formation IA sans coder ?",
    description:
      "Entrepreneurs, artisans, indépendants, TPE/PME, porteurs de projet : à qui s’adresse BeWork pour apprendre à créer avec l’IA.",
  },
  tarifs: {
    path: "/tarifs",
    title: `Tarifs formation IA — ${BEWORK_SESSION_PRICE_EUR} € ou ${BEWORK_COMPLETE_PRICE_EUR} €`,
    description: `Parcours BeWork : ${BEWORK_SESSION_PRICE_EUR} € (7 h) ou ${BEWORK_COMPLETE_PRICE_EUR} € (14 h) par participant. Même point de départ, prolongation possible. Pas d’abonnement.`,
  },
  faq: {
    path: "/faq",
    title: "FAQ — Formation créer avec l’IA",
    description:
      "Faut-il savoir coder ? Que choisir entre 7 h et 14 h ? Réponses sur le programme, les prérequis, le matériel et les modalités BeWork.",
  },
  contact: {
    path: "/contact",
    title: "Participer à la formation — Demander une place",
    description: `Demandez une place pour la formation BeWork, en présentiel ou en visio. Parcours 7 h (${BEWORK_SESSION_PRICE_EUR} €) ou 14 h (${BEWORK_COMPLETE_PRICE_EUR} €) par participant.`,
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
