"use client";

import { useState } from "react";
import {
  coerceTaskPriority,
  type TaskPriority,
  TASK_PRIORITY_BADGE,
  priorityLabel,
} from "@/lib/tasks/priority";

const OPTIONS: TaskPriority[] = ["URGENT", "PRIORITAIRE", "STANDARD"];

type Props = {
  taskId: string;
  priority: string | null;
  onUpdated?: (priority: TaskPriority) => void;
};

/** Changement de priorité en 1 clic (client / agent / direction). */
export function MissionPriorityControl({ taskId, priority, onUpdated }: Props) {
  const current = coerceTaskPriority(priority);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setPriority(next: TaskPriority) {
    if (next === current || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "Échec mise à jour");
        return;
      }
      onUpdated?.(next);
    } catch {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Priorité">
        {OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            disabled={saving}
            onClick={() => void setPriority(opt)}
            className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition disabled:opacity-50 ${
              current === opt
                ? TASK_PRIORITY_BADGE[opt]
                : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            }`}
            title={`Priorité ${priorityLabel(opt)}`}
          >
            {priorityLabel(opt)}
          </button>
        ))}
      </div>
      {error ? <p className="text-[10px] text-red-600">{error}</p> : null}
    </div>
  );
}
