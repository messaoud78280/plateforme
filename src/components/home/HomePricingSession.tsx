import Link from "next/link";
import {
  HOME_BG_SOFT,
  HOME_BTN_PRIMARY,
  HOME_CONTENT,
  HOME_EYEBROW,
  HOME_SECTION,
} from "@/components/home/homeSectionStyles";
import { BEWORK_SESSION_PRICE_EUR } from "@/lib/bework-formation";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

const INCLUDES = [
  "Une journée complète de formation pratique",
  "Accompagnement en petit groupe",
  "Préparation et installation de l’environnement nécessaire",
  "Démonstrations concrètes",
  "Exercices et mise en pratique directement sur ordinateur",
  "Apprentissage d’une méthode de travail structurée",
  "Accompagnement pendant toute la journée",
  "Possibilité de réfléchir à son propre projet",
  "Aucun prérequis en programmation",
] as const;

/** Tarif — conclusion de la valeur, une seule offre premium. */
export function HomePricingSession() {
  return (
    <section
      id="tarif"
      className={`${HOME_SECTION} ${HOME_BG_SOFT}`}
      aria-labelledby="tarif-heading"
    >
      <div className="container-site">
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[1.75rem] border border-slate-200/90 bg-white px-6 py-12 shadow-[0_16px_48px_rgba(15,23,42,0.06)] sm:px-10 sm:py-14 md:px-14">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            aria-hidden
            style={{
              backgroundImage:
                "linear-gradient(rgba(15,23,42,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.03) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              maskImage:
                "radial-gradient(ellipse 80% 70% at 50% 0%, #000 20%, transparent 75%)",
            }}
          />
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#2563eb]/10 blur-3xl"
            aria-hidden
          />

          <div className="relative text-center">
            <p className={HOME_EYEBROW}>La journée BeWork</p>
            <h2
              id="tarif-heading"
              className="mt-4 font-display text-[1.85rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#0a0a0a] sm:text-[2.5rem] md:text-[3rem]"
            >
              Une journée pour apprendre
              <br />
              <span className="text-[#1d4ed8]">à créer autrement.</span>
            </h2>

            <div className="mt-10 sm:mt-12">
              <p className="font-display text-5xl font-extrabold tracking-tight text-[#0a0a0a] sm:text-6xl">
                {BEWORK_SESSION_PRICE_EUR}&nbsp;€
              </p>
              <p className="mt-2 text-sm font-medium text-slate-500 sm:text-base">
                / participant
              </p>
            </div>
          </div>

          <div className={`relative ${HOME_CONTENT}`}>
            <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Ce que comprend la journée
            </p>
            <ul className="mx-auto mt-6 max-w-lg space-y-3">
              {INCLUDES.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-3 text-sm leading-relaxed text-slate-700 sm:text-[15px]"
                >
                  <span
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563eb]"
                    aria-hidden
                  />
                  {line}
                </li>
              ))}
            </ul>

            <p className="mx-auto mt-10 max-w-md text-center text-base leading-relaxed text-slate-600 sm:text-lg">
              Vous venez avec vos idées. Nous vous montrons comment commencer à
              les construire.
            </p>

            <div className="mt-8 flex justify-center">
              <Link
                href="/contact#participer"
                className={HOME_BTN_PRIMARY}
                {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-tarif-participer")}
              >
                Participer à une prochaine session
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
