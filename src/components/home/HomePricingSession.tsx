import Link from "next/link";
import {
  HOME_BG_SOFT,
  HOME_BTN_PRIMARY,
  HOME_CONTENT,
  HOME_EYEBROW,
  HOME_SECTION,
} from "@/components/home/homeSectionStyles";
import {
  BEWORK_SESSION_PRICE_EUR,
} from "@/lib/bework-formation";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

/** Tarif — simple, premium, sans pricing table SaaS. */
export function HomePricingSession() {
  return (
    <section
      id="tarif"
      className={`${HOME_SECTION} ${HOME_BG_SOFT}`}
      aria-labelledby="tarif-heading"
    >
      <div className="container-site">
        <div className="mx-auto max-w-3xl text-center">
          <p className={HOME_EYEBROW}>Tarif</p>
          <h2
            id="tarif-heading"
            className="mt-4 font-display text-[2rem] font-extrabold leading-[1.06] tracking-[-0.04em] text-[#0a0a0a] sm:text-[2.75rem] md:text-[3.5rem]"
          >
            Une journée.
            <br />
            {BEWORK_SESSION_PRICE_EUR}&nbsp;€.
            <br />
            <span className="text-[#1d4ed8]">De nouvelles possibilités.</span>
          </h2>
        </div>

        <div
          className={`${HOME_CONTENT} mx-auto max-w-xl overflow-hidden rounded-[1.75rem] border border-slate-200/90 bg-white p-7 shadow-[0_16px_48px_rgba(15,23,42,0.06)] sm:p-10`}
        >
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Journée BeWork
              </p>
              <p className="mt-2 font-display text-4xl font-extrabold tracking-tight text-[#0a0a0a] sm:text-5xl">
                {BEWORK_SESSION_PRICE_EUR}&nbsp;€
              </p>
              <p className="mt-1 text-sm text-slate-500">par participant</p>
            </div>
            <p className="rounded-full border border-[#2563eb]/20 bg-[#eff6ff] px-3 py-1.5 text-[11px] font-bold text-[#1d4ed8]">
              Pas d’abonnement
            </p>
          </div>

          <ul className="mt-6 space-y-3">
            {[
              "Formation pratique",
              "Petit groupe",
              "Aucun prérequis en programmation",
              "Travail sur ordinateur",
              "Démonstrations",
              "Mise en pratique",
              "Méthode BeWork",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-sm text-slate-700">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563eb]"
                  aria-hidden
                />
                {line}
              </li>
            ))}
          </ul>

          <Link
            href="/contact#participer"
            className={`${HOME_BTN_PRIMARY} mt-8 w-full`}
            {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-tarif-participer")}
          >
            Participer à une prochaine session
          </Link>
        </div>
      </div>
    </section>
  );
}
