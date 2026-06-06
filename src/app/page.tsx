import type { Metadata } from "next";
import Link from "next/link";
import { ProspectContactForm } from "@/components/contact/ProspectContactForm";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { HomeProblemSection } from "@/components/HomeProblemSection";
import { HomeHowItWorksDetailSection } from "@/components/HomeHowItWorksDetailSection";
import { HomeWhatWeHandleSection } from "@/components/HomeWhatWeHandleSection";
import { HomeCredibilitySection } from "@/components/HomeCredibilitySection";
import { ExpertiseTableSection } from "@/components/ExpertiseTableSection";
import { HomeCallCtaBanner } from "@/components/HomeCallCtaBanner";
import { HomePricingSection } from "@/components/HomePricingSection";
import { HomeSolutionSection } from "@/components/HomeSolutionSection";
import { HomeTargetAudienceSection } from "@/components/HomeTargetAudienceSection";
import { HomeHeroAside } from "@/components/home/HomeHeroAside";
import { HomeBlueprintScrollDecor } from "@/components/home/HomeBlueprintScrollDecor";
import { HomeHeroMetalCorners } from "@/components/home/HomeHeroMetalCorners";
import { HomeHeroPlanCartouche } from "@/components/home/HomeHeroPlanCartouche";
import { HomeHeroPlanSketchDecor } from "@/components/home/HomeHeroPlanSketchDecor";
import { BlueprintCotationHero } from "@/components/home/BlueprintCotationDecor";
import { ConciergerieDirigeantSection } from "@/components/ConciergerieDirigeantSection";
import { HomeGeoExternalisationCards } from "@/components/HomeGeoExternalisationCards";
import { BeWorkValuePillars } from "@/components/marketing/BeWorkValuePillars";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import {
  formatPriceLabelFr,
  getAggregateOfferDescription,
  getPublicPriceBoundsLabels,
} from "@/lib/subscription-plans";
import { jsonLdExpandedAreaServed } from "@/lib/jsonld-area-served";
import {
  SEO_OG_ALTERNATE_LOCALES,
  hreflangFrancophonieLanguages,
} from "@/lib/seo-francophonie";
import { SEO_KEYWORDS_HOME } from "@/lib/seo-keywords";
import { EXTERNALISATION_ADMIN_BT_NAV } from "@/lib/externalisation-administrative-btp-geo";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";
import { SITE_URL, absoluteUrl } from "@/lib/site";

/** Vidéo hero — même fichier que dans `HeroPresentationVideo` ; durée ~13 s (fichier court présentation). */
const PRESENTATION_VIDEO_MP4 = "/video/presentation.mp4";
const PRESENTATION_VIDEO_DURATION_ISO = "PT13S";

const PRICE_BOUNDS = getPublicPriceBoundsLabels();

const HERO_EXPERTISE_BADGES = [
  "Marchés publics",
  "Marchés privés",
  "Accords-cadres",
  "DOE",
  "Comptes rendus",
  "Attachements",
  "Situations travaux",
  "Validations MOA",
] as const;

const HOME_FAQ_ITEMS = [
  {
    q: "Qu’est-ce que le relais administratif BeWork pour les marchés travaux ?",
    a: "BeWork absorbe le flux administratif entre terrain, bureau et donneurs d’ordre : dossiers d’intervention, comptes rendus, DOE, attachements, situations, relances et coordination documentaire. L’IA structure et accélère ; un Beworker humain garde le fil et la relation. Vous validez les points qui engagent votre entreprise.",
  },
  {
    q: "BeWork s’adresse à quelles entreprises du BTP ?",
    a: "Aux titulaires de marchés publics, privés, accords-cadres ou contrats récurrents — tous corps d’état : gros œuvre, VRD, réseaux, second œuvre, maintenance, réhabilitation, travaux multisites. Ce n’est pas un secrétariat généraliste ni un outil IA déconnecté du terrain.",
  },
  {
    q: "Quelles missions administratives de marché peut-on déléguer ?",
    a: "Suivi administratif de marchés, comptes rendus, photos chantier, relances MOA / MOE / fournisseurs / sous-traitants, attachements, situations, validations BPU / DPGF, DOE, classement des pièces marché, dossiers d’intervention et demandes d’autorisations selon besoin.",
  },
  {
    q: "Est-ce que je garde la validation finale ?",
    a: "Oui. BeWork prépare, structure, relance et suit les dossiers, mais vous gardez la main sur toutes les décisions qui engagent votre entreprise : prix, validation technique, signature, engagement contractuel ou réponse au donneur d’ordre.",
  },
] as const;

const HOME_META_TITLE = "BeWork — Assistants travaux augmentés par l’IA pour le BTP";
const HOME_META_DESCRIPTION =
  "Assistants travaux IA pour le BTP : marchés publics et privés, administration chantier, validation humaine, conformité juridique, productivité ×10. 100 % supervisé en France.";

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
        alt: "BeWork — Assistants travaux augmentés par l’IA pour le BTP",
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
      name: "BeWork — Assistants travaux augmentés par l’IA pour le BTP",
      inLanguage: "fr-FR",
      description:
        "Assistants travaux augmentés par l’IA : relais bureau-chantier pour marchés travaux, dossiers d'intervention, comptes rendus, DOE, attachements, situations, relances et suivi donneurs d'ordre.",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      video: { "@id": `${SITE_URL}/#video-presentation-bework` },
      about: [
        { "@type": "Thing", name: "Bâtiment et travaux publics" },
        { "@type": "Thing", name: "Conducteurs de travaux" },
        { "@type": "Thing", name: "Artisanat du bâtiment" },
        { "@type": "Thing", name: "Entreprises du bâtiment en France, Belgique, Suisse, Luxembourg" },
      ],
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1"],
      },
    },
    {
      "@type": "Service",
      "@id": `${SITE_URL}/#service-btp`,
      name: "Assistants travaux augmentés par l’IA — relais bureau-chantier BTP",
      description:
        "Assistants travaux externalisés pour marchés publics et privés : dossiers d'intervention, comptes rendus, DOE, attachements, situations, relances donneurs d'ordre, validations BPU / DPGF et coordination documentaire terrain ↔ bureau.",
      serviceType: "Assistants travaux augmentés par l’IA — relais bureau-chantier BTP",
      category: "Assistants travaux et gestion administrative marchés travaux (BTP)",
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: jsonLdExpandedAreaServed(),
      audience: {
        "@type": "BusinessAudience",
        audienceType:
          "Entreprises BTP titulaires de marchés publics, privés, accords-cadres et contrats récurrents — tous corps d'état, PME, entreprises générales et maintenance (France, Belgique, Suisse, Luxembourg)",
      },
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "EUR",
        lowPrice: PRICE_BOUNDS.low,
        highPrice: PRICE_BOUNDS.high,
        offerCount: "3",
        description: getAggregateOfferDescription(),
      },
    },
    {
      "@type": "VideoObject",
      "@id": `${SITE_URL}/#video-presentation-bework`,
      name: "Présentation BeWork — assistants travaux BTP augmentés par l’IA",
      description:
        "Vidéo de présentation : dossiers chantier, devis & relances, DICT et coordination fournisseurs — service à distance, forfaits HT (France · Belgique · Suisse · Luxembourg).",
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
    <div className="min-h-screen min-w-0 overflow-x-clip bg-gradient-to-b from-white via-[#f8fafc] to-[#f1f5f9]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />
      <MarketingSiteHeader plainBg />

      <main className="pt-0">
        {/* Hero → Problème → Solution → Process BeWork : un seul fond (dégradé + métallique continu) */}
        <div className="relative overflow-x-clip bg-gradient-to-b from-white via-[#fdfefe] to-[#F8FAFC]">
          <div
            className="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-b from-white/50 via-transparent to-transparent"
            aria-hidden
          />
          <div
            aria-hidden
            className="pointer-events-none absolute right-[-6%] top-[-12rem] -bottom-[92rem] z-0 w-[46%] skew-x-[-12deg] opacity-[0.78] md:top-[-14rem] md:-bottom-[112rem]"
            style={{
              background: "linear-gradient(135deg, #F8FAFC 0%, #D7E0EA 45%, #EEF3F8 100%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute right-[-6%] top-[-12rem] -bottom-[92rem] z-0 w-[46%] skew-x-[-12deg] opacity-30 md:top-[-14rem] md:-bottom-[112rem]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(120deg, rgba(15,23,42,0.14) 0px, rgba(15,23,42,0.14) 1px, transparent 1px, transparent 7px)",
            }}
          />
          {/* Quadrillage plan — papier millimétré bleuté */}
          <div className="pointer-events-none absolute inset-0 z-[3] bework-blueprint-grid--hero opacity-[0.62] md:opacity-[0.56]" aria-hidden />
          {/* Courbe métallique centrale — complète les arcs coins */}
          <div
            className="pointer-events-none absolute inset-x-[-8%] top-[-6%] z-[4] h-[min(48vh,480px)] opacity-[0.26] md:inset-x-[-4%] md:opacity-[0.22]"
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
                opacity="0.42"
              />
            </svg>
          </div>
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
                <p className="font-blueprint-note mx-auto max-w-[540px] text-[13px] font-medium uppercase leading-snug tracking-[0.12em] text-[#1d4ed8] lg:mx-0 lg:max-w-none lg:text-[13.5px]">
                  Assistants travaux augmentés par l&apos;IA
                </p>

                <h1 className="font-heading text-balance text-[clamp(1.85rem,calc(0.75rem+3.1vw),2.9rem)] font-bold leading-[1.08] tracking-[-0.03em] lg:max-w-[40rem]">
                  <span className="block text-[#0f172a]">On tient le bureau,</span>
                  <span className="block text-[#2563eb]">vous tenez le chantier.</span>
                </h1>

                <p className="mx-auto max-w-[540px] text-[16px] leading-[1.55] text-balance text-slate-700 lg:mx-0 lg:max-w-none lg:text-[17px] lg:leading-snug">
                  Relais bureau-chantier pour vos marchés travaux : dossiers d&apos;intervention, comptes rendus, DOE, attachements, situations, validations, relances et coordination documentaire.
                </p>

                <p className="mx-auto max-w-[540px] text-[14.5px] font-medium leading-snug text-slate-600 lg:mx-0 lg:max-w-none lg:text-[15px]">
                  Pour les entreprises BTP titulaires de marchés publics, privés, accords-cadres ou contrats récurrents.
                </p>

                <p className="mx-auto max-w-[540px] text-[13.5px] font-medium leading-snug text-slate-500 lg:mx-0 lg:max-w-none lg:text-[14px]">
                  IA spécialisée BTP + validation humaine · 100 % supervisé en France
                </p>

                <BeWorkValuePillars variant="hero" />

                <div className="mt-4 flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:justify-start">
                  <Link
                    href="/contact"
                    className="inline-flex min-h-[2.75rem] items-center justify-center rounded-lg bg-[#1d4ed8] px-5 text-[15px] font-semibold text-white shadow-md transition-colors hover:bg-[#1e40af]"
                    {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-hero-primary")}
                  >
                    Demander un diagnostic
                  </Link>
                  <Link
                    href="/assistants-administratifs-taches"
                    className="inline-flex min-h-[2.75rem] items-center justify-center rounded-lg border border-slate-300/90 bg-white px-5 text-[15px] font-semibold text-[#1d4ed8] shadow-sm transition-colors hover:border-[#1d4ed8]/40 hover:bg-[#eff6ff]"
                  >
                    Voir les missions prises en charge
                  </Link>
                </div>

                <ul
                  className="mx-auto flex w-full max-w-[540px] flex-wrap justify-center gap-x-2 gap-y-2 lg:mx-0 lg:max-w-none lg:justify-start"
                  aria-label="Expertises métiers"
                >
                  {HERO_EXPERTISE_BADGES.map((label) => (
                    <li key={label}>
                      <span className="inline-flex items-center rounded-sm border border-slate-300/85 border-l-2 border-l-[#2563eb]/75 bg-white/95 px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-slate-800 shadow-[0_4px_14px_-12px_rgba(15,23,42,0.12)] sm:text-[11px]">
                        {label}
                      </span>
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

            {/* Définition BeWork + rôle Beworker (AEO / GEO — une seule carte) */}
            <section className="relative bg-transparent px-6 pb-10 md:pb-12">
              <div className="container-site">
                <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_10px_40px_-16px_rgba(15,23,42,0.1)] ring-1 ring-slate-100/85 md:p-8">
                  <p className="font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-[#1d4ed8] md:text-[12px]">
                    BeWork, c’est quoi ?
                  </p>
                  <p className="mt-3 text-[15px] leading-relaxed text-slate-700 md:text-base">
                    BeWork est le relais administratif des marchés travaux pour les entreprises du BTP titulaires de marchés
                    publics, privés, accords-cadres ou contrats récurrents. Nous absorbons le flux documentaire entre terrain,
                    bureau et donneurs d&apos;ordre&nbsp;: dossiers d&apos;intervention, comptes rendus, DOE, attachements,
                    situations, relances et validations — pour sécuriser les interventions et accélérer les paiements.
                  </p>
                  <p className="mt-5">
                    <BeWorkValuePillars variant="inline" />
                  </p>
                  <hr className="my-6 border-slate-200/90" />
                  <p className="font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-[#1d4ed8] md:text-[12px]">
                    C’est quoi un Beworker ?
                  </p>
                  <p className="mt-3 text-[15px] leading-relaxed text-slate-700 md:text-base">
                    Un Beworker, c’est un assistant travaux BTP dédié à vos marchés : il tient les dossiers, prépare les livrables,
                    relance les donneurs d&apos;ordre et coordonne les échanges terrain ↔ bureau. Augmenté par l&apos;IA, encadré et
                    supervisé depuis la France — ce n’est pas un chatbot ni un secrétariat généraliste.
                  </p>
                  <p className="font-blueprint-note mt-3 text-center text-[13px] text-slate-600 md:text-sm">
                    Terrain ↔ bureau ↔ donneur d&apos;ordre
                  </p>
                  <p className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-[12px] text-slate-600 md:text-sm">
                    <Link href="/services/assistant-travaux" className="text-[#1d4ed8] underline-offset-2 hover:underline">
                      Assistant travaux
                    </Link>
                    <span className="text-slate-300" aria-hidden>
                      ·
                    </span>
                    <Link href="/services/compte-rendu-chantier" className="text-[#1d4ed8] underline-offset-2 hover:underline">
                      Compte rendu chantier
                    </Link>
                    <span className="text-slate-300" aria-hidden>
                      ·
                    </span>
                    <Link href="/services/analyse-dce-btp" className="text-[#1d4ed8] underline-offset-2 hover:underline">
                      Analyse DCE
                    </Link>
                    <span className="text-slate-300" aria-hidden>
                      ·
                    </span>
                    <Link
                      href="/tarifs"
                      className="text-[#1d4ed8] underline-offset-2 hover:underline"
                      {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_TARIFS, "home-services-strip")}
                    >
                      Tarifs
                    </Link>
                    <span className="text-slate-300" aria-hidden>
                      ·
                    </span>
                    <Link
                      href="/contact"
                      className="text-[#1d4ed8] underline-offset-2 hover:underline"
                      {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-services-strip")}
                    >
                      Contact
                    </Link>
                  </p>
                  <p className="mt-4 text-center">
                    <Link
                      href="/services"
                      className="text-sm font-semibold text-[#1d4ed8] underline-offset-4 hover:underline"
                    >
                      Voir les pages services
                    </Link>
                  </p>
                </div>
              </div>
            </section>

            <HomeProblemSection />
            <HomeSolutionSection />
            <HomeHowItWorksDetailSection />
            <HomeWhatWeHandleSection />
            <HomePricingSection />
            <HomeCredibilitySection />
            <HomeGeoExternalisationCards />
            <ExpertiseTableSection />
            <HomeCallCtaBanner />

            {/* Lien pilier tâches — dans le bloc hero pour que la courbe métallique suive jusqu’ici */}
            <section className="relative px-6 pb-12 pt-8 md:pb-14 md:pt-10">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-0 z-0 w-[min(38%,18rem)] rounded-l-[88px] bg-gradient-to-l from-slate-200/30 via-slate-100/15 to-transparent opacity-[0.42] md:w-[min(36%,22rem)] md:rounded-l-[110px] md:opacity-35"
              />
              <div className="relative z-[1] mx-auto w-full max-w-6xl">
                <div className="rounded-2xl border border-slate-200/90 bg-white p-6 text-left shadow-[0_10px_40px_-16px_rgba(15,23,42,0.1)] ring-1 ring-slate-100/85 md:p-8 md:text-center">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#1d4ed8] md:text-[12px]">
                    Missions &amp; périmètre
                  </p>
                  <p className="mt-2.5 font-sans text-lg font-bold leading-snug tracking-tight text-[#0f172a] md:mx-auto md:max-w-[40rem] md:text-xl">
                    Missions administratives de marchés travaux
                  </p>
                  <p className="mt-3 text-[15px] leading-relaxed text-slate-600 md:mx-auto md:max-w-[48rem] md:text-base md:leading-relaxed">
                    Suivi de marchés, comptes rendus, DOE, attachements, situations, relances MOA / MOE, validations BPU / DPGF,
                    dossiers d&apos;intervention et coordination documentaire — le détail de ce que nous prenons en charge. Voir aussi les{" "}
                    <Link href="/services" className="font-semibold text-[#1d4ed8] underline-offset-2 hover:underline">
                      pages services
                    </Link>{" "}
                    pour les intentions métier (conducteur de travaux, DCE, PPSPS, DOE…).
                  </p>
                  <p className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 text-[12px] text-slate-600 md:mt-4 md:max-w-[48rem] md:gap-x-3 md:text-sm md:leading-relaxed">
                    <Link href="/services/assistant-conducteur-de-travaux" className="text-[#1d4ed8] underline-offset-2 hover:underline">
                      Assistant conducteur de travaux
                    </Link>
                    <span className="text-slate-300" aria-hidden>
                      ·
                    </span>
                    <Link href="/services/ppsps" className="text-[#1d4ed8] underline-offset-2 hover:underline">
                      PPSPS
                    </Link>
                    <span className="text-slate-300" aria-hidden>
                      ·
                    </span>
                    <Link href="/services/doe-btp" className="text-[#1d4ed8] underline-offset-2 hover:underline">
                      DOE
                    </Link>
                    <span className="text-slate-300" aria-hidden>
                      ·
                    </span>
                    <Link href="/ressources" className="text-[#1d4ed8] underline-offset-2 hover:underline">
                      Ressources
                    </Link>
                  </p>
                  <div className="mt-2.5 h-1 w-14 rounded-sm bg-[#1d4ed8] md:mx-auto" aria-hidden />
                  <Link
                    href="/assistants-administratifs-taches"
                    className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#1d4ed8] transition-colors hover:text-[#1e40af] md:mx-auto md:mt-6"
                  >
                    Voir le périmètre des missions
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              </div>
            </section>

            {/* Même fond courbe grise que le hero / sections précédentes */}
            <HomeTargetAudienceSection />
            <ConciergerieDirigeantSection />
            </div>
          </div>
        </div>

        {/* Au-dessus du décor skew qui déborde du bloc hero — évite que le panneau gris recouvre le texte */}
        <div className="relative z-10 overflow-x-clip bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#f1f5f9]">
          <div className="pointer-events-none absolute inset-0 bework-blueprint-grid opacity-[0.22] md:opacity-[0.26]" aria-hidden />
          <div className="pointer-events-none absolute right-0 top-[8%] h-[min(45%,380px)] w-[min(48%,420px)] opacity-[0.035] md:opacity-[0.045]" aria-hidden>
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
              Cadre, tarifs et collaboration : ce que les titulaires de marchés BTP veulent vérifier avant d&apos;externaliser le
              suivi administratif de leurs marchés.
            </p>
            <p className="mt-4 text-sm font-medium text-black">
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
                  Faire le point sur vos marchés et votre charge administrative ?
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-black">
                  Décrivez votre contexte en quelques champs : BeWork qualifie votre demande et vous recontacte pour un échange
                  ciblé — avant tout engagement.
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
          </div>
        </div>
      </main>

      <MarketingSiteFooter />
    </div>
  );
}