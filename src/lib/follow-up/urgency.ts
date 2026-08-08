import type { FollowUpUrgency } from "@prisma/client";
import {
  DEFAULT_URGENCY_THRESHOLDS,
  type UrgencyLevel,
  type UrgencyThresholds,
} from "@/lib/follow-up/types";

const ORDER: UrgencyLevel[] = ["NORMAL", "A_SURVEILLER", "IMPORTANT", "URGENT", "CRITIQUE"];

export function urgencyRank(u: UrgencyLevel): number {
  return ORDER.indexOf(u);
}

export function maxUrgency(a: UrgencyLevel, b: UrgencyLevel): UrgencyLevel {
  return urgencyRank(a) >= urgencyRank(b) ? a : b;
}

/**
 * Calcule le niveau d’urgence à partir de l’échéance (évolution automatique).
 * Si urgencyOverride est défini, il plafonne au minimum (override gagne si plus élevé).
 */
export function computeUrgencyFromDue(
  nextActionAt: Date | null | undefined,
  opts?: {
    now?: Date;
    nextActionDone?: boolean;
    override?: FollowUpUrgency | null;
    thresholds?: UrgencyThresholds;
  },
): UrgencyLevel {
  const now = opts?.now ?? new Date();
  const thresholds = opts?.thresholds ?? DEFAULT_URGENCY_THRESHOLDS;

  if (opts?.nextActionDone || !nextActionAt) {
    return opts?.override ?? "NORMAL";
  }

  const ms = nextActionAt.getTime() - now.getTime();
  const hours = ms / (1000 * 60 * 60);
  const days = hours / 24;

  let computed: UrgencyLevel;
  if (hours < 0) {
    const overdueHours = -hours;
    computed = overdueHours >= thresholds.criticalOverdueHours ? "CRITIQUE" : "URGENT";
  } else if (hours <= thresholds.urgentMaxHours) {
    computed = "URGENT";
  } else if (hours <= thresholds.importantMaxHours) {
    computed = "IMPORTANT";
  } else if (days <= thresholds.watchMaxDays) {
    computed = "A_SURVEILLER";
  } else if (days > thresholds.normalMinDays) {
    computed = "NORMAL";
  } else {
    computed = "A_SURVEILLER";
  }

  if (opts?.override) {
    return maxUrgency(computed, opts.override);
  }
  return computed;
}

export function formatDelay(nextActionAt: Date | null | undefined, now = new Date()): string | null {
  if (!nextActionAt) return null;
  const ms = now.getTime() - nextActionAt.getTime();
  if (ms < 0) return null;
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 1) {
    const mins = Math.max(1, Math.floor(ms / (1000 * 60)));
    return `${mins} min`;
  }
  if (hours < 48) return `${hours} h`;
  const days = Math.floor(hours / 24);
  return `${days} j`;
}

export function formatDueLabel(nextActionAt: Date | null | undefined): string {
  if (!nextActionAt) return "—";
  return nextActionAt.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
