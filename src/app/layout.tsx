import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
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
    default: "BeWork — Agence de pilotage administratif pour entreprises du BTP",
    template: "%s | BeWork",
  },
  description:
    "On tient le bureau, vous tenez le chantier : agence de pilotage administratif BTP — structuration, exécution et suivi administratif. Vidéo de présentation sur le site. Sans recruter. Forfaits TTC dès 290 €/mois.",
  applicationName: "BeWork",
  authors: [{ name: "BeWork", url: SITE_URL }],
  creator: "BeWork",
  publisher: "BeWork",
  category: "business",
  keywords: [
    "administratif BTP",
    "externalisation administrative BTP",
    "secrétaire externalisé BTP",
    "organisation administrative bâtiment",
    "assistant administratif entreprise bâtiment",
    "Île-de-France administratif BTP",
    "externalisation administrative",
    "pilotage administratif PME",
    "organisation entreprise bâtiment",
    "devis facturation chantier",
    "situation de travaux artisan",
    "DICT déclaration travaux",
    "facturation chantier BTP",
    "trésorerie artisan bâtiment",
    "relances impayés BTP",
    "délégation administrative",
    "rendez-vous découverte administratif dirigeant",
    "BeWork",
    "administratif intelligence artificielle",
    "assistant IA entreprise",
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
    title: "BeWork — Agence de pilotage administratif pour entreprises du BTP",
    description:
      "On tient le bureau, vous tenez le chantier : présentation en vidéo et pilotage administratif pour artisans et PME du bâtiment. Forfaits TTC. France, Belgique, Suisse, Luxembourg.",
    images: [
      {
        url: defaultOgImage,
        width: 1200,
        height: 630,
        alt: "BeWork — Agence de pilotage administratif pour le BTP",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BeWork — Agence de pilotage administratif BTP",
    description:
      "Vidéo + pilotage administratif encadré : devis, facturation, relances, dossiers chantier. Forfaits TTC.",
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
      alternateName: ["BeWork — administratif BTP", "BeWork partenaire administratif"],
      description:
        "Pilotage administratif externalisé pour artisans, entreprises du BTP et PME francophones. Organisation, devis, facturation, relances et dossiers chantier. France, Belgique, Suisse, Luxembourg.",
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
        "Organisation et pilotage administratif externalisé pour artisans, entreprises du bâtiment et PME : devis, facturation, relances, démarches chantier, coordination. Agence en Île-de-France, exécution supervisée depuis la France.",
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
        "Intelligence artificielle appliquée à l'administratif",
      ],
    },
    {
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}/#service`,
      name: "BeWork — Pilotage administratif externalisé",
      description:
        "Externalisation administrative pour PME, artisans et BTP : devis, facturation chantier, relances et suivi de dossiers. Utilisation encadrée d'outils d'aide à l'exécution. Trois forfaits TTC mensuels dès 290 €.",
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
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} font-sans antialiased text-black`}
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
