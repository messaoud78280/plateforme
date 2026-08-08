import type { Metadata } from "next";
import Link from "next/link";
import { ProspectContactForm } from "@/components/contact/ProspectContactForm";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { HomeAiSpecialized } from "@/components/home/HomeAiSpecialized";
import { HomeAdoptionSection } from "@/components/home/HomeAdoptionSection";
import { HomeClientTeamsUse } from "@/components/home/HomeClientTeamsUse";
import { HomeConfidentiality } from "@/components/home/HomeConfidentiality";
import { HomeCoreAdaptation } from "@/components/home/HomeCoreAdaptation";
import { HomeDeploySteps } from "@/components/home/HomeDeploySteps";
import { HomeMarketsAnalysis } from "@/components/home/HomeMarketsAnalysis";
import { HomeModulesGrid } from "@/components/home/HomeModulesGrid";
import { HomeOpsContinuity } from "@/components/home/HomeOpsContinuity";
import { HomePlatformEvolution } from "@/components/home/HomePlatformEvolution";
import { HomePlatformHero } from "@/components/home/HomePlatformHero";
import { HomeProblemsDispersion } from "@/components/home/HomeProblemsDispersion";
import { HomeTechPartner } from "@/components/home/HomeTechPartner";
import { HomeUnifiedEnvironment } from "@/components/home/HomeUnifiedEnvironment";
import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import {
  HOME_BTN_GROUP,
  HOME_BTN_PRIMARY,
  HOME_BTN_SECONDARY,
  HOME_BTN_SOFT,
  HOME_CONTENT,
  HOME_SECTION,
} from "@/components/home/homeSectionStyles";
import { HomePricingSection } from "@/components/HomePricingSection";
import { SeoInternalLinks } from "@/components/seo/SeoInternalLinks";
import { RESOURCE_TUTO_ITEMS } from "@/content/resource-tutos";
import { jsonLdExpandedAreaServed } from "@/lib/jsonld-area-served";
import {
  SEO_OG_ALTERNATE_LOCALES,
  hreflangFrancophonieLanguages,
  metaDescriptionFrancophonie,
} from "@/lib/seo-francophonie";
import { BEWORK_BRAND_SIGNATURE, SEO_KEYWORDS_HOME, SEO_SITE_TITLE_DEFAULT } from "@/lib/seo-keywords";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";
import { SITE_URL } from "@/lib/site";

const HOME_META_TITLE = SEO_SITE_TITLE_DEFAULT;
const HOME_META_DESCRIPTION = metaDescriptionFrancophonie(
  "BeWork — plateformes internes intelligentes pour le BTP : chantiers, marchés, documents et outils IA utilisés par vos équipes",
);

const HOME_FAQ_ITEMS = [
  {
    q: "BeWork exécute-t-il nos missions quotidiennes ?",
    a: "Non. BeWork conçoit, déploie et fait évoluer votre plateforme. Ce sont vos collaborateurs autorisés qui l’utilisent au quotidien pour vos marchés, chantiers, documents et validations.",
  },
  {
    q: "BeWork est-il un développement entièrement sur mesure ?",
    a: "Non. Chaque entreprise s’appuie sur un socle technologique commun, complété par des modules, workflows et outils IA configurés selon son organisation. Les développements spécifiques importants font l’objet d’un cadrage distinct.",
  },
  {
    q: "Que comprend l’abonnement mensuel ?",
    a: "L’accès à la plateforme, l’hébergement, la maintenance, la sécurité, le support et l’évolution progressive selon votre formule. Il ne donne pas droit à des développements spécifiques illimités.",
  },
  {
    q: "Comment l’IA traite-t-elle nos documents ?",
    a: "Les documents sont traités pour fournir les fonctionnalités demandées, selon les engagements de confidentialité et les paramètres des fournisseurs techniques. Vos professionnels valident les analyses.",
  },
  {
    q: "Comment démarrer ?",
    a: "Par un diagnostic de votre organisation, puis la configuration et le déploiement. Demandez une démonstration personnalisée pour voir le socle adapté à votre entreprise.",
  },
] as const;

const FEATURED_RESOURCES = RESOURCE_TUTO_ITEMS.slice(0, 4);

export const metadata: Metadata = {
  title: { absolute: HOME_META_TITLE },
  description: HOME_META_DESCRIPTION,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  keywords: [
    ...SEO_KEYWORDS_HOME,
    BEWORK_BRAND_SIGNATURE,
    "plateforme interne BTP",
    "plateforme intelligente BTP",
    "gestion chantier documentaire",
    "analyse marché public BTP",
    "outils IA BTP",
    "éditeur plateforme BTP",
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
        alt: `BeWork — ${BEWORK_BRAND_SIGNATURE}`,
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
      name: `BeWork — ${BEWORK_BRAND_SIGNATURE}`,
      inLanguage: "fr-FR",
      description: HOME_META_DESCRIPTION,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: [
        { "@type": "Thing", name: BEWORK_BRAND_SIGNATURE },
        { "@type": "Thing", name: "Plateforme interne BTP" },
        { "@type": "Thing", name: "Analyse de marchés publics et privés" },
        { "@type": "Thing", name: "Outils d’intelligence artificielle BTP" },
        { "@type": "Thing", name: "Éditeur et intégrateur de plateforme métier" },
      ],
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1"],
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#software`,
      name: "BeWork — plateforme interne BTP",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "Socle technologique BeWork pour centraliser équipes, chantiers, documents et marchés, avec outils IA spécialisés BTP. Utilisé par les collaborateurs du client ; BeWork assure configuration, maintenance et évolution.",
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: jsonLdExpandedAreaServed(),
      offers: {
        "@type": "Offer",
        priceCurrency: "EUR",
        description:
          "Mise en place initiale et abonnement mensuel sur étude — utilisateurs, modules, personnalisation, IA et accompagnement.",
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
    <div className="min-h-screen min-w-0 overflow-x-clip bg-transparent">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />
      <MarketingSiteHeader plainBg />

      <main className="pt-0">
        <HomePlatformHero />
        <HomeProblemsDispersion />
        <HomeUnifiedEnvironment />
        <HomeCoreAdaptation />
        <HomeMarketsAnalysis />
        <HomeAiSpecialized />
        <HomeOpsContinuity />
        <HomeModulesGrid />
        <HomeAdoptionSection />
        <HomeClientTeamsUse />
        <HomeConfidentiality />
        <HomeDeploySteps />
        <HomePricingSection />
        <HomePlatformEvolution />
        <HomeTechPartner />

        <section id="ressources" className={`${HOME_SECTION} bg-white`} aria-labelledby="ressources-heading">
          <div className="container-site">
            <HomeSectionHeader
              id="ressources-heading"
              eyebrow="Ressources"
              title="Une plateforme construite avec une véritable expertise métier"
              lead="Guides, tutoriels et skills : l'expression de notre connaissance des documents, procédures et réalités opérationnelles du BTP — intégrée à la conception de la plateforme."
            />

            <div className={`${HOME_CONTENT} flex justify-center`}>
              <Link href="/ressources" className={HOME_BTN_SECONDARY}>
                Centre de ressources
                <span aria-hidden>→</span>
              </Link>
            </div>

            <ul className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURED_RESOURCES.map((r) => (
                <li key={r.href}>
                  <Link
                    href={r.href}
                    className="flex h-full flex-col rounded-2xl border border-slate-200/90 bg-[#f8fafc] p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-[#1d4ed8]/30 hover:bg-white hover:shadow-[0_12px_28px_-16px_rgba(29,78,216,0.28)]"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#1d4ed8]">{r.status}</span>
                    <span className="mt-2 text-sm font-bold leading-snug text-[#0f172a]">{r.title}</span>
                    <span className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600">{r.desc}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex justify-center">
              <Link href="/ressources/tutos" className={HOME_BTN_SOFT}>
                Voir les tutoriels PDF
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </section>

        <section id="faq" className={`${HOME_SECTION} bg-[#f4f7fb]`} aria-labelledby="faq-heading">
          <div className="container-site">
            <HomeSectionHeader
              id="faq-heading"
              eyebrow="FAQ"
              title="Questions fréquentes"
              lead="Rôle de BeWork, abonnement, IA et démarrage : ce que les dirigeants clarifient avant une démonstration."
            />
            <dl className={`${HOME_CONTENT} mx-auto max-w-3xl space-y-3 sm:space-y-4`}>
              {HOME_FAQ_ITEMS.map((item, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6"
                >
                  <dt className="text-base font-semibold text-[#0f172a] sm:text-lg">{item.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-slate-600 sm:mt-3 sm:text-base">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="contact" className="scroll-mt-24 bg-white py-14 sm:py-20 md:py-24 lg:py-28">
          <div className="container-site">
          <div className="rounded-2xl border border-[#1d4ed8]/20 bg-[#f8fafc] p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-8 md:p-12 lg:p-14">
            <div className="grid gap-8 lg:grid-cols-5 lg:gap-14">
              <div className="lg:col-span-2">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1d4ed8]">Contact</p>
                <h2 className="font-display mt-3 text-[1.625rem] font-extrabold tracking-tight text-[#0f172a] sm:text-3xl md:text-4xl">
                  Construisons la plateforme adaptée à votre entreprise
                </h2>
                <p className="mt-4 text-[0.9375rem] leading-relaxed text-slate-600 sm:mt-6 sm:text-base md:text-lg">
                  Présentez-nous votre organisation, vos outils actuels et vos principales difficultés. Nous vous
                  montrerons comment le socle BeWork peut être configuré pour vos équipes.
                </p>
                <div className={`mt-6 sm:mt-8 ${HOME_BTN_GROUP}`}>
                  <Link
                    href="#formulaire"
                    className={HOME_BTN_PRIMARY}
                    {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-final-demo")}
                  >
                    <span className="sm:hidden">Demander une démo</span>
                    <span className="hidden sm:inline">Demander une démonstration</span>
                  </Link>
                  <Link href="/contact" className={HOME_BTN_SECONDARY}>
                    Parler de votre projet
                  </Link>
                </div>
              </div>
              <div id="formulaire" className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:col-span-3 md:p-8">
                <ProspectContactForm source="homepage_contact_form" variant="compact" />
              </div>
            </div>
          </div>
          </div>
        </section>

        <section className="bg-white pb-8 pt-4">
          <div className="container-site">
            <SeoInternalLinks path="/" />
          </div>
        </section>
      </main>

      <MarketingSiteFooter />
    </div>
  );
}
