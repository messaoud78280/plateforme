import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BtpCtaBand } from "@/components/marketing-btp/BtpCtaBand";
import { BtpDeliverables } from "@/components/marketing-btp/BtpDeliverables";
import { BtpIaSection } from "@/components/marketing-btp/BtpIaSection";
import { BtpPageHero } from "@/components/marketing-btp/BtpPageHero";
import { BtpPlatformJourney } from "@/components/marketing-btp/BtpPlatformJourney";
import { BtpPlatformShowcase } from "@/components/marketing-btp/BtpPlatformShowcase";
import "@/components/marketing-btp/btp-marketing.css";
import { BTP_SEO_PAGES } from "@/lib/bework-btp-services";
import { buildMarketingPageMetadata } from "@/lib/seo-formation-pages";

const seo = BTP_SEO_PAGES.plateforme;
export const metadata: Metadata = buildMarketingPageMetadata({
  path: seo.path,
  title: "Outils IA et plateforme collaborative chantier",
  description:
    "Plateforme collaborative BeWork et outils IA conçus pour les conducteurs de travaux : visite, métrés, devis, planning, approvisionnements, suivi et reporting.",
});

export default function PlateformeIaPage() {
  return (
    <div className="bw-btp-site min-h-screen">
      <MarketingSiteHeader />
      <main>
        <BtpPageHero
          eyebrow="PLATEFORME & IA"
          title="Nos propres outils IA, conçus pour ceux qui pilotent les chantiers."
          subtitle="BeWork associe expertise opérationnelle, plateforme collaborative et intelligence artificielle pour faciliter la gestion quotidienne des opérations BTP."
          primaryHref="/demande-de-devis"
          primaryLabel="Obtenir un devis"
          secondaryHref="/dashboard"
          secondaryLabel="Accès plateforme"
        />

        <section className="bw-btp-section bw-btp-section-alt">
          <div className="bw-btp-container max-w-3xl">
            <p className="text-base leading-relaxed text-[var(--btp-muted)]">
              Les entreprises ne viennent pas acheter un logiciel. Elles nous
              confient une mission. La plateforme est une valeur ajoutée pour
              mieux préparer, documenter, organiser et suivre nos interventions.
            </p>
            <p className="mt-4 text-base leading-relaxed text-[var(--btp-muted)]">
              Collaboration possible selon accès contractuels : informations,
              documents, planning, actions, rapports et observations. Aucun
              portail client généralisé n’est promis au-delà des droits
              réellement ouverts.
            </p>
          </div>
        </section>

        <BtpPlatformJourney />
        <BtpPlatformShowcase />
        <BtpIaSection />
        <BtpDeliverables />

        <section className="bw-btp-section">
          <div className="bw-btp-container">
            <div className="rounded-xl border border-[var(--btp-border)] bg-[var(--btp-mist)] p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--btp-steel)]">
                Démonstration commerciale — données fictives
              </p>
              <h2 className="mt-3 font-bold">
                Interface métier, pas une promesse technologique abstraite.
              </h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { k: "Avancement", v: "72 %" },
                  { k: "Actions ouvertes", v: "5" },
                  { k: "Points bloquants", v: "1" },
                  { k: "Écart budget", v: "+2,4 %" },
                ].map((m) => (
                  <div key={m.k} className="bw-btp-metric">
                    <p className="bw-btp-metric-label">{m.k}</p>
                    <p className="bw-btp-metric-value">{m.v}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs text-[var(--btp-muted)]">
                Exemple fictif — aucune donnée client réelle n’est affichée.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/dashboard" className="bw-btp-btn bw-btp-btn-primary">
                Accès plateforme
              </Link>
              <Link href="/demande-de-devis" className="bw-btp-btn bw-btp-btn-secondary-dark">
                Demander une démonstration cadrée
              </Link>
            </div>
          </div>
        </section>

        <BtpCtaBand title="Associer expertise terrain et outils BeWork ?" />
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
