import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "BeWork — Administratif & organisation pour artisans, BTP et PME | Francophone",
    template: "%s | BeWork",
  },
  description:
    "Pilotage administratif externalisé pour artisans, entreprises du bâtiment et PME francophones : devis, facturation chantier, relances, organisation. Secrétariat et externalisation administrative supervisés depuis la France. Dès 215 € TTC/mois.",
  applicationName: "BeWork",
  authors: [{ name: "BeWork", url: SITE_URL }],
  creator: "BeWork",
  publisher: "BeWork",
  category: "business",
  keywords: [
    "administratif BTP",
    "assistant administratif externalisé",
    "secrétariat externalisé",
    "externalisation administrative",
    "pilotage administratif PME",
    "organisation entreprise bâtiment",
    "devis facturation chantier",
    "délégation administrative",
    "BeWork",
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
    title: "BeWork — Administratif externalisé pour BTP, artisans et PME",
    description:
      "Organisation et pilotage administratif pour le bâtiment et les entreprises francophones. Supervision depuis la France. Dès 215 € TTC/mois.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BeWork — Administratif & organisation (BTP, artisans, PME)",
    description: "Externalisation administrative et secrétariat à distance. Dès 215 € TTC/mois.",
  },
  alternates: { canonical: SITE_URL, languages: { fr: SITE_URL } },
  ...(googleSiteVerification ? { verification: { google: googleSiteVerification } } : {}),
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "BeWork",
      description:
        "Pilotage administratif externalisé pour artisans, entreprises du BTP et PME francophones. Secrétariat et organisation à distance. France, Belgique, Suisse, Luxembourg.",
      inLanguage: "fr-FR",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "BeWork",
      url: SITE_URL,
      description:
        "Services d'organisation et de pilotage administratif externalisé pour artisans, entreprises du bâtiment et PME francophones.",
      areaServed: ["FR", "BE", "CH", "LU"],
      knowsAbout: [
        "BTP",
        "Artisanat du bâtiment",
        "Facturation chantier",
        "Devis entreprise du bâtiment",
        "Externalisation administrative",
      ],
    },
    {
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}/#service`,
      name: "BeWork — Pilotage administratif externalisé",
      description:
        "Externalisation administrative pour PME, artisans et BTP : devis, facturation chantier, relances, secrétariat et suivi de dossiers. Dès 215 € TTC/mois.",
      url: SITE_URL,
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: { "@type": "GeoCircle", geoMidpoint: { "@type": "GeoCoordinates", latitude: 48.8566, longitude: 2.3522 }, geoRadius: "1000000" },
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
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} antialiased`}
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
