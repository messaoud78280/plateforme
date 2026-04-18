import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope, Orbitron } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SEO_KEYWORDS_GLOBAL } from "@/lib/seo-keywords";
import { absoluteUrl, getOrgSameAs, SITE_URL } from "@/lib/site";

const defaultOgImage = absoluteUrl("/opengraph-image");

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Slogan / accroches — lisible, moins « tech » qu’Orbitron */
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

/** Logo BeWork (pastille BW + mot) — identité d’origine */
const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "BeWork — Partenaire administratif externalisé BTP & PME | Pilotage administratif",
    template: "%s | BeWork",
  },
  description:
    "Partenaire administratif externalisé pour artisans et PME du bâtiment : pilotage administratif, devis, facturation, relances et dossiers chantier. On tient le bureau, vous tenez le chantier. Vidéo sur le site. Sans recruter — forfaits TTC dès 290 €/mois. France, Belgique, Suisse, Luxembourg.",
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
    title: "BeWork — Partenaire administratif externalisé BTP & PME",
    description:
      "Partenaire administratif externalisé : pilotage administratif pour artisans et PME du bâtiment — devis, relances, dossiers chantier. Présentation en vidéo. Forfaits TTC. France, Belgique, Suisse, Luxembourg.",
    images: [
      {
        url: defaultOgImage,
        width: 1200,
        height: 630,
        alt: "BeWork — Partenaire administratif externalisé pour le BTP et les PME",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BeWork — Partenaire administratif externalisé BTP",
    description:
      "Partenaire administratif externalisé : vidéo + pilotage encadré — devis, facturation, relances, dossiers chantier. Forfaits TTC.",
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
      ],
      description:
        "Partenaire administratif externalisé pour artisans, entreprises du BTP et PME : pilotage administratif, organisation, devis, facturation, relances et dossiers chantier. France, Belgique, Suisse, Luxembourg.",
      inLanguage: "fr-FR",
      publisher: { "@id": `${SITE_URL}/#organization` },
      image: { "@type": "ImageObject", url: defaultOgImage, width: 1200, height: 630 },
      potentialAction: {
        "@type": "ContactAction",
        name: "Demander un rendez-vous découverte ou un échange",
        target: absoluteUrl("/contact"),
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
        "Partenaire administratif externalisé : organisation et pilotage pour artisans, entreprises du bâtiment et PME — devis, facturation, relances, démarches chantier, coordination. Agence en Île-de-France, exécution supervisée depuis la France.",
      slogan: "Cadre, rigueur, pilotage et lecture terrain pour le BTP",
      areaServed: ["FR", "BE", "CH", "LU"],
      founder: {
        "@type": "Person",
        name: "Laure Olivie",
        jobTitle: "Fondatrice",
        knowsAbout: [
          "Bâtiment et travaux publics",
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
          areaServed: ["FR", "BE", "CH", "LU"],
        },
      ],
      ...(orgSameAs.length ? { sameAs: orgSameAs } : {}),
      knowsAbout: [
        "BTP",
        "Artisanat du bâtiment",
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
      description:
        "Partenaire administratif externalisé pour PME, artisans et BTP : devis, facturation chantier, relances et suivi de dossiers. Outils d’aide à l’exécution encadrés. Trois forfaits TTC mensuels dès 290 €.",
      url: SITE_URL,
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: {
        "@type": "GeoCircle",
        geoMidpoint: { "@type": "GeoCoordinates", latitude: 48.8566, longitude: 2.3522 },
        geoRadius: "1000000",
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
        className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} ${orbitron.variable} font-sans antialiased text-black`}
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
