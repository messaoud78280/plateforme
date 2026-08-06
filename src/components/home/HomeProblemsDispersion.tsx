const PROBLEMS = [
  {
    title: "Informations dispersées",
    text: "Emails, WhatsApp, appels et dossiers partagés — personne ne sait où chercher.",
  },
  {
    title: "Documents introuvables",
    text: "CCTP, plans, CR et pièces marché éparpillés ; le chantier attend.",
  },
  {
    title: "Rupture bureau / chantier",
    text: "Ce qui est décidé au bureau n’arrive pas clairement sur le terrain.",
  },
  {
    title: "Tâches sans responsable",
    text: "Actions oubliées, échéances floues, relances qui tombent dans le vide.",
  },
  {
    title: "Conducteurs débordés",
    text: "Le terrain avance, le dossier administratif et documentaire s’accumule.",
  },
  {
    title: "AO complexes à analyser",
    text: "DCE volumineux, clauses sensibles, pièces à croiser — peu de temps pour préparer.",
  },
  {
    title: "Peu de visibilité direction",
    text: "Le dirigeant manque d’une synthèse claire sur l’activité et les risques.",
  },
  {
    title: "Outils qui ne dialoguent pas",
    text: "Drive, Excel, messagerie, ERP… sans fil conducteur ni historique commun.",
  },
] as const;

/** Difficultés terrain — lecture rapide. */
export function HomeProblemsDispersion() {
  return (
    <section id="problemes" className="bg-[#f8fafc] px-6 py-14 md:py-20 lg:py-24" aria-labelledby="problems-heading">
      <div className="container-site">
        <header className="mx-auto max-w-2xl text-center">
          <h2 id="problems-heading" className="font-display text-balance text-[1.75rem] font-extrabold tracking-tight text-[#0f172a] md:text-[2.25rem]">
            Vos équipes travaillent. L&apos;information, elle, reste dispersée.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-700 md:text-lg">
            Les mêmes freins reviennent dans les entreprises du BTP structurées ou en croissance.
          </p>
        </header>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROBLEMS.map((p) => (
            <li key={p.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-bold text-[#0f172a]">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
