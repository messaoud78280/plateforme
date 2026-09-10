import Link from "next/link";
import {
  HOME_BG_WHITE,
  HOME_BTN_SECONDARY,
  HOME_CONTENT,
  HOME_EYEBROW,
  HOME_SECTION,
} from "@/components/home/homeSectionStyles";
import { FORMATION_DAY_STEPS } from "@/lib/bework-formation";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

/** Présentation de la journée — après l’envie de créer. */
export function HomeFormationDay() {
  return (
    <section
      id="journee"
      className={`${HOME_SECTION} ${HOME_BG_WHITE}`}
      aria-labelledby="journee-heading"
    >
      <div className="container-site">
        <div className="mx-auto max-w-4xl">
          <p className={`${HOME_EYEBROW} text-[#1d4ed8]`}>Ok. Mais comment commencer&nbsp;?</p>
          <h2
            id="journee-heading"
            className="mt-5 font-display text-[2rem] font-extrabold leading-[1.06] tracking-[-0.04em] text-[#0a0a0a] sm:text-[2.75rem] md:text-[3.5rem]"
          >
            Une journée
            <br />
            pour apprendre
            <br />
            à passer de l’idée
            <br />
            <span className="text-[#1d4ed8]">à la construction.</span>
          </h2>

          <div className="mt-8 max-w-2xl space-y-4 text-base leading-relaxed text-slate-600 sm:mt-10 sm:text-lg">
            <p>
              BeWork organise des journées pratiques en petit groupe pour
              découvrir cette nouvelle façon de créer.
            </p>
            <p>Nous avançons ensemble, directement sur votre ordinateur.</p>
            <p>
              Vous découvrez les principes, expérimentez, construisez et
              repartez avec une méthode que vous pourrez continuer à utiliser.
            </p>
          </div>

          <p className="mt-10 text-sm font-semibold text-slate-500">
            Le site montre ce qui est possible. La journée vous apprend comment y
            arriver.
          </p>
        </div>

        <ol
          className={`${HOME_CONTENT} mx-auto grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4`}
        >
          {FORMATION_DAY_STEPS.map((step, i) => (
            <li
              key={step.title}
              className="relative rounded-2xl border border-slate-200/90 bg-[#fafafa] p-5 sm:p-6"
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="mt-3 font-display text-xl font-extrabold tracking-tight text-[#0a0a0a]">
                {step.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.text}</p>
              {i < FORMATION_DAY_STEPS.length - 1 ? (
                <span
                  className="pointer-events-none absolute -right-2 top-1/2 hidden text-slate-300 lg:block"
                  aria-hidden
                >
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>

        <div className="mt-12 flex justify-center sm:mt-14">
          <Link
            href="/#tarif"
            className={HOME_BTN_SECONDARY}
            {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-journee-tarif")}
          >
            Voir ce que comprend la journée
          </Link>
        </div>
      </div>
    </section>
  );
}
