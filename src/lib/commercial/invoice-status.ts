/**
 * DF-4 — Évaluation statut facture commerciale (source de vérité serveur).
 */
import { roundMoney } from "@/lib/commercial/money";

export type InvoiceStatusEvalInput = {
  status: string;
  type?: string | null;
  totalTtc: number;
  amountPaid: number;
  amountDue?: number | null;
  dueDate?: Date | string | null;
  now?: Date;
};

const MONEY_EPS = 0.004;

/** Compare dates calendaires (ignore l’heure). */
export function isDueDatePast(
  dueDate: Date | string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return false;
  const d0 = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
  const n0 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return d0 < n0;
}

export function daysOverdue(
  dueDate: Date | string | null | undefined,
  now: Date = new Date(),
): number {
  if (!dueDate || !isDueDatePast(dueDate, now)) return 0;
  const due = new Date(dueDate);
  const d0 = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
  const n0 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((n0 - d0) / 86_400_000));
}

export type AgingBucket =
  | "not_due"
  | "due_today"
  | "d1_7"
  | "d8_30"
  | "d31_60"
  | "d60_plus";

export function agingBucket(
  dueDate: Date | string | null | undefined,
  amountDue: number,
  now: Date = new Date(),
): AgingBucket {
  if (roundMoney(amountDue, 2) <= MONEY_EPS) return "not_due";
  if (!dueDate) return "not_due";
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return "not_due";
  const d0 = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
  const n0 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((n0 - d0) / 86_400_000);
  if (diff < 0) return "not_due";
  if (diff === 0) return "due_today";
  if (diff <= 7) return "d1_7";
  if (diff <= 30) return "d8_30";
  if (diff <= 60) return "d31_60";
  return "d60_plus";
}

export const AGING_BUCKET_LABELS: Record<AgingBucket, string> = {
  not_due: "Pas encore échue",
  due_today: "Échéance aujourd’hui",
  d1_7: "1–7 jours",
  d8_30: "8–30 jours",
  d31_60: "31–60 jours",
  d60_plus: "> 60 jours",
};

/**
 * Règles DF-4 :
 * DRAFT / CANCELLED → inchangé
 * reste ≤ 0 → PAID
 * échéance passée + reste > 0 → OVERDUE (même si partiel)
 * payé > 0 → PARTIALLY_PAID
 * sinon → ISSUED
 */
export function evaluateCommercialInvoiceStatus(
  input: InvoiceStatusEvalInput,
): "DRAFT" | "ISSUED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED" {
  const current = input.status;
  if (current === "DRAFT" || current === "CANCELLED") {
    return current;
  }

  const total = roundMoney(Number(input.totalTtc) || 0, 2);
  const paid = roundMoney(Math.max(0, Number(input.amountPaid) || 0), 2);
  const due =
    input.amountDue != null
      ? roundMoney(Math.max(0, Number(input.amountDue) || 0), 2)
      : roundMoney(Math.max(0, total - paid), 2);

  if (due <= MONEY_EPS || paid >= total - MONEY_EPS) {
    return "PAID";
  }

  const now = input.now ?? new Date();
  if (isDueDatePast(input.dueDate, now)) {
    return "OVERDUE";
  }

  if (paid > MONEY_EPS) {
    return "PARTIALLY_PAID";
  }

  return "ISSUED";
}

/** J+30 calendaire depuis une date d’émission. */
export function defaultDueDateFromIssue(issueDate: Date = new Date()): Date {
  const d = new Date(issueDate);
  d.setDate(d.getDate() + 30);
  return d;
}

/**
 * Calcule une échéance explicite depuis des conditions de règlement.
 * Toujours stocker le résultat en `dueDate` (vérité opérationnelle).
 */
export function computeDueDateFromTerms(
  issueDate: Date,
  terms:
    | "COMPTANT"
    | "J15"
    | "J30"
    | "J45"
    | "J30_FDM"
    | "J45_FDM"
    | "CUSTOM",
  customDate?: Date | null,
): Date {
  if (terms === "CUSTOM" && customDate) {
    return new Date(customDate);
  }
  const base = new Date(issueDate);
  base.setHours(12, 0, 0, 0);

  if (terms === "COMPTANT") {
    return base;
  }

  const addDays = (n: number) => {
    const d = new Date(base);
    d.setDate(d.getDate() + n);
    return d;
  };

  const endOfMonthPlus = (days: number) => {
    const d = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + days);
    return d;
  };

  switch (terms) {
    case "J15":
      return addDays(15);
    case "J30":
      return addDays(30);
    case "J45":
      return addDays(45);
    case "J30_FDM":
      return endOfMonthPlus(30);
    case "J45_FDM":
      return endOfMonthPlus(45);
    default:
      return addDays(30);
  }
}

/** Bloque le surpaiement — primitive testable. */
export function assertPaymentWithinRemaining(
  remainingDue: number,
  paymentAmount: number,
): void {
  const remaining = roundMoney(Math.max(0, remainingDue), 2);
  const amount = roundMoney(paymentAmount, 2);
  if (amount <= 0) {
    throw new Error("Montant invalide");
  }
  if (amount > remaining + 1e-9) {
    throw new Error(
      `Surpaiement refusé : reste dû ${remaining.toFixed(2)} € (saisie ${amount.toFixed(2)} €).`,
    );
  }
}

export function isCollectibleInvoiceType(type: string | null | undefined): boolean {
  return type !== "CREDIT";
}
