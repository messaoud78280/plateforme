import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { ComparatifReveal } from "@/components/tarifs/ComparatifReveal";
import { StickyCtaMobile } from "@/components/tarifs/StickyCtaMobile";
import { TARIFS_PLANS } from "@/lib/tarifs-plans";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const tarifsUrl = absoluteUrl("/tarifs");
const tarifsOgImage = absoluteUrl("/opengraph-image");

function formatPriceTtc(value: string) {
  const n = parseInt(value.replace(/\s/g, ""), 10);
  if (Number.isNaN(n)) return value;
  return n.toLocaleString("fr-FR");
}

export const metadata: Metadata = {
  title: "Forfaits administratifs BTP — cadre et valeur | BeWork",
  description:
    "Structure, Suivi, Renfort et Pilotage : forfaits mensuels TTC pour entreprises du bâtiment. Cadre, suivi structuré, pilotage encadré en France.",
  alternates: { canonical: tarifsUrl, languages: { fr: tarifsUrl, "x-default": tarifsUrl } },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: tarifsUrl,
    siteName: "BeWork",
    title: "Tarifs BeWork — partenaire administratif structuré",
    description:
      "Quatre niveaux de structuration administrative pour le BTP. Tarifs TTC mensuels, sans frais cachés.",
    images: [
      {
        url: tarifsOgImage,
        width: 1200,
        height: 630,
        alt: "Forfaits administratifs BeWork pour le BTP",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tarifs BeWork",
    description: "Forfaits administratifs pour le BTP — cadre TTC, sans frais cachés.",
  },
  robots: { index: true, follow: true },
};

const plans = TARIFS_PLANS;

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
    title: "Cadrage & démarrage",
    desc: "Rôles, canaux, outils, rituels de pilotage : tout est posé par écrit avant l’exécution. Les accès et le périmètre sont validés ensemble.",
  },
  {
    title: "Exécution & pilotage",
    desc: "Missions traitées dans le cadre convenu, avec reporting et ajustements lorsque l’activité évolue.",
  },
];

const faq = [
  { q: "Les prix sont-ils TTC ?", a: "Oui. Tous nos tarifs sont exprimés TTC, sans frais supplémentaires. La lisibilité du montant fait partie du cadre que nous proposons aux entreprises du bâtiment." },
  { q: "Qu'est-ce qu'un périmètre ?", a: "Un périmètre correspond à un domaine de mission (ex. commercial, organisation, suivi réglementaire). Les tarifs indiqués couvrent jusqu'à deux périmètres. Au-delà, nous établissons un devis personnalisé." },
  { q: "Comment sont protégées mes données ?", a: "Confidentialité et accès sont traités dans un cadre strict, avec des canaux dédiés. Nous pouvons préciser nos engagements lors du cadrage initial." },
  { q: "Quels sont les horaires et délais ?", a: "L’équipe travaille du lundi au vendredi sur le fuseau français. Les délais dépendent du type de demande et du forfait ; les urgences chantier sont priorisées dans le cadre de votre offre." },
  { q: "Avec quels outils travaillez-vous ?", a: "Nous intervenons dans votre environnement (Google, Microsoft, CRM, messageries, logiciels métiers) lorsque vous nous donnez les accès nécessaires. La plateforme BeWork centralise consignes, statuts et livrables." },
  { q: "Y a-t-il un engagement ou une durée minimale ?", a: "Les modalités figurent au contrat. L’idée est un cadre clair des deux côtés, sans surprise sur la résiliation ou le renouvellement." },
  { q: "Peut-on monter en charge progressivement ?", a: "Oui. Beaucoup de structures démarrent par Structure ou Suivi, puis passent à Renfort ou Pilotage lorsque l’activité augmente." },
  { q: "Que se passe-t-il en cas d’indisponibilité ?", a: "La continuité de service est organisée : remplacement ou réaffectation selon les cas. Le détail est contractuel." },
  { q: "Comment s’organisent les échanges ?", a: "Canal principal : la plateforme (messagerie, statuts, pièces). Email ou appel en complément si c’est cadré ensemble à l’onboarding." },
];

const tarifsStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ItemList",
      "@id": `${tarifsUrl}#plans`,
      name: "Forfaits administratifs BeWork — BTP",
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
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] via-[#eef0f4] to-[#e0e4ea] pb-24 md:pb-16">
      <MarketingSiteHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(tarifsStructuredData) }}
      />

      <main className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        {/* Hero */}
        <section className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl md:leading-tight">
            Un cadre administratif adapté à votre niveau d&apos;activité
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-lg leading-relaxed text-[#334155]">
            Chaque offre correspond à un niveau de structuration et de suivi. L&apos;objectif n&apos;est pas de faire plus,
            mais de faire mieux, avec méthode — pour les entreprises du bâtiment qui veulent tenir leurs dossiers sans
            alourdir leur structure.
          </p>
          <p className="mt-4 text-sm font-semibold text-[#0f172a]">
            Tous nos tarifs sont exprimés TTC / mois, sans frais supplémentaires.
          </p>
          {/* Réassurance */}
          <ul className="mt-8 flex flex-wrap justify-center gap-4 md:gap-6" role="list">
            {reassurance.map(({ label, desc }) => (
              <li
                key={label}
                className="rounded-lg surface-metallic-light px-4 py-3 text-center"
              >
                <span className="block font-semibold text-[#0f172a]">{label}</span>
                <span className="block text-sm text-[#64748b]">{desc}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Cartes pricing */}
        <section className="mt-14" aria-labelledby="offres-heading">
          <h2 id="offres-heading" className="sr-only">
            Nos offres
          </h2>
          <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:items-stretch lg:gap-5">
            {plans.map((plan) => {
              const isFeatured = plan.planKey === "STANDARD";
              return (
              <article
                key={plan.name}
                className={`relative flex flex-col rounded-xl border-2 surface-metallic-light surface-metallic-light--badge-pill transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                  isFeatured
                    ? "z-10 border-[#1d4ed8] py-7 shadow-md shadow-[#1d4ed8]/15 ring-2 ring-[#1d4ed8]/30 md:px-7 md:py-8 lg:scale-[1.03]"
                    : plan.badge
                      ? "border-[#1d4ed8]/80 py-6 shadow-sm shadow-[#1d4ed8]/10"
                      : "border-[#c8cdd6] py-6 hover:border-[#94a3b8]"
                } px-5`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#1d4ed8] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-[0_2px_8px_rgba(29,78,216,0.4)]">
                    {plan.badge}
                  </span>
                )}
                <h3 className="border-b border-[#e2e8f0] pb-3 text-lg font-semibold tracking-tight text-[#0f172a]">
                  {plan.name}
                </h3>
                <div className="mt-5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
                  <span className="text-3xl font-bold tracking-tight text-[#1d4ed8] tabular-nums md:text-[2.125rem]">
                    {formatPriceTtc(plan.price)}
                  </span>
                  <span className="text-xl font-semibold text-[#0f172a]">€</span>
                  <span className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-[#64748b]">TTC</span>
                  {plan.billing === "monthly" && (
                    <span className="text-base font-semibold text-[#64748b]">/ mois</span>
                  )}
                </div>
                <div className="mt-2.5" aria-label="Repère indicatif de charge">
                  <p className="text-[11px] leading-snug text-[#64748b] md:text-xs md:leading-relaxed">
                    <span className="block font-normal">{plan.equivalentNote.line1}</span>
                    <span className="mt-0.5 block font-normal text-[#94a3b8]">{plan.equivalentNote.line2}</span>
                  </p>
                </div>
                <p className="mt-4 border-t border-[#e2e8f0] pt-4 text-sm font-medium leading-relaxed text-[#0f172a]">
                  {plan.tagline}
                </p>
                {plan.detail ? (
                  <p className="mt-3 text-sm leading-relaxed text-[#334155]">{plan.detail}</p>
                ) : null}
                <ul className="mt-5 space-y-1.5 text-[11px] leading-relaxed text-[#64748b]" aria-label="Garanties tarifaires">
                  <li>TTC, sans frais cachés</li>
                  <li>Cadre contractuel clair</li>
                  <li>Démarrage après cadrage</li>
                </ul>
                <ul className="mt-5 flex-1 space-y-3 text-sm leading-snug text-[#334155]" role="list">
                  {plan.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-[10px] font-bold text-[#1d4ed8]" aria-hidden>
                        ✓
                      </span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 border-t border-[#f1f5f9] pt-4 text-xs leading-relaxed text-[#64748b]">
                  <span className="font-medium text-[#475569]">Idéal pour :</span> {plan.idealFor}
                </p>
                <Link
                  href="/contact"
                  className="mt-5 block w-full rounded-lg bg-[#1d4ed8] py-3 text-center text-sm font-semibold text-white transition hover:bg-[#1e40af]"
                >
                  Demander un cadrage
                </Link>
              </article>
              );
            })}
          </div>
          <div className="mx-auto mt-10 max-w-2xl px-2 text-center">
            <p className="text-[11px] font-normal leading-relaxed text-[#64748b] md:text-xs">
              Les volumes indiqués sont des repères estimatifs.
            </p>
            <p className="mt-2 text-[11px] font-normal leading-relaxed text-[#64748b] md:text-xs">
              Notre approche repose sur un cadre de travail structuré et un niveau de suivi adapté à votre activité, et non sur
              une logique horaire stricte.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-3xl rounded-xl border border-[#e0e4ea] bg-[#f8fafc] px-6 py-6 text-center md:px-8 md:py-7">
            <p className="text-sm font-medium leading-relaxed text-[#0f172a] md:text-base">
              Nos offres s&apos;adressent à des entreprises du bâtiment en activité réelle, souhaitant structurer leur
              organisation administrative.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#334155] md:text-[0.9375rem]">
              Elles ne sont pas adaptées à des besoins ponctuels ou à une logique de prestation à la demande.
            </p>
          </div>

          <section className="mx-auto mt-14 max-w-3xl" aria-labelledby="quelle-offre-heading">
            <h2 id="quelle-offre-heading" className="text-center text-xl font-bold tracking-tight text-[#0f172a] md:text-2xl">
              Quelle offre choisir ?
            </h2>
            <ul className="mt-8 space-y-5 text-left text-[#334155]">
              <li className="rounded-xl border border-[#e2e8f0] bg-white/80 px-5 py-4 shadow-sm">
                <span className="font-semibold text-[#0f172a]">Structure</span>
                <span className="mt-1 block text-sm leading-relaxed">
                  Si votre administratif est encore irrégulier et peu structuré.
                </span>
              </li>
              <li className="rounded-xl border border-[#e2e8f0] bg-white/80 px-5 py-4 shadow-sm">
                <span className="font-semibold text-[#0f172a]">Suivi</span>
                <span className="mt-1 block text-sm leading-relaxed">
                  Si vous avez une activité continue avec besoin de suivi fiable.
                </span>
              </li>
              <li className="rounded-xl border border-[#e2e8f0] bg-white/80 px-5 py-4 shadow-sm">
                <span className="font-semibold text-[#0f172a]">Renfort</span>
                <span className="mt-1 block text-sm leading-relaxed">
                  Si vous gérez plusieurs dossiers ou chantiers en parallèle.
                </span>
              </li>
              <li className="rounded-xl border border-[#e2e8f0] bg-white/80 px-5 py-4 shadow-sm">
                <span className="font-semibold text-[#0f172a]">Pilotage</span>
                <span className="mt-1 block text-sm leading-relaxed">
                  Si vous souhaitez déléguer avec un niveau de suivi élevé et structuré.
                </span>
              </li>
            </ul>
          </section>

          <div className="mx-auto mt-14 max-w-3xl rounded-xl border border-[#cbd5e1] bg-[#f1f5f9]/60 px-6 py-7 text-center md:px-10">
            <p className="text-sm leading-relaxed text-[#334155] md:text-base">
              BeWork ne propose pas une prestation administrative classique.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-[#334155] md:text-[0.9375rem]">
              Nous mettons en place un cadre de travail structuré, adapté aux réalités du terrain, afin de garantir un suivi
              fiable et durable.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-[#334155] md:text-[0.9375rem]">
              Notre approche s&apos;adresse à des professionnels du bâtiment qui souhaitent organiser leur activité, pas
              simplement déléguer des tâches.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-2xl space-y-2 rounded-xl border border-[#e0e4ea] bg-[#f8fafc] px-6 py-5 text-center">
            <p className="text-sm font-medium text-[#0f172a]">
              Externaliser avec un cadre défini évite de porter seul salaire, charges et management d&apos;un poste interne à
              temps plein.
            </p>
            <p className="text-sm text-[#334155]">
              Vous choisissez un niveau d&apos;accompagnement cohérent avec votre charge — pas une relation informelle ni une
              disponibilité illimitée.
            </p>
            <p className="text-xs text-[#64748b]">Tous nos tarifs sont exprimés TTC / mois, sans frais supplémentaires.</p>
          </div>
          <p className="mt-6 max-w-2xl mx-auto text-center text-sm text-[#334155]">
            *Tarifs valables pour 2 périmètres maximum. Pour 3 périmètres ou plus, contactez-nous pour un tarif personnalisé.
          </p>
          <p className="mt-6 max-w-3xl mx-auto text-center text-sm text-[#64748b] leading-relaxed">
            BeWork fournit une prestation d&apos;organisation et d&apos;assistance administrative externalisée, encadrée par
            contrat. La relation est celle d&apos;un partenaire de pilotage, pas d&apos;un simple portage de personnel.
          </p>

          {/* Solution dédiée — Full-time */}
          <section className="mt-12 rounded-2xl border-2 border-[#1e293b] bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-8 md:p-10 text-white shadow-xl" aria-labelledby="solution-dediee-heading">
            <h2 id="solution-dediee-heading" className="text-2xl font-bold tracking-tight md:text-3xl">
              Besoin d&apos;un volume plus important ?
            </h2>
            <p className="mt-4 max-w-2xl text-[#e2e8f0] leading-relaxed">
              Nous proposons également des solutions dédiées pour les entreprises ayant des besoins administratifs plus importants.
            </p>
            <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <ul className="space-y-3 text-[#e2e8f0]" role="list">
                  {["Capacité sur mesure", "Interlocuteur dédié", "Organisation adaptée à votre entreprise", "Priorité maximale"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="text-[#60a5fa]" aria-hidden>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <p className="font-semibold text-white">Full-time</p>
                  <p className="mt-1 text-sm text-[#cbd5e1] leading-relaxed">
                    Une solution sur mesure pour les entreprises souhaitant externaliser une grande partie de leur gestion administrative.
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#93c5fd]">
                    Solution idéale pour les entreprises qui souhaitent externaliser durablement leur gestion administrative.
                  </p>
                </div>
                <Link
                  href="/contact"
                  className="mt-6 inline-flex rounded-lg bg-white px-6 py-3 font-semibold text-[#0f172a] shadow-md transition hover:bg-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#1e293b]"
                >
                  Étudier un volume sur mesure
                </Link>
              </div>
              <div className="shrink-0 rounded-xl border border-[#334155] bg-[#1e293b]/80 px-6 py-4 lg:ml-8">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#94a3b8]">Solution sur mesure</p>
                <p className="mt-1 text-lg font-bold text-white">Full-time</p>
                <p className="mt-1 text-sm text-[#cbd5e1]">Devis personnalisé</p>
              </div>
            </div>
          </section>

          {/* Conciergerie — sur devis */}
          <div className="mt-10 rounded-xl border-2 border-[#1d4ed8]/30 bg-[#eff6ff] p-6 text-center">
            <h3 className="text-xl font-bold text-[#0f172a]">Service de conciergerie</h3>
            <p className="mt-2 text-[#334155]">
              Réservation hôtel, voiture, restaurant, organisation de déplacements… À distance : recherches, appels et mails en votre nom, sans déplacement. Sur devis personnalisé, disponible 24h/24.
            </p>
            <Link
              href="/contact"
              className="mt-4 inline-block rounded-lg bg-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1e40af]"
            >
              Demander un devis
            </Link>
          </div>
        </section>

        {/* Ce qui est inclus */}
        <section className="mt-14 rounded-2xl surface-metallic-light p-8" aria-labelledby="inclus-heading">
          <h2 id="inclus-heading" className="text-xl font-bold text-[#0f172a] md:text-2xl">
            Ce qui est inclus
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3" role="list">
            {inclus.map((item) => (
              <li key={item} className="flex items-center gap-2 text-[#334155]">
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

        {/* Comment ça marche */}
        <section className="mt-14" aria-labelledby="process-heading">
          <h2 id="process-heading" className="text-xl font-bold text-[#0f172a] md:text-2xl">
            Comment ça marche
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {etapes.map((e, i) => (
              <div key={i} className="rounded-xl surface-metallic-light p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1d4ed8] text-lg font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold text-[#0f172a]">{e.title}</h3>
                <p className="mt-2 text-sm text-[#334155]">{e.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA principal */}
        <div className="mt-14 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/contact"
            className="w-full rounded-lg bg-[#1d4ed8] px-8 py-4 text-center font-semibold text-white shadow-md transition hover:bg-[#1e40af] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:ring-offset-2 sm:w-auto"
            aria-label="Demande de contact et rendez-vous"
          >
            Échanger sur votre fonctionnement
          </Link>
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
          {/* Tableau des offres Essentiel / Standard / Renfort / Pilotage */}
          <div className="overflow-x-auto rounded-xl surface-metallic-light">
            <table className="w-full min-w-[500px] text-left text-sm" role="grid">
              <caption className="sr-only">Comparatif des offres BeWork</caption>
              <thead>
                <tr className="border-b border-[#e0e4ea] bg-[#f8f9fb]">
                  <th className="px-4 py-3 font-semibold text-[#0f172a]">Critère</th>
                  <th className="px-4 py-3 font-semibold text-[#0f172a]">Structure</th>
                  <th className="px-4 py-3 font-semibold text-[#0f172a]">Suivi</th>
                  <th className="px-4 py-3 font-semibold text-[#0f172a]">Renfort</th>
                  <th className="px-4 py-3 font-semibold text-[#0f172a]">Pilotage</th>
                </tr>
              </thead>
              <tbody className="text-[#334155]">
                <tr className="border-b border-[#e0e4ea]">
                  <td className="px-4 py-3">Prix TTC / mois</td>
                  <td className="px-4 py-3">
                    <span className="tarif-emphase text-[#0f172a]">290</span> € TTC
                  </td>
                  <td className="px-4 py-3">
                    <span className="tarif-emphase text-[#0f172a]">490</span> € TTC
                  </td>
                  <td className="px-4 py-3">
                    <span className="tarif-emphase text-[#0f172a]">790</span> € TTC
                  </td>
                  <td className="px-4 py-3">
                    <span className="tarif-emphase text-[#0f172a]">1 190</span> € TTC
                  </td>
                </tr>
                <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-3">Niveau d&apos;accompagnement</td><td className="px-4 py-3">Charge adaptée</td><td className="px-4 py-3">Suivi structuré</td><td className="px-4 py-3">Volume maîtrisé renforcé</td><td className="px-4 py-3">Capacité maximale</td></tr>
                <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-3">Abonnement</td><td className="px-4 py-3">Oui</td><td className="px-4 py-3">Oui</td><td className="px-4 py-3">Oui</td><td className="px-4 py-3">Oui</td></tr>
                <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-3">Priorité de traitement</td><td className="px-4 py-3">Standard</td><td className="px-4 py-3">Standard</td><td className="px-4 py-3">Priorité</td><td className="px-4 py-3">Priorité élevée</td></tr>
                <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-3">Périmètres inclus</td><td colSpan={4} className="px-4 py-3">Max 2 (au-delà : devis sur mesure)</td></tr>
                <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-3">Support / pilotage</td><td colSpan={4} className="px-4 py-3">Pilotage en France, points de suivi réguliers</td></tr>
                <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-3">Canaux</td><td colSpan={4} className="px-4 py-3">Plateforme dédiée, email, messagerie, téléphone selon vos besoins</td></tr>
              </tbody>
            </table>
          </div>

          {/* Bloc comparatif coût réel (existant) */}
          <section className="mt-10 rounded-2xl border-2 border-[#1d4ed8]/20 surface-metallic-light p-6 md:p-10">
            <h3 className="text-center text-xl font-bold text-[#0f172a] md:text-2xl">
              Comparatif : coût d&apos;un poste administratif interne vs forfait externalisé
            </h3>
            <p className="mt-3 text-center text-sm text-[#64748b]">
              Référence : salaire brut 2 200 €/mois (région parisienne). Coût réel = salaire + charges + avantages + bureau + RH.
            </p>
            <div className="mt-10 overflow-x-auto rounded-xl surface-metallic-light">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e0e4ea] bg-[#f8f9fb]">
                    <th className="px-4 py-3 font-semibold text-[#0f172a]">Poste / Base de calcul</th>
                    <th className="px-4 py-3 text-right font-semibold text-[#0f172a]">Coût min (€/mois)</th>
                    <th className="px-4 py-3 text-right font-semibold text-[#0f172a]">Coût max (€/mois)</th>
                    <th className="px-4 py-3 text-right font-semibold text-[#0f172a]">Coût moyen (€/mois)</th>
                  </tr>
                </thead>
                <tbody className="text-[#334155]">
                  <tr className="border-b border-[#e0e4ea] bg-[#f8f9fb]/50"><td colSpan={4} className="px-4 py-2 font-semibold text-[#0f172a]">1. Salaire & charges sociales</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Salaire brut mensuel</td><td className="px-4 py-2 text-right">2 200</td><td className="px-4 py-2 text-right">2 200</td><td className="px-4 py-2 text-right">2 200</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">13ème mois (proratisé/mois)</td><td className="px-4 py-2 text-right">183</td><td className="px-4 py-2 text-right">183</td><td className="px-4 py-2 text-right">183</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Charges patronales (~42 %)</td><td className="px-4 py-2 text-right">1 009</td><td className="px-4 py-2 text-right">1 009</td><td className="px-4 py-2 text-right">1 009</td></tr>
                  <tr className="border-b border-[#e0e4ea] bg-[#f8f9fb]/50"><td colSpan={4} className="px-4 py-2 font-semibold text-[#0f172a]">2. Avantages sociaux</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Tickets restaurant, mutuelle, transport, RTT…</td><td className="px-4 py-2 text-right">317</td><td className="px-4 py-2 text-right">384</td><td className="px-4 py-2 text-right">350</td></tr>
                  <tr className="border-b border-[#e0e4ea] bg-[#f8f9fb]/50"><td colSpan={4} className="px-4 py-2 font-semibold text-[#0f172a]">3. Matériel & bureau</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Loyer bureau, poste, logiciels…</td><td className="px-4 py-2 text-right">434</td><td className="px-4 py-2 text-right">788</td><td className="px-4 py-2 text-right">611</td></tr>
                  <tr className="border-b border-[#e0e4ea] bg-[#f8f9fb]/50"><td colSpan={4} className="px-4 py-2 font-semibold text-[#0f172a]">4. RH & indirects</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Recrutement, formation, management…</td><td className="px-4 py-2 text-right">341</td><td className="px-4 py-2 text-right">712</td><td className="px-4 py-2 text-right">527</td></tr>
                  <tr className="border-b-2 border-[#0f172a] bg-[#0f172a] font-bold text-white">
                    <td className="px-4 py-3">Coût total mensuel réel</td><td className="px-4 py-3 text-right">4 638 €</td><td className="px-4 py-3 text-right">5 467 €</td><td className="px-4 py-3 text-right">5 053 €</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <div className="rounded-xl border border-[#c8cdd6] bg-[#f8f9fb] p-6">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-[#64748b]">Assistant en CDI</h4>
                <p className="mt-4 text-3xl font-bold text-[#0f172a]">~5 050 € <span className="text-lg font-normal text-[#64748b]">/mois</span></p>
                <p className="mt-1 text-[#334155]">soit ~60 600 € / an</p>
              </div>
              <div className="rounded-xl border-2 border-[#1d4ed8] bg-[#eff6ff] p-6">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-[#1d4ed8]">BeWork</h4>
                <p className="mt-4 text-3xl font-bold text-[#1d4ed8]">
                  290 € à 1 190 € <span className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">TTC</span>{" "}
                  <span className="text-lg font-normal text-[#64748b]">/ mois</span>
                </p>
                <p className="mt-1 text-[#334155]">Tout compris — sans frais cachés</p>
              </div>
            </div>
            <div className="mt-8 rounded-xl bg-[#0f172a] px-6 py-5 text-center text-white">
              <p className="text-lg font-bold md:text-xl">
                Économie possible : jusqu&apos;à <span className="text-[#60a5fa]">~75 %</span> par rapport au coût réel d&apos;un assistant en CDI.
              </p>
            </div>
          </section>
        </ComparatifReveal>

        {/* FAQ */}
        <section className="mt-14" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-xl font-bold text-[#0f172a] md:text-2xl">
            Questions fréquentes
          </h2>
          <ul className="mt-6 space-y-4">
            {faq.map(({ q, a }, i) => (
              <li key={i} className="rounded-xl surface-metallic-light">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-4 font-medium text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:ring-inset [&::-webkit-details-marker]:hidden">
                    <span>{q}</span>
                    <span className="shrink-0 pl-2 text-[#64748b] group-open:rotate-180">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </span>
                  </summary>
                  <div className="border-t border-[#e0e4ea] px-4 py-3 text-[#334155]">{a}</div>
                </details>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA bas de page */}
        <section className="mt-14 rounded-2xl border-2 border-[#1d4ed8]/30 bg-[#eff6ff] p-8 text-center md:p-10">
          <h2 className="text-xl font-bold text-[#0f172a] md:text-2xl">
            Faisons le point sur votre organisation
          </h2>
          <p className="mt-3 max-w-xl mx-auto text-sm leading-relaxed text-[#334155] md:text-base">
            Nous vérifions ensemble si notre accompagnement est adapté à votre activité.
          </p>
          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/contact"
              className="w-full rounded-lg bg-[#1d4ed8] px-8 py-4 text-center font-semibold text-white shadow-md transition hover:bg-[#1e40af] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:ring-offset-2 sm:w-auto"
              aria-label="Échanger sur votre fonctionnement"
            >
              Échanger sur votre fonctionnement
            </Link>
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
            className="text-sm font-medium text-[#64748b] underline transition hover:text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:ring-offset-2"
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
