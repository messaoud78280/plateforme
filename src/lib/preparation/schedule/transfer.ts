/**
 * Passerelle Métré → Planification de chantier : preview + commit.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import { computeStudy } from "@/lib/preparation/engine/compute";
import { getPrepStudyView, PrepError } from "@/lib/preparation/service";
import { DEMO_WATERMARK } from "@/lib/preparation/types";
import { displayUnit } from "@/lib/preparation/units";
import {
  parsePrepResources,
  parsePrepSchedule,
  parsePrepWorkflowSteps,
} from "@/lib/preparation/schedule/parse";
import {
  computeSchedule,
  type PlacedTask,
} from "@/lib/preparation/schedule/compute";
import { RATE_PER_LABELS } from "@/lib/preparation/schedule/types";

export type SchedulePreviewQuoteOption = {
  id: string;
  number: string;
  subject: string;
  status: string;
  isDemonstration: boolean;
  totalSellHt: number;
};

export type SchedulePreviewTask = {
  stepId: string;
  name: string;
  kind: string;
  kindLabel: string;
  order: number;
  lot: string | null;
  description: string | null;
  includeInBase: boolean;
  holdPoint: boolean;
  conditional: boolean;
  startDate: string;
  endDate: string;
  startHalf: number;
  endHalf: number;
  durationDays: number;
  durationCalendar: string;
  durationMode: string;
  quantity: number | null;
  quantityUnit: string | null;
  driverItem: string | null;
  rateId: string | null;
  rateLabel: string | null;
  rateValue: number | null;
  rateUnit: string | null;
  ratePer: string | null;
  ratePerLabel: string | null;
  parallelUnits: number;
  crewLabel: string;
  equipmentLabel: string;
  dependsOn: Array<{ stepId: string; type: string }>;
  blockingReason: string | null;
  takeoffIds: string[];
  sellHt: number | null;
  costHt: number | null;
  selectedByDefault: boolean;
};

export type SchedulePreview = {
  studyId: string;
  studyTitle: string;
  studyVersion: number;
  projectId: string;
  projectTitle: string;
  isDemonstration: boolean;
  watermark: string | null;
  startDate: string | null;
  baseDurationWorkingDays: number | null;
  withConditionalWorkingDays: number | null;
  baseEndDate: string | null;
  tasks: SchedulePreviewTask[];
  warnings: string[];
  errors: string[];
  existingPlans: Array<{
    id: string;
    title: string;
    status: string;
    revisionKind: string;
    href: string;
    createdAt: string;
    baseDurationWorkingDays: number | null;
  }>;
  quoteOptions: SchedulePreviewQuoteOption[];
};

function crewLabel(
  task: PlacedTask,
  laborById: Map<string, string>,
): string {
  if (!task.crew.length) return "—";
  return task.crew
    .map((c) => `${c.count}× ${laborById.get(c.labor_id) ?? c.labor_id}`)
    .join(", ");
}

function equipmentLabel(
  task: PlacedTask,
  eqById: Map<string, string>,
): string {
  if (!task.equipment.length) return "—";
  return task.equipment
    .map((e) => `${e.count}× ${eqById.get(e.equipment_id) ?? e.equipment_id}`)
    .join(", ");
}

async function loadQuoteFinanceByTakeoff(
  orgId: string,
  studyId: string,
  quoteId: string | null,
): Promise<Map<string, { sellHt: number; costHt: number; quoteLineIds: string[] }>> {
  const map = new Map<string, { sellHt: number; costHt: number; quoteLineIds: string[] }>();
  if (!quoteId) return map;

  const links = await prisma.prepQuoteLink.findMany({
    where: { organizationId: orgId, studyId, quoteId },
    select: { studyLineCode: true, quoteLineId: true },
  });
  if (!links.length) return map;

  const lineIds = [...new Set(links.map((l) => l.quoteLineId))];
  const lines = await prisma.commercialQuoteLine.findMany({
    where: { id: { in: lineIds }, organizationId: orgId },
    select: {
      id: true,
      lineSellHt: true,
      lineCostHt: true,
      reference: true,
    },
  });
  const byId = new Map(lines.map((l) => [l.id, l]));
  const seenLine = new Set<string>();

  for (const link of links) {
    if (seenLine.has(link.quoteLineId)) continue;
    seenLine.add(link.quoteLineId);
    const line = byId.get(link.quoteLineId);
    if (!line) continue;
    const code = link.studyLineCode;
    const prev = map.get(code) ?? { sellHt: 0, costHt: 0, quoteLineIds: [] };
    prev.sellHt += d(line.lineSellHt);
    prev.costHt += d(line.lineCostHt);
    prev.quoteLineIds.push(line.id);
    map.set(code, prev);
  }
  return map;
}

function financeForTask(
  takeoffIds: string[],
  byCode: Map<string, { sellHt: number; costHt: number; quoteLineIds: string[] }>,
): { sellHt: number | null; costHt: number | null; quoteLineIds: string[] } {
  let sell = 0;
  let cost = 0;
  let found = false;
  const quoteLineIds: string[] = [];
  const seen = new Set<string>();
  for (const code of takeoffIds) {
    const row = byCode.get(code);
    if (!row) continue;
    found = true;
    sell += row.sellHt;
    cost += row.costHt;
    for (const id of row.quoteLineIds) {
      if (seen.has(id)) continue;
      seen.add(id);
      quoteLineIds.push(id);
    }
  }
  return {
    sellHt: found ? Math.round(sell * 100) / 100 : null,
    costHt: found ? Math.round(cost * 100) / 100 : null,
    quoteLineIds,
  };
}

export async function previewPrepSchedule(input: {
  orgId: string;
  studyId: string;
  quoteId?: string | null;
}): Promise<SchedulePreview> {
  const study = await getPrepStudyView(input.orgId, input.studyId);
  if (!study) throw new PrepError("Étude introuvable", 404);

  const row = await prisma.prepStudy.findFirst({
    where: { id: study.id, organizationId: input.orgId },
    select: {
      resourcesJson: true,
      workflowJson: true,
      scheduleJson: true,
      version: true,
      mode: true,
    },
  });
  if (!row) throw new PrepError("Étude introuvable", 404);

  const resources = parsePrepResources(row.resourcesJson);
  const workflow = parsePrepWorkflowSteps(row.workflowJson);
  const schedule = parsePrepSchedule(row.scheduleJson);
  if (!schedule || !workflow.length) {
    throw new PrepError(
      "Cette étude ne contient pas encore de mode opératoire / planning importé.",
      422,
    );
  }

  const engine = computeStudy({ params: study.params, lines: study.lines });
  const lineByCode = new Map(study.lines.map((l) => [l.code, l]));
  const qtyOf = (code: string) => engine.nodes.get(code)?.value ?? null;
  const qtyUnitOf = (code: string) => {
    const l = lineByCode.get(code);
    return l ? displayUnit(l.unit) || l.unit : null;
  };

  const computed = computeSchedule({
    workflowSteps: workflow,
    schedule,
    resources,
    qtyOf,
    qtyUnitOf,
  });

  const finance = await loadQuoteFinanceByTakeoff(
    input.orgId,
    study.id,
    input.quoteId ?? null,
  );

  const laborById = new Map(resources.labor.map((l) => [l.id, l.role]));
  const eqById = new Map(resources.equipment.map((e) => [e.id, e.label]));
  const rateById = new Map(resources.rates.map((r) => [r.id, r]));

  const tasks: SchedulePreviewTask[] = computed.placed.map((t) => {
    const fin = financeForTask(t.takeoffIds, finance);
    const rate = t.duration.rateId ? rateById.get(t.duration.rateId) : null;
    return {
      stepId: t.stepId,
      name: t.name,
      kind: t.kind,
      kindLabel: t.kindLabel,
      order: t.order,
      lot: t.lot,
      description: t.description,
      includeInBase: t.includeInBase,
      holdPoint: t.holdPoint,
      conditional: t.conditional,
      startDate: t.startDate,
      endDate: t.endDate,
      startHalf: t.start.half,
      endHalf: t.end.half,
      durationDays: t.duration.durationDays,
      durationCalendar: t.duration.calendar,
      durationMode: t.duration.mode,
      quantity: t.duration.quantity,
      quantityUnit: t.duration.quantityUnit,
      driverItem: t.duration.driverItem,
      rateId: t.duration.rateId,
      rateLabel: rate?.label ?? null,
      rateValue: t.duration.rateValue,
      rateUnit: t.duration.rateUnit,
      ratePer: t.duration.ratePer,
      ratePerLabel: t.duration.ratePer ? RATE_PER_LABELS[t.duration.ratePer] : null,
      parallelUnits: t.duration.parallelUnits,
      crewLabel: crewLabel(t, laborById),
      equipmentLabel: equipmentLabel(t, eqById),
      dependsOn: t.dependsOn.map((d) => ({ stepId: d.stepId, type: d.type })),
      blockingReason: t.blockingReason,
      takeoffIds: t.takeoffIds,
      sellHt: fin.sellHt,
      costHt: fin.costHt,
      selectedByDefault: true,
    };
  });

  const existing = await prisma.prepSchedulePlan.findMany({
    where: { organizationId: input.orgId, studyId: study.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      status: true,
      revisionKind: true,
      createdAt: true,
      baseDurationWorkingDays: true,
    },
  });

  const quoteOptions = await prisma.commercialQuote.findMany({
    where: { organizationId: input.orgId, sourcePrepStudyId: study.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      number: true,
      subject: true,
      status: true,
      isDemonstration: true,
      totalSellHt: true,
    },
  });

  const isDemo = study.mode === "DEMONSTRATION" || row.mode === "DEMONSTRATION";

  return {
    studyId: study.id,
    studyTitle: study.title,
    studyVersion: study.version,
    projectId: study.project.id,
    projectTitle: study.project.title,
    isDemonstration: isDemo,
    watermark: isDemo ? DEMO_WATERMARK : null,
    startDate: computed.startDate,
    baseDurationWorkingDays: computed.baseDurationWorkingDays,
    withConditionalWorkingDays: computed.withConditionalDurationWorkingDays,
    baseEndDate: computed.baseEnd?.date ?? null,
    tasks,
    warnings: computed.warnings,
    errors: computed.errors,
    existingPlans: existing.map((p) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      revisionKind: p.revisionKind,
      href: `/dashboard/visites-metres/etudes/${study.id}/planning/${p.id}`,
      createdAt: p.createdAt.toISOString(),
      baseDurationWorkingDays:
        p.baseDurationWorkingDays != null ? d(p.baseDurationWorkingDays) : null,
    })),
    quoteOptions: quoteOptions.map((q) => ({
      id: q.id,
      number: q.number,
      subject: q.subject,
      status: q.status,
      isDemonstration: q.isDemonstration,
      totalSellHt: d(q.totalSellHt),
    })),
  };
}

export type ScheduleCommitResult = {
  action: "created" | "idempotent";
  planId: string;
  href: string;
  taskCount: number;
  baseDurationWorkingDays: number | null;
  isDemonstration: boolean;
};

export async function commitPrepSchedule(input: {
  orgId: string;
  studyId: string;
  userId: string;
  idempotencyKey: string;
  selectedStepIds: string[];
  quoteId?: string | null;
  title?: string | null;
  durationOverrides?: Record<string, number>;
}): Promise<ScheduleCommitResult> {
  const key = input.idempotencyKey.trim();
  if (!key || key.length < 8) throw new PrepError("Clé d'idempotence manquante");
  if (!input.selectedStepIds.length) throw new PrepError("Sélectionnez au moins une intervention");

  const existing = await prisma.prepSchedulePlan.findUnique({
    where: {
      organizationId_idempotencyKey: {
        organizationId: input.orgId,
        idempotencyKey: key,
      },
    },
  });
  if (existing) {
    return {
      action: "idempotent",
      planId: existing.id,
      href: `/dashboard/visites-metres/etudes/${input.studyId}/planning/${existing.id}`,
      taskCount: input.selectedStepIds.length,
      baseDurationWorkingDays:
        existing.baseDurationWorkingDays != null
          ? d(existing.baseDurationWorkingDays)
          : null,
      isDemonstration: existing.isDemonstration,
    };
  }

  const preview = await previewPrepSchedule({
    orgId: input.orgId,
    studyId: input.studyId,
    quoteId: input.quoteId ?? null,
  });
  if (preview.errors.length) throw new PrepError(preview.errors[0]!);

  const selected = new Set(input.selectedStepIds);
  const tasks = preview.tasks.filter((t) => selected.has(t.stepId));
  if (!tasks.length) throw new PrepError("Aucune intervention sélectionnée");

  if (input.quoteId) {
    const ok = preview.quoteOptions.some((q) => q.id === input.quoteId);
    if (!ok) throw new PrepError("Devis non lié à cette étude", 422);
  }

  const study = await prisma.prepStudy.findFirst({
    where: { id: input.studyId, organizationId: input.orgId },
    select: {
      id: true,
      title: true,
      version: true,
      mode: true,
      projectId: true,
      resourcesJson: true,
      workflowJson: true,
      scheduleJson: true,
    },
  });
  if (!study) throw new PrepError("Étude introuvable", 404);

  // Recalcul exact pour snapshots (avec overrides)
  const studyView = await getPrepStudyView(input.orgId, input.studyId);
  if (!studyView) throw new PrepError("Étude introuvable", 404);
  const resources = parsePrepResources(study.resourcesJson);
  const workflow = parsePrepWorkflowSteps(study.workflowJson);
  const schedule = parsePrepSchedule(study.scheduleJson)!;
  const engine = computeStudy({ params: studyView.params, lines: studyView.lines });
  const lineByCode = new Map(studyView.lines.map((l) => [l.code, l]));
  const computed = computeSchedule({
    workflowSteps: workflow,
    schedule,
    resources,
    qtyOf: (c) => engine.nodes.get(c)?.value ?? null,
    qtyUnitOf: (c) => {
      const l = lineByCode.get(c);
      return l ? displayUnit(l.unit) || l.unit : null;
    },
    durationOverrides: input.durationOverrides,
  });
  const placed = computed.placed.filter((t) => selected.has(t.stepId));
  const finance = await loadQuoteFinanceByTakeoff(
    input.orgId,
    study.id,
    input.quoteId ?? null,
  );

  const isDemo = study.mode === "DEMONSTRATION";
  const title =
    (input.title?.trim() ||
      (isDemo
        ? `${DEMO_WATERMARK} — Planning ${study.title}`
        : `Planning — ${study.title}`)).slice(0, 200);

  try {
    const plan = await prisma.$transaction(async (tx) => {
      const created = await tx.prepSchedulePlan.create({
        data: {
          organizationId: input.orgId,
          studyId: study.id,
          projectId: study.projectId,
          quoteId: input.quoteId ?? null,
          title,
          mode: isDemo ? "DEMONSTRATION" : "PROFESSIONAL",
          isDemonstration: isDemo,
          status: "INITIAL",
          revisionKind: "INITIAL",
          revisionNumber: 1,
          startDate: computed.startDate ? new Date(computed.startDate) : null,
          endDateBase: computed.baseEnd ? new Date(computed.baseEnd.date) : null,
          endDateWithConditional: computed.placed.length
            ? new Date(
                computed.placed.reduce((a, t) => (t.endDate > a ? t.endDate : a), computed.placed[0]!.endDate),
              )
            : null,
          baseDurationWorkingDays: computed.baseDurationWorkingDays,
          withConditionalWorkingDays: computed.withConditionalDurationWorkingDays,
          studyVersionAtGeneration: study.version,
          calendarJson: schedule.calendar as unknown as Prisma.InputJsonValue,
          summaryJson: {
            selectedStepIds: [...selected],
            warnings: computed.warnings,
          },
          note: schedule.note,
          watermark: isDemo ? DEMO_WATERMARK : null,
          idempotencyKey: key,
          createdById: input.userId,
        },
      });

      const idByStep = new Map<string, string>();
      for (const [i, t] of placed.entries()) {
        const fin = financeForTask(t.takeoffIds, finance);
        const row = await tx.prepScheduleTask.create({
          data: {
            organizationId: input.orgId,
            planId: created.id,
            stepCode: t.stepId,
            name: t.name,
            kind: t.kind,
            sortOrder: i,
            lot: t.lot,
            description: t.description,
            includeInBase: t.includeInBase,
            holdPoint: t.holdPoint,
            conditional: t.conditional,
            conditionalJson: t.conditionalConditions.length
              ? t.conditionalConditions
              : undefined,
            startDate: new Date(t.startDate),
            endDate: new Date(t.endDate),
            startHalf: t.start.half,
            endHalf: t.end.half,
            durationMode: input.durationOverrides?.[t.stepId] != null ? "manual" : t.duration.mode,
            durationDays: t.duration.durationDays,
            durationCalendar: t.duration.calendar,
            durationLockedByUser: input.durationOverrides?.[t.stepId] != null,
            computedDurationDays: t.duration.durationDays,
            driverTakeoffCode: t.duration.driverItem,
            quantitySnapshot: t.duration.quantity,
            quantityUnit: t.duration.quantityUnit,
            rateId: t.duration.rateId,
            rateValue: t.duration.rateValue,
            rateUnit: t.duration.rateUnit,
            ratePer: t.duration.ratePer,
            parallelUnits: t.duration.parallelUnits,
            takeoffCodesJson: t.takeoffIds,
            crewJson: t.crew,
            equipmentJson: t.equipment,
            suppliesJson: t.supplies,
            preconditionsJson: t.preconditions,
            controlsJson: t.controlsBeforeNext,
            constraintsJson: t.constraints,
            safetyJson: t.safety,
            proofsJson: t.proofs,
            dependsOnJson: t.dependsOn,
            blockingReason: t.blockingReason,
            sellHtSnapshot: fin.sellHt,
            costHtSnapshot: fin.costHt,
          },
        });
        idByStep.set(t.stepId, row.id);

        for (const code of t.takeoffIds) {
          const line = lineByCode.get(code);
          await tx.prepScheduleTakeoffLink.create({
            data: {
              organizationId: input.orgId,
              planId: created.id,
              taskId: row.id,
              studyLineCode: code,
              role: line?.role ?? null,
            },
          });
        }

        if (input.quoteId && fin.quoteLineIds.length) {
          for (const qLineId of fin.quoteLineIds) {
            const link = await tx.prepQuoteLink.findFirst({
              where: { quoteLineId: qLineId, organizationId: input.orgId },
              select: { studyLineCode: true },
            });
            const qLine = await tx.commercialQuoteLine.findFirst({
              where: { id: qLineId, organizationId: input.orgId },
              select: { lineSellHt: true, lineCostHt: true },
            });
            await tx.prepScheduleQuoteLink.create({
              data: {
                organizationId: input.orgId,
                planId: created.id,
                taskId: row.id,
                quoteId: input.quoteId,
                quoteLineId: qLineId,
                studyLineCode: link?.studyLineCode ?? null,
                sellHt: qLine ? d(qLine.lineSellHt) : null,
                costHt: qLine ? d(qLine.lineCostHt) : null,
              },
            });
          }
        }
      }

      for (const t of placed) {
        const succId = idByStep.get(t.stepId);
        if (!succId) continue;
        for (const dep of t.dependsOn) {
          const predId = idByStep.get(dep.stepId);
          if (!predId) continue;
          await tx.prepScheduleDependency.create({
            data: {
              organizationId: input.orgId,
              planId: created.id,
              predecessorId: predId,
              successorId: succId,
              type: dep.type,
              lagDays: dep.lagDays,
            },
          });
        }
      }

      await tx.prepScheduleEvent.create({
        data: {
          organizationId: input.orgId,
          planId: created.id,
          kind: "PLAN_CREATED",
          detailJson: {
            taskCount: placed.length,
            baseDurationWorkingDays: computed.baseDurationWorkingDays,
            quoteId: input.quoteId ?? null,
            isDemonstration: isDemo,
          },
          actorUserId: input.userId,
        },
      });

      await tx.prepStudyEvent.create({
        data: {
          studyId: study.id,
          organizationId: input.orgId,
          kind: "TRANSFER_TO_SCHEDULE",
          detailJson: {
            planId: created.id,
            taskCount: placed.length,
            isDemonstration: isDemo,
          },
          actorUserId: input.userId,
        },
      });

      return created;
    });

    return {
      action: "created",
      planId: plan.id,
      href: `/dashboard/visites-metres/etudes/${study.id}/planning/${plan.id}`,
      taskCount: placed.length,
      baseDurationWorkingDays: computed.baseDurationWorkingDays,
      isDemonstration: isDemo,
    };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const again = await prisma.prepSchedulePlan.findUnique({
        where: {
          organizationId_idempotencyKey: {
            organizationId: input.orgId,
            idempotencyKey: key,
          },
        },
      });
      if (again) {
        return {
          action: "idempotent",
          planId: again.id,
          href: `/dashboard/visites-metres/etudes/${input.studyId}/planning/${again.id}`,
          taskCount: tasks.length,
          baseDurationWorkingDays:
            again.baseDurationWorkingDays != null
              ? d(again.baseDurationWorkingDays)
              : null,
          isDemonstration: again.isDemonstration,
        };
      }
    }
    throw e;
  }
}

export async function getPrepSchedulePlanView(orgId: string, planId: string) {
  const plan = await prisma.prepSchedulePlan.findFirst({
    where: { id: planId, organizationId: orgId },
    include: {
      tasks: { orderBy: { sortOrder: "asc" }, include: { takeoffLinks: true, quoteLinks: true } },
      events: { orderBy: { createdAt: "desc" }, take: 30 },
      study: { select: { id: true, title: true } },
      project: { select: { id: true, title: true } },
      quote: { select: { id: true, number: true, subject: true, isDemonstration: true } },
    },
  });
  return plan;
}
