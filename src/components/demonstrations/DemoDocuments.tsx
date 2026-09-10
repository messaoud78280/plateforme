"use client";

import { useMemo, useState } from "react";

type Doc = {
  id: string;
  name: string;
  folder: string;
  type: "PDF" | "DOC" | "IMG";
  updated: string;
  owner: string;
  size: string;
};

const FILES: Doc[] = [
  {
    id: "1",
    name: "Brief_projet_Horizon.pdf",
    folder: "Projets",
    type: "PDF",
    updated: "Aujourd’hui",
    owner: "Thomas Leroy",
    size: "1,1 Mo",
  },
  {
    id: "2",
    name: "Proposition_Agence_Lumiere.pdf",
    folder: "Commercial",
    type: "PDF",
    updated: "Hier",
    owner: "Claire Dubois",
    size: "860 Ko",
  },
  {
    id: "3",
    name: "Compte_rendu_atelier.docx",
    folder: "Équipe",
    type: "DOC",
    updated: "12 mars",
    owner: "Nadia Benali",
    size: "240 Ko",
  },
  {
    id: "4",
    name: "Plan_espace_client.pdf",
    folder: "Technique",
    type: "PDF",
    updated: "11 mars",
    owner: "Julien Moreau",
    size: "2,4 Mo",
  },
  {
    id: "5",
    name: "Moodboard_printemps.jpg",
    folder: "Création",
    type: "IMG",
    updated: "10 mars",
    owner: "Sophie Martin",
    size: "3,2 Mo",
  },
  {
    id: "6",
    name: "Checklist_lancement.pdf",
    folder: "Admin",
    type: "PDF",
    updated: "8 mars",
    owner: "Atelier Nova",
    size: "180 Ko",
  },
];

const TYPE_COLOR = {
  PDF: "bg-red-50 text-red-700",
  DOC: "bg-blue-50 text-blue-700",
  IMG: "bg-violet-50 text-violet-700",
} as const;

/** Démo documents / GED légère — données fictives. */
export function DemoDocuments() {
  const [q, setQ] = useState("");
  const [folder, setFolder] = useState("Tous");
  const [selected, setSelected] = useState("1");

  const folders = useMemo(
    () => ["Tous", ...Array.from(new Set(FILES.map((f) => f.folder)))],
    [],
  );

  const filtered = FILES.filter((f) => {
    const matchQ = !q.trim() || f.name.toLowerCase().includes(q.toLowerCase());
    const matchF = folder === "Tous" || f.folder === folder;
    return matchQ && matchF;
  });

  const current = FILES.find((f) => f.id === selected) ?? filtered[0];

  return (
    <div className="flex min-h-[28rem] flex-col lg:flex-row">
      <div className="min-w-0 flex-1 border-b border-slate-100 p-4 sm:p-5 lg:border-b-0 lg:border-r">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un document…"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
          />
          <select
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
          >
            {folders.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <ul className="mt-4 space-y-2">
          {filtered.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => setSelected(f.id)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition hover:bg-slate-50 ${
                  selected === f.id
                    ? "border-[#2563eb] bg-[#eff6ff]"
                    : "border-slate-200 bg-white"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${TYPE_COLOR[f.type]}`}
                >
                  {f.type}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-900">
                    {f.name}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {f.folder} · {f.updated}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {filtered.length === 0 ? (
            <li className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
              Aucun document trouvé.
            </li>
          ) : null}
        </ul>
      </div>

      <aside className="w-full bg-[#f8fafc] p-4 sm:p-5 lg:w-80">
        {current ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
              <div className="text-center">
                <p
                  className={`mx-auto inline-flex rounded-lg px-3 py-1 text-xs font-bold ${TYPE_COLOR[current.type]}`}
                >
                  {current.type}
                </p>
                <p className="mt-2 px-4 text-xs font-semibold text-slate-700">{current.name}</p>
                <p className="mt-1 text-[10px] text-slate-400">Aperçu fictif</p>
              </div>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Dossier</dt>
                <dd className="font-semibold">{current.folder}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Modifié</dt>
                <dd className="font-semibold">{current.updated}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Par</dt>
                <dd className="font-semibold">{current.owner}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Taille</dt>
                <dd className="font-semibold">{current.size}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
