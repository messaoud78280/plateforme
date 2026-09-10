import Link from "next/link";
import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import {
  HOME_BG_SOFT,
  HOME_BTN_PRIMARY,
  HOME_CONTENT,
  HOME_SECTION,
} from "@/components/home/homeSectionStyles";
import {
  BEWORK_SESSION_PRICE_EUR,
  FORMATION_INCLUDES,
} from "@/lib/bework-formation";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

/** Carte tarif session + inclus. */
export function HomePricingSession() {
  return (
    <section
      id="tarif"
      className={`${HOME_SECTION} ${HOME_BG_SOFT}`}
      aria-labelledby="pricing-heading"
    >
      <div className="container-site">
        <HomeSectionHeader
          id="pricing-heading"
          eyebrow="Tarif"
          title="Une session claire, un prix simple"
          lead="Pas de formule opaque. Une journée de formation pratique, en petit groupe, à un tarif accessible."
        />

        <div className={`${HOME_CONTENT} mx-auto max-w-xl`}>
          <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="border-b border-slate-100 bg-gradient-to-br from-[#eff6ff] to-[#f5f3ff] px-7 py-8 text-center sm:px-10 sm:py-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                Session individuelle
              </p>
              <p className="font-display mt-3 text-5xl font-extrabold tracking-tight text-[#0a0a0a] sm:text-6xl">
                {BEWORK_SESSION_PRICE_EUR}&nbsp;€
              </p>
              <p className="mt-2 text-sm text-slate-600">par participant · une journée</p>
            </div>

            <div className="px-7 py-7 sm:px-10 sm:py-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Inclus
              </p>
              <ul className="mt-4 space-y-3">
                {FORMATION_INCLUDES.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563eb]"
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Link
                  href="/contact#participer"
                  className={`${HOME_BTN_PRIMARY} w-full sm:w-full`}
                  {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-pricing-participer")}
                >
                  Participer à une session
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
