import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import {
  HOME_BG_WHITE,
  HOME_CARD,
  HOME_CONTENT,
  HOME_SECTION,
} from "@/components/home/homeSectionStyles";
import { METIER_IDEAS } from "@/lib/bework-formation";

/** Idées par métier — bandeau défilant + grille. */
export function HomeMetierIdeas() {
  const loop = [...METIER_IDEAS, ...METIER_IDEAS];

  return (
    <section
      id="metiers"
      className={`${HOME_SECTION} ${HOME_BG_WHITE}`}
      aria-labelledby="metier-ideas-heading"
    >
      <div className="container-site">
        <HomeSectionHeader
          id="metier-ideas-heading"
          eyebrow="Par métier"
          title="Une idée différente pour chaque métier"
          lead="Le même principe, des usages très différents. Voici quelques pistes — la vôtre peut être ailleurs."
        />
      </div>

      <div
        className={`${HOME_CONTENT} relative hidden overflow-hidden motion-safe:block`}
        aria-hidden
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white to-transparent sm:w-20" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white to-transparent sm:w-20" />
        <div className="flex w-max animate-[home-marquee_42s_linear_infinite]">
          {loop.map((item, i) => (
            <div
              key={`${item.metier}-${i}`}
              className="mx-2 flex w-[220px] shrink-0 flex-col rounded-2xl border border-slate-200/90 bg-[#fafafa] px-5 py-4 sm:mx-2.5 sm:w-[240px]"
            >
              <p className="font-display text-sm font-bold tracking-tight text-[#0a0a0a]">
                {item.metier}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{item.idea}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="container-site mt-8 sm:mt-10">
        <ul className="mx-auto grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-4 motion-safe:hidden">
          {METIER_IDEAS.map((item) => (
            <li key={item.metier} className={`${HOME_CARD} p-5`}>
              <p className="font-display text-sm font-bold tracking-tight text-[#0a0a0a]">
                {item.metier}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{item.idea}</p>
            </li>
          ))}
        </ul>

        {/* Liste pour lecteurs d’écran quand le marquee est affiché */}
        <ul className="sr-only motion-reduce:hidden">
          {METIER_IDEAS.map((item) => (
            <li key={`a11y-${item.metier}`}>
              {item.metier} — {item.idea}
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-slate-500">
          Votre métier n&apos;est pas dans la liste&nbsp;? Tant mieux : la formation part de{" "}
          <span className="font-semibold text-[#0a0a0a]">votre</span> besoin, pas d&apos;un modèle
          figé.
        </p>
      </div>
    </section>
  );
}
