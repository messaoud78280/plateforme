import type { Metadata } from "next";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { HomePageNavStrip } from "@/components/layout/HomePageNavStrip";
import { HeroPresentationVideo } from "@/components/HeroPresentationVideo";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { TARIFS_PLANS } from "@/lib/tarifs-plans";
import { SEO_KEYWORDS_BTP_PME, SEO_KEYWORDS_PARTENAIRE_CORE, SEO_VALUE_PROPOSITION } from "@/lib/seo-keywords";
import { SITE_URL, absoluteUrl } from "@/lib/site";

/** Vidéo hero — même fichier que `HeroPresentationVideo` ; durée ~13 s (fichier court présentation). */
const PRESENTATION_VIDEO_MP4 = "/video/presentation.mp4";
const PRESENTATION_VIDEO_DURATION_ISO = "PT13S";

const SUIVI_PLAN = TARIFS_PLANS.find((p) => p.planKey === "STANDARD")!;
const ACTION_MINUTES = 12;
const ACTIONS_PER_HOUR = 60 / ACTION_MINUTES; // 5

function formatPriceTtc(value: string) {
  const n = parseInt(value.replace(/\s/g, ""), 10);
  if (Number.isNaN(n)) return value;
  return n.toLocaleString("fr-FR");
}

function getPlanVolume(planKey: (typeof TARIFS_PLANS)[number]["planKey"]) {
  // Volumes affichés (1 crédit = 12 min) : Structure=20h/100, Suivi=37h/185, Pilotage=100h/500
  const hoursMap: Record<(typeof TARIFS_PLANS)[number]["planKey"], number> = {
    DECOUVERTE: 20,
    STANDARD: 37,
    PREMIUM: 100,
  };
  const hoursApprox = hoursMap[planKey];
  const actionsApprox = Math.round(hoursApprox * ACTIONS_PER_HOUR);
  return { hoursApprox, actionsApprox };
}

const TARIFS_PROGRESSION_ROWS = [
  {
    planKey: "DECOUVERTE" as const,
    sub: "Charge adaptée, administratif de base structuré",
    subClass: "text-black",
  },
  {
    planKey: "STANDARD" as const,
    sub: "Suivi structuré — le plus adapté",
    subClass: "text-[#1d4ed8]",
  },
  {
    planKey: "PREMIUM" as const,
    sub: "Capacité maximale, organisation globale",
    subClass: "text-black",
  },
];

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
] as const;

const RESSOURCES_BLOG = [
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
  title: "BeWork | Partenaire administratif externalisé BTP & PME",
  description: `${SEO_VALUE_PROPOSITION} Vidéo sur l’accueil. Forfaits TTC dès 290 €/mois. France, Belgique, Suisse, Luxembourg.`,
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  keywords: [
    ...SEO_KEYWORDS_PARTENAIRE_CORE,
    ...SEO_KEYWORDS_BTP_PME,
    "agence pilotage administratif BTP",
    "secrétariat entreprise bâtiment",
    "situation de travaux administrative",
    "relances clients BTP",
    "sous-traitance administrative construction",
    "BeWork BTP",
    "DICT déclaration travaux",
    "logistique chantier BTP",
    "location engin chantier",
    "administratif intelligence artificielle",
    "IA productivité PME BTP",
    "bureau et chantier BTP",
    "pilotage administratif encadré",
    "vidéo présentation BeWork",
    "présentation agence administrative BTP",
  ],
  alternates: { canonical: SITE_URL, languages: { fr: SITE_URL, "x-default": SITE_URL } },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: "BeWork",
    title: "BeWork — Partenaire administratif externalisé BTP & PME",
    description:
      "Partenaire administratif externalisé : découvrez BeWork en vidéo — pilotage administratif encadré pour artisans et PME du bâtiment, sans embauche. France, Belgique, Suisse, Luxembourg.",
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
    title: "BeWork — Partenaire administratif externalisé BTP",
    description:
      "Vidéo + partenaire administratif externalisé : pilotage administratif BTP — devis, relances, dossiers. Forfaits TTC, cadre défini.",
  },
};

const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/#accueil`,
      url: SITE_URL,
      name: "BeWork — Partenaire administratif externalisé pour entreprises du BTP et PME",
      inLanguage: "fr-FR",
      description:
        "Partenaire administratif externalisé : pilotage administratif BTP — devis, facturation, relances, dossiers chantier et démarches, dans un cadre défini. Vidéo sur la page. Forfaits TTC, sans recruter.",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      video: { "@id": `${SITE_URL}/#video-presentation-bework` },
      about: [
        { "@type": "Thing", name: "Bâtiment et travaux publics" },
        { "@type": "Thing", name: "Artisanat du bâtiment" },
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
        audienceType: "Artisans, TPE, PME et entrepreneurs du bâtiment",
      },
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "EUR",
        lowPrice: "290",
        highPrice: "1190",
        offerCount: "3",
        description:
          "Trois forfaits TTC mensuels BTP : Structure, Suivi (490 € TTC/mois — le plus adapté pour une activité régulière), Pilotage.",
      },
    },
    {
      "@type": "VideoObject",
      "@id": `${SITE_URL}/#video-presentation-bework`,
      name: "Présentation BeWork — partenaire administratif externalisé pour le BTP",
      description:
        "Présentation courte de BeWork en tant que partenaire administratif externalisé : structuration de l’administratif des entreprises du bâtiment — devis, relances, dossiers chantier, sans recruter.",
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
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] via-[#eef0f4] to-[#e0e4ea]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />
      <MarketingSiteHeader
        plainBg
        centerSlot={
          <h1 className="inline-block max-w-[min(100vw-2rem,52rem)] text-balance">
            <span className="inline-block rounded-xl border border-slate-200/90 bg-[#e6edf6] px-4 py-2.5 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_4px_14px_rgba(15,23,42,0.04)] sm:px-5 sm:py-2.5">
              <span
                className="block font-semibold leading-snug tracking-[-0.02em] text-[clamp(0.9375rem,2vw,1.375rem)] antialiased md:inline md:whitespace-nowrap md:leading-tight"
                style={{ fontFamily: "var(--font-manrope), var(--font-geist-sans), system-ui, sans-serif" }}
              >
                <span className="text-slate-900">On tient le bureau,</span>{" "}
                <span className="bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] bg-clip-text text-transparent">
                  vous tenez le chantier.
                </span>
              </span>
            </span>
          </h1>
        }
        bottom={<HomePageNavStrip />}
      />

      <main className="pt-0">
        {/* Hero + comment ça fonctionne (4 étapes) */}
        <section id="hero" className="px-6 py-20 md:py-24 lg:py-28" style={{ scrollMarginTop: "6rem" }}>
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-10 xl:gap-14">
              {/* Colonne principale : message + CTA (~60 %) */}
              <div className="flex min-w-0 flex-col gap-6 text-center md:gap-7 md:text-left lg:order-2 lg:col-span-7">
                <HeroPresentationVideo />
                <p className="mx-auto max-w-2xl text-sm font-medium leading-relaxed text-slate-700 md:mx-0 md:text-base">
                  Partenaire administratif externalisé pour artisans et PME du bâtiment — France, Belgique, Suisse,
                  Luxembourg.
                </p>
                <div
                  className="mx-auto max-w-2xl rounded-xl border border-[#93c5fd]/45 bg-gradient-to-br from-white via-[#f8fafc] to-[#eff6ff]/90 px-5 py-5 text-center shadow-[0_4px_20px_rgba(29,78,216,0.07),inset_0_1px_0_rgba(255,255,255,0.9)] md:mx-0 md:px-6 md:py-5 md:text-left lg:max-w-none"
                >
                  <p className="font-sans text-lg font-semibold leading-snug tracking-tight text-black md:text-xl md:leading-snug lg:text-2xl lg:leading-snug">
                    Devis, relances, dossiers chantier, DICT, fournisseurs : on gère votre administratif BTP au quotidien.
                  </p>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-black md:text-base">
                    Vous envoyez vos demandes, on exécute, vous validez le sensible, vous suivez tout sur une plateforme simple.
                  </p>
                </div>
                <div className="mx-auto max-w-2xl rounded-2xl bg-gradient-to-br from-[#c8d0dc] via-white/90 to-[#a8b4c8] p-[1px] shadow-[0_10px_30px_rgba(15,23,42,0.08)] md:mx-0">
                  <div className="surface-metallic-light surface-metallic-light--soft rounded-2xl px-5 py-5 text-center md:px-6 md:py-5 md:text-left">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-black">Pilotage administratif</p>
                    <p className="mt-2 font-sans text-lg font-semibold leading-snug tracking-tight text-black md:text-xl md:leading-snug">
                      BeWork structure votre{" "}
                      <strong className="font-semibold text-black">administratif et votre coordination</strong> : devis et
                      relances qui avancent, dossiers suivis, échanges cadrés. Vous restez sur l&apos;ouvrage ; nous tenons le
                      dossier.
                    </p>
                  </div>
                </div>
                <div className="mx-auto max-w-2xl rounded-xl border border-[#bfdbfe]/80 bg-gradient-to-br from-[#eff6ff]/95 to-white/90 px-5 py-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_10px_24px_rgba(15,23,42,0.06)] md:mx-0 md:px-6 md:py-4 md:text-left">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1d4ed8]">IA assistée</p>
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-black md:text-base">
                    Nos agents sont <span className="font-extrabold">assistés par l’IA</span> pour accélérer préparation et
                    contrôles — <span className="font-extrabold">toujours relus et validés</span> par l’équipe.
                  </p>
                </div>
                <div className="mx-auto max-w-2xl space-y-6 text-left md:mx-0">
                  <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
                    <div className="rounded-xl border border-[#dce3ec]/80 bg-white/60 p-4 shadow-sm backdrop-blur-sm">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#1d4ed8]">
                        Au bureau
                      </p>
                      <ul className="space-y-2.5 text-base leading-snug text-black md:text-[1.05rem]">
                        <li className="flex gap-2.5">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d4ed8]" aria-hidden />
                          <span>Devis, facturation, situations de travaux</span>
                        </li>
                        <li className="flex gap-2.5">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d4ed8]" aria-hidden />
                          <span>Suivi client, mails et structuration de l&apos;activité</span>
                        </li>
                      </ul>
                    </div>
                    <div className="rounded-xl border border-[#dce3ec]/80 bg-white/60 p-4 shadow-sm backdrop-blur-sm">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#1d4ed8]">
                        Chantier &amp; logistique
                      </p>
                      <ul className="space-y-2.5 text-base leading-snug text-black md:text-[1.05rem]">
                        <li className="flex gap-2.5">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d4ed8]" aria-hidden />
                          <span>
                            Démarches : DICT, déclarations, autorisations, suivi des dossiers
                          </span>
                        </li>
                        <li className="flex gap-2.5">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d4ed8]" aria-hidden />
                          <span>Fournisseurs, livraisons, locations matériel / engins / véhicules</span>
                        </li>
                        <li className="flex gap-2.5">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d4ed8]" aria-hidden />
                          <span>Planning et coordination</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <p className="text-base leading-relaxed text-black md:text-lg">
                    Sur les sujets sensibles (relances fermes, mises en demeure, litiges), nous assurons le{" "}
                    <strong className="font-semibold text-black">suivi administratif</strong> sous votre validation.
                  </p>
                  <p className="text-base leading-relaxed text-black md:text-lg">
                    <strong className="font-semibold text-black">Vingt ans sur le terrain du BTP</strong>,{" "}
                    <strong className="font-semibold text-black">en tant que dirigeante d&apos;entreprise en Île-de-France</strong>{" "}
                    : on ne découvre pas vos contraintes au fil des mails — on les lit dès le brief. Sans embauche, avec un
                    cadre contractuel clair.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <Link
                    href="/contact"
                    className="inline-flex rounded-lg bg-[#1d4ed8] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[#1d4ed8]/25 transition-all hover:bg-[#1e40af] hover:shadow-xl hover:shadow-[#1d4ed8]/30"
                    aria-label="Demander un rendez-vous découverte adapté à votre besoin"
                  >
                    <span className="sm:hidden">Rendez-vous découverte</span>
                    <span className="hidden sm:inline">Demander un rendez-vous découverte</span>
                  </Link>
                  <Link
                    href="/tarifs"
                    className="inline-flex rounded-lg border-2 border-[#1d4ed8] bg-white px-8 py-4 text-base font-semibold text-[#1d4ed8] shadow-sm transition-all hover:bg-[#f8fafc]"
                    aria-label="Consulter les forfaits"
                  >
                    Consulter les forfaits
                  </Link>
                </div>
                <p className="text-sm text-black">
                  TTC mensuel • Sans recrutement • Encadrement en France
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm text-black">
                  <Link href="/inscription" className="font-medium hover:text-black hover:underline">
                    Ouvrir un compte client
                  </Link>
                  <Link href="/connexion" className="font-medium hover:text-black">
                    Connexion
                  </Link>
                </div>
              </div>
              {/* Colonne latérale : visuellement parcours au-dessus, tarif Suivi en dessous (flex-col-reverse + ordre DOM tarif puis parcours) */}
              <div className="mx-auto flex w-full max-w-md flex-col-reverse gap-4 lg:order-1 lg:col-span-5 lg:mx-0 lg:max-w-none lg:self-start lg:sticky lg:top-24">
                <Link
                  href="/tarifs"
                  className="group surface-metallic-blue flex w-full flex-col gap-3 rounded-2xl px-6 py-6 text-left shadow-md shadow-slate-900/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d4ed8]/50"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1d4ed8]">
                    Le plus adapté — Suivi
                  </span>
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                    <span className="text-4xl font-bold tracking-tight text-black tabular-nums md:text-[2.75rem]">
                      490
                    </span>
                    <span className="text-xl font-semibold text-black">€</span>
                    <span className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-black">TTC</span>
                    <span className="text-lg font-semibold text-black">/ mois</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px] font-semibold text-black" aria-label="Temps inclus estimé et crédits">
                    <span className="rounded-full border border-black/15 bg-white/80 px-3 py-1">~37h incluses</span>
                    <span className="rounded-full border border-black/15 bg-white/80 px-3 py-1">≈ 185 crédits</span>
                  </div>
                  <div className="mt-1 border-b border-black/10 pb-3" aria-label="Repère indicatif de charge">
                    <p className="text-[11px] leading-snug text-black md:text-xs md:leading-relaxed">
                      <span className="block font-normal">{SUIVI_PLAN.equivalentNote.line1}</span>
                      <span className="mt-0.5 block font-normal opacity-90">{SUIVI_PLAN.equivalentNote.line2}</span>
                    </p>
                    <p className="mt-1.5 text-[10px] leading-snug text-black">
                      Repère estimatif — pas une facturation à l&apos;heure.
                    </p>
                  </div>
                  <div className="space-y-2 text-sm leading-snug text-black">
                    <p className="font-medium">
                      Pour ne plus perdre d’opportunités : relances, suivi de devis, coordination au quotidien — dans un cadre
                      mensuel TTC clair.
                    </p>
                    <p className="text-xs">Trois niveaux : Structure à Pilotage (290 € à 1 190 € TTC / mois).</p>
                    <p className="pt-1">
                      Pas de poste à pourvoir : un cadre de prestation et un niveau d&apos;accompagnement défini chaque mois.
                    </p>
                    <p>
                      Vous achetez du suivi structuré et de l&apos;exécution encadrée — pas une promesse floue à la demande.
                    </p>
                  </div>
                  <p className="text-[11px] leading-relaxed text-black">
                    1 crédit = {ACTION_MINUTES} min · TTC, sans frais cachés · Sans engagement long terme · Mise en route rapide
                  </p>
                  <span className="text-xs font-semibold text-[#1d4ed8] group-hover:underline">
                    Voir les tarifs →
                  </span>
                </Link>
                <div
                  id="comment-ca-marche"
                  className="surface-metallic-light surface-metallic-light--soft rounded-2xl p-6 shadow-md shadow-slate-900/10 md:p-7"
                >
                  <div className="mb-6 md:mb-7">
                    <h2 className="max-w-[22rem] text-lg font-semibold leading-snug tracking-tight text-black md:max-w-none md:text-xl md:leading-tight">
                      Comment ça fonctionne concrètement
                    </h2>
                  </div>
                  <ol className="text-left">
                    {[
                      {
                        step: 1,
                        title: "Vous nous transmettez vos demandes",
                        detail: "devis, clients, fournisseurs…",
                      },
                      {
                        step: 2,
                        title: "On exécute rapidement avec méthode",
                        detail: "rédaction, relances, organisation",
                      },
                      {
                        step: 3,
                        title: "Vous validez uniquement l’essentiel",
                        detail: "zéro perte de temps",
                      },
                      {
                        step: 4,
                        title: "Votre activité devient plus fluide",
                        detail: "et vos opportunités mieux exploitées",
                      },
                    ].map((item, index) => (
                      <li
                        key={item.step}
                        className="relative flex gap-3.5 pb-6 last:pb-0 md:gap-4 md:pb-7 last:md:pb-0"
                      >
                        {index < 3 ? (
                          <span
                            className="absolute left-[15px] top-[2.125rem] bottom-0 w-px bg-gradient-to-b from-[#94a3b8]/55 to-transparent md:left-[17px] md:top-[2.25rem]"
                            aria-hidden
                          />
                        ) : null}
                        <span className="relative z-[1] mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/15 bg-white text-xs font-semibold tabular-nums text-black shadow-sm md:h-9 md:w-9 md:text-sm">
                          {item.step}
                        </span>
                        <div className="min-w-0 flex-1 pb-0.5">
                          <p className="text-[0.9375rem] font-semibold leading-snug text-black md:text-base md:leading-snug">
                            {item.title}
                          </p>
                          <p className="mt-1.5 text-[12px] leading-relaxed text-black md:text-[13px]">
                            {item.detail}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Deux propositions tarifaires distinctes */}
        <section id="tarifs" className="scroll-mt-24 px-6 py-16 md:py-20" style={{ scrollMarginTop: "6rem" }}>
          <div className="mx-auto max-w-6xl rounded-2xl surface-metallic-light surface-metallic-light--soft px-6 py-12 md:px-10 md:py-16">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-black md:text-3xl">
                Forfaits clairs pour le BTP
              </h2>
              <p className="mt-3 text-black">
                De la Structure (<span className="tarif-emphase text-[#1d4ed8]">290</span> € TTC / mois) au Pilotage : chaque
                palier fixe un niveau de structuration et de suivi — pas de surprise sur ce qui est tenu.
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold text-black">
                1 crédit = {ACTION_MINUTES} minutes{" "}
                <span className="font-normal text-black">(devis, relance, appel, mail, commande, coordination…)</span>
              </p>
              <div className="mt-10 flex justify-center">
                <Link
                  href="/tarifs"
                  className="group surface-metallic-blue flex w-full max-w-3xl flex-col gap-5 rounded-2xl p-6 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d4ed8]/50 md:grid md:grid-cols-2 md:items-start md:gap-6 md:p-8"
                >
                  <div>
                    <span className="text-sm font-medium text-black">Pilotage administratif</span>
                    <h3 className="mt-1 text-lg font-semibold text-black md:text-xl">
                      Forfaits BeWork
                    </h3>
                    <p className="mt-2 text-sm leading-snug text-black">
                      Même périmètre métier sur toutes les offres : administratif, chantier, logistique, moyens — avec un
                      niveau de suivi qui augmente à chaque palier.
                    </p>
                    <p className="mt-4 text-2xl font-bold tabular-nums text-black md:text-3xl">
                      <span className="tabular-nums">490</span> €{" "}
                      <span className="text-base font-semibold text-black">TTC</span>
                      <span className="text-base font-semibold text-black"> / mois</span>
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-black" aria-label="Volume inclus estimé">
                      <span className="rounded-full border border-black/15 bg-white/80 px-3 py-1">~37h incluses</span>
                      <span className="rounded-full border border-black/15 bg-white/80 px-3 py-1">≈ 185 crédits</span>
                    </div>
                    <div className="mt-2 border-b border-black/10 pb-3" aria-label="Repère indicatif de charge">
                      <p className="text-[11px] leading-snug text-black md:text-xs">
                        <span className="block font-normal">{SUIVI_PLAN.equivalentNote.line1}</span>
                        <span className="mt-0.5 block font-normal opacity-90">{SUIVI_PLAN.equivalentNote.line2}</span>
                      </p>
                      <p className="mt-1.5 text-[10px] leading-snug text-black">
                        Repère estimatif — pas une facturation à l&apos;heure.
                      </p>
                    </div>
                    <p className="mt-2 text-sm font-medium text-black">
                      Pour ne plus perdre d’opportunités : relances, suivi de devis, coordination au quotidien — dans un cadre mensuel TTC clair.
                    </p>
                    <p className="mt-3 text-xs leading-relaxed text-black">
                      TTC, sans frais cachés · Sans engagement long terme · Démarrage rapide
                    </p>
                    <span className="mt-3 inline-flex text-sm font-semibold text-[#1d4ed8] group-hover:underline">
                      Voir tous les tarifs →
                    </span>
                  </div>
                  <div className="rounded-xl border border-black/10 bg-white/60 p-4 md:p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1d4ed8]">
                      Progression des offres
                    </p>
                    <ul className="mt-3 space-y-0 text-sm text-black">
                      {TARIFS_PROGRESSION_ROWS.map((row, idx) => {
                        const plan = TARIFS_PLANS.find((p) => p.planKey === row.planKey)!;
                        const volume = getPlanVolume(plan.planKey);
                        const isLast = idx === TARIFS_PROGRESSION_ROWS.length - 1;
                        return (
                          <li
                            key={row.planKey}
                            className={`flex flex-col gap-0.5 border-b border-black/10 py-2.5 first:pt-0 ${isLast ? "border-b-0 pb-0" : ""}`}
                          >
                            <span className="font-semibold text-black">
                              {plan.name} — {formatPriceTtc(plan.price)} € TTC / mois
                            </span>
                            <span className="text-[11px] font-semibold text-black">
                              ~{volume.hoursApprox}h · ≈ {volume.actionsApprox} crédits
                            </span>
                            <span className={row.subClass}>{row.sub}</span>
                            <div className="mt-1.5" aria-label="Repère indicatif de charge">
                              <p className="text-[10px] leading-snug text-black md:text-[11px]">
                                <span className="block font-normal">{plan.equivalentNote.line1}</span>
                                <span className="mt-0.5 block font-normal opacity-90">
                                  {plan.equivalentNote.line2}
                                </span>
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    <p className="mt-2 text-[10px] leading-snug text-black">
                      Repère estimatif — pas une facturation à l&apos;heure.
                    </p>
                    <p className="mt-2 text-[11px] leading-snug text-black">
                      Précisions et forfaits sur la page tarifs.
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Pourquoi externaliser son administratif */}
        <section id="pourquoi-externaliser" className="scroll-mt-24 px-6 py-16 md:py-20" style={{ scrollMarginTop: "6rem" }}>
          <div className="mx-auto max-w-6xl rounded-2xl surface-metallic-light surface-metallic-light--soft px-6 py-12 md:px-10 md:py-16">
            <div className="mb-10 text-center md:mb-12">
              <h2 className="text-2xl font-bold tracking-tight text-black md:text-3xl">
                Sur le terrain, pas derrière l&apos;écran.
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-base font-semibold text-black md:text-lg">
                BeWork tient le bureau. Vous, le chantier.
              </p>
              {/* Schéma lecture 10 secondes */}
              <div
                className="mx-auto mt-8 max-w-3xl rounded-2xl border border-[#dce3ec] bg-white/90 p-4 shadow-sm md:p-6"
                role="img"
                aria-label="Schéma : votre chantier, notre suivi administratif"
              >
                <div className="grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr] md:gap-3">
                  <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4 text-left">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-black">Chez vous (souvent)</p>
                    <ul className="mt-3 space-y-2 text-sm font-bold leading-snug text-black">
                      <li className="flex gap-2">
                        <span className="text-[#94a3b8]" aria-hidden>
                          ▸
                        </span>
                        Devis &amp; relances qui traînent
                      </li>
                      <li className="flex gap-2">
                        <span className="text-[#94a3b8]" aria-hidden>
                          ▸
                        </span>
                        Fournisseurs / planning qui se télescopent
                      </li>
                      <li className="flex gap-2">
                        <span className="text-[#94a3b8]" aria-hidden>
                          ▸
                        </span>
                        Salarié absent ou en arrêt : ça retombe sur vous
                      </li>
                    </ul>
                  </div>
                  <div className="flex items-center justify-center py-1 md:flex-col md:py-0">
                    <span className="rounded-full bg-[#1d4ed8] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white shadow-md">
                      →
                    </span>
                  </div>
                  <div className="rounded-xl border border-[#bfdbfe] bg-[#eff6ff] p-4 text-left">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#1d4ed8]">Avec BeWork</p>
                    <ul className="mt-3 space-y-2 text-sm font-bold leading-snug text-black">
                      <li className="flex gap-2">
                        <span className="text-[#1d4ed8]" aria-hidden>
                          ✓
                        </span>
                        Dossiers suivis, coordination, logistique
                      </li>
                      <li className="flex gap-2">
                        <span className="text-[#1d4ed8]" aria-hidden>
                          ✓
                        </span>
                        Forfait TTC — pas d&apos;embauche
                      </li>
                      <li className="flex gap-2">
                        <span className="text-[#1d4ed8]" aria-hidden>
                          ✓
                        </span>
                        Sensible : vous validez avant envoi
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                "Une équipe + une plateforme — pilotage depuis la France.",
                "On parle BTP : urgences chantier = priorités, pas « mails en retard ».",
                "Vous montez ou baissez de forfait selon l&apos;activité.",
                "Cadre contractuel clair — pas du bricolage entre particuliers.",
              ].map((item, i) => (
                <li key={i} className="card-frame flex gap-3 rounded-xl p-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#eff6ff] text-xs font-bold text-[#1d4ed8]">
                    {i + 1}
                  </span>
                  <span className="text-left text-sm font-semibold leading-snug text-black">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ROI / Économies — comparatif (lecture rapide : chiffres puis « pourquoi ») */}
        <section id="roi" className="scroll-mt-24 px-6 py-16 md:py-20" style={{ scrollMarginTop: "6rem" }}>
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center md:mb-12">
              <h2 className="text-2xl font-bold tracking-tight text-black md:text-3xl">
                Même besoin : tenir l&apos;administratif. Autre façon de payer.
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-black md:text-lg">
                À gauche, ce qu&apos;un poste en interne coûte souvent au total chaque mois. À droite, un forfait TTC unique pour
                le cadre défini au contrat — sans salaire ni charges à votre charge sur ce périmètre.
              </p>
            </div>
            <div className="card-frame overflow-hidden rounded-2xl border-2 border-[#1d4ed8]/20">
              {/* Synthèse chiffres — compréhension immédiate */}
              <div className="grid divide-y divide-[#e2e8f0] bg-[#f8fafc] md:grid-cols-[1fr_auto_1fr] md:divide-x md:divide-y-0">
                <div className="px-6 py-6 text-center md:px-8 md:py-8 md:text-left">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black">Assistant en interne</p>
                  <p className="mt-2 text-3xl font-extrabold tabular-nums tracking-tight text-black md:text-4xl">~5 050 €</p>
                  <p className="mt-1 text-sm font-medium text-black">par mois, coût employeur réel (ordre de grandeur Europe)</p>
                </div>
                <div className="flex items-center justify-center bg-[#f1f5f9] px-4 py-3 md:bg-[#f8fafc] md:px-5 md:py-8">
                  <span
                    className="rounded-full border border-[#cbd5e1] bg-white px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-black shadow-sm"
                    aria-hidden
                  >
                    vs
                  </span>
                </div>
                <div className="bg-[#eff6ff]/60 px-6 py-6 text-center md:px-8 md:py-8 md:text-right">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1d4ed8]">Forfait BeWork</p>
                  <p className="mt-2 text-3xl font-extrabold tabular-nums tracking-tight text-[#1d4ed8] md:text-4xl">
                    <span className="tabular-nums">290</span> – <span className="tabular-nums">1 190</span> €
                  </p>
                  <p className="mt-1 text-sm font-medium text-black">
                    TTC / mois · une ligne sur votre budget · tout compris dans le cadre souscrit
                  </p>
                </div>
              </div>
              {/* Pourquoi ces montants — listes courtes */}
              <div className="grid divide-y divide-[#e2e8f0] md:grid-cols-2 md:divide-x md:divide-y-0">
                <div className="flex flex-col p-8 md:p-10">
                  <h3 className="text-base font-bold text-black md:text-lg">Pourquoi c&apos;est si élevé en interne ?</h3>
                  <p className="mt-2 text-sm text-black">Le salaire affiché n&apos;est qu&apos;une partie de la facture.</p>
                  <ul className="mt-4 space-y-2.5 text-[15px] font-medium leading-snug text-black">
                    <li className="flex gap-2.5">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#94a3b8]" aria-hidden />
                      <span>Salaire, charges patronales et avantages (mutuelle, tickets, etc.)</span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#94a3b8]" aria-hidden />
                      <span>Bureau, matériel, outils — et temps RH (recrutement, remplacement)</span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#94a3b8]" aria-hidden />
                      <span>
                        Aléas du poste : absences, arrêts maladie, congés, RTT, congés parentaux — l&apos;administratif
                        ralentit ou retombe sur vous jusqu&apos;à ce qu&apos;un remplaçant soit trouvé et formé
                      </span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#94a3b8]" aria-hidden />
                      <span>
                        Démission, licenciement ou temps partiel : trou de compétence, transfert de savoir, charge mentale et
                        coût caché pour la société
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="flex flex-col bg-[#eff6ff]/35 p-8 md:p-10">
                  <h3 className="text-base font-bold text-[#1d4ed8] md:text-lg">Ce que vous payez avec BeWork</h3>
                  <p className="mt-2 text-sm text-black">Un niveau de forfait = un cadre mensuel clair.</p>
                  <ul className="mt-4 space-y-2.5 text-[15px] font-medium leading-snug text-black">
                    <li className="flex gap-2.5">
                      <span className="text-[#1d4ed8]" aria-hidden>
                        ✓
                      </span>
                      <span>Un montant TTC / mois, sans embauche ni charges sociales sur ce forfait</span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="text-[#1d4ed8]" aria-hidden>
                        ✓
                      </span>
                      <span>
                        Pas de salarié administratif interne à votre charge : vous ne palliez pas les absences, arrêts maladie,
                        congés payés, RTT ou autres congés comme le ferait un employeur sur un poste dédié
                      </span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="text-[#1d4ed8]" aria-hidden>
                        ✓
                      </span>
                      <span>
                        Pas de recrutement de remplaçant ni d&apos;urgence « double casquette » quand quelqu&apos;un est absent
                        longtemps ou quitte l&apos;entreprise
                      </span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="text-[#1d4ed8]" aria-hidden>
                        ✓
                      </span>
                      <span>Plateforme, suivi et exécution encadrée — actes sensibles sous votre validation</span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="text-[#1d4ed8]" aria-hidden>
                        ✓
                      </span>
                      <span>
                        Repère fréquent : offre <strong className="font-semibold text-black">Suivi</strong> à{" "}
                        <span className="tabular-nums font-semibold text-black">490</span> € TTC / mois pour une activité
                        régulière
                      </span>
                    </li>
                  </ul>
                  <Link
                    href="/tarifs"
                    className="mt-6 inline-flex text-sm font-bold text-[#1d4ed8] hover:underline md:mt-auto md:pt-6"
                  >
                    Voir les offres et le détail des forfaits →
                  </Link>
                </div>
              </div>
              <p className="border-t border-[#e2e8f0] bg-[#f8fafc] px-6 py-3 text-center text-xs leading-relaxed text-black md:px-8">
                Comparaison à vocation pédagogique : le poste interne regroupe le coût réel d&apos;un salarié ; le forfait
                correspond au périmètre administratif défini avec BeWork (pas un clone poste pour poste du même volume horaire).
              </p>
            </div>
          </div>
        </section>

        {/* Une plateforme simple pour déléguer votre administratif */}
        <section
          id="plateforme"
          className="scroll-mt-24 px-6 py-20 md:py-28"
          style={{ scrollMarginTop: "6rem" }}
        >
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-2xl font-bold tracking-tight text-black md:text-3xl lg:text-4xl">
                Pilotage administratif, chantier et logistique au même endroit
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-black">
                De la relance client au suivi fournisseur, du planning à la démarche : consignes, échanges et statuts sur une
                seule interface — hiérarchisés comme sur le terrain. Nos équipes croisent{" "}
                <strong className="font-semibold text-black">lecture BTP</strong> et{" "}
                <strong className="font-semibold text-black">outils encadrés</strong> pour livrer vite et proprement, sans
                court-circuiter votre validation sur les sujets sensibles.
              </p>
            </div>

            {/* Démo dashboard — contenu réel */}
            <div className="mb-20 flex justify-center">
              <div className="w-full max-w-5xl overflow-hidden rounded-xl surface-metallic-light shadow-xl shadow-[#0f172a]/8">
                <div className="flex items-center gap-2 border-b border-[#e2e8f0] bg-[#f8fafc] px-5 py-3.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#94a3b8]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#94a3b8]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#94a3b8]" />
                  <span className="ml-2 text-sm font-medium text-black">Dashboard BeWork</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#e2e8f0] p-px">
                  {/* Colonne 1 : Nouvelle demande */}
                  <div className="surface-metallic-light p-5">
                    <h3 className="text-sm font-semibold text-black mb-3">Nouvelle demande</h3>
                    <div className="space-y-2.5">
                      {[
                        { title: "Finaliser devis gros œuvre + avenant MOA", cat: "Administratif & suivi client" },
                        { title: "Dossier DICT / DT — relance exploitants", cat: "Démarches chantier" },
                        { title: "Coordonner livraison grue + planning équipes", cat: "Logistique & coordination" },
                      ].map((d, i) => (
                        <div key={i} className="rounded-lg surface-metallic-light px-3 py-2.5 text-left shadow-sm hover:border-[#1d4ed8]/30 transition-colors">
                          <p className="text-sm font-medium text-black line-clamp-1">{d.title}</p>
                          <p className="mt-0.5 text-xs text-black">{d.cat}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Colonne 2 : Messagerie */}
                  <div className="surface-metallic-light p-5">
                    <h3 className="text-sm font-semibold text-black mb-3">Échanges</h3>
                    <div className="space-y-2.5">
                      {[
                        { from: "Équipe BeWork", msg: "Le devis est validé côté chiffrage, je vous l'envoie pour relecture.", time: "10:24" },
                        { from: "Vous", msg: "Parfait — ajoutez la mention garantie décennale sur la dernière page.", time: "09:52" },
                        { from: "Équipe BeWork", msg: "Reçu. Je mets à jour et je relance le client pour signature.", time: "Hier 16:30" },
                      ].map((m, i) => (
                        <div key={i} className="rounded-lg surface-metallic-light px-3 py-2.5 text-left shadow-sm">
                          <p className="text-xs font-medium text-[#1d4ed8]">{m.from}</p>
                          <p className="mt-0.5 text-xs text-black line-clamp-2">{m.msg}</p>
                          <p className="mt-1 text-[10px] text-[#94a3b8]">{m.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Colonne 3 : Mes demandes */}
                  <div className="surface-metallic-light p-5">
                    <h3 className="text-sm font-semibold text-black mb-3">Mes demandes</h3>
                    <div className="space-y-2.5">
                      {[
                        { title: "Commande fournisseur — créneau livraison", status: "En cours", color: "bg-blue-100 text-blue-800" },
                        { title: "Préparation courrier mise en demeure (brouillon)", status: "À valider", color: "bg-amber-100 text-amber-800" },
                        { title: "Location nacelle — confirmation prestataire", status: "Terminée", color: "bg-green-100 text-green-800" },
                      ].map((t, i) => (
                        <div key={i} className="rounded-lg surface-metallic-light px-3 py-2.5 text-left shadow-sm">
                          <p className="text-sm font-medium text-black">{t.title}</p>
                          <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${t.color}`}>
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fonctionnalités clés + IA */}
            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 md:items-stretch md:gap-8">
              {[
                {
                  title: "Créer une demande",
                  description:
                    "Administratif, réglementaire, logistique ou litige : une consigne, des pièces, une priorité — un dossier unique.",
                  icon: "M12 6v6m0 0v6m0-6h6m-6 0H6",
                },
                {
                  title: "Échanges avec votre équipe dédiée",
                  description:
                    "Validations devis, consignes chantier, arbitrages sur relances ou courriers sensibles : tout est daté et traçable.",
                  icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
                },
                {
                  title: "Suivi des missions",
                  description:
                    "Planning, fournisseurs, démarches, locations : vous voyez ce qui avance — sans multiplier les interlocuteurs.",
                  icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
                },
                {
                  title: "Exécution soutenue, jamais automatique",
                  description:
                    "Outils d’aide pour accélérer brouillons et contrôles — chaque livrable significatif repasse par une validation humaine et le cadre convenu avec vous.",
                  icon: "M13 10V3L4 14h7v7l9-11h-7z",
                },
              ].map((item, i) => (
                <div key={i} className="surface-metallic-light flex h-full flex-col rounded-xl p-6 text-left">
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#eff6ff] text-[#1d4ed8]">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-black">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-black">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Avantages / Aucun compromis sur la qualité */}
        <section id="avantages" className="px-6 pt-16 pb-24 md:pt-20 md:pb-28">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-black md:text-4xl">
                Même exigence sur le chantier et dans les dossiers
              </h2>
              <p className="mt-5 max-w-2xl mx-auto text-lg leading-relaxed text-black">
                Administratif, logistique, conformité et suivi des tensions client / fournisseur : une équipe structurée,
                francophone, outillée — pour des dossiers nets et une image à la hauteur de vos ouvrages.
              </p>
            </div>
            <ul className="grid gap-6 md:grid-cols-2 md:items-stretch lg:grid-cols-3">
              {[
                "Zéro recrutement, zéro investissement matériel : l'équipe est opérationnelle après onboarding cadré.",
                "Profils qualifiés, 100 % francophones, encadrés et alignés sur vos délais de chantier.",
                "Même fuseau qu’en France : pilotage opérationnel centralisé, réactivité quand le planning chantier ne pardonne pas.",
                "Bac+5 minimum, formation continue et process administratifs — rigueur sur les chiffres, les délais et les relances.",
                "Garantie satisfait ou remplacé : réaffectation rapide d'un profil si l'adéquation n'est pas au rendez-vous.",
                "Pilotage et direction opérationnelle en France : un interlocuteur à la hauteur de votre entreprise.",
              ].map((item, i) => (
                <li key={i} className="card-frame flex h-full gap-3 rounded-xl p-5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1d4ed8] text-white text-sm font-bold">
                    {i + 1}
                  </span>
                  <span className="text-black leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Lien pilier tâches */}
        <section className="px-6 py-8 md:py-10">
          <div className="mx-auto max-w-6xl">
            <div className="card-frame rounded-2xl border-2 border-[#e2e8f0] border-l-[4px] border-l-[#1d4ed8] p-6 text-center md:p-8">
              <p className="text-lg font-semibold text-black">
                Catalogue des missions : de l&apos;administratif à la coordination chantier
              </p>
              <p className="mt-2 text-black">
                Devis, factures, situations de travaux, DICT et dossiers administratifs, commandes & livraisons, locations
                matériel / engins / véhicules, planning, relances et suivi des litiges — le détail de ce que nous pouvons
                prendre en main pour vous.
              </p>
              <Link
                href="/assistants-administratifs-taches"
                className="mt-4 inline-flex items-center gap-1 font-semibold text-[#1d4ed8] transition-colors hover:text-[#1e40af]"
              >
                Voir le périmètre des missions
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Solutions */}
        <section id="solutions" className="px-6 py-24 md:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-black md:text-4xl">
                Trois leviers pour sécuriser tout votre organisationnel BTP
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-black">
                Administratif commercial, conformité chantier, logistique et coordination : une méthode unique, des outils et
                l&apos;IA au service de la précision — pour que rien ne dérape entre le bureau et le terrain.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 md:items-stretch md:gap-10">
              <div className="card-frame flex h-full flex-col rounded-xl p-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-[#eff6ff] text-[#1d4ed8]">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-black">
                  Administratif & relation client
                </p>
                <p className="mt-3 flex-1 text-black leading-relaxed">
                  Devis, facturation, situations de travaux, suivi MOA, relances et mails : vos dossiers avancent, vos
                  encaissements aussi.
                </p>
              </div>
              <div className="card-frame flex h-full flex-col rounded-xl p-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-[#eff6ff] text-[#1d4ed8]">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-black">
                  Chantier, démarches & conformité
                </p>
                <p className="mt-3 flex-1 text-black leading-relaxed">
                  Accompagnement sur DICT et DT, autorisations, déclarations, arrêtés et suivi administratif des dossiers —
                  pour garder la maîtrise du calendrier réglementaire.
                </p>
              </div>
              <div className="card-frame flex h-full flex-col rounded-xl p-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-[#eff6ff] text-[#1d4ed8]">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-black">
                  Logistique, moyens & coordination
                </p>
                <p className="mt-3 flex-1 text-black leading-relaxed">
                  Commandes fournisseurs, créneaux de livraison, planning équipes, locations matériel / engins / véhicules —
                  et relances fournisseurs pour que le chantier ne s&apos;arrête pas.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Ce que fait votre assistant */}
        <section id="missions" className="px-6 py-24 md:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold tracking-tight text-black md:text-4xl">
              Ce que nous prenons en charge — pensé pour le BTP
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-black">
              Sept blocs qui couvrent l&apos;administratif, l&apos;organisation chantier, la logistique, les moyens et les
              dossiers sensibles — avec la même exigence premium sur chaque livrable.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 sm:items-stretch lg:grid-cols-3">
              {[
                {
                  title: "Administratif",
                  keys: "Devis clients, facturation, situations de travaux, suivi client et avenants — le cœur commercial de vos chantiers.",
                },
                {
                  title: "Gestion",
                  keys: "Boîte mail, classement, relances courantes, structuration des dossiers et des priorités du jour.",
                },
                {
                  title: "Chantier & démarches",
                  keys: "Accompagnement sur DICT et DT, autorisations, déclarations, arrêtés et suivi administratif du dossier réglementaire.",
                },
                {
                  title: "Logistique",
                  keys: "Commandes fournisseurs, suivi des livraisons, coordination avec le planning chantier et les accès site.",
                },
                {
                  title: "Moyens",
                  keys: "Recherche et réservation de matériel, engins et véhicules — devis comparés, confirmations, créneaux sécurisés.",
                },
                {
                  title: "Organisation",
                  keys: "Planning équipes et interventions, coordination sous-traitants, structuration des flux info / doc.",
                },
                {
                  title: "Litiges & dossiers sensibles",
                  keys: "Relances fermes, préparation et suivi administratif des mises en demeure, montage de dossiers — toujours sous votre validation.",
                },
              ].map((item) => (
                <div key={item.title} className="card-frame flex h-full flex-col rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-black">{item.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-black">{item.keys}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Exemples de missions par secteur */}
        <section id="exemples-missions" className="px-6 py-24 md:py-28 scroll-mt-24" style={{ scrollMarginTop: "6rem" }}>
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold tracking-tight text-black md:text-4xl">
              Exemples de missions par secteur
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-black">
              Le BTP est notre socle — nous accompagnons aussi les PME et les indépendants qui partagent les mêmes exigences
              de délais, de chantier et de rigueur documentaire.
            </p>
            <div className="mt-12 grid gap-8 md:grid-cols-2 md:items-stretch lg:grid-cols-3">
              <div className="card-frame flex h-full flex-col rounded-xl p-6">
                <h3 className="text-lg font-semibold text-[#1d4ed8]">BTP</h3>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-black">
                  {[
                    "Devis, facturation, situations de travaux, suivi client",
                    "DICT / DT, autorisations, déclarations, suivi administratif des dossiers",
                    "Commandes fournisseurs, livraisons, coordination planning chantier",
                    "Locations matériel / engins / véhicules, relances, dossiers sensibles (sous validation)",
                  ].map((m, i) => (
                    <li key={i}>• {m}</li>
                  ))}
                </ul>
                <Link href="/assistant-administratif-btp" className="mt-4 inline-block text-sm font-semibold text-[#1d4ed8] hover:underline">
                  Voir le périmètre BTP →
                </Link>
              </div>
              <div className="card-frame flex h-full flex-col rounded-xl p-6">
                <h3 className="text-lg font-semibold text-[#1d4ed8]">Artisanat &amp; sous-traitance</h3>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-black">
                  {[
                    "Réponses aux marchés et montage de dossiers techniques (sous votre validation)",
                    "Suivi des réceptions, réserves et échanges avec maîtrise d’ouvrage / MOE",
                    "Coordination sous-traitants, planning et relances chantier",
                    "Dossiers assurance, décennale et contentieux — cadre administratif cadré",
                  ].map((m, i) => (
                    <li key={i}>• {m}</li>
                  ))}
                </ul>
                <Link href="/assistant-administratif-btp" className="mt-4 inline-block text-sm font-semibold text-[#1d4ed8] hover:underline">
                  Voir le périmètre BTP →
                </Link>
              </div>
              <div className="card-frame flex h-full flex-col rounded-xl p-6">
                <h3 className="text-lg font-semibold text-[#1d4ed8]">PME</h3>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-black">
                  {["Devis et factures clients", "Suivi des commandes", "Relances impayées", "Administratif RH"].map((m, i) => (
                    <li key={i}>• {m}</li>
                  ))}
                </ul>
                <Link href="/assistant-administratif-pme" className="mt-4 inline-block text-sm font-semibold text-[#1d4ed8] hover:underline">
                  Voir le périmètre →
                </Link>
              </div>
              <div className="card-frame flex h-full flex-col rounded-xl p-6">
                <h3 className="text-lg font-semibold text-[#1d4ed8]">Indépendants</h3>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-black">
                  {["Facturation", "Agenda et RDV", "Recherches fournisseurs", "Suivi administratif"].map((m, i) => (
                    <li key={i}>• {m}</li>
                  ))}
                </ul>
                <Link href="/assistant-administratif-distance" className="mt-4 inline-block text-sm font-semibold text-[#1d4ed8] hover:underline">
                  Voir le périmètre →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Équipe & ADN fondateur */}
        <section
          id="equipe"
          className="scroll-mt-24 px-6 py-24 md:py-28"
          style={{ scrollMarginTop: "6rem" }}
        >
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1d4ed8]">Fondatrice &amp; méthode</p>
            <h2 className="text-metallic-black mt-3 max-w-4xl font-sans text-3xl font-semibold leading-[1.15] tracking-tight md:text-4xl md:leading-[1.1]">
              Une solution née du terrain — par une dirigeante du BTP en Île-de-France
            </h2>

            <div className="mt-8 max-w-4xl rounded-2xl bg-gradient-to-br from-[#c8d0dc] via-white/90 to-[#a8b4c8] p-[1px] shadow-[0_12px_40px_rgba(15,23,42,0.1)]">
              <div className="surface-metallic-light surface-metallic-light--soft rounded-2xl px-6 py-7 md:px-8 md:py-8">
                <p className="text-base leading-relaxed text-black md:text-lg">
                  BeWork n&apos;est pas une plateforme générique. Elle s&apos;appuie sur{" "}
                  <strong className="font-semibold text-black">
                    vingt ans de terrain à la tête d&apos;entreprises du bâtiment
                  </strong>{" "}
                  : délais de chantier, tension de trésorerie, fournisseurs exigeants, paperasse du soir, dossiers qui
                  bloquent. Cette lecture du BTP guide{" "}
                  <strong className="font-semibold text-black">chaque process</strong> — de la relance client au suivi
                  d&apos;une DICT.
                </p>
              </div>
            </div>

            <div className="mt-14 grid gap-12 md:grid-cols-12 md:items-start md:gap-14">
              <div className="mx-auto shrink-0 text-center md:col-span-4 md:mx-0 md:text-left">
                <div className="rounded-2xl bg-gradient-to-br from-[#c8d0dc] via-white/90 to-[#a8b4c8] p-[1px] shadow-[0_12px_36px_rgba(15,23,42,0.12)]">
                  <div className="relative mx-auto aspect-square w-full max-w-[16rem] overflow-hidden rounded-2xl bg-[#e2e8f0] md:max-w-none">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/laure-olivie-chantier.png"
                      alt="Laure Olivie, fondatrice de BeWork, sur chantier en gilet haute visibilité avec porte-documents"
                      className="absolute inset-0 h-full w-full object-cover object-[center_20%]"
                    />
                  </div>
                </div>
                <p className="mt-5 font-sans text-xl font-semibold text-black md:text-2xl">
                  Laure Olivie
                </p>
                <p className="mt-1 text-sm font-semibold uppercase tracking-[0.08em] text-black">
                  Fondatrice de BeWork
                </p>
                <p className="mx-auto mt-3 max-w-xs text-xs leading-relaxed text-black md:mx-0">
                  Dirigeante BTP · Île-de-France · Formatrice IA · Diplômée
                </p>
              </div>

              <div className="space-y-6 md:col-span-8">
                <p className="text-lg leading-relaxed text-black">
                  BeWork est né d&apos;un constat simple&nbsp;: beaucoup d&apos;artisans et d&apos;entreprises du bâtiment
                  excellent sur l&apos;ouvrage mais s&apos;étouffent sur l&apos;administratif. La réponse n&apos;est pas
                  toujours l&apos;embauche — c&apos;est une{" "}
                  <strong className="font-semibold text-black">organisation structurée, fiable et immédiatement
                  opérationnelle</strong>
                  .
                </p>
                <div className="rounded-xl border border-[#bfdbfe]/70 bg-gradient-to-br from-[#eff6ff]/95 to-white/90 px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] md:px-6 md:py-6">
                  <p className="font-sans text-lg font-semibold leading-snug text-black md:text-xl">
                    Notre rôle
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-black md:text-base">
                    Tenir un <strong className="font-semibold text-black">relais administratif fiable</strong>, dans un{" "}
                    <strong className="font-semibold text-black">cadre contractuel clair</strong> — pas empiler des
                    dossiers à la chaîne sans méthode ni pilotage.
                  </p>
                </div>
                <div className="space-y-4 text-black leading-relaxed">
                  <p>
                    <strong className="font-semibold text-black">Société française</strong> fondée par{" "}
                    <strong className="font-semibold text-black">Laure Olivie</strong> —{" "}
                    <strong className="font-semibold text-black">
                      dirigeante d&apos;entreprise du BTP, vingt ans sur le terrain en Île-de-France
                    </strong>
                    . Votre <strong className="font-semibold text-black">interlocution principale</strong> passe par
                    l&apos;agence qu&apos;elle pilote au quotidien en région parisienne : écoute, exigence sur la qualité,
                    lien direct avec les dirigeants.
                  </p>
                  <p>
                    La <strong className="font-semibold text-black">plateforme opérationnelle</strong> est supervisée{" "}
                    <strong className="font-semibold text-black">en temps réel depuis la France</strong> : même fuseau,
                    même réactivité quand le planning serré ne pardonne pas. L&apos;équipe exécutive est composée de profils{" "}
                    <strong className="font-semibold text-black">diplômés Bac+5 minimum</strong>, formés aux outils
                    d&apos;intelligence artificielle — au service de la <strong className="font-semibold text-black">précision et du gain de temps</strong>, pas du gadget.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-14 rounded-2xl bg-gradient-to-br from-[#c8d0dc] via-white/90 to-[#a8b4c8] p-[1px] shadow-[0_12px_40px_rgba(15,23,42,0.1)]">
              <div className="card-frame rounded-2xl p-8 md:p-12">
                <div className="grid gap-10 md:grid-cols-2 md:items-stretch md:gap-12">
                  <div className="flex flex-col border-b border-[#c8d0dc]/70 pb-10 md:border-b-0 md:border-r md:border-[#c8d0dc]/70 md:pb-0 md:pr-10">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#1d4ed8]">Agence</p>
                    <p className="mt-2 font-sans text-xl font-semibold text-black md:text-2xl">
                      Région parisienne
                    </p>
                    <p className="mt-2 text-sm font-medium text-black">
                      Laure Olivie — votre interlocutrice principale
                    </p>
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-black md:text-[0.9375rem]">
                      Elle structure les missions, arbitre la qualité et garde le fil avec les dirigeants. Une exigence forgée
                      sur le chantier et en entreprise, appliquée à votre administratif.
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#1d4ed8]">Plateforme</p>
                    <p className="mt-2 font-sans text-xl font-semibold text-black md:text-2xl">
                      Pilotage depuis la France
                    </p>
                    <p className="mt-2 text-sm font-medium text-black">Exécution encadrée, même fuseau horaire</p>
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-black md:text-[0.9375rem]">
                      Sélection rigoureuse, formation IA et encadrement continu — pour un service réactif, aligné sur vos
                      urgences terrain et vos échéances administratives.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 rounded-2xl bg-gradient-to-br from-[#93c5fd]/45 via-white/95 to-[#bfdbfe]/40 p-[1px] shadow-[0_12px_40px_rgba(29,78,216,0.14)]">
              <div className="flex flex-col gap-6 rounded-2xl border border-[#bfdbfe]/60 bg-gradient-to-b from-white via-[#f8fafc] to-[#eff6ff]/90 px-6 py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] md:flex-row md:items-center md:justify-between md:gap-10 md:px-10 md:py-9">
                <div className="min-w-0 flex-1 text-center md:text-left">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#1d4ed8]">Premier échange</p>
                  <p className="mt-2 font-sans text-xl font-semibold text-black md:text-2xl">
                    Parlons de votre organisation
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-black md:text-[0.9375rem]">
                    Après le formulaire de rendez-vous découverte, nous vous proposons{" "}
                    <strong className="font-semibold text-black">rapidement un rendez-vous en visio</strong>. Nous vous
                    présentons <strong className="font-semibold text-black">de vive voix</strong> notre façon de travailler
                    et les leviers pour <strong className="font-semibold text-black">mieux structurer votre
                    administratif</strong> — au service de votre activité et de votre{" "}
                    <strong className="font-semibold text-black">chiffre d&apos;affaires</strong> (relances, devis,
                    dossiers tenus, temps libéré sur le terrain).
                  </p>
                </div>
                <div className="flex shrink-0 justify-center md:justify-end">
                  <Link
                    href="/contact"
                    className="inline-flex rounded-xl border border-[#2563eb]/70 bg-gradient-to-b from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] px-6 py-3.5 text-center text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_4px_18px_rgba(29,78,216,0.35)] transition hover:border-[#3b82f6] hover:from-[#2563eb] hover:via-[#1d4ed8] hover:to-[#1e40af] active:translate-y-px"
                  >
                    <span className="sm:hidden">Rendez-vous découverte</span>
                    <span className="hidden sm:inline">Demander un rendez-vous découverte</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Notre organisation */}
        <section id="pourquoi-nous" className="px-6 py-24 md:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold tracking-tight text-black md:text-4xl">
              Pourquoi les entreprises du BTP nous choisissent
            </h2>
            <ul className="mt-8 grid gap-4 md:grid-cols-2 md:items-stretch">
              {[
                "ADN terrain : vingt ans de BTP et de direction d'entreprise chez la fondatrice — briefs qui parlent chantier, fournisseurs et cash-flow.",
                "Interlocuteur principal en Île-de-France (Laure Olivie) : échange, exigence, disponibilité sur l'organisationnel.",
                "Une équipe pour l'administratif, la logistique et la coordination — pilotée depuis la France, au même fuseau.",
                "Profils Bac+5, IA et process : rigueur sur délais, démarches et dossiers sensibles (sous votre validation).",
              ].map((item, i) => (
                <li key={i} className="card-frame flex h-full gap-3 rounded-xl p-4">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#1d4ed8]/10 text-[#1d4ed8] text-xs font-bold">✓</span>
                  <span className="text-black">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Secteurs — cartes cliquables */}
        <section id="secteurs" className="px-6 py-24 md:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold tracking-tight text-black md:text-4xl">
              Des secteurs où nous excellons
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-black">
              Le bâtiment est notre cœur de cible — nous accompagnons aussi les structures qui partagent les mêmes exigences
              de rigueur et de délais.
            </p>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 sm:items-stretch lg:grid-cols-3 xl:grid-cols-4">
              {[
                {
                  name: "BTP & artisans",
                  desc: "Administratif, démarches, logistique fournisseurs, moyens, planning et suivi des litiges",
                },
                {
                  name: "Rénovation & second œuvre",
                  desc: "Dossiers chantier, coordination, réponses appels d’offres et suivi administratif du terrain",
                },
                { name: "Cabinets juridiques", desc: "Structuration et suivi de dossiers" },
                { name: "PME du bâtiment", desc: "Pilotage administratif quotidien dans un forfait défini" },
                { name: "Consulting", desc: "Support, synthèses et livrables premium" },
                { name: "E-commerce", desc: "Commandes, SAV, suivi opérationnel" },
                { name: "Agences de recrutement", desc: "Coordination et suivi candidats" },
              ].map((sector) => (
                <Link
                  key={sector.name}
                  href="/contact"
                  className="card-frame group flex h-full flex-col rounded-xl border-2 border-[#e2e8f0] p-6 text-left transition-all hover:border-[#1d4ed8] hover:shadow-md"
                >
                  <h3 className="text-lg font-semibold text-black group-hover:text-[#1d4ed8]">{sector.name}</h3>
                  <p className="mt-2 flex-1 text-sm text-black">{sector.desc}</p>
                  <span className="mt-3 inline-flex items-center text-sm font-medium text-[#1d4ed8] opacity-0 transition-opacity group-hover:opacity-100">
                    Demander un échange →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Service de conciergerie — sur devis, 24/24 */}
        <section id="conciergerie" className="px-6 py-24 md:py-28">
          <div className="card-frame mx-auto max-w-6xl rounded-xl border-2 border-[#1d4ed8]/20 p-10 md:p-14">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-bold tracking-tight text-black md:text-4xl">
                  Conciergerie d&apos;entreprise
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-black">
                  Au-delà du pilotage administratif, BeWork propose une{" "}
                  <strong className="text-black">conciergerie professionnelle</strong> pour vos imprévus de dirigeant :
                  déplacements, réservations, recherches pointues — exécutées à distance (appels, mails, confirmations) en
                  votre nom. Disponibilité 24h/24, tarif sur mesure.
                </p>
                <ul className="mt-6 grid gap-2 sm:grid-cols-2 text-black">
                  {[
                    "Réservation hôtel & hébergement",
                    "Recherche location véhicule, engin ou matériel (sous votre validation)",
                    "Réservation restaurant & organisation de déplacements",
                    "Coordination prestataires et créneaux (hors site)",
                    "Recherche & comparaison sur mesure",
                    "Envoi de cadeaux & attentions clients / équipes",
                  ].map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-[#1d4ed8] shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contact"
                  className="mt-8 inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-[#1e40af] hover:shadow-lg"
                >
                  Demander un devis conciergerie
                </Link>
              </div>
              <div className="rounded-lg border border-[#1d4ed8]/30 bg-[#eff6ff] px-5 py-4">
                <p className="text-sm font-semibold text-black">Sur devis personnalisé</p>
                <p className="mt-1 text-sm text-black">Tarif adapté à vos besoins et au volume de demandes. 24h/24.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tarif transparent + Nous travaillons avec vos outils */}
        <section className="px-6 py-24 md:py-28">
          <div className="mx-auto max-w-6xl space-y-20">
            <div className="card-frame rounded-xl p-10 md:p-14">
              <h2 className="text-3xl font-bold tracking-tight text-black md:text-4xl">
                Tarifs lisibles, prestation cadrée
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-black">
                Chaque formule fixe un volume et un niveau de priorité. Aucun frais caché : vous achetez du suivi structuré et
                de l&apos;exécution encadrée — pas une promesse vague de disponibilité.
              </p>
              <div className="mt-6 rounded-lg border border-[#1d4ed8]/30 bg-[#eff6ff] px-5 py-4">
                <p className="font-semibold text-black">
                  Un poste administratif en CDI en France représente souvent plus de 5 000 €/mois charges comprises (salaire,
                  cotisations, équipement, RH). Les forfaits BeWork (à partir de 290 € TTC / mois, offre Suivi à 490 €) proposent
                  un autre modèle : cadre défini, pas d&apos;embauche à gérer — utile à comparer selon votre charge réelle.
                </p>
                <Link href="/tarifs" className="mt-3 inline-block text-sm font-medium text-[#1d4ed8] hover:underline">
                  Voir le comparatif détaillé →
                </Link>
              </div>
              <ul className="mt-8 grid gap-2 sm:grid-cols-2 text-black">
                {[
                  "Équipe dédiée : administratif, organisation, logistique",
                  "Formation continue, IA et process chantier",
                  "Plateforme unique : statuts, livrables, traçabilité",
                  "Pilotage et direction en France — même fuseau que vos chantiers",
                ].map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-[#1d4ed8]">✓</span> {item}
                  </li>
                ))}
              </ul>
              <div className="mt-10">
                <Link
                  href="/tarifs"
                  className="inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-[#1e40af] hover:shadow-lg"
                >
                  Voir le détail des forfaits
                </Link>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-black md:text-4xl">
                Nous intervenons dans vos outils
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-black">
                CRM, logiciels de devis, outils de planning, GED, messageries : votre équipe BeWork travaille dans votre
                environnement. La plateforme BeWork agrège consignes, statuts et livrables — du devis à la livraison
                fournisseur.
              </p>
            </div>
          </div>
        </section>

        {/* Processus : matching et onboarding */}
        <section id="processus" className="px-6 py-24 md:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold tracking-tight text-black md:text-4xl">
              Matching et onboarding : un rendez-vous découverte premium
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-black">
              Aucune surprise : nous cartographions vos flux administratifs, vos urgences chantier et vos outils — avant de
              verrouiller l&apos;équipe et le rythme.
            </p>
            <div className="mt-12 grid gap-8 md:grid-cols-2 md:items-stretch lg:grid-cols-4">
              {[
                {
                  step: "1",
                  title: "Premier échange",
                  desc: "Cartographier vos flux : administratif, démarches, logistique, moyens, litiges. Un diagnostic conduit comme un point chantier, pas un questionnaire générique.",
                },
                {
                  step: "2",
                  title: "Proposition de profil",
                  desc: "Nous sélectionnons et présentons un ou plusieurs profils alignés sur votre culture et vos outils. Choix humain, pas automatisé.",
                },
                {
                  step: "3",
                  title: "Validation & cadre",
                  desc: "Vous validez l'équipe, nous formalisons le cadre de collaboration et les indicateurs de réussite.",
                },
                {
                  step: "4",
                  title: "Onboarding & go-live",
                  desc: "Rituels de communication, accès outils, priorités : nous démarrons opérationnellement — pour des premiers livrables rapides.",
                },
              ].map((item) => (
                <div key={item.step} className="card-frame flex h-full flex-col rounded-xl p-6">
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#1d4ed8] text-lg font-bold text-white">
                    {item.step}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-black">{item.title}</h3>
                  <p className="mt-2 flex-1 text-black leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ressources */}
        <section id="ressources" className="px-6 py-24 md:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-black md:text-4xl">
                Ressources & bonnes pratiques
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-black">
                Guides et retours d&apos;expérience pour structurer votre administratif, sécuriser votre trésorerie et
                professionnaliser votre relation client.
              </p>
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
          <div className="mx-auto max-w-6xl rounded-2xl surface-metallic-light surface-metallic-light--soft border-2 border-[#1d4ed8]/25 p-12 text-black shadow-lg md:p-16">
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
        <div className="mx-auto flex max-w-6xl flex-col gap-6 text-sm text-black md:flex-row md:items-center md:justify-between">
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
          </div>
        </div>
      </footer>
    </div>
  );
}