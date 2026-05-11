import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans, Inter, Manrope, Orbitron } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SEO_KEYWORDS_GLOBAL, SEO_VALUE_PROPOSITION, SEO_VALUE_PROPOSITION_SHORT } from "@/lib/seo-keywords";
import { absoluteUrl, CALENDLY_APPEL_DECOUVERTE_URL, getOrgSameAs, SITE_URL } from "@/lib/site";
import { formatPriceLabelFr, getPublicPriceBoundsLabels } from "@/lib/subscription-plans";

const defaultOgImage = absoluteUrl("/opengraph-image");
const SITE_PRICE_LOW_FR = formatPriceLabelFr(getPublicPriceBoundsLabels().low);

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Corps de texte — esprit « plan / ingénierie », complémentaire au logo blueprint */
const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/** Titres marketing (hero & co.) — aligné rendu desktop type ~64–68 px */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["700", "800"],
});

/** Slogan / accroches — lisible, moins « tech » qu’Orbitron */
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

/** Logo BeWork (pastille BW + mot) — identité d’origine */
const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();

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
  alternates: { canonical: SITE_URL, languages: { fr: SITE_URL, "x-default": SITE_URL } },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16.png", type: "image/png", sizes: "16x16" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
  ...(googleSiteVerification ? { verification: { google: googleSiteVerification } } : {}),
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
      areaServed: [
        { "@type": "Country", name: "France" },
        { "@type": "Country", name: "Belgique" },
        { "@type": "Country", name: "Suisse" },
        { "@type": "Country", name: "Luxembourg" },
      ],
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
          areaServed: [
            { "@type": "Country", name: "France" },
            { "@type": "Country", name: "Belgique" },
            { "@type": "Country", name: "Suisse" },
            { "@type": "Country", name: "Luxembourg" },
          ],
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
      areaServed: [
        { "@type": "Country", name: "France" },
        { "@type": "Country", name: "Belgique" },
        { "@type": "Country", name: "Suisse" },
        { "@type": "Country", name: "Luxembourg" },
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${ibmPlexSans.variable} ${inter.variable} ${manrope.variable} ${orbitron.variable} min-w-0 overflow-x-clip font-sans antialiased text-black`}
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
