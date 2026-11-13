import type { Metadata } from "next";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BtpCommercialOffers } from "@/components/marketing-btp/BtpCommercialOffers";
import { BtpCtaBand } from "@/components/marketing-btp/BtpCtaBand";
import { BtpDeliverables } from "@/components/marketing-btp/BtpDeliverables";
import { BtpPageHero } from "@/components/marketing-btp/BtpPageHero";
import "@/components/marketing-btp/btp-marketing.css";
import { BTP_SEO_PAGES } from "@/lib/bework-btp-services";
import { buildMarketingPageMetadata } from "@/lib/seo-formation-pages";

const seo = BTP_SEO_PAGES.pilotage;
export const metadata: Metadata = buildMarketingPageMetadata({
  path: seo.path,
  title: seo.title,
  description: seo.description,
});

const blocks = [
  {
    title: "Préparation",
    items: [
      "Lecture et vérification des plans",
      "Analyse des pièces contractuelles",
      "Repérage des contraintes",
      "Méthodes d’exécution",
      "Planification des ressources",
      "Préparation des approvisionnements",
    ],
  },
  {
    title: "Planification",
    items: [
      "Planning général",
      "Planning détaillé",
      "Phasage",
      "Interfaces entre corps d’état",
      "Identification des tâches critiques",
      "Ajustement du calendrier",
    ],
  },
  {
    title: "Production",
    items: [
      "Organisation des équipes",
      "Suivi des quantités",
      "Contrôle de productivité",
      "Analyse des rendements",
      "Vérification des moyens engagés",
    ],
  },
  {
    title: "Gestion financière",
    items: [
      "Budget prévisionnel",
      "Engagement des dépenses",
      "Suivi des heures",
      "Consommation des matériaux",
      "Comparaison prévu/réalisé",
      "Alertes sur les dérives",
      "Suivi des situations de travaux",
    ],
  },
  {
    title: "Qualité et prévention",
    items: [
      "Contrôle des travaux réalisés",
      "Suivi des non-conformités",
      "Signalement des risques",
      "Suivi des actions correctives",
      "Préparation des réceptions",
    ],
  },
  {
    title: "Reporting",
    items: [
      "Rapports journaliers",
      "Rapports hebdomadaires",
      "Indicateurs d’avancement",
      "Liste des actions",
      "Suivi des problèmes en attente",
      "Documents centralisés",
    ],
  },
] as const;

export default function PilotageChantierPage() {
  return (
    <div className="bw-btp-site min-h-screen">
      <MarketingSiteHeader />
      <main>
        <BtpPageHero
          eyebrow="SUIVI & GESTION DE CHANTIER"
          title="Des professionnels pour organiser, coordonner et suivre vos chantiers."
          subtitle="Chaque chantier doit être piloté avec des informations fiables et des décisions traçables. BeWork mobilise des conducteurs de travaux et gestionnaires pour structurer la préparation, la production, le suivi financier et le reporting."
          primaryHref="/demande-de-devis?besoin=conducteur_travaux"
          primaryLabel="Demander un conducteur de travaux"
          secondaryHref="/conduite-de-travaux"
          secondaryLabel="Découvrir nos prestations"
        />

        <section className="bw-btp-section bw-btp-section-alt">
          <div className="bw-btp-container grid gap-5 md:grid-cols-2">
            {blocks.map((block) => (
              <article key={block.title} className="bw-btp-card">
                <h2 className="text-xl font-bold">{block.title}</h2>
                <ul className="mt-4 space-y-2">
                  {block.items.map((item) => (
                    <li key={item} className="text-base text-[var(--btp-muted)]">
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="bw-btp-container mt-8">
            <p className="max-w-3xl text-base text-[var(--btp-muted)]">
              Les missions réglementées de coordination SPS ou de maîtrise
              d’œuvre ne sont pas annoncées comme acquises sans qualification et
              cadre contractuel adaptés.
            </p>
          </div>
        </section>

        <BtpCommercialOffers />
        <BtpDeliverables compact />

        <BtpCtaBand
          title="Un chantier à structurer et à suivre ?"
          ctaHref="/demande-de-devis?besoin=gestion_chantier"
          ctaLabel="Demander un devis de pilotage"
        />
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
