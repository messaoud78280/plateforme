/**
 * Helpers journal batch nettoyage bibliothèque.
 */

export type CleanupJobLogEntry = {
  at: string;
  level: "info" | "warn" | "error";
  message: string;
  workItemId?: string;
};

export type CleanupJobCursor = {
  lastId?: string;
  offset?: number;
};

export function appendJobLog(
  logs: CleanupJobLogEntry[] | null | undefined,
  entry: Omit<CleanupJobLogEntry, "at">,
): CleanupJobLogEntry[] {
  const next = [...(logs ?? []), { ...entry, at: new Date().toISOString() }];
  return next.slice(-200);
}

export function defaultBatchSize(input?: number): number {
  const n = input ?? 50;
  return Math.min(Math.max(n, 10), 100);
}
