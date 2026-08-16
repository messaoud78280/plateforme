import type {
  AnnualContractStatus,
  AnnualInterventionStatus,
} from "@prisma/client";
import type { UrgencyLevel } from "@/lib/follow-up/types";

export const ANNUAL_CONTRACT_STATUS_LABELS: Record<AnnualContractStatus, string> = {
  ACTIVE: "Actif",
  TERMINATING: "En cours de résiliation",
  TERMINATED: "Résilié",
};

export const ANNUAL_INTERVENTION_STATUS_LABELS: Record<
  AnnualInterventionStatus,
  string
> = {
  TO_PREPARE: "À préparer",
  SCHEDULED: "Programmée",
  COMPLETED: "Réalisée",
  CANCELLED: "Annulée",
};

export type AnnualPilotBucket =
  | "to_prepare"
  | "to_confirm"
  | "within_15"
  | "within_7"
  | "overdue"
  | "to_bill";

export type AnnualAttentionEval = {
  level: UrgencyLevel;
  code: "INTERVENTION_PREP" | "DUE_SOON" | "DUE_OVERDUE" | "BILLING_PENDING";
  reason: string;
  daysUntil: number | null;
};

export function startOfDayParis(d: Date = new Date()): Date {
  // Approximation Europe/Paris pour calculs J-N (dates @db.Date sans heure).
  const iso = d.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
  return new Date(`${iso}T00:00:00.000Z`);
}

export function addYearsDateOnly(date: Date, years: number): Date {
  const y = date.getUTCFullYear() + years;
  const m = date.getUTCMonth();
  const day = date.getUTCDate();
  return new Date(Date.UTC(y, m, day));
}

export function daysBetweenDateOnly(from: Date, to: Date): number {
  const a = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const b = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  return Math.round((b - a) / 86_400_000);
}

export function formatAmountHt(n: number | string): string {
  const v = typeof n === "string" ? Number(n) : n;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(v) ? v : 0);
}

export function formatShortDateFr(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}
