const MARKET_STEPS = [
  "Classer les pièces du dossier de consultation",
  "Identifier dates, critères de notation et clauses sensibles",
  "Analyser CCTP, CCAP, DPGF, BPU et DQE",
  "Comparer les pièces et signaler les manques",
  "Répartir le travail et suivre la préparation de la réponse",
  "Conserver analyses, questions et décisions",
] as const;

/** Marchés publics et privés. */
export function HomeMarketsAnalysis() {
  return (
    <section id="marches" className="scroll-mt-24 bg-[#f8fafc] px-6 py-14 md:py-20 lg:py-24" aria-labelledby="markets-heading">
      <div className="container-site">
        <div className="mx-auto grid max-w-5xl items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <h2 id="markets-heading" className="font-display text-balance text-[1.75rem] font-extrabold tracking-tight text-[#0f172a] md:text-[2.25rem]">
              Analysez vos marchés plus rapidement et travaillez en équipe
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-700 md:text-lg">
              Centralisez un dossier de consultation et utilisez les outils BeWork pour préparer, contrôler et suivre
              vos réponses — sans remplacer l&apos;expertise de vos équipes.
            </p>
            <p className="mt-4 text-sm font-medium text-[#1d4ed8]">
              BeWork accompagne l&apos;analyse, la préparation et le contrôle des dossiers.
            </p>
          </div>
          <ul className="space-y-3">
            {MARKET_STEPS.map((step, i) => (
              <li key={step} className="flex gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1d4ed8] text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-sm font-medium leading-snug text-slate-800">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
