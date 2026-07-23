import type { Metadata } from "next";
import Link from "next/link";
import { ProspectContactForm } from "@/components/contact/ProspectContactForm";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { HomeProblemSection } from "@/components/HomeProblemSection";
import { HomeHowItWorksDetailSection } from "@/components/HomeHowItWorksDetailSection";
import { HomeCredibilitySection } from "@/components/HomeCredibilitySection";
import { HomeCallCtaBanner } from "@/components/HomeCallCtaBanner";
import { HomePricingSection } from "@/components/HomePricingSection";
import { HomeSolutionSection } from "@/components/HomeSolutionSection";
import { HomeTargetAudienceSection } from "@/components/HomeTargetAudienceSection";
import { HomeRenfortClarificationSection } from "@/components/HomeRenfortClarificationSection";
import { HomeResponsibilitiesSplitSection } from "@/components/HomeResponsibilitiesSplitSection";
import { HomeMissionFamiliesSection } from "@/components/HomeMissionFamiliesSection";
import { HomeHeroAside } from "@/components/home/HomeHeroAside";
import { HomeBlueprintScrollDecor } from "@/components/home/HomeBlueprintScrollDecor";
import { HomeHeroMetalCorners } from "@/components/home/HomeHeroMetalCorners";
import { HomeHeroPlanCartouche } from "@/components/home/HomeHeroPlanCartouche";
import { HomeHeroPlanSketchDecor } from "@/components/home/HomeHeroPlanSketchDecor";
import { BlueprintCotationHero } from "@/components/home/BlueprintCotationDecor";
import { HomeGeoExternalisationCards } from "@/components/HomeGeoExternalisationCards";
import { BeWorkValuePillars } from "@/components/marketing/BeWorkValuePillars";
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
import { SITE_URL, absoluteUrl } from "@/lib/site";

/** Vidéo hero — même fichier que dans `HeroPresentationVideo` ; durée ~13 s (fichier court présentation). */
const PRESENTATION_VIDEO_MP4 = "/video/presentation.mp4";
const PRESENTATION_VIDEO_DURATION_ISO = "PT13S";

const PRICE_BOUNDS = getMarketingPriceBoundsLabels();

const HERO_EXPERTISE_BADGES = [
  "Appels d'offres",
  "Analyse DCE",
  "Candidatures",
  "Mémoire technique",
  "Marchés publics",
  "Suivi administratif",
  "Chorus Pro",
  "DOE",
] as const;

/** Badges hero cliquables — pages missions / services. */
const HERO_BADGE_LINKS: Partial<Record<(typeof HERO_EXPERTISE_BADGES)[number], string>> = {
  "Appels d'offres": "/assistants-administratifs-taches#reponses-appels-offres",
  "Analyse DCE": "/services/analyse-dce-btp",
  Candidatures: "/assistants-administratifs-taches#reponses-appels-offres",
  "Mémoire technique": "/ressources/memoire-technique-btp",
  "Marchés publics": "/assistants-administratifs-taches#marches-publics-accords-cadres",
  "Suivi administratif": "/assistants-administratifs-taches#marches-publics-accords-cadres",
  "Chorus Pro": "/facturation-chorus-pro-btp",
  DOE: "/services/doe-btp",
};

const HERO_BADGE_CLASS =
  "inline-flex items-center rounded-sm border border-slate-300 border-l-[3px] border-l-[#2563eb] bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.06em] text-slate-900 shadow-sm transition-colors hover:border-[#1d4ed8]/50 hover:bg-[#eff6ff] sm:text-sm";

const HOME_FAQ_ITEMS = [
  {
    q: "Qu’est-ce que BeWork pour les entreprises du BTP ?",
    a: "BeWork met à disposition des assistants travaux spécialisés qui renforcent vos équipes sur les appels d’offres, les candidatures et le suivi administratif des marchés publics et privés. Nous préparons, structurons et suivons les dossiers sous votre validation — sans remplacer votre dirigeant, chargé d’affaires, conducteur ou bureau d’études.",
  },
  {
    q: "BeWork réalise-t-il seul un appel d’offres de A à Z ?",
    a: "Non. BeWork renforce la préparation et l’organisation de vos réponses : analyse documentaire du DCE, pièces, conformité, structure du mémoire, préparation au dépôt. Votre entreprise conserve les prix, les choix techniques, les engagements contractuels, la signature et le dépôt définitif.",
  },
  {
    q: "Quelles missions peut-on confier à BeWork ?",
    a: "Préparation de candidatures, classement et analyse de DCE, vérification des pièces administratives, assistance à la structuration du mémoire technique, suivi des échéances, préparation du dépôt, suivi administratif après attribution (situations, Chorus Pro, réserves, DOE) — selon la mission cadrée avec vous.",
  },
  {
    q: "Est-ce que je garde la validation finale ?",
    a: "Oui. BeWork prépare, organise et suit. Vous gardez la main sur les décisions techniques, les prix, les signatures et tout engagement contractuel. BeWork ne signe pas à votre place et ne garantit pas l’attribution d’un marché.",
  },
  {
    q: "BeWork remplace-t-il un bureau d’études, un avocat ou un économiste ?",
    a: "Non. BeWork fournit une assistance opérationnelle et documentaire. Les validations juridiques, techniques, financières et contractuelles restent sous la responsabilité de l’entreprise cliente et de ses conseils.",
  },
  {
    q: "BeWork peut-il aider après attribution d’un marché ?",
    a: "Oui, en renfort administratif : classement du marché, échéances, documents de démarrage, situations, Chorus Pro, CR, réserves, DOE et traçabilité des échanges — sans responsabilité de l’exécution technique du chantier.",
  },
] as const;

const HOME_META_TITLE = "Assistants travaux et appels d’offres BTP | BeWork";
const HOME_META_DESCRIPTION = metaDescriptionFrancophonie(
  "BeWork renforce les entreprises du BTP dans la préparation des candidatures, l’analyse des DCE et le suivi administratif des marchés publics et privés",
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
        alt: "BeWork — Assistants travaux spécialisés appels d’offres et marchés BTP",
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
      name: "BeWork — Assistants travaux spécialisés dans les appels d’offres et le suivi des marchés BTP",
      inLanguage: "fr-FR",
      description:
        "BeWork renforce les entreprises du BTP dans la préparation des candidatures, l’analyse des DCE et le suivi administratif des marchés publics et privés — sous validation du client.",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      video: { "@id": `${SITE_URL}/#video-presentation-bework` },
      about: [
        { "@type": "Thing", name: "Assistance appels d’offres BTP" },
        { "@type": "Thing", name: "Préparation candidature marché public" },
        { "@type": "Thing", name: "Analyse DCE" },
        { "@type": "Thing", name: "Suivi administratif de marché" },
      ],
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1"],
      },
    },
    {
      "@type": "Service",
      "@id": `${SITE_URL}/#service-btp`,
      name: "Assistants travaux — renfort appels d’offres et suivi des marchés BTP",
      description:
        "Renfort opérationnel pour entreprises BTP : préparation de candidatures, analyse documentaire des DCE, organisation des réponses, suivi administratif des marchés publics et privés sous validation du client.",
      serviceType: "Renfort administratif travaux — appels d’offres et suivi de marchés BTP",
      category: "Assistance à la préparation et au suivi documentaire des marchés BTP",
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: jsonLdExpandedAreaServed(),
      audience: {
        "@type": "BusinessAudience",
        audienceType:
          "PME BTP, entreprises générales, dirigeants, chargés d’affaires, conducteurs de travaux — France, Belgique, Suisse, Luxembourg",
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
      "@type": "VideoObject",
      "@id": `${SITE_URL}/#video-presentation-bework`,
      name: "Présentation BeWork — renfort assistants travaux BTP",
      description:
        "Vidéo de présentation : préparation candidatures, analyse DCE et suivi administratif des marchés — renfort sous validation client (France · Belgique · Suisse · Luxembourg).",
      thumbnailUrl: [absoluteUrl("/opengraph-image")],
      uploadDate: "2026-04-11T12:00:00+02:00",
      duration: PRESENTATION_VIDEO_DURATION_ISO,
      contentUrl: absoluteUrl(PRESENTATION_VIDEO_MP4),
      embedUrl: `${SITE_URL}/#presentation`,
      encodingFormat: "video/mp4",
      inLanguage: "fr-FR",
      isFamilyFriendly: true,
      publisher: { "@id": `${SITE_URL}/#organization` },
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
        {/* Hero → Process : fond plan discret */}
        <div className="relative overflow-x-clip bg-gradient-to-b from-white via-[#fdfefe] to-[#F8FAFC]">
          {/* Panneau métallique skew discret */}
          <div
            aria-hidden
            className="pointer-events-none absolute right-[-6%] top-[-12rem] -bottom-[92rem] z-0 w-[46%] skew-x-[-12deg] opacity-[0.55] md:top-[-14rem] md:-bottom-[112rem]"
            style={{
              background: "linear-gradient(135deg, #F8FAFC 0%, #D7E0EA 45%, #EEF3F8 100%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute right-[-6%] top-[-12rem] -bottom-[92rem] z-0 w-[46%] skew-x-[-12deg] opacity-20 md:top-[-14rem] md:-bottom-[112rem]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(120deg, rgba(15,23,42,0.1) 0px, rgba(15,23,42,0.1) 1px, transparent 1px, transparent 7px)",
            }}
          />
          {/* Courbe métallique centrale */}
          <div
            className="pointer-events-none absolute inset-x-[-8%] top-[-6%] z-[2] h-[min(48vh,480px)] opacity-[0.2] md:inset-x-[-4%] md:opacity-[0.16]"
            aria-hidden
          >
            <svg viewBox="0 0 1400 520" className="h-full w-full min-w-[900px]" preserveAspectRatio="xMidYMid slice">
              <defs>
                <linearGradient id="bework-hero-metal" x1="0%" y1="0%" x2="100%" y2="35%">
                  <stop offset="0%" stopColor="#cbd5e1" />
                  <stop offset="45%" stopColor="#f1f5f9" />
                  <stop offset="100%" stopColor="#94a3b8" />
                </linearGradient>
              </defs>
              <path
                d="M-120 440 Q 380 60 760 280 T 1520 120"
                stroke="url(#bework-hero-metal)"
                strokeWidth="18"
                fill="none"
                strokeLinecap="round"
                opacity="0.55"
              />
              <path
                d="M-120 440 Q 380 60 760 280 T 1520 120"
                stroke="#2563eb"
                strokeWidth="2.25"
                fill="none"
                strokeLinecap="round"
                opacity="0.35"
              />
            </svg>
          </div>
          {/* Voile léger en tête — lisibilité */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-[3] h-[min(32vh,300px)] bg-gradient-to-b from-white/40 via-transparent to-transparent"
            aria-hidden
          />
          {/* Quadrillage plan — discret */}
          <div
            className="pointer-events-none absolute inset-0 z-[4] bework-blueprint-grid--hero opacity-[0.22] md:opacity-[0.18]"
            aria-hidden
          />
          <div className="relative z-10">
            <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden>
              <HomeBlueprintScrollDecor />
            </div>
            <div className="relative z-[2]">
            {/* Hero compact premium — 1200px, grille 55/45 */}
            <section
              id="hero"
              className="relative overflow-x-clip overflow-y-visible bg-transparent pb-20 pt-0 lg:pt-1"
              style={{ scrollMarginTop: "6rem" }}
            >
              <HomeHeroMetalCorners />
              <HomeHeroPlanSketchDecor />
              <BlueprintCotationHero />
              <div className="container-site relative z-[2]">
            <div className="grid items-center gap-10 text-center lg:grid-cols-[minmax(0,1.08fr)_minmax(280px,1fr)] lg:items-start lg:gap-x-10 xl:grid-cols-[minmax(0,1fr)_minmax(520px,1.15fr)] xl:gap-x-14 lg:gap-y-0 lg:text-left">
              <div className="relative z-[2] mx-auto flex w-full min-w-0 max-w-[540px] flex-col gap-5 lg:mx-0 lg:max-w-none lg:gap-4 lg:pt-10 xl:max-w-[560px]">
                <p className="font-blueprint-note mx-auto max-w-[540px] text-sm font-semibold uppercase leading-snug tracking-[0.12em] text-[#1d4ed8] lg:mx-0 lg:max-w-none lg:text-base">
                  Renfort opérationnel · Appels d&apos;offres &amp; marchés BTP
                </p>

                <h1 className="font-heading text-balance text-[clamp(1.65rem,calc(0.7rem+3vw),2.75rem)] font-bold leading-[1.1] tracking-[-0.03em] lg:max-w-[42rem]">
                  Assistants travaux spécialisés dans les appels d&apos;offres et le suivi des marchés BTP
                </h1>

                <p className="mx-auto mt-4 max-w-[540px] text-[clamp(1.2rem,calc(0.9rem+1.2vw),1.65rem)] font-bold leading-snug tracking-[-0.02em] lg:mx-0 lg:max-w-none">
                  <span className="text-[#0f172a]">On tient le bureau,</span>{" "}
                  <span className="text-[#2563eb]">vous tenez le chantier.</span>
                </p>

                <p className="mx-auto max-w-[540px] text-lg leading-[1.55] text-balance text-slate-800 lg:mx-0 lg:max-w-none lg:text-xl lg:leading-snug">
                  BeWork renforce les entreprises du BTP dans la préparation de leurs candidatures, l&apos;analyse des
                  dossiers de consultation et le suivi administratif des marchés publics et privés.
                </p>

                <p className="mx-auto max-w-[540px] text-base font-medium leading-snug text-slate-700 lg:mx-0 lg:max-w-none lg:text-[1.05rem]">
                  Nous préparons, structurons et suivons les dossiers avec vos équipes. Vous conservez la validation des
                  prix, des choix techniques et des engagements contractuels.
                </p>

                <p className="mx-auto max-w-[540px] text-sm font-semibold leading-snug text-slate-700 lg:mx-0 lg:max-w-none lg:text-base">
                  On tient le dossier, vous gardez la décision · Contrôle documentaire, traçabilité et relecture humaine
                </p>

                <BeWorkValuePillars variant="hero" />

                <div className="mt-4 flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:justify-start">
                  <Link
                    href="#missions-renfort"
                    className="inline-flex min-h-[3rem] items-center justify-center rounded-xl bg-[#1d4ed8] px-6 text-base font-semibold text-white shadow-md transition-colors hover:bg-[#1e40af]"
                    {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-hero-discover")}
                  >
                    Découvrir notre accompagnement
                  </Link>
                  <Link
                    href="#contact"
                    className="inline-flex min-h-[3rem] items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-6 text-base font-semibold text-[#1d4ed8] shadow-sm transition-colors hover:border-[#1d4ed8]/40 hover:bg-[#eff6ff]"
                    {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-hero-exchange")}
                  >
                    Échanger sur votre besoin
                  </Link>
                </div>

                <ul
                  className="mx-auto flex w-full max-w-[540px] flex-wrap justify-center gap-x-2 gap-y-2 lg:mx-0 lg:max-w-none lg:justify-start"
                  aria-label="Expertises métiers"
                >
                  {HERO_EXPERTISE_BADGES.map((label) => (
                    <li key={label}>
                      {HERO_BADGE_LINKS[label] ? (
                        <Link href={HERO_BADGE_LINKS[label]!} className={HERO_BADGE_CLASS}>
                          {label}
                        </Link>
                      ) : (
                        <span className={HERO_BADGE_CLASS}>{label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative flex w-full min-w-0 shrink-0 justify-center lg:justify-end lg:self-start">
                <HomeHeroAside />
              </div>
            </div>
              <HomeHeroPlanCartouche />
              </div>
            </section>

            <HomeRenfortClarificationSection />

            {/* Définition Beworker (AEO — compact) */}
            <section className="relative bg-transparent px-6 pb-8 md:pb-10">
              <div className="container-site">
                <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_10px_40px_-16px_rgba(15,23,42,0.1)] ring-1 ring-slate-100/85 md:p-7">
                  <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-[#1d4ed8] md:text-sm">
                    C’est quoi un Beworker&nbsp;?
                  </p>
                  <p className="mt-3 text-base leading-relaxed text-slate-800 md:text-[1.05rem]">
                    Un Beworker est un assistant travaux BTP dédié à vos opérations&nbsp;: il prépare et structure les
                    dossiers de candidature, organise les pièces, suit les échéances et coordonne les échanges
                    documentaires. Augmenté par l&apos;IA, encadré et supervisé depuis la France — ce n&apos;est ni un
                    chatbot, ni un secrétariat généraliste, ni un bureau d&apos;études réglementé.
                  </p>
                  <p className="mt-4">
                    <BeWorkValuePillars variant="inline" />
                  </p>
                </div>
              </div>
            </section>

            <HomeProblemSection />
            <HomeSolutionSection />
            <HomeResponsibilitiesSplitSection />
            <HomeMissionFamiliesSection />
            <HomeHowItWorksDetailSection />
            <HomePricingSection />
            <HomeCredibilitySection />
            <HomeGeoExternalisationCards />
            <HomeCallCtaBanner />

            <HomeTargetAudienceSection />
            </div>
          </div>
        </div>

        {/* Au-dessus du décor skew qui déborde du bloc hero — évite que le panneau gris recouvre le texte */}
        <div className="relative z-10 overflow-x-clip bg-gradient-to-b from-[#f8fafc]/55 via-[#f1f5f9]/70 to-[#f1f5f9]/85">
          <div className="pointer-events-none absolute inset-0 bework-blueprint-grid opacity-[0.16] md:opacity-[0.19]" aria-hidden />
          <div className="pointer-events-none absolute right-0 top-[8%] h-[min(45%,380px)] w-[min(48%,420px)] opacity-[0.04] md:opacity-[0.05]" aria-hidden>
            <svg className="h-full w-full text-slate-400" viewBox="0 0 200 200" fill="none" preserveAspectRatio="xMidYMid meet">
              <path
                d="M20 160 L160 40 M30 170 L170 50"
                stroke="currentColor"
                strokeWidth="0.6"
                strokeDasharray="4 4"
                opacity="0.6"
              />
              <text x="24" y="36" fill="currentColor" style={{ fontFamily: "ui-monospace, monospace", fontSize: "9px" }}>
                Axe 01
              </text>
            </svg>
          </div>
          <div className="relative z-[1]">
        {/* Ressources */}
        <section id="ressources" className="relative px-6 py-24 md:py-28">
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

        {/* FAQ optimisée SEO */}
        <section id="faq" className="px-6 py-24 md:py-28 scroll-mt-24" style={{ scrollMarginTop: "6rem" }}>
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight text-black md:text-4xl">
              Questions fréquentes
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-black">
              Cadre, périmètre et responsabilités : ce que les entreprises BTP vérifient avant de confier un renfort sur
              leurs candidatures et le suivi administratif de leurs marchés.
            </p>
            <p className="mt-4 text-base font-medium text-black">
              Tous nos tarifs sont exprimés HT, sans frais supplémentaires.
            </p>
            <dl className="mt-12 space-y-8">
              {HOME_FAQ_ITEMS.map((item, i) => (
                <div key={i} className="card-frame rounded-xl p-6">
                  <dt className="text-lg font-semibold text-black">{item.q}</dt>
                  <dd className="mt-3 text-black leading-relaxed">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Contact / prospection */}
        <section id="contact" className="px-6 py-24 md:py-28 scroll-mt-24">
          <div className="mx-auto max-w-site rounded-2xl surface-metallic-light surface-metallic-light--soft border-2 border-[#1d4ed8]/25 p-8 text-black shadow-lg md:p-12 lg:p-14">
            <div className="grid gap-10 lg:grid-cols-5 lg:gap-14">
              <div className="lg:col-span-2">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Échanger sur votre besoin de renfort
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-black">
                  Indiquez votre étape (candidature, dépôt, marché attribué…) et ce que vous attendez précisément de
                  BeWork. Nous cadrons la mission sous la validation de votre entreprise — sans engagement.
                </p>
                <Link
                  href="/tarifs"
                  className="mt-8 inline-flex rounded-lg border-2 border-[#1d4ed8] bg-white px-6 py-3 font-semibold text-black shadow-sm transition hover:bg-[#f8f9fb]"
                  {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_TARIFS, "home-final-cta")}
                >
                  Consulter les forfaits
                </Link>
              </div>
              <div className="relative rounded-2xl border border-slate-200/90 bg-white/95 p-6 shadow-sm lg:col-span-3 md:p-8">
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
          </div>
        </div>
      </main>

      <MarketingSiteFooter />
    </div>
  );
}