import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BtpCtaBand } from "@/components/marketing-btp/BtpCtaBand";
import { BtpIaSection } from "@/components/marketing-btp/BtpIaSection";
import { BtpPageHero } from "@/components/marketing-btp/BtpPageHero";
import { BtpPlatformShowcase } from "@/components/marketing-btp/BtpPlatformShowcase";
import "@/components/marketing-btp/btp-marketing.css";
import { BTP_SEO_PAGES } from "@/lib/bework-btp-services";
import { buildMarketingPageMetadata } from "@/lib/seo-formation-pages";

const seo = BTP_SEO_PAGES.plateforme;
export const metadata: Metadata = buildMarketingPageMetadata({
  path: seo.path,
  title: seo.title,
  description: seo.description,
});

export default function PlateformeIaPage() {
  return (
    <div className="bw-btp-site min-h-screen">
      <MarketingSiteHeader />
      <main>
        <BtpPageHero
          eyebrow="PLATEFORME & IA"
          title="Des professionnels de terrain. Une technologie conçue pour le chantier."
          subtitle="Nos missions de conduite de travaux s’appuient sur un environnement numérique développé autour des besoins réels des entreprises du BTP."
          primaryHref="/demande-de-devis"
          primaryLabel="Obtenir un devis"
          secondaryHref="/dashboard"
          secondaryLabel="Accès plateforme"
        />

        <section className="bw-btp-section bw-btp-section-alt">
          <div className="bw-btp-container max-w-3xl">
            <p className="text-base leading-relaxed text-[var(--btp-muted)]">
              Nous ne nous contentons pas d’intervenir sur vos chantiers. Nous
              structurons l’information, facilitons les échanges et utilisons
              nos propres outils IA pour aider nos équipes à anticiper, analyser
              et suivre les opérations. L’IA n’est jamais autonome sur les
              décisions techniques ou de sécurité.
            </p>
            <p className="mt-4 text-base leading-relaxed text-[var(--btp-muted)]">
              Parcours type : données chantier → outils BeWork → analyse
              assistée par IA → validation par le professionnel → suivi et
              décision.
            </p>
          </div>
        </section>

        <BtpPlatformShowcase />
        <BtpIaSection />

        <section className="bw-btp-section">
          <div className="bw-btp-container">
            <div className="rounded-xl border border-[var(--btp-border)] bg-[var(--btp-mist)] p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--btp-steel)]">
                Démonstration commerciale — données fictives
              </p>
              <h2 className="mt-3 font-bold">
                Découvrez comment nous suivons une opération.
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
              <ul className="mt-6 grid gap-2 text-base text-[var(--btp-muted)] sm:grid-cols-2">
                <li>Synthèse du conducteur de travaux</li>
                <li>Suivi des quantités</li>
                <li>Indicateurs de coûts</li>
                <li>Documents associés</li>
              </ul>
              <p className="mt-5 text-xs text-[var(--btp-muted)]">
                Exemple anonymisé / fictif explicitement identifié — ne
                correspond pas à un chantier client réel. Aucune capture de
                données client n’est affichée.
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
