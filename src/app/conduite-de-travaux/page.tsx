import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BtpCommercialOffers } from "@/components/marketing-btp/BtpCommercialOffers";
import { BtpCtaBand } from "@/components/marketing-btp/BtpCtaBand";
import { BtpDeliverables } from "@/components/marketing-btp/BtpDeliverables";
import { BtpPageHero } from "@/components/marketing-btp/BtpPageHero";
import { BtpProfessionals } from "@/components/marketing-btp/BtpProfessionals";
import "@/components/marketing-btp/btp-marketing.css";
import {
  BTP_COMPETENCE_SHEETS,
  BTP_MISSION_DURATION_OPTIONS,
  BTP_SEO_PAGES,
} from "@/lib/bework-btp-services";
import { buildMarketingPageMetadata } from "@/lib/seo-formation-pages";

const seo = BTP_SEO_PAGES.conduite;
export const metadata: Metadata = buildMarketingPageMetadata({
  path: seo.path,
  title: seo.title,
  description: seo.description,
});

export default function ConduiteDeTravauxPage() {
  return (
    <div className="bw-btp-site min-h-screen">
      <MarketingSiteHeader />
      <main>
        <BtpPageHero
          eyebrow="CONDUITE DE TRAVAUX EXTERNALISÉE"
          title="Des conducteurs de travaux pour gérer et suivre vos chantiers."
          subtitle="Conducteur de travaux, chef de chantier, direction de travaux ou pilotage TCE : missions contractualisées avec périmètre, responsabilités et livrables définis. La maîtrise d’œuvre d’exécution est proposée lorsque le cadre contractuel et les assurances le permettent. Pas du travail temporaire."
          primaryHref="/demande-de-devis?besoin=conducteur_travaux"
          primaryLabel="Demander un conducteur de travaux"
          secondaryHref="/notre-methode"
          secondaryLabel="Découvrir notre méthode"
          note="Missions ponctuelles ou suivies • TCE • VRD • Bâtiment • Prestations sur devis"
          imageSrc="/marketing/bework-pole-conduite-travaux.jpg"
          imageAlt="Conducteur de travaux sur chantier avec plans — photo d’ambiance illustrative"
        />

        <BtpProfessionals />

        <section className="bw-btp-section" aria-labelledby="competences-title">
          <div className="bw-btp-container">
            <p className="bw-btp-eyebrow">Compétences types</p>
            <h2 id="competences-title" className="mt-2 font-bold">
              Des spécialités mobilisables selon vos opérations.
            </h2>
            <p className="mt-3 max-w-3xl text-base text-[var(--btp-muted)]">
              Fiches génériques — aucun profil nominatif, photo ou expérience
              individuelle inventés. La disponibilité est confirmée lors de
              l’étude de votre besoin.
            </p>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {BTP_COMPETENCE_SHEETS.map((sheet) => (
                <article key={sheet.title} className="bw-btp-card flex flex-col">
                  <h3 className="font-bold">{sheet.title}</h3>
                  <p className="mt-3 text-xs font-bold uppercase tracking-[0.1em] text-[var(--btp-steel)]">
                    Spécialités
                  </p>
                  <ul className="mt-2 space-y-1">
                    {sheet.specialites.map((s) => (
                      <li key={s} className="text-base text-[var(--btp-muted)]">
                        {s}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.1em] text-[var(--btp-steel)]">
                    Missions
                  </p>
                  <ul className="mt-2 flex-1 space-y-1">
                    {sheet.missions.map((m) => (
                      <li key={m} className="text-base text-[var(--btp-muted)]">
                        {m}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/demande-de-devis?besoin=${sheet.besoin}&operation=${sheet.specialiteQuery}`}
                    className="bw-btp-btn bw-btp-btn-secondary-dark mt-6 self-start"
                  >
                    Demander cette compétence
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <BtpCommercialOffers />
        <BtpDeliverables />

        <section className="bw-btp-section bw-btp-section-alt">
          <div className="bw-btp-container">
            <h2 className="font-bold">Durées de mission</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {BTP_MISSION_DURATION_OPTIONS.map((d) => (
                <div key={d.value} className="bw-btp-card">
                  <h3 className="font-bold">{d.label}</h3>
                  <p className="mt-2 text-base text-[var(--btp-muted)]">{d.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <BtpCtaBand
          title="Besoin d’un conducteur de travaux ?"
          ctaHref="/demande-de-devis?besoin=conducteur_travaux"
          ctaLabel="Demander un conducteur de travaux"
        />
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
