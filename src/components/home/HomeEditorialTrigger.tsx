import {
  HOME_BG_SOFT,
  HOME_CONTENT,
  HOME_EYEBROW,
  HOME_SECTION,
} from "@/components/home/homeSectionStyles";

/** Deuxième acte — le déclic éditorial. */
export function HomeEditorialTrigger() {
  return (
    <section
      id="possibilite"
      className={`${HOME_SECTION} ${HOME_BG_SOFT}`}
      aria-labelledby="editorial-trigger-heading"
    >
      <div className="container-site">
        <div className="mx-auto max-w-4xl">
          <p className={HOME_EYEBROW}>Le déclic</p>

          <h2
            id="editorial-trigger-heading"
            className="mt-6 font-display text-[2rem] font-extrabold leading-[1.05] tracking-[-0.04em] text-[#0a0a0a] sm:text-[2.75rem] md:text-[3.5rem] lg:text-[4rem]"
          >
            <span className="block text-slate-400">Vous n’êtes pas développeur.</span>
            <span className="mt-3 block sm:mt-4">
              Ce n’est plus
              <br className="hidden sm:block" />
              <span className="text-[#1d4ed8]"> le point de départ.</span>
            </span>
          </h2>

          <div
            className={`${HOME_CONTENT} max-w-2xl space-y-5 text-base leading-relaxed text-slate-600 sm:text-lg`}
          >
            <p>
              Vous connaissez votre métier.
              <br />
              Vous connaissez vos problèmes.
              <br />
              Vous avez probablement déjà imaginé les outils qui vous manquent.
            </p>
            <p>
              Pendant longtemps, les construire demandait des compétences
              techniques importantes.
            </p>
            <p>
              Aujourd’hui, l’intelligence artificielle permet à beaucoup plus de
              personnes de passer de l’idée au prototype, puis progressivement au
              véritable outil.
            </p>
          </div>

          <p className="mt-14 max-w-3xl font-display text-2xl font-extrabold leading-tight tracking-[-0.03em] text-[#0a0a0a] sm:mt-16 sm:text-3xl md:text-4xl">
            Vous avez les idées.
            <br />
            <span className="text-[#1d4ed8]">Apprenez à les construire.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
