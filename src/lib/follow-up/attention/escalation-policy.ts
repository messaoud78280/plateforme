/**
 * W3-C2A — Politique centralisée rappel / escalade (pas de cron, pas d’email).
 * Les délais WorkflowStep priment ; sinon défauts ci-dessous.
 */
import type { UrgencyLevel } from "@/lib/follow-up/types";
import { urgencyRank } from "@/lib/follow-up/urgency";

export type EscalationStage = "INITIAL" | "REMINDER_1" | "REMINDER_2" | "ESCALATION";

export type LevelEscalationPolicy = {
  /** Heures après INITIAL avant REMINDER_1 (0 = pas de rappel). */
  reminder1AfterHours: number;
  /** Heures après INITIAL avant REMINDER_2 (0 = pas de 2e rappel). */
  reminder2AfterHours: number;
  /** Heures après INITIAL avant escalade (0 = pas d’escalade auto). */
  escalateAfterHours: number;
  maxReminders: 0 | 1 | 2;
};

/** Défauts si WorkflowStep n’a pas reminderHours / escalateHours. */
export const DEFAULT_ESCALATION_BY_LEVEL: Record<
  "IMPORTANT" | "URGENT" | "CRITIQUE",
  LevelEscalationPolicy
> = {
  IMPORTANT: {
    reminder1AfterHours: 24,
    reminder2AfterHours: 72,
    escalateAfterHours: 120,
    maxReminders: 2,
  },
  URGENT: {
    reminder1AfterHours: 12,
    reminder2AfterHours: 0,
    escalateAfterHours: 48,
    maxReminders: 1,
  },
  CRITIQUE: {
    reminder1AfterHours: 0,
    reminder2AfterHours: 0,
    escalateAfterHours: 12,
    maxReminders: 0,
  },
};

export type WorkflowStepTiming = {
  reminderHours?: number | null;
  escalateHours?: number | null;
  delayHours?: number | null;
};

export function resolveLevelEscalationPolicy(
  level: UrgencyLevel | string,
  step?: WorkflowStepTiming | null,
): LevelEscalationPolicy | null {
  if (urgencyRank(level as UrgencyLevel) < urgencyRank("IMPORTANT")) return null;
  const key =
    urgencyRank(level as UrgencyLevel) >= urgencyRank("CRITIQUE")
      ? "CRITIQUE"
      : urgencyRank(level as UrgencyLevel) >= urgencyRank("URGENT")
        ? "URGENT"
        : "IMPORTANT";
  const base = { ...DEFAULT_ESCALATION_BY_LEVEL[key] };

  if (step?.reminderHours != null && step.reminderHours > 0) {
    base.reminder1AfterHours = step.reminderHours;
    if (base.maxReminders >= 2 && base.reminder2AfterHours > 0) {
      base.reminder2AfterHours = Math.max(
        base.reminder1AfterHours * 2,
        step.reminderHours * 2,
      );
    }
  }
  if (step?.escalateHours != null && step.escalateHours > 0) {
    base.escalateAfterHours = step.escalateHours;
  }
  return base;
}

/** Épisode = jour d’entrée dans l’étape (timeline statut). Permet un nouvel INITIAL plus tard. */
export function episodeKeyFromStatusEnteredAt(
  statusEnteredAt: Date | string | null | undefined,
): string {
  if (!statusEnteredAt) return "na";
  const d = statusEnteredAt instanceof Date ? statusEnteredAt : new Date(statusEnteredAt);
  if (Number.isNaN(d.getTime())) return "na";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type AttentionDedupeParts = {
  userId: string;
  sheetId: string;
  code: string;
  level: string;
  episode: string;
  stage?: EscalationStage;
};

/**
 * Clés :
 * - INITIAL (W3-C1 étendu) : ATTENTION:user:sheet:code:level:episode:INITIAL
 * - legacy W3-C1 : ATTENTION:user:sheet:code:level
 * - rappel / escalade : …:REMINDER_1 | REMINDER_2 | ESCALATION
 */
export function buildStagedAttentionDedupeKey(parts: AttentionDedupeParts): string {
  const stage = parts.stage ?? "INITIAL";
  return `ATTENTION:${parts.userId}:${parts.sheetId}:${parts.code}:${parts.level}:${parts.episode}:${stage}`;
}

export function buildLegacyAttentionDedupeKey(opts: {
  userId: string;
  sheetId: string;
  code: string;
  level: string;
}): string {
  return `ATTENTION:${opts.userId}:${opts.sheetId}:${opts.code}:${opts.level}`;
}

export function hoursBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / (1000 * 60 * 60);
}
