import type { Metadata, Viewport } from "next";
import { Architects_Daughter, Geist_Mono, Inter, Rajdhani } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SEO_KEYWORDS_GLOBAL, SEO_VALUE_PROPOSITION, SEO_VALUE_PROPOSITION_SHORT } from "@/lib/seo-keywords";
import { jsonLdCountriesServed, jsonLdExpandedAreaServed } from "@/lib/jsonld-area-served";
import { absoluteUrl, CALENDLY_APPEL_DECOUVERTE_URL, getOrgSameAs, SITE_URL } from "@/lib/site";
import { formatPriceLabelFr, getPublicPriceBoundsLabels } from "@/lib/subscription-plans";

const defaultOgImage = absoluteUrl("/opengraph-image");
const SITE_PRICE_LOW_FR = formatPriceLabelFr(getPublicPriceBoundsLabels().low);

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

const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();
const bingSiteVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION?.trim();
const llmsTxtUrl = absoluteUrl("/llms.txt");

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "BeWork — Administratif externalisé BTP : artisans & conducteurs de travaux",
    template: "%s | BeWork",
  },
  description: `${SEO_VALUE_PROPOSITION} Vidéo. Forfaits TTC dès ${SITE_PRICE_LOW_FR} €/mois. Conducteurs de travaux, artisans, dirigeants BTP.`,
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
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    alternateLocale: ["fr_BE", "fr_CH", "fr_LU"],
    url: SITE_URL,
    siteName: "BeWork",
    title: "BeWork — Administratif externalisé BTP (artisans & conducteurs de travaux)",
    description: `${SEO_VALUE_PROPOSITION_SHORT} Vidéo. Dès ${SITE_PRICE_LOW_FR} € TTC.`,
    images: [
      {
        url: defaultOgImage,
        width: 1200,
        height: 630,
        alt: "BeWork — Administratif externalisé pour artisans et conducteurs de travaux (France, Belgique, Suisse, Luxembourg)",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BeWork — Partenaire administratif externalisé BTP",
    description: `${SEO_VALUE_PROPOSITION_SHORT} Vidéo. Dès ${SITE_PRICE_LOW_FR} € TTC.`,
    ...(process.env.NEXT_PUBLIC_TWITTER_SITE?.trim()
      ? { site: process.env.NEXT_PUBLIC_TWITTER_SITE.trim() }
      : {}),
    ...(process.env.NEXT_PUBLIC_TWITTER_CREATOR?.trim()
      ? { creator: process.env.NEXT_PUBLIC_TWITTER_CREATOR.trim() }
      : {}),
  },
  alternates: {
    canonical: SITE_URL,
    languages: { fr: SITE_URL, "x-default": SITE_URL },
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
  ...(googleSiteVerification || bingSiteVerification
    ? {
        verification: {
          ...(googleSiteVerification ? { google: googleSiteVerification } : {}),
          ...(bingSiteVerification ? { other: { "msvalidate.01": bingSiteVerification } } : {}),
        },
      }
    : {}),
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
        "BeWork — partenaire administratif externalisé",
        "BeWork — administratif BTP",
        "BeWork prestataire administratif externalisé",
        "BeWork pilotage administratif",
        "Administratif chantier artisans conducteurs travaux",
      ],
      description: SEO_VALUE_PROPOSITION,
      inLanguage: "fr-FR",
      publisher: { "@id": `${SITE_URL}/#organization` },
      image: { "@type": "ImageObject", url: defaultOgImage, width: 1200, height: 630 },
      potentialAction: {
        "@type": "ContactAction",
        name: "Demander un rendez-vous découverte ou un échange",
        target: CALENDLY_APPEL_DECOUVERTE_URL,
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
        "Administratif externalisé pour artisans, conducteurs de travaux et dirigeants d’entreprises du bâtiment : devis, facturation, relances, dossiers chantier — France, Belgique, Suisse, Luxembourg. Coordination depuis la France.",
      slogan: "Cadre, rigueur, pilotage et lecture terrain pour le BTP",
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
        "Intelligence artificielle appliquée à l'administratif",
      ],
    },
    {
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}/#service`,
      name: "BeWork — Partenaire administratif externalisé (BTP & PME)",
      description: `Administratif externalisé pour artisans, conducteurs de travaux et chefs d’entreprise du BTP : devis, facturation chantier, relances, dossiers (DICT, situations, AO). France, Belgique, Suisse, Luxembourg. Forfaits TTC dès ${SITE_PRICE_LOW_FR} €.`,
      url: SITE_URL,
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: jsonLdExpandedAreaServed(),
      serviceType: [
        "Externalisation administrative BTP",
        "Assistante travaux et dossiers chantier",
        "Suivi devis et relances clients",
        "Préparation documents travaux et réserves",
      ],
      audience: {
        "@type": "BusinessAudience",
        audienceType: "Conducteurs de travaux, artisans, sous-traitants et dirigeants d’entreprises du bâtiment",
      },
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
