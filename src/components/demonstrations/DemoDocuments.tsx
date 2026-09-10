"use client";

import { useMemo, useState } from "react";

const FILES = [
  { id: "1", name: "Procédure_accueil.pdf", folder: "RH", tags: ["interne"] },
  { id: "2", name: "Catalogue_2026.pdf", folder: "Commercial", tags: ["client"] },
  { id: "3", name: "Attestation_assurance.pdf", folder: "Admin", tags: ["obligatoire"] },
  { id: "4", name: "Compte_rendu_mars.docx", folder: "Équipe", tags: ["interne"] },
  { id: "5", name: "Plan_salle.pdf", folder: "Projets", tags: ["technique"] },
];

/** Mock léger — gestion de documents (données fictives). */
export function DemoDocuments() {
  const [q, setQ] = useState("");
  const [folder, setFolder] = useState<string>("Tous");

  const folders = useMemo(() => ["Tous", ...Array.from(new Set(FILES.map((f) => f.folder)))], []);

  const filtered = FILES.filter((f) => {
    const matchQ = !q.trim() || f.name.toLowerCase().includes(q.toLowerCase());
    const matchF = folder === "Tous" || f.folder === folder;
    return matchQ && matchF;
  });

  return (
    <div className="p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un document…"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/20"
        />
        <select
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#1d4ed8] focus:outline-none"
        >
          {folders.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      <ul className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-200">
        {filtered.map((f) => (
          <li key={f.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{f.name}</p>
              <p className="text-xs text-slate-500">{f.folder}</p>
            </div>
            <div className="flex flex-wrap justify-end gap-1">
              {f.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-[#eff6ff] px-2 py-0.5 text-[10px] font-semibold text-[#1d4ed8]"
                >
                  {t}
                </span>
              ))}
            </div>
          </li>
        ))}
        {filtered.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-slate-500">Aucun document trouvé.</li>
        ) : null}
      </ul>
    </div>
  );
}
