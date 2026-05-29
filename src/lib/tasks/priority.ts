/** Priorités mission client / gérant */
export const TASK_PRIORITIES = ["STANDARD", "PRIORITAIRE", "URGENT"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export function normalizeTaskPriority(value: unknown): TaskPriority | null {
  if (value == null || value === "") return null;
  const p = String(value).trim().toUpperCase();
  if (p === "STANDARD") return "STANDARD";
  if (p === "PRIORITAIRE") return "PRIORITAIRE";
  if (p === "URGENT") return "URGENT";
  return null;
}

export function taskPriorityLabel(priority: string | null | undefined): string {
  if (priority === "URGENT") return "Urgent";
  if (priority === "PRIORITAIRE") return "Prioritaire";
  return "Standard";
}
