/**
 * W3-C2A — Décision pure rappel / escalade (déterministe, sans I/O).
 * Ne recalcule pas le diagnostic métier (W3-A).
 */
import type { UrgencyLevel } from "@/lib/follow-up/types";
import { URGENCY_LABELS } from "@/lib/follow-up/types";
import {
  buildLegacyAttentionDedupeKey,
  buildStagedAttentionDedupeKey,
  episodeKeyFromStatusTransition,
  hoursBetween,
  resolveLevelEscalationPolicy,
  type EscalationStage,
  type WorkflowStepTiming,
} from "@/lib/follow-up/attention/escalation-policy";

export type ExistingAttentionNotif = {
  dedupeKey: string | null;
  userId: string;
  type: string;
  createdAt: Date | string;
};

export type EvaluateAttentionEscalationInput = {
  sheetId: string;
  sheetTitle: string;
  code: string;
  level: UrgencyLevel | string;
  primaryReason: string;
  statusEnteredAt?: Date | string | null;
  /** Id événement timeline statut (cuid) — préféré pour l’épisode. */
  statusEpisodeKey?: string | null;
  responsibleId: string;
  /** Direction / superviseur interne du même tenant — null = pas d’escalade possible. */
  escalateToId: string | null;
  responsibleName?: string | null;
  workflowStep?: WorkflowStepTiming | null;
  existingNotifications: ExistingAttentionNotif[];
  now?: Date;
};

export type EvaluateAttentionEscalationResult = {
  action: "NONE" | "REMIND" | "ESCALATE";
  recipientId: string | null;
  stage: EscalationStage | null;
  problemReason: string;
  escalationReason: string | null;
  dedupeKey: string | null;
  notificationType: "FOLLOWUP_REMINDER" | "FOLLOWUP_ESCALATION" | null;
  title: string | null;
  message: string | null;
  nextCheckAt: Date | null;
  /** Pour debug / tests */
  debug?: {
    episode: string;
    hoursSinceInitial: number | null;
    hasInitial: boolean;
    hasReminder1: boolean;
    hasReminder2: boolean;
    hasEscalation: boolean;
  };
};

function toDate(v: Date | string): Date {
  return v instanceof Date ? v : new Date(v);
}

function findNotif(
  existing: ExistingAttentionNotif[],
  keys: string[],
): ExistingAttentionNotif | undefined {
  const set = new Set(keys);
  return existing.find((n) => n.dedupeKey && set.has(n.dedupeKey));
}

export function evaluateAttentionEscalation(
  input: EvaluateAttentionEscalationInput,
): EvaluateAttentionEscalationResult {
  const now = input.now ?? new Date();
  const policy = resolveLevelEscalationPolicy(input.level, input.workflowStep);
  const empty = (extra?: Partial<EvaluateAttentionEscalationResult>): EvaluateAttentionEscalationResult => ({
    action: "NONE",
    recipientId: null,
    stage: null,
    problemReason: input.primaryReason,
    escalationReason: null,
    dedupeKey: null,
    notificationType: null,
    title: null,
    message: null,
    nextCheckAt: null,
    ...extra,
  });

  if (!policy) return empty();

  const episode =
    input.statusEpisodeKey?.trim() ||
    episodeKeyFromStatusTransition({ occurredAt: input.statusEnteredAt });
  const base = {
    userId: input.responsibleId,
    sheetId: input.sheetId,
    code: input.code,
    level: String(input.level),
    episode,
  };

  const initialKey = buildStagedAttentionDedupeKey({ ...base, stage: "INITIAL" });
  const legacyInitial = buildLegacyAttentionDedupeKey({
    userId: input.responsibleId,
    sheetId: input.sheetId,
    code: input.code,
    level: String(input.level),
  });
  const r1Key = buildStagedAttentionDedupeKey({ ...base, stage: "REMINDER_1" });
  const r2Key = buildStagedAttentionDedupeKey({ ...base, stage: "REMINDER_2" });
  const escKey = input.escalateToId
    ? buildStagedAttentionDedupeKey({
        ...base,
        userId: input.escalateToId,
        stage: "ESCALATION",
      })
    : null;

  // INITIAL : clé épisode, ou legacy W3-C1 si créée dans l’épisode courant
  const entered = input.statusEnteredAt ? toDate(input.statusEnteredAt) : null;
  let initial = findNotif(input.existingNotifications, [initialKey]);
  if (!initial) {
    const legacy = findNotif(input.existingNotifications, [legacyInitial]);
    if (legacy) {
      if (!entered || toDate(legacy.createdAt).getTime() >= entered.getTime() - 60_000) {
        initial = legacy;
      }
    }
  }
  if (!initial && entered) {
    initial = input.existingNotifications.find((n) => {
      if (n.userId !== input.responsibleId) return false;
      const key = n.dedupeKey ?? "";
      if (!key.startsWith(`ATTENTION:${input.responsibleId}:${input.sheetId}:${input.code}:`)) {
        return false;
      }
      if (!key.includes(`:${input.level}:`) && key !== legacyInitial) return false;
      if (key.includes(":REMINDER_") || key.includes(":ESCALATION")) return false;
      return toDate(n.createdAt).getTime() >= entered.getTime() - 60_000;
    });
  }

  const hasReminder1 = Boolean(findNotif(input.existingNotifications, [r1Key]));
  const hasReminder2 = Boolean(findNotif(input.existingNotifications, [r2Key]));
  const hasEscalation = escKey
    ? Boolean(findNotif(input.existingNotifications, [escKey]))
    : false;

  const debugBase = {
    episode,
    hoursSinceInitial: null as number | null,
    hasInitial: Boolean(initial),
    hasReminder1,
    hasReminder2,
    hasEscalation,
  };

  // Pas d’INITIAL (W3-C1) → ne pas inventer de rappel
  if (!initial) {
    return empty({
      nextCheckAt: null,
      debug: debugBase,
    });
  }

  const initialAt = toDate(initial.createdAt);
  const hours = hoursBetween(initialAt, now);
  debugBase.hoursSinceInitial = hours;

  const levelLabel = URGENCY_LABELS[input.level as UrgencyLevel] ?? String(input.level);

  // Escalade prioritaire si délai atteint (ou CRITIQUE rapide)
  if (
    input.escalateToId &&
    escKey &&
    !hasEscalation &&
    policy.escalateAfterHours > 0 &&
    hours >= policy.escalateAfterHours
  ) {
    const remindersDone = (hasReminder1 ? 1 : 0) + (hasReminder2 ? 1 : 0);
    const escalationReason =
      remindersDone > 0
        ? `Non traité malgré ${remindersDone} rappel${remindersDone > 1 ? "s" : ""} au responsable${
            input.responsibleName ? ` (${input.responsibleName})` : ""
          }.`
        : `Escalade : situation ${levelLabel.toLowerCase()} non traitée depuis ${Math.floor(hours)} h${
            input.responsibleName ? ` — responsable ${input.responsibleName}` : ""
          }.`;

    return {
      action: "ESCALATE",
      recipientId: input.escalateToId,
      stage: "ESCALATION",
      problemReason: input.primaryReason,
      escalationReason,
      dedupeKey: escKey,
      notificationType: "FOLLOWUP_ESCALATION",
      title: `Escalade · ${levelLabel} · ${input.sheetTitle}`,
      message: `${input.primaryReason}\n\n${escalationReason}`,
      nextCheckAt: null,
      debug: debugBase,
    };
  }

  // Pas de rappel si escalade déjà faite
  if (hasEscalation) {
    return empty({ debug: debugBase });
  }

  // REMINDER_2
  if (
    policy.maxReminders >= 2 &&
    policy.reminder2AfterHours > 0 &&
    hasReminder1 &&
    !hasReminder2 &&
    hours >= policy.reminder2AfterHours
  ) {
    return {
      action: "REMIND",
      recipientId: input.responsibleId,
      stage: "REMINDER_2",
      problemReason: input.primaryReason,
      escalationReason: null,
      dedupeKey: r2Key,
      notificationType: "FOLLOWUP_REMINDER",
      title: `Rappel · ${levelLabel} · ${input.sheetTitle}`,
      message: `${input.primaryReason}\n\nToujours en attente — 2ᵉ rappel.`,
      nextCheckAt:
        policy.escalateAfterHours > 0
          ? new Date(initialAt.getTime() + policy.escalateAfterHours * 3600000)
          : null,
      debug: debugBase,
    };
  }

  // REMINDER_1 — pas si on est déjà au-delà du seuil d’escalade sans destinataire d’escalade
  // (évite rappel + escalade le même tick : escalade gérée plus haut)
  if (
    policy.maxReminders >= 1 &&
    policy.reminder1AfterHours > 0 &&
    !hasReminder1 &&
    hours >= policy.reminder1AfterHours
  ) {
    // Si escalade due au même moment et destinataire dispo → déjà géré. Sinon rappel.
    const escalateDue =
      input.escalateToId &&
      policy.escalateAfterHours > 0 &&
      hours >= policy.escalateAfterHours;
    if (escalateDue) {
      return empty({ debug: debugBase });
    }

    return {
      action: "REMIND",
      recipientId: input.responsibleId,
      stage: "REMINDER_1",
      problemReason: input.primaryReason,
      escalationReason: null,
      dedupeKey: r1Key,
      notificationType: "FOLLOWUP_REMINDER",
      title: `Rappel · ${levelLabel} · ${input.sheetTitle}`,
      message: `${input.primaryReason}\n\nToujours à traiter.`,
      nextCheckAt: (() => {
        if (policy.maxReminders >= 2 && policy.reminder2AfterHours > 0) {
          return new Date(initialAt.getTime() + policy.reminder2AfterHours * 3600000);
        }
        if (policy.escalateAfterHours > 0) {
          return new Date(initialAt.getTime() + policy.escalateAfterHours * 3600000);
        }
        return null;
      })(),
      debug: debugBase,
    };
  }

  // Prochain check
  let next: Date | null = null;
  if (!hasReminder1 && policy.reminder1AfterHours > 0 && policy.maxReminders >= 1) {
    next = new Date(initialAt.getTime() + policy.reminder1AfterHours * 3600000);
  } else if (
    hasReminder1 &&
    !hasReminder2 &&
    policy.maxReminders >= 2 &&
    policy.reminder2AfterHours > 0
  ) {
    next = new Date(initialAt.getTime() + policy.reminder2AfterHours * 3600000);
  } else if (!hasEscalation && policy.escalateAfterHours > 0 && input.escalateToId) {
    next = new Date(initialAt.getTime() + policy.escalateAfterHours * 3600000);
  }

  return empty({ nextCheckAt: next, debug: debugBase });
}
