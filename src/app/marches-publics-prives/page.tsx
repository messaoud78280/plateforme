import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BtpCtaBand } from "@/components/marketing-btp/BtpCtaBand";
import { BtpPageHero } from "@/components/marketing-btp/BtpPageHero";
import "@/components/marketing-btp/btp-marketing.css";
import { BTP_MARCHES_FLOW, BTP_SEO_PAGES } from "@/lib/bework-btp-services";
import { buildMarketingPageMetadata } from "@/lib/seo-formation-pages";

const seo = BTP_SEO_PAGES.marches;
export const metadata: Metadata = buildMarketingPageMetadata({
  path: seo.path,
  title: seo.title,
  description: seo.description,
});

const blocks = [
  {
    title: "Analyse des consultations",
    items: [
      "DCE",
      "RC",
      "CCAP",
      "CCTP",
      "Plans",
      "Pièces administratives",
      "Critères de sélection",
      "Analyse des contraintes",
    ],
  },
  {
    title: "Études de prix",
    items: [
      "Métrés",
      "Quantitatifs",
      "Déboursés",
      "BPU",
      "DQE",
      "DPGF",
      "Marges",
      "Vérification des prix",
    ],
  },
  {
    title: "Réponses aux marchés",
    items: [
      "Mémoire technique",
      "Moyens humains",
      "Moyens matériels",
      "Méthodologie",
      "Planning",
      "Préparation des pièces",
      "Vérifications avant dépôt",
    ],
  },
  {
    title: "Suivi d’exécution",
    items: [
      "Préparation de chantier",
      "Suivi contractuel",
      "Situations de travaux",
      "Travaux supplémentaires",
      "Décomptes",
      "DOE",
      "Réception",
    ],
  },
] as const;

export default function MarchesPage() {
  return (
    <div className="bw-btp-site min-h-screen">
      <MarketingSiteHeader />
      <main>
        <BtpPageHero
          eyebrow="INGÉNIERIE & MARCHÉS — COMPLÉMENT"
          title="Nous vous accompagnons de l’étude du marché à sa réalisation."
          subtitle="Analyse de consultation, études de prix, constitution d’offre et suivi d’exécution — complément à la conduite de travaux et aux équipes TP/VRD. Sans garantie d’attribution du marché."
          primaryHref="/demande-de-devis?besoin=assistance_marches_publics"
          primaryLabel="Confier une étude de marché"
          secondaryHref="/ingenierie-et-marches-btp"
          secondaryLabel="Voir le hub ingénierie"
          imageSrc="/marketing/bework-pole-etudes-marches.jpg"
          imageAlt="Analyse de plans et dossiers de marché — photo d’ambiance illustrative"
        />

        <section className="bw-btp-section bw-btp-section-alt">
          <div className="bw-btp-container">
            <div className="grid gap-5 md:grid-cols-2">
              {blocks.map((b) => (
                <article key={b.title} className="bw-btp-card">
                  <h2 className="text-xl font-bold">{b.title}</h2>
                  <ul className="mt-4 space-y-1.5">
                    {b.items.map((item) => (
                      <li key={item} className="text-base text-[var(--btp-muted)]">
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bw-btp-section" aria-labelledby="marches-flow-title">
          <div className="bw-btp-container">
            <h2 id="marches-flow-title" className="font-bold">
              Une méthode précise
            </h2>
            <p className="mt-3 max-w-3xl text-base text-[var(--btp-muted)]">
              Vous transmettez le dossier → Nous l’analysons → Nous définissons
              la mission → Nous produisons les livrables → Vous validez.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-5">
              {BTP_MARCHES_FLOW.map((step) => (
                <article key={step.n} className="bw-btp-card h-full">
                  <p className="text-base font-bold text-[var(--btp-copper)]">{step.n}</p>
                  <h3 className="mt-2 text-lg font-bold leading-snug">{step.title}</h3>
                  <p className="mt-2 text-base text-[var(--btp-muted)]">{step.body}</p>
                </article>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/demande-de-devis?besoin=assistance_marches_publics"
                className="bw-btp-btn bw-btp-btn-primary"
              >
                Confier une étude de marché
              </Link>
              <Link
                href="/demande-de-devis?besoin=assistance_marches_prives"
                className="bw-btp-btn bw-btp-btn-secondary-dark"
              >
                Marché privé
              </Link>
            </div>
          </div>
        </section>

        <BtpCtaBand
          title="Préparer une réponse à consultation ?"
          ctaHref="/demande-de-devis?besoin=assistance_marches_publics"
          ctaLabel="Confier une étude de marché"
        />
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
