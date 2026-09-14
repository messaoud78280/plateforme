"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import {
  BW_CARD,
  BW_EYEBROW,
  BW_SECTION,
} from "@/components/home/homeSectionStyles";
import { BwAtmosphere } from "@/components/home/BwAtmosphere";
import { METIER_SELECTOR } from "@/lib/bework-formation";

/** Projection métier — idées qui évoluent selon le profil. */
export function HomeMetierSelector() {
  const [activeId, setActiveId] = useState<(typeof METIER_SELECTOR)[number]["id"]>(
    METIER_SELECTOR[0].id,
  );
  const tabsId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const active = METIER_SELECTOR.find((m) => m.id === activeId) ?? METIER_SELECTOR[0];

  const selectByIndex = (index: number) => {
    const next = (index + METIER_SELECTOR.length) % METIER_SELECTOR.length;
    const item = METIER_SELECTOR[next];
    if (!item) return;
    setActiveId(item.id);
    window.requestAnimationFrame(() => tabRefs.current[next]?.focus());
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      selectByIndex(index + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      selectByIndex(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      selectByIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      selectByIndex(METIER_SELECTOR.length - 1);
    }
  };

  return (
    <section
      id="metiers"
      className={BW_SECTION}
      aria-labelledby="metier-selector-heading"
    >
      <BwAtmosphere variant="creation" />
      <div className="container-site relative z-[1]">
        <div className="max-w-3xl">
          <p className={BW_EYEBROW}>Projection</p>
          <h2
            id="metier-selector-heading"
            className="mt-3 font-display text-[1.85rem] font-extrabold leading-[1.06] tracking-[-0.04em] text-[#0a0a0a] sm:text-[2.5rem] md:text-[3rem]"
          >
            Votre métier vous donne les idées.
            <br />
            <span className="text-[#2563eb]">Imaginez ce que vous pourriez construire.</span>
          </h2>
        </div>

        <div
          className="mt-8 flex flex-wrap gap-2"
          role="tablist"
          aria-label="Choisir un métier"
        >
          {METIER_SELECTOR.map((m, index) => {
            const selected = m.id === activeId;
            return (
              <button
                key={m.id}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                id={`${tabsId}-${m.id}-tab`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`${tabsId}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveId(m.id)}
                onKeyDown={(event) => onTabKeyDown(event, index)}
                className={`min-h-11 rounded-full border px-3.5 py-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] sm:text-sm ${
                  selected
                    ? "border-[#2563eb] bg-[#2563eb] text-white shadow-[0_8px_20px_rgba(37,99,235,0.25)]"
                    : "border-slate-200 bg-white/80 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        <div
          id={`${tabsId}-panel`}
          role="tabpanel"
          aria-labelledby={`${tabsId}-${active.id}-tab`}
          key={active.id}
          className={`${BW_CARD} mt-6 min-h-[15rem] p-5 motion-safe:animate-[home-fade-up_0.32s_ease-out_both] motion-reduce:animate-none sm:mt-8 sm:min-h-[13rem] sm:p-7`}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
            {active.label} — pistes possibles
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {active.ideas.map((idea) => (
              <li
                key={idea}
                className="rounded-2xl border border-slate-100 bg-[#f8fafc] px-4 py-4"
              >
                <span className="mb-2 block h-1.5 w-8 rounded-full bg-[#2563eb]/70" aria-hidden />
                <span className="text-sm font-bold text-slate-900">{idea}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm leading-relaxed text-slate-500">
            Et si l’outil qui manque à votre métier était celui que vous alliez
            créer&nbsp;?
          </p>
        </div>
      </div>
    </section>
  );
}
