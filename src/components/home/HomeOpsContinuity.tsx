const OPS_ITEMS = [
  "Préparation du chantier",
  "Documents et photos",
  "Tâches et comptes rendus",
  "Fournisseurs et sous-traitants",
  "Situations de travaux",
  "Réserves et DOE",
  "Synthèses de direction",
] as const;

/** Continuité étude → exécution → réception. */
export function HomeOpsContinuity() {
  return (
    <section id="suivi-chantier" className="scroll-mt-24 bg-white px-6 py-14 md:py-20 lg:py-24" aria-labelledby="ops-heading">
      <div className="container-site">
        <header className="mx-auto max-w-3xl text-center">
          <h2 id="ops-heading" className="font-display text-balance text-[1.75rem] font-extrabold tracking-tight text-[#0f172a] md:text-[2.25rem]">
            Du marché remporté jusqu&apos;à la réception du chantier
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-700 md:text-lg">
            La plateforme accompagne la continuité entre la phase d&apos;étude et l&apos;exécution — un environnement
            unique, pas une collection d&apos;outils isolés.
          </p>
        </header>
        <ol className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center justify-center gap-2 md:gap-3">
          {OPS_ITEMS.map((item, i) => (
            <li key={item} className="flex items-center gap-2 md:gap-3">
              <span className="rounded-full border border-slate-200 bg-[#f8fafc] px-3.5 py-2 text-sm font-semibold text-[#0f172a]">
                {item}
              </span>
              {i < OPS_ITEMS.length - 1 ? (
                <span className="hidden text-slate-300 sm:inline" aria-hidden>
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
