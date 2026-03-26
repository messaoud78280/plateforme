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
    default: "BeWork — Assistant administratif externalisé & secrétariat à distance | Francophone",
    template: "%s | BeWork",
  },
  description:
    "Assistant administratif externalisé et assistant virtuel francophone pour PME et dirigeants. Secrétariat externalisé, externalisation administrative. Direction et supervision opérationnelle en France. Dès 215 € TTC/mois.",
  applicationName: "BeWork",
  authors: [{ name: "BeWork", url: SITE_URL }],
  creator: "BeWork",
  publisher: "BeWork",
  category: "business",
  keywords: [
    "assistant administratif externalisé",
    "assistant virtuel francophone",
    "secrétariat externalisé",
    "assistant administratif à distance",
    "externalisation administrative",
    "assistant administratif PME",
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
    title: "BeWork — Assistant administratif externalisé & secrétariat à distance",
    description:
      "Assistant administratif externalisé pour PME et dirigeants. Plateforme internationale supervisée depuis la France. Dès 215 € TTC/mois.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BeWork — Assistant administratif externalisé",
    description: "Assistant administratif externalisé pour PME. Dès 215 € TTC/mois.",
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
        "Assistant administratif externalisé et secrétariat à distance pour PME et dirigeants francophones. France, Belgique, Suisse, Luxembourg.",
      inLanguage: "fr-FR",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "BeWork",
      url: SITE_URL,
      description: "Assistant administratif externalisé et secrétariat à distance pour PME et dirigeants francophones.",
      areaServed: ["FR", "BE", "CH", "LU"],
    },
    {
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}/#service`,
      name: "BeWork - Assistant administratif externalisé",
      description: "Externalisation administrative pour PME : assistant virtuel, secrétariat à distance, devis, factures, relances. Dès 215 € TTC/mois.",
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
