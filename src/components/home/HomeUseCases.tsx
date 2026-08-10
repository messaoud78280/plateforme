import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HOME_CONTENT, HOME_SECTION } from "@/components/home/homeSectionStyles";

const CASES = [
  {
    problem: "Nos conducteurs passent des heures à analyser les dossiers.",
    orientation: "Solution IA documentaire à étudier.",
  },
  {
    problem: "Nous avons des milliers de documents et personne ne retrouve l'information.",
    orientation: "Recherche intelligente à étudier.",
  },
  {
    problem: "Nous répétons cette opération des dizaines de fois par semaine.",
    orientation: "Automatisation à étudier.",
  },
  {
    problem: "Nous utilisons déjà plusieurs logiciels.",
    orientation: "Intégration / connexion IA à étudier.",
  },
  {
    problem: "Nous avons une idée, mais aucun logiciel du marché ne le fait.",
    orientation: "Conception d'une solution métier à étudier.",
  },
] as const;

/** Situations concrètes — cas d'usage, pas promesses universelles. */
export function HomeUseCases() {
  return (
    <section id="cas-usage" className={`${HOME_SECTION} bg-white`} aria-labelledby="cases-heading">
      <div className="container-site">
        <HomeSectionHeader
          id="cases-heading"
          title="Des situations que nous rencontrons souvent."
          lead="Des cas d'usage à étudier — pas des promesses techniques universelles."
        />

        <ul className={`${HOME_CONTENT} mx-auto max-w-3xl space-y-8 sm:space-y-10`}>
          {CASES.map((c) => (
            <li key={c.problem} className="border-t border-slate-100 pt-8 first:border-t-0 first:pt-0">
              <p className="font-display text-xl font-extrabold tracking-tight text-[#0a0a0a] sm:text-2xl">
                «&nbsp;{c.problem}&nbsp;»
              </p>
              <p className="mt-3 text-sm font-medium text-slate-500 sm:text-base">→ {c.orientation}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
