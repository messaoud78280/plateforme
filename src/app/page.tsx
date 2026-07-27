import type { Metadata } from "next";
import Link from "next/link";
import { ProspectContactForm } from "@/components/contact/ProspectContactForm";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { HomeHowItWorksDetailSection } from "@/components/HomeHowItWorksDetailSection";
import { HomeCredibilitySection } from "@/components/HomeCredibilitySection";
import { HomePricingSection } from "@/components/HomePricingSection";
import { HomeTargetAudienceSection } from "@/components/HomeTargetAudienceSection";
import { HomeResponsibilitiesSplitSection } from "@/components/HomeResponsibilitiesSplitSection";
import { HomeOverloadSignalsSection } from "@/components/HomeOverloadSignalsSection";
import { HomeLifecycleSection } from "@/components/HomeLifecycleSection";
import { HomeResultsSection } from "@/components/HomeResultsSection";
import { HomePlatformSection } from "@/components/HomePlatformSection";
import { HomeConcreteCaseSection } from "@/components/HomeConcreteCaseSection";
import { HomeHeroMissionMockup } from "@/components/home/HomeHeroMissionMockup";
import { HomeGeoExternalisationCards } from "@/components/HomeGeoExternalisationCards";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { SeoInternalLinks } from "@/components/seo/SeoInternalLinks";
import {
  getMarketingPriceBoundsLabels,
  getMarketingAggregateOfferDescription,
} from "@/lib/bework-public-offers";
import { jsonLdExpandedAreaServed } from "@/lib/jsonld-area-served";
import {
  SEO_OG_ALTERNATE_LOCALES,
  hreflangFrancophonieLanguages,
  metaDescriptionFrancophonie,
} from "@/lib/seo-francophonie";
import { SEO_KEYWORDS_HOME } from "@/lib/seo-keywords";
import { EXTERNALISATION_ADMIN_BT_NAV } from "@/lib/externalisation-administrative-btp-geo";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";
import { SITE_URL } from "@/lib/site";

const PRICE_BOUNDS = getMarketingPriceBoundsLabels();

/** Réassurances hero — 4 maximum, pas de gain chiffré non prouvé. */
const HERO_REASSURANCES = [
  "Spécialistes du BTP",
  "Ponctuel ou régulier",
  "Espace de suivi par mission",
  "IA et contrôle humain",
] as const;

const HOME_FAQ_ITEMS = [
  {
    q: "BeWork remplace-t-il un conducteur de travaux ?",
    a: "Non. BeWork renforce votre équipe travaux : nous préparons, organisons et suivons les dossiers qui entourent le chantier. Votre conducteur conserve le pilotage, les décisions techniques et la relation client.",
  },
  {
    q: "Quelles tâches peut-on déléguer ?",
    a: "Comptes rendus, documents, relances fournisseurs et sous-traitants, situations, réserves, DOE et appels d’offres — selon la mission cadrée avec vous. Prix, choix techniques et validations restent chez vous.",
  },
  {
    q: "Peut-on utiliser BeWork seulement pendant un pic d’activité ?",
    a: "Oui. Vous pouvez solliciter BeWork pour une mission précise, une période de surcharge ponctuelle ou un accompagnement régulier, sans recrutement supplémentaire.",
  },
  {
    q: "Comment suivre une mission ?",
    a: "Chaque mission dispose d’un espace de suivi permettant de transmettre les documents, consulter l’avancement, échanger avec le Beworker et identifier la prochaine action attendue.",
  },
  {
    q: "BeWork peut-il travailler avec nos outils actuels ?",
    a: "Vos Beworkers peuvent s’appuyer sur vos outils existants (Excel, Drive, SharePoint, Chorus Pro, Batigest, EBP, Sage…). Les documents échangés restent aussi accessibles dans l’espace de mission.",
  },
] as const;

const HOME_META_TITLE = "Assistant travaux externalisé BTP | BeWork";
const HOME_META_DESCRIPTION = metaDescriptionFrancophonie(
  "BeWork renforce les conducteurs de travaux et les équipes BTP sur les documents, relances, situations, DOE et appels d'offres, sans recrutement",
);

export const metadata: Metadata = {
  title: { absolute: HOME_META_TITLE },
  description: HOME_META_DESCRIPTION,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  keywords: SEO_KEYWORDS_HOME,
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
        alt: "BeWork — Assistant travaux externalisé : renfort conducteurs de travaux et équipes BTP",
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
      name: "BeWork — Assistant travaux externalisé pour conducteurs de travaux et équipes BTP",
      inLanguage: "fr-FR",
      description:
        "BeWork renforce les équipes travaux BTP sur les comptes rendus, documents, relances, situations, réserves, DOE et appels d'offres — sous validation du client.",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: [
        { "@type": "Thing", name: "Renfort conducteur de travaux" },
        { "@type": "Thing", name: "Suivi administratif chantier" },
        { "@type": "Thing", name: "Assistance appels d’offres BTP" },
        { "@type": "Thing", name: "Suivi DOE et réserves" },
      ],
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1"],
      },
    },
    {
      "@type": "Service",
      "@id": `${SITE_URL}/#service-btp`,
      name: "Assistant travaux externalisé — renfort conducteurs de travaux et équipes BTP",
      description:
        "Renfort opérationnel pour équipes BTP : comptes rendus, documents, relances fournisseurs et sous-traitants, situations, réserves, DOE et appels d'offres, sous validation du client.",
      serviceType: "Renfort administratif travaux — suivi de chantier et appels d'offres BTP",
      category: "Assistance à la préparation et au suivi documentaire des chantiers et marchés BTP",
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: jsonLdExpandedAreaServed(),
      audience: {
        "@type": "BusinessAudience",
        audienceType:
          "PME BTP, entreprises générales, conducteurs de travaux, chargés d’affaires et dirigeants — France, Belgique, Suisse, Luxembourg",
      },
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "EUR",
        lowPrice: PRICE_BOUNDS.low,
        highPrice: PRICE_BOUNDS.high,
        offerCount: "5",
        description: getMarketingAggregateOfferDescription(),
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
        {/* Hero — 2 colonnes, fond épuré */}
        <section id="hero" className="relative overflow-x-clip bg-white px-6 pb-16 pt-10 md:pb-20 md:pt-14 lg:pb-24 lg:pt-16">
          <div className="container-site">
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,1fr)] lg:gap-16">
              {/* Colonne gauche */}
              <div className="text-center lg:text-left">
                <p className="mx-auto inline-flex items-center rounded-full border border-[#1d4ed8]/25 bg-[#eff6ff] px-4 py-1.5 text-sm font-semibold text-[#1d4ed8] lg:mx-0">
                  Assistant travaux externalisé · Ponctuel ou régulier
                </p>

                <h1 className="font-display mx-auto mt-6 max-w-[38rem] text-balance text-[clamp(1.85rem,calc(1rem+3.4vw),3rem)] font-extrabold leading-[1.04] tracking-[-0.025em] text-[#0f172a] lg:mx-0">
                  Vos conducteurs pilotent les chantiers.{" "}
                  <span className="text-[#1d4ed8]">BeWork fait avancer les dossiers qui les débordent.</span>
                </h1>

                <p className="mx-auto mt-5 max-w-[36rem] text-lg leading-relaxed text-slate-700 lg:mx-0 lg:text-xl">
                  Comptes rendus, documents, relances, situations, fournisseurs, réserves, DOE et appels d&apos;offres&nbsp;:
                  un assistant travaux spécialisé renforce votre équipe lorsque la charge augmente, sans recrutement
                  supplémentaire.
                </p>

                <p className="mx-auto mt-4 max-w-[36rem] text-lg font-bold leading-snug lg:mx-0">
                  <span className="text-[#0f172a]">On tient le bureau,</span>{" "}
                  <span className="text-[#1d4ed8]">vous tenez le chantier.</span>
                </p>

                <div className="mx-auto mt-7 flex max-w-[36rem] flex-col gap-3 sm:flex-row sm:justify-center lg:mx-0 lg:justify-start">
                  <Link
                    href="#contact"
                    className="inline-flex h-[3.25rem] items-center justify-center rounded-2xl bg-[#1d4ed8] px-6 text-base font-semibold text-white shadow-md transition hover:bg-[#1e40af]"
                    {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-hero-primary")}
                  >
                    Soulager mon équipe travaux
                  </Link>
                  <Link
                    href="#renfort-chaque-moment"
                    className="inline-flex h-[3.25rem] items-center justify-center rounded-2xl border-2 border-slate-200 bg-white px-6 text-base font-semibold text-[#1d4ed8] shadow-sm transition hover:border-[#1d4ed8]/40 hover:bg-[#eff6ff]"
                  >
                    Voir ce que je peux déléguer
                  </Link>
                </div>

                <ul
                  className="mx-auto mt-8 grid max-w-[34rem] grid-cols-2 gap-x-5 gap-y-2.5 lg:mx-0 lg:max-w-none"
                  aria-label="Atouts BeWork"
                >
                  {HERO_REASSURANCES.map((label) => (
                    <li key={label} className="flex items-center gap-2 text-sm font-medium text-slate-700 lg:justify-start">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d4ed8]" aria-hidden />
                      {label}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Colonne droite — mockup mission */}
              <div>
                <HomeHeroMissionMockup />
              </div>
            </div>
          </div>
        </section>

        <HomeOverloadSignalsSection />
        <HomeLifecycleSection />
        <HomeResultsSection />
        <HomePlatformSection />
        <HomeHowItWorksDetailSection />
        <HomeConcreteCaseSection />
        <HomeResponsibilitiesSplitSection />
        <HomePricingSection />
        <HomeCredibilitySection />
        <HomeTargetAudienceSection />

        {/* Ressources */}
        <section id="ressources" className="relative px-6 py-14 md:py-20 lg:py-24">
          <div className="mx-auto max-w-site">
            <div className="mb-16 max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-black md:text-4xl">
                Ressources & bonnes pratiques
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-black">
                Tutoriels PDF et hub ressources pour structurer votre administratif, sécuriser votre trésorerie et
                professionnaliser votre relation client.
              </p>
              <Link
                href="/ressources"
                className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
              >
                Voir toutes les ressources
                <span aria-hidden>→</span>
              </Link>
            </div>

            <div className="mb-12 rounded-2xl border border-[#1d4ed8]/25 bg-[#eff6ff]/40 p-8 md:p-10">
              <h3 className="text-xl font-bold tracking-tight text-black md:text-2xl">
                Externalisation administrative BTP par pays
              </h3>
              <p className="mt-4 max-w-3xl text-black leading-relaxed">
                Contenus distincts selon votre marché&nbsp;: France, Belgique, Suisse romande et Luxembourg. Ouvrez la page qui correspond à votre
                zone d&apos;activité.
              </p>
              <ul className="mt-6 flex flex-wrap gap-3">
                {EXTERNALISATION_ADMIN_BT_NAV.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex rounded-lg border border-[#1d4ed8]/35 bg-white px-4 py-2 text-sm font-semibold text-[#1d4ed8] transition hover:bg-[#eff6ff]"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-14 max-w-2xl">
              <p className="text-lg leading-relaxed text-black">
                Retrouvez nos tutoriels PDF (compte rendu de chantier, analyse DCE, PPSPS, mémoires techniques…) sur la liste des tutoriels —
                mise en page, transcription et prompts à copier.
              </p>
              <Link
                href="/ressources/tutos"
                className="mt-6 inline-flex items-center gap-2 rounded-lg border border-[#1d4ed8]/35 bg-[#eff6ff] px-4 py-2 text-sm font-semibold text-[#1e3a8a] transition hover:bg-[#dbeafe]"
              >
                Ouvrir les tutoriels PDF
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </section>

        <HomeGeoExternalisationCards />

        {/* FAQ optimisée SEO — 5 questions */}
        <section id="faq" className="px-6 py-14 md:py-20 lg:py-24 scroll-mt-24" style={{ scrollMarginTop: "6rem" }}>
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight text-black md:text-4xl">
              Questions fréquentes
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-black">
              Cadre, périmètre et responsabilités : ce que les entreprises BTP vérifient avant de confier un renfort à
              un assistant travaux.
            </p>
            <p className="mt-4 text-base font-medium text-black">
              Tous nos tarifs sont exprimés HT, sans frais supplémentaires.
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

        {/* CTA final / contact */}
        <section id="contact" className="px-6 py-14 md:py-20 lg:py-24 scroll-mt-24">
          <div className="mx-auto max-w-site rounded-2xl border-2 border-[#1d4ed8]/25 bg-white p-8 shadow-lg md:p-12 lg:p-14">
            <div className="grid gap-10 lg:grid-cols-5 lg:gap-14">
              <div className="lg:col-span-2">
                <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
                  Votre équipe travaux manque de temps&nbsp;?
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-slate-700">
                  Décrivez ce qui s&apos;accumule&nbsp;: appels d&apos;offres, comptes rendus, documents, situations,
                  fournisseurs, réserves ou DOE. BeWork vous aide à définir une mission claire et à identifier ce qui
                  peut être confié à un assistant travaux.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="#formulaire"
                    className="inline-flex h-[3.25rem] items-center justify-center rounded-2xl bg-[#1d4ed8] px-6 text-base font-semibold text-white shadow-md transition hover:bg-[#1e40af]"
                    {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-final-cta-primary")}
                  >
                    Parler de ma charge de travail
                  </Link>
                  <Link
                    href="/assistants-administratifs-taches"
                    className="inline-flex h-[3.25rem] items-center justify-center rounded-2xl border-2 border-[#1d4ed8] bg-white px-6 text-base font-semibold text-[#0f172a] shadow-sm transition hover:bg-[#f8f9fb]"
                    {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_TARIFS, "home-final-cta-secondary")}
                  >
                    Voir les missions
                  </Link>
                </div>
              </div>
              <div id="formulaire" className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3 md:p-8">
                <ProspectContactForm source="homepage_contact_form" variant="compact" />
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-8">
          <div className="mx-auto max-w-site">
            <SeoInternalLinks path="/" />
          </div>
        </section>
      </main>

      <MarketingSiteFooter />
    </div>
  );
}
