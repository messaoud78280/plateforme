import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BtpBenefitsGrid } from "@/components/marketing-btp/BtpBenefitsGrid";
import { BtpCtaBand } from "@/components/marketing-btp/BtpCtaBand";
import { BtpExpertiseTerrain } from "@/components/marketing-btp/BtpExpertiseTerrain";
import { BtpFaq } from "@/components/marketing-btp/BtpFaq";
import { BtpIaSection } from "@/components/marketing-btp/BtpIaSection";
import { BtpMissionFlow } from "@/components/marketing-btp/BtpMissionFlow";
import { BtpPlatformShowcase } from "@/components/marketing-btp/BtpPlatformShowcase";
import { BtpUseCases } from "@/components/marketing-btp/BtpUseCases";
import "@/components/marketing-btp/btp-marketing.css";
import {
  BTP_CTA_CONDUCTEUR,
  BTP_CTA_EXPERTISES,
  BTP_CTA_PRIMARY,
  BTP_EXPERTISE_FAMILIES,
  BTP_FAQ,
  BTP_HOME_PROBLEMS,
  BTP_SEO_PAGES,
  BEWORK_BTP_HERO_SUBTITLE,
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
        { "@type": "Thing", name: "Conduite de travaux externalisée" },
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
    body: "Renforcez votre encadrement avec des missions contractualisées, périmètre et livrables définis.",
    href: "/conduite-de-travaux",
  },
  {
    title: "Coordination et pilotage TCE",
    body: "Organisez les interfaces, le phasage et le suivi des corps d’état pour sécuriser l’avancement.",
    href: "/pilotage-chantier",
  },
  {
    title: "Plateforme collaborative & IA",
    body: "Centralisez l’information et appuyez-vous sur des outils numériques conçus pour le terrain.",
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
  {
    title: "Mission de pilotage TCE",
    body: "Coordination inter-lots, interfaces et suivi d’avancement multi-intervenants.",
    href: "/demande-de-devis?besoin=pilotage_tce",
  },
  {
    title: "Audit de chantier",
    body: "Diagnostic organisationnel, points bloquants et plan d’action.",
    href: "/demande-de-devis?besoin=audit_redressement",
  },
  {
    title: "Assistance marchés publics",
    body: "Analyse DCE, études de prix, mémoire technique et constitution d’offre.",
    href: "/demande-de-devis?besoin=assistance_marches_publics",
  },
  {
    title: "Assistance marchés privés",
    body: "Appui à la consultation, au chiffrage et au suivi d’exécution privée.",
    href: "/demande-de-devis?besoin=assistance_marches_prives",
  },
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
        <section className="bw-btp-hero">
          <div className="bw-btp-container-wide grid items-center gap-10 py-12 lg:grid-cols-2 lg:gap-14 lg:py-16">
            <div>
              <p className="bw-btp-eyebrow">
                BEWORK — CONDUITE DE TRAVAUX & PILOTAGE TCE
              </p>
              <h1 className="mt-4 max-w-2xl font-bold tracking-tight">
                Un conducteur de travaux pour piloter vos chantiers.
              </h1>
              <p className="bw-btp-lead mt-5 max-w-2xl">{BEWORK_BTP_HERO_SUBTITLE}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={BTP_CTA_CONDUCTEUR.href} className="bw-btp-btn bw-btp-btn-primary">
                  {BTP_CTA_CONDUCTEUR.label}
                </Link>
                <Link href={BTP_CTA_EXPERTISES.href} className="bw-btp-btn bw-btp-btn-secondary">
                  {BTP_CTA_EXPERTISES.label}
                </Link>
              </div>
              <p className="mt-5 text-base text-[var(--btp-muted)]">
                Missions contractualisées · Périmètre et livrables définis ·
                Marchés publics et privés · Prestations sur devis
              </p>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[var(--btp-border)] bg-[var(--btp-soft)] shadow-[var(--btp-shadow)] lg:aspect-[5/4]">
              <Image
                src="/marketing/btp-hero-chantier.jpg"
                alt="Professionnel BTP consultant des plans sur un chantier — illustration d’ambiance, non présentée comme référence client BeWork"
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 560px"
              />
            </div>
          </div>
        </section>

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

        <section className="bw-btp-section" aria-labelledby="problems-title">
          <div className="bw-btp-container">
            <h2 id="problems-title" className="max-w-3xl font-bold">
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

        <section className="bw-btp-section bw-btp-section-alt" aria-labelledby="pros-title">
          <div className="bw-btp-container">
            <p className="bw-btp-eyebrow">Nos professionnels</p>
            <h2 id="pros-title" className="mt-2 font-bold">
              Le bon profil pour votre opération.
            </h2>
            <p className="mt-3 max-w-3xl text-base text-[var(--btp-muted)]">
              Prestations de mission — pas du travail temporaire ni du prêt de
              salariés. Périmètre, autonomie, responsabilités et livrables
              définis contractuellement.
            </p>
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

        <BtpExpertiseTerrain compact />

        <section className="bw-btp-section" aria-labelledby="tce-title">
          <div className="bw-btp-container">
            <p className="bw-btp-eyebrow">Tous corps d’état</p>
            <h2 id="tce-title" className="mt-2 font-bold">
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

        <BtpPlatformShowcase />
        <BtpIaSection />
        <BtpMissionFlow />
        <BtpUseCases />

        <section className="bw-btp-section bw-btp-section-alt" aria-labelledby="marches-title">
          <div className="bw-btp-container">
            <h2 id="marches-title" className="font-bold">
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

        <BtpBenefitsGrid />
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
