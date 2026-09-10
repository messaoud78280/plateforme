import Link from "next/link";
import {
  BW_BTN_PRIMARY,
  BW_EYEBROW,
  BW_SECTION,
} from "@/components/home/homeSectionStyles";
import { BwAtmosphere } from "@/components/home/BwAtmosphere";
import { BEWORK_SESSION_PRICE_EUR } from "@/lib/bework-formation";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

const INCLUDES = [
  "Journée complète",
  "Petit groupe",
  "Démonstrations",
  "Préparation de l’environnement",
  "Pratique guidée",
  "Accompagnement",
  "Réflexion autour de votre projet",
  "Méthode réutilisable",
] as const;

/** Tarif — après la valeur, bloc premium unique. */
export function HomePricingSession() {
  return (
    <section id="tarif" className={BW_SECTION} aria-labelledby="tarif-heading">
      <BwAtmosphere variant="reassurance" />
      <div className="container-site relative z-[1]">
        <div className="bw-surface-tarif relative mx-auto max-w-3xl overflow-hidden rounded-[1.75rem] px-6 py-12 sm:px-10 sm:py-14 md:px-14">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[rgba(39,91,232,0.12)] blur-3xl"
            aria-hidden
          />

          <div className="relative text-center">
            <p className={BW_EYEBROW}>La journée BeWork</p>
            <h2
              id="tarif-heading"
              className="mt-4 font-display text-[1.85rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#0B0D12] sm:text-[2.5rem]"
            >
              Une journée pour apprendre
              <br />
              <span className="text-[#275BE8]">à créer autrement.</span>
            </h2>

            <div className="mt-10">
              <p className="font-display text-5xl font-extrabold tracking-tight text-[#0B0D12] sm:text-6xl">
                {BEWORK_SESSION_PRICE_EUR}&nbsp;€
              </p>
              <p className="mt-2 text-sm font-medium uppercase tracking-[0.14em] text-[#8190A8]">
                Par participant
              </p>
            </div>
          </div>

          <div className="relative mt-10">
            <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#8190A8]">
              Ce qui est compris
            </p>
            <ul className="mx-auto mt-5 grid max-w-lg gap-2.5 sm:grid-cols-2">
              {INCLUDES.map((line) => (
                <li
                  key={line}
                  className="flex items-center gap-2.5 rounded-xl border border-[rgba(45,75,130,0.08)] bg-white/70 px-3 py-2.5 text-sm font-semibold text-[#42526B]"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#275BE8]" aria-hidden />
                  {line}
                </li>
              ))}
            </ul>

            <p className="mx-auto mt-10 max-w-md text-center text-base leading-relaxed text-[#42526B]">
              Vous venez avec vos idées.
              <br />
              Vous repartez en sachant comment commencer à les construire.
            </p>

            <div className="mt-8 flex justify-center">
              <Link
                href="/contact#participer"
                className={BW_BTN_PRIMARY}
                {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-tarif-participer")}
              >
                Demander une place
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
