import {
  HOME_BG_WHITE,
  HOME_SECTION,
} from "@/components/home/homeSectionStyles";

/** Pause spectaculaire — la grande question. */
export function HomeBigQuestion() {
  return (
    <section
      id="question"
      className={`${HOME_SECTION} ${HOME_BG_WHITE}`}
      aria-labelledby="big-question-heading"
    >
      <div className="container-site">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200/80 bg-gradient-to-b from-[#0b1526] via-[#0f1e3a] to-[#111827] px-6 py-16 text-center sm:px-10 sm:py-20 md:py-24">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            aria-hidden
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage:
                "radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 80%)",
            }}
          />
          <div
            className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-[#2563eb]/25 blur-3xl"
            aria-hidden
          />

          <p className="relative text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50">
            Imagination
          </p>
          <h2
            id="big-question-heading"
            className="relative mt-5 font-display text-[2.4rem] font-extrabold leading-[1.02] tracking-[-0.045em] text-white sm:text-[3.5rem] md:text-[4.5rem] lg:text-[5.25rem]"
          >
            Et vous,
            <br />
            qu’est-ce que
            <br />
            <span className="text-[#93c5fd]">vous créeriez&nbsp;?</span>
          </h2>

          <ul className="relative mx-auto mt-10 max-w-xl space-y-3 text-left text-sm leading-relaxed text-white/70 sm:mt-12 sm:text-base">
            <li>Un outil pour votre métier&nbsp;?</li>
            <li>Une application pour vos clients&nbsp;?</li>
            <li>Un système qui n’existe pas encore&nbsp;?</li>
            <li>
              Un projet que vous repoussez parce que vous ne savez pas comment le
              construire&nbsp;?
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
