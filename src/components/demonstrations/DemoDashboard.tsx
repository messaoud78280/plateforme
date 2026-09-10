"use client";

import { useEffect, useState } from "react";

const KPIS = [
  { label: "Demandes du mois", value: 42, display: "42", delta: "+8", tone: "text-emerald-600" },
  { label: "Rendez-vous", value: 18, display: "18", delta: "+3", tone: "text-emerald-600" },
  { label: "Propositions", value: 11, display: "11", delta: "+2", tone: "text-emerald-600" },
  { label: "Acceptées", value: 7, display: "7", delta: "stable", tone: "text-slate-500" },
] as const;

const BARS = [
  { label: "Lun", h: 42 },
  { label: "Mar", h: 68 },
  { label: "Mer", h: 55 },
  { label: "Jeu", h: 82 },
  { label: "Ven", h: 61 },
  { label: "Sam", h: 28 },
  { label: "Dim", h: 18 },
];

const ACTIVITY = [
  { title: "Nouvelle demande — Atelier Nova", time: "Il y a 12 min", tone: "bg-blue-50 text-blue-700" },
  { title: "Proposition acceptée — Agence Lumière", time: "Il y a 1 h", tone: "bg-emerald-50 text-emerald-700" },
  { title: "RDV planifié — Sophie Martin", time: "Il y a 2 h", tone: "bg-violet-50 text-violet-700" },
  { title: "Document déposé — Maison Rivage", time: "Hier", tone: "bg-orange-50 text-orange-700" },
];

/** Démo tableau de bord — KPIs fictifs animés. */
export function DemoDashboard() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 80);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-900">Activité du mois</p>
          <p className="text-[11px] text-slate-500">Statistiques fictives — Studio Horizon</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600">
          Mars 2026
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <div
            key={k.label}
            className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-500 ${
              ready ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            }`}
            style={{ transitionDelay: `${i * 70}ms` }}
          >
            <p className="text-[11px] font-medium text-slate-500">{k.label}</p>
            <p className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-900">
              {k.display}
            </p>
            <p className={`mt-1 text-xs font-semibold ${k.tone}`}>{k.delta}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-bold text-slate-900">Volume hebdomadaire</p>
          <div className="mt-4 flex h-40 items-end justify-between gap-2">
            {BARS.map((b, i) => (
              <div key={b.label} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full max-w-[2.25rem] rounded-t-md bg-[#4f46e5] transition-all duration-700"
                  style={{
                    height: ready ? `${b.h}%` : "8%",
                    transitionDelay: `${120 + i * 40}ms`,
                  }}
                  title={`${b.label}: ${b.h}`}
                />
                <span className="text-[10px] font-medium text-slate-500">{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-bold text-slate-900">Activité récente</p>
          <ul className="mt-3 space-y-2">
            {ACTIVITY.map((a) => (
              <li
                key={a.title}
                className="flex items-start justify-between gap-2 rounded-xl border border-slate-100 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-800">{a.title}</p>
                  <p className="text-[10px] text-slate-500">{a.time}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${a.tone}`}>
                  New
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
