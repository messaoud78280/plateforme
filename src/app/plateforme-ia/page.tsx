import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BtpCtaBand } from "@/components/marketing-btp/BtpCtaBand";
import { BtpPageHero } from "@/components/marketing-btp/BtpPageHero";
import "@/components/marketing-btp/btp-marketing.css";
import { BTP_SEO_PAGES } from "@/lib/bework-btp-services";
import { buildMarketingPageMetadata } from "@/lib/seo-formation-pages";

const seo = BTP_SEO_PAGES.plateforme;
export const metadata: Metadata = buildMarketingPageMetadata({
  path: seo.path,
  title: seo.title,
  description: seo.description,
});

type ModuleStatus = "disponible" | "interne" | "en_test" | "en_cours";

const statusLabel: Record<ModuleStatus, string> = {
  disponible: "Utilisable en mission",
  interne: "Usage interne",
  en_test: "En test",
  en_cours: "En développement",
};

const modules: Array<{
  title: string;
  status: ModuleStatus;
  items: string[];
}> = [
  {
    title: "Tableau de bord de chantier",
    status: "disponible",
    items: [
      "Vision synthétique des opérations",
      "Avancement et alertes",
      "Actions prioritaires",
      "Suivi des délais",
      "Indicateurs financiers",
    ],
  },
  {
    title: "Planning collaboratif",
    status: "disponible",
    items: [
      "Organisation des tâches",
      "Affectation des responsables",
      "Dates importantes",
      "Suivi de réalisation",
      "Coordination des interventions",
    ],
  },
  {
    title: "Dossier chantier centralisé",
    status: "disponible",
    items: [
      "Plans et documents",
      "Photos",
      "Comptes rendus",
      "Informations techniques",
      "Historique documentaire",
    ],
  },
  {
    title: "Visites et métrés",
    status: "disponible",
    items: [
      "Relevés et quantités",
      "Observations",
      "Photos",
      "Préparation de devis",
      "Contrôles de cohérence",
    ],
  },
  {
    title: "Devis et suivi financier",
    status: "disponible",
    items: [
      "Bibliothèque d’ouvrages",
      "Métrés et déboursés",
      "Établissement des devis",
      "Prévisions et écarts",
    ],
  },
  {
    title: "Approvisionnements",
    status: "disponible",
    items: [
      "Besoins matériels",
      "Suivi des commandes",
      "Dates prévisionnelles",
      "Coordination avec le planning",
    ],
  },
  {
    title: "Rapports de chantier",
    status: "disponible",
    items: [
      "Journal de chantier",
      "Photos et incidents",
      "Actions correctives",
      "Synthèses pour la direction",
    ],
  },
  {
    title: "Collaboration",
    status: "disponible",
    items: [
      "Partage d’informations",
      "Affectation des actions",
      "Traçabilité des décisions",
      "Centralisation du suivi",
    ],
  },
];

const iaUses = [
  {
    title: "IA d’analyse documentaire",
    body: "Assistance à l’analyse de CCTP, CCAP, DCE et documents techniques dans les limites des formats pris en charge.",
  },
  {
    title: "IA de préparation",
    body: "Aide à structurer méthodes, listes de tâches, besoins matériels et préparation des interventions.",
  },
  {
    title: "IA de rédaction",
    body: "Assistance à la création de rapports, comptes rendus et synthèses d’avancement.",
  },
  {
    title: "IA de contrôle",
    body: "Détection assistée d’incohérences dans les informations structurées, métrés, devis ou plannings lorsque ces contrôles sont implémentés.",
  },
  {
    title: "IA d’analyse des performances",
    body: "Aide à interpréter données de production, écarts et points d’attention lorsque les données sont disponibles.",
  },
  {
    title: "IA d’assistance décisionnelle",
    body: "Présentation d’alertes ou de recommandations soumises à validation humaine.",
  },
] as const;

export default function PlateformeIaPage() {
  return (
    <div className="bw-btp-site min-h-screen">
      <MarketingSiteHeader />
      <main>
        <BtpPageHero
          eyebrow="PLATEFORME & IA"
          title="Des professionnels de terrain. Une technologie conçue pour le chantier."
          subtitle="Nos missions de conduite de travaux s’appuient sur un environnement numérique développé autour des besoins réels des entreprises du BTP."
          primaryHref="/demande-de-devis"
          primaryLabel="Obtenir un devis"
          secondaryHref="/dashboard"
          secondaryLabel="Accès plateforme"
        />

        <section className="bw-btp-section bw-btp-section-alt">
          <div className="bw-btp-container">
            <p className="max-w-3xl text-base leading-relaxed text-[var(--btp-muted)]">
              Nous ne nous contentons pas d’intervenir sur vos chantiers. Nous
              structurons l’information, facilitons les échanges et utilisons
              nos propres outils IA pour aider nos équipes à anticiper, analyser
              et suivre les opérations. L’IA n’est jamais autonome sur les
              décisions techniques ou de sécurité.
            </p>

            <h2 className="mt-12 text-2xl font-bold sm:text-3xl">Modules</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {modules.map((mod) => (
                <article key={mod.title} className="bw-btp-card">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-bold">{mod.title}</h3>
                    <span className="rounded-full bg-[rgba(20,38,59,0.06)] px-3 py-1 text-xs font-semibold text-[var(--btp-steel)]">
                      {statusLabel[mod.status]}
                    </span>
                  </div>
                  <ul className="mt-4 space-y-1.5">
                    {mod.items.map((item) => (
                      <li key={item} className="text-base text-[var(--btp-muted)]">
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <h2 className="mt-14 text-2xl font-bold sm:text-3xl">
              Intelligence artificielle appliquée au chantier
            </h2>
            <p className="mt-3 max-w-2xl text-base text-[var(--btp-muted)]">
              Outils d’aide et de productivité sous contrôle de professionnels
              qualifiés. Aucune garantie de métré, de détection exhaustive des
              risques ou de conformité d’ouvrage.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {iaUses.map((item) => (
                <div key={item.title} className="bw-btp-card">
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="mt-2 text-base text-[var(--btp-muted)]">{item.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-14 rounded-xl border border-[var(--btp-border)] bg-[var(--btp-mist)] p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--btp-steel)]">
                Démonstration commerciale — données fictives
              </p>
              <h2 className="mt-3 text-2xl font-bold">
                Découvrez comment nous suivons une opération.
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
              <ul className="mt-6 grid gap-2 text-base text-[var(--btp-muted)] sm:grid-cols-2">
                <li>Synthèse du conducteur de travaux</li>
                <li>Suivi des quantités</li>
                <li>Indicateurs de coûts</li>
                <li>Documents associés</li>
              </ul>
              <p className="mt-5 text-xs text-[var(--btp-muted)]">
                Exemple anonymisé / fictif explicitement identifié — ne
                correspond pas à un chantier client réel.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/dashboard" className="bw-btp-btn bw-btp-btn-primary">
                Accès plateforme
              </Link>
              <Link href="/demande-de-devis" className="bw-btp-btn bw-btp-btn-secondary-dark">
                Demander une démonstration cadrée
              </Link>
            </div>
          </div>
        </section>

        <BtpCtaBand title="Associer expertise terrain et outils BeWork ?" />
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
