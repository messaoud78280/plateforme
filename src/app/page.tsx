import type { Metadata } from "next";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { HomeProblemSection } from "@/components/HomeProblemSection";
import { HomeHowItWorksDetailSection } from "@/components/HomeHowItWorksDetailSection";
import { HomeWhatWeHandleSection } from "@/components/HomeWhatWeHandleSection";
import { HomeCredibilitySection } from "@/components/HomeCredibilitySection";
import { ExpertiseTableSection } from "@/components/ExpertiseTableSection";
import { HomeCallCtaBanner } from "@/components/HomeCallCtaBanner";
import { HomePricingSection } from "@/components/HomePricingSection";
import { HomeSolutionSection } from "@/components/HomeSolutionSection";
import { HomeSectorExamplesSection } from "@/components/HomeSectorExamplesSection";
import { HeroPresentationVideo } from "@/components/HeroPresentationVideo";
import { ConciergerieDirigeantSection } from "@/components/ConciergerieDirigeantSection";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import {
  formatPriceLabelFr,
  getAggregateOfferDescription,
  getPublicPriceBoundsLabels,
} from "@/lib/subscription-plans";
import {
  SEO_VALUE_PROPOSITION,
  SEO_VALUE_PROPOSITION_SHORT,
  SEO_KEYWORDS_HOME,
} from "@/lib/seo-keywords";
import { EXTERNALISATION_ADMIN_BT_NAV } from "@/lib/externalisation-administrative-btp-geo";
import { SITE_URL, absoluteUrl } from "@/lib/site";

/** Vidéo hero — même fichier que `HeroPresentationVideo` ; durée ~13 s (fichier court présentation). */
const PRESENTATION_VIDEO_MP4 = "/video/presentation.mp4";
const PRESENTATION_VIDEO_DURATION_ISO = "PT13S";

const PRICE_BOUNDS = getPublicPriceBoundsLabels();

const HOME_FAQ_ITEMS = [
  {
    q: "En quoi BeWork est-il un partenaire administratif externalisé ?",
    a: "BeWork est un prestataire administratif externalisé : vous confiez devis, relances, dossiers et coordination dans un cadre forfaitaire, sans embauche. Une équipe encadrée en France exécute et vous gardez la main sur les décisions sensibles.",
  },
  {
    q: "Pourquoi externaliser plutôt que recruter ?",
    a: "Un salarié engage salaire, charges, formation et management pour une charge qui n’est pas toujours constante. Un forfait BeWork fixe un niveau d’accompagnement et un cadre : pas de structure RH à alourdir pour tenir le même niveau d’organisation.",
  },
  {
    q: "Comment se passe le quotidien ?",
    a: "Vous déposez vos demandes sur la plateforme (devis, factures, situations de travaux, démarches, logistique, relances, dossiers sensibles sous validation). L’équipe exécute dans le forfait ; vous suivez statuts et échanges. Démarrage après votre rendez-vous découverte et accès outils.",
  },
  {
    q: "Qui exécute les missions ?",
    a: "Des profils francophones diplômés Bac+5, encadrés par l’agence en région parisienne. Pilotage depuis la France ; exigence alignée sur ce qu’attendent les entreprises du bâtiment en termes de délais et de relecture.",
  },
  {
    q: "Quel est le délai de traitement ?",
    a: "Réponse moyenne en moins de deux heures ouvrées. Les urgences liées au chantier sont priorisées dans le cadre de votre offre. Le délai détaillé dépend de la mission ; la coordination reste assurée par l’équipe en France.",
  },
  {
    q: "BeWork peut-il accompagner conducteurs de travaux et artisans hors de France métropolitaine ?",
    a: "Oui lorsque votre activité correspond à une clientèle francophone : Belgique, Suisse ou Luxembourg peuvent être couverts selon le cadre précis au rendez-vous découverte (outils, horaires et format des demandes). L’interface et le soutien sont en français.",
  },
  {
    q: "Un conducteur de travaux sans assistant interne peut-il « brancher » BeWork sur ses chantiers ?",
    a: "Oui : vous centralisez devis, relances, dossiers administratifs (situations de travaux, DICT ou avancement fournisseur) sous forme de demandes suivies jusqu’à clôture. Les envois juridiquement sensibles restent soumis à votre validation.",
  },
  {
    q: "Sécurité, confidentialité et validation : comment ça marche ?",
    a: "Chaque mission sensible reste sous votre contrôle : relance ferme, mise en demeure, envoi à un client, dépôt d’appel d’offres ou transmission MOE/MOA passent par votre validation avant envoi. Les échanges sont tracés, les documents restent confidentiels, et les données sont hébergées dans un cadre conforme RGPD.",
  },
] as const;

const RESSOURCES_BLOG = [
  {
    title: "Retenue de garantie BTP : suivi, échéances, pièces",
    desc: "Retenue de garantie, tableau de suivi, relances cadrées et liens facturation pour sous-traitants et donneurs d’ordre.",
    href: "/blog/retenue-garantie-btp-sous-traitance",
  },
  {
    title: "Devis BTP : 7 leviers pour structurer l’offre",
    desc: "Découpage, acomptes, validité, preuves : réduire les allers-retour et améliorer le taux de signature.",
    href: "/blog/devis-btp-structuration-conversion",
  },
  {
    title: "DPGF et budget de chantier : lire, suivre l’écart",
    desc: "Avenants, marge, trésorerie : garder le même chiffre entre technique et exécution comptable.",
    href: "/blog/dpgf-budget-chantier-ecart",
  },
  {
    title: "Facturation chantier et relances : trésorerie BTP",
    desc: "Acomptes, situations de travaux et relances pour limiter les impayés sur vos chantiers.",
    href: "/blog/facturation-chantier-btp-relances-tresorerie",
  },
  {
    title: "Situation de travaux : obligations et calendrier",
    desc: "Clarifier le cadre, la fréquence et le lien avec votre facturation.",
    href: "/blog/situation-travaux-btp-obligations-conseils",
  },
  {
    title: "DICT & déclarations : préparer le dossier sans perdre de temps",
    desc: "Pièces, délais, relances et classement : ce qui se délègue pendant que vous restez sur le chantier.",
    href: "/blog/dict-et-declarations-de-travaux",
  },
  {
    title: "10 tâches administratives à déléguer en BTP",
    desc: "Ce qui grève le quotidien des chefs d’entreprise du bâtiment — et comment le structurer autrement.",
    href: "/blog/10-taches-administratives-deleguer-dirigeant",
  },
  {
    title: "Combien coûte un administratif externalisé ?",
    desc: "Comparatif forfait externalisé vs embauche : coûts cachés, charges sociales et charge RH pour les PME.",
    href: "/blog/combien-coute-assistant-administratif",
  },
  {
    title: "Relancer un devis : méthode pour signer plus de chantiers",
    desc: "J+2, J+7, J+14 : un suivi simple, traçable, sans harceler.",
    href: "/blog/relance-devis-btp-augmenter-signatures",
  },
  {
    title: "Bureau & chantier : structurer sans recruter",
    desc: "Prioriser l’important bureau (devis, relances, dossiers) sans sacrifier le terrain.",
    href: "/blog/bureau-chantier-administratif-btp-sans-recruter",
  },
];

export const metadata: Metadata = {
  title: "BeWork | Administratif externalisé BTP · artisans & conducteurs de travaux",
  description: `${SEO_VALUE_PROPOSITION} Vidéo d’introduction. Forfaits TTC dès ${formatPriceLabelFr(PRICE_BOUNDS.low)} €/mois.`,
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
    url: SITE_URL,
    siteName: "BeWork",
    title: "BeWork — Administratif externalisé BTP pour artisans et conducteurs de travaux",
    description: `${SEO_VALUE_PROPOSITION_SHORT} Vidéo présentée sur cette page.`,
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "BeWork — Partenaire administratif externalisé pour artisans et entreprises du bâtiment",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BeWork — Administratif externalisé BTP (conducteurs travaux & artisans)",
    description: `${SEO_VALUE_PROPOSITION_SHORT} Vidéo. Forfaits TTC.`,
  },
};

const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/#accueil`,
      url: SITE_URL,
      name: "BeWork — Administratif externalisé pour artisans et conducteurs de travaux (BTP)",
      inLanguage: "fr-FR",
      description: `${SEO_VALUE_PROPOSITION} Démo vidéo, forfaits TTC, sans embauche.`,
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
      name: "Partenaire administratif externalisé — organisation et pilotage pour le BTP",
      description:
        "Prestataire administratif externalisé : relais cadré — devis, facturation, situations de travaux, suivi client ; démarches chantier ; logistique fournisseurs et moyens ; relances et dossiers sensibles sous validation. France, Belgique, Suisse, Luxembourg.",
      serviceType: "Partenaire administratif externalisé",
      category: "Services administratifs pour le bâtiment",
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: [
        { "@type": "Country", name: "France" },
        { "@type": "Country", name: "Belgique" },
        { "@type": "Country", name: "Suisse" },
        { "@type": "Country", name: "Luxembourg" },
      ],
      audience: {
        "@type": "BusinessAudience",
        audienceType:
          "Conducteurs de travaux, artisans, sous-traitants, dirigeants de TPE/PME et entreprises générales du bâtiment (France, Belgique, Suisse, Luxembourg)",
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
      name: "Présentation BeWork — partenaire administratif externalisé pour le BTP",
      description:
        "Vidéo de présentation BeWork — administratif externalisé pour conducteurs de travaux, artisans et dirigeants BTP : dossiers chantier, devis et relances, sans recruter (France · Belgique · Suisse · Luxembourg).",
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
    <div className="min-h-screen bg-gradient-to-b from-white via-[#f8fafc] to-[#f1f5f9]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />
      <MarketingSiteHeader plainBg />

      <main className="pt-0">
        {/* Hero → Problème → Solution → Comment ça marche : un seul fond (dégradé + métallique continu) */}
        <div className="relative overflow-hidden bg-gradient-to-b from-white via-[#fdfefe] to-[#F8FAFC]">
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
          <div className="relative z-10">
            {/* Hero compact premium — 1200px, grille 55/45 */}
            <section
              id="hero"
              className="relative overflow-visible bg-transparent pb-20 pt-0 lg:pt-1"
              style={{ scrollMarginTop: "6rem" }}
            >
              <div className="container-site relative z-[1]">
            <div className="grid items-center gap-8 text-center lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-x-[4.75rem] lg:gap-y-0 lg:text-left">
              <div className="mx-auto flex w-full min-w-0 max-w-[580px] flex-col gap-6 lg:mx-0 lg:max-w-none lg:gap-5 lg:pt-24">
                <p className="mx-auto inline-flex max-w-full items-center gap-2 self-center rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3.5 py-1.5 text-[12.5px] font-medium leading-snug text-[#2563eb] sm:gap-2.5 sm:px-4 sm:text-sm lg:mx-0 lg:self-start">
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
                  <span>Assistant BTP externalisé · Renfort administratif chantier · Augmenté par l’IA</span>
                </p>

                <h1
                  className="text-balance text-[clamp(2.125rem,calc(0.45rem+4.35vw),4.25rem)] font-sans leading-[1.05] tracking-[-0.02em]"
                  style={{ fontFamily: "var(--font-inter), var(--font-geist-sans), system-ui, sans-serif" }}
                >
                  <span className="block font-bold text-[#0F172A]">On tient le bureau,</span>
                  <span className="mt-[0.125em] flex w-full min-w-0 flex-nowrap items-baseline justify-between gap-2 font-extrabold text-[#3072F0]">
                    <span className="shrink-0 whitespace-nowrap">vous tenez</span>
                    <span className="shrink-0 whitespace-nowrap">le chantier.</span>
                  </span>
                </h1>

                <p className="mx-auto max-w-[580px] text-lg leading-[1.62] text-balance text-slate-700 lg:mx-0 lg:max-w-none lg:text-[20px] lg:leading-snug">
                  Devis, relances, facturation, DICT, commandes matériel, dossiers chantier et urgences du quotidien&nbsp;: BeWork prend le relais
                  pendant que vous restez concentré sur{" "}
                  <span className="font-semibold text-[#3072F0]">le&nbsp;terrain.</span>
                </p>

                <div className="mx-auto -mt-1 flex w-full max-w-[580px] flex-wrap justify-center gap-2 lg:mx-0 lg:max-w-none lg:justify-start">
                  {["DICT", "Commandes matériel", "Engins & locations", "RDV client", "Relances urgentes"].map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[12px] font-semibold text-slate-700 shadow-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mx-auto mt-1 flex w-full max-w-[580px] flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:mx-0 lg:max-w-full lg:justify-start">
                  <Link
                    href="/contact"
                    className="inline-flex min-h-[3rem] shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1d4ed8] px-8 py-3.5 text-base font-semibold text-white shadow-md shadow-[#1d4ed8]/22 transition-colors hover:bg-[#1e40af]"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 opacity-95" aria-hidden>
                      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <path d="M15 3v4M9 3v4M4 13h17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Réserver un appel
                  </Link>
                  <Link
                    href="#comment-ca-marche"
                    className="inline-flex min-h-[3rem] shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-8 py-3.5 text-base font-semibold tracking-tight text-slate-900 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-slate-700" aria-hidden>
                      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M10 9.5 L15.5 12 10 14.8V9.5Z" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
                    </svg>
                    Voir comment ça marche
                  </Link>
                </div>

                <ul
                  className="mx-auto mt-5 flex max-w-[580px] flex-col divide-y divide-slate-200/90 sm:mx-auto sm:mt-4 sm:w-full sm:max-w-none sm:flex-row sm:items-center sm:divide-x sm:divide-y-0 sm:divide-slate-200 lg:mx-0 lg:justify-start"
                  aria-label="Engagements"
                >
                  <li className="flex flex-1 items-center gap-3 py-4 sm:py-3 sm:first:pr-6 sm:last:pl-6 sm:last:pr-0 sm:[&:nth-child(2)]:px-6">
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
                  <li className="flex flex-1 items-center gap-3 py-4 sm:py-3 sm:first:pr-6 sm:last:pl-6 sm:last:pr-0 sm:[&:nth-child(2)]:px-6">
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
                  <li className="flex flex-1 items-center gap-3 py-4 sm:py-3 sm:first:pr-6 sm:last:pl-6 sm:last:pr-0 sm:[&:nth-child(2)]:px-6">
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

              <div className="relative flex w-full min-w-0 shrink-0 justify-center lg:justify-center lg:self-start">
                <HeroPresentationVideo />
              </div>
            </div>
              </div>
            </section>

            {/* Mini-bloc : définition d’un Beworker (sans dupliquer « Comment ça marche ») */}
            <section className="relative bg-transparent px-6 pb-10 md:pb-12">
              <div className="container-site">
                <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_10px_40px_-16px_rgba(15,23,42,0.1)] ring-1 ring-slate-100/85 md:p-8">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#1d4ed8] md:text-[12px]">
                    C’est quoi un Beworker ?
                  </p>
                  <p className="mt-3 text-[15px] leading-relaxed text-slate-700 md:text-base">
                    Un Beworker, c’est un assistant BTP dédié, formé aux outils du secteur et augmenté par l’IA. Il traite vos demandes, prépare vos
                    livrables, suit vos dossiers et reste encadré par BeWork. Ce n’est pas un chatbot&nbsp;: c’est un relais humain, structuré,
                    joignable et supervisé.
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
            <ExpertiseTableSection />
            <HomeCallCtaBanner />

            {/* Lien pilier tâches — dans le bloc hero pour que la courbe métallique suive jusqu’ici */}
            <section className="relative overflow-hidden px-6 pb-12 pt-8 md:pb-14 md:pt-10">
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
                    prendre en main pour vous.
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

        {/* Ressources */}
        <section id="ressources" className="px-6 py-24 md:py-28">
          <div className="mx-auto max-w-site">
            <div className="mb-16 max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-black md:text-4xl">
                Ressources & bonnes pratiques
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-black">
                Guides et retours d&apos;expérience pour structurer votre administratif, sécuriser votre trésorerie et
                professionnaliser votre relation client.
              </p>
            </div>

            <div className="mb-12 rounded-2xl border border-[#1d4ed8]/25 bg-[#eff6ff]/40 p-8 md:p-10">
              <h3 className="text-xl font-bold tracking-tight text-black md:text-2xl">
                Externalisation administrative BTP — Europe francophone
              </h3>
              <p className="mt-4 max-w-3xl text-black leading-relaxed">
                Parcours SEO par pays (contenus distincts)&nbsp;: France, Belgique, Suisse romande et Luxembourg. Commencez par la vue
                d&apos;ensemble, puis ouvrez la page qui correspond à votre marché.
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

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 md:items-stretch md:gap-10">
              {RESSOURCES_BLOG.map((r) => (
                <div
                  key={r.title}
                  className="card-frame flex h-full flex-col rounded-xl p-8"
                >
                  <p className="text-lg font-semibold text-black">{r.title}</p>
                  <p className="mt-4 flex-1 text-black leading-relaxed">{r.desc}</p>
                  <Link
                    href={r.href}
                    className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[#1d4ed8] transition-colors hover:text-[#1e40af]"
                  >
                    Lire l’article
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              ))}
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
                >
                  Consulter les forfaits
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex w-full justify-center rounded-lg bg-[#1d4ed8] px-8 py-4 font-semibold text-white shadow-md transition-all hover:bg-[#1e40af] md:w-auto"
                >
                  Échanger sur votre besoin
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#c8cdd6] bg-[#f8f9fb] px-6 py-12">
        <div className="mx-auto flex max-w-site flex-col gap-6 text-sm text-black md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <BeWorkLogo size="sm" />
              <span className="text-black">© {new Date().getFullYear()} BeWork</span>
            </div>
            <span className="text-black">
              Société française — Agence Île-de-France (Laure Olivie) — Pilotage opérationnel supervisé depuis la France
            </span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link className="font-medium transition-colors hover:text-black" href="/inscription">
              Espace client
            </Link>
            <Link className="font-medium transition-colors hover:text-black" href="/inscription">
              Créer un compte
            </Link>
            <Link className="font-medium transition-colors hover:text-black" href="/connexion">
              Connexion
            </Link>
            <Link className="font-medium transition-colors hover:text-black" href="/faq">
              FAQ
            </Link>
            <Link className="font-medium transition-colors hover:text-black" href="/notre-facon-de-travailler">
              Notre façon de travailler
            </Link>
            <Link className="font-medium transition-colors hover:text-black" href="/tarifs">
              Tarifs pilotage administratif
            </Link>
            <Link className="font-medium transition-colors hover:text-black" href="/communication-digitale">
              Tarifs communication
            </Link>
            <Link className="font-medium transition-colors hover:text-black" href="/blog">
              Blog
            </Link>
            <Link className="font-medium transition-colors hover:text-black" href="/externalisation-administrative-btp-europe">
              Europe francophone — admin BTP
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}