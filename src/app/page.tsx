import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BtpCommercialOffers } from "@/components/marketing-btp/BtpCommercialOffers";
import { BtpCtaBand } from "@/components/marketing-btp/BtpCtaBand";
import { BtpDeliverables } from "@/components/marketing-btp/BtpDeliverables";
import { BtpExpertiseTerrain } from "@/components/marketing-btp/BtpExpertiseTerrain";
import { BtpFaq } from "@/components/marketing-btp/BtpFaq";
import { BtpHomePoles } from "@/components/marketing-btp/BtpHomePoles";
import { BtpIaSection } from "@/components/marketing-btp/BtpIaSection";
import { BtpMissionFlow } from "@/components/marketing-btp/BtpMissionFlow";
import { BtpPageHero } from "@/components/marketing-btp/BtpPageHero";
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
        { "@type": "Thing", name: "Conducteur de travaux" },
        { "@type": "Thing", name: "Suivi de chantier" },
        { "@type": "Thing", name: "Pilotage de chantier TCE" },
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
      name: "Conduite de travaux et pilotage de chantier",
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
        {/* 1 — Professionnels / hero */}
        <BtpPageHero
          eyebrow="BEWORK — CONDUITE DE TRAVAUX & PILOTAGE DE CHANTIER"
          title="Des conducteurs de travaux pour piloter vos chantiers."
          subtitle={BEWORK_BTP_HERO_SUBTITLE}
          primaryHref={BTP_CTA_CONDUCTEUR.href}
          primaryLabel={BTP_CTA_CONDUCTEUR.label}
          secondaryHref={BTP_CTA_PRESTATIONS.href}
          secondaryLabel={BTP_CTA_PRESTATIONS.label}
          note="Missions ponctuelles ou suivies • TCE • VRD • Bâtiment • Prestations sur devis"
          imageSrc="/marketing/btp-hero-chantier.jpg"
          imageAlt="Conducteur de travaux étudiant un plan sur un chantier BTP"
          showUiPreview
        />

        {/* 2 — Quatre pôles */}
        <BtpHomePoles />

        {/* 3 — Prestations professionnelles (conduite) */}
        <BtpProfessionals />

        {/* 4 — Missions / besoins */}
        <section className="bw-btp-section" aria-labelledby="problems-title">
          <div className="bw-btp-container">
            <h2 id="problems-title" className="max-w-3xl font-bold">
              Les missions que nous pouvons prendre en charge.
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {BTP_HOME_PROBLEMS.map((item) => (
                <Link
                  key={item.problem}
                  href={item.href}
                  className="bw-btp-card block transition hover:border-[var(--btp-border-strong)]"
                >
                  <p className="font-semibold text-[var(--btp-night)]">{item.problem}</p>
                  <p className="mt-2 text-base leading-relaxed text-[var(--btp-muted)]">
                    {item.answer}
                  </p>
                  <span className="mt-4 inline-block text-base font-semibold text-[var(--btp-accent)]">
                    Demander cette mission →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <BtpCommercialOffers />

        {/* 4 — Expérience / spécialités */}
        <BtpExpertiseTerrain compact />
        <BtpDeliverables compact />

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
                  className="bw-btp-card block transition hover:border-[var(--btp-border-strong)]"
                >
                  <h3 className="text-lg font-bold">{s.title}</h3>
                  <p className="mt-3 text-base text-[var(--btp-muted)]">{s.body}</p>
                  <span className="mt-4 inline-block text-base font-semibold text-[var(--btp-accent)]">
                    En savoir plus →
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-8">
              <Link href="/marches-publics-prives" className="bw-btp-btn bw-btp-btn-secondary-dark">
                Voir l’offre marchés
              </Link>
            </div>
          </div>
        </section>

        <section className="bw-btp-section" aria-labelledby="tce-title">
          <div className="bw-btp-container">
            <p className="bw-btp-eyebrow">Coordination TCE</p>
            <h2 id="tce-title" className="mt-2 font-bold">
              Pilotage et coordination des opérations.
            </h2>
            <p className="mt-4 max-w-2xl text-[var(--btp-muted)]">
              Domaines de coordination possibles selon mission. BeWork n’affirme
              pas exécuter directement tous les lots.
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
          </div>
        </section>

        {/* 5 — Méthodologie */}
        <BtpMissionFlow />

        {/* 6 — Outils numériques / IA (appui interne) */}
        <BtpPlatformShowcase />
        <BtpIaSection />

        <BtpUseCases />
        <BtpWhyBework />

        <BtpFaq items={BTP_FAQ} title="FAQ — missions BTP" />

        {/* 7 — Devis */}
        <BtpCtaBand
          title="Besoin d’un conducteur de travaux sur votre chantier ?"
          subtitle="Décrivez votre opération et le besoin d’encadrement. Nous étudions le périmètre et vous proposons une mission sur devis."
          ctaHref={BTP_CTA_PRIMARY.href}
          ctaLabel="Demander un devis"
        />
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
