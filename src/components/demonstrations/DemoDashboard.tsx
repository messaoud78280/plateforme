"use client";

import { useState } from "react";

const TABS = ["Vue d’ensemble", "Activité", "Objectifs"] as const;

const KPIS = [
  { label: "Demandes du mois", value: "128", delta: "+12 %" },
  { label: "Taux de réponse", value: "94 %", delta: "+3 pts" },
  { label: "Délai moyen", value: "1,8 j", delta: "−0,4 j" },
  { label: "Satisfaction", value: "4,6 / 5", delta: "stable" },
];

const BARS = [
  { label: "Lun", h: 40 },
  { label: "Mar", h: 65 },
  { label: "Mer", h: 52 },
  { label: "Jeu", h: 78 },
  { label: "Ven", h: 58 },
  { label: "Sam", h: 22 },
  { label: "Dim", h: 18 },
];

/** Démonstration interactive — tableau de bord (données fictives). */
export function DemoDashboard() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Vue d’ensemble");

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              tab === t ? "bg-[#1d4ed8] text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Vue d’ensemble" ? (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {KPIS.map((k) => (
              <div
                key={k.label}
                className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[#93c5fd] hover:shadow-sm"
              >
                <p className="text-xs font-medium text-slate-500">{k.label}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{k.value}</p>
                <p className="mt-1 text-xs font-semibold text-emerald-700">{k.delta}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/60 p-5">
            <p className="text-sm font-semibold text-slate-900">Volume hebdomadaire</p>
            <div className="mt-4 flex h-36 items-end justify-between gap-2">
              {BARS.map((b) => (
                <div key={b.label} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full max-w-[2.5rem] rounded-t-md bg-[#1d4ed8]/85 transition hover:bg-[#1d4ed8]"
                    style={{ height: `${b.h}%` }}
                    title={`${b.label}: ${b.h}`}
                  />
                  <span className="text-[10px] font-medium text-slate-500">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {tab === "Activité" ? (
        <ul className="mt-5 space-y-3">
          {[
            "12 nouvelles demandes reçues",
            "4 dossiers clôturés",
            "2 relances planifiées",
            "1 document partagé avec un client",
          ].map((line) => (
            <li
              key={line}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
            >
              <span className="h-2 w-2 rounded-full bg-[#1d4ed8]" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
      ) : null}

      {tab === "Objectifs" ? (
        <div className="mt-5 space-y-4">
          {[
            { label: "Temps de réponse < 2 j", pct: 88 },
            { label: "Dossiers complets", pct: 72 },
            { label: "Relances à J+3", pct: 95 },
          ].map((o) => (
            <div key={o.label}>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-800">{o.label}</span>
                <span className="font-semibold text-slate-600">{o.pct} %</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-[#1d4ed8]" style={{ width: `${o.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
