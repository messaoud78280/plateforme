/**
 * Répartition des responsabilités — BeWork prépare / client valide.
 */
const BEWORK_PREPARE = [
  "Classement et analyse documentaire du DCE",
  "Tableaux de conformité",
  "Listes de pièces demandées",
  "Dossiers de candidature",
  "Suivi des échéances",
  "Pièces administratives",
  "Structure du mémoire technique",
  "Centralisation des informations",
  "Documents préparatoires au dépôt",
  "Documents administratifs après attribution",
  "Situations, réserves, DOE et suivi selon la mission",
] as const;

const CLIENT_VALIDE = [
  "Décision de candidater",
  "Prix et marges",
  "Métrés engageants et rendements",
  "Choix techniques",
  "Méthodes d’exécution",
  "Moyens humains et matériels",
  "Délais proposés",
  "Engagements contractuels",
  "Signature",
  "Dépôt définitif ou autorisation de dépôt",
] as const;

export function HomeResponsibilitiesSplitSection() {
  return (
    <section
      id="repartition-responsabilites"
      className="relative bg-transparent px-6 py-10 md:py-14"
      aria-labelledby="responsabilites-heading"
      style={{ scrollMarginTop: "6rem" }}
    >
      <div className="container-site">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-heading text-sm font-semibold uppercase tracking-[0.18em] text-[#1d4ed8]">
            Périmètre clair
          </p>
          <h2
            id="responsabilites-heading"
            className="font-heading mt-3 text-balance text-2xl font-bold tracking-tight text-[#0f172a] md:text-3xl"
          >
            Ce que BeWork prépare, ce que votre entreprise valide
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-700 md:text-lg">
            BeWork fournit une assistance opérationnelle et documentaire. Les validations juridiques, techniques,
            financières et contractuelles restent sous la responsabilité de l&apos;entreprise cliente et de ses conseils.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-2 md:gap-6">
          <article className="rounded-2xl border border-[#1d4ed8]/25 bg-white p-6 shadow-sm ring-1 ring-[#1d4ed8]/10 md:p-7">
            <h3 className="font-heading text-lg font-bold tracking-tight text-[#1d4ed8] md:text-xl">BeWork prépare et suit</h3>
            <ul className="mt-5 space-y-2.5">
              {BEWORK_PREPARE.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[0.9375rem] leading-snug text-slate-800">
                  <span className="mt-0.5 font-bold text-[#1d4ed8]" aria-hidden>
                    ·
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm ring-1 ring-slate-100 md:p-7">
            <h3 className="font-heading text-lg font-bold tracking-tight text-[#0f172a] md:text-xl">
              Votre entreprise décide et valide
            </h3>
            <ul className="mt-5 space-y-2.5">
              {CLIENT_VALIDE.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[0.9375rem] leading-snug text-slate-800">
                  <span className="mt-0.5 font-bold text-slate-500" aria-hidden>
                    ·
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
