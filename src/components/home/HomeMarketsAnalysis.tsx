import { HOME_BG_WHITE, HOME_CARD_SOFT, HOME_SECTION } from "@/components/home/homeSectionStyles";

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
    <section id="marches" className={`${HOME_SECTION} ${HOME_BG_WHITE}`} aria-labelledby="markets-heading">
      <div className="container-site">
        <div className="mx-auto grid max-w-5xl items-start gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1d4ed8]">Marchés</p>
            <h2
              id="markets-heading"
              className="font-display mt-3 text-balance text-[1.875rem] font-extrabold leading-[1.15] tracking-tight text-[#0f172a] md:text-[2.5rem]"
            >
              Analysez vos marchés plus rapidement et travaillez en équipe
            </h2>
            <p className="mt-6 text-base leading-relaxed text-slate-600 md:text-lg md:leading-relaxed">
              Centralisez un dossier de consultation et utilisez les outils BeWork pour préparer, contrôler et suivre
              vos réponses — sans remplacer l&apos;expertise de vos équipes.
            </p>
            <p className="mt-4 text-sm font-medium text-[#1d4ed8]">
              BeWork accompagne l&apos;analyse, la préparation et le contrôle des dossiers.
            </p>
          </div>
          <ul className="space-y-3">
            {MARKET_STEPS.map((step, i) => (
              <li key={step} className={`flex gap-3 ${HOME_CARD_SOFT} px-4 py-3.5`}>
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
