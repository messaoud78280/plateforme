import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BtpCtaBand } from "@/components/marketing-btp/BtpCtaBand";
import { BtpFaq } from "@/components/marketing-btp/BtpFaq";
import "@/components/marketing-btp/btp-marketing.css";
import {
  BTP_CTA_CONDUCTEUR,
  BTP_CTA_PRIMARY,
  BTP_EXPERTISE_FAMILIES,
  BTP_FAQ,
  BTP_HOME_PROBLEMS,
  BTP_METHOD_STEPS,
  BTP_SEO_PAGES,
  BEWORK_BTP_SIGNATURE,
  BEWORK_BTP_VALUE_PROPOSITION,
} from "@/lib/bework-btp-services";
import { buildMarketingPageMetadata } from "@/lib/seo-formation-pages";
import { SITE_URL } from "@/lib/site";

const home = BTP_SEO_PAGES.home;
export const metadata: Metadata = buildMarketingPageMetadata({
  path: home.path,
  title: home.title,
  absoluteTitle: home.absoluteTitle,
  description: home.description,
});

const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/#webpage`,
      url: SITE_URL,
      name: home.absoluteTitle,
      description: home.description,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: [
        { "@type": "Thing", name: "Conduite de travaux" },
        { "@type": "Thing", name: "Pilotage TCE" },
        { "@type": "Thing", name: "Gestion de chantier BTP" },
      ],
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "BeWork",
      url: SITE_URL,
      description: BEWORK_BTP_VALUE_PROPOSITION,
      areaServed: ["Yvelines", "Île-de-France", "France"],
    },
    {
      "@type": "Service",
      name: "Conduite de travaux externalisée",
      provider: { "@id": `${SITE_URL}/#organization` },
      description:
        "Prestations de conduite de travaux, encadrement opérationnel et coordination TCE.",
      areaServed: "FR",
    },
  ],
};

const pillars = [
  {
    title: "Conduite de travaux externalisée",
    body: "Renforcez votre encadrement avec des missions adaptées à vos chantiers et à votre charge d’activité.",
    href: "/conduite-de-travaux",
  },
  {
    title: "Coordination et pilotage TCE",
    body: "Organisez les interfaces, le phasage et le suivi des corps d’état pour sécuriser l’avancement.",
    href: "/pilotage-chantier",
  },
  {
    title: "Gestion numérique assistée par IA",
    body: "Centralisez l’information et appuyez-vous sur des outils IA internes pour préparer, suivre et rendre compte.",
    href: "/plateforme-ia",
  },
] as const;

const professionals = [
  {
    title: "Conducteur de travaux",
    body: "Préparation, planning, coordination, suivi budgétaire et reporting.",
    href: "/demande-de-devis?besoin=conducteur_travaux",
  },
  {
    title: "Chef de chantier",
    body: "Organisation quotidienne, encadrement terrain et contrôle d’exécution.",
    href: "/demande-de-devis?besoin=chef_chantier",
  },
  {
    title: "Directeur de travaux",
    body: "Supervision multi-opérations et appui au responsable d’exploitation.",
    href: "/demande-de-devis?besoin=direction_travaux",
  },
  {
    title: "Responsable méthodes et planning",
    body: "Méthodes d’exécution, phasage et planification des ressources.",
    href: "/demande-de-devis?besoin=pilotage_tce",
  },
] as const;

const benefits = [
  "Meilleure visibilité sur l’avancement",
  "Organisation renforcée",
  "Anticipation des difficultés",
  "Coordination plus fluide",
  "Suivi documenté",
  "Maîtrise des coûts",
  "Décisions plus rapides",
] as const;

export default function HomePage() {
  return (
    <div className="bw-btp-site min-h-screen min-w-0 overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <MarketingSiteHeader plainBg />
      <main>
        {/* Hero clair */}
        <section className="bw-btp-hero">
          <div className="bw-btp-container-wide grid items-center gap-10 py-12 lg:grid-cols-2 lg:gap-14 lg:py-16">
            <div>
              <p className="bw-btp-eyebrow">
                BEWORK — CONDUITE DE TRAVAUX & PILOTAGE TCE
              </p>
              <h1 className="mt-4 max-w-2xl font-bold tracking-tight">
                Un conducteur de travaux pour piloter vos chantiers.
              </h1>
              <p className="bw-btp-lead mt-5 max-w-2xl">
                Renforcez votre organisation avec nos prestations de conduite de
                travaux, d’encadrement opérationnel et de coordination TCE. Nos
                professionnels s’appuient sur nos propres outils IA et notre
                plateforme collaborative pour maîtriser les délais, les coûts et
                l’avancement de vos opérations.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={BTP_CTA_CONDUCTEUR.href} className="bw-btp-btn bw-btp-btn-primary">
                  {BTP_CTA_CONDUCTEUR.label}
                </Link>
                <Link href="/conduite-de-travaux" className="bw-btp-btn bw-btp-btn-secondary">
                  Découvrir nos prestations
                </Link>
              </div>
              <p className="mt-5 text-base text-[var(--btp-muted)]">
                Interventions ponctuelles ou suivies · Marchés publics et privés ·
                Prestations sur devis
              </p>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[var(--btp-border)] bg-[var(--btp-soft)] shadow-[var(--btp-shadow)] lg:aspect-[5/4]">
              <Image
                src="/marketing/btp-hero-chantier.jpg"
                alt="Conducteur de travaux consultant des plans sur un chantier BTP"
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 560px"
              />
            </div>
          </div>
        </section>

        {/* Présentation */}
        <section className="bw-btp-section bw-btp-section-alt" aria-labelledby="pillars-title">
          <div className="bw-btp-container">
            <p className="bw-btp-eyebrow">BeWork</p>
            <h2 id="pillars-title" className="mt-2 max-w-3xl font-bold">
              Votre renfort opérationnel pour vos projets BTP.
            </h2>
            <p className="bw-btp-lead mt-4 max-w-2xl">{BEWORK_BTP_VALUE_PROPOSITION}</p>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {pillars.map((p) => (
                <Link
                  key={p.title}
                  href={p.href}
                  className="bw-btp-card block transition hover:border-[rgba(197,155,88,0.45)]"
                >
                  <h3 className="text-lg font-bold">{p.title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-[var(--btp-muted)]">{p.body}</p>
                  <span className="mt-5 inline-block text-base font-semibold text-[var(--btp-steel)]">
                    En savoir plus →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Problèmes */}
        <section className="bw-btp-section" aria-labelledby="problems-title">
          <div className="bw-btp-container">
            <h2 id="problems-title" className="max-w-3xl text-3xl font-bold sm:text-4xl">
              Vos chantiers exigent du temps, des compétences et une organisation
              rigoureuse.
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {BTP_HOME_PROBLEMS.map((item) => (
                <div key={item.problem} className="bw-btp-card">
                  <p className="font-semibold text-[var(--btp-night)]">{item.problem}</p>
                  <p className="mt-2 text-base leading-relaxed text-[var(--btp-muted)]">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Professionnels */}
        <section className="bw-btp-section bw-btp-section-alt" aria-labelledby="pros-title">
          <div className="bw-btp-container">
            <p className="bw-btp-eyebrow">Nos professionnels</p>
            <h2 id="pros-title" className="mt-2 text-3xl font-bold sm:text-4xl">
              Le bon profil pour votre opération.
            </h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {professionals.map((p) => (
                <div key={p.title} className="bw-btp-card flex flex-col">
                  <h3 className="text-lg font-bold">{p.title}</h3>
                  <p className="mt-3 flex-1 text-base text-[var(--btp-muted)]">{p.body}</p>
                  <Link
                    href={p.href}
                    className="mt-5 text-base font-semibold text-[var(--btp-steel)] hover:underline"
                  >
                    Demander une mission →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TCE */}
        <section className="bw-btp-section" aria-labelledby="tce-title">
          <div className="bw-btp-container">
            <p className="bw-btp-eyebrow">Tous corps d’état</p>
            <h2 id="tce-title" className="mt-2 text-3xl font-bold sm:text-4xl">
              Une vision globale des travaux.
            </h2>
            <p className="mt-4 max-w-2xl text-[var(--btp-muted)]">
              Domaines d’intervention et de coordination possibles — les
              expertises mobilisées sont précisées contractuellement selon la
              mission.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {BTP_EXPERTISE_FAMILIES.map((f) => (
                <span
                  key={f.id}
                  className="rounded-md border border-[var(--btp-border)] bg-white px-3.5 py-2 text-base font-medium text-[var(--btp-heading)]"
                >
                  {f.title}
                </span>
              ))}
            </div>
            <div className="mt-8">
              <Link href="/expertises-tce" className="bw-btp-btn bw-btp-btn-primary">
                Voir nos expertises TCE
              </Link>
            </div>
          </div>
        </section>

        {/* Différence numérique */}
        <section className="bw-btp-section bw-btp-section-soft" aria-labelledby="diff-title">
          <div className="bw-btp-container">
            <p className="bw-btp-eyebrow">Notre différence</p>
            <h2 id="diff-title" className="mt-2 max-w-3xl text-3xl font-bold sm:text-4xl">
              Le terrain, la méthode et l’intelligence artificielle.
            </h2>
            <p className="bw-btp-lead mt-4 max-w-2xl">
              {BEWORK_BTP_SIGNATURE}. Information centralisée, collaboration,
              suivi des délais et des coûts, rapports structurés, assistance IA
              et traçabilité — sous contrôle humain.
            </p>
            <div className="mt-10 rounded-xl border border-[var(--btp-border)] bg-white p-5 sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--btp-steel)]">
                Exemple fictif — suivi d’opération
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { k: "Avancement", v: "68 %" },
                  { k: "Actions en attente", v: "7" },
                  { k: "Écart planning", v: "−3 j" },
                  { k: "Alertes", v: "2" },
                ].map((m) => (
                  <div key={m.k} className="bw-btp-metric">
                    <p className="bw-btp-metric-label">{m.k}</p>
                    <p className="bw-btp-metric-value">{m.v}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-base text-[var(--btp-muted)]">
                Simulation visuelle à des fins de démonstration — ne correspond
                pas à un chantier client réel.
              </p>
            </div>
            <div className="mt-8">
              <Link href="/plateforme-ia" className="bw-btp-btn bw-btp-btn-primary">
                Découvrir notre plateforme
              </Link>
            </div>
          </div>
        </section>

        {/* Marchés */}
        <section className="bw-btp-section bw-btp-section-alt" aria-labelledby="marches-title">
          <div className="bw-btp-container">
            <h2 id="marches-title" className="text-3xl font-bold sm:text-4xl">
              Nous intervenons avant, pendant et après les travaux.
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                {
                  t: "Études et réponses aux marchés",
                  b: "Analyse DCE, études de prix, mémoire technique et constitution d’offre.",
                },
                {
                  t: "Préparation et pilotage du chantier",
                  b: "Méthodes, planning, coordination et suivi opérationnel.",
                },
                {
                  t: "Suivi financier et réception",
                  b: "Situations, écarts, DOE et assistance aux opérations de réception.",
                },
              ].map((s) => (
                <div key={s.t} className="bw-btp-card">
                  <h3 className="text-lg font-bold">{s.t}</h3>
                  <p className="mt-3 text-base text-[var(--btp-muted)]">{s.b}</p>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link href="/marches-publics-prives" className="bw-btp-btn bw-btp-btn-secondary-dark">
                Voir l’offre marchés
              </Link>
            </div>
          </div>
        </section>

        {/* Méthode */}
        <section className="bw-btp-section" aria-labelledby="method-title">
          <div className="bw-btp-container">
            <p className="bw-btp-eyebrow">Méthodologie</p>
            <h2 id="method-title" className="mt-2 text-3xl font-bold sm:text-4xl">
              Six étapes pour une mission claire.
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {BTP_METHOD_STEPS.map((step) => (
                <div key={step.n} className="bw-btp-card">
                  <p className="text-base font-bold text-[var(--btp-copper)]">{step.n}</p>
                  <h3 className="mt-2 text-lg font-bold">{step.title}</h3>
                  <p className="mt-2 text-base text-[var(--btp-muted)]">{step.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link href="/notre-methode" className="bw-btp-btn bw-btp-btn-secondary-dark">
                Notre méthode en détail
              </Link>
            </div>
          </div>
        </section>

        {/* Bénéfices */}
        <section className="bw-btp-section bw-btp-section-alt" aria-labelledby="benefits-title">
          <div className="bw-btp-container">
            <h2 id="benefits-title" className="text-3xl font-bold sm:text-4xl">
              Objectifs de prestation.
            </h2>
            <p className="mt-3 max-w-2xl text-[var(--btp-muted)]">
              Ces bénéfices décrivent les finalités recherchées — ce ne sont pas
              des résultats garantis.
            </p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {benefits.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-3 rounded-lg border border-[var(--btp-border)] bg-white px-4 py-3 text-base font-medium text-[var(--btp-heading)]"
                >
                  <span className="mt-0.5 text-[var(--btp-copper)]" aria-hidden>
                    ✓
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <BtpFaq items={BTP_FAQ} title="FAQ — prestations BTP" />
        <BtpCtaBand
          ctaHref={BTP_CTA_PRIMARY.href}
          ctaLabel="Demander un devis personnalisé"
        />
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
