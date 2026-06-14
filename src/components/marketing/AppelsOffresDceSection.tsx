import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";

export const APPELS_OFFRES_ANCHOR = "reponses-appels-offres" as const;

const SCOPE_BLOCKS: { title: string; items: readonly string[] }[] = [
  {
    title: "Analyse et contrôle du DCE",
    items: [
      "Contrôle des pièces DCE reçues",
      "Repérage des pièces manquantes ou illisibles",
      "Identification des exigences administratives du RC / CCAP",
      "Lecture des contraintes de dépôt (format, délai, plateforme)",
      "Vérification de la liste des documents à fournir",
    ],
  },
  {
    title: "Conformité candidature / offre",
    items: [
      "Tableau de conformité candidature ou offre",
      "Checklist pièces administratives avant montage",
      "Contrôle des attestations obligatoires (URSSAF, fiscales, assurances…)",
      "Vérification des formulaires DC1, DC2, DC4 et annexes",
      "Contrôle signatures, dates et mentions légales entreprise",
    ],
  },
  {
    title: "Pièces financières et contractuelles",
    items: [
      "Relecture de l’acte d’engagement (AE)",
      "Relecture BPU et cohérence des unités",
      "Relecture DQE / DPGF et totaux",
      "Vérification de cohérence entre AE, BPU et DQE",
      "Alerte en cas d’incohérence, de ligne vide ou d’oubli",
    ],
  },
  {
    title: "Mémoire technique et planning",
    items: [
      "Structuration du plan de mémoire technique",
      "Mise en forme professionnelle (sans rédaction technique à votre place)",
      "Préparation d’un planning simplifié de réponse",
      "Cohérence méthodologie / moyens / délais / contraintes du CCTP",
    ],
  },
  {
    title: "Dépôt électronique",
    items: [
      "Contrôle final avant dépôt sur plateforme",
      "Nommage des fichiers selon exigences marché",
      "Organisation du dossier numérique (dossiers, versions)",
      "Sécurisation du parcours de dépôt électronique",
      "Vérification finale avant envoi (pièces, tailles, formats)",
    ],
  },
];

const OUTCOMES = [
  "Dossier plus clair et mieux présenté",
  "Moins de risques d’oubli administratif",
  "Pièces contrôlées avant dépôt",
  "Charge allégée pour dirigeant, chargé d’affaires ou conducteur",
  "Rigueur documentaire renforcée — sans promesse d’attribution",
] as const;

/** Phase candidature / dépôt AO — complémentaire au catalogue chantier et à la section marchés publics. */
export function AppelsOffresDceSection() {
  return (
    <section
      id={APPELS_OFFRES_ANCHOR}
      className="scroll-mt-28 border-y border-slate-200/80 bg-white px-6 py-14 md:scroll-mt-32 md:py-20"
      aria-labelledby="appels-offres-heading"
    >
      <div className="mx-auto max-w-site">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1d4ed8] md:text-sm">
          Réponse appel d&apos;offres · DCE
        </p>
        <h2
          id="appels-offres-heading"
          className="mt-3 text-balance text-2xl font-bold tracking-tight text-black md:text-3xl lg:text-4xl"
        >
          Réponses aux appels d&apos;offres : sécuriser le dossier avant dépôt
        </h2>
        <p className="mt-5 max-w-4xl text-lg leading-relaxed text-black">
          BeWork accompagne les entreprises du BTP dans la{" "}
          <strong>préparation administrative et documentaire</strong> de leurs réponses : contrôle des pièces, conformité,
          mémoire technique, fichiers à déposer et vérifications finales — phase <strong>avant dépôt</strong>, distincte du
          suivi chantier ou de l&apos;exécution de marché.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SCOPE_BLOCKS.map((block) => (
            <article key={block.title} className="card-frame rounded-xl p-6">
              <h3 className="text-lg font-semibold text-black">{block.title}</h3>
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

        <div className="mt-10 card-frame rounded-xl border-[#1d4ed8]/25 bg-[#eff6ff]/40 p-6 md:p-8">
          <p className="text-base font-semibold leading-relaxed text-black md:text-lg">
            BeWork ne remplace pas l&apos;entreprise candidate : nous l&apos;aide à structurer, vérifier et sécuriser son
            dossier pour éviter les oublis, les incohérences et les erreurs de dépôt. Nous ne garantissons ni l&apos;attribution
            du marché, ni le gain de l&apos;appel d&apos;offres.
          </p>
        </div>

        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-black md:text-base">
          {OUTCOMES.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="inline-block size-1.5 rounded-full bg-[#1d4ed8]" aria-hidden />
              {item}
            </li>
          ))}
        </ul>

        <p className="mt-6 text-sm text-slate-700">
          Page complémentaire :{" "}
          <Link href="/reponse-appel-offres-btp" className="font-semibold text-[#1d4ed8] underline-offset-2 hover:underline">
            réponse aux appels d&apos;offres BTP
          </Link>
          {" · "}
          <Link href="/services/analyse-dce-btp" className="font-semibold text-[#1d4ed8] underline-offset-2 hover:underline">
            service analyse DCE
          </Link>
          {" · "}
          <Link href="/services/memoire-technique-btp" className="font-semibold text-[#1d4ed8] underline-offset-2 hover:underline">
            mémoire technique
          </Link>
        </p>

        <div className="mt-10 rounded-2xl border border-[#1d4ed8]/25 bg-gradient-to-br from-[#eff6ff] via-white to-[#eff6ff] p-8 text-center md:p-10">
          <h3 className="text-xl font-bold text-black md:text-2xl">Vous répondez à un appel d&apos;offres ?</h3>
          <p className="mx-auto mt-4 max-w-2xl text-black leading-relaxed">
            Transmettez-nous le DCE, vos pièces administratives et vos éléments techniques. BeWork vous aide à structurer le
            dossier, contrôler les pièces et préparer un dépôt propre.
          </p>
          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <CalendlyBookingLink
              className="w-full rounded-lg bg-[#1d4ed8] px-8 py-4 text-center font-semibold text-white shadow-md transition hover:bg-[#1e40af] sm:w-auto"
              trackLocation="missions-appels-offres-cta"
            >
              Préparer mon dossier d&apos;appel d&apos;offres
            </CalendlyBookingLink>
          </div>
        </div>
      </div>
    </section>
  );
}
