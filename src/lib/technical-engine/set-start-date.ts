/**
 * Phase E — Définir la date de démarrage (recalcul calendrier sans recréer le graphe métier).
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import { normalizeCivilStartDate } from "@/lib/preparation/schedule/calendar";
import { computeSchedule } from "@/lib/preparation/schedule/compute";
import {
  parsePrepResources,
  parsePrepSchedule,
  parsePrepWorkflowSteps,
} from "@/lib/preparation/schedule/parse";
import { computeStudy } from "@/lib/preparation/engine/compute";
import { getPrepStudyView, PrepError } from "@/lib/preparation/service";
import { displayUnit } from "@/lib/preparation/units";

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/**
 * Met à jour scheduleJson.start_date sur l’étude, puis recalcule les dates
 * civiles des plans existants (tâches conservées — pas de delete/create).
 */
export async function setStudyScheduleStartDate(input: {
  orgId: string;
  studyId: string;
  userId: string;
  startDate: string;
  planId?: string | null;
}): Promise<{
  startDate: string;
  studyId: string;
  plansUpdated: number;
  tasksUpdated: number;
}> {
  const startIso = normalizeCivilStartDate(input.startDate);
  if (!startIso) {
    throw new PrepError(
      "Date de démarrage invalide. Attendu : YYYY-MM-DD (pas 1970, pas de date fictive).",
      422,
    );
  }

  const study = await getPrepStudyView(input.orgId, input.studyId);
  if (!study) throw new PrepError("Étude introuvable", 404);

  const row = await prisma.prepStudy.findFirst({
    where: { id: study.id, organizationId: input.orgId, archivedAt: null },
    select: {
      id: true,
      scheduleJson: true,
      workflowJson: true,
      resourcesJson: true,
    },
  });
  if (!row) throw new PrepError("Étude introuvable", 404);

  const scheduleRaw = isObj(row.scheduleJson) ? { ...row.scheduleJson } : null;
  if (!scheduleRaw || !Array.isArray(scheduleRaw.tasks) || !scheduleRaw.tasks.length) {
    throw new PrepError(
      "Aucun schedule relatif dans l’étude — importez d’abord un bundle avec schedule",
      422,
    );
  }

  scheduleRaw.start_date = startIso;

  const workflow = parsePrepWorkflowSteps(row.workflowJson);
  const schedule = parsePrepSchedule(scheduleRaw);
  const resources = parsePrepResources(row.resourcesJson);
  if (!schedule || !workflow.length) {
    throw new PrepError("workflow / schedule illisibles", 422);
  }

  const engine = computeStudy({ params: study.params, lines: study.lines });
  const lineByCode = new Map(study.lines.map((l) => [l.code, l]));
  const computed = computeSchedule({
    workflowSteps: workflow,
    schedule,
    resources,
    qtyOf: (code) => engine.nodes.get(code)?.value ?? null,
    qtyUnitOf: (code) => {
      const l = lineByCode.get(code);
      return l ? displayUnit(l.unit) || l.unit : null;
    },
  });
  if (computed.errors.length) {
    throw new PrepError(computed.errors[0]!, 422);
  }

  const plans = await prisma.prepSchedulePlan.findMany({
    where: {
      studyId: study.id,
      organizationId: input.orgId,
      status: { not: "ARCHIVED" },
      ...(input.planId ? { id: input.planId } : {}),
    },
    include: { tasks: { select: { id: true, stepCode: true } } },
  });

  let tasksUpdated = 0;

  await prisma.$transaction(async (tx) => {
    await tx.prepStudy.update({
      where: { id: study.id },
      data: {
        scheduleJson: scheduleRaw as Prisma.InputJsonValue,
        updatedById: input.userId,
        version: { increment: 1 },
      },
    });

    for (const plan of plans) {
      const byStep = new Map(computed.placed.map((t) => [t.stepId, t]));
      await tx.prepSchedulePlan.update({
        where: { id: plan.id },
        data: {
          startDate: new Date(startIso),
          endDateBase: computed.baseEnd ? new Date(computed.baseEnd.date) : null,
          endDateWithConditional: (() => {
            const ends = computed.placed
              .map((t) => t.endDate)
              .filter((x): x is string => Boolean(x));
            if (!ends.length) return null;
            return new Date(ends.reduce((a, b) => (b > a ? b : a)));
          })(),
          baseDurationWorkingDays: computed.baseDurationWorkingDays,
          withConditionalWorkingDays: computed.withConditionalDurationWorkingDays,
        },
      });

      for (const task of plan.tasks) {
        const placed = byStep.get(task.stepCode);
        if (!placed) continue;
        await tx.prepScheduleTask.update({
          where: { id: task.id },
          data: {
            startDate: placed.startDate ? new Date(placed.startDate) : null,
            endDate: placed.endDate ? new Date(placed.endDate) : null,
            startHalf: placed.start.half,
            endHalf: placed.end.half,
            durationDays: d(placed.duration.durationDays),
            computedDurationDays: d(placed.duration.durationDays),
          },
        });
        tasksUpdated++;
      }

      await tx.prepScheduleEvent.create({
        data: {
          organizationId: input.orgId,
          planId: plan.id,
          kind: "START_DATE_SET",
          detailJson: {
            startDate: startIso,
            tasksUpdated: plan.tasks.length,
            idempotent: true,
          },
          actorUserId: input.userId,
        },
      });
    }

    await tx.prepStudyEvent.create({
      data: {
        studyId: study.id,
        organizationId: input.orgId,
        kind: "SCHEDULE_START_DATE_SET",
        detailJson: { startDate: startIso, plansUpdated: plans.length },
        actorUserId: input.userId,
      },
    });
  });

  return {
    startDate: startIso,
    studyId: study.id,
    plansUpdated: plans.length,
    tasksUpdated,
  };
}
