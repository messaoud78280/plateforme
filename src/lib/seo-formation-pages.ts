/**
 * SEO BeWork V3 — metadata & JSON-LD du cœur formation.
 * Intention : créer avec l’IA / sans coder / journée pratique.
 * Pas de stuffing ; titres ≤ ~60 car. ; descriptions ≈ 150–160 car.
 */

import type { Metadata } from "next";
import {
  BEWORK_BRAND_SIGNATURE,
  SEO_OG_ALTERNATE_LOCALES,
  SEO_PUBLIC_ROBOTS,
  hreflangFrancophonieLanguages,
} from "@/lib/seo";
import { absoluteUrl, SITE_URL } from "@/lib/site";
import { BEWORK_SESSION_PRICE_EUR } from "@/lib/bework-formation";

const OG_IMAGE = absoluteUrl("/opengraph-image");

export type MarketingSeoInput = {
  path: string;
  /** Title segment (sans « | BeWork » si template layout). Pour absolute, passer absoluteTitle. */
  title: string;
  description: string;
  /** Remplace le template layout. */
  absoluteTitle?: string;
  keywords?: string[];
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
    ...(input.keywords?.length ? { keywords: input.keywords } : {}),
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
      alternateLocale: [...SEO_OG_ALTERNATE_LOCALES],
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

/** Offre journée BeWork — réutilisable Course / Product. */
export function beworkSessionOfferJsonLd(path = "/contact#participer"): Record<string, unknown> {
  return {
    "@type": "Offer",
    name: "Journée BeWork",
    price: String(BEWORK_SESSION_PRICE_EUR),
    priceCurrency: "EUR",
    availability: "https://schema.org/InStock",
    url: absoluteUrl(path),
    category: "Formation professionnelle",
  };
}

export function beworkCourseJsonLd(overrides?: {
  name?: string;
  description?: string;
  url?: string;
}): Record<string, unknown> {
  return {
    "@type": "Course",
    "@id": `${SITE_URL}/#course`,
    name: overrides?.name ?? "Journée BeWork — Créer avec l’IA sans savoir coder",
    description:
      overrides?.description ??
      "Formation pratique d’une journée pour apprendre à créer sites, applications et outils numériques avec l’intelligence artificielle, sans prérequis en programmation.",
    provider: { "@id": `${SITE_URL}/#organization` },
    url: overrides?.url ?? absoluteUrl("/formation"),
    inLanguage: "fr-FR",
    isAccessibleForFree: false,
    educationalLevel: "Débutant",
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
    offers: beworkSessionOfferJsonLd(),
    hasCourseInstance: [
      {
        "@type": "CourseInstance",
        courseMode: "onsite",
        courseWorkload: "PT1D",
        offers: beworkSessionOfferJsonLd(),
      },
      {
        "@type": "CourseInstance",
        courseMode: "online",
        courseWorkload: "PT1D",
        offers: beworkSessionOfferJsonLd(),
      },
    ],
  };
}

/** Metadata canoniques par page cœur. */
export const SEO_PAGES = {
  home: {
    path: "/",
    absoluteTitle: "BeWork | Créer avec l’IA sans savoir coder",
    description:
      "En une journée, apprenez à créer sites, apps et outils avec l’IA — sans coder. Méthode pratique, petit groupe, 200 €. Demandez une place.",
    keywords: [
      "créer avec l'IA sans coder",
      "formation IA débutant",
      "créer application sans programmer",
      "formation créer site avec IA",
      "journée BeWork",
      "apprendre à créer avec l'intelligence artificielle",
    ],
  },
  formation: {
    path: "/formation",
    title: "Formation IA débutant — Créer sans savoir coder",
    absoluteTitle: "Formation IA débutant — Créer sans savoir coder | BeWork",
    description:
      "Une journée pratique pour découvrir comment créer sites, applications et outils numériques avec l’IA, sans savoir coder. Présentiel principalement, sessions visio disponibles.",
    keywords: [
      "formation IA débutant",
      "créer avec intelligence artificielle",
      "créer sans coder",
      "formation IA pratique",
      "créer un site avec IA",
      "créer une application avec IA",
      "IA entrepreneur",
      "IA demandeur d’emploi",
    ],
  },
  demonstrations: {
    path: "/demonstrations",
    title: "Démonstrations — exemples créés avec l’IA",
    description:
      "Essayez messagerie, agenda, CRM, réservation, dashboard… Démos BeWork interactives, données fictives. Voyez ce qu’il est possible de créer.",
    keywords: [
      "démonstration application IA",
      "exemple CRM créé avec IA",
      "messagerie interne démo",
      "créer outil métier IA",
    ],
  },
  pourQui: {
    path: "/pour-qui",
    title: "Pour qui ? Formation IA sans coder",
    description:
      "Entrepreneurs, artisans, indépendants, TPE/PME, porteurs de projet : à qui s’adresse BeWork pour apprendre à créer avec l’IA.",
    keywords: [
      "formation IA entrepreneurs",
      "formation IA artisans",
      "formation IA indépendants",
      "créer outil métier sans développeur",
    ],
  },
  tarifs: {
    path: "/tarifs",
    title: `Tarif formation IA — ${BEWORK_SESSION_PRICE_EUR} €`,
    description: `Tarif unique BeWork : ${BEWORK_SESSION_PRICE_EUR} € / participant pour une journée pratique. Inclus : démos, accompagnement, méthode. Pas d’abonnement.`,
    keywords: [
      "tarif formation IA",
      "prix formation créer avec IA",
      "formation IA 200 euros",
    ],
  },
  faq: {
    path: "/faq",
    title: "FAQ — Formation créer avec l’IA",
    description:
      "Faut-il savoir coder ? Débutants bienvenus ? Que créer ? Ordinateur ? Outils ? Réponses claires sur la journée BeWork — sans promesse irréaliste.",
    keywords: [
      "faut-il savoir coder formation IA",
      "formation IA débutant FAQ",
      "que créer avec l'IA",
    ],
  },
  contact: {
    path: "/contact",
    title: "Participer — Demander une place BeWork",
    description: `Demandez une place à la journée BeWork (${BEWORK_SESSION_PRICE_EUR} €) : créer sites et outils avec l’IA, sans savoir coder. Petit groupe, pratique.`,
    keywords: [
      "inscription formation IA",
      "participer journée BeWork",
      "demander une place formation créer avec IA",
    ],
  },
} as const;

export function demoPageMetadata(slug: string, title: string, usage: string): Metadata {
  const shortUsage = usage.length > 90 ? `${usage.slice(0, 87).trim()}…` : usage;
  return buildMarketingPageMetadata({
    path: `/demonstrations/${slug}`,
    title: `Démo ${title}`,
    description: `${shortUsage} Démo BeWork interactive — données fictives.`,
    keywords: [
      `démonstration ${title.toLowerCase()}`,
      `créer ${title.toLowerCase()} avec IA`,
      "exemple projet créé avec IA",
      "BeWork démonstration",
    ],
    ogTitle: `${title} — démonstration BeWork`,
  });
}
