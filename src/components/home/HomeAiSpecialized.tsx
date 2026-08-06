const AI_ACTIONS = [
  "Analyser un CCTP",
  "Examiner un CCAP",
  "Résumer un dossier de consultation",
  "Comparer CCTP et DPGF",
  "Préparer un compte rendu",
  "Extraire les actions à réaliser",
  "Rechercher une information dans les documents",
  "Contrôler les pièces d’un DOE",
  "Identifier les échéances",
  "Produire une synthèse pour le dirigeant",
] as const;

/** Outils IA présentés comme actions métier. */
export function HomeAiSpecialized() {
  return (
    <section id="outils-ia" className="scroll-mt-24 bg-white px-6 py-14 md:py-20 lg:py-24" aria-labelledby="ai-heading">
      <div className="container-site">
        <header className="mx-auto max-w-3xl text-center">
          <h2 id="ai-heading" className="font-display text-balance text-[1.75rem] font-extrabold tracking-tight text-[#0f172a] md:text-[2.25rem]">
            Une intelligence artificielle conçue pour des usages métier
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-700 md:text-lg">
            L&apos;IA analyse, structure, résume, contrôle et assiste les équipes. Les décisions et validations restent
            sous le contrôle des professionnels de l&apos;entreprise.
          </p>
        </header>

        <ul className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-2">
          {AI_ACTIONS.map((label) => (
            <li
              key={label}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-[#f8fafc] px-4 py-3.5 text-sm font-semibold text-[#0f172a]"
            >
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eff6ff] text-xs font-bold text-[#1d4ed8]" aria-hidden>
                IA
              </span>
              {label}
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-8 max-w-2xl rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-center text-sm leading-relaxed text-slate-800">
          Les résultats sont vérifiés et validés par vos équipes. BeWork n&apos;affirme pas la conformité d&apos;un
          dossier ni ne remplace l&apos;expertise d&apos;un professionnel.
        </p>
      </div>
    </section>
  );
}
