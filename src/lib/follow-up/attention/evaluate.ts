/**
 * W3-A — Moteur central de détection d’attention (analyse pure, sans effet de bord).
 *
 * Ne modifie pas le statut, le workflow, ni n’envoie de notification.
 */
import { STATUS_LABELS, DEFAULT_URGENCY_THRESHOLDS, type UrgencyLevel } from "@/lib/follow-up/types";
import { maxUrgency, urgencyRank } from "@/lib/follow-up/urgency";
import {
  calendarDaysBetween,
  formatDaysFr,
  hoursBetween,
  toDate,
} from "@/lib/follow-up/attention/dates";
import {
  DEFAULT_ATTENTION_DUE_DAYS,
  type AttentionAgendaEvent,
  type AttentionCode,
  type AttentionSheetInput,
  type AttentionWorkflowStep,
  type EvaluateFollowUpAttentionContext,
  type FollowUpAttentionItem,
  type FollowUpAttentionResult,
} from "@/lib/follow-up/attention/types";

function parseAgenda(events: AttentionAgendaEvent[] | undefined, now: Date) {
  return (events ?? [])
    .map((e) => ({
      ...e,
      startAt: toDate(e.startAt)!,
    }))
    .filter((e) => e.startAt && e.status !== "ANNULE");
}

function levelFromStepOverrun(
  hoursInStep: number,
  step: AttentionWorkflowStep,
): UrgencyLevel {
  const delay = step.delayHours ?? 0;
  const orange = step.alertOrangeHours ?? delay;
  const red = step.alertRedHours ?? Math.round(delay * 1.5);
  const escalate = step.escalateHours ?? delay * 2;

  if (escalate > 0 && hoursInStep >= escalate) return "CRITIQUE";
  if (red > 0 && hoursInStep >= red) return "URGENT";
  if (orange > 0 && hoursInStep >= orange) return "IMPORTANT";
  return "A_SURVEILLER";
}

function ruleDue(
  sheet: AttentionSheetInput,
  ctx: EvaluateFollowUpAttentionContext,
  now: Date,
): FollowUpAttentionItem | null {
  if (sheet.nextActionDone) return null;
  const due = toDate(sheet.nextActionAt);
  if (!due) return null;

  const dayDiff = calendarDaysBetween(now, due);
  const days = ctx.dueDayThresholds ?? DEFAULT_ATTENTION_DUE_DAYS;
  const thresholds = ctx.thresholds ?? DEFAULT_URGENCY_THRESHOLDS;
  const overdueHours = hoursBetween(due, now);

  if (dayDiff < 0) {
    const overdueDays = -dayDiff;
    const critical =
      overdueHours >= (thresholds.criticalOverdueHours ?? 24) || overdueDays >= 1;
    return {
      code: "DUE_OVERDUE",
      level: critical ? "CRITIQUE" : "URGENT",
      reason:
        overdueDays <= 0
          ? "Échéance dépassée"
          : overdueDays === 1
            ? "Échéance dépassée de 1 jour"
            : `Échéance dépassée de ${overdueDays} jours`,
      dueAt: due,
      overdueByHours: overdueHours,
    };
  }

  if (dayDiff === 0) {
    return {
      code: "DUE_TODAY",
      level: "URGENT",
      reason: "Échéance aujourd’hui",
      dueAt: due,
    };
  }

  if (dayDiff === 1) {
    return {
      code: "DUE_TOMORROW",
      level: "IMPORTANT",
      reason: "Échéance demain",
      dueAt: due,
    };
  }

  if (dayDiff <= days.watchWithinDays) {
    return {
      code: "DUE_SOON",
      level: "A_SURVEILLER",
      reason: `Échéance dans ${formatDaysFr(dayDiff)}`,
      dueAt: due,
    };
  }

  // > watchWithinDays → NORMAL, pas d’item
  return null;
}

function ruleStepStale(
  sheet: AttentionSheetInput,
  step: AttentionWorkflowStep | null | undefined,
  now: Date,
): FollowUpAttentionItem | null {
  if (!step?.delayHours || step.delayHours <= 0) return null;
  const entered = toDate(sheet.statusEnteredAt);
  if (!entered) return null;

  const hoursInStep = hoursBetween(entered, now);
  if (hoursInStep < step.delayHours) return null;

  // Facturation / avenant : règles dédiées (évite double badge)
  if (
    sheet.status === "TRAVAUX_TERMINES" ||
    sheet.status === "CR_A_RECUPERER" ||
    sheet.status === "A_FACTURER"
  ) {
    return null;
  }
  if (sheet.status === "AVENANT") return null;

  const days = Math.max(1, Math.floor(hoursInStep / 24));
  const label = step.label || STATUS_LABELS[sheet.status as keyof typeof STATUS_LABELS] || sheet.status;

  return {
    code: "STEP_OVERDUE",
    level: levelFromStepOverrun(hoursInStep, step),
    reason: `${label} depuis ${formatDaysFr(days)}`,
    overdueByHours: hoursInStep,
  };
}

function ruleBilling(
  sheet: AttentionSheetInput,
  step: AttentionWorkflowStep | null | undefined,
  now: Date,
): FollowUpAttentionItem | null {
  const billingStatuses = ["TRAVAUX_TERMINES", "CR_A_RECUPERER", "A_FACTURER"];
  if (!billingStatuses.includes(String(sheet.status))) return null;

  const entered = toDate(sheet.statusEnteredAt);
  if (!entered) return null;

  const delayHours = step?.delayHours && step.delayHours > 0 ? step.delayHours : 48;
  const hoursInStep = hoursBetween(entered, now);
  if (hoursInStep < delayHours) return null;

  const days = Math.max(1, Math.floor(hoursInStep / 24));
  const stepForLevel: AttentionWorkflowStep = {
    statusKey: String(sheet.status),
    label: step?.label ?? "À facturer",
    delayHours,
    alertOrangeHours: step?.alertOrangeHours ?? delayHours,
    alertRedHours: step?.alertRedHours ?? Math.round(delayHours * 1.5),
    escalateHours: step?.escalateHours ?? delayHours * 2,
  };

  return {
    code: "BILLING_PENDING",
    level: levelFromStepOverrun(hoursInStep, stepForLevel),
    reason: `Travaux terminés depuis ${formatDaysFr(days)} — facturation à préparer`,
    overdueByHours: hoursInStep,
  };
}

function ruleAvenant(
  sheet: AttentionSheetInput,
  step: AttentionWorkflowStep | null | undefined,
  now: Date,
): FollowUpAttentionItem | null {
  if (sheet.status !== "AVENANT") return null;
  const entered = toDate(sheet.statusEnteredAt);
  if (!entered) return null;

  const delayHours = step?.delayHours && step.delayHours > 0 ? step.delayHours : 120;
  const hoursInStep = hoursBetween(entered, now);
  if (hoursInStep < delayHours) return null;

  const days = Math.max(1, Math.floor(hoursInStep / 24));
  const stepForLevel: AttentionWorkflowStep = {
    statusKey: "AVENANT",
    label: step?.label ?? "Avenant",
    delayHours,
    alertOrangeHours: step?.alertOrangeHours ?? delayHours,
    alertRedHours: step?.alertRedHours ?? step?.alertOrangeHours ?? Math.round(delayHours * 1.2),
    escalateHours: step?.escalateHours ?? Math.round(delayHours * 1.5),
  };

  return {
    code: "AVENANT_WAITING",
    level: levelFromStepOverrun(hoursInStep, stepForLevel),
    reason: `Avenant en attente depuis ${formatDaysFr(days)}`,
    overdueByHours: hoursInStep,
  };
}

function ruleDelivery(
  sheet: AttentionSheetInput,
  events: ReturnType<typeof parseAgenda>,
  now: Date,
): FollowUpAttentionItem[] {
  const items: FollowUpAttentionItem[] = [];
  const deliveries = events
    .filter((e) => e.type === "LIVRAISON" && e.status !== "TERMINE")
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  for (const d of deliveries) {
    const hoursUntil = hoursBetween(now, d.startAt);
    const label = d.title || "Livraison";

    if (hoursUntil < 0 && d.status !== "TERMINE") {
      const late = -hoursUntil;
      if (late < 1.5) continue;
      items.push({
        code: "DELIVERY_OVERDUE",
        level: late >= 4 ? "CRITIQUE" : "URGENT",
        reason:
          late >= 4
            ? `${label} — réception non confirmée depuis ${Math.round(late)} h`
            : `${label} — prévue, réception non confirmée`,
        dueAt: d.startAt,
        overdueByHours: late,
        relatedEntity: { type: "agenda", id: d.id, label },
      });
      continue;
    }

    if (
      hoursUntil >= 0 &&
      hoursUntil <= 24 &&
      d.status !== "CONFIRME" &&
      d.status !== "TERMINE"
    ) {
      items.push({
        code: "DELIVERY_UNCONFIRMED",
        level: "URGENT",
        reason: `${label} — réception non confirmée`,
        dueAt: d.startAt,
        relatedEntity: { type: "agenda", id: d.id, label },
      });
    }
  }

  return items;
}

/**
 * Intervention imminente encore en étape « Préparation » (INTERVENTION_PREVUE).
 * Pas de checklist complexe — uniquement statut + date agenda structurée.
 */
function ruleInterventionPrep(
  sheet: AttentionSheetInput,
  events: ReturnType<typeof parseAgenda>,
  now: Date,
): FollowUpAttentionItem | null {
  if (sheet.status !== "INTERVENTION_PREVUE") return null;

  const intervention = events
    .filter((e) => e.type === "INTERVENTION" && e.status !== "TERMINE")
    .filter((e) => e.startAt.getTime() >= now.getTime() - 3600000)
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())[0];

  if (!intervention) return null;

  const dayDiff = calendarDaysBetween(now, intervention.startAt);
  if (dayDiff < 0 || dayDiff > 1) return null;

  return {
    code: "INTERVENTION_PREP",
    level: dayDiff === 0 ? "URGENT" : "IMPORTANT",
    reason:
      dayDiff === 0
        ? "Intervention aujourd’hui — préparation à finaliser"
        : "Intervention demain — préparation à finaliser",
    dueAt: intervention.startAt,
    relatedEntity: {
      type: "agenda",
      id: intervention.id,
      label: intervention.title,
    },
  };
}

function pickPrimary(items: FollowUpAttentionItem[]): FollowUpAttentionItem | null {
  if (items.length === 0) return null;
  return items.slice().sort((a, b) => urgencyRank(b.level) - urgencyRank(a.level))[0] ?? null;
}

/**
 * Analyse une fiche + contexte → situations d’attention + urgence effective.
 * Déterministe, sans I/O, sans mutation.
 */
export function evaluateFollowUpAttention(
  sheet: AttentionSheetInput,
  context: EvaluateFollowUpAttentionContext = {},
): FollowUpAttentionResult {
  const now = context.now ?? new Date();
  const step = context.workflowStep ?? null;
  const agenda = parseAgenda(context.agendaEvents, now);

  const items: FollowUpAttentionItem[] = [];

  const due = ruleDue(sheet, context, now);
  if (due) items.push(due);

  const stale = ruleStepStale(sheet, step, now);
  if (stale) items.push(stale);

  const billing = ruleBilling(sheet, step, now);
  if (billing) items.push(billing);

  const avenant = ruleAvenant(sheet, step, now);
  if (avenant) items.push(avenant);

  items.push(...ruleDelivery(sheet, agenda, now));

  const prep = ruleInterventionPrep(sheet, agenda, now);
  if (prep) items.push(prep);

  const computedUrgency = items.reduce<UrgencyLevel>(
    (acc, it) => maxUrgency(acc, it.level),
    "NORMAL",
  );

  const manualUrgency = (sheet.urgencyOverride as UrgencyLevel | null | undefined) ?? null;
  const effectiveUrgency = manualUrgency
    ? maxUrgency(computedUrgency, manualUrgency)
    : computedUrgency;

  const primary = pickPrimary(items);

  return {
    effectiveUrgency,
    computedUrgency,
    manualUrgency,
    primaryReason: primary?.reason ?? null,
    attentionItems: items.sort((a, b) => urgencyRank(b.level) - urgencyRank(a.level)),
  };
}

/** Dernière entrée dans l’étape courante depuis des events timeline (kind statut). */
export function statusEnteredAtFromTimeline(
  events: { sheetId?: string; kind: string; occurredAt: Date | string }[],
  sheetId?: string,
): Date | null {
  const filtered = events
    .filter((e) => e.kind === "statut" && (!sheetId || e.sheetId === sheetId))
    .map((e) => toDate(e.occurredAt))
    .filter((d): d is Date => Boolean(d))
    .sort((a, b) => b.getTime() - a.getTime());
  return filtered[0] ?? null;
}

export function serializeAttentionResult(result: FollowUpAttentionResult) {
  return {
    effectiveUrgency: result.effectiveUrgency,
    computedUrgency: result.computedUrgency,
    manualUrgency: result.manualUrgency,
    primaryReason: result.primaryReason,
    attentionItems: result.attentionItems.map((it) => ({
      code: it.code as AttentionCode,
      level: it.level,
      reason: it.reason,
      dueAt: it.dueAt?.toISOString() ?? null,
      overdueByHours: it.overdueByHours ?? null,
      relatedEntity: it.relatedEntity ?? null,
    })),
  };
}

export type SerializedAttention = ReturnType<typeof serializeAttentionResult>;
