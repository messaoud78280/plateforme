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
import { BTP_CTA_CONDUCTEUR, BTP_CTA_METHOD, BTP_SEO_PAGES } from "@/lib/bework-btp-services";
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
          eyebrow="NOTRE MÉTHODE • PILOTAGE DE CHANTIER AUGMENTÉ"
          title="Nos conducteurs de travaux, renforcés par l'intelligence artificielle."
          subtitle="Les professionnels BeWork assurent la conduite, la coordination et le suivi des opérations BTP. Ils utilisent nos propres outils de gestion et d'intelligence artificielle pour préparer les interventions, suivre les délais et les coûts, centraliser les informations et produire des rapports structurés."
          primaryHref={BTP_CTA_CONDUCTEUR.href}
          primaryLabel={BTP_CTA_CONDUCTEUR.label}
          secondaryHref={BTP_CTA_METHOD.href}
          secondaryLabel={BTP_CTA_METHOD.label}
          imageSrc="/marketing/btp-hero-chantier.jpg"
          imageAlt="Conducteur de travaux utilisant des outils numériques sur chantier"
          showUiPreview
        />

        <section className="bw-btp-section bw-btp-section-alt">
          <div className="bw-btp-container max-w-3xl">
            <h2 className="font-bold">Des outils au service de nos missions</h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--btp-muted)]">
              Nos équipes s’appuient sur une plateforme collaborative interne et
              des outils d’intelligence artificielle pour structurer
              l’information, préparer les opérations, produire des comptes
              rendus, suivre l’avancement et documenter les décisions.
            </p>
            <p className="mt-4 text-base leading-relaxed text-[var(--btp-muted)]">
              Ces outils ne constituent pas un logiciel commercialisé
              séparément. Chaque mission reste conduite par des professionnels
              du BTP — sous validation humaine.
            </p>
            <ul className="mt-6 space-y-2 text-base text-[var(--btp-muted)]">
              <li>• Structurer les informations chantier</li>
              <li>• Préparer les interventions</li>
              <li>• Produire des comptes rendus</li>
              <li>• Suivre les délais, les coûts et les actions</li>
              <li>• Centraliser documents et observations</li>
              <li>• Assister l’analyse, sans remplacer le jugement terrain</li>
            </ul>
          </div>
        </section>

        <BtpPlatformJourney />
        <BtpPlatformShowcase />
        <BtpIaSection />
        <BtpDeliverables />

        <section className="bw-btp-section">
          <div className="bw-btp-container">
            <div className="rounded-xl border border-[var(--btp-border)] bg-white p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--btp-steel)]">
                Illustration interne — données fictives
              </p>
              <h2 className="mt-3 font-bold">
                Un pilotage mieux documenté, au service de la mission.
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
                Exemple fictif — aucune donnée client réelle. Accès plateforme
                réservé aux comptes autorisés (header).
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link href={BTP_CTA_CONDUCTEUR.href} className="bw-btp-btn bw-btp-btn-primary">
                {BTP_CTA_CONDUCTEUR.label}
              </Link>
              <Link href={BTP_CTA_METHOD.href} className="bw-btp-btn bw-btp-btn-secondary">
                {BTP_CTA_METHOD.label}
              </Link>
            </div>
          </div>
        </section>

        <BtpCtaBand
          title="Besoin d’un conducteur de travaux ?"
          ctaHref={BTP_CTA_CONDUCTEUR.href}
          ctaLabel={BTP_CTA_CONDUCTEUR.label}
        />
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
