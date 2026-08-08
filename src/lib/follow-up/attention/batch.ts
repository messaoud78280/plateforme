/**
 * Charge le contexte d’attention pour N fiches sans N+1.
 * Respecte le périmètre déjà filtré (sheetIds issus de l’accès utilisateur).
 */
import { prisma } from "@/lib/prisma";
import {
  evaluateFollowUpAttention,
  serializeAttentionResult,
  type SerializedAttention,
} from "@/lib/follow-up/attention/evaluate";
import type { AttentionWorkflowStep } from "@/lib/follow-up/attention/types";
import type { UrgencyThresholds } from "@/lib/follow-up/types";
import { URGENCY_LABELS } from "@/lib/follow-up/types";

export async function loadAttentionForSheets(opts: {
  sheets: {
    id: string;
    status: string;
    title?: string | null;
    nextActionAt?: string | null;
    nextActionDone?: boolean;
    urgencyOverride?: string | null;
    /** Peut déjà être fourni (évite double requête). */
    statusEnteredAt?: string | null;
  }[];
  organizationId?: string | null;
  workflowSteps?: AttentionWorkflowStep[];
  thresholds?: UrgencyThresholds;
  now?: Date;
}): Promise<Map<string, SerializedAttention>> {
  const out = new Map<string, SerializedAttention>();
  const sheetIds = opts.sheets.map((s) => s.id);
  if (sheetIds.length === 0) return out;

  const statusEnteredAt = new Map<string, string>();
  for (const s of opts.sheets) {
    if (s.statusEnteredAt) statusEnteredAt.set(s.id, s.statusEnteredAt);
  }

  const needTimeline = opts.sheets.some((s) => !s.statusEnteredAt);
  if (needTimeline) {
    const statusEvents = await prisma.followUpTimelineEvent.findMany({
      where: { sheetId: { in: sheetIds }, kind: "statut" },
      select: { sheetId: true, occurredAt: true },
      orderBy: { occurredAt: "desc" },
    });
    for (const e of statusEvents) {
      if (!statusEnteredAt.has(e.sheetId)) {
        statusEnteredAt.set(e.sheetId, e.occurredAt.toISOString());
      }
    }
  }

  const agendaRows = await prisma.agendaEvent.findMany({
    where: {
      followUpSheetId: { in: sheetIds },
      status: { not: "ANNULE" },
      type: { in: ["LIVRAISON", "INTERVENTION"] },
    },
    select: {
      id: true,
      followUpSheetId: true,
      type: true,
      status: true,
      title: true,
      startAt: true,
    },
  });

  const agendaBySheet = new Map<string, typeof agendaRows>();
  for (const ev of agendaRows) {
    if (!ev.followUpSheetId) continue;
    const list = agendaBySheet.get(ev.followUpSheetId) ?? [];
    list.push(ev);
    agendaBySheet.set(ev.followUpSheetId, list);
  }

  let steps = opts.workflowSteps ?? [];
  if (steps.length === 0 && opts.organizationId) {
    const { ensureDefaultWorkflow } = await import("@/lib/workflow/service");
    const wf = await ensureDefaultWorkflow(opts.organizationId);
    steps = wf.steps.map((s) => ({
      statusKey: s.statusKey,
      label: s.label,
      delayHours: s.delayHours,
      alertOrangeHours: s.alertOrangeHours,
      alertRedHours: s.alertRedHours,
      escalateHours: s.escalateHours,
    }));
  }
  const stepByKey = new Map(steps.map((s) => [s.statusKey, s]));

  const now = opts.now ?? new Date();

  for (const sheet of opts.sheets) {
    const result = evaluateFollowUpAttention(
      {
        id: sheet.id,
        status: sheet.status,
        title: sheet.title,
        nextActionAt: sheet.nextActionAt,
        nextActionDone: sheet.nextActionDone,
        urgencyOverride: sheet.urgencyOverride as never,
        statusEnteredAt: statusEnteredAt.get(sheet.id) ?? null,
      },
      {
        now,
        workflowStep: stepByKey.get(sheet.status) ?? null,
        agendaEvents: (agendaBySheet.get(sheet.id) ?? []).map((e) => ({
          id: e.id,
          type: e.type,
          status: e.status,
          title: e.title,
          startAt: e.startAt,
        })),
        thresholds: opts.thresholds,
      },
    );
    out.set(sheet.id, serializeAttentionResult(result));
  }

  return out;
}

export function urgencyLabelFor(level: string): string {
  return URGENCY_LABELS[level as keyof typeof URGENCY_LABELS] ?? level;
}
