import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { HomeBigQuestion } from "@/components/home/HomeBigQuestion";
import { HomeBrandStatement } from "@/components/home/HomeBrandStatement";
import { HomeDemoClose } from "@/components/home/HomeDemoClose";
import { HomeEditorialTrigger } from "@/components/home/HomeEditorialTrigger";
import { HomeFormationDay } from "@/components/home/HomeFormationDay";
import { HomeMetierSelector } from "@/components/home/HomeMetierSelector";
import { HomePlatformHero } from "@/components/home/HomePlatformHero";
import { HomePricingSession } from "@/components/home/HomePricingSession";
import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HomeShowroomBento } from "@/components/home/HomeShowroomBento";
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
  "Créer avec l’IA sans savoir coder : sites, applications et outils professionnels. Journée pratique BeWork — 200 € / participant. Aucun prérequis en programmation.",
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
    "créer avec l'IA",
    "créer sans savoir coder",
    "créer une application avec l'IA",
    "création site avec IA",
    "outil professionnel avec IA",
    "application sans code",
    "formation IA débutant",
    "IA pour entrepreneur",
    "IA pour artisan",
    "IA pour indépendant",
    "formation intelligence artificielle pratique",
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
        alt: "BeWork — créer à l’ère de l’IA",
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
      "@id": `${SITE_URL}/#webpage`,
      url: SITE_URL,
      name: HOME_META_TITLE,
      description: HOME_META_DESCRIPTION,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: [
        { "@type": "Thing", name: "Créer avec l’IA" },
        { "@type": "Thing", name: "Créer sans savoir coder" },
        { "@type": "Thing", name: "Formation pratique intelligence artificielle" },
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
      name: "BeWork — journées pratiques créer avec l’IA",
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
        <HomeEditorialTrigger />
        <HomeBigQuestion />
        <HomeShowroomBento />
        <HomeMetierSelector />
        <HomeStartFromZero />
        <HomeBrandStatement />
        <HomeFormationDay />
        <HomePricingSession />
        <HomeDemoClose />

        <section id="faq" className={`${HOME_SECTION} bg-[#fafafa]`} aria-labelledby="faq-heading">
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
                href="/#tarif"
                className="font-semibold text-[#0a0a0a] underline-offset-2 hover:underline"
              >
                200&nbsp;€ / participant
              </Link>
              .
            </p>
          </div>
        </section>

        <SeoInternalLinks path="/" />
      </main>

      <MarketingSiteFooter />
    </div>
  );
}
