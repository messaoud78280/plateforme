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

/** Libellé échéance compact pour Kanban (données existantes uniquement). */
export function formatKanbanDueLabel(
  nextActionAt: Date | null | undefined,
  now = new Date(),
): string | null {
  if (!nextActionAt) return null;
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const startDue = new Date(nextActionAt);
  startDue.setHours(0, 0, 0, 0);
  const dayDiff = Math.round((startDue.getTime() - startToday.getTime()) / 86400000);
  if (dayDiff === 0) return "Aujourd’hui";
  if (dayDiff === 1) return "Demain";
  if (dayDiff === -1) return "En retard de 1 jour";
  if (dayDiff < -1) return `En retard de ${-dayDiff} jours`;
  return nextActionAt.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/**
 * Temps dans l’étape depuis un changement de statut (timeline).
 * Ne pas appeler avec updatedAt générique.
 */
export function formatDaysInStepLabel(
  statusEnteredAt: Date | null | undefined,
  now = new Date(),
): string | null {
  if (!statusEnteredAt) return null;
  const startEntered = new Date(statusEnteredAt);
  startEntered.setHours(0, 0, 0, 0);
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const days = Math.round((startToday.getTime() - startEntered.getTime()) / 86400000);
  if (days <= 0) return "Aujourd’hui";
  if (days === 1) return "Depuis 1 jour";
  return `Depuis ${days} jours`;
}

export function initialsFromName(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}
