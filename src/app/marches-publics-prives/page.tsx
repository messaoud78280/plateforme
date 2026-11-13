import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BtpCtaBand } from "@/components/marketing-btp/BtpCtaBand";
import { BtpPageHero } from "@/components/marketing-btp/BtpPageHero";
import "@/components/marketing-btp/btp-marketing.css";
import { BTP_SEO_PAGES } from "@/lib/bework-btp-services";
import { buildMarketingPageMetadata } from "@/lib/seo-formation-pages";

const seo = BTP_SEO_PAGES.marches;
export const metadata: Metadata = buildMarketingPageMetadata({
  path: seo.path,
  title: seo.title,
  description: seo.description,
});

const blocks = [
  {
    title: "Assistance aux appels d’offres",
    items: [
      "Analyse des dossiers DCE",
      "Règlement de consultation",
      "CCTP / CCAP",
      "Acte d’engagement",
      "Plans et pièces annexes",
      "Analyse des critères de sélection",
      "Vérification de la cohérence technique",
      "Identification des risques",
      "Préparation des candidatures",
    ],
  },
  {
    title: "Études de prix",
    items: [
      "Métrés et quantitatifs",
      "Déboursés secs",
      "Chiffrage fournitures, main-d’œuvre et matériels",
      "Sous-traitance",
      "BPU / DQE / DPGF",
      "Analyse des marges",
      "Vérification des prix",
    ],
  },
  {
    title: "Constitution de l’offre",
    items: [
      "Mémoire technique",
      "Méthodologie d’exécution",
      "Planning prévisionnel",
      "Moyens humains et matériels",
      "Organisation de chantier",
      "Démarche qualité et prévention",
      "Vérification des pièces",
    ],
  },
  {
    title: "Exécution et suivi du marché",
    items: [
      "Préparation de chantier",
      "Suivi contractuel",
      "Suivi des quantités",
      "Situations de travaux",
      "Travaux supplémentaires et modifications",
      "Décomptes",
      "DOE",
      "Assistance aux opérations de réception",
    ],
  },
] as const;

export default function MarchesPage() {
  return (
    <div className="bw-btp-site min-h-screen">
      <MarketingSiteHeader />
      <main>
        <BtpPageHero
          eyebrow="MARCHÉS PUBLICS & PRIVÉS"
          title="De l’appel d’offres à l’exécution de votre marché."
          subtitle="Assistance aux dossiers, études de prix, constitution d’offre et suivi d’exécution — sans garantie d’attribution du marché."
          primaryHref="/demande-de-devis?besoin=assistance_marches_publics"
          primaryLabel="Confier l’étude d’un marché"
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
          <div className="bw-btp-container mt-10">
            <div className="bw-btp-card border-[rgba(197,155,88,0.35)] bg-[rgba(197,155,88,0.06)]">
              <h2 className="text-xl font-bold">Vous avez remporté un marché ?</h2>
              <p className="mt-3 text-[var(--btp-muted)]">
                BeWork peut également vous accompagner dans sa préparation et
                son pilotage opérationnel.
              </p>
              <Link
                href="/demande-de-devis?besoin=gestion_chantier"
                className="bw-btp-btn bw-btp-btn-primary mt-5"
              >
                Confier la préparation du chantier
              </Link>
            </div>
          </div>
        </section>

        <BtpCtaBand
          title="Un dossier de consultation à analyser ?"
          ctaHref="/demande-de-devis?besoin=assistance_marches_publics"
          ctaLabel="Confier l’étude d’un marché"
        />
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
