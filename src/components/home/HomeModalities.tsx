import Link from "next/link";
import {
  BW_CARD,
  BW_EYEBROW,
  BW_H2,
  BW_SECTION_TIGHT,
} from "./homeSectionStyles";
import { TRAINING_MODALITIES } from "@/lib/bework-formation";

/** Modalités de participation — distinctes du choix de parcours 7 h / 14 h. */
export function HomeModalities() {
  return (
    <section id="modalites" className={BW_SECTION_TIGHT} aria-labelledby="home-modalites-title">
      <div className="container-site">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
          <header>
            <p className={BW_EYEBROW}>Modalités</p>
            <h2 id="home-modalites-title" className={`${BW_H2} mt-3`}>
              Deux façons de participer.
            </h2>
            <p className="mt-4 max-w-lg text-[1rem] leading-relaxed text-slate-500">
              Présentiel ou visio&nbsp;: la modalité change, pas l’ambition ni le parcours choisi.
            </p>
          </header>

          <div className="grid gap-3 sm:grid-cols-2">
            {Object.values(TRAINING_MODALITIES).map((modality) => (
              <article
                key={modality.name}
                className={`${BW_CARD} p-5 transition duration-300 hover:-translate-y-0.5 hover:border-[#275be8]/20 hover:shadow-[0_18px_46px_rgba(30,50,90,0.08)] motion-reduce:transform-none motion-reduce:transition-none sm:p-6`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-xl font-extrabold tracking-[-0.03em] text-[#0b0d12]">
                    {modality.name}
                  </h3>
                  <span className="rounded-full border border-[#275be8]/15 bg-[#f1f6ff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#275be8]">
                    {modality.badge}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {modality.description}
                </p>
              </article>
            ))}
          </div>
        </div>

        <p className="mt-5 text-right">
          <Link
            href="/formation#modalites"
            className="rounded-md text-sm font-semibold text-[#275be8] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#275be8]"
          >
            Comparer les modalités →
          </Link>
        </p>
      </div>
    </section>
  );
}
