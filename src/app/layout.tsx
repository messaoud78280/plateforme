import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bework.fr";

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

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "BeWork — Assistant administratif externalisé & secrétariat à distance | Francophone",
    template: "%s | BeWork",
  },
  description:
    "Assistant administratif externalisé et assistant virtuel francophone pour PME et dirigeants. Secrétariat externalisé, externalisation administrative. Direction et supervision opérationnelle en France. Dès 215€/mois.",
  keywords: [
    "assistant administratif externalisé",
    "assistant virtuel francophone",
    "secrétariat externalisé",
    "assistant administratif à distance",
    "externalisation administrative",
    "BeWork",
  ],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: BASE_URL,
    siteName: "BeWork",
    title: "BeWork — Assistant administratif externalisé & secrétariat à distance",
    description:
      "Assistant administratif externalisé pour PME et dirigeants. Plateforme internationale supervisée depuis la France. Dès 215€/mois.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "BeWork - Assistant administratif externalisé" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BeWork — Assistant administratif externalisé",
    description: "Assistant administratif externalisé pour PME. Dès 215€/mois.",
  },
  alternates: { canonical: BASE_URL },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "BeWork",
      url: BASE_URL,
      description: "Assistant administratif externalisé et secrétariat à distance pour PME et dirigeants francophones.",
      areaServed: ["FR", "BE", "CH", "LU"],
    },
    {
      "@type": "ProfessionalService",
      "@id": `${BASE_URL}/#service`,
      name: "BeWork - Assistant administratif externalisé",
      description: "Externalisation administrative pour PME : assistant virtuel, secrétariat à distance, devis, factures, relances. Dès 215€/mois.",
      url: BASE_URL,
      provider: { "@id": `${BASE_URL}/#organization` },
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
