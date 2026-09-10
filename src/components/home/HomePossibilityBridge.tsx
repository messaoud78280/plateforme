import {
  HOME_BG_SOFT,
  HOME_CARD,
  HOME_CONTENT,
  HOME_EYEBROW,
  HOME_H2,
  HOME_HEADER,
  HOME_LEAD,
  HOME_SECTION,
} from "@/components/home/homeSectionStyles";

/** Transition après le hero — stimuler l’imagination avant la formation. */
export function HomePossibilityBridge() {
  return (
    <section
      id="possibilite"
      className={`${HOME_SECTION} ${HOME_BG_SOFT}`}
      aria-labelledby="possibility-heading"
    >
      <div className="container-site">
        <div className={HOME_HEADER}>
          <p className={HOME_EYEBROW}>Une nouvelle façon de créer</p>
          <h2 id="possibility-heading" className={HOME_H2}>
            Et si votre prochaine application était créée par vous&nbsp;?
          </h2>
          <div className={`${HOME_LEAD} space-y-4 text-left sm:mx-auto sm:text-center`}>
            <p>
              Vous connaissez votre métier. Vous connaissez vos problèmes. Vous
              savez souvent exactement ce qui vous manque.
            </p>
            <p>
              Jusqu’à présent, construire cet outil demandait des compétences
              techniques importantes.
            </p>
            <p>
              L’intelligence artificielle change progressivement cette règle.
              BeWork vous apprend à transformer un besoin, une idée ou même une
              simple intuition en projet numérique concret.
            </p>
          </div>
        </div>

        <div
          className={`${HOME_CONTENT} mx-auto grid max-w-3xl gap-4 sm:grid-cols-2`}
        >
          <article className={`${HOME_CARD} p-6 sm:p-8`}>
            <p className="font-display text-lg font-extrabold tracking-tight text-[#0a0a0a] sm:text-xl">
              Votre métier vous donne les idées.
            </p>
          </article>
          <article className={`${HOME_CARD} border-[#2563eb]/15 bg-[#eff6ff]/40 p-6 sm:p-8`}>
            <p className="font-display text-lg font-extrabold tracking-tight text-[#1d4ed8] sm:text-xl">
              L’IA peut vous aider à les construire.
            </p>
          </article>
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed text-slate-500 sm:text-base">
          L’IA ne supprime pas la complexité de tous les projets. Mais elle
          permet aujourd’hui à des non-développeurs de créer des prototypes, des
          outils et des applications qui leur étaient auparavant beaucoup moins
          accessibles.
        </p>
      </div>
    </section>
  );
}
