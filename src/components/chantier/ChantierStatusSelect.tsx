"use client";

import { useState, useTransition } from "react";
import type { ChantierStatus } from "@prisma/client";
import { CHANTIER_STATUS_LABELS } from "@/lib/chantier-dossier/constants";

const STATUSES = Object.keys(CHANTIER_STATUS_LABELS) as ChantierStatus[];

/** Change le cycle de vie chantier (source de vérité) — synchronise Project.status. */
export function ChantierStatusSelect({
  projectId,
  value,
  canEdit,
}: {
  projectId: string;
  value: ChantierStatus;
  canEdit: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [local, setLocal] = useState(value);

  if (!canEdit) {
    return (
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-800">
        {CHANTIER_STATUS_LABELS[value] ?? value}
      </span>
    );
  }

  function onChange(next: ChantierStatus) {
    if (next === local || pending) return;
    setError(null);
    setLocal(next);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/projets/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chantierStatus: next }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setLocal(value);
          setError(data.error ?? "Mise à jour impossible.");
          return;
        }
      } catch {
        setLocal(value);
        setError("Erreur réseau.");
      }
    });
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <label className="sr-only" htmlFor={`chantier-status-${projectId}`}>
        Statut du chantier
      </label>
      <select
        id={`chantier-status-${projectId}`}
        disabled={pending}
        value={local}
        onChange={(e) => onChange(e.target.value as ChantierStatus)}
        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 disabled:opacity-60"
        aria-busy={pending}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {CHANTIER_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {error ? <p className="text-[10px] font-medium text-red-700">{error}</p> : null}
      {pending ? <p className="text-[10px] text-slate-400">Enregistrement…</p> : null}
    </div>
  );
}
