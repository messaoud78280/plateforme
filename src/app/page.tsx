import type { Metadata } from "next";
import Link from "next/link";
import { ProspectContactForm } from "@/components/contact/ProspectContactForm";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { HomeAiSpecialized } from "@/components/home/HomeAiSpecialized";
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
import { HomePricingSection } from "@/components/HomePricingSection";
import { SeoInternalLinks } from "@/components/seo/SeoInternalLinks";
import { RESOURCE_TUTO_ITEMS } from "@/content/resource-tutos";
import { jsonLdExpandedAreaServed } from "@/lib/jsonld-area-served";
import {
  SEO_OG_ALTERNATE_LOCALES,
  hreflangFrancophonieLanguages,
  metaDescriptionFrancophonie,
} from "@/lib/seo-francophonie";
import { SEO_KEYWORDS_HOME } from "@/lib/seo-keywords";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";
import { SITE_URL } from "@/lib/site";

const HOME_META_TITLE = "BeWork | Plateformes internes avec IA pour les entreprises du BTP";
const HOME_META_DESCRIPTION = metaDescriptionFrancophonie(
  "BeWork conçoit, déploie et fait évoluer des plateformes internes pour le BTP : chantiers, marchés, documents et outils IA utilisés par vos équipes",
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
        alt: "BeWork — Plateformes internes intelligentes pour les entreprises du BTP",
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
      name: "BeWork — Plateformes internes intelligentes pour les entreprises du BTP",
      inLanguage: "fr-FR",
      description: HOME_META_DESCRIPTION,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: [
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
        <HomeClientTeamsUse />
        <HomeConfidentiality />
        <HomeDeploySteps />
        <HomePricingSection />
        <HomePlatformEvolution />
        <HomeTechPartner />

        <section id="ressources" className="relative bg-[#f8fafc] px-6 py-14 md:py-20 lg:py-24">
          <div className="mx-auto max-w-site">
            <div className="mb-10 max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-black md:text-4xl">
                Une plateforme construite avec une véritable expertise métier
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-black">
                Guides, tutoriels et skills : l&apos;expression de notre connaissance des documents, procédures et
                réalités opérationnelles du BTP — intégrée à la conception de la plateforme.
              </p>
              <Link
                href="/ressources"
                className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
              >
                Ouvrir le centre de ressources BTP
                <span aria-hidden>→</span>
              </Link>
            </div>

            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURED_RESOURCES.map((r) => (
                <li key={r.href}>
                  <Link
                    href={r.href}
                    className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#1d4ed8]/35 hover:shadow"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#1d4ed8]">{r.status}</span>
                    <span className="mt-2 text-sm font-bold leading-snug text-[#0f172a]">{r.title}</span>
                    <span className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600">{r.desc}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Link
                href="/ressources/tutos"
                className="inline-flex items-center gap-2 rounded-lg border border-[#1d4ed8]/35 bg-[#eff6ff] px-4 py-2 text-sm font-semibold text-[#1e3a8a] transition hover:bg-[#dbeafe]"
              >
                Voir tous les tutoriels PDF
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </section>

        <section id="faq" className="bg-white px-6 py-14 md:py-20 lg:py-24 scroll-mt-24" style={{ scrollMarginTop: "6rem" }}>
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight text-black md:text-4xl">Questions fréquentes</h2>
            <p className="mt-5 text-lg leading-relaxed text-black">
              Rôle de BeWork, abonnement, IA et démarrage : ce que les dirigeants clarifient avant une démonstration.
            </p>
            <dl className="mt-12 space-y-6">
              {HOME_FAQ_ITEMS.map((item, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <dt className="text-lg font-semibold text-black">{item.q}</dt>
                  <dd className="mt-3 text-black leading-relaxed">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="contact" className="bg-[#f8fafc] px-6 py-14 md:py-20 lg:py-24 scroll-mt-24">
          <div className="mx-auto max-w-site rounded-2xl border-2 border-[#1d4ed8]/25 bg-white p-8 shadow-lg md:p-12 lg:p-14">
            <div className="grid gap-10 lg:grid-cols-5 lg:gap-14">
              <div className="lg:col-span-2">
                <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
                  Construisons la plateforme adaptée à votre entreprise
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-slate-700">
                  Présentez-nous votre organisation, vos outils actuels et vos principales difficultés. Nous vous
                  montrerons comment le socle BeWork peut être configuré pour vos équipes.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="#formulaire"
                    className="inline-flex h-[3.25rem] items-center justify-center rounded-2xl bg-[#1d4ed8] px-6 text-base font-semibold text-white shadow-md transition hover:bg-[#1e40af]"
                    {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-final-demo")}
                  >
                    Demander une démonstration personnalisée
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex h-[3.25rem] items-center justify-center rounded-2xl border-2 border-[#1d4ed8] bg-white px-6 text-base font-semibold text-[#0f172a] shadow-sm transition hover:bg-[#f8f9fb]"
                  >
                    Parler de votre projet
                  </Link>
                </div>
              </div>
              <div id="formulaire" className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3 md:p-8">
                <ProspectContactForm source="homepage_contact_form" variant="compact" />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-6 pb-8 pt-4">
          <div className="mx-auto max-w-site">
            <SeoInternalLinks path="/" />
          </div>
        </section>
      </main>

      <MarketingSiteFooter />
    </div>
  );
}
