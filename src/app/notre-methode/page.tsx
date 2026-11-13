import type { Metadata } from "next";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BtpCtaBand } from "@/components/marketing-btp/BtpCtaBand";
import { BtpPageHero } from "@/components/marketing-btp/BtpPageHero";
import "@/components/marketing-btp/btp-marketing.css";
import { BTP_METHOD_STEPS, BTP_SEO_PAGES } from "@/lib/bework-btp-services";
import { buildMarketingPageMetadata } from "@/lib/seo-formation-pages";

const seo = BTP_SEO_PAGES.methode;
export const metadata: Metadata = buildMarketingPageMetadata({
  path: seo.path,
  title: seo.title,
  description: seo.description,
});

export default function NotreMethodePage() {
  return (
    <div className="bw-btp-site min-h-screen">
      <MarketingSiteHeader />
      <main>
        <BtpPageHero
          eyebrow="MÉTHODE"
          title="Une intervention structurée, des livrables clairs."
          subtitle="Six étapes pour comprendre le besoin, définir la mission, piloter les opérations et clôturer avec transparence."
          primaryHref="/demande-de-devis"
          primaryLabel="Demander un devis"
        />

        <section className="bw-btp-section bw-btp-section-alt">
          <div className="bw-btp-container space-y-5">
            {BTP_METHOD_STEPS.map((step) => (
              <article key={step.n} className="bw-btp-card grid gap-4 md:grid-cols-[5rem_1fr] md:items-start">
                <p className="text-2xl font-bold text-[var(--btp-copper)]">{step.n}</p>
                <div>
                  <h2 className="text-xl font-bold">{step.title}</h2>
                  <p className="mt-2 text-[var(--btp-muted)]">{step.body}</p>
                </div>
              </article>
            ))}
            <p className="max-w-3xl pt-4 text-sm text-[var(--btp-muted)]">
              L’accent est mis sur les livrables, la traçabilité des décisions et
              la transparence des échanges tout au long de la mission.
            </p>
          </div>
        </section>

        <BtpCtaBand title="Prêt à cadrer une mission ?" />
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
