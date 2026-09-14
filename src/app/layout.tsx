import type { Metadata, Viewport } from "next";
import { Architects_Daughter, Geist_Mono, Inter, Manrope } from "next/font/google";
import "./globals.css";
import { PlausibleScript } from "@/components/analytics/PlausibleScript";
import { Providers } from "@/components/Providers";
import {
  SEO_VALUE_PROPOSITION,
  SEO_VALUE_PROPOSITION_SHORT,
  BEWORK_BRAND_SIGNATURE,
  BEWORK_SLOGAN,
  BEWORK_SLOGAN_DECISION,
  BEWORK_AEO_DEFINITION,
  SEO_SITE_TITLE_DEFAULT,
  SEO_SITE_TITLE_OG,
} from "@/lib/seo-keywords";
import {
  buildSearchEngineVerification,
  SEO_PUBLIC_ROBOTS,
} from "@/lib/seo-search-engines";
import { SEO_OG_LOCALE_PRIMARY } from "@/lib/seo-francophonie";
import {
  absoluteUrl,
  BEWORK_FOUNDER_LINKEDIN_URL,
  getOrgSameAs,
  SITE_URL,
} from "@/lib/site";
const defaultOgImage = absoluteUrl("/opengraph-image");
const defaultLogoImage = absoluteUrl("/icon-512.png");

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

/** Interface & textes courants — lisibilité maximale */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  preload: false,
});

/** Grands titres premium (refonte accueil) — usage ciblé, n’affecte pas --font-heading-family global. */
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

/** Micro-annotations façon « note sur plan » — usage très limité */
const architectsDaughter = Architects_Daughter({
  variable: "--font-blueprint-note",
  subsets: ["latin"],
  weight: ["400"],
  preload: false,
});

const searchEngineVerification = buildSearchEngineVerification();
const llmsTxtUrl = absoluteUrl("/llms.txt");
const aiTxtUrl = absoluteUrl("/ai.txt");
const feedUrl = absoluteUrl("/feed.xml");

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
  robots: SEO_PUBLIC_ROBOTS,
  openGraph: {
    type: "website",
    locale: SEO_OG_LOCALE_PRIMARY,
    url: SITE_URL,
    siteName: "BeWork",
    title: SEO_SITE_TITLE_OG,
    description: `${SEO_VALUE_PROPOSITION_SHORT} ${BEWORK_SLOGAN} ${BEWORK_SLOGAN_DECISION}`,
    images: [
      {
        url: defaultOgImage,
        width: 1200,
        height: 630,
        alt: `BeWork — ${BEWORK_BRAND_SIGNATURE}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SEO_SITE_TITLE_OG,
    description: `${SEO_VALUE_PROPOSITION_SHORT} ${BEWORK_SLOGAN}`,
    images: [defaultOgImage],
    ...(process.env.NEXT_PUBLIC_TWITTER_SITE?.trim()
      ? { site: process.env.NEXT_PUBLIC_TWITTER_SITE.trim() }
      : {}),
    ...(process.env.NEXT_PUBLIC_TWITTER_CREATOR?.trim()
      ? { creator: process.env.NEXT_PUBLIC_TWITTER_CREATOR.trim() }
      : {}),
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
        `BeWork — ${BEWORK_BRAND_SIGNATURE}`,
        "BeWork — formation création avec l’IA",
        "Apprendre à créer sites et applications avec l’IA",
      ],
      description: SEO_VALUE_PROPOSITION,
      inLanguage: "fr-FR",
      publisher: { "@id": `${SITE_URL}/#organization` },
      image: { "@type": "ImageObject", url: defaultOgImage, width: 1200, height: 630 },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "BeWork",
      legalName: "OFC CREATION D’ENTREPRISE",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: defaultLogoImage, width: 512, height: 512 },
      image: defaultOgImage,
      description: BEWORK_AEO_DEFINITION,
      slogan: `${BEWORK_BRAND_SIGNATURE}. ${BEWORK_SLOGAN}`,
      address: {
        "@type": "PostalAddress",
        streetAddress: "6 rue Henri Dunant",
        postalCode: "78280",
        addressLocality: "Guyancourt",
        addressCountry: "FR",
      },
      founder: {
        "@type": "Person",
        name: "Laure Olivie",
        jobTitle: "Fondatrice",
        sameAs: BEWORK_FOUNDER_LINKEDIN_URL,
        knowsAbout: [
          "Formation création avec l’intelligence artificielle",
          "Autonomie numérique professionnelle",
          "Création d’outils métiers sans programmation",
          "Pédagogie pratique petit groupe",
        ],
      },
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "sales",
          url: absoluteUrl("/contact"),
          availableLanguage: ["French"],
        },
      ],
      ...(orgSameAs.length ? { sameAs: orgSameAs } : {}),
      knowsAbout: [
        "Formation création avec l’IA",
        "Créer une application sans savoir coder",
        "Créer un site avec l’intelligence artificielle",
        "Outils numériques professionnels",
        "Autonomie numérique",
        "Formation pratique petit groupe",
      ],
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
        <link rel="alternate" type="application/rss+xml" href={feedUrl} title="BeWork — pages publiques" />
        <link rel="alternate" type="text/plain" href={llmsTxtUrl} title="Index pour assistants IA (llms.txt)" />
        <link rel="alternate" type="text/plain" href={aiTxtUrl} title="Politique indexation moteurs IA (ai.txt)" />
        <PlausibleScript />
      </head>
      <body
        className={`${inter.variable} ${manrope.variable} ${architectsDaughter.variable} ${geistMono.variable} min-w-0 overflow-x-clip antialiased text-base text-black`}
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
