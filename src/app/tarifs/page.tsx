import type { Metadata } from "next";
import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { ComparatifReveal } from "@/components/tarifs/ComparatifReveal";
import { StickyCtaMobile } from "@/components/tarifs/StickyCtaMobile";
import { TARIFS_PLANS } from "@/lib/tarifs-plans";
import {
  CREDIT_MINUTES,
  PLAN_KEYS,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_PRICE_DISCLAIMER,
  SUBSCRIPTION_PRICE_TAX_LABEL,
  CREDITS_VALIDITY_NOTICE,
  CREDITS_VALIDITY_DAYS,
  creditsToDisplayHours,
  formatPriceLabelFr,
  getPublicPriceBoundsLabels,
} from "@/lib/subscription-plans";
import {
  SEO_OG_ALTERNATE_LOCALES,
  SEO_OG_LOCALE_PRIMARY,
  hreflangFrancophonieLanguages,
  metaDescriptionFrancophonie,
} from "@/lib/seo-francophonie";
import { SEO_KEYWORDS_PARTENAIRE_CORE } from "@/lib/seo-keywords";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const tarifsUrl = absoluteUrl("/tarifs");
const tarifsOgImage = absoluteUrl("/opengraph-image");

const TARIFS_META_DESC = metaDescriptionFrancophonie(
  "Forfaits HT pour externaliser bureau-chantier : devis, relances, DOE, PPSPS et dossiers. Assistants travaux BTP, sans recruter",
);

export const metadata: Metadata = {
  title: { absolute: "Tarifs assistant travaux BTP externalisé | BeWork" },
  description: TARIFS_META_DESC,
  keywords: [
    ...SEO_KEYWORDS_PARTENAIRE_CORE,
    "tarifs assistante travaux",
    "assistante BTP",
    "relais travaux",
    "dossiers chantier",
    "suivi devis et relances",
    "documents travaux",
    "tarif assistant administratif externalisé",
  ],
  alternates: { canonical: tarifsUrl, languages: hreflangFrancophonieLanguages("/tarifs") },
  openGraph: {
    type: "website",
    locale: SEO_OG_LOCALE_PRIMARY,
    alternateLocale: [...SEO_OG_ALTERNATE_LOCALES],
    url: tarifsUrl,
    siteName: "BeWork",
    title: "Tarifs BeWork — assistante travaux BTP (relais dossiers chantier)",
    description: TARIFS_META_DESC,
    images: [
      {
        url: tarifsOgImage,
        width: 1200,
        height: 630,
        alt: "Tarifs BeWork — assistante travaux BTP (relais dossiers chantier)",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tarifs BeWork — assistante travaux BTP",
    description: "Forfaits HT pour tenir vos dossiers chantier (devis, relances, situations, documents travaux) sans recruter.",
  },
  robots: { index: true, follow: true },
};

const plans = TARIFS_PLANS;

const ACTION_MINUTES = CREDIT_MINUTES;

const PRICE_BOUNDS = getPublicPriceBoundsLabels();

const PLAN_VOLUME = Object.fromEntries(
  PLAN_KEYS.map((key) => {
    const a = SUBSCRIPTION_PLANS[key].actionsIncluded;
    return [key, { hoursApprox: creditsToDisplayHours(a), actionsApprox: a }] as const;
  })
) as Record<(typeof PLAN_KEYS)[number], { hoursApprox: number; actionsApprox: number }>;

function formatHourlyCost(priceHt: string, hoursApprox: number) {
  const p = parseFloat(priceHt.replace(/\s/g, ""));
  if (!Number.isFinite(p) || hoursApprox <= 0) return null;
  const v = p / hoursApprox;
  return v.toLocaleString("fr-FR", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
}

const PLAN_COPY = {
  DECOUVERTE: {
    label: "Pour tenir vos dossiers chantier et éviter les oublis.",
    includes: ["Relances devis", "Mails clients", "Classement documents travaux"],
    results: ["Plus de réponses", "Moins d’oublis", "Suivi plus régulier"],
    examples: ["Relances devis & pièces", "Suivi d’un petit volume de dossiers", "Demandes ponctuelles (fournisseur, doc, RDV)"],
  },
  STANDARD: {
    label: "Pour ne plus perdre d’opportunités et signer plus de chantiers.",
    includes: ["Suivi devis & relances", "Situations / factures chantier", "Fournisseurs & commandes"],
    results: ["Plus de devis signés", "Plus de chantiers", "Suivi pro constant"],
    examples: ["Suivi devis + relances jusqu’à réponse", "Situations, pièces et envois", "Commandes, livraisons, locations"],
  },
  PREMIUM: {
    label: "Pour un relais travaux à forte capacité, sur plusieurs chantiers.",
    includes: ["Suivi multi-dossiers", "Réserves / DOE", "Coordination renforcée"],
    results: ["Activité structurée", "Gain de temps massif", "Développement du chiffre d’affaires"],
    examples: ["DOE, réserves, PV (organisation & suivi)", "DCE/CCTP (tri, synthèses, checklists)", "Cadence quasi quotidienne si besoin"],
  },
} as const;

const reassurance = [
  { label: "Cadre", desc: "Périmètre défini, relation professionnelle claire" },
  { label: "Pilotage", desc: "Encadrement en France, exigence sur la qualité des livrables" },
  { label: "BTP", desc: "Devis, relances, chantier et logistique lus avec les contraintes terrain" },
  { label: "Suivi", desc: "Plateforme, échanges datés, points d’ajustement réguliers" },
];

const inclus = [
  "Structuration des demandes et priorités",
  "Devis, facturation, situations de travaux, relances",
  "Suivi dossiers et restitution sur la plateforme",
  "Saisie et outils métiers (selon vos accès)",
  "Planning, coordination et échanges cadrés",
  "Compte-rendus et documents préparés sous contrôle humain",
];

const etapes = [
  {
    title: "Échange & cartographie",
    desc: "Nous passons en revue vos flux : commercial, réglementaire, logistique, urgences. Objectif : une proposition de formule alignée sur la charge réelle, pas sur un catalogue abstrait.",
  },
  {
    title: "Rendez-vous découverte & démarrage",
    desc: "Rôles, canaux, outils, rituels de pilotage : tout est posé par écrit avant l’exécution. Les accès et le périmètre sont validés ensemble.",
  },
  {
    title: "Exécution & pilotage",
    desc: "Missions traitées dans le cadre convenu, avec reporting et ajustements lorsque l’activité évolue.",
  },
];

const faq = [
  {
    q: "Comment fonctionnent les actions BeWork ?",
    a: `1 crédit = ${ACTION_MINUTES} minutes. Chaque demande consomme des crédits selon le temps réellement passé : relance, mail, appel, suivi fournisseur, préparation d’une situation, mise au propre d’un compte rendu, etc.`,
  },
  {
    q: "Combien de temps ai-je pour utiliser mes crédits ?",
    a: `Tous les forfaits : les crédits achetés ou crédités sont valables ${CREDITS_VALIDITY_DAYS} jours à compter de la date d'achat ou de renouvellement. Les crédits non utilisés à l'issue de ce délai sont perdus (sans remboursement ni report).`,
  },
  {
    q: "À quoi correspondent les heures incluses ?",
    a: "Les heures affichées sont un repère (conversion des crédits). Vous achetez un volume de traitement utilisable pendant 30 jours, dans un cadre cadré (périmètres, priorités, circuit de validation).",
  },
  {
    q: "Quel forfait choisir pour une entreprise du BTP ?",
    a: "Découverte pour démarrer (relances, suivi simple, docs). Standard pour un suivi régulier (devis/relances, situations, fournisseurs). Premium si vous avez plusieurs chantiers et des livrables plus lourds (réserves, DOE, coordination renforcée).",
  },
  {
    q: "Puis-je utiliser mon forfait pour des DOE, PPSPS, DCE ou CCTP ?",
    a: "Oui sur un périmètre cadré : organisation des pièces, checklists, relances documents, tri et synthèse. Vous validez les points sensibles (technique, prix, engagement) avant diffusion.",
  },
  {
    q: "Que se passe-t-il si une demande dépasse le temps prévu ?",
    a: "On vous propose un découpage (étapes), une estimation en crédits et un point de validation avant d’aller plus loin. L’objectif : garder de la visibilité et éviter les dérives.",
  },
  {
    q: "Est-ce que BeWork remplace une assistante salariée ?",
    a: "Non. BeWork est un relais travaux bureau‑terrain : utile quand la charge varie, quand vous ne voulez pas recruter, ou quand vous avez besoin d’un cadre clair. Un poste interne reste pertinent si vous avez un besoin constant à temps plein.",
  },
  {
    q: "Les tarifs sont-ils adaptés aux artisans et petites entreprises du bâtiment ?",
    a: "Oui : forfaits HT, sans recrutement, avec une montée en charge progressive. Vous gardez la validation finale et les décisions qui engagent votre entreprise.",
  },
];

const tarifsStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ItemList",
      "@id": `${tarifsUrl}#plans`,
      name: "Tarifs BeWork — assistante travaux BTP",
      numberOfItems: plans.length,
      itemListElement: plans.map((plan, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Offer",
          name: `${plan.name} — BeWork`,
          description: plan.tagline,
          price: plan.price,
          priceCurrency: "EUR",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: plan.price,
            priceCurrency: "EUR",
            valueAddedTaxIncluded: false,
          },
          url: tarifsUrl,
          availability: "https://schema.org/InStock",
          seller: { "@type": "Organization", name: "BeWork", url: SITE_URL },
        },
      })),
    },
    {
      "@type": "FAQPage",
      "@id": `${tarifsUrl}#faq`,
      url: tarifsUrl,
      inLanguage: "fr-FR",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ],
};

export default function TarifsPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 md:pb-16">
      <MarketingSiteHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(tarifsStructuredData) }}
      />

      <main className="mx-auto max-w-site px-4 py-12 md:py-16">
        {/* Intro */}
        <section className="text-center">
          <h1 className="text-metallic-black font-sans text-3xl font-semibold tracking-tight md:text-4xl md:leading-tight">
            Tarifs BeWork : un relais travaux pour tenir vos dossiers chantier
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-black">
            Des forfaits clairs pour déléguer le suivi bureau‑terrain : devis, relances, situations, documents travaux, fournisseurs, réserves, DOE.
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-black md:text-base">
            Dans le BTP, des opportunités se perdent à cause du manque de suivi : devis, relances, organisation, coordination.
            Ici, vous achetez du <strong className="font-semibold text-black">suivi</strong>, de la{" "}
            <strong className="font-semibold text-black">structuration</strong> et des{" "}
            <strong className="font-semibold text-black">chantiers sécurisés</strong>.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold text-black">
            Plus vous déléguez, plus le coût horaire diminue.
          </p>
          <div className="mx-auto mt-7 max-w-3xl rounded-2xl bg-gradient-to-br from-[#c8d0dc] via-white/90 to-[#a8b4c8] p-[1px] shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="surface-metallic-light surface-metallic-light--soft rounded-2xl px-6 py-5 text-center md:px-8 md:py-6">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-black">Repère simple</p>
              <p className="mt-2 text-base font-semibold text-black md:text-lg">
                1 crédit = {ACTION_MINUTES} minutes{" "}
                <span className="font-normal text-black">(relance, appel, mail, suivi fournisseur, doc chantier…)</span>
              </p>
            </div>
          </div>
          <div className="mx-auto mt-4 max-w-3xl rounded-xl border border-amber-200/80 bg-amber-50/90 px-5 py-4 text-center text-sm leading-relaxed text-amber-950">
            <strong>Validité {CREDITS_VALIDITY_DAYS} jours — tous forfaits :</strong> {CREDITS_VALIDITY_NOTICE}
            {" "}
            <Link href="/conditions-generales-vente" className="font-semibold underline hover:no-underline">
              Voir les CGV
            </Link>
          </div>
          {/* Réassurance (premium, en 1 ligne) */}
          <ul className="mt-8 flex flex-wrap justify-center gap-4 md:gap-6" role="list">
            {reassurance.map(({ label, desc }) => (
              <li key={label} className="rounded-lg surface-metallic-light px-4 py-3 text-center">
                <span className="block font-semibold text-black">{label}</span>
                <span className="block text-sm text-black">{desc}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Cartes pricing */}
        <section className="mt-14" aria-labelledby="offres-heading">
          <h2 id="offres-heading" className="sr-only">
            Nos offres
          </h2>
          <p className="mx-auto mb-6 max-w-3xl text-center text-[12px] leading-relaxed text-black md:text-sm">
            À partir d’environ <strong className="font-semibold text-black">12 €/h</strong> tout compris, sans recrutement, sans
            charges, sans contraintes.
          </p>
          <div className="mx-auto grid max-w-site gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:items-stretch lg:gap-5">
            {plans.map((plan) => {
              const isFeatured = plan.planKey === "STANDARD";
              const volume = PLAN_VOLUME[plan.planKey];
              const copy = PLAN_COPY[plan.planKey];
              const hourlyCost = formatHourlyCost(plan.price, volume.hoursApprox);
              return (
              <article
                id={`tarif-${plan.planKey}`}
                key={plan.name}
                style={{ scrollMarginTop: "5.5rem" }}
                className={`relative flex flex-col rounded-xl border-2 surface-metallic-light surface-metallic-light--badge-pill transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                  isFeatured
                    ? "z-10 border-[#1d4ed8] py-7 shadow-md shadow-[#1d4ed8]/15 ring-2 ring-[#1d4ed8]/30 md:px-7 md:py-8 lg:scale-[1.03]"
                    : "border-[#c8cdd6] py-6 hover:border-[#94a3b8]"
                } px-5`}
              >
                {isFeatured && (
                  <span className="absolute -top-3 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#1d4ed8] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-[0_2px_8px_rgba(29,78,216,0.4)]">
                    LE PLUS CHOISI
                  </span>
                )}
                <h3 className="border-b border-[#e2e8f0] pb-3 text-lg font-semibold tracking-tight text-black">
                  {plan.name}
                </h3>
                <div className="mt-5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
                  <span className="text-3xl font-bold tracking-tight text-[#1d4ed8] tabular-nums md:text-[2.125rem]">
                    {formatPriceLabelFr(plan.price)}
                  </span>
                  <span className="text-xl font-semibold text-black">€</span>
                  <span className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-black">
                    {SUBSCRIPTION_PRICE_TAX_LABEL}
                  </span>
                  {plan.billing === "monthly" && (
                    <span className="text-base font-semibold text-black">/ mois</span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-black" aria-label="Volume inclus estimé">
                  <span className="rounded-full border border-[#cbd5e1] bg-white/70 px-3 py-1">
                    ~{volume.hoursApprox}h incluses
                  </span>
                  <span className="rounded-full border border-[#cbd5e1] bg-white/70 px-3 py-1">
                    ≈ {volume.actionsApprox} crédits
                  </span>
                  {hourlyCost ? (
                    <span className="rounded-full border border-[#cbd5e1] bg-white/70 px-3 py-1">
                      ~{hourlyCost} €/h
                    </span>
                  ) : null}
                </div>
                <p className="mt-4 border-t border-[#e2e8f0] pt-4 text-sm font-semibold leading-relaxed text-black">
                  {copy.label}
                </p>
                {plan.detail ? (
                  <p className="mt-3 text-sm leading-relaxed text-black">{plan.detail}</p>
                ) : null}
                <div className="mt-5 grid gap-4">
                  <div className="rounded-xl border border-[#dce3ec]/80 bg-white/60 p-4 shadow-sm backdrop-blur-sm">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1d4ed8]">Inclus</p>
                    <ul className="mt-3 space-y-2 text-sm text-black" role="list">
                      {copy.includes.map((h) => (
                        <li key={h} className="flex items-start gap-2.5">
                          <span
                            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-[10px] font-bold text-[#1d4ed8]"
                            aria-hidden
                          >
                            ✓
                          </span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div
                    className={`rounded-xl border p-4 shadow-sm ${
                      isFeatured ? "border-[#1d4ed8]/35 bg-[#eff6ff]/70" : "border-[#dce3ec]/80 bg-white/60"
                    }`}
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black">Résultat</p>
                    <ul className="mt-3 space-y-2 text-sm text-black" role="list">
                      {copy.results.map((r) => (
                        <li key={r} className="flex items-start gap-2.5">
                          <span className="mt-0.5 text-[#16a34a]" aria-hidden>
                            ●
                          </span>
                          <span className="font-semibold">{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <CalendlyBookingLink className="mt-5 block w-full rounded-lg bg-[#1d4ed8] py-3 text-center text-sm font-semibold text-white transition hover:bg-[#1e40af]">
                  <span className="sm:hidden">Rendez-vous découverte</span>
                  <span className="hidden sm:inline">Demander un rendez-vous découverte</span>
                </CalendlyBookingLink>
                <p className="mt-3 text-center text-[11px] leading-relaxed text-black">
                  Volume estimatif · 1 crédit = {ACTION_MINUTES} min · validité {CREDITS_VALIDITY_DAYS} jours
                </p>
                {plan.planKey === "PREMIUM" ? (
                  <p className="mt-2 text-center text-[11px] leading-relaxed text-black">
                    Équivalent d’un <span className="font-semibold text-black">relais travaux structuré à forte capacité</span>, sans
                    charges ni contraintes internes.
                  </p>
                ) : null}
              </article>
              );
            })}
          </div>
          <p className="mx-auto mt-6 max-w-3xl text-center text-[12px] leading-relaxed text-black md:text-sm">
            Inclus : <strong className="font-semibold text-black">jusqu’à 2 périmètres</strong> (ex. devis/facturation/relances + chantier/logistique/démarches).
            Au-delà : <Link href="/contact" className="font-semibold text-[#1d4ed8] hover:underline">sur-mesure</Link>.
          </p>
          <p className="mx-auto mt-6 max-w-3xl text-center text-[11px] leading-relaxed text-black md:text-xs">
            Volumes estimatifs (repères) basés sur 1 crédit = {ACTION_MINUTES} minutes.
          </p>
        {/* Compréhension */}
        <section className="mx-auto mt-14 max-w-5xl" aria-labelledby="comprehension-heading">
          <div className="rounded-2xl bg-gradient-to-br from-[#c8d0dc] via-white/90 to-[#a8b4c8] p-[1px] shadow-[0_12px_40px_rgba(15,23,42,0.1)]">
            <div className="card-frame rounded-2xl px-6 py-8 md:px-10 md:py-10">
              <h2
                id="comprehension-heading"
                className="text-metallic-black text-center font-sans text-2xl font-semibold tracking-tight md:text-3xl"
              >
                Concrètement, ça représente quoi ?
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-black md:text-base">
                Des repères simples pour visualiser le volume. Un crédit correspond à ~{ACTION_MINUTES} minutes.
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {[
                  { k: "1 devis", v: "1 à 2 crédits" },
                  { k: "1 relance", v: "1 crédit" },
                  { k: "1 appel client", v: "1 crédit" },
                  { k: "1 coordination fournisseur", v: "1 à 3 crédits" },
                ].map((row) => (
                  <div
                    key={row.k}
                    className="rounded-xl border border-[#dce3ec]/80 bg-white/60 p-5 shadow-sm backdrop-blur-sm"
                  >
                    <p className="text-sm font-semibold text-black">{row.k}</p>
                    <p className="mt-1 text-sm text-black">{row.v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Impact */}
        <section className="mx-auto mt-14 max-w-5xl" aria-labelledby="impact-heading">
          <div className="surface-metallic-light surface-metallic-light--soft rounded-2xl border-2 border-[#1d4ed8]/20 p-8 text-black shadow-lg md:p-10">
            <h2
              id="impact-heading"
              className="text-center font-sans text-2xl font-semibold tracking-tight md:text-3xl"
            >
              Ce que vous gagnez réellement
            </h2>
            <ul className="mx-auto mt-7 grid max-w-3xl gap-3 text-black md:grid-cols-2" role="list">
              {["Plus de clients", "Plus de chantiers signés", "Moins de stress", "Plus de temps pour le terrain"].map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-xl border border-black/10 bg-white/70 p-4">
                  <span className="mt-0.5 text-[#1d4ed8]" aria-hidden>
                    ✓
                  </span>
                  <span className="font-semibold">{item}</span>
                </li>
              ))}
            </ul>
            <p className="mx-auto mt-7 max-w-3xl text-center text-sm leading-relaxed text-black md:text-base">
              <strong className="text-black">
                Ce que vous investissez ici est largement rentabilisé par les opportunités que vous ne perdez plus.
              </strong>
            </p>
            <div className="mt-8 flex justify-center">
              <CalendlyBookingLink className="inline-flex items-center justify-center rounded-xl bg-[#1d4ed8] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#1d4ed8]/25 transition hover:bg-[#1e40af]">
                Demander un rendez-vous découverte
              </CalendlyBookingLink>
            </div>
          </div>
        </section>

        {/* Ressources utiles */}
        <section className="mx-auto mt-14 max-w-5xl" aria-labelledby="ressources-seo-heading">
          <div className="rounded-2xl surface-metallic-light p-8 md:p-10">
            <h2 id="ressources-seo-heading" className="text-xl font-semibold tracking-tight text-black md:text-2xl">
              Ressources utiles (BTP)
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-black md:text-base">
              Des tutos concrets sur les sujets qui font gagner du temps et sécurisent le chiffre d’affaires.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                { title: "Relance devis BTP : signer plus de chantiers", href: "/relance-devis-btp" },
                { title: "Impayés : relances cadrées et trésorerie", href: "/impayes-btp-relances" },
                { title: "Situation de travaux : structurer et envoyer", href: "/situation-travaux-btp" },
                { title: "DICT / DT : dossier, délais, suivi", href: "/dict-dt-travaux" },
              ].map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  className="rounded-xl border border-[#dce3ec] bg-white/60 px-5 py-4 font-medium text-black transition hover:border-[#93c5fd] hover:bg-white"
                >
                  {r.title} <span className="text-[#1d4ed8]">→</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

          <section
            className="mx-auto mt-14 max-w-3xl space-y-8"
            aria-labelledby="cadre-prestation-heading"
          >
            <div className="rounded-2xl bg-gradient-to-br from-[#c8d0dc] via-white/90 to-[#a8b4c8] p-[1px] shadow-[0_12px_40px_rgba(15,23,42,0.1)]">
              <div className="card-frame rounded-2xl px-6 py-8 text-center md:px-10 md:py-9">
                <h2
                  id="cadre-prestation-heading"
                  className="text-metallic-black font-sans text-xl font-semibold tracking-tight md:text-2xl"
                >
                  Cadre de prestation
                </h2>
                <div className="mx-auto mt-6 max-w-2xl space-y-4 text-sm leading-relaxed text-black md:text-[0.9375rem]">
                  <p>BeWork ne propose pas une prestation administrative classique.</p>
                  <p>
                    Nous mettons en place un cadre de travail structuré, adapté aux réalités du terrain, afin de garantir un
                    suivi fiable et durable.
                  </p>
                  <p>
                    Notre approche s&apos;adresse à des professionnels du bâtiment qui souhaitent organiser leur activité, pas
                    simplement déléguer des tâches.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-[#c8d0dc] via-white/90 to-[#a8b4c8] p-[1px] shadow-[0_8px_28px_rgba(15,23,42,0.08)]">
              <div className="surface-metallic-light surface-metallic-light--soft rounded-2xl px-6 py-7 text-center md:px-8 md:py-8">
                <p className="text-sm font-semibold leading-relaxed text-black md:text-[0.9375rem]">
                  Externaliser avec un cadre défini évite de porter seul salaire, charges et management d&apos;un poste interne
                  à temps plein.
                </p>
                <p className="mt-4 text-sm leading-relaxed text-black">
                  Vous choisissez un niveau d&apos;accompagnement cohérent avec votre charge — pas une relation informelle ni
                  une disponibilité illimitée.
                </p>
                <p className="mt-4 text-xs font-medium uppercase tracking-[0.08em] text-black">
                  {SUBSCRIPTION_PRICE_DISCLAIMER}
                </p>
              </div>
            </div>

            <div
              id="perimetres-missions"
              className="scroll-mt-24 rounded-2xl bg-gradient-to-br from-[#c8d0dc] via-white/90 to-[#a8b4c8] p-[1px] shadow-[0_12px_40px_rgba(15,23,42,0.1)]"
            >
              <div className="card-frame rounded-2xl px-6 py-8 md:px-10 md:py-9">
                <h3 className="text-metallic-black text-center font-sans text-xl font-semibold tracking-tight md:text-left md:text-2xl">
                  Que signifie « périmètre » ?
                </h3>
                <p className="mt-5 text-sm leading-relaxed text-black md:text-[0.9375rem]">
                  Un <strong className="font-semibold text-black">périmètre</strong>, ce n&apos;est pas une tâche isolée :
                  c&apos;est un <strong className="font-semibold text-black">ensemble de missions</strong> du même ordre,
                  regroupé et défini avec vous au contrat — par exemple tout le volet devis, factures et relances, ou le suivi
                  des dossiers chantier et fournisseurs, ou encore les démarches réglementaires, selon ce qui est retenu.
                </p>
                <p className="mt-4 text-sm leading-relaxed text-black">
                  En BTP, on peut ainsi avoir un périmètre « commercial / facturation » et un autre « chantier / coordination »,
                  toujours selon ce qui a été convenu ensemble.
                </p>
                <div className="mt-6 rounded-xl border border-[#93c5fd]/45 bg-gradient-to-b from-[#eff6ff]/90 to-[#dbeafe]/40 p-5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#1d4ed8]">Tarifs affichés</p>
                  <p className="mt-3 text-sm leading-relaxed text-black">
                    <strong className="text-black">Ces montants valent pour deux périmètres au maximum</strong> — soit deux
                    domaines distincts, fixés au contrat.{" "}
                    <strong className="text-black">Au-delà</strong>, nous préparons une{" "}
                    <Link href="/contact" className="font-semibold text-[#1d4ed8] underline-offset-2 hover:underline">
                      offre sur mesure
                    </Link>{" "}
                    (autres volumes, autre organisation).
                  </p>
                </div>
                <p className="mt-5 text-center text-xs text-black md:text-left">
                  <Link
                    href="/assistants-administratifs-taches#faq-heading"
                    className="font-medium text-[#1d4ed8] hover:underline"
                  >
                    Tâches prises en charge &amp; FAQ (périmètres)
                  </Link>
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-[#c8d0dc] via-white/90 to-[#a8b4c8] p-[1px] shadow-[0_8px_28px_rgba(15,23,42,0.08)]">
              <div className="surface-metallic-light surface-metallic-light--soft rounded-2xl px-6 py-7 text-center md:px-9 md:py-8">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-black">Nature de la prestation</p>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-black md:text-[0.9375rem]">
                  BeWork intervient en <strong className="font-semibold text-black">organisation</strong> et{" "}
                  <strong className="font-semibold text-black">assistance travaux externalisée</strong> (relais bureau‑terrain). Tout est
                  cadré par <strong className="font-semibold text-black">contrat</strong> : périmètre, modalités et circuit de validation.
                </p>
                <p className="mx-auto mt-4 max-w-2xl font-sans text-base font-semibold leading-snug text-black md:text-lg">
                  Un relais opérationnel — pas un portage de personnel.
                </p>
              </div>
            </div>
          </section>

          {/* Solution dédiée — Full-time */}
          <section className="mt-12 surface-metallic-light surface-metallic-light--soft rounded-2xl border-2 border-[#1d4ed8]/20 p-8 text-black shadow-lg md:p-10" aria-labelledby="solution-dediee-heading">
            <h2 id="solution-dediee-heading" className="text-2xl font-bold tracking-tight md:text-3xl">
              Besoin d&apos;un volume plus important ?
            </h2>
            <p className="mt-4 max-w-2xl text-black leading-relaxed">
              Nous proposons aussi des solutions dédiées quand le volume de demandes (multi‑chantiers, coordination, livrables) devient plus important.
            </p>
            <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <ul className="space-y-3 text-black" role="list">
                  {["Capacité sur mesure", "Interlocuteur dédié", "Organisation adaptée à votre entreprise", "Priorité maximale"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="text-[#1d4ed8]" aria-hidden>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <p className="font-semibold text-black">Full-time</p>
                  <p className="mt-1 text-sm text-black leading-relaxed">
                    Une solution sur mesure pour les entreprises qui veulent un relais travaux quasi quotidien, avec un périmètre cadré.
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#1d4ed8]">
                    Solution idéale quand la charge est régulière et que vous voulez éviter un recrutement trop tôt.
                  </p>
                </div>
                <Link
                  href="/contact"
                  className="mt-6 inline-flex rounded-lg border-2 border-[#1d4ed8] bg-white px-6 py-3 font-semibold text-black shadow-md transition hover:bg-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:ring-offset-2 focus:ring-offset-white"
                >
                  Étudier un volume sur mesure
                </Link>
              </div>
              <div className="shrink-0 rounded-xl border border-black/15 bg-white/80 px-6 py-4 lg:ml-8">
                <p className="text-xs font-semibold uppercase tracking-wide text-black">Solution sur mesure</p>
                <p className="mt-1 text-lg font-bold text-black">Full-time</p>
                <p className="mt-1 text-sm text-black">Devis personnalisé</p>
              </div>
            </div>
          </section>

          {/* Conciergerie — sur devis */}
          <section
            className="mt-12"
            aria-labelledby="conciergerie-heading"
          >
            <div className="rounded-2xl bg-gradient-to-br from-[#93c5fd]/55 via-white/95 to-[#bfdbfe]/50 p-[1px] shadow-[0_12px_40px_rgba(29,78,216,0.14),0_2px_0_rgba(255,255,255,0.5)_inset]">
              <div className="rounded-2xl border border-[#bfdbfe]/70 bg-gradient-to-b from-white via-[#f8fafc] to-[#eff6ff]/95 px-6 py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] md:px-10 md:py-9">
                <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-center sm:gap-4">
                  <h3
                    id="conciergerie-heading"
                    className="text-metallic-black font-sans text-xl font-semibold tracking-tight md:text-2xl"
                  >
                    Service de conciergerie
                  </h3>
                  <span className="surface-metallic-light surface-metallic-light--badge-pill rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-black shadow-sm">
                    Sur devis
                  </span>
                </div>
                <p className="mx-auto mt-5 max-w-2xl text-center text-sm leading-relaxed text-black md:text-[0.9375rem]">
                  Un complément à part : réservations et organisation du quotidien professionnel, traitées comme des missions
                  ponctuelles — en dehors du cadre des forfaits relais travaux.
                </p>
                <ul
                  className="mx-auto mt-6 grid max-w-xl gap-3 text-left text-sm text-black sm:grid-cols-2"
                  role="list"
                >
                  <li className="flex gap-2.5 rounded-lg border border-[#e2e8f0]/80 bg-white/70 px-3 py-2.5 shadow-sm">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#dbeafe] text-[10px] font-bold text-[#1d4ed8]" aria-hidden>
                      ✓
                    </span>
                    <span>Hôtel, véhicule, restaurant, déplacements</span>
                  </li>
                  <li className="flex gap-2.5 rounded-lg border border-[#e2e8f0]/80 bg-white/70 px-3 py-2.5 shadow-sm">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#dbeafe] text-[10px] font-bold text-[#1d4ed8]" aria-hidden>
                      ✓
                    </span>
                    <span>À distance : recherches, appels et e-mails en votre nom</span>
                  </li>
                </ul>
                <p className="mt-6 text-center text-xs font-semibold uppercase tracking-[0.1em] text-[#1d4ed8]">
                  Disponible 24h/24 — montant et périmètre fixés au devis
                </p>
                <div className="mt-6 flex justify-center">
                  <Link
                    href="/contact"
                    className="inline-flex rounded-xl border border-[#2563eb]/70 bg-gradient-to-b from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] px-6 py-3 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_4px_18px_rgba(29,78,216,0.35)] transition hover:border-[#3b82f6] hover:from-[#2563eb] hover:via-[#1d4ed8] hover:to-[#1e40af] active:translate-y-px"
                  >
                    Demander un devis
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </section>

        {/* Ce qui est inclus */}
        <section className="mt-14 rounded-2xl surface-metallic-light p-8" aria-labelledby="inclus-heading">
          <h2 id="inclus-heading" className="text-xl font-bold text-black md:text-2xl">
            Ce qui est inclus
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3" role="list">
            {inclus.map((item) => (
              <li key={item} className="flex items-center gap-2 text-black">
                <span className="text-[#1d4ed8]" aria-hidden>✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4">
            <Link
              href="/assistants-administratifs-taches"
              className="text-sm font-medium text-[#1d4ed8] transition hover:underline"
            >
              Voir les tâches prises en charge →
            </Link>
          </p>
        </section>

        {/* Process BeWork */}
        <section className="mt-14" aria-labelledby="process-heading">
          <h2 id="process-heading" className="text-xl font-bold text-black md:text-2xl">
            Process BeWork
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {etapes.map((e, i) => (
              <div key={i} className="rounded-xl surface-metallic-light p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1d4ed8] text-lg font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold text-black">{e.title}</h3>
                <p className="mt-2 text-sm text-black">{e.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA principal */}
        <div className="mt-14 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <CalendlyBookingLink
            className="w-full rounded-lg bg-[#1d4ed8] px-8 py-4 text-center font-semibold text-white shadow-md transition hover:bg-[#1e40af] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:ring-offset-2 sm:w-auto"
            aria-label="Demande de contact et rendez-vous"
          >
            Échanger sur votre fonctionnement
          </CalendlyBookingLink>
          <Link
            href="/connexion"
            className="w-full rounded-lg surface-metallic-light px-8 py-4 text-center font-semibold text-[#1e293b] transition hover:bg-[#f8f9fb] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:ring-offset-2 sm:w-auto"
            aria-label="Déjà client ? Accéder à mon espace"
          >
            Déjà client ? Accéder
          </Link>
        </div>

        {/* Tableau comparatif (révélé au clic) */}
        <ComparatifReveal>
          {/* Tableau des offres Structure / Suivi / Pilotage */}
          <div className="overflow-x-auto rounded-xl surface-metallic-light">
            <table className="w-full min-w-[420px] text-left text-sm" role="grid">
              <caption className="sr-only">Comparatif des offres BeWork</caption>
              <thead>
                <tr className="border-b border-[#e0e4ea] bg-[#f8f9fb]">
                  <th className="px-4 py-3 font-semibold text-black">Critère</th>
                  <th className="px-4 py-3 font-semibold text-black">Structure</th>
                  <th className="px-4 py-3 font-semibold text-black">Suivi</th>
                  <th className="px-4 py-3 font-semibold text-black">Pilotage</th>
                </tr>
              </thead>
              <tbody className="text-black">
                <tr className="border-b border-[#e0e4ea]">
                  <td className="px-4 py-3">Prix HT / mois</td>
                  {PLAN_KEYS.map((key) => (
                    <td key={key} className="px-4 py-3">
                      <span className="tarif-emphase text-black">
                        {formatPriceLabelFr(SUBSCRIPTION_PLANS[key].priceLabel)}
                      </span>{" "}
                      € {SUBSCRIPTION_PRICE_TAX_LABEL}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[#e0e4ea]">
                  <td className="px-4 py-3">Niveau d&apos;accompagnement</td>
                  <td className="px-4 py-3">Charge adaptée</td>
                  <td className="px-4 py-3">Suivi structuré</td>
                  <td className="px-4 py-3">Capacité maximale</td>
                </tr>
                <tr className="border-b border-[#e0e4ea]">
                  <td className="px-4 py-3">Abonnement</td>
                  <td className="px-4 py-3">Oui</td>
                  <td className="px-4 py-3">Oui</td>
                  <td className="px-4 py-3">Oui</td>
                </tr>
                <tr className="border-b border-[#e0e4ea]">
                  <td className="px-4 py-3">Priorité de traitement</td>
                  <td className="px-4 py-3">Standard</td>
                  <td className="px-4 py-3">Standard</td>
                  <td className="px-4 py-3">Priorité élevée</td>
                </tr>
                <tr className="border-b border-[#e0e4ea]">
                  <td className="px-4 py-3">Périmètres inclus</td>
                  <td colSpan={3} className="px-4 py-3">
                    Max 2 (au-delà : devis sur mesure)
                  </td>
                </tr>
                <tr className="border-b border-[#e0e4ea]">
                  <td className="px-4 py-3">Support / pilotage</td>
                  <td colSpan={3} className="px-4 py-3">
                    Pilotage en France, points de suivi réguliers
                  </td>
                </tr>
                <tr className="border-b border-[#e0e4ea]">
                  <td className="px-4 py-3">Canaux</td>
                  <td colSpan={3} className="px-4 py-3">
                    Plateforme dédiée, email, messagerie, téléphone selon vos besoins
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bloc comparatif coût réel (existant) */}
          <section className="mt-10 rounded-2xl border-2 border-[#1d4ed8]/20 surface-metallic-light p-6 md:p-10">
            <h3 className="text-center text-xl font-bold text-black md:text-2xl">
              Recruter ou déléguer vos dossiers chantier ?
            </h3>
            <p className="mt-3 text-center text-sm text-black">
              Référence : salaire brut 2 200 €/mois (région parisienne). Coût réel = salaire + charges + avantages + bureau + RH.
            </p>
            <div className="mt-10 overflow-x-auto rounded-xl surface-metallic-light">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e0e4ea] bg-[#f8f9fb]">
                    <th className="px-4 py-3 font-semibold text-black">Poste / Base de calcul</th>
                    <th className="px-4 py-3 text-right font-semibold text-black">Coût min (€/mois)</th>
                    <th className="px-4 py-3 text-right font-semibold text-black">Coût max (€/mois)</th>
                    <th className="px-4 py-3 text-right font-semibold text-black">Coût moyen (€/mois)</th>
                  </tr>
                </thead>
                <tbody className="text-black">
                  <tr className="border-b border-[#e0e4ea] bg-[#f8f9fb]/50"><td colSpan={4} className="px-4 py-2 font-semibold text-black">1. Salaire & charges sociales</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Salaire brut mensuel</td><td className="px-4 py-2 text-right">2 200</td><td className="px-4 py-2 text-right">2 200</td><td className="px-4 py-2 text-right">2 200</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">13ème mois (proratisé/mois)</td><td className="px-4 py-2 text-right">183</td><td className="px-4 py-2 text-right">183</td><td className="px-4 py-2 text-right">183</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Charges patronales (~42 %)</td><td className="px-4 py-2 text-right">1 009</td><td className="px-4 py-2 text-right">1 009</td><td className="px-4 py-2 text-right">1 009</td></tr>
                  <tr className="border-b border-[#e0e4ea] bg-[#f8f9fb]/50"><td colSpan={4} className="px-4 py-2 font-semibold text-black">2. Avantages sociaux</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Tickets restaurant, mutuelle, transport, RTT…</td><td className="px-4 py-2 text-right">317</td><td className="px-4 py-2 text-right">384</td><td className="px-4 py-2 text-right">350</td></tr>
                  <tr className="border-b border-[#e0e4ea] bg-[#f8f9fb]/50"><td colSpan={4} className="px-4 py-2 font-semibold text-black">3. Matériel & bureau</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Loyer bureau, poste, logiciels…</td><td className="px-4 py-2 text-right">434</td><td className="px-4 py-2 text-right">788</td><td className="px-4 py-2 text-right">611</td></tr>
                  <tr className="border-b border-[#e0e4ea] bg-[#f8f9fb]/50"><td colSpan={4} className="px-4 py-2 font-semibold text-black">4. RH & indirects</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Recrutement, formation, management…</td><td className="px-4 py-2 text-right">341</td><td className="px-4 py-2 text-right">712</td><td className="px-4 py-2 text-right">527</td></tr>
                  <tr className="border-b-2 border-black bg-neutral-200 font-bold text-black">
                    <td className="px-4 py-3">Coût total mensuel réel</td><td className="px-4 py-3 text-right">4 638 €</td><td className="px-4 py-3 text-right">5 467 €</td><td className="px-4 py-3 text-right">5 053 €</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <div className="rounded-xl border border-[#c8cdd6] bg-[#f8f9fb] p-6">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-black">Assistant en CDI</h4>
                <p className="mt-4 text-3xl font-bold text-black">~5 050 € <span className="text-lg font-normal text-black">/mois</span></p>
                <p className="mt-1 text-black">soit ~60 600 € / an</p>
              </div>
              <div className="rounded-xl border-2 border-[#1d4ed8] bg-[#eff6ff] p-6">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-[#1d4ed8]">BeWork</h4>
                <p className="mt-4 text-3xl font-bold text-[#1d4ed8]">
                  {formatPriceLabelFr(PRICE_BOUNDS.low)} € à {formatPriceLabelFr(PRICE_BOUNDS.high)} €{" "}
                  <span className="text-xs font-semibold uppercase tracking-wide text-black">
                    {SUBSCRIPTION_PRICE_TAX_LABEL}
                  </span>{" "}
                  <span className="text-lg font-normal text-black">/ mois</span>
                </p>
                <p className="mt-1 text-black">Tout compris — sans frais cachés</p>
              </div>
            </div>
            <div className="mt-8 rounded-xl surface-metallic-light surface-metallic-light--soft border border-[#1d4ed8]/25 px-6 py-5 text-center text-black shadow-md">
              <p className="text-lg font-bold md:text-xl">
                Économie possible : jusqu&apos;à <span className="text-[#1d4ed8]">~75 %</span> par rapport au coût réel d&apos;un assistant en CDI.
              </p>
            </div>
          </section>
        </ComparatifReveal>

        {/* FAQ */}
        <section className="mt-14" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-xl font-bold text-black md:text-2xl">
            Questions fréquentes
          </h2>
          <ul className="mt-6 space-y-4">
            {faq.map(({ q, a }, i) => (
              <li key={i} className="rounded-xl surface-metallic-light">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-4 font-medium text-black focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:ring-inset [&::-webkit-details-marker]:hidden">
                    <span>{q}</span>
                    <span className="shrink-0 pl-2 text-black group-open:rotate-180">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </span>
                  </summary>
                  <div className="border-t border-[#e0e4ea] px-4 py-3 text-black">{a}</div>
                </details>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA bas de page */}
        <section className="mt-14 rounded-2xl border-2 border-[#1d4ed8]/30 bg-[#eff6ff] p-8 text-center md:p-10">
          <h2 className="text-xl font-bold text-black md:text-2xl">
            Faisons le point sur votre organisation
          </h2>
          <p className="mt-3 max-w-xl mx-auto text-sm leading-relaxed text-black md:text-base">
            Nous vérifions ensemble si notre accompagnement est adapté à votre activité.
          </p>
          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <CalendlyBookingLink
              className="w-full rounded-lg bg-[#1d4ed8] px-8 py-4 text-center font-semibold text-white shadow-md transition hover:bg-[#1e40af] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:ring-offset-2 sm:w-auto"
              aria-label="Échanger sur votre fonctionnement"
            >
              Échanger sur votre fonctionnement
            </CalendlyBookingLink>
            <Link
              href="/connexion"
              className="w-full rounded-lg surface-metallic-light px-8 py-4 text-center font-semibold text-[#1e293b] transition hover:bg-[#f8f9fb] sm:w-auto"
              aria-label="Déjà client ? Accéder"
            >
              Déjà client ? Accéder
            </Link>
          </div>
        </section>

        <div className="mt-10 flex justify-center">
          <Link
            href="/"
            className="text-sm font-medium text-black underline transition hover:text-black focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:ring-offset-2"
            aria-label="Retour à l'accueil"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>

      <StickyCtaMobile />
    </div>
  );
}
