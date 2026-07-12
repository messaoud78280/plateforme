import {
  ACTION_STATUS_ACTIVE,
  DOC_MISSING_STATUSES,
  OBLIGATION_OPEN,
  VISA_PENDING,
} from "./constants";

export function startOfDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function isOverdue(dueDate: Date | string | null | undefined, status?: string | null): boolean {
  if (!dueDate) return false;
  const done = status && ["Terminée", "Annulée", "Validée", "Validé", "Conforme", "Non applicable", "Payée", "Archivé"].includes(status);
  if (done) return false;
  return new Date(dueDate) < startOfDay();
}

export function isDueWithinDays(dueDate: Date | string | null | undefined, days: number): boolean {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  const today = startOfDay();
  const limit = addDays(today, days);
  return due >= today && due <= limit;
}

export function alertLevel(params: {
  overdueCount: number;
  blocked?: boolean;
  nearDueCount?: number;
}): "ok" | "watch" | "critical" {
  if (params.blocked || params.overdueCount >= 3) return "critical";
  if (params.overdueCount > 0 || (params.nearDueCount ?? 0) > 0) return "watch";
  return "ok";
}

export function computeDoeProgress(items: { status: string }[]): {
  pct: number;
  conforme: number;
  manquant: number;
  aVerifier: number;
  aCorriger: number;
  applicable: number;
} {
  const applicable = items.filter((i) => i.status !== "Non applicable");
  const conforme = applicable.filter((i) => i.status === "Conforme").length;
  const manquant = applicable.filter((i) => i.status === "Manquant" || i.status === "À demander").length;
  const aVerifier = applicable.filter((i) => i.status === "À vérifier" || i.status === "Reçu").length;
  const aCorriger = applicable.filter((i) => i.status === "À corriger").length;
  const pct = applicable.length === 0 ? 0 : Math.round((conforme / applicable.length) * 100);
  return { pct, conforme, manquant, aVerifier, aCorriger, applicable: applicable.length };
}

export function computeAdminProgress(counts: {
  obligationsTotal: number;
  obligationsDone: number;
  docsTotal: number;
  docsDone: number;
  plansTotal: number;
  plansDone: number;
  doePct: number;
}): number {
  const parts: number[] = [];
  if (counts.obligationsTotal > 0) parts.push((counts.obligationsDone / counts.obligationsTotal) * 100);
  if (counts.docsTotal > 0) parts.push((counts.docsDone / counts.docsTotal) * 100);
  if (counts.plansTotal > 0) parts.push((counts.plansDone / counts.plansTotal) * 100);
  parts.push(counts.doePct);
  if (parts.length === 0) return 0;
  return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
}

export function isActionOpen(status: string): boolean {
  return (ACTION_STATUS_ACTIVE as readonly string[]).includes(status);
}

export function isObligationOpen(status: string): boolean {
  return (OBLIGATION_OPEN as readonly string[]).includes(status) || status === "En retard";
}

export function isDocMissing(status: string): boolean {
  return (DOC_MISSING_STATUSES as readonly string[]).includes(status);
}

export function isVisaPending(status: string): boolean {
  return (VISA_PENDING as readonly string[]).includes(status);
}

export function formatDateFr(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR");
}
