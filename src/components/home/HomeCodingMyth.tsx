import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import {
  HOME_BG_WHITE,
  HOME_CARD,
  HOME_CONTENT,
  HOME_SECTION,
} from "@/components/home/homeSectionStyles";

const POINTS = [
  {
    title: "Une idée claire suffit pour commencer",
    text: "Vous n’avez pas besoin d’un bagage technique. Ce qui compte, c’est de savoir ce que vous voulez construire — même approximativement.",
  },
  {
    title: "L’IA guide, vous décidez",
    text: "Vous apprenez à diriger la création : préciser le besoin, relire le résultat, ajuster, et avancer pas à pas.",
  },
  {
    title: "La méthode reste après la journée",
    text: "L’objectif n’est pas de tout finir en une session. C’est de repartir capable de continuer seul, à votre rythme.",
  },
] as const;

/** Section — démystifier le frein « il faut savoir coder ». */
export function HomeCodingMyth() {
  return (
    <section
      id="coder"
      className={`${HOME_SECTION} ${HOME_BG_WHITE}`}
      aria-labelledby="coding-myth-heading"
    >
      <div className="container-site">
        <HomeSectionHeader
          id="coding-myth-heading"
          eyebrow="Sans prérequis"
          title="Vous pensiez qu’il fallait savoir coder&nbsp;?"
          lead="Beaucoup de projets n’avancent jamais pour cette seule raison. Aujourd’hui, créer un site, une application ou un outil métier devient accessible — à condition d’avoir une méthode."
        />

        <div
          className={`${HOME_CONTENT} mx-auto grid max-w-5xl gap-4 sm:grid-cols-3 sm:gap-5`}
        >
          {POINTS.map((point) => (
            <article key={point.title} className={`${HOME_CARD} p-6 sm:p-7`}>
              <h3 className="font-display text-lg font-bold tracking-tight text-[#0a0a0a]">
                {point.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{point.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
