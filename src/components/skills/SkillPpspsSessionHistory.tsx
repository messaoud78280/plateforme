"use client";

import { History } from "lucide-react";
import { getPpspsModeLabel } from "@/lib/skills/ppsps-generation-modes";
import type { PpspsSessionSummary } from "@/lib/skills/ppsps-types";

type Props = {
  sessions: PpspsSessionSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
  filterProjectTitle?: string | null;
  onClearProjectFilter?: () => void;
};

export function SkillPpspsSessionHistory({
  sessions,
  activeId,
  onSelect,
  loading,
  filterProjectTitle,
  onClearProjectFilter,
}: Props) {
  if (!sessions.length && !loading) return null;

  return (
    <aside className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-100/80">
      <h3 className="flex items-center gap-2 font-heading text-sm font-bold text-slate-900">
        <History className="size-4 text-[#2563eb]" aria-hidden />
        Historique
      </h3>
      <p className="mt-1 text-xs text-slate-500">
        {filterProjectTitle
          ? `Analyses liées au projet « ${filterProjectTitle} ».`
          : "Vos dernières analyses PPSPS (20 max)."}
      </p>
      {filterProjectTitle && onClearProjectFilter ? (
        <button
          type="button"
          onClick={onClearProjectFilter}
          className="mt-2 text-xs font-semibold text-[#2563eb] hover:underline"
        >
          Voir tout l&apos;historique
        </button>
      ) : null}
      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Chargement…</p>
      ) : (
        <ul className="mt-3 max-h-64 space-y-1.5 overflow-y-auto">
          {sessions.map((s) => {
            const label =
              s.siteName?.trim() ||
              s.siteAddress?.slice(0, 40) ||
              `Analyse — ${s.taskCount} tâche(s)`;
            const date = new Date(s.createdAt).toLocaleString("fr-FR", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            });
            const active = s.id === activeId;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onSelect(s.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                    active
                      ? "border-[#93c5fd]/80 bg-[#eff6ff] text-[#1e40af]"
                      : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="line-clamp-2 font-medium">{label}</span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {date}
                    {s.project ? ` · ${s.project.title}` : ""}
                    {s.taskCount ? ` · ${s.taskCount} tâche(s)` : ""}
                    {s.generationMode !== "analyse_risques"
                      ? ` · ${getPpspsModeLabel(s.generationMode)}`
                      : ""}
                    {s.refineCount ? ` · ${s.refineCount} affinage(s)` : ""}
                    {s.usedLlm ? " · IA" : ""}
                    {s.linkedDocumentId ? " · Dossier" : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
