import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { HomeAudienceProfiles } from "@/components/home/HomeAudienceProfiles";
import { HomeCreateShowcase } from "@/components/home/HomeCreateShowcase";
import { HomeDemoClose } from "@/components/home/HomeDemoClose";
import { HomeEmotionalShift } from "@/components/home/HomeEmotionalShift";
import { HomeFormationDay } from "@/components/home/HomeFormationDay";
import { HomeMetierIdeas } from "@/components/home/HomeMetierIdeas";
import { HomePlatformHero } from "@/components/home/HomePlatformHero";
import { HomePossibilityBridge } from "@/components/home/HomePossibilityBridge";
import { HomePricingSession } from "@/components/home/HomePricingSession";
import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HomeSmallGroups } from "@/components/home/HomeSmallGroups";
import { HomeStartFromZero } from "@/components/home/HomeStartFromZero";
import { HOME_SECTION } from "@/components/home/homeSectionStyles";
import { SeoInternalLinks } from "@/components/seo/SeoInternalLinks";
import { FORMATION_FAQ, BEWORK_FORMATION_TAGLINE } from "@/lib/bework-formation";
import { jsonLdExpandedAreaServed } from "@/lib/jsonld-area-served";
import {
  SEO_OG_ALTERNATE_LOCALES,
  hreflangFrancophonieLanguages,
  metaDescriptionFrancophonie,
} from "@/lib/seo-francophonie";
import {
  BEWORK_BRAND_SIGNATURE,
  SEO_KEYWORDS_HOME,
  SEO_SITE_TITLE_DEFAULT,
} from "@/lib/seo-keywords";
import { SITE_URL } from "@/lib/site";

const HOME_META_TITLE = SEO_SITE_TITLE_DEFAULT;
const HOME_META_DESCRIPTION = metaDescriptionFrancophonie(
  "Formation pratique d’une journée pour apprendre à créer sites, applications et outils numériques avec l’intelligence artificielle — sans prérequis en programmation. 200 € / participant.",
);

const HOME_FAQ_ITEMS = FORMATION_FAQ.slice(0, 4);

export const metadata: Metadata = {
  title: { absolute: HOME_META_TITLE },
  description: HOME_META_DESCRIPTION,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  keywords: [
    ...SEO_KEYWORDS_HOME,
    BEWORK_BRAND_SIGNATURE,
    "apprendre à créer avec l'IA",
    "créer une application sans savoir coder",
    "formation intelligence artificielle débutant",
    "création d'outils professionnels avec l'IA",
    "IA pour entrepreneurs",
    "IA pour artisans",
    "IA pour indépendants",
  ],
  alternates: { canonical: SITE_URL, languages: hreflangFrancophonieLanguages("/") },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    alternateLocale: [...SEO_OG_ALTERNATE_LOCALES],
    url: SITE_URL,
    siteName: "BeWork",
    title: HOME_META_TITLE,
    description: HOME_META_DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "BeWork — apprendre à créer avec l’intelligence artificielle",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_META_TITLE,
    description: HOME_META_DESCRIPTION,
  },
};

const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/#accueil`,
      url: SITE_URL,
      name: HOME_META_TITLE,
      inLanguage: "fr-FR",
      description: HOME_META_DESCRIPTION,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: [
        { "@type": "Thing", name: "Formation création avec l’IA" },
        { "@type": "Thing", name: "Créer sans savoir coder" },
        { "@type": "Thing", name: "Outils numériques professionnels" },
      ],
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1"],
      },
    },
    {
      "@type": "Course",
      "@id": `${SITE_URL}/#formation`,
      name: "Journée BeWork — Créer avec l’IA",
      description: BEWORK_FORMATION_TAGLINE,
      provider: { "@id": `${SITE_URL}/#organization` },
      url: `${SITE_URL}/formation`,
      offers: {
        "@type": "Offer",
        price: "200",
        priceCurrency: "EUR",
        url: `${SITE_URL}/contact#participer`,
        availability: "https://schema.org/InStock",
      },
    },
    {
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}/#service`,
      name: "BeWork — formations pratiques créer avec l’IA",
      description: BEWORK_FORMATION_TAGLINE,
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: jsonLdExpandedAreaServed(),
      url: SITE_URL,
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      url: `${SITE_URL}/`,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      inLanguage: "fr-FR",
      mainEntity: HOME_FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ],
};

export default function HomePage() {
  return (
    <div className="min-h-screen min-w-0 overflow-x-clip bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <MarketingSiteHeader plainBg />

      <main className="pt-0">
        <HomePlatformHero />
        <HomePossibilityBridge />
        <HomeStartFromZero />
        <HomeCreateShowcase />
        <HomeFormationDay />
        <HomeAudienceProfiles />
        <HomeMetierIdeas />
        <HomePricingSession />
        <HomeSmallGroups />
        <HomeEmotionalShift />
        <HomeDemoClose />

        <section id="faq" className={`${HOME_SECTION} bg-white`} aria-labelledby="faq-heading">
          <div className="container-site">
            <HomeSectionHeader
              id="faq-heading"
              title="Questions fréquentes"
              lead={
                <>
                  Les réponses essentielles avant de vous inscrire.{" "}
                  <Link
                    href="/faq"
                    className="font-semibold text-[#0a0a0a] underline-offset-2 hover:underline"
                  >
                    Voir toute la FAQ
                  </Link>
                </>
              }
            />
            <dl className="mx-auto mt-10 max-w-2xl space-y-6 sm:mt-12">
              {HOME_FAQ_ITEMS.map((item, i) => (
                <div key={i}>
                  <dt className="text-base font-semibold text-[#0a0a0a]">{item.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-slate-600">{item.a}</dd>
                </div>
              ))}
            </dl>
            <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-slate-500">
              Tarif :{" "}
              <Link
                href="/tarifs"
                className="font-semibold text-[#0a0a0a] underline-offset-2 hover:underline"
              >
                200 € / participant
              </Link>
              {" · "}
              Démonstrations :{" "}
              <Link
                href="/demonstrations"
                className="font-semibold text-[#0a0a0a] underline-offset-2 hover:underline"
              >
                voir les exemples
              </Link>
              {" · "}
              Formation :{" "}
              <Link
                href="/formation"
                className="font-semibold text-[#0a0a0a] underline-offset-2 hover:underline"
              >
                le détail de la journée
              </Link>
            </p>
          </div>
        </section>

        <section className="bg-white pb-10 pt-2">
          <div className="container-site">
            <SeoInternalLinks path="/" />
          </div>
        </section>
      </main>

      <MarketingSiteFooter />
    </div>
  );
}
