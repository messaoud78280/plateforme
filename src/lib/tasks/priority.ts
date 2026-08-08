/** Priorités mission BeWork — STANDARD | PRIORITAIRE | URGENT */

export const TASK_PRIORITIES = ["STANDARD", "PRIORITAIRE", "URGENT"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_PRIORITY_RANK: Record<string, number> = {
  URGENT: 0,
  PRIORITAIRE: 1,
  STANDARD: 2,
};

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  URGENT: "Urgent",
  PRIORITAIRE: "Prioritaire",
  STANDARD: "Normal",
};

export const TASK_PRIORITY_BADGE: Record<string, string> = {
  URGENT: "bg-red-100 text-red-800 ring-1 ring-red-200",
  PRIORITAIRE: "bg-amber-100 text-amber-900 ring-1 ring-amber-200",
  STANDARD: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

export const TASK_PRIORITY_BORDER: Record<string, string> = {
  URGENT: "border-l-red-500",
  PRIORITAIRE: "border-l-amber-400",
  STANDARD: "border-l-slate-300",
};

/** Normalise une valeur API → priorité ou null si absente / invalide. */
export function normalizeTaskPriority(value: unknown): TaskPriority | null {
  if (value == null || value === "") return null;
  const p = String(value).trim().toUpperCase();
  if (p === "STANDARD" || p === "PRIORITAIRE" || p === "URGENT") return p;
  return null;
}

/** Pour l’affichage / tri : null → STANDARD. */
export function coerceTaskPriority(priority: string | null | undefined): TaskPriority {
  return normalizeTaskPriority(priority) ?? "STANDARD";
}

export function priorityRank(priority: string | null | undefined): number {
  return TASK_PRIORITY_RANK[coerceTaskPriority(priority)] ?? 2;
}

export function priorityLabel(priority: string | null | undefined): string {
  return TASK_PRIORITY_LABELS[coerceTaskPriority(priority)] ?? "Normal";
}

export function taskPriorityLabel(priority: string | null | undefined): string {
  if (priority === "URGENT") return "Urgent";
  if (priority === "PRIORITAIRE") return "Prioritaire";
  return "Standard";
}

export function sortByPriorityThenDate<
  T extends {
    priority?: string | null;
    createdAt?: Date | string | null;
    updatedAt?: Date | string | null;
  },
>(items: T[], direction: "asc" | "desc" = "asc"): T[] {
  const mult = direction === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    const pr = (priorityRank(a.priority) - priorityRank(b.priority)) * mult;
    if (pr !== 0) return pr;
    const da = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
    const db = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
    return db - da;
  });
}
