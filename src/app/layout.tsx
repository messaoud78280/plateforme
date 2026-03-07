import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

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
  title: "BeWork — Assistant administratif externalisé & secrétariat à distance | Francophone",
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
    title: "BeWork — Assistant administratif externalisé & secrétariat à distance",
    description:
      "Assistant administratif externalisé pour PME et dirigeants. Plateforme internationale supervisée depuis la France. Dès 215€/mois.",
  },
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
