import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BtpCtaBand } from "@/components/marketing-btp/BtpCtaBand";
import { BtpPageHero } from "@/components/marketing-btp/BtpPageHero";
import "@/components/marketing-btp/btp-marketing.css";
import {
  BTP_MISSION_DURATION_OPTIONS,
  BTP_SEO_PAGES,
} from "@/lib/bework-btp-services";
import { buildMarketingPageMetadata } from "@/lib/seo-formation-pages";

const seo = BTP_SEO_PAGES.conduite;
export const metadata: Metadata = buildMarketingPageMetadata({
  path: seo.path,
  title: seo.title,
  description: seo.description,
});

const offers = [
  {
    title: "Conducteur de travaux externalisé",
    besoin: "conducteur_travaux",
    items: [
      "Préparation technique des opérations",
      "Étude des dossiers d’exécution",
      "Analyse des contraintes contractuelles",
      "Organisation des moyens humains et matériels",
      "Établissement et suivi des plannings",
      "Coordination des équipes et sous-traitants",
      "Gestion des approvisionnements",
      "Contrôle de l’avancement",
      "Suivi budgétaire et analyse des dépenses",
      "Suivi des situations de travaux",
      "Organisation des réunions",
      "Comptes rendus et reporting",
      "Anticipation des blocages",
      "Assistance à la réception",
    ],
  },
  {
    title: "Chef de chantier opérationnel",
    besoin: "chef_chantier",
    items: [
      "Organisation quotidienne",
      "Répartition des tâches",
      "Préparation des postes de travail",
      "Encadrement terrain",
      "Contrôle d’implantation et d’exécution",
      "Suivi des quantités produites",
      "Gestion des moyens et matériels",
      "Remontée des anomalies",
      "Suivi des règles de prévention",
    ],
  },
  {
    title: "Direction de travaux externalisée",
    besoin: "direction_travaux",
    items: [
      "Supervision d’opérations multiples",
      "Coordination de plusieurs conducteurs",
      "Analyse des performances",
      "Gestion des priorités",
      "Appui au dirigeant ou au responsable d’exploitation",
      "Gestion des situations complexes",
      "Reporting de direction",
    ],
  },
  {
    title: "Intervention sur chantier en difficulté",
    besoin: "audit_redressement",
    items: [
      "Audit initial",
      "Identification des causes de retard",
      "Analyse des pertes de rendement",
      "Vérification des ressources",
      "Plan de rattrapage",
      "Réorganisation des interventions",
      "Suivi des actions correctives",
    ],
  },
] as const;

export default function ConduiteDeTravauxPage() {
  return (
    <div className="bw-btp-site min-h-screen">
      <MarketingSiteHeader />
      <main>
        <BtpPageHero
          eyebrow="PRESTATION PRINCIPALE"
          title="Des conducteurs de travaux pour renforcer vos opérations."
          subtitle="Besoin de piloter un chantier, d’absorber une surcharge d’activité ou de renforcer votre encadrement technique ? BeWork intervient sur des missions de conduite de travaux adaptées aux besoins de votre entreprise."
          primaryHref="/demande-de-devis?besoin=conducteur_travaux"
          primaryLabel="Demander un conducteur de travaux"
          secondaryHref="/demande-de-devis"
          secondaryLabel="Obtenir un devis"
        />

        <section className="bw-btp-section bw-btp-section-alt">
          <div className="bw-btp-container space-y-10">
            {offers.map((offer) => (
              <article key={offer.title} className="bw-btp-card">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <h2 className="text-2xl font-bold">{offer.title}</h2>
                  <Link
                    href={`/demande-de-devis?besoin=${offer.besoin}`}
                    className="bw-btp-btn bw-btp-btn-primary text-base"
                  >
                    Demander cette mission
                  </Link>
                </div>
                <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                  {offer.items.map((item) => (
                    <li
                      key={item}
                      className="flex gap-2 text-base text-[var(--btp-muted)]"
                    >
                      <span className="text-[var(--btp-copper)]" aria-hidden>
                        •
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="bw-btp-section">
          <div className="bw-btp-container">
            <h2 className="text-3xl font-bold">Modalités de mission</h2>
            <p className="mt-3 max-w-2xl text-[var(--btp-muted)]">
              Toutes les missions sont personnalisées et font l’objet d’un devis.
              La nature exacte des responsabilités, l’autonomie, les pouvoirs de
              décision, les assurances et les conditions d’intervention sont
              définis contractuellement.
            </p>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {BTP_MISSION_DURATION_OPTIONS.map((m) => (
                <div key={m.value} className="bw-btp-card">
                  <h3 className="text-lg font-bold">{m.label}</h3>
                  <p className="mt-2 text-base text-[var(--btp-muted)]">{m.hint}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 max-w-3xl text-base leading-relaxed text-[var(--btp-muted)]">
              BeWork commercialise des prestations de conduite et de pilotage de
              travaux. Ces missions ne sont pas présentées comme une location de
              salariés ni comme du travail temporaire.
            </p>
          </div>
        </section>

        <BtpCtaBand
          title="Besoin d’un renfort de conduite de travaux ?"
          ctaHref="/demande-de-devis?besoin=conducteur_travaux"
          ctaLabel="Demander un devis"
        />
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
