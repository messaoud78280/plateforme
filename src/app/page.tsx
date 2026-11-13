import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BtpCommercialOffers } from "@/components/marketing-btp/BtpCommercialOffers";
import { BtpCtaBand } from "@/components/marketing-btp/BtpCtaBand";
import { BtpDeliverables } from "@/components/marketing-btp/BtpDeliverables";
import { BtpEconomicCase } from "@/components/marketing-btp/BtpEconomicCase";
import { BtpExpertiseTerrain } from "@/components/marketing-btp/BtpExpertiseTerrain";
import { BtpFaq } from "@/components/marketing-btp/BtpFaq";
import { BtpIaSection } from "@/components/marketing-btp/BtpIaSection";
import { BtpMissionFlow } from "@/components/marketing-btp/BtpMissionFlow";
import { BtpPlatformShowcase } from "@/components/marketing-btp/BtpPlatformShowcase";
import { BtpProfessionals } from "@/components/marketing-btp/BtpProfessionals";
import { BtpUseCases } from "@/components/marketing-btp/BtpUseCases";
import { BtpWhyBework } from "@/components/marketing-btp/BtpWhyBework";
import "@/components/marketing-btp/btp-marketing.css";
import {
  BTP_CTA_CONDUCTEUR,
  BTP_CTA_PRESTATIONS,
  BTP_CTA_PRIMARY,
  BTP_EXPERTISE_FAMILIES,
  BTP_FAQ,
  BTP_HOME_PROBLEMS,
  BTP_LIFECYCLE_STAGES,
  BTP_SEO_PAGES,
  BEWORK_BTP_COMMERCIAL_PROPOSITION,
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
      description: BEWORK_BTP_COMMERCIAL_PROPOSITION,
      areaServed: "FR",
    },
  ],
};

export default function HomePage() {
  return (
    <div className="bw-btp-site min-h-screen min-w-0 overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <MarketingSiteHeader plainBg />
      <main>
        {/* 1 — Hero */}
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
              <p className="mt-4 max-w-2xl text-base font-medium text-[var(--btp-heading)]">
                {BEWORK_BTP_COMMERCIAL_PROPOSITION}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={BTP_CTA_CONDUCTEUR.href} className="bw-btp-btn bw-btp-btn-primary">
                  {BTP_CTA_CONDUCTEUR.label}
                </Link>
                <Link href={BTP_CTA_PRESTATIONS.href} className="bw-btp-btn bw-btp-btn-secondary">
                  {BTP_CTA_PRESTATIONS.label}
                </Link>
              </div>
              <p className="mt-5 text-base text-[var(--btp-muted)]">
                Missions ponctuelles ou suivies · Marchés publics et privés ·
                Interventions adaptées aux opérations · Prestations sur devis
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

        {/* 2 — Difficultés */}
        <section className="bw-btp-section bw-btp-section-alt" aria-labelledby="problems-title">
          <div className="bw-btp-container">
            <h2 id="problems-title" className="max-w-3xl font-bold">
              Vos chantiers avancent. Votre organisation doit suivre.
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {BTP_HOME_PROBLEMS.map((item) => (
                <Link
                  key={item.problem}
                  href={item.href}
                  className="bw-btp-card block transition hover:border-[rgba(197,155,88,0.45)]"
                >
                  <p className="font-semibold text-[var(--btp-night)]">{item.problem}</p>
                  <p className="mt-2 text-base leading-relaxed text-[var(--btp-muted)]">
                    {item.answer}
                  </p>
                  <span className="mt-4 inline-block text-base font-semibold text-[var(--btp-steel)]">
                    Demander cette mission →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Offres 3 niveaux */}
        <BtpCommercialOffers />

        {/* 3 — Professionnels */}
        <BtpProfessionals />

        {/* 4 — Expertise terrain */}
        <BtpExpertiseTerrain compact />

        {/* 5 — Livrables */}
        <BtpDeliverables compact />

        {/* 6 — Plateforme & IA */}
        <BtpPlatformShowcase />
        <BtpIaSection />

        {/* 7 — Expertises TCE */}
        <section className="bw-btp-section" aria-labelledby="tce-title">
          <div className="bw-btp-container">
            <p className="bw-btp-eyebrow">Tous corps d’état</p>
            <h2 id="tce-title" className="mt-2 font-bold">
              Pilotage et coordination — pas d’exécution de tous les lots.
            </h2>
            <p className="mt-4 max-w-2xl text-[var(--btp-muted)]">
              Familles d’intervention et de coordination possibles. BeWork
              pilote et coordonne selon mission ; nous n’affirmons pas exécuter
              directement tous ces travaux.
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

        {/* 8 — Cycle de vie */}
        <section className="bw-btp-section bw-btp-section-alt" aria-labelledby="lifecycle-title">
          <div className="bw-btp-container">
            <h2 id="lifecycle-title" className="font-bold">
              De l’appel d’offres à la réception.
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {BTP_LIFECYCLE_STAGES.map((s) => (
                <Link
                  key={s.title}
                  href={s.href}
                  className="bw-btp-card block transition hover:border-[rgba(197,155,88,0.45)]"
                >
                  <h3 className="text-lg font-bold">{s.title}</h3>
                  <p className="mt-3 text-base text-[var(--btp-muted)]">{s.body}</p>
                  <span className="mt-4 inline-block text-base font-semibold text-[var(--btp-steel)]">
                    En savoir plus →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <BtpEconomicCase />

        {/* 9 — Mission flow */}
        <BtpMissionFlow />

        {/* 10 — Cas */}
        <BtpUseCases />

        <BtpWhyBework />

        {/* 11 — FAQ */}
        <BtpFaq items={BTP_FAQ} title="FAQ — prestations BTP" />

        {/* 12 — CTA devis */}
        <BtpCtaBand
          title="Confiez-nous votre besoin opérationnel."
          subtitle="Décrivez votre chantier et le profil recherché. Nous étudions le périmètre et vous proposons une intervention sur devis."
          ctaHref={BTP_CTA_PRIMARY.href}
          ctaLabel="Demander un devis"
        />
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
