"use client";

import Link from "next/link";
import { useState } from "react";
import { BwAtmosphere } from "@/components/home/BwAtmosphere";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

const HOURS = ["09:00", "10:30", "11:30", "14:00", "15:30", "17:00"] as const;
const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] as const;
const DATES = [24, 25, 26, 27, 28, 29, 30] as const;

/** Hero maquette — colonne gauche éditoriale + mockup MonStudio. */
export function HomePlatformHero() {
  const [slot, setSlot] = useState<(typeof HOURS)[number]>("11:30");
  const [day, setDay] = useState(26);

  return (
    <section
      id="hero"
      className="relative scroll-mt-28 overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <BwAtmosphere variant="hero" />

      <div className="container-site relative z-[1] pb-16 pt-10 sm:pb-20 sm:pt-12 lg:pb-24 lg:pt-14">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-10 xl:gap-14">
          {/* ——— Colonne gauche ——— */}
          <div className="max-w-xl lg:max-w-none">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.04em] text-[#1d4ed8]">
              <span aria-hidden>✦</span>
              UNE JOURNÉE. DES COMPÉTENCES POUR DEMAIN
            </p>

            <h1
              id="hero-heading"
              className="mt-6 font-display text-[2.55rem] font-extrabold leading-[1.02] tracking-[-0.045em] text-[#0a0a0a] sm:mt-7 sm:text-[3.35rem] md:text-[3.85rem] lg:text-[4.15rem]"
            >
              <span className="block">Sans savoir coder.</span>
              <span className="mt-1 block text-[#2563eb]">Créez ce que</span>
              <span className="block">vous imaginez.</span>
            </h1>

            <p className="mt-6 max-w-md text-[1.02rem] leading-relaxed text-slate-500 sm:mt-7 sm:text-[1.08rem]">
              Une journée pratique pour apprendre à créer des sites, des
              applications, des outils professionnels ou des systèmes de
              réservation avec l’IA. Pas de prérequis techniques, juste l’envie
              de passer de l’idée à la réalité.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/#journee"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#2563eb] px-6 text-[0.95rem] font-semibold text-white shadow-[0_12px_28px_rgba(37,99,235,0.32)] transition hover:bg-[#1d4ed8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
                {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-hero-journee")}
              >
                Découvrir la journée
                <span aria-hidden>→</span>
              </Link>
              <Link
                href="/demonstrations/reservation"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200/90 bg-white px-5 text-[0.95rem] font-semibold text-slate-700 shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]/40"
              >
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] text-slate-600"
                  aria-hidden
                >
                  ▶
                </span>
                Voir la démo (2&nbsp;min)
              </Link>
            </div>

            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2.5 text-sm text-slate-600 sm:mt-8">
              {[
                "Méthode pas à pas",
                "En petit groupe",
                "Accessible à tous",
              ].map((label) => (
                <li key={label} className="inline-flex items-center gap-2">
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-600"
                    aria-hidden
                  >
                    ✓
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* ——— Colonne droite : mockup ——— */}
          <div className="relative mx-auto w-full max-w-[34rem] lg:mx-0 lg:max-w-none">
            {/* Bulles */}
            <div className="absolute -left-1 -top-3 z-20 max-w-[13.5rem] rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-[0_12px_32px_rgba(15,23,42,0.1)] sm:-left-4 sm:-top-4 sm:max-w-[15rem] sm:px-4">
              <p className="text-[11px] font-semibold text-slate-800 sm:text-xs">
                <span aria-hidden>💡</span> Une idée…
              </p>
              <p className="mt-1 text-[11px] leading-snug text-slate-500 sm:text-xs">
                Un système pour que mes clients réservent un rendez-vous en ligne
              </p>
            </div>

            <div className="absolute -right-1 top-8 z-20 rounded-full border border-violet-200/80 bg-gradient-to-r from-[#ede9fe] to-[#dbeafe] px-3 py-1.5 text-[11px] font-semibold text-[#5b21b6] shadow-sm sm:right-2 sm:top-6 sm:text-xs">
              ✦ …devient un outil.
            </div>

            {/* Icônes flottantes */}
            <div className="absolute -right-2 top-28 z-10 hidden flex-col gap-2.5 sm:flex lg:-right-3 xl:-right-5">
              {[
                { bg: "bg-[#dbeafe]", icon: "📅", label: "Agenda" },
                { bg: "bg-[#ede9fe]", icon: "👥", label: "Clients" },
                { bg: "bg-[#ffedd5]", icon: "📊", label: "Stats" },
                { bg: "bg-[#d1fae5]", icon: "💬", label: "Messages" },
              ].map((item) => (
                <div
                  key={item.label}
                  title={item.label}
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 ${item.bg} text-base shadow-[0_8px_20px_rgba(15,23,42,0.08)]`}
                >
                  <span aria-hidden>{item.icon}</span>
                </div>
              ))}
            </div>

            {/* Panneau MonStudio */}
            <div className="relative z-[1] mt-10 overflow-hidden rounded-[1.5rem] border border-slate-200/90 bg-white shadow-[0_28px_64px_rgba(15,23,42,0.12)] sm:mt-8 sm:rounded-[1.75rem]">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2563eb] text-[11px] font-bold text-white">
                    M
                  </span>
                  <span className="text-sm font-bold tracking-tight text-slate-900">
                    MonStudio
                  </span>
                </div>
                <nav className="hidden items-center gap-1 text-[11px] font-medium text-slate-500 sm:flex">
                  {["Réservation", "Calendrier", "Clients", "Paramètres"].map(
                    (label, i) => (
                      <span
                        key={label}
                        className={`rounded-md px-2 py-1 ${
                          i === 0 ? "bg-[#eff6ff] text-[#2563eb]" : ""
                        }`}
                      >
                        {label}
                      </span>
                    ),
                  )}
                </nav>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">
                  SL
                </span>
              </div>

              <div className="p-4 sm:p-5">
                <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                  Réserver un rendez-vous
                </h2>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  Choisissez un créneau qui vous convient.
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-800">Mars 2024</p>
                      <div className="flex gap-1">
                        <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">
                          ‹
                        </span>
                        <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">
                          ›
                        </span>
                      </div>
                    </div>
                    <div className="mb-1.5 grid grid-cols-7 gap-1 text-center text-[9px] font-semibold text-slate-400">
                      {DAYS.map((d) => (
                        <span key={d}>{d}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {DATES.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDay(d)}
                          className={`rounded-lg py-1.5 text-[11px] font-semibold transition ${
                            day === d
                              ? "bg-[#2563eb] text-white shadow-sm"
                              : "bg-white text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Mardi {day} mars
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      {HOURS.map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setSlot(h)}
                          className={`rounded-lg border px-2 py-2 text-[11px] font-semibold transition ${
                            slot === h
                              ? "border-[#2563eb] bg-[#2563eb] text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="mt-3 w-full rounded-xl bg-[#2563eb] px-3 py-2.5 text-xs font-bold text-white shadow-[0_8px_18px_rgba(37,99,235,0.28)]"
                    >
                      Confirmer la réservation
                    </button>
                    <p className="mt-2 flex items-center justify-center gap-1 text-[10px] font-medium text-emerald-600">
                      <span aria-hidden>✓</span> Réservation instantanée
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Témoignage */}
            <div className="absolute -bottom-3 left-2 z-20 max-w-[15rem] rounded-2xl border border-slate-200/90 bg-white p-3 shadow-[0_14px_36px_rgba(15,23,42,0.12)] sm:bottom-4 sm:left-4 sm:max-w-[16.5rem] sm:p-3.5">
              <div className="flex items-start gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#fdba74] to-[#f472b6] text-[11px] font-bold text-white">
                  SL
                </span>
                <div>
                  <p className="text-[11px] font-semibold leading-snug text-slate-800 sm:text-xs">
                    « Exactement ce que je voulais ! »
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Sophie L. — Coach indépendante
                  </p>
                  <p className="mt-0.5 text-[10px] tracking-tight text-amber-400" aria-label="5 étoiles">
                    ★★★★★
                  </p>
                </div>
              </div>
            </div>

            {/* Annotation manuscrite */}
            <p
              className="pointer-events-none absolute -bottom-8 right-2 rotate-[-6deg] text-[12px] font-semibold text-[#ea580c] sm:-bottom-2 sm:right-10 sm:text-sm"
              style={{ fontFamily: "ui-rounded, system-ui, sans-serif" }}
            >
              ↗ Vos idées prennent vie.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
