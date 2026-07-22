import Link from "next/link";

/**
 * Trois familles de missions — positionnement AO / candidatures / suivi.
 */
const FAMILIES = [
  {
    id: "appels-offres",
    title: "Appels d’offres et candidatures",
    intro:
      "Renfort pour préparer et organiser vos réponses aux appels d’offres publics et privés — sans décider à votre place.",
    items: [
      "Veille et suivi des opportunités selon la mission",
      "Lecture et classement du DCE",
      "Identification des pièces demandées",
      "Préparation des candidatures",
      "Contrôle des pièces administratives",
      "Suivi des dates limites",
      "Tableaux de conformité",
      "Préparation du dossier avant validation",
      "Assistance à la structuration du mémoire technique",
      "Organisation des éléments nécessaires au dépôt",
    ],
    href: "/assistants-administratifs-taches#reponses-appels-offres",
    linkLabel: "Voir les missions appels d’offres",
  },
  {
    id: "preparation-reponse",
    title: "Préparation et organisation de la réponse",
    intro:
      "Nous structurons le dossier avec vos équipes. BeWork ne fixe pas seul les prix et ne décide pas seul des solutions techniques.",
    items: [
      "Centralisation des données",
      "Préparation des trames",
      "Organisation des justificatifs",
      "Vérification de la cohérence documentaire",
      "Suivi des informations manquantes",
      "Préparation des documents à faire valider",
      "Assistance aux dirigeants, chargés d’affaires, métreurs et conducteurs de travaux",
    ],
    href: "/services/analyse-dce-btp",
    linkLabel: "Analyse DCE & préparation",
  },
  {
    id: "suivi-apres-attribution",
    title: "Suivi administratif après attribution",
    intro:
      "Assistance documentaire et administrative du marché — BeWork n’est pas responsable de l’exécution technique du chantier.",
    items: [
      "Classement du marché",
      "Suivi des échéances",
      "Documents de démarrage",
      "Ordres de service",
      "Situations de travaux",
      "Chorus Pro",
      "Comptes rendus",
      "Réserves",
      "Suivi documentaire",
      "DOE",
      "Relances et traçabilité des échanges",
    ],
    href: "/assistants-administratifs-taches#marches-publics-accords-cadres",
    linkLabel: "Suivi après attribution",
  },
] as const;

export function HomeMissionFamiliesSection() {
  return (
    <section
      id="missions-renfort"
      className="relative bg-transparent px-6 py-10 md:py-14"
      aria-labelledby="missions-renfort-heading"
      style={{ scrollMarginTop: "6rem" }}
    >
      <div className="container-site">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-heading text-sm font-semibold uppercase tracking-[0.18em] text-[#1d4ed8]">
            Les missions sur lesquelles nous renforçons vos équipes
          </p>
          <h2
            id="missions-renfort-heading"
            className="font-heading mt-3 text-balance text-2xl font-bold tracking-tight text-[#0f172a] md:text-3xl"
          >
            En renfort de vos équipes, de la préparation de la candidature au suivi administratif du marché
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-700 md:text-lg">
            Trois familles de missions. Pas de prise en charge intégrale « clé en main » : un Beworker prépare,
            structure et suit, sous votre validation.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-6xl gap-5 lg:grid-cols-3 lg:gap-6">
          {FAMILIES.map((family) => (
            <article
              key={family.id}
              id={family.id}
              className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm ring-1 ring-slate-100/80 md:p-7"
            >
              <h3 className="font-heading text-lg font-bold tracking-tight text-[#0f172a] md:text-xl">{family.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-[0.9375rem]">{family.intro}</p>
              <ul className="mt-5 flex-1 space-y-2">
                {family.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm leading-snug text-slate-800">
                    <span className="mt-0.5 shrink-0 font-bold text-[#1d4ed8]" aria-hidden>
                      ·
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6">
                <Link
                  href={family.href}
                  className="text-sm font-semibold text-[#1d4ed8] underline-offset-2 hover:underline"
                >
                  {family.linkLabel} →
                </Link>
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
