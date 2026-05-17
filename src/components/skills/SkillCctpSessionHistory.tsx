"use client";

import { History } from "lucide-react";
import type { CctpSessionSummary } from "@/lib/skills/cctp-redaction-types";

type Props = {
  sessions: CctpSessionSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
};

export function SkillCctpSessionHistory({ sessions, activeId, onSelect, loading }: Props) {
  if (!sessions.length && !loading) return null;

  return (
    <aside className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-100/80">
      <h3 className="flex items-center gap-2 font-heading text-sm font-bold text-slate-900">
        <History className="size-4 text-[#2563eb]" aria-hidden />
        Historique
      </h3>
      <p className="mt-1 text-xs text-slate-500">Vos dernières générations (20 max).</p>
      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Chargement…</p>
      ) : (
        <ul className="mt-3 max-h-64 space-y-1.5 overflow-y-auto">
          {sessions.map((s) => {
            const label = s.requestText.slice(0, 72) + (s.requestText.length > 72 ? "…" : "");
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
                    {s.lot ? ` · ${s.lot}` : ""}
                    {s.usedLlm ? " · IA" : ""}
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
