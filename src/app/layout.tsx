import type { Metadata, Viewport } from "next";
import { Architects_Daughter, Geist_Mono, Inter, Rajdhani } from "next/font/google";
import "./globals.css";
import { PlausibleScript } from "@/components/analytics/PlausibleScript";
import { Providers } from "@/components/Providers";
import {
  SEO_KEYWORDS_GLOBAL,
  SEO_VALUE_PROPOSITION,
  SEO_VALUE_PROPOSITION_SHORT,
  BEWORK_SLOGAN,
  BEWORK_SLOGAN_DECISION,
  BEWORK_AEO_DEFINITION,
  SEO_SITE_TITLE_DEFAULT,
  SEO_SITE_TITLE_OG,
} from "@/lib/seo-keywords";
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
    default: SEO_SITE_TITLE_DEFAULT,
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
    "renfort administratif BTP",
    "analyse DCE BTP",
    "préparation candidature marché public",
    "mémoire technique BTP",
    "suivi administratif de marché",
    "assistant travaux appels d’offres",
    "Chorus Pro travaux",
    "suivi réserves chantier",
    "DOE marché public",
    "facturation chantier BTP",
  ],
  robots: SEO_PUBLIC_ROBOTS,
  openGraph: {
    type: "website",
    locale: SEO_OG_LOCALE_PRIMARY,
    alternateLocale: [...SEO_OG_ALTERNATE_LOCALES],
    url: SITE_URL,
    siteName: "BeWork",
    title: SEO_SITE_TITLE_OG,
    description: `${SEO_VALUE_PROPOSITION_SHORT} ${BEWORK_SLOGAN} ${BEWORK_SLOGAN_DECISION}`,
    images: [
      {
        url: defaultOgImage,
        width: 1200,
        height: 630,
        alt: "BeWork — Renfort assistants travaux BTP : candidatures, DCE et suivi des marchés",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SEO_SITE_TITLE_OG,
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
        "Assistants travaux BTP : renfort candidatures, analyse DCE et suivi administratif des marchés publics et privés — sous validation du client. France, Belgique, Suisse, Luxembourg.",
      slogan: BEWORK_SLOGAN,
      address: {
        "@type": "PostalAddress",
        streetAddress: "6 rue Henri Dunant",
        postalCode: "78280",
        addressLocality: "Guyancourt",
        addressCountry: "FR",
      },
      areaServed: jsonLdExpandedAreaServed(),
      founder: {
        "@type": "Person",
        name: "Laure Olivie",
        jobTitle: "Fondatrice",
        knowsAbout: [
          "Bâtiment et travaux publics",
          "Conducteurs de travaux",
          "Direction d'entreprise",
          "Renfort administratif BTP",
          "Analyse DCE et appels d'offres",
          "Suivi administratif de marché",
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
        "Renfort administratif BTP",
        "Analyse DCE",
        "Préparation candidature marché public",
        "Mémoire technique BTP",
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
      name: "BeWork — Renfort assistants travaux BTP",
      description: `${BEWORK_AEO_DEFINITION} ${BEWORK_SLOGAN} ${BEWORK_SLOGAN_DECISION} Forfaits ${SUBSCRIPTION_PRICE_TAX_LABEL} dès ${SITE_PRICE_LOW_FR} €.`,
      url: SITE_URL,
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: jsonLdExpandedAreaServed(),
      serviceType: [
        "Renfort administratif BTP",
        "Assistants travaux spécialisés",
        "Analyse DCE et préparation candidatures",
        "Organisation réponse appel d'offres BTP",
        "Suivi administratif marché public",
        "Facturation Chorus Pro BTP",
        "Suivi documentaire chantier et DOE",
      ],
      audience: {
        "@type": "BusinessAudience",
        audienceType:
          "PME BTP, conducteurs de travaux, chargés d’affaires et dirigeants qui préparent des candidatures ou suivent administrativement des marchés",
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
        "Plateforme BeWork : dépôt de missions assistants travaux, suivi documentaire et traçabilité bureau-chantier — sous validation du client.",
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
