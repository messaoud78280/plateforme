import type { Metadata, Viewport } from "next";
import { Architects_Daughter, Geist_Mono, Inter, Rajdhani } from "next/font/google";
import "./globals.css";
import { PlausibleScript } from "@/components/analytics/PlausibleScript";
import { Providers } from "@/components/Providers";
import { SEO_KEYWORDS_GLOBAL, SEO_VALUE_PROPOSITION, SEO_VALUE_PROPOSITION_SHORT, BEWORK_SLOGAN } from "@/lib/seo-keywords";
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
const rssFeedUrl = absoluteUrl("/feed.xml");

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "BeWork — Assistants travaux augmentés par l’IA pour le BTP",
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
    "agence pilotage administratif BTP",
    "secrétaire externalisé BTP",
    "organisation administrative bâtiment",
    "assistant administratif entreprise bâtiment",
    "situation de travaux artisan",
    "DICT déclaration travaux",
    "facturation chantier BTP",
    "trésorerie artisan bâtiment",
    "relances impayés BTP",
    "administratif intelligence artificielle",
    "vidéo présentation administratif BTP",
  ],
  robots: SEO_PUBLIC_ROBOTS,
  openGraph: {
    type: "website",
    locale: SEO_OG_LOCALE_PRIMARY,
    alternateLocale: [...SEO_OG_ALTERNATE_LOCALES],
    url: SITE_URL,
    siteName: "BeWork",
    title: "BeWork — Assistants travaux augmentés par l’IA (France, Belgique, Suisse, Luxembourg)",
    description: `${SEO_VALUE_PROPOSITION_SHORT} ${BEWORK_SLOGAN}`,
    images: [
      {
        url: defaultOgImage,
        width: 1200,
        height: 630,
        alt: "BeWork — Assistants travaux augmentés par l’IA pour le BTP (France, Belgique, Suisse, Luxembourg)",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BeWork — Assistants travaux augmentés par l’IA pour le BTP",
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
        "BeWork — relais bureau-chantier BTP",
        "BeWork administratif BTP",
        "BeWork pilotage administratif chantier",
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
        "Assistants travaux augmentés par l’IA pour artisans, conducteurs de travaux et dirigeants d’entreprises du bâtiment : devis, relances, dossiers chantier, appels d’offres — France, Belgique, Suisse, Luxembourg. Supervision depuis la France.",
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
          "Externalisation administrative",
          "Partenaire administratif externalisé",
          "Prestataire administratif PME",
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
        "Artisanat du bâtiment",
        "Conducteurs de travaux",
        "Entreprises générales et sous-traitants",
        "Facturation chantier",
        "Devis entreprise du bâtiment",
        "Externalisation administrative",
        "Partenaire administratif externalisé",
        "Intelligence artificielle appliquée aux assistants travaux BTP",
      ],
    },
    {
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}/#service`,
      name: "BeWork — Assistants travaux augmentés par l’IA (BTP)",
      description: `Assistants travaux externalisés pour artisans, conducteurs de travaux et dirigeants du BTP : devis, relances, dossiers chantier, DCE, PPSPS, DOE. ${BEWORK_SLOGAN} Forfaits ${SUBSCRIPTION_PRICE_TAX_LABEL} dès ${SITE_PRICE_LOW_FR} €.`,
      url: SITE_URL,
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: jsonLdExpandedAreaServed(),
      serviceType: [
        "Assistants travaux augmentés par l’IA",
        "Relais bureau-chantier BTP",
        "Suivi devis et relances clients",
        "Préparation documents travaux et réserves",
      ],
      audience: {
        "@type": "BusinessAudience",
        audienceType: "Conducteurs de travaux, artisans, sous-traitants et dirigeants d’entreprises du bâtiment",
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
        "Plateforme d’assistants travaux augmentés par l’IA : dépôt de missions, suivi des dossiers chantier et traçabilité bureau-chantier pour entreprises du BTP.",
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
        <link rel="alternate" type="application/rss+xml" href={rssFeedUrl} title="Flux RSS BeWork" />
        <PlausibleScript />
      </head>
      <body
        className={`${inter.variable} ${rajdhani.variable} ${architectsDaughter.variable} ${geistMono.variable} min-w-0 overflow-x-clip antialiased text-black`}
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
