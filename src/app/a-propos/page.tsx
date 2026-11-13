import type { Metadata } from "next";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BtpCtaBand } from "@/components/marketing-btp/BtpCtaBand";
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

const pillars = [
  "Expérience d’exécution",
  "Lecture et interprétation des plans",
  "Métrés et études de prix",
  "Réponses aux marchés",
  "Préparation de chantier",
  "Coordination et suivi de production",
  "Gestion des coûts",
  "Développement d’outils métiers numériques",
  "Utilisation de l’IA au service de la gestion BTP",
] as const;

export default function AProposPage() {
  return (
    <div className="bw-btp-site min-h-screen">
      <MarketingSiteHeader />
      <main>
        <BtpPageHero
          eyebrow="À PROPOS"
          title="Une expertise de terrain au service de vos opérations."
          subtitle={BEWORK_BTP_VALUE_PROPOSITION}
          primaryHref="/demande-de-devis"
          primaryLabel="Demander un devis"
          secondaryHref="/notre-methode"
          secondaryLabel="Notre méthode"
        />

        <section className="bw-btp-section bw-btp-section-alt">
          <div className="bw-btp-container max-w-3xl">
            <h2 className="text-2xl font-bold sm:text-3xl">Qui sommes-nous ?</h2>
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

            <h3 className="mt-10 text-xl font-bold">Compétences mobilisées</h3>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {pillars.map((item) => (
                <li key={item} className="flex gap-2 text-base text-[var(--btp-muted)]">
                  <span className="text-[var(--btp-copper)]" aria-hidden>
                    •
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <p className="mt-10 rounded-xl border border-[rgba(197,155,88,0.35)] bg-[rgba(197,155,88,0.08)] p-4 text-base text-[var(--btp-steel)]">
              Informations juridiques (structure, SIREN, siège, assurances,
              responsable de publication) : à valider avant mise en production.
              Ne pas réutiliser automatiquement l’identité d’un ancien organisme
              de formation comme celle de l’activité BTP.
            </p>
          </div>
        </section>

        <BtpCtaBand title="Échanger sur votre besoin opérationnel ?" />
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
