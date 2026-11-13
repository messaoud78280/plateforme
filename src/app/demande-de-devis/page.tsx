import type { Metadata } from "next";
import { Suspense } from "react";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BtpDevisForm } from "@/components/marketing-btp/BtpDevisForm";
import { BtpPageHero } from "@/components/marketing-btp/BtpPageHero";
import "@/components/marketing-btp/btp-marketing.css";
import { BTP_SEO_PAGES } from "@/lib/bework-btp-services";
import { buildMarketingPageMetadata } from "@/lib/seo-formation-pages";

const seo = BTP_SEO_PAGES.devis;
export const metadata: Metadata = buildMarketingPageMetadata({
  path: seo.path,
  title: seo.title,
  description: seo.description,
});

export default function DemandeDeDevisPage() {
  return (
    <div className="bw-btp-site min-h-screen">
      <MarketingSiteHeader />
      <main>
        <BtpPageHero
          eyebrow="DEVIS"
          title="Demandez une proposition adaptée à votre chantier."
          subtitle="Deux étapes : choisissez votre besoin, décrivez l’opération. Nous analysons le périmètre et vous adressons une proposition personnalisée. Aucun tarif public."
          primaryHref="#formulaire-devis"
          primaryLabel="Commencer"
          secondaryHref="/contact"
          secondaryLabel="Nous contacter"
        />

        <section id="formulaire-devis" className="bw-btp-section bw-btp-section-alt">
          <div className="bw-btp-container max-w-3xl">
            <Suspense
              fallback={
                <p className="text-[var(--btp-muted)]">Chargement du formulaire…</p>
              }
            >
              <BtpDevisForm />
            </Suspense>
          </div>
        </section>
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
