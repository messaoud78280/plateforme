import type { Metadata } from "next";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { HomeFaqAccordion } from "@/components/home/HomeFaqAccordion";
import { HomeFinalCta } from "@/components/home/HomeFinalCta";
import { HomeJourneeBlock } from "@/components/home/HomeJourneeBlock";
import { HomeMetierSelector } from "@/components/home/HomeMetierSelector";
import { HomePlatformHero } from "@/components/home/HomePlatformHero";
import { HomePossibilitiesBento } from "@/components/home/HomePossibilitiesBento";
import { HomePricingSession } from "@/components/home/HomePricingSession";
import { HomeSkillsAfter } from "@/components/home/HomeSkillsAfter";
import { FORMATION_FAQ } from "@/lib/bework-formation";
import {
  beworkCourseJsonLd,
  beworkSessionOfferJsonLd,
  breadcrumbJsonLd,
  buildMarketingPageMetadata,
  SEO_PAGES,
} from "@/lib/seo-formation-pages";
import { SITE_URL } from "@/lib/site";

const home = SEO_PAGES.home;
const HOME_FAQ_ITEMS = FORMATION_FAQ.slice(0, 7);

export const metadata: Metadata = buildMarketingPageMetadata({
  path: home.path,
  title: home.absoluteTitle,
  absoluteTitle: home.absoluteTitle,
  description: home.description,
  keywords: [...home.keywords],
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
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1"],
      },
      mainEntity: { "@id": `${SITE_URL}/#course` },
    },
    beworkCourseJsonLd(),
    {
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}/#service-home`,
      name: "BeWork — journées pratiques créer avec l’IA",
      description: home.description,
      provider: { "@id": `${SITE_URL}/#organization` },
      url: SITE_URL,
      offers: beworkSessionOfferJsonLd(),
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      url: SITE_URL,
      inLanguage: "fr-FR",
      mainEntity: HOME_FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
    breadcrumbJsonLd([{ name: "Accueil", path: "/" }]),
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
        <HomeJourneeBlock />
        <HomeSkillsAfter />
        <HomePricingSession />
        <HomeFaqAccordion />
        <HomeFinalCta />
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
