import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BtpCtaBand } from "@/components/marketing-btp/BtpCtaBand";
import { BtpExpertiseTerrain } from "@/components/marketing-btp/BtpExpertiseTerrain";
import { BtpPageHero } from "@/components/marketing-btp/BtpPageHero";
import "@/components/marketing-btp/btp-marketing.css";
import { BTP_SEO_PAGES, BEWORK_BTP_VALUE_PROPOSITION } from "@/lib/bework-btp-services";
import { buildMarketingPageMetadata } from "@/lib/seo-formation-pages";

const seo = BTP_SEO_PAGES.aPropos;
export const metadata: Metadata = buildMarketingPageMetadata({
  path: seo.path,
  title: seo.title,
  description: seo.description,
});

export default function AProposPage() {
  return (
    <div className="bw-btp-site min-h-screen">
      <MarketingSiteHeader />
      <main>
        <BtpPageHero
          eyebrow="À PROPOS"
          title="Une société de conduite de travaux et de pilotage de chantier."
          subtitle={BEWORK_BTP_VALUE_PROPOSITION}
          primaryHref="/demande-de-devis?besoin=conducteur_travaux"
          primaryLabel="Demander un conducteur de travaux"
          secondaryHref="/notre-methode"
          secondaryLabel="Découvrir notre méthode"
        />

        <section className="bw-btp-section bw-btp-section-alt">
          <div className="bw-btp-container max-w-3xl">
            <h2 className="font-bold">Qui sommes-nous ?</h2>
            <p className="mt-4 leading-relaxed text-[var(--btp-muted)]">
              BeWork est une structure fondée sur une expertise professionnelle
              du BTP. Notre approche s’appuie sur plus de vingt années de
              pratique de chantier — notamment en terrassement, VRD,
              maçonnerie, aménagements extérieurs, organisation opérationnelle,
              gestion d’équipes et marchés publics et privés — portée par
              l’expérience du fondateur.
            </p>
            <p className="mt-4 leading-relaxed text-[var(--btp-muted)]">
              Cette expérience personnelle ne se confond pas automatiquement
              avec le portefeuille contractuel de l’entité BeWork. Aucune
              référence client, certification, effectif ou réalisation
              contractuelle n’est inventée sur ce site.
            </p>
            <p className="mt-4 leading-relaxed text-[var(--btp-muted)]">
              Notre différence repose sur la complémentarité entre expertise
              humaine, méthodologie de gestion et environnement numérique
              développé autour des besoins réels du chantier.
            </p>
            <p className="mt-6 text-base text-[var(--btp-muted)]">
              Identité de l’éditeur et coordonnées :{" "}
              <Link
                href="/mentions-legales"
                className="font-semibold text-[var(--btp-steel)] underline-offset-2 hover:underline"
              >
                mentions légales
              </Link>
              .
            </p>
          </div>
        </section>

        <BtpExpertiseTerrain />

        <BtpCtaBand
          title="Échanger sur votre besoin opérationnel ?"
          ctaHref="/demande-de-devis?besoin=conducteur_travaux"
          ctaLabel="Demander un conducteur de travaux"
        />
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
