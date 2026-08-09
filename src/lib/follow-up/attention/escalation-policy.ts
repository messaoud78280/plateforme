/**
 * W3-C2A — Politique centralisée rappel / escalade (pas de cron, pas d’email).
 * Les délais WorkflowStep priment ; sinon défauts ci-dessous.
 * CDE-3B2 : même politique pour PurchaseOrder (subjectType).
 */
import type { UrgencyLevel } from "@/lib/follow-up/types";
import { urgencyRank } from "@/lib/follow-up/urgency";

export type EscalationStage = "INITIAL" | "REMINDER_1" | "REMINDER_2" | "ESCALATION";

export type AttentionSubjectType = "FOLLOW_UP" | "PURCHASE_ORDER";

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

/**
 * Épisode d’attention : identifiant unique de la transition statut courante.
 * Priorité : id de l’événement timeline (cuid) — deux entrées le même jour = deux épisodes.
 * Fallback : timestamp ms de occurredAt (sans id).
 */
export function episodeKeyFromStatusTransition(opts: {
  eventId?: string | null;
  occurredAt?: Date | string | null;
}): string {
  const id = opts.eventId?.trim();
  if (id) return id;
  if (opts.occurredAt == null || opts.occurredAt === "") return "na";
  const d =
    opts.occurredAt instanceof Date ? opts.occurredAt : new Date(opts.occurredAt);
  if (Number.isNaN(d.getTime())) return "na";
  return `t${d.getTime()}`;
}

/** @deprecated Préférer episodeKeyFromStatusTransition({ eventId }). */
export function episodeKeyFromStatusEnteredAt(
  statusEnteredAt: Date | string | null | undefined,
): string {
  return episodeKeyFromStatusTransition({ occurredAt: statusEnteredAt });
}

export type AttentionDedupeParts = {
  userId: string;
  /** subjectId : fiche FollowUp ou PurchaseOrder */
  sheetId: string;
  code: string;
  level: string;
  episode: string;
  stage?: EscalationStage;
  /**
   * FOLLOW_UP (défaut) → format legacy W3 inchangé.
   * PURCHASE_ORDER → préfixe sourceType (CDE-3B2).
   */
  subjectType?: AttentionSubjectType;
};

/**
 * Clés :
 * - FOLLOW_UP INITIAL : ATTENTION:user:sheet:code:level:episode:INITIAL
 * - PURCHASE_ORDER : ATTENTION:PURCHASE_ORDER:user:poId:code:level:episode:stage
 * - legacy W3-C1 : ATTENTION:user:sheet:code:level
 */
export function buildStagedAttentionDedupeKey(parts: AttentionDedupeParts): string {
  const stage = parts.stage ?? "INITIAL";
  const subjectType = parts.subjectType ?? "FOLLOW_UP";
  if (subjectType === "PURCHASE_ORDER") {
    return `ATTENTION:PURCHASE_ORDER:${parts.userId}:${parts.sheetId}:${parts.code}:${parts.level}:${parts.episode}:${stage}`;
  }
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
