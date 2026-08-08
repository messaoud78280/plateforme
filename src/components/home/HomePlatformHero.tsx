import Link from "next/link";
import { HomeProductPreview } from "@/components/home/HomeProductPreview";
import { HOME_BTN_GROUP, HOME_BTN_PRIMARY, HOME_BTN_SECONDARY } from "@/components/home/homeSectionStyles";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

const TRUST = [
  "Hébergement en Europe",
  "Accès contrôlés par rôles",
  "Confidentialité renforcée",
] as const;

/** Hero — plateformes internes intelligentes pour le BTP. */
export function HomePlatformHero() {
  return (
    <section
      id="hero"
      className="relative overflow-x-clip bg-white pb-14 pt-8 sm:pb-20 sm:pt-12 md:pb-24 md:pt-16 lg:pb-28 lg:pt-20"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.22] bework-blueprint-grid--hero sm:opacity-[0.28]"
        aria-hidden
      />
      <div className="container-site relative">
        <div className="grid items-center gap-8 sm:gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] lg:gap-16 xl:gap-20">
          <div className="text-center lg:text-left">
            <h1 className="font-display mx-auto max-w-[20ch] text-balance text-[1.875rem] font-extrabold leading-[1.12] tracking-[-0.03em] text-[#0f172a] sm:max-w-[22ch] sm:text-[2.625rem] md:text-[3.25rem] lg:mx-0 lg:max-w-[18ch] lg:text-[3.5rem] xl:text-[3.75rem]">
              Votre plateforme interne BTP, adaptée à votre organisation et augmentée par l&apos;IA
            </h1>

            <p className="mx-auto mt-4 max-w-[34rem] text-[0.9375rem] leading-relaxed text-slate-600 sm:mt-6 sm:text-lg lg:mx-0 lg:text-[1.125rem] lg:leading-[1.7]">
              Centralisez vos équipes, vos chantiers, vos documents et vos marchés. BeWork configure votre plateforme,
              forme vos équipes et la fait évoluer avec vos besoins.
            </p>

            <div
              className={`mx-auto mt-6 w-full max-w-md sm:mt-8 sm:max-w-[36rem] ${HOME_BTN_GROUP} sm:justify-center lg:mx-0 lg:justify-start`}
            >
              <Link
                href="/contact#formulaire"
                className={HOME_BTN_PRIMARY}
                {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-hero-demo")}
              >
                <span className="sm:hidden">Demander une démo</span>
                <span className="hidden sm:inline">Demander une démonstration</span>
              </Link>
              <Link href="#plateforme" className={HOME_BTN_SECONDARY}>
                Découvrir la plateforme
              </Link>
            </div>

            <ul
              className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:mt-8 sm:max-w-[36rem] sm:flex-row sm:flex-wrap sm:justify-center lg:mx-0 lg:justify-start"
              aria-label="Engagements BeWork"
            >
              {TRUST.map((label) => (
                <li
                  key={label}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-[#f8fafc] px-3 py-2 text-left text-xs font-medium text-slate-700 sm:justify-start sm:text-sm"
                >
                  <span
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#1d4ed8]/10 text-[#1d4ed8]"
                    aria-hidden
                  >
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2.5 6.2 4.8 8.5 9.5 3.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-md sm:max-w-lg lg:mx-0 lg:max-w-none">
            <div
              className="absolute -inset-2 rounded-[1.25rem] bg-gradient-to-br from-[#eff6ff] via-transparent to-slate-100/70 opacity-90 sm:-inset-4 sm:rounded-[1.75rem]"
              aria-hidden
            />
            <div className="relative">
              <HomeProductPreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
