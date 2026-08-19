import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { HomeAdoptionUx } from "@/components/home/HomeAdoptionUx";
import { HomeAiAdvanced } from "@/components/home/HomeAiAdvanced";
import { HomeAutomations } from "@/components/home/HomeAutomations";
import { HomeConnectSoftware } from "@/components/home/HomeConnectSoftware";
import { HomeCoreAdaptation } from "@/components/home/HomeCoreAdaptation";
import { HomeDemoClose } from "@/components/home/HomeDemoClose";
import { HomeMethodFlow } from "@/components/home/HomeMethodFlow";
import { HomePlatformHero } from "@/components/home/HomePlatformHero";
import { HomePlatformModules } from "@/components/home/HomePlatformModules";
import { HomeProblemsRecognition } from "@/components/home/HomeProblemsRecognition";
import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HomeTrustBand } from "@/components/home/HomeTrustBand";
import { HOME_SECTION } from "@/components/home/homeSectionStyles";
import { SeoInternalLinks } from "@/components/seo/SeoInternalLinks";
import { jsonLdExpandedAreaServed } from "@/lib/jsonld-area-served";
import {
  SEO_OG_ALTERNATE_LOCALES,
  hreflangFrancophonieLanguages,
  metaDescriptionFrancophonie,
} from "@/lib/seo-francophonie";
import { BEWORK_BRAND_SIGNATURE, SEO_KEYWORDS_HOME, SEO_SITE_TITLE_DEFAULT, SEO_VALUE_PROPOSITION } from "@/lib/seo-keywords";
import { SITE_URL } from "@/lib/site";

const HOME_META_TITLE = SEO_SITE_TITLE_DEFAULT;
const HOME_META_DESCRIPTION = metaDescriptionFrancophonie(
  "BeWork construit la plateforme de votre entreprise BTP, connecte vos logiciels et automatise vos processus — une solution sur mesure adaptée à votre organisation",
);

const HOME_FAQ_ITEMS = [
  {
    q: "Est-ce que BeWork remplace mes logiciels actuels ?",
    a: "Pas forcément. BeWork peut devenir votre plateforme centrale tout en connectant les logiciels que vous utilisez déjà, lorsque les interfaces disponibles le permettent. Nous étudions votre situation avant de proposer quoi que ce soit.",
  },
  {
    q: "Faut-il connaître les technologies pour nous contacter ?",
    a: "Non. Expliquez-nous comment vous travaillez aujourd'hui, vos outils et ce que vous aimeriez améliorer. BeWork étudie la faisabilité, les intégrations et l'architecture adaptée.",
  },
  {
    q: "Comment se passe l'accompagnement ?",
    a: "Nous concevons, déployons, formons vos équipes et accompagnons l'adoption jusqu'à l'usage quotidien, puis faisons évoluer la solution selon vos retours.",
  },
] as const;

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
    "plateforme BTP sur mesure",
    "logiciel BTP sur mesure",
    "automatisation BTP",
    "automatisation entreprise BTP",
    "logiciel gestion chantier",
    "plateforme gestion chantier",
    "connexion logiciels BTP",
    "digitalisation entreprise BTP",
    "développement logiciel BTP",
    "outil métier BTP",
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
        alt: "BeWork — plateforme BTP sur mesure, connexion logiciels et automatisation",
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
        { "@type": "Thing", name: "Plateforme BTP sur mesure" },
        { "@type": "Thing", name: "Connexion logiciels BTP" },
        { "@type": "Thing", name: "Automatisation processus BTP" },
        { "@type": "Thing", name: "Logiciel gestion chantier" },
        { "@type": "Thing", name: "Développement logiciel BTP" },
      ],
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1"],
      },
    },
    {
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}/#service`,
      name: "BeWork — plateforme métier BTP sur mesure",
      description: SEO_VALUE_PROPOSITION,
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: jsonLdExpandedAreaServed(),
      url: SITE_URL,
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#software`,
      name: "Plateforme BeWork",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "Plateforme métier sur mesure pour les entreprises du BTP — centralisation des chantiers, documents, équipes, planning, gestion commerciale, achats et pilotage financier.",
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: jsonLdExpandedAreaServed(),
      offers: {
        "@type": "Offer",
        priceCurrency: "EUR",
        description: "Plateforme BeWork sur mesure — mise en place et accompagnement sur étude.",
        url: `${SITE_URL}/contact`,
      },
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />
      <MarketingSiteHeader plainBg />

      <main className="pt-0">
        {/* 1. Hero — construire / connecter / automatiser */}
        <HomePlatformHero />

        {/* 2. Reconnaissance — problèmes concrets BTP */}
        <HomeProblemsRecognition />

        {/* 3. Plateforme — modules métier */}
        <HomePlatformModules />

        {/* 4. Connexions logiciels */}
        <HomeConnectSoftware />

        {/* 5. Automatisations — workflows visuels */}
        <HomeAutomations />

        {/* 6. Adaptation — pas votre entreprise qui s'adapte */}
        <HomeCoreAdaptation />

        {/* 7. UX adoption — puissante derrière, simple devant */}
        <HomeAdoptionUx />

        {/* 8. Solutions IA avancées — repositionnées plus bas */}
        <HomeAiAdvanced />

        {/* 9. Méthode */}
        <HomeMethodFlow />

        {/* 10. Trust */}
        <HomeTrustBand />

        {/* 11. CTA final */}
        <HomeDemoClose />

        {/* FAQ */}
        <section id="faq" className={`${HOME_SECTION} bg-white`} aria-labelledby="faq-heading">
          <div className="container-site">
            <HomeSectionHeader
              id="faq-heading"
              title="Questions fréquentes"
              lead={
                <>
                  Les précisions avant un premier échange.{" "}
                  <Link href="/faq" className="font-semibold text-[#0a0a0a] underline-offset-2 hover:underline">
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
              Tarifs et formules :{" "}
              <Link href="/tarifs" className="font-semibold text-[#0a0a0a] underline-offset-2 hover:underline">
                voir les tarifs
              </Link>
              {" · "}
              Notre approche :{" "}
              <Link
                href="/notre-facon-de-travailler"
                className="font-semibold text-[#0a0a0a] underline-offset-2 hover:underline"
              >
                méthode BeWork
              </Link>
              {" · "}
              Ressources :{" "}
              <Link href="/ressources" className="font-semibold text-[#0a0a0a] underline-offset-2 hover:underline">
                centre de ressources
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
