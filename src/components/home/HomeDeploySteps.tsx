const STEPS = [
  {
    title: "Diagnostic de votre fonctionnement",
    text: "Circulation de l’information, outils actuels, responsabilités, documents, validations et besoins de pilotage.",
  },
  {
    title: "Sélection des modules et workflows",
    text: "Choix des briques utiles à votre organisation, sans surcharge inutile.",
  },
  {
    title: "Configuration et outils IA",
    text: "Personnalisation des droits, formulaires, tableaux de bord et assistants métier.",
  },
  {
    title: "Déploiement et amélioration continue",
    text: "Mise en service, formation des équipes et ajustements selon le terrain.",
  },
] as const;

/** Méthode de déploiement en 4 étapes. */
export function HomeDeploySteps() {
  return (
    <section id="methode" className="scroll-mt-24 bg-white px-6 py-14 md:py-20 lg:py-24" aria-labelledby="method-heading">
      <div className="container-site">
        <header className="mx-auto max-w-2xl text-center">
          <h2 id="method-heading" className="font-display text-balance text-[1.75rem] font-extrabold tracking-tight text-[#0f172a] md:text-[2.25rem]">
            Une plateforme construite autour de votre organisation
          </h2>
        </header>
        <ol className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1d4ed8] text-sm font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-3 text-base font-bold text-[#0f172a]">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
