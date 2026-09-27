"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import type { SuiviTaskRow, ExecutionStatus } from "@/lib/chantier/planning-suivi";

const STATUS_OPTS: Array<{ id: ExecutionStatus; label: string }> = [
  { id: "NOT_STARTED", label: "Non démarrée" },
  { id: "IN_PROGRESS", label: "En cours" },
  { id: "DONE", label: "Terminée" },
  { id: "BLOCKED", label: "Bloquée" },
];

export function PlanningSuiviClient({
  projectId,
  initialPlanId,
}: {
  projectId: string;
  initialPlanId?: string | null;
}) {
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<{ id: string; studyId: string; title: string } | null>(
    null,
  );
  const [tasks, setTasks] = useState<SuiviTaskRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = initialPlanId
        ? `?planId=${encodeURIComponent(initialPlanId)}`
        : "";
      const res = await fetch(`/api/projets/${projectId}/planning-suivi${q}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Chargement impossible");
      setPlan(data.plan);
      setTasks(data.tasks ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [projectId, initialPlanId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patchTask(
    taskId: string,
    patch: Partial<{
      executionStatus: ExecutionStatus;
      progressPercent: number;
      actualStartDate: string | null;
      actualEndDate: string | null;
      executionNotes: string | null;
      blockingReason: string | null;
    }>,
  ) {
    setBusyId(taskId);
    setError(null);
    try {
      const res = await fetch(`/api/projets/${projectId}/planning-suivi`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, ...patch }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Mise à jour impossible");
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? (data.task as SuiviTaskRow) : t)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <p className="text-[13px] text-slate-500">Chargement du suivi…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-semibold text-[#1e3a5f]">
            Suivi chantier (planning)
          </h1>
          <p className="mt-1 text-[13px] text-slate-600">
            {plan?.title ?? "Planning global"} — les tâches sont celles du
            planning, pas un second jeu.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {plan ? (
            <Link
              href={`/dashboard/visites-metres/etudes/${plan.studyId}/planning/${plan.id}`}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-slate-700"
            >
              Ouvrir le Gantt
            </Link>
          ) : null}
          <Link
            href={`/dashboard/projets/${projectId}`}
            className="rounded-lg border border-[#1e3a5f]/20 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#1e3a5f]"
          >
            Dossier chantier
          </Link>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
        </p>
      ) : null}

      <ul className="space-y-2">
        {tasks.map((t) => (
          <li
            key={t.id}
            className={cn(
              "rounded-xl border bg-white px-3.5 py-3",
              t.executionStatus === "BLOCKED"
                ? "border-red-200"
                : t.executionStatus === "DONE"
                  ? "border-emerald-200"
                  : "border-slate-200",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  {t.phase ?? "Sans phase"} · {t.stepCode}
                </p>
                <p className="mt-0.5 text-[13.5px] font-semibold text-slate-900">
                  {t.title}
                </p>
                <p className="mt-0.5 text-[12px] text-slate-500">
                  Prévu : {t.plannedStart ?? "—"} → {t.plannedEnd ?? "—"}
                </p>
              </div>
              <select
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-[12.5px]"
                value={t.executionStatus}
                disabled={busyId === t.id}
                onChange={(e) =>
                  void patchTask(t.id, {
                    executionStatus: e.target.value as ExecutionStatus,
                  })
                }
              >
                {STATUS_OPTS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-4">
              <label className="text-[11px] font-medium text-slate-600">
                Avancement %
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[13px]"
                  value={t.progressPercent}
                  disabled={busyId === t.id}
                  onBlur={(e) =>
                    void patchTask(t.id, {
                      progressPercent: Number(e.target.value) || 0,
                    })
                  }
                  onChange={(e) => {
                    const v = Number(e.target.value) || 0;
                    setTasks((prev) =>
                      prev.map((x) =>
                        x.id === t.id ? { ...x, progressPercent: v } : x,
                      ),
                    );
                  }}
                />
              </label>
              <label className="text-[11px] font-medium text-slate-600">
                Début réel
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[13px]"
                  value={t.actualStartDate ?? ""}
                  disabled={busyId === t.id}
                  onChange={(e) =>
                    void patchTask(t.id, {
                      actualStartDate: e.target.value || null,
                    })
                  }
                />
              </label>
              <label className="text-[11px] font-medium text-slate-600">
                Fin réelle
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[13px]"
                  value={t.actualEndDate ?? ""}
                  disabled={busyId === t.id}
                  onChange={(e) =>
                    void patchTask(t.id, {
                      actualEndDate: e.target.value || null,
                    })
                  }
                />
              </label>
              <label className="text-[11px] font-medium text-slate-600">
                Blocage
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[13px]"
                  value={t.blockingReason ?? ""}
                  placeholder="Cause si bloquée"
                  disabled={busyId === t.id}
                  onBlur={(e) =>
                    void patchTask(t.id, {
                      blockingReason: e.target.value.trim() || null,
                    })
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    setTasks((prev) =>
                      prev.map((x) =>
                        x.id === t.id ? { ...x, blockingReason: v } : x,
                      ),
                    );
                  }}
                />
              </label>
            </div>

            <label className="mt-2 block text-[11px] font-medium text-slate-600">
              Observation / réserve
              <textarea
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[13px]"
                value={t.executionNotes ?? ""}
                disabled={busyId === t.id}
                onBlur={(e) =>
                  void patchTask(t.id, {
                    executionNotes: e.target.value.trim() || null,
                  })
                }
                onChange={(e) => {
                  const v = e.target.value;
                  setTasks((prev) =>
                    prev.map((x) =>
                      x.id === t.id ? { ...x, executionNotes: v } : x,
                    ),
                  );
                }}
              />
            </label>
            {t.reserves.length > 0 ? (
              <p className="mt-1 text-[12px] text-amber-800">
                Réserves : {t.reserves.map((r) => r.label).filter(Boolean).join(" · ")}
              </p>
            ) : null}
            {t.photos.length > 0 ? (
              <p className="mt-1 text-[12px] text-slate-500">
                Photos : {t.photos.length}
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      {tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-[13px] text-slate-500">
          Aucune tâche sur le planning global.
        </p>
      ) : null}
    </div>
  );
}
