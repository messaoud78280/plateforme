import {
  HOME_BG_SOFT,
  HOME_CONTENT,
  HOME_EYEBROW,
  HOME_SECTION,
} from "@/components/home/homeSectionStyles";

/** Rassurer les débutants — sans infantiliser. */
export function HomeStartFromZero() {
  const lines = [
    "Jamais codé.",
    "Pas développeur.",
    "Pas informaticien.",
    "Pas de vocabulaire technique.",
  ] as const;

  return (
    <section
      id="partir-de-zero"
      className={`${HOME_SECTION} ${HOME_BG_SOFT}`}
      aria-labelledby="zero-heading"
    >
      <div className="container-site">
        <div className="mx-auto max-w-4xl">
          <p className={HOME_EYEBROW}>Débutants bienvenus</p>
          <h2
            id="zero-heading"
            className="mt-5 font-display text-[2rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#0a0a0a] sm:text-[2.75rem] md:text-[3.25rem]"
          >
            <span className="block text-slate-400">Vous partez de zéro&nbsp;?</span>
            <span className="mt-2 block">C’est justement le principe.</span>
          </h2>

          <ul className={`${HOME_CONTENT} max-w-xl space-y-3`}>
            {lines.map((line) => (
              <li
                key={line}
                className="font-display text-xl font-bold tracking-tight text-slate-500 sm:text-2xl"
              >
                {line}
              </li>
            ))}
          </ul>

          <p className="mt-12 font-display text-2xl font-extrabold tracking-tight text-[#0a0a0a] sm:mt-14 sm:text-3xl">
            Ce n’est pas ce que nous vous demandons.
          </p>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            BeWork ne cherche pas à transformer quelqu’un en développeur en une
            journée. BeWork lui apprend une nouvelle manière de construire.
          </p>
        </div>
      </div>
    </section>
  );
}
