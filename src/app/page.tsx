import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { HomeAdoptionUx } from "@/components/home/HomeAdoptionUx";
import { HomeCatalogOpen } from "@/components/home/HomeCatalogOpen";
import { HomeCoreAdaptation } from "@/components/home/HomeCoreAdaptation";
import { HomeDemoClose } from "@/components/home/HomeDemoClose";
import { HomeDifference } from "@/components/home/HomeDifference";
import { HomeMethodFlow } from "@/components/home/HomeMethodFlow";
import { HomeModulesGrid } from "@/components/home/HomeModulesGrid";
import { HomeNeedSignature } from "@/components/home/HomeNeedSignature";
import { HomePlatformEvolution } from "@/components/home/HomePlatformEvolution";
import { HomePlatformHero } from "@/components/home/HomePlatformHero";
import { HomePlatformProof } from "@/components/home/HomePlatformProof";
import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HomeSolutionFamilies } from "@/components/home/HomeSolutionFamilies";
import { HomeTrustBand } from "@/components/home/HomeTrustBand";
import { HomeUseCases } from "@/components/home/HomeUseCases";
import { HOME_SECTION } from "@/components/home/homeSectionStyles";
import { SeoInternalLinks } from "@/components/seo/SeoInternalLinks";
import { jsonLdExpandedAreaServed } from "@/lib/jsonld-area-served";
import {
  SEO_OG_ALTERNATE_LOCALES,
  hreflangFrancophonieLanguages,
  metaDescriptionFrancophonie,
} from "@/lib/seo-francophonie";
import { BEWORK_BRAND_SIGNATURE, SEO_KEYWORDS_HOME } from "@/lib/seo-keywords";
import { SITE_URL } from "@/lib/site";

const HOME_META_TITLE = "BeWork | Solutions IA sur mesure pour le BTP";
const HOME_META_DESCRIPTION = metaDescriptionFrancophonie(
  "BeWork conçoit des solutions IA et des plateformes métier pour les entreprises du BTP — autour de vos processus, documents, données et outils existants",
);

const HOME_FAQ_ITEMS = [
  {
    q: "Dois-je adopter toute la plateforme BeWork ?",
    a: "Non. Vous pouvez venir avec un besoin précis : automatisation, analyse documentaire, outil métier, intégration IA à vos logiciels, ou plateforme complète. Nous étudions la solution adaptée.",
  },
  {
    q: "Faut-il connaître les technologies IA pour nous contacter ?",
    a: "Non. Expliquez ce que vous voulez améliorer ou créer. BeWork étudie la faisabilité, les données, la sécurité, les intégrations et l’architecture appropriée.",
  },
  {
    q: "Comment se passe l’accompagnement ?",
    a: "Nous concevons, déployons, formons vos équipes et accompagnons l’adoption jusqu’à l’usage quotidien, puis faisons évoluer la solution selon vos retours.",
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
    "solutions IA sur mesure BTP",
    "conception solution IA entreprise BTP",
    "automatisation chantier BTP",
    "analyse documentaire BTP",
    "plateforme métier BTP",
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
        alt: "BeWork — solutions IA sur mesure pour le BTP",
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
        { "@type": "Thing", name: "Solutions IA sur mesure BTP" },
        { "@type": "Thing", name: "Conception d'outils métier BTP" },
        { "@type": "Thing", name: "Plateforme métier BeWork" },
        { "@type": "Thing", name: "Automatisation et analyse documentaire BTP" },
      ],
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1"],
      },
    },
    {
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}/#service`,
      name: "BeWork — solutions IA et plateformes métier pour le BTP",
      description:
        "Conception de solutions IA sur mesure et de plateformes métier pour les entreprises du BTP, autour de leurs processus, documents, données et outils.",
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
        "Environnement de travail BeWork pour centraliser équipes, chantiers, documents et processus — une offre majeure et une démonstration du savoir-faire BeWork.",
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: jsonLdExpandedAreaServed(),
      offers: {
        "@type": "Offer",
        priceCurrency: "EUR",
        description:
          "Mise en place initiale et abonnement mensuel sur étude — ou projet IA sur mesure selon le besoin.",
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
        <HomePlatformHero />
        <HomeNeedSignature />
        <HomeCatalogOpen />
        <HomeSolutionFamilies />
        <HomeUseCases />
        <HomeDifference />
        <HomePlatformProof />
        <HomeCoreAdaptation />
        <HomeModulesGrid />
        <HomeMethodFlow />
        <HomeAdoptionUx />
        <HomeTrustBand />
        <HomePlatformEvolution />
        <HomeDemoClose />

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
              <Link href="/ressources" className="font-semibold text-[#0a0a0] underline-offset-2 hover:underline">
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
