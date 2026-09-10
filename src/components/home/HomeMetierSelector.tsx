"use client";

import { useState } from "react";
import {
  HOME_BG_WHITE,
  HOME_CONTENT,
  HOME_EYEBROW,
  HOME_SECTION,
} from "@/components/home/homeSectionStyles";
import { METIER_SELECTOR } from "@/lib/bework-formation";

/** Projection métier — sélecteur compact et premium. */
export function HomeMetierSelector() {
  const [activeId, setActiveId] = useState<(typeof METIER_SELECTOR)[number]["id"]>(
    METIER_SELECTOR[0].id,
  );
  const active = METIER_SELECTOR.find((m) => m.id === activeId) ?? METIER_SELECTOR[0];

  return (
    <section
      id="metiers"
      className={`${HOME_SECTION} ${HOME_BG_WHITE}`}
      aria-labelledby="metier-selector-heading"
    >
      <div className="container-site">
        <div className="mx-auto max-w-4xl">
          <p className={HOME_EYEBROW}>Projection</p>
          <h2
            id="metier-selector-heading"
            className="mt-4 font-display text-[1.85rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#0a0a0a] sm:text-[2.5rem] md:text-[3rem]"
          >
            Votre métier vous donne les idées.
            <br />
            <span className="text-[#1d4ed8]">
              L’IA peut vous aider à les construire.
            </span>
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Sélectionnez un profil. Imaginez ce que cela pourrait donner pour le
            vôtre.
          </p>
        </div>

        <div className={`${HOME_CONTENT} mx-auto max-w-4xl`}>
          <div
            className="flex flex-wrap gap-2"
            role="tablist"
            aria-label="Choisir un métier"
          >
            {METIER_SELECTOR.map((m) => {
              const selected = m.id === activeId;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveId(m.id)}
                  className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${
                    selected
                      ? "border-[#1d4ed8] bg-[#1d4ed8] text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            className="mt-6 overflow-hidden rounded-3xl border border-slate-200/90 bg-[#fafafa] p-6 sm:mt-8 sm:p-8"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              {active.label} — idées possibles
            </p>
            <ul className="mt-5 flex flex-wrap gap-2.5">
              {active.ideas.map((idea) => (
                <li
                  key={idea}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
                >
                  {idea}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-relaxed text-slate-500">
              Et si l’outil qui manque à votre métier était celui que vous alliez
              créer&nbsp;?
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
