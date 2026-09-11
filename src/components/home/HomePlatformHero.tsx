"use client";

import Link from "next/link";
import { BwAtmosphere } from "@/components/home/BwAtmosphere";
import { HomeHeroCollage } from "@/components/home/HomeHeroCollage";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

const TRUST = [
  {
    title: "Des outils concrets",
    subtitle: "Testés et approuvés",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    ),
  },
  {
    title: "Un accompagnement",
    subtitle: "Par des experts terrain",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      />
    ),
  },
  {
    title: "Des résultats réels",
    subtitle: "Dès la fin de la journée",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
      />
    ),
  },
] as const;

/** Hero maquette — promesse journée + collage projets créables. */
export function HomePlatformHero() {
  return (
    <section
      id="hero"
      className="relative scroll-mt-28 overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <BwAtmosphere variant="hero" />

      <div className="container-site relative z-[1] pb-12 pt-10 sm:pb-16 sm:pt-12 lg:pb-20 lg:pt-14">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-10 xl:gap-14">
          <div className="max-w-xl lg:max-w-none">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">
              Une journée
            </p>

            <h1
              id="hero-heading"
              className="mt-4 font-display text-[1.95rem] font-extrabold uppercase leading-[1.02] tracking-[-0.045em] text-[#0B0D12] sm:mt-5 sm:text-[2.55rem] md:text-[3.05rem] lg:text-[3.35rem]"
            >
              <span className="block">En une journée,</span>
              <span className="mt-1 block">passez de l’idée</span>
              <span className="mt-1 block text-[#275BE8]">à votre première création.</span>
              <span className="mt-1 block text-[0.92em] font-bold tracking-[-0.04em] text-[#1a1f2a]">
                sans savoir coder.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-[#42526B] sm:mt-7 sm:text-[1.05rem] md:text-[1.125rem]">
              Aucune connaissance particulière en informatique n’est nécessaire.
              Nous vous transmettons les outils, les bons réflexes et les astuces
              pour transformer vos idées en sites, applications et outils
              numériques.
            </p>

            <p className="mt-6 max-w-md font-display text-lg font-extrabold leading-snug tracking-tight text-[#0B0D12] sm:mt-7 sm:text-xl">
              Vous partez de zéro.
              <br />
              Vous repartez en sachant comment commencer.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:mt-9 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/contact#participer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#275BE8] px-6 text-[0.95rem] font-semibold text-white shadow-[0_12px_28px_rgba(39,91,232,0.32)] transition hover:bg-[#1d4ed8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#275BE8]"
                {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-hero-participer")}
              >
                Participer à la journée
                <span aria-hidden>→</span>
              </Link>
              <Link
                href="/demonstrations"
                className="inline-flex items-center gap-3 text-[0.95rem] font-semibold text-[#0B0D12] transition hover:text-[#275BE8]"
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-[#275BE8] shadow-sm"
                  aria-hidden
                >
                  ▶
                </span>
                <span className="text-left leading-tight">
                  Voir la vidéo
                  <span className="block text-xs font-medium text-[#64748b]">
                    2&nbsp;min pour tout comprendre
                  </span>
                </span>
              </Link>
            </div>
          </div>

          <HomeHeroCollage />
        </div>

        <ul className="mt-14 grid gap-6 pt-2 sm:mt-16 sm:grid-cols-3 sm:gap-8">
          {TRUST.map((item) => (
            <li key={item.title} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eff6ff] text-[#275BE8]">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {item.icon}
                </svg>
              </span>
              <div>
                <p className="text-sm font-bold text-[#0B0D12]">{item.title}</p>
                <p className="mt-0.5 text-sm text-[#64748b]">{item.subtitle}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
