"use client";

import Link from "next/link";
import { useState } from "react";
import { BwAtmosphere } from "@/components/home/BwAtmosphere";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

const HOURS = ["09:00", "10:30", "11:30", "14:00", "15:30"] as const;
const DAYS = ["L", "M", "M", "J", "V", "S", "D"] as const;
const DATES = [21, 22, 23, 24, 25, 26, 27] as const;

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

const PILLS = [
  { label: "Sites web", accent: "#275BE8" },
  { label: "Applications", accent: "#7c3aed" },
  { label: "Automatisations", accent: "#0891b2" },
  { label: "CRM", accent: "#ea580c" },
] as const;

/** Hero maquette — promesse journée + collage projets créables. */
export function HomePlatformHero() {
  const [slot, setSlot] = useState<(typeof HOURS)[number]>("10:30");
  const [day, setDay] = useState(24);

  return (
    <section
      id="hero"
      className="relative scroll-mt-28 overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <BwAtmosphere variant="hero" />

      <div className="container-site relative z-[1] pb-12 pt-10 sm:pb-16 sm:pt-12 lg:pb-20 lg:pt-14">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-10 xl:gap-14">
          {/* ——— Colonne gauche ——— */}
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
                className="inline-flex items-center gap-3 text-[0.95rem] font-semibold text-[#0B0D12] transition hover:text-[#275BE8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#275BE8]/40"
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#275BE8]/35 bg-white text-[#275BE8] shadow-sm"
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

          {/* ——— Colonne droite : collage ——— */}
          <div
            className="relative mx-auto min-h-[28rem] w-full max-w-[36rem] sm:min-h-[32rem] lg:mx-0 lg:max-w-none"
            aria-hidden
          >
            {/* Quote */}
            <div className="absolute left-0 top-0 z-30 max-w-[14rem] rounded-2xl border border-white/80 bg-white/95 px-3.5 py-3 shadow-[0_14px_36px_rgba(15,23,42,0.1)] backdrop-blur-sm sm:left-2 sm:max-w-[15.5rem] sm:px-4">
              <p className="text-[11px] font-semibold leading-snug text-[#0B0D12] sm:text-xs">
                De l’idée à la réalité — plus vite que vous ne le pensez.
              </p>
            </div>

            {/* Fenêtre site MonProjet */}
            <div className="absolute left-[4%] top-12 z-[1] w-[78%] max-w-[22rem] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_24px_55px_rgba(15,23,42,0.12)] sm:left-[6%] sm:top-14 sm:w-[72%]">
              <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50/80 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-[#f87171]" />
                <span className="h-2 w-2 rounded-full bg-[#fbbf24]" />
                <span className="h-2 w-2 rounded-full bg-[#34d399]" />
                <span className="ml-2 text-[10px] font-semibold text-slate-500">MonProjet</span>
              </div>
              <div className="relative h-36 bg-gradient-to-br from-[#1e3a5f] via-[#275BE8] to-[#7c3aed] sm:h-40">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.22),transparent_55%)]" />
                <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-white/95 p-3 shadow-sm">
                  <p className="text-xs font-bold tracking-tight text-[#0B0D12]">
                    Des idées en grands projets
                  </p>
                  <span className="mt-2 inline-flex rounded-full bg-[#275BE8] px-2.5 py-1 text-[10px] font-semibold text-white">
                    Commencer maintenant
                  </span>
                </div>
              </div>
            </div>

            {/* Pills catégories */}
            <ul className="absolute right-0 top-10 z-20 flex flex-col gap-2 sm:right-1 sm:top-12">
              {PILLS.map((pill) => (
                <li
                  key={pill.label}
                  className="rounded-full border border-white/90 bg-white px-3 py-1.5 text-[11px] font-semibold shadow-[0_8px_20px_rgba(15,23,42,0.08)]"
                  style={{ color: pill.accent }}
                >
                  {pill.label}
                </li>
              ))}
            </ul>

            {/* Réservation */}
            <div className="absolute bottom-[7.5rem] left-0 z-20 w-[11.5rem] rounded-2xl border border-slate-200/90 bg-white p-3 shadow-[0_16px_40px_rgba(15,23,42,0.12)] sm:bottom-32 sm:left-1 sm:w-[13rem] sm:p-3.5">
              <p className="text-[11px] font-bold text-[#0B0D12]">Système de réservation</p>
              <p className="mt-0.5 text-[10px] text-slate-500">Avril 2025</p>
              <div className="mt-2 grid grid-cols-7 gap-0.5 text-center text-[8px] font-semibold text-slate-400">
                {DAYS.map((d, i) => (
                  <span key={`${d}-${i}`}>{d}</span>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-0.5">
                {DATES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDay(d)}
                    className={`rounded-md py-1 text-[10px] font-semibold ${
                      day === d
                        ? "bg-[#275BE8] text-white"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {HOURS.slice(0, 3).map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setSlot(h)}
                    className={`rounded-md px-1.5 py-1 text-[9px] font-semibold ${
                      slot === h
                        ? "bg-[#275BE8] text-white"
                        : "bg-slate-50 text-slate-600"
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
              <div className="mt-2 rounded-lg bg-[#275BE8] py-1.5 text-center text-[10px] font-bold text-white">
                Réserver mon créneau
              </div>
            </div>

            {/* Assistant IA */}
            <div className="absolute bottom-[5.5rem] right-0 z-20 w-[12rem] rounded-2xl border border-violet-200/80 bg-white p-3 shadow-[0_16px_40px_rgba(15,23,42,0.12)] sm:bottom-28 sm:right-2 sm:w-[13.5rem]">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed] to-[#275BE8] text-[10px] text-white">
                  ✦
                </span>
                <p className="text-[11px] font-bold text-[#0B0D12]">Assistant IA</p>
              </div>
              <p className="mt-2 rounded-xl rounded-tl-sm bg-violet-50 px-2.5 py-2 text-[10px] leading-snug text-violet-900">
                Comment puis-je vous aider à créer votre projet&nbsp;?
              </p>
            </div>

            {/* Dashboard activité */}
            <div className="absolute bottom-2 left-[18%] z-30 w-[14rem] rounded-2xl border border-slate-200/90 bg-white p-3 shadow-[0_18px_44px_rgba(15,23,42,0.14)] sm:left-[22%] sm:w-[15.5rem] sm:p-3.5">
              <p className="text-[11px] font-bold text-[#0B0D12]">Mon activité</p>
              <ul className="mt-2 space-y-1.5">
                {[
                  { label: "Visiteurs", value: "1 248", delta: "+12%" },
                  { label: "Réservations", value: "89", delta: "+28%" },
                  { label: "CA", value: "2 430 €", delta: "+19%" },
                ].map((row) => (
                  <li key={row.label} className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">{row.label}</span>
                    <span className="font-bold text-[#0B0D12]">
                      {row.value}{" "}
                      <span className="font-semibold text-emerald-600">{row.delta}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex h-8 items-end gap-0.5">
                {[40, 55, 48, 70, 62, 85, 78].map((h, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-sm bg-gradient-to-t from-[#275BE8] to-[#93c5fd]"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Annotation manuscrite */}
            <p className="pointer-events-none absolute -bottom-1 right-0 rotate-[-7deg] font-blueprint-note text-[13px] font-semibold text-[#ea580c] sm:right-4 sm:text-sm">
              Des idées qui prennent vie
            </p>
          </div>
        </div>

        {/* Barre confiance — sans border-t (évite la ligne horizontale parasite) */}
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
