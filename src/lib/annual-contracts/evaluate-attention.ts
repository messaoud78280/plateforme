/**
 * Règles Attention contrats annuels :
 * J-30 Important · J-15 Urgent si non confirmée · J-7 Critique · retard Critique
 */
import type { AnnualInterventionStatus } from "@prisma/client";
import {
  daysBetweenDateOnly,
  startOfDayParis,
  type AnnualAttentionEval,
} from "@/lib/annual-contracts/types";

export function evaluateAnnualInterventionAttention(opts: {
  plannedDate: Date | null | undefined;
  status: AnnualInterventionStatus;
  now?: Date;
}): AnnualAttentionEval | null {
  const { status } = opts;
  if (status === "COMPLETED" || status === "CANCELLED") return null;
  if (!opts.plannedDate) {
    if (status === "TO_PREPARE") {
      return {
        level: "IMPORTANT",
        code: "INTERVENTION_PREP",
        reason: "Intervention à programmer",
        daysUntil: null,
      };
    }
    return null;
  }

  const today = startOfDayParis(opts.now ?? new Date());
  const planned = new Date(
    Date.UTC(
      opts.plannedDate.getUTCFullYear(),
      opts.plannedDate.getUTCMonth(),
      opts.plannedDate.getUTCDate(),
    ),
  );
  const daysUntil = daysBetweenDateOnly(today, planned);
  const confirmed = status === "SCHEDULED";

  if (daysUntil < 0) {
    return {
      level: "CRITIQUE",
      code: "DUE_OVERDUE",
      reason: "Intervention en retard",
      daysUntil,
    };
  }

  if (daysUntil <= 7 && !confirmed) {
    return {
      level: "CRITIQUE",
      code: "INTERVENTION_PREP",
      reason: "Intervention à confirmer (J-7)",
      daysUntil,
    };
  }

  if (daysUntil <= 15 && !confirmed) {
    return {
      level: "URGENT",
      code: "INTERVENTION_PREP",
      reason: "Intervention à confirmer (J-15)",
      daysUntil,
    };
  }

  if (daysUntil <= 30) {
    return {
      level: "IMPORTANT",
      code: "INTERVENTION_PREP",
      reason: "Intervention à préparer",
      daysUntil,
    };
  }

  return null;
}

/** Escalade facturation après réalisation sans vraie facture. */
export function evaluateAnnualBillingAttention(opts: {
  billingNeededAt: Date | null | undefined;
  billedAt: Date | null | undefined;
  now?: Date;
}): AnnualAttentionEval | null {
  if (!opts.billingNeededAt || opts.billedAt) return null;
  const now = opts.now ?? new Date();
  const days = Math.floor(
    (now.getTime() - opts.billingNeededAt.getTime()) / 86_400_000,
  );
  if (days >= 7) {
    return {
      level: "CRITIQUE",
      code: "BILLING_PENDING",
      reason: "Intervention réalisée — facturation en retard",
      daysUntil: -days,
    };
  }
  if (days >= 3) {
    return {
      level: "URGENT",
      code: "BILLING_PENDING",
      reason: "À facturer — rappel",
      daysUntil: -days,
    };
  }
  return {
    level: "IMPORTANT",
    code: "BILLING_PENDING",
    reason: "À facturer",
    daysUntil: -days,
  };
}
