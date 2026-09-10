import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { HomeEditorialQuestion } from "@/components/home/HomeEditorialQuestion";
import { HomeFinalCta } from "@/components/home/HomeFinalCta";
import { HomeJourneeBlock } from "@/components/home/HomeJourneeBlock";
import { HomePlatformHero } from "@/components/home/HomePlatformHero";
import { HomePossibilitiesBento } from "@/components/home/HomePossibilitiesBento";
import {
  BW_EYEBROW,
  BW_SECTION,
} from "@/components/home/homeSectionStyles";
import { BwAtmosphere } from "@/components/home/BwAtmosphere";
import { BEWORK_FORMATION_TAGLINE, FORMATION_FAQ } from "@/lib/bework-formation";
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
  "Sans savoir coder, créez ce que vous imaginez. Journée pratique BeWork pour apprendre à créer sites, applications et outils avec l’IA — 200 € / participant.",
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
    "créer sans savoir coder",
    "créer avec l'IA",
    "formation IA pratique",
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

/** Homepage — hero validé + suite maquette (étape 1 harmonisation). */
export default function HomePage() {
  return (
    <div className="min-h-screen min-w-0 overflow-x-clip bg-[#f7f8fb]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <MarketingSiteHeader plainBg />
      <main>
        <HomePlatformHero />
        <HomeEditorialQuestion />
        <HomePossibilitiesBento />
        <HomeJourneeBlock />
        <HomeFinalCta />

        <section id="faq" className={BW_SECTION} aria-labelledby="faq-heading">
          <BwAtmosphere variant="soft" />
          <div className="container-site relative">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
              <div>
                <p className={BW_EYEBROW}>FAQ</p>
                <h2
                  id="faq-heading"
                  className="mt-3 font-display text-[1.85rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#0a0a0a] sm:text-[2.5rem]"
                >
                  Des questions&nbsp;?
                  <br />
                  <span className="text-[#2563eb]">C’est normal.</span>
                </h2>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500 sm:text-base">
                  Les réponses essentielles avant de vous inscrire.{" "}
                  <Link
                    href="/faq"
                    className="font-semibold text-[#0a0a0a] underline-offset-2 hover:underline"
                  >
                    Voir toute la FAQ
                  </Link>
                </p>
              </div>
              <dl className="space-y-4">
                {HOME_FAQ_ITEMS.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-slate-200/80 bg-white/90 px-5 py-4 shadow-[0_4px_16px_rgba(15,23,42,0.03)]"
                  >
                    <dt className="text-sm font-bold text-[#0a0a0a] sm:text-base">
                      {item.q}
                    </dt>
                    <dd className="mt-2 text-sm leading-relaxed text-slate-600">
                      {item.a}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
