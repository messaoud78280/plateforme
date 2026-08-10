import type { Metadata, Viewport } from "next";
import { Architects_Daughter, Geist_Mono, Inter, Manrope, Rajdhani } from "next/font/google";
import "./globals.css";
import { PlausibleScript } from "@/components/analytics/PlausibleScript";
import { Providers } from "@/components/Providers";
import {
  SEO_KEYWORDS_GLOBAL,
  SEO_VALUE_PROPOSITION,
  SEO_VALUE_PROPOSITION_SHORT,
  BEWORK_BRAND_SIGNATURE,
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
const defaultOgImage = absoluteUrl("/opengraph-image");
const defaultLogoImage = absoluteUrl("/icon-512.png");

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

/** Grands titres premium (refonte accueil) — usage ciblé, n’affecte pas --font-heading-family global. */
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
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
    BEWORK_BRAND_SIGNATURE,
    ...SEO_KEYWORDS_GLOBAL.filter((k) => !k.toLowerCase().includes("assistant") && !k.toLowerCase().includes("externalis")),
    "solutions IA sur mesure BTP",
    "conception solution IA BTP",
    "plateforme métier BTP",
    "analyse DCE BTP",
    "analyse documentaire BTP",
    "automatisation BTP",
    "formation équipes IA",
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
        alt: `BeWork — ${BEWORK_BRAND_SIGNATURE}`,
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
        `BeWork — ${BEWORK_BRAND_SIGNATURE}`,
        "BeWork — La technologie construite autour de votre entreprise",
        "BeWork solutions IA BTP",
        "BeWork plateforme métier BTP",
        "Plateformes métier. Solutions IA. Expertise BTP.",
      ],
      description: SEO_VALUE_PROPOSITION,
      inLanguage: "fr-FR",
      publisher: { "@id": `${SITE_URL}/#organization` },
      image: { "@type": "ImageObject", url: defaultOgImage, width: 1200, height: 630 },
      potentialAction: {
        "@type": "ContactAction",
        name: "Parler d’un besoin IA ou plateforme à BeWork",
        target: absoluteUrl("/#besoin"),
      },
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
      areaServed: jsonLdExpandedAreaServed(),
      founder: {
        "@type": "Person",
        name: "Laure Olivie",
        jobTitle: "Fondatrice",
        knowsAbout: [
          "Bâtiment et travaux publics",
          "Conducteurs de travaux",
          "Direction d'entreprise",
          "Solutions IA métier BTP",
          "Plateformes métier BTP",
          "Analyse documentaire et DCE",
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
        "Solutions IA sur mesure",
        "Automatisation métier BTP",
        "Analyse documentaire BTP",
        "Plateforme métier BTP",
        "Intégration IA aux logiciels existants",
        "Analyse DCE",
        "Mémoire technique BTP",
        "Conducteurs de travaux",
        "Marchés publics travaux",
        "Intelligence artificielle appliquée au BTP",
        "Formation et adoption d'outils IA",
      ],
    },
    {
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}/#service`,
      name: `BeWork — ${BEWORK_BRAND_SIGNATURE}`,
      description: `${BEWORK_AEO_DEFINITION} ${BEWORK_SLOGAN} ${BEWORK_SLOGAN_DECISION}`,
      url: SITE_URL,
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: jsonLdExpandedAreaServed(),
      serviceType: [
        BEWORK_BRAND_SIGNATURE,
        "Conception de solutions IA métier",
        "Automatisations et assistants IA",
        "Analyse documentaire BTP",
        "Intégration IA aux outils existants",
        "Conception de plateformes métier BTP",
        "Formation et accompagnement à l'adoption",
        "Maintenance et évolution continue",
      ],
      audience: {
        "@type": "BusinessAudience",
        audienceType:
          "PME BTP, entreprises générales, dirigeants, chargés d’affaires et conducteurs de travaux qui veulent une solution IA ou une plateforme adaptée à leur organisation",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#platform`,
      name: "Plateforme BeWork",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: SITE_URL,
      description:
        "Environnement de travail BeWork : équipes, chantiers, documents, marchés et outils IA — une offre majeure et une démonstration du savoir-faire BeWork. Utilisée par les collaborateurs du client ; BeWork assure conception, hébergement, maintenance et évolution.",
      offers: {
        "@type": "Offer",
        url: absoluteUrl("/tarifs"),
        priceCurrency: "EUR",
        description:
          "Projet IA sur mesure ou plateforme BeWork : mise en place et accompagnement sur étude — utilisateurs, modules, personnalisation et formation.",
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
        className={`${inter.variable} ${rajdhani.variable} ${manrope.variable} ${architectsDaughter.variable} ${geistMono.variable} min-w-0 overflow-x-clip antialiased text-base text-black`}
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
