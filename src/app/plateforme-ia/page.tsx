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
  title: seo.title,
  description: seo.description,
});

export default function PlateformeIaPage() {
  return (
    <div className="bw-btp-site min-h-screen">
      <MarketingSiteHeader />
      <main>
        <BtpPageHero
          eyebrow="OUTILS & MÉTHODE"
          title="Nous ne vendons pas un logiciel. Nous pilotons vos chantiers."
          subtitle="BeWork accompagne les acteurs du BTP avec des prestations de maîtrise d’œuvre, de suivi de chantier et de pilotage opérationnel. Nos intervenants s’appuient sur une organisation rigoureuse, des outils de gestion internes et une intelligence artificielle au service de la mission."
          primaryHref="/demande-de-devis"
          primaryLabel="Demander une mission"
          secondaryHref="/notre-methode"
          secondaryLabel="Comprendre notre méthode"
        />

        <section className="bw-btp-section bw-btp-section-alt">
          <div className="bw-btp-container max-w-3xl">
            <h2 className="font-bold">Des outils utilisés par nos équipes</h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--btp-muted)]">
              La plateforme et les outils IA BeWork ne sont pas le produit
              commercialisé. Ce sont des moyens internes pour structurer
              l’information, préparer les opérations, produire des comptes
              rendus, suivre l’avancement et documenter les décisions.
            </p>
            <p className="mt-4 text-base leading-relaxed text-[var(--btp-muted)]">
              Le client confie une mission humaine de suivi ou de pilotage. Nos
              équipes utilisent ces outils pour mieux organiser et traçabiliser
              l’intervention — sous validation professionnelle.
            </p>
            <ul className="mt-6 space-y-2 text-base text-[var(--btp-muted)]">
              <li>• Structurer les informations chantier</li>
              <li>• Préparer les opérations</li>
              <li>• Produire des comptes rendus</li>
              <li>• Suivre l’avancement et les actions</li>
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
              <Link href="/demande-de-devis" className="bw-btp-btn bw-btp-btn-primary">
                Demander une mission
              </Link>
              <Link href="/notre-methode" className="bw-btp-btn bw-btp-btn-secondary">
                Notre méthode
              </Link>
            </div>
          </div>
        </section>

        <BtpCtaBand
          title="Confier le pilotage de votre chantier ?"
          ctaHref="/demande-de-devis"
          ctaLabel="Demander un devis"
        />
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
