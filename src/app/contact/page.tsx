import type { Metadata } from "next";
import ContactForm from "./ContactForm";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { absoluteUrl } from "@/lib/site";

const pageUrl = absoluteUrl("/contact");
const contactOgImage = absoluteUrl("/opengraph-image");

export const metadata: Metadata = {
  title: "Cadrage et prise de contact | BeWork",
  description:
    "Échange avec BeWork pour présenter votre organisation, votre charge administrative et vérifier l’adéquation avec nos forfaits BTP. Créneau visio et rappel par email.",
  alternates: { canonical: pageUrl, languages: { fr: pageUrl, "x-default": pageUrl } },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: pageUrl,
    siteName: "BeWork",
    title: "Cadrage et contact — BeWork",
    description:
      "Demandez un échange pour cartographier votre administratif et valider l’adéquation avec nos forfaits entreprises du bâtiment.",
    images: [{ url: contactOgImage, width: 1200, height: 630, alt: "Contacter BeWork — partenaire administratif BTP" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact BeWork",
    description: "Cadrage administratif pour artisans et entreprises du bâtiment.",
  },
  robots: { index: true, follow: true },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] via-[#eef0f4] to-[#e0e4ea]">
      <MarketingSiteHeader plainBg />
      <ContactForm />
    </div>
  );
}
