const PILLARS = [
  "Équipes et rôles",
  "Chantiers et affaires",
  "Documents et photos",
  "Messages et validations",
  "Tâches et échéances",
  "Marchés et analyses",
  "Outils IA métier",
  "Tableaux de bord",
] as const;

/** Solution — environnement unique. */
export function HomeUnifiedEnvironment() {
  return (
    <section id="plateforme" className="scroll-mt-24 bg-white px-6 py-14 md:py-20 lg:py-24" aria-labelledby="solution-heading">
      <div className="container-site">
        <header className="mx-auto max-w-3xl text-center">
          <h2 id="solution-heading" className="font-display text-balance text-[1.75rem] font-extrabold tracking-tight text-[#0f172a] md:text-[2.25rem]">
            Un environnement unique pour organiser toute votre activité
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-700 md:text-lg">
            BeWork relie l&apos;information à un chantier, une affaire, une tâche ou un responsable — au lieu de la
            laisser se perdre entre plusieurs outils.
          </p>
        </header>
        <ul className="mx-auto mt-12 grid max-w-4xl gap-3 sm:grid-cols-2 md:grid-cols-4">
          {PILLARS.map((label) => (
            <li
              key={label}
              className="rounded-xl border border-[#1d4ed8]/20 bg-[#eff6ff]/50 px-4 py-3.5 text-center text-sm font-semibold text-[#0f172a]"
            >
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
