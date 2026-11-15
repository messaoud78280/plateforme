import type { Metadata } from "next";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BtpComplementaryOffers } from "@/components/marketing-btp/BtpComplementaryOffers";
import { BtpCtaBand } from "@/components/marketing-btp/BtpCtaBand";
import { BtpDualOffers } from "@/components/marketing-btp/BtpDualOffers";
import { BtpFaq } from "@/components/marketing-btp/BtpFaq";
import { BtpHomeHero } from "@/components/marketing-btp/BtpHomeHero";
import { BtpMissionFlow } from "@/components/marketing-btp/BtpMissionFlow";
import { BtpWhyBework } from "@/components/marketing-btp/BtpWhyBework";
import "@/components/marketing-btp/btp-marketing.css";
import {
  BTP_CTA_PARLER_CHANTIER,
  BTP_FAQ,
  BTP_SEO_PAGES,
  BEWORK_BTP_VALUE_PROPOSITION,
} from "@/lib/bework-btp-services";
import { buildMarketingPageMetadata } from "@/lib/seo-formation-pages";
import { SITE_URL } from "@/lib/site";

const home = BTP_SEO_PAGES.home;
export const metadata: Metadata = buildMarketingPageMetadata({
  path: home.path,
  title: home.title,
  absoluteTitle: home.absoluteTitle,
  description: home.description,
});

const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/#webpage`,
      url: SITE_URL,
      name: home.absoluteTitle,
      description: home.description,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: [
        { "@type": "Thing", name: "Conduite de travaux externalisée" },
        { "@type": "Thing", name: "Équipes TP/VRD en régie" },
        { "@type": "Thing", name: "Conducteur de travaux externalisé" },
        { "@type": "Thing", name: "Maçon VRD en régie" },
      ],
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "BeWork",
      url: SITE_URL,
      description: BEWORK_BTP_VALUE_PROPOSITION,
      areaServed: ["Yvelines", "Île-de-France", "France"],
    },
    {
      "@type": "Service",
      name: "Conduite de travaux externalisée",
      provider: { "@id": `${SITE_URL}/#organization` },
      description:
        "Conducteur de travaux externalisé, chef de chantier en régie, pilotage et coordination des chantiers BTP — missions contractualisées.",
      areaServed: ["Yvelines", "Île-de-France", "France"],
      url: `${SITE_URL}/conduite-de-travaux`,
    },
    {
      "@type": "Service",
      name: "Équipes opérationnelles TP/VRD en régie",
      provider: { "@id": `${SITE_URL}/#organization` },
      description:
        "Chefs d’équipe et maçons VRD pour renforcer les chantiers TP, voirie, réseaux et aménagements — prestations en régie contractualisées.",
      areaServed: ["Yvelines", "Île-de-France", "France"],
      url: `${SITE_URL}/equipes-tp-vrd`,
    },
  ],
};

export default function HomePage() {
  return (
    <div className="bw-btp-site min-h-screen min-w-0 overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <MarketingSiteHeader plainBg />
      <main>
        <BtpHomeHero />
        <BtpDualOffers />
        <BtpComplementaryOffers />
        <BtpMissionFlow />
        <BtpWhyBework />
        <BtpFaq items={BTP_FAQ} title="FAQ — missions BTP" />
        <BtpCtaBand
          title="Parlons de votre chantier."
          subtitle="Demandez un conducteur de travaux ou une équipe TP/VRD en régie. Nous étudions le périmètre et proposons une mission sur devis."
          ctaHref={BTP_CTA_PARLER_CHANTIER.href}
          ctaLabel={BTP_CTA_PARLER_CHANTIER.label}
        />
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
