import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";

export const MARCHES_PUBLICS_ANCHOR = "marches-publics-accords-cadres" as const;

const SENSITIVE_POINTS = [
  "Bons de commande à accepter ou refuser dans les délais",
  "Plateformes client type ECF ou équivalent",
  "Interventions en logement occupé",
  "Rendez-vous locataires",
  "Urgences et mises en sécurité",
  "Délais contractuels",
  "Diagnostics amiante",
  "Attestations SS4",
  "Photos avant / après",
  "Réception",
  "Facturation",
  "Suivi des paiements",
  "Pénalités",
  "Réclamations et réserves",
] as const;

const SCOPE_BLOCKS: { title: string; items: readonly string[] }[] = [
  {
    title: "Suivi des bons de commande",
    items: [
      "Suivi quotidien des bons de commande",
      "Vérification des informations",
      "Acceptation ou refus dans les délais",
      "Classement par statut",
      "Suivi par immeuble, logement ou intervention",
    ],
  },
  {
    title: "Plateformes client",
    items: [
      "Suivi des plateformes type ECF ou équivalent",
      "Saisie des informations demandées",
      "Mise à jour des statuts",
      "Remontée des anomalies",
      "Traçabilité des échanges",
    ],
  },
  {
    title: "Locataires et interventions",
    items: [
      "Prise de rendez-vous locataires",
      "Relances locataires, gardiens, syndics, bailleurs ou gestionnaires",
      "Suivi des dates proposées et confirmées",
      "Suivi des interventions urgentes",
      "Alertes mise en sécurité",
    ],
  },
  {
    title: "Amiante et pièces obligatoires",
    items: [
      "Classement des diagnostics amiante",
      "Suivi des attestations SS4",
      "Vérification des pièces avant intervention",
      "Alerte en cas de document manquant",
    ],
  },
  {
    title: "Preuves et réception",
    items: [
      "Suivi des photos avant travaux",
      "Suivi des photos après travaux",
      "Collecte des preuves d’intervention",
      "Saisie de la date de fin de travaux",
      "Suivi réception",
      "Suivi des réserves et réclamations",
    ],
  },
  {
    title: "Facturation et pénalités",
    items: [
      "Préparation ou saisie de la facturation dans les délais",
      "Suivi des factures émises",
      "Suivi des paiements à 30 jours",
      "Tableau de bord des pénalités potentielles",
      "Alertes sur les échéances critiques",
    ],
  },
  {
    title: "Reporting",
    items: [
      "Préparation des réunions semestrielles ou périodiques",
      "Reporting par bon de commande",
      "Reporting par immeuble",
      "Reporting par logement",
      "Reporting par statut",
      "Reporting par urgence",
      "Synthèse des dossiers incomplets",
    ],
  },
];

const MARKET_TYPES = [
  "Accords-cadres logement occupé",
  "Marchés à bons de commande",
  "Entretien courant",
  "Remise en état de logements",
  "Interventions multisites",
  "Marchés bailleurs sociaux",
  "Marchés de maintenance",
  "Travaux avec prise de rendez-vous locataires",
  "Marchés avec délais contractuels stricts",
  "Prestations nécessitant traçabilité, preuves et reporting",
] as const;

const BENEFITS = [
  "Moins d’oublis",
  "Meilleure traçabilité",
  "Moins de pénalités",
  "Facturation plus rapide",
  "Meilleur suivi des réserves",
  "Meilleure visibilité sur les bons de commande",
  "Conducteurs de travaux moins saturés",
  "Meilleure relation avec le client public ou bailleur",
  "Meilleure maîtrise des délais",
  "Meilleure rentabilité du marché",
] as const;

const EXAMPLE_ROWS = [
  {
    bc: "BC-2847",
    immeuble: "Rés. Les Ormes",
    logement: "Log. 12",
    type: "Remise état SdB",
    statut: "En cours",
    urgence: "Non",
    amiante: "OK",
    ss4: "OK",
    rdv: "14/06",
    avant: "OK",
    apres: "—",
    fin: "—",
    reception: "—",
    facture: "—",
    paiement: "—",
    penalite: "Faible",
  },
  {
    bc: "BC-2851",
    immeuble: "Rés. Bellevue",
    logement: "Log. 04",
    type: "Mise en sécurité",
    statut: "Urgent",
    urgence: "Oui",
    amiante: "À vérifier",
    ss4: "Manquant",
    rdv: "Relance",
    avant: "—",
    apres: "—",
    fin: "—",
    reception: "—",
    facture: "—",
    paiement: "—",
    penalite: "Élevé",
  },
  {
    bc: "BC-2839",
    immeuble: "Rés. du Parc",
    logement: "Log. 08",
    type: "Menuiseries",
    statut: "À facturer",
    urgence: "Non",
    amiante: "OK",
    ss4: "OK",
    rdv: "05/06",
    avant: "OK",
    apres: "OK",
    fin: "10/06",
    reception: "Partielle",
    facture: "Émise",
    paiement: "Attente 30 j",
    penalite: "Modéré",
  },
] as const;

export const MARCHES_PUBLICS_FAQ = [
  {
    q: "BeWork remplace-t-il le conducteur de travaux sur le marché ?",
    a: "Non. BeWork intervient comme relais administratif et opérationnel : suivi des bons de commande, relances, classement, reporting et traçabilité. Le conducteur de travaux garde la décision technique, la validation des interventions et l’engagement contractuel.",
  },
  {
    q: "BeWork peut-il suivre une plateforme client type ECF ?",
    a: "Oui, sur le volet suivi administratif : saisie des informations demandées, mise à jour des statuts, remontée des anomalies et traçabilité des échanges — selon périmètre défini avec vous.",
  },
  {
    q: "BeWork gère-t-il les rendez-vous locataires en logement occupé ?",
    a: "BeWork peut organiser la prise de rendez-vous, relancer locataires, gardiens, syndics ou gestionnaires, et suivre les dates confirmées. L’intervention terrain reste sous votre responsabilité.",
  },
  {
    q: "Comment BeWork aide-t-il à limiter les pénalités ?",
    a: "Par un suivi structuré des délais, des pièces obligatoires (amiante, SS4, photos), de la facturation et des échéances critiques — avec alertes et reporting pour anticiper les risques.",
  },
] as const;

const TABLE_COLUMNS = [
  "N° BC",
  "Immeuble",
  "Logement",
  "Intervention",
  "Statut",
  "Urgence",
  "Amiante",
  "SS4",
  "RDV locataire",
  "Photos avant",
  "Photos après",
  "Fin travaux",
  "Réception",
  "Facture",
  "Paiement",
  "Risque pénalité",
] as const;

/** Bloc intégré — marchés publics, accords-cadres & bons de commande (logement occupé). */
export function MarchesPublicsAccordsCadresSection() {
  return (
    <section
      id={MARCHES_PUBLICS_ANCHOR}
      className="scroll-mt-28 border-y border-[#1d4ed8]/15 bg-gradient-to-b from-[#eff6ff]/60 via-white to-[#f8fafc] px-6 py-14 md:scroll-mt-32 md:py-20"
      aria-labelledby="marches-publics-heading"
    >
      <div className="mx-auto max-w-site">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1d4ed8] md:text-sm">
          Marchés publics &amp; accords-cadres
        </p>
        <h2
          id="marches-publics-heading"
          className="mt-3 text-balance text-2xl font-bold tracking-tight text-black md:text-3xl lg:text-4xl"
        >
          Marchés publics &amp; accords-cadres : sécurisez votre suivi administratif
        </h2>
        <p className="mt-5 max-w-4xl text-lg leading-relaxed text-black">
          Dans un marché à bons de commande, la rentabilité ne dépend pas seulement du prix. Elle dépend aussi de la
          capacité à répondre dans les délais, suivre les interventions, collecter les preuves, facturer rapidement et
          éviter les pénalités.
        </p>
        <p className="mt-4 max-w-4xl text-black leading-relaxed">
          BeWork accompagne les entreprises titulaires de marchés publics et accords-cadres BTP dans le suivi
          administratif quotidien : bons de commande, plateformes client, rendez-vous locataires, amiante SS4, réception,
          facturation et pénalités — en relais administratif augmenté par l&apos;IA, sans remplacer le conducteur de
          travaux.
        </p>

        <div className="mt-8 card-frame rounded-xl border-[#1d4ed8]/20 bg-white p-6 md:p-8">
          <h3 className="text-lg font-semibold text-black">Pourquoi ces marchés sont sensibles</h3>
          <p className="mt-3 text-black leading-relaxed">
            Les marchés publics, accords-cadres et marchés à bons de commande exigent une organisation rigoureuse. Un bon
            de commande mal suivi, une pièce manquante, une date non renseignée ou une facture envoyée trop tard peuvent
            générer des retards, des réserves, des pénalités ou une perte de marge.
          </p>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {SENSITIVE_POINTS.map((point) => (
              <li
                key={point}
                className="flex items-start gap-2 rounded-lg border border-slate-200/90 bg-slate-50/80 px-3 py-2.5 text-sm text-black"
              >
                <span className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-[#1d4ed8]" aria-hidden />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <h3 className="mt-12 text-xl font-bold text-black md:text-2xl">Ce que BeWork peut prendre en charge</h3>
        <p className="mt-3 max-w-3xl text-black leading-relaxed">
          Relais administratif et opérationnel — pas entreprise de travaux, installateur ni bureau d&apos;études. Appui
          pour structurer délais, preuves, facturation et pénalités.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {SCOPE_BLOCKS.map((block) => (
            <article key={block.title} className="card-frame rounded-xl p-6">
              <h4 className="text-lg font-semibold text-black">{block.title}</h4>
              <ul className="mt-4 space-y-2" role="list">
                {block.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-black">
                    <span className="shrink-0 text-[#1d4ed8]" aria-hidden>
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <h3 className="mt-12 text-xl font-bold text-black md:text-2xl">Pour quels types de marchés ?</h3>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MARKET_TYPES.map((label) => (
            <li
              key={label}
              className="rounded-xl border border-[#1d4ed8]/20 bg-[#eff6ff]/50 px-4 py-3 text-sm font-medium text-black"
            >
              {label}
            </li>
          ))}
        </ul>

        <h3 className="mt-12 text-xl font-bold text-black md:text-2xl">Les bénéfices pour l&apos;entreprise titulaire</h3>
        <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex gap-2 text-black">
              <span className="shrink-0 text-[#1d4ed8]" aria-hidden>
                ✓
              </span>
              {benefit}
            </li>
          ))}
        </ul>

        <h3 className="mt-12 text-xl font-bold text-black md:text-2xl">Exemple de suivi BeWork</h3>
        <p className="mt-3 max-w-3xl text-black leading-relaxed">
          Maquette illustrative pour un accord-cadre logement occupé — BeWork structure le suivi ; vous validez les
          points qui engagent votre entreprise.
        </p>
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[64rem] w-full border-collapse text-left text-xs md:text-sm">
            <caption className="sr-only">Exemple de tableau de suivi administratif BeWork pour bons de commande</caption>
            <thead>
              <tr className="border-b border-slate-200 bg-[#0f172a] text-white">
                {TABLE_COLUMNS.map((col) => (
                  <th key={col} scope="col" className="whitespace-nowrap px-2.5 py-2.5 font-semibold md:px-3">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EXAMPLE_ROWS.map((row, i) => (
                <tr key={row.bc} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/80"}>
                  <td className="whitespace-nowrap px-2.5 py-2 font-semibold text-[#1d4ed8] md:px-3">{row.bc}</td>
                  <td className="whitespace-nowrap px-2.5 py-2 md:px-3">{row.immeuble}</td>
                  <td className="whitespace-nowrap px-2.5 py-2 md:px-3">{row.logement}</td>
                  <td className="px-2.5 py-2 md:px-3">{row.type}</td>
                  <td className="whitespace-nowrap px-2.5 py-2 md:px-3">{row.statut}</td>
                  <td className="whitespace-nowrap px-2.5 py-2 md:px-3">{row.urgence}</td>
                  <td className="whitespace-nowrap px-2.5 py-2 md:px-3">{row.amiante}</td>
                  <td className="whitespace-nowrap px-2.5 py-2 md:px-3">{row.ss4}</td>
                  <td className="whitespace-nowrap px-2.5 py-2 md:px-3">{row.rdv}</td>
                  <td className="whitespace-nowrap px-2.5 py-2 md:px-3">{row.avant}</td>
                  <td className="whitespace-nowrap px-2.5 py-2 md:px-3">{row.apres}</td>
                  <td className="whitespace-nowrap px-2.5 py-2 md:px-3">{row.fin}</td>
                  <td className="whitespace-nowrap px-2.5 py-2 md:px-3">{row.reception}</td>
                  <td className="whitespace-nowrap px-2.5 py-2 md:px-3">{row.facture}</td>
                  <td className="whitespace-nowrap px-2.5 py-2 md:px-3">{row.paiement}</td>
                  <td className="whitespace-nowrap px-2.5 py-2 font-medium md:px-3">{row.penalite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Aperçu statique — périmètre cadré selon votre marché (ECF, Chorus Pro, portail bailleur, etc.).
        </p>

        <div className="mt-10 card-frame rounded-xl border-[#1d4ed8]/25 bg-[#eff6ff]/40 p-6 md:p-8">
          <p className="text-base font-semibold leading-relaxed text-black md:text-lg">
            BeWork accompagne les entreprises titulaires d&apos;accords-cadres logement : bons de commande, plateforme
            ECF, rendez-vous locataires, délais d&apos;intervention, amiante SS4, réception, facturation et suivi des
            pénalités.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-[#1d4ed8]/25 bg-gradient-to-br from-[#eff6ff] via-white to-[#eff6ff] p-8 text-center md:p-10">
          <h3 className="text-xl font-bold text-black md:text-2xl">Vous êtes titulaire d&apos;un marché à bons de commande ?</h3>
          <p className="mx-auto mt-4 max-w-2xl text-black leading-relaxed">
            BeWork peut vous aider à structurer le suivi administratif du marché, sécuriser vos délais et garder une
            vision claire des bons de commande, interventions, pièces obligatoires, factures et pénalités potentielles.
          </p>
          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <CalendlyBookingLink
              className="w-full rounded-lg bg-[#1d4ed8] px-8 py-4 text-center font-semibold text-white shadow-md transition hover:bg-[#1e40af] sm:w-auto"
              trackLocation="missions-marches-publics-cta"
            >
              Parler de mon marché avec BeWork
            </CalendlyBookingLink>
            <Link
              href="/gestion-marche-public-btp"
              className="text-base font-semibold text-[#1d4ed8] underline-offset-2 hover:underline"
            >
              Gestion marché public après attribution
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
