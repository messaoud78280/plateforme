/**
 * Charge le contexte d’attention pour N fiches sans N+1.
 * Respecte le périmètre déjà filtré (sheetIds issus de l’accès utilisateur).
 *
 * Cohérence multi-tenant :
 * - si `organizationId` est fourni → workflow de cette org pour tout le batch ;
 * - sinon → 1 requête batch pour résoudre l’org par fiche, puis workflow par org ;
 * - jamais de fallback silencieux si une org est connue.
 */
import { prisma } from "@/lib/prisma";
import {
  evaluateFollowUpAttention,
  serializeAttentionResult,
  type SerializedAttention,
} from "@/lib/follow-up/attention/evaluate";
import type { AttentionWorkflowStep } from "@/lib/follow-up/attention/types";
import { episodeKeyFromStatusTransition } from "@/lib/follow-up/attention/escalation-policy";
import type { UrgencyThresholds } from "@/lib/follow-up/types";
import { URGENCY_LABELS } from "@/lib/follow-up/types";

export type AttentionBatchResult = {
  byId: Map<string, SerializedAttention>;
  statusEnteredAt: Map<string, string>;
  /** Clé d’épisode = id événement timeline statut (ou fallback timestamp). */
  statusEpisodeKey: Map<string, string>;
};

async function loadWorkflowStepsForOrg(
  organizationId: string,
): Promise<AttentionWorkflowStep[]> {
  const { ensureDefaultWorkflow } = await import("@/lib/workflow/service");
  const wf = await ensureDefaultWorkflow(organizationId);
  return wf.steps.map((s) => ({
    statusKey: s.statusKey,
    label: s.label,
    delayHours: s.delayHours,
    alertOrangeHours: s.alertOrangeHours,
    alertRedHours: s.alertRedHours,
    reminderHours: s.reminderHours,
    escalateHours: s.escalateHours,
  }));
}

function warnFallbackMissingOrg(sheetCount: number) {
  console.warn(
    `[attention] fallback policy used subjectType=FOLLOW_UP organizationId=missing sheetCount=${sheetCount}`,
  );
}

export async function loadAttentionForSheets(opts: {
  sheets: {
    id: string;
    status: string;
    title?: string | null;
    nextActionAt?: string | null;
    nextActionDone?: boolean;
    urgencyOverride?: string | null;
    /** Peut déjà être fourni (évite double requête pour l’heure seule). */
    statusEnteredAt?: string | null;
    statusEpisodeKey?: string | null;
  }[];
  organizationId?: string | null;
  workflowSteps?: AttentionWorkflowStep[];
  thresholds?: UrgencyThresholds;
  now?: Date;
}): Promise<AttentionBatchResult> {
  const out = new Map<string, SerializedAttention>();
  const sheetIds = opts.sheets.map((s) => s.id);
  if (sheetIds.length === 0) {
    return { byId: out, statusEnteredAt: new Map(), statusEpisodeKey: new Map() };
  }

  const statusEnteredAt = new Map<string, string>();
  const statusEpisodeKey = new Map<string, string>();
  for (const s of opts.sheets) {
    if (s.statusEnteredAt) statusEnteredAt.set(s.id, s.statusEnteredAt);
    if (s.statusEpisodeKey) statusEpisodeKey.set(s.id, s.statusEpisodeKey);
  }

  const needTimeline = opts.sheets.some((s) => !s.statusEnteredAt || !s.statusEpisodeKey);
  if (needTimeline) {
    const statusEvents = await prisma.followUpTimelineEvent.findMany({
      where: { sheetId: { in: sheetIds }, kind: "statut" },
      select: { id: true, sheetId: true, occurredAt: true },
      orderBy: { occurredAt: "desc" },
    });
    for (const e of statusEvents) {
      if (!statusEnteredAt.has(e.sheetId)) {
        statusEnteredAt.set(e.sheetId, e.occurredAt.toISOString());
      }
      if (!statusEpisodeKey.has(e.sheetId)) {
        statusEpisodeKey.set(
          e.sheetId,
          episodeKeyFromStatusTransition({
            eventId: e.id,
            occurredAt: e.occurredAt,
          }),
        );
      }
    }
  }

  for (const s of opts.sheets) {
    if (!statusEpisodeKey.has(s.id)) {
      statusEpisodeKey.set(
        s.id,
        episodeKeyFromStatusTransition({
          occurredAt: statusEnteredAt.get(s.id) ?? null,
        }),
      );
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
      purchaseOrderId: true,
    },
  });

  const agendaBySheet = new Map<string, typeof agendaRows>();
  for (const ev of agendaRows) {
    if (!ev.followUpSheetId) continue;
    const list = agendaBySheet.get(ev.followUpSheetId) ?? [];
    list.push(ev);
    agendaBySheet.set(ev.followUpSheetId, list);
  }

  /** orgId par fiche — jamais de mélange silencieux multi-tenant. */
  const orgBySheetId = new Map<string, string | null>();
  if (opts.organizationId) {
    for (const s of opts.sheets) {
      orgBySheetId.set(s.id, opts.organizationId);
    }
  } else {
    const orgRows = await prisma.followUpSheet.findMany({
      where: { id: { in: sheetIds } },
      select: { id: true, organizationId: true },
    });
    for (const row of orgRows) {
      orgBySheetId.set(row.id, row.organizationId);
    }
    for (const s of opts.sheets) {
      if (!orgBySheetId.has(s.id)) orgBySheetId.set(s.id, null);
    }
  }

  const providedSteps = opts.workflowSteps ?? [];
  const stepsByOrgId = new Map<string, AttentionWorkflowStep[]>();

  if (providedSteps.length > 0) {
    const orgIds = [
      ...new Set(
        [...orgBySheetId.values()].filter((id): id is string => Boolean(id)),
      ),
    ];
    if (orgIds.length === 0) {
      stepsByOrgId.set("__provided__", providedSteps);
    } else {
      for (const orgId of orgIds) {
        stepsByOrgId.set(orgId, providedSteps);
      }
    }
  } else {
    const orgIds = [
      ...new Set(
        [...orgBySheetId.values()].filter((id): id is string => Boolean(id)),
      ),
    ];
    await Promise.all(
      orgIds.map(async (orgId) => {
        try {
          stepsByOrgId.set(orgId, await loadWorkflowStepsForOrg(orgId));
        } catch (e) {
          console.error(
            `[attention] workflow load failed organizationId=${orgId}`,
            e instanceof Error ? e.message : e,
          );
          stepsByOrgId.set(orgId, []);
        }
      }),
    );
  }

  const missingOrgCount = opts.sheets.filter((s) => !orgBySheetId.get(s.id)).length;
  if (missingOrgCount > 0 && providedSteps.length === 0) {
    warnFallbackMissingOrg(missingOrgCount);
  }

  const now = opts.now ?? new Date();

  for (const sheet of opts.sheets) {
    const orgId = orgBySheetId.get(sheet.id) ?? null;
    const steps =
      (orgId ? stepsByOrgId.get(orgId) : null) ??
      stepsByOrgId.get("__provided__") ??
      providedSteps;
    const stepByKey = new Map(steps.map((s) => [s.statusKey, s]));

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
          purchaseOrderId: e.purchaseOrderId,
        })),
        thresholds: opts.thresholds,
      },
    );
    out.set(sheet.id, serializeAttentionResult(result));
  }

  return { byId: out, statusEnteredAt, statusEpisodeKey };
}

export function urgencyLabelFor(level: string): string {
  return URGENCY_LABELS[level as keyof typeof URGENCY_LABELS] ?? level;
}
