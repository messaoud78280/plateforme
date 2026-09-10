"use client";

import { useState } from "react";

const DOCS = [
  { name: "Contrat_cadre.pdf", status: "Disponible", date: "02 mars" },
  { name: "Facture_Février.pdf", status: "Nouveau", date: "28 févr." },
  { name: "Planning_Q1.pdf", status: "Disponible", date: "15 févr." },
];

/** Mock léger — espace client (données fictives). */
export function DemoEspaceClient() {
  const [tab, setTab] = useState<"docs" | "suivi">("docs");

  return (
    <div className="p-5 sm:p-6">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-[#eff6ff]/60 px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1d4ed8] text-sm font-bold text-white">
          JD
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Bonjour Julie Dupont</p>
          <p className="text-xs text-slate-500">Espace client — démonstration</p>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        {(
          [
            ["docs", "Documents"],
            ["suivi", "Suivi"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              tab === id ? "bg-[#1d4ed8] text-white" : "border border-slate-200 text-slate-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "docs" ? (
        <ul className="mt-4 space-y-2">
          {DOCS.map((d) => (
            <li
              key={d.name}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-[#93c5fd]"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{d.name}</p>
                <p className="text-xs text-slate-500">{d.date}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                {d.status}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-4 space-y-3">
          {["Dossier ouvert — en cours", "Pièce reçue — à traiter", "Rendez-vous confirmé"].map((line) => (
            <li key={line} className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
              {line}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
