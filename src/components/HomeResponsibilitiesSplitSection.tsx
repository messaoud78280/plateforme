/**
 * Répartition des responsabilités — BeWork fait avancer / l’entreprise décide.
 * Section unique : les autres blocs de la page ne répètent plus ce périmètre en détail.
 */
const BEWORK_ADVANCES = [
  "Documents",
  "Tableaux",
  "Relances",
  "Échéances",
  "Dossiers administratifs",
  "Livrables préparatoires",
  "Situations et justificatifs",
  "Réserves et DOE",
] as const;

const COMPANY_DECIDES = [
  "Prix",
  "Marges",
  "Métrés engageants",
  "Choix techniques",
  "Méthodes",
  "Moyens",
  "Engagements contractuels",
  "Signature",
  "Validation finale",
] as const;

export function HomeResponsibilitiesSplitSection() {
  return (
    <section
      id="repartition-responsabilites"
      className="relative bg-transparent px-6 py-14 md:py-20 lg:py-24"
      aria-labelledby="responsabilites-heading"
      style={{ scrollMarginTop: "6rem" }}
    >
      <div className="container-site">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="responsabilites-heading"
            className="font-display text-balance text-[1.75rem] font-extrabold leading-[1.12] tracking-[-0.02em] text-[#0f172a] md:text-[2.25rem]"
          >
            Vous gardez le pilotage. Nous faisons avancer les dossiers.
          </h2>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-[#1d4ed8]/25 bg-white p-6 shadow-sm ring-1 ring-[#1d4ed8]/10 md:p-7">
            <h3 className="text-lg font-bold tracking-tight text-[#1d4ed8]">BeWork fait avancer</h3>
            <ul className="mt-5 space-y-2.5">
              {BEWORK_ADVANCES.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[0.9375rem] leading-snug text-slate-800">
                  <span className="mt-0.5 font-bold text-[#1d4ed8]" aria-hidden>
                    ·
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm md:p-7">
            <h3 className="text-lg font-bold tracking-tight text-[#0f172a]">Votre entreprise décide</h3>
            <ul className="mt-5 space-y-2.5">
              {COMPANY_DECIDES.map((item) => (
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

        <p className="mx-auto mt-8 max-w-2xl text-center text-base font-medium leading-relaxed text-slate-800">
          Votre conducteur conserve le pilotage. BeWork lui apporte le temps, la méthode et la continuité nécessaires
          pour tenir ses dossiers.
        </p>
      </div>
    </section>
  );
}
