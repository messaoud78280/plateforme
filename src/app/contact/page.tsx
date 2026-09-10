import type { Metadata } from "next";
import { ParticiperPageContent } from "@/components/contact/ParticiperPageContent";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BEWORK_FORMATION_TAGLINE, BEWORK_SESSION_PRICE_EUR } from "@/lib/bework-formation";
import { absoluteUrl } from "@/lib/site";

const CONTACT_PAGE_PATH = "/contact" as const;
const pageUrl = absoluteUrl(CONTACT_PAGE_PATH);

export const metadata: Metadata = {
  title: "Participer — Journée BeWork pour créer avec l’IA",
  description: `Journée pratique BeWork (${BEWORK_SESSION_PRICE_EUR} €) : apprenez à passer de l’idée à la construction avec l’IA, sans savoir coder. Demandez une place.`,
  alternates: { canonical: pageUrl },
  openGraph: {
    title: "Participer à une journée BeWork",
    description: BEWORK_FORMATION_TAGLINE,
    url: pageUrl,
    type: "website",
  },
};

const contactJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ContactPage",
      "@id": `${pageUrl}#contact-page`,
      url: pageUrl,
      name: "Participer — Journée BeWork",
      inLanguage: "fr-FR",
      isPartOf: { "@id": `${absoluteUrl("/")}#website` },
      description:
        "Présentation de la journée BeWork et demande de place pour une session pratique de création avec l’IA.",
      mainEntity: { "@id": `${absoluteUrl("/")}#organization` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Participer", item: pageUrl },
      ],
    },
  ],
};

export default function ContactPage() {
  return (
    <div className="min-h-screen min-w-0 overflow-x-clip bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }}
      />
      <MarketingSiteHeader plainBg />
      <main>
        <ParticiperPageContent />
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
