import type { Metadata } from "next";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { HomeFaqAccordion } from "@/components/home/HomeFaqAccordion";
import { HomeFinalCta } from "@/components/home/HomeFinalCta";
import { HomeAgentsFamilies } from "@/components/home/HomeAgentsFamilies";
import { HomeDayProgression } from "@/components/home/HomeDayProgression";
import { HomeJourneeBlock } from "@/components/home/HomeJourneeBlock";
import { HomeMetierSelector } from "@/components/home/HomeMetierSelector";
import { HomeModalities } from "@/components/home/HomeModalities";
import { HomePlatformHero } from "@/components/home/HomePlatformHero";
import { HomePossibilitiesBento } from "@/components/home/HomePossibilitiesBento";
import { HomePricingSession } from "@/components/home/HomePricingSession";
import { HomeSkillsAfter } from "@/components/home/HomeSkillsAfter";
import { QualiopiTrustSection } from "@/components/qualiopi/QualiopiTrustSection";
import {
  buildMarketingPageMetadata,
  SEO_PAGES,
} from "@/lib/seo-formation-pages";
import { SITE_URL } from "@/lib/site";

const home = SEO_PAGES.home;
export const metadata: Metadata = buildMarketingPageMetadata({
  path: home.path,
  title: home.absoluteTitle,
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
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: `${SITE_URL}/opengraph-image`,
      },
      about: [
        { "@type": "Thing", name: "Créer avec l’IA" },
        { "@type": "Thing", name: "Créer sans savoir coder" },
        { "@type": "Thing", name: "Formation IA débutant" },
      ],
    },
  ],
};

/** Homepage BeWork V3 — expérience de marque (hero conservé). */
export default function HomePage() {
  return (
    <div className="min-h-screen min-w-0 overflow-x-clip bg-transparent">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <MarketingSiteHeader plainBg />
      <main className="bw-home-flow">
        <div className="bw-home-canvas" aria-hidden />
        <HomePlatformHero />
        <HomePossibilitiesBento />
        <HomeMetierSelector />
        <HomeAgentsFamilies />
        <HomeJourneeBlock />
        <HomeDayProgression />
        <HomeSkillsAfter />
        <HomeModalities />
        <QualiopiTrustSection />
        <HomePricingSession />
        <HomeFaqAccordion />
        <HomeFinalCta />
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
