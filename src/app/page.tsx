import type { Metadata } from "next";
import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { HomeProblemSection } from "@/components/HomeProblemSection";
import { HomeHowItWorksDetailSection } from "@/components/HomeHowItWorksDetailSection";
import { HomeWhatWeHandleSection } from "@/components/HomeWhatWeHandleSection";
import { HomeCredibilitySection } from "@/components/HomeCredibilitySection";
import { ExpertiseTableSection } from "@/components/ExpertiseTableSection";
import { HomeCallCtaBanner } from "@/components/HomeCallCtaBanner";
import { HomePricingSection } from "@/components/HomePricingSection";
import { HomeSolutionSection } from "@/components/HomeSolutionSection";
import { HomeSectorExamplesSection } from "@/components/HomeSectorExamplesSection";
import { HomeHeroAside } from "@/components/home/HomeHeroAside";
import { HomeBlueprintScrollDecor } from "@/components/home/HomeBlueprintScrollDecor";
import { HomeHeroMetalCorners } from "@/components/home/HomeHeroMetalCorners";
import { HomeHeroPlanCartouche } from "@/components/home/HomeHeroPlanCartouche";
import { HomeHeroPlanSketchDecor } from "@/components/home/HomeHeroPlanSketchDecor";
import { BlueprintCotationHero } from "@/components/home/BlueprintCotationDecor";
import { ConciergerieDirigeantSection } from "@/components/ConciergerieDirigeantSection";
import { HomeGeoExternalisationCards } from "@/components/HomeGeoExternalisationCards";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import {
  formatPriceLabelFr,
  getAggregateOfferDescription,
  getPublicPriceBoundsLabels,
} from "@/lib/subscription-plans";
import { jsonLdExpandedAreaServed } from "@/lib/jsonld-area-served";
import { SEO_KEYWORDS_HOME } from "@/lib/seo-keywords";
import { EXTERNALISATION_ADMIN_BT_NAV } from "@/lib/externalisation-administrative-btp-geo";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";
import { SITE_URL, absoluteUrl } from "@/lib/site";

/** Vidéo hero — même fichier que dans `HeroPresentationVideo` ; durée ~13 s (fichier court présentation). */
const PRESENTATION_VIDEO_MP4 = "/video/presentation.mp4";
const PRESENTATION_VIDEO_DURATION_ISO = "PT13S";

const PRICE_BOUNDS = getPublicPriceBoundsLabels();

const HOME_FAQ_ITEMS = [
  {
    q: "Qu’est-ce qu’un « assistant travaux augmenté par l’IA » chez BeWork ?",
    a: "C’est un relais opérationnel pour vos dossiers chantier et votre administratif lié au BTP : préparation de documents, relances, suivi et coordination cadrés. L’IA aide à structurer et accélérer la mise en forme ; un interlocuteur humain garde le fil, le cadre et la relation avec vous. Ce n’est pas un substitut à votre expertise terrain ni à vos validations sur les engagements.",
  },
  {
    q: "BeWork, c’est une assistante administrative ou une assistante travaux ?",
    a: "BeWork est une assistante travaux BTP : un relais bureau-chantier qui tient vos dossiers de devis, relances, documents travaux, DICT, fournisseurs, comptes rendus et réserves pendant que vous êtes sur le terrain. Ce n’est pas un secrétariat généraliste.",
  },
  {
    q: "Quels types de demandes chantier peut-on déléguer ?",
    a: "Vous pouvez déléguer les tâches qui doivent avancer côté bureau : relances devis, préparation de documents, suivi DICT/DT, commandes fournisseurs, livraisons, locations matériel, comptes rendus, préparation de PV, organisation et relances clients.",
  },
  {
    q: "Est-ce que je garde la validation finale ?",
    a: "Oui. BeWork prépare, structure, relance et suit les dossiers, mais vous gardez la main sur toutes les décisions qui engagent votre entreprise : prix, validation technique, signature, engagement contractuel ou réponse client sensible.",
  },
] as const;

const HOME_META_TITLE = "Assistant travaux BTP augmenté par l’IA | BeWork";
const HOME_META_DESCRIPTION =
  "Assistants travaux pour le BTP : devis, relances, DOE, PPSPS, DCE et suivi bureau-chantier. On tient le bureau, vous tenez le chantier.";

export const metadata: Metadata = {
  title: { absolute: HOME_META_TITLE },
  description: HOME_META_DESCRIPTION,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  keywords: SEO_KEYWORDS_HOME,
  alternates: { canonical: SITE_URL, languages: { fr: SITE_URL, "x-default": SITE_URL } },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    alternateLocale: ["fr_BE", "fr_CH", "fr_LU"],
    url: SITE_URL,
    siteName: "BeWork",
    title: HOME_META_TITLE,
    description: HOME_META_DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "BeWork — Assistants travaux augmentés par l’IA pour artisans et conducteurs de travaux",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BeWork — Assistants travaux augmentés par l’IA",
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
      name: "BeWork — Assistants travaux augmentés par l’IA (relais dossiers chantier)",
      inLanguage: "fr-FR",
      description:
        "Assistants travaux augmentés par l’IA : relais bureau‑chantier pour dossiers (devis, relances, DICT, fournisseurs, documents travaux) sans recruter. Démo vidéo et forfaits TTC.",
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
      name: "Assistants travaux BTP — relais dossiers chantier (augmentés par l’IA)",
      description:
        "Relais bureau‑chantier : devis & relances, situations de travaux, DICT/DT et dossiers chantier, coordination fournisseurs (commandes, livraisons, locations), comptes rendus et documents de réception/DOE — outils d’IA pour structurer et accélérer, sous validation sur les points sensibles.",
      serviceType: "Assistants travaux BTP augmentés par l’IA",
      category: "Assistance travaux et dossiers chantier (BTP)",
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: jsonLdExpandedAreaServed(),
      audience: {
        "@type": "BusinessAudience",
        audienceType:
          "Artisans, conducteurs de travaux, chefs de chantier, chargés d’affaires, sous-traitants, dirigeants de TPE/PME et entreprises générales du bâtiment (France, Belgique, Suisse, Luxembourg)",
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
        "Vidéo de présentation : dossiers chantier, devis & relances, DICT et coordination fournisseurs — service à distance, forfaits TTC (France · Belgique · Suisse · Luxembourg).",
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
          <div className="pointer-events-none absolute inset-0 z-[3] bework-blueprint-grid--hero opacity-[0.58] md:opacity-[0.52]" aria-hidden />
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
              <div className="relative z-[2] mx-auto flex w-full min-w-0 max-w-[540px] flex-col gap-6 lg:mx-0 lg:max-w-none lg:gap-5 lg:pt-10 xl:max-w-[560px]">
                <p className="mx-auto inline-flex max-w-full items-center gap-2 self-center rounded-full border border-[#93c5fd]/70 bg-gradient-to-r from-[#eff6ff] via-white to-[#eff6ff] px-3.5 py-1.5 text-[12.5px] font-semibold leading-snug tracking-tight text-[#1d4ed8] shadow-[0_8px_28px_-18px_rgba(37,99,235,0.35)] ring-1 ring-white/80 sm:gap-2.5 sm:px-4 sm:text-sm lg:mx-0 lg:self-start">
                  <svg
                    className="size-[15px] shrink-0 sm:size-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.85}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <rect width="8" height="4" x="8" y="2" rx="1" />
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <path d="M9 10h6M9 14h6M9 18h4" />
                  </svg>
                  <span className="flex flex-col items-start gap-0.5 text-left sm:flex-row sm:items-center sm:gap-2">
                    <span>Assistant de gestion travaux · Relais BTP</span>
                    <span className="font-blueprint-note text-[11px] font-normal normal-case tracking-wide text-slate-600 sm:text-xs">
                      Augmenté par l’IA · note chantier
                    </span>
                  </span>
                </p>

                <p className="mx-auto max-w-[540px] text-[15px] leading-relaxed text-balance text-slate-600 lg:mx-0 lg:max-w-none lg:text-[15px] lg:leading-relaxed">
                  Le relais BTP qui vous aide à produire vos documents, suivre vos chantiers et répondre plus vite.
                </p>

                <h1
                  className="font-heading text-balance text-[clamp(1.35rem,calc(0.55rem+2.35vw),2.35rem)] font-bold leading-[1.18] tracking-[-0.02em] sm:leading-[1.22] lg:max-w-[40rem]"
                >
                  <span className="text-[#0f172a]">Un assistant travaux à vos côtés pour </span>
                  <span className="text-[#2563eb]">tenir le rythme du chantier</span>
                  <span className="text-[#0f172a]">.</span>
                </h1>

                <p className="mx-auto max-w-[540px] text-lg leading-[1.62] text-balance text-slate-600 lg:mx-0 lg:max-w-none lg:text-[19px] lg:leading-snug">
                  BeWork accompagne les pros du BTP sur les tâches les plus chronophages&nbsp;: comptes rendus de chantier,
                  analyse de DCE, PPSPS, mémoire technique, chiffrage de devis, dossiers travaux, relances et suivi administratif.
                </p>

                <div className="mx-auto -mt-1 flex w-full max-w-[540px] flex-wrap justify-center gap-2 lg:mx-0 lg:max-w-none lg:justify-start">
                  {["DICT", "Commandes matériel", "Engins & locations", "RDV client", "Relances urgentes"].map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full border border-slate-200/90 bg-white/90 px-3 py-1 text-[11.5px] font-semibold tracking-tight text-slate-700 shadow-[0_6px_20px_-14px_rgba(15,23,42,0.14)] ring-1 ring-[#2563eb]/[0.07] backdrop-blur-[2px]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* CTA hero : lien ressources uniquement — « Réserver un appel » est dans le header */}
                <div className="mt-1 flex w-full lg:justify-start">
                  <Link
                    href="/ressources"
                    className="inline-flex min-h-[2.75rem] items-center gap-2 text-left text-[15px] font-semibold text-[#1d4ed8] underline-offset-[6px] transition-colors hover:text-[#1e40af] hover:underline"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 opacity-90" aria-hidden>
                      <path d="M8 21V7l8-4v14M8 21l8-4M8 21H6a2 2 0 0 1-2-2v-9M16 17v4M16 3v14" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Découvrir les ressources
                  </Link>
                </div>

                <ul
                  className="mt-6 flex w-full max-w-[580px] flex-col divide-y divide-slate-200 rounded-xl border border-slate-200/70 bg-white/[0.78] px-3 py-1 shadow-[0_8px_28px_-18px_rgba(15,23,42,0.1)] backdrop-blur-md sm:max-w-none sm:flex-row sm:divide-x sm:divide-y-0 sm:items-stretch sm:px-4 sm:py-2 lg:mx-0 lg:max-w-none"
                  aria-label="Engagements"
                >
                  <li className="flex min-h-[3.25rem] flex-1 items-center gap-3 px-2 py-4 sm:min-h-[3.75rem] sm:px-4 sm:py-4 lg:min-h-[3.5rem]">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#dbeafe] text-[#2563eb] shadow-sm shadow-blue-900/5 ring-[0.5px] ring-[#bfdbfe]/90"
                      aria-hidden
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Délais courts (type horloge) */}
                        <path
                          d="M12 6v7l6 6"
                          stroke="currentColor"
                          strokeWidth="1.65"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" />
                      </svg>
                    </span>
                    <span className="min-w-0 text-left text-[15px] font-semibold leading-[1.2] tracking-tight text-[#171717]">
                      <span className="block">Opérationnel</span>
                      <span className="block text-slate-600">en 3 à 5 jours</span>
                    </span>
                  </li>
                  <li className="flex min-h-[3.25rem] flex-1 items-center gap-3 px-2 py-4 sm:min-h-[3.75rem] sm:px-4 sm:py-4 lg:min-h-[3.5rem]">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#dbeafe] text-[#2563eb] shadow-sm shadow-blue-900/5 ring-[0.5px] ring-[#bfdbfe]/90"
                      aria-hidden
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Pas d’embauche : équipe externe */}
                        <path
                          d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"
                          stroke="currentColor"
                          strokeWidth="1.65"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle cx="9" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.65" />
                        <path
                          d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
                          stroke="currentColor"
                          strokeWidth="1.65"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M18.5 14.5l2 2 4-4"
                          stroke="currentColor"
                          strokeWidth="1.65"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span className="min-w-0 text-left text-[15px] font-semibold leading-[1.2] tracking-tight text-[#171717]">
                      <span className="block">Sans</span>
                      <span className="block text-slate-600">recrutement</span>
                    </span>
                  </li>
                  <li className="flex min-h-[3.25rem] flex-1 items-center gap-3 px-2 py-4 sm:min-h-[3.75rem] sm:px-4 sm:py-4 lg:min-h-[3.5rem]">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#dbeafe] text-[#2563eb] shadow-sm shadow-blue-900/5 ring-[0.5px] ring-[#bfdbfe]/90"
                      aria-hidden
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Ancrage France / siège */}
                        <path
                          d="M20 10c0 5.25-7.53 13.94-8.35 14.71a.5.5 0 0 1-.65 0C10.53 23.94 4 15.27 4 10a8 8 0 1 1 16 0Z"
                          stroke="currentColor"
                          strokeWidth="1.65"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle cx="12" cy="10" r="2.75" stroke="currentColor" strokeWidth="1.65" />
                      </svg>
                    </span>
                    <span className="min-w-0 text-left text-[15px] font-semibold leading-[1.2] tracking-tight text-[#171717]">
                      <span className="block">Piloté depuis</span>
                      <span className="block text-slate-600">la France</span>
                    </span>
                  </li>
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
                    BeWork est un service d&apos;assistants travaux augmentés par l&apos;IA pour les entreprises du BTP. La
                    plateforme aide les artisans, conducteurs de travaux, chefs de chantier et chargés d&apos;affaires à
                    déléguer les tâches chronophages&nbsp;: comptes rendus de chantier, DOE, PPSPS, analyse de DCE, chiffrage
                    de devis, relances, planning, demandes administratives et suivi opérationnel. L&apos;objectif est de
                    libérer du temps terrain tout en structurant le suivi administratif et commercial des chantiers.
                  </p>
                  <p className="mt-3 text-center text-[13px] font-semibold text-slate-800 md:text-sm">
                    On tient le bureau, vous tenez le chantier.
                  </p>
                  <hr className="my-6 border-slate-200/90" />
                  <p className="font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-[#1d4ed8] md:text-[12px]">
                    C’est quoi un Beworker ?
                  </p>
                  <p className="mt-3 text-[15px] leading-relaxed text-slate-700 md:text-base">
                    Un Beworker, c’est un assistant BTP dédié, formé aux outils du secteur et augmenté par l’IA. Il traite vos demandes, prépare vos
                    livrables, suit vos dossiers et reste encadré par BeWork. Ce n’est pas un chatbot&nbsp;: c’est un relais humain, structuré, joignable
                    et supervisé.
                  </p>
                  <p className="font-blueprint-note mt-3 text-center text-[13px] text-slate-600 md:text-sm">
                    Relais bureau ↔ chantier · suivi terrain
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
                    Catalogue des missions : de l&apos;administratif à la coordination chantier
                  </p>
                  <p className="mt-3 text-[15px] leading-relaxed text-slate-600 md:mx-auto md:max-w-[48rem] md:text-base md:leading-relaxed">
                    Devis, factures, situations de travaux, DICT et dossiers administratifs, commandes & livraisons, locations
                    matériel / engins / véhicules, planning, relances et suivi des litiges — le détail de ce que nous pouvons
                    prendre en main pour vous. Voir aussi les{" "}
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
            <HomeSectorExamplesSection />
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
              Cadre, tarifs et collaboration : ce que les dirigeants du BTP veulent vérifier avant d&apos;externaliser leur
              administratif.
            </p>
            <p className="mt-4 text-sm font-medium text-black">
              Tous nos tarifs sont exprimés TTC, sans frais supplémentaires.
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

        {/* CTA final */}
        <section id="contact" className="px-6 py-24 md:py-28">
          <div className="mx-auto max-w-site rounded-2xl surface-metallic-light surface-metallic-light--soft border-2 border-[#1d4ed8]/25 p-12 text-black shadow-lg md:p-16">
            <div className="grid gap-12 md:grid-cols-3 md:items-center md:gap-16">
              <div className="md:col-span-2">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Faire le point sur votre charge administrative ?
                </h2>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-black">
                  Un échange permet de vérifier l&apos;adéquation entre votre organisation, vos outils et le niveau de forfait
                  — avant tout engagement. Nous dimensionnons le périmètre à votre réalité chantier et trésorerie.
                </p>
              </div>
              <div className="flex flex-col gap-4 md:items-end">
                <Link
                  href="/tarifs"
                  className="inline-flex w-full justify-center rounded-lg border-2 border-[#1d4ed8] bg-white px-8 py-4 font-semibold text-black shadow-md transition-all hover:bg-[#f8f9fb] md:w-auto"
                  {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_TARIFS, "home-final-cta")}
                >
                  Consulter les forfaits
                </Link>
                <CalendlyBookingLink
                  trackLocation="home-final-cta"
                  className="inline-flex w-full justify-center rounded-lg bg-[#1d4ed8] px-8 py-4 font-semibold text-white shadow-md transition-all hover:bg-[#1e40af] md:w-auto"
                >
                  Échanger sur votre besoin
                </CalendlyBookingLink>
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