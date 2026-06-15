import type { Metadata, Viewport } from "next";
import { Architects_Daughter, Geist_Mono, Inter, Rajdhani } from "next/font/google";
import "./globals.css";
import { PlausibleScript } from "@/components/analytics/PlausibleScript";
import { Providers } from "@/components/Providers";
import { SEO_KEYWORDS_GLOBAL, SEO_VALUE_PROPOSITION, SEO_VALUE_PROPOSITION_SHORT, BEWORK_SLOGAN, BEWORK_AEO_DEFINITION } from "@/lib/seo-keywords";
import { jsonLdCountriesServed, jsonLdExpandedAreaServed } from "@/lib/jsonld-area-served";
import {
  buildSearchEngineVerification,
  SEO_PUBLIC_ROBOTS,
} from "@/lib/seo-search-engines";
import {
  SEO_OG_ALTERNATE_LOCALES,
  SEO_OG_LOCALE_PRIMARY,
  hreflangFrancophonieLanguages,
} from "@/lib/seo-francophonie";
import { absoluteUrl, getOrgSameAs, SITE_URL } from "@/lib/site";
import {
  formatPriceLabelFr,
  getMarketingPriceBoundsLabels,
  getMarketingAggregateOfferDescription,
} from "@/lib/bework-public-offers";
import { SUBSCRIPTION_PRICE_TAX_LABEL } from "@/lib/subscription-plans";

const defaultOgImage = absoluteUrl("/opengraph-image");
const SITE_PRICE_LOW_FR = formatPriceLabelFr(getMarketingPriceBoundsLabels().monthlyLow);

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Interface & textes courants — lisibilité maximale */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/** Titres, cartes fortes, chiffres — esprit bureau d’études / plan technique */
const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

/** Micro-annotations façon « note sur plan » — usage très limité */
const architectsDaughter = Architects_Daughter({
  variable: "--font-blueprint-note",
  subsets: ["latin"],
  weight: ["400"],
});

const searchEngineVerification = buildSearchEngineVerification();
const llmsTxtUrl = absoluteUrl("/llms.txt");
const aiTxtUrl = absoluteUrl("/ai.txt");
const rssFeedUrl = absoluteUrl("/feed.xml");

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "BeWork — Assistants travaux IA pour chantiers, AO et marchés publics",
    template: "%s | BeWork",
  },
  description: SEO_VALUE_PROPOSITION,
  applicationName: "BeWork",
  authors: [{ name: "BeWork", url: SITE_URL }],
  creator: "BeWork",
  publisher: "BeWork",
  category: "business",
  keywords: [
    ...SEO_KEYWORDS_GLOBAL,
    "assistance technique BTP",
    "analyse DCE BTP",
    "mémoire technique BTP",
    "aide appel d'offres BTP",
    "gestion administrative chantier",
    "assistant conducteur de travaux",
    "Chorus Pro travaux",
    "suivi réserves chantier",
    "DICT déclaration travaux",
    "facturation chantier BTP",
  ],
  robots: SEO_PUBLIC_ROBOTS,
  openGraph: {
    type: "website",
    locale: SEO_OG_LOCALE_PRIMARY,
    alternateLocale: [...SEO_OG_ALTERNATE_LOCALES],
    url: SITE_URL,
    siteName: "BeWork",
    title: "BeWork — Assistants travaux IA pour chantiers, appels d'offres et marchés publics",
    description: `${SEO_VALUE_PROPOSITION_SHORT} ${BEWORK_SLOGAN}`,
    images: [
      {
        url: defaultOgImage,
        width: 1200,
        height: 630,
        alt: "BeWork — Assistance technique et administrative BTP par assistants travaux augmentés par l’IA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BeWork — Assistants travaux IA pour chantiers, AO et marchés publics",
    description: `${SEO_VALUE_PROPOSITION_SHORT} ${BEWORK_SLOGAN}`,
    ...(process.env.NEXT_PUBLIC_TWITTER_SITE?.trim()
      ? { site: process.env.NEXT_PUBLIC_TWITTER_SITE.trim() }
      : {}),
    ...(process.env.NEXT_PUBLIC_TWITTER_CREATOR?.trim()
      ? { creator: process.env.NEXT_PUBLIC_TWITTER_CREATOR.trim() }
      : {}),
  },
  alternates: {
    canonical: SITE_URL,
    languages: hreflangFrancophonieLanguages("/"),
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16.png", type: "image/png", sizes: "16x16" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
  ...(searchEngineVerification ? { verification: searchEngineVerification } : {}),
  appleWebApp: {
    capable: true,
    title: "BeWork",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

const orgSameAs = getOrgSameAs();

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "BeWork",
      alternateName: [
        "BeWork — assistants travaux augmentés par l’IA",
        "BeWork — assistance technique et administrative BTP",
        "BeWork assistant travaux BTP",
        "BeWork appels d'offres et marchés publics",
        "Assistants travaux BTP France Belgique Suisse Luxembourg",
      ],
      description: SEO_VALUE_PROPOSITION,
      inLanguage: "fr-FR",
      publisher: { "@id": `${SITE_URL}/#organization` },
      image: { "@type": "ImageObject", url: defaultOgImage, width: 1200, height: 630 },
      potentialAction: {
        "@type": "ContactAction",
        name: "Qualifier votre demande BTP via le formulaire BeWork",
        target: absoluteUrl("/contact#formulaire"),
      },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "BeWork",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: defaultOgImage, width: 1200, height: 630 },
      image: defaultOgImage,
      description:
        "Assistants travaux augmentés par l’IA pour entreprises du BTP : assistance technique et administrative — analyse DCE, aide au chiffrage, mémoire technique, suivi chantier, marchés publics, Chorus Pro, DOE et réserves. France, Belgique, Suisse, Luxembourg.",
      slogan: BEWORK_SLOGAN,
      areaServed: jsonLdExpandedAreaServed(),
      founder: {
        "@type": "Person",
        name: "Laure Olivie",
        jobTitle: "Fondatrice",
        knowsAbout: [
          "Bâtiment et travaux publics",
          "Conducteurs de travaux",
          "Direction d'entreprise",
          "Assistance technique BTP",
          "Analyse DCE et appels d'offres",
          "Suivi administratif de chantier",
        ],
      },
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "sales",
          url: absoluteUrl("/contact"),
          availableLanguage: ["French"],
          areaServed: jsonLdCountriesServed(),
        },
      ],
      ...(orgSameAs.length ? { sameAs: orgSameAs } : {}),
      knowsAbout: [
        "BTP",
        "Assistance technique BTP",
        "Analyse DCE",
        "Mémoire technique BTP",
        "Aide au chiffrage devis",
        "Conducteurs de travaux",
        "Entreprises générales et sous-traitants",
        "Marchés publics travaux",
        "Accords-cadres BTP",
        "Facturation Chorus Pro",
        "DOE marché public",
        "Appels d'offres BTP",
        "Suivi réserves chantier",
        "Coordination documentaire chantier",
        "Intelligence artificielle appliquée aux assistants travaux BTP",
      ],
    },
    {
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}/#service`,
      name: "BeWork — Assistants travaux augmentés par l’IA (BTP)",
      description: `${BEWORK_AEO_DEFINITION} ${BEWORK_SLOGAN} Forfaits ${SUBSCRIPTION_PRICE_TAX_LABEL} dès ${SITE_PRICE_LOW_FR} €.`,
      url: SITE_URL,
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: jsonLdExpandedAreaServed(),
      serviceType: [
        "Assistance technique et administrative BTP",
        "Assistants travaux augmentés par l’IA",
        "Analyse DCE et appels d'offres BTP",
        "Aide au chiffrage et mémoire technique",
        "Exécution marché public travaux",
        "Facturation Chorus Pro BTP",
        "Suivi documentaire chantier et DOE",
      ],
      audience: {
        "@type": "BusinessAudience",
        audienceType:
          "PME BTP, conducteurs de travaux, chargés d’affaires, titulaires de marchés publics et répondants aux appels d’offres",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#platform`,
      name: "BeWork",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: SITE_URL,
      description:
        "Plateforme d’assistants travaux augmentés par l’IA : assistance technique et administrative BTP, dépôt de missions, suivi documentaire chantier et traçabilité bureau-chantier.",
      offers: {
        "@type": "Offer",
        url: absoluteUrl("/tarifs"),
        priceCurrency: "EUR",
        price: SITE_PRICE_LOW_FR.replace(/\s/g, ""),
        availability: "https://schema.org/InStock",
        seller: { "@id": `${SITE_URL}/#organization` },
      },
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: jsonLdExpandedAreaServed(),
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="alternate" type="text/plain" href={llmsTxtUrl} title="Index pour assistants IA (llms.txt)" />
        <link rel="alternate" type="text/plain" href={aiTxtUrl} title="Politique indexation moteurs IA (ai.txt)" />
        <link rel="alternate" type="application/rss+xml" href={rssFeedUrl} title="Flux RSS BeWork" />
        <PlausibleScript />
      </head>
      <body
        className={`${inter.variable} ${rajdhani.variable} ${architectsDaughter.variable} ${geistMono.variable} min-w-0 overflow-x-clip antialiased text-base text-black`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
