import type { Metadata, Viewport } from "next";
import { Architects_Daughter, Geist_Mono, Inter, Manrope, Rajdhani } from "next/font/google";
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
    ...SEO_KEYWORDS_GLOBAL.filter((k) => !k.toLowerCase().includes("assistant") && !k.toLowerCase().includes("externalis")),
    "plateforme interne BTP",
    "analyse DCE BTP",
    "préparation candidature marché public",
    "mémoire technique BTP",
    "suivi administratif de marché",
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
        alt: "BeWork — Plateformes internes intelligentes pour les entreprises du BTP",
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
        "BeWork — plateformes internes intelligentes BTP",
        "BeWork — éditeur et intégrateur de plateforme métier",
        "BeWork plateforme BTP",
        "BeWork outils IA chantiers et marchés",
        "Plateforme interne BTP France Belgique Suisse Luxembourg",
      ],
      description: SEO_VALUE_PROPOSITION,
      inLanguage: "fr-FR",
      publisher: { "@id": `${SITE_URL}/#organization` },
      image: { "@type": "ImageObject", url: defaultOgImage, width: 1200, height: 630 },
      potentialAction: {
        "@type": "ContactAction",
        name: "Demander une démonstration personnalisée BeWork",
        target: absoluteUrl("/contact#formulaire"),
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
          "Plateformes métier BTP",
          "Analyse DCE et appels d'offres",
          "Pilotage documentaire chantier",
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
        "Plateforme interne BTP",
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
        "Intelligence artificielle appliquée au BTP",
      ],
    },
    {
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}/#service`,
      name: "BeWork — conception et évolution de plateformes internes BTP",
      description: `${BEWORK_AEO_DEFINITION} ${BEWORK_SLOGAN} ${BEWORK_SLOGAN_DECISION}`,
      url: SITE_URL,
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: jsonLdExpandedAreaServed(),
      serviceType: [
        "Conception de plateforme métier BTP",
        "Déploiement et configuration",
        "Intégration d'outils d'intelligence artificielle",
        "Formation et support",
        "Maintenance et évolution continue",
        "Analyse DCE et marchés (module plateforme)",
        "Suivi documentaire chantier et DOE (module plateforme)",
      ],
      audience: {
        "@type": "BusinessAudience",
        audienceType:
          "PME BTP, conducteurs de travaux, chargés d’affaires et dirigeants qui centralisent opérations et documents sur une plateforme interne",
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
        "Plateforme interne BeWork : équipes, chantiers, documents, marchés et outils IA — utilisée par les collaborateurs du client ; BeWork assure hébergement, maintenance et évolution.",
      offers: {
        "@type": "Offer",
        url: absoluteUrl("/tarifs"),
        priceCurrency: "EUR",
        description:
          "Mise en place initiale et abonnement mensuel sur étude personnalisée — utilisateurs, modules, personnalisation, IA et accompagnement.",
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
