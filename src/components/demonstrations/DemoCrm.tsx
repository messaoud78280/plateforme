"use client";

import { useMemo, useState } from "react";

type Stage = "nouveau" | "contacter" | "rdv" | "proposition" | "accepte";

type Deal = {
  id: string;
  name: string;
  company: string;
  amount: string;
  stage: Stage;
  next: string;
};

const STAGES: { id: Stage; label: string; color: string }[] = [
  { id: "nouveau", label: "Nouveau", color: "#64748b" },
  { id: "contacter", label: "À contacter", color: "#ea580c" },
  { id: "rdv", label: "Rendez-vous", color: "#2563eb" },
  { id: "proposition", label: "Proposition", color: "#7c3aed" },
  { id: "accepte", label: "Accepté", color: "#059669" },
];

const INITIAL: Deal[] = [
  {
    id: "1",
    name: "Sophie Martin",
    company: "Coach indépendante",
    amount: "1 850 €",
    stage: "nouveau",
    next: "Premier appel",
  },
  {
    id: "2",
    name: "Thomas Leroy",
    company: "Atelier Nova",
    amount: "4 200 €",
    stage: "contacter",
    next: "Relance e-mail",
  },
  {
    id: "3",
    name: "Nadia Benali",
    company: "Maison Rivage",
    amount: "6 800 €",
    stage: "rdv",
    next: "Visite jeudi 14 h",
  },
  {
    id: "4",
    name: "Julien Moreau",
    company: "Studio Horizon",
    amount: "3 450 €",
    stage: "proposition",
    next: "Envoi devis",
  },
  {
    id: "5",
    name: "Claire Dubois",
    company: "Agence Lumière",
    amount: "9 100 €",
    stage: "accepte",
    next: "Kick-off lundi",
  },
  {
    id: "6",
    name: "Marc Petit",
    company: "Bâtir & Co",
    amount: "2 600 €",
    stage: "nouveau",
    next: "Qualifier le besoin",
  },
];

/** Démo CRM kanban — données fictives. */
export function DemoCrm() {
  const [deals, setDeals] = useState(INITIAL);
  const [selected, setSelected] = useState<string | null>("3");

  const current = deals.find((d) => d.id === selected);

  function move(id: string, dir: 1 | -1) {
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const idx = STAGES.findIndex((s) => s.id === d.stage);
        const next = STAGES[Math.max(0, Math.min(STAGES.length - 1, idx + dir))];
        return { ...d, stage: next.id };
      }),
    );
  }

  const byStage = useMemo(() => {
    const map: Record<Stage, Deal[]> = {
      nouveau: [],
      contacter: [],
      rdv: [],
      proposition: [],
      accepte: [],
    };
    for (const d of deals) map[d.stage].push(d);
    return map;
  }, [deals]);

  return (
    <div className="flex min-h-[30rem] flex-col lg:flex-row">
      <div className="min-w-0 flex-1 overflow-x-auto p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-slate-900">Pipeline commercial</p>
            <p className="text-[11px] text-slate-500">Prospects fictifs — démonstration BeWork</p>
          </div>
        </div>
        <div className="flex min-w-[720px] gap-3">
          {STAGES.map((stage) => (
            <div
              key={stage.id}
              className="w-[11.5rem] shrink-0 rounded-2xl border border-slate-200 bg-[#f8fafc] p-2.5"
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  {stage.label}
                </p>
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                  style={{ backgroundColor: stage.color }}
                >
                  {byStage[stage.id].length}
                </span>
              </div>
              <ul className="space-y-2">
                {byStage[stage.id].map((d) => (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(d.id)}
                      className={`w-full rounded-xl border bg-white p-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                        selected === d.id
                          ? "border-[#2563eb] ring-2 ring-[#2563eb]/20"
                          : "border-slate-200"
                      }`}
                    >
                      <p className="text-xs font-bold text-slate-900">{d.name}</p>
                      <p className="mt-0.5 text-[10px] text-slate-500">{d.company}</p>
                      <p className="mt-2 text-xs font-semibold text-[#2563eb]">{d.amount}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <aside className="w-full border-t border-slate-100 bg-white p-4 lg:w-72 lg:border-l lg:border-t-0">
        {current ? (
          <>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Fiche
            </p>
            <h3 className="mt-2 font-display text-lg font-extrabold text-slate-900">
              {current.name}
            </h3>
            <p className="text-sm text-slate-500">{current.company}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">Montant</dt>
                <dd className="font-semibold">{current.amount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Étape</dt>
                <dd className="font-semibold">
                  {STAGES.find((s) => s.id === current.stage)?.label}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="shrink-0 text-slate-400">Prochaine action</dt>
                <dd className="text-right font-semibold">{current.next}</dd>
              </div>
            </dl>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => move(current.id, -1)}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                ← Reculer
              </button>
              <button
                type="button"
                onClick={() => move(current.id, 1)}
                className="flex-1 rounded-xl bg-[#2563eb] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1d4ed8]"
              >
                Avancer →
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">Sélectionnez une opportunité.</p>
        )}
      </aside>
    </div>
  );
}
