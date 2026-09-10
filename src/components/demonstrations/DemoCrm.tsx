"use client";

import { useState } from "react";

type Deal = {
  id: string;
  name: string;
  company: string;
  amount: string;
  stage: "prospect" | "qualifie" | "proposition" | "gagne";
};

const STAGES = [
  { id: "prospect" as const, label: "Prospect" },
  { id: "qualifie" as const, label: "Qualifié" },
  { id: "proposition" as const, label: "Proposition" },
  { id: "gagne" as const, label: "Gagné" },
];

const INITIAL: Deal[] = [
  { id: "1", name: "Léa Martin", company: "Atelier Nord", amount: "2 400 €", stage: "prospect" },
  { id: "2", name: "Hugo Petit", company: "Maison Verte", amount: "5 800 €", stage: "qualifie" },
  { id: "3", name: "Inès Leroy", company: "Studio KL", amount: "1 200 €", stage: "proposition" },
  { id: "4", name: "Marc Dubois", company: "Dubois & Fils", amount: "9 500 €", stage: "gagne" },
  { id: "5", name: "Nora Saïd", company: "Nova Services", amount: "3 100 €", stage: "prospect" },
];

/** Démonstration interactive — CRM / suivi commercial (données fictives). */
export function DemoCrm() {
  const [deals, setDeals] = useState(INITIAL);
  const [filter, setFilter] = useState<"all" | Deal["stage"]>("all");
  const [selected, setSelected] = useState<string | null>("2");

  const visible = filter === "all" ? deals : deals.filter((d) => d.stage === filter);
  const current = deals.find((d) => d.id === selected);

  function advance(id: string) {
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const idx = STAGES.findIndex((s) => s.id === d.stage);
        const next = STAGES[Math.min(idx + 1, STAGES.length - 1)];
        return { ...d, stage: next.id };
      })
    );
  }

  return (
    <div className="flex min-h-[28rem] flex-col lg:flex-row">
      <div className="min-w-0 flex-1 border-b border-slate-100 p-4 sm:p-5 lg:border-b-0 lg:border-r">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              filter === "all" ? "bg-[#1d4ed8] text-white" : "border border-slate-200 text-slate-600"
            }`}
          >
            Tous
          </button>
          {STAGES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setFilter(s.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                filter === s.id ? "bg-[#1d4ed8] text-white" : "border border-slate-200 text-slate-600"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <ul className="mt-4 space-y-2">
          {visible.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => setSelected(d.id)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition hover:border-[#93c5fd] ${
                  selected === d.id ? "border-[#1d4ed8] bg-[#eff6ff]" : "border-slate-200 bg-white"
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{d.name}</p>
                  <p className="text-xs text-slate-500">{d.company}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800">{d.amount}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {STAGES.find((s) => s.id === d.stage)?.label}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <aside className="w-full p-5 lg:w-80 lg:shrink-0">
        {current ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Fiche opportunité</p>
            <h2 className="mt-2 text-lg font-bold text-slate-900">{current.name}</h2>
            <p className="text-sm text-slate-600">{current.company}</p>
            <p className="mt-3 text-2xl font-bold text-[#1d4ed8]">{current.amount}</p>
            <p className="mt-1 text-xs text-slate-500">
              Étape : {STAGES.find((s) => s.id === current.stage)?.label}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Prochaine action suggérée : relancer sous 48 h avec un récapitulatif clair.
            </p>
            {current.stage !== "gagne" ? (
              <button
                type="button"
                onClick={() => advance(current.id)}
                className="mt-4 w-full rounded-xl bg-[#1d4ed8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1e40af]"
              >
                Avancer d&apos;une étape
              </button>
            ) : (
              <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                Opportunité gagnée
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Sélectionnez une opportunité.</p>
        )}
      </aside>
    </div>
  );
}
