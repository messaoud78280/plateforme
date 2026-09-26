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
import {
  computePlanIndicators,
  holdPointBlocksSuccessor,
  normalizeHoldPointStatus,
} from "@/lib/preparation/schedule/gantt-layout";

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
    const plan = await prisma.$transaction(
      async (tx) => {
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
                  computed.placed.reduce(
                    (a, t) => (t.endDate > a ? t.endDate : a),
                    computed.placed[0]!.endDate,
                  ),
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
        const takeoffRows: Prisma.PrepScheduleTakeoffLinkCreateManyInput[] = [];
        const quoteRows: Prisma.PrepScheduleQuoteLinkCreateManyInput[] = [];
        const depRows: Prisma.PrepScheduleDependencyCreateManyInput[] = [];

        // Précharge lignes devis une fois (évite N+1 dans la transaction).
        const allQuoteLineIds = [
          ...new Set(
            placed.flatMap((t) => financeForTask(t.takeoffIds, finance).quoteLineIds),
          ),
        ];
        const quoteLineById = new Map(
          allQuoteLineIds.length
            ? (
                await tx.commercialQuoteLine.findMany({
                  where: { id: { in: allQuoteLineIds }, organizationId: input.orgId },
                  select: { id: true, lineSellHt: true, lineCostHt: true },
                })
              ).map((l) => [l.id, l])
            : [],
        );
        const prepLinkByQuoteLine = new Map(
          allQuoteLineIds.length
            ? (
                await tx.prepQuoteLink.findMany({
                  where: {
                    quoteLineId: { in: allQuoteLineIds },
                    organizationId: input.orgId,
                  },
                  select: { quoteLineId: true, studyLineCode: true },
                })
              ).map((l) => [l.quoteLineId, l.studyLineCode])
            : [],
        );

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
              durationMode:
                input.durationOverrides?.[t.stepId] != null ? "manual" : t.duration.mode,
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
            takeoffRows.push({
              id: crypto.randomUUID().replace(/-/g, "").slice(0, 25),
              organizationId: input.orgId,
              planId: created.id,
              taskId: row.id,
              studyLineCode: code,
              role: line?.role ?? null,
            });
          }

          if (input.quoteId) {
            for (const qLineId of fin.quoteLineIds) {
              const qLine = quoteLineById.get(qLineId);
              quoteRows.push({
                id: crypto.randomUUID().replace(/-/g, "").slice(0, 25),
                organizationId: input.orgId,
                planId: created.id,
                taskId: row.id,
                quoteId: input.quoteId,
                quoteLineId: qLineId,
                studyLineCode: prepLinkByQuoteLine.get(qLineId) ?? null,
                sellHt: qLine ? d(qLine.lineSellHt) : null,
                costHt: qLine ? d(qLine.lineCostHt) : null,
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
            depRows.push({
              id: crypto.randomUUID().replace(/-/g, "").slice(0, 25),
              organizationId: input.orgId,
              planId: created.id,
              predecessorId: predId,
              successorId: succId,
              type: dep.type,
              lagDays: dep.lagDays,
            });
          }
        }

        if (takeoffRows.length) {
          await tx.prepScheduleTakeoffLink.createMany({ data: takeoffRows });
        }
        if (quoteRows.length) {
          await tx.prepScheduleQuoteLink.createMany({ data: quoteRows });
        }
        if (depRows.length) {
          await tx.prepScheduleDependency.createMany({ data: depRows });
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
      },
      { timeout: 60_000, maxWait: 15_000 },
    );

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
      tasks: {
        orderBy: { sortOrder: "asc" },
        include: { takeoffLinks: true, quoteLinks: true },
      },
      events: { orderBy: { createdAt: "desc" }, take: 30 },
      study: {
        select: {
          id: true,
          title: true,
          resourcesJson: true,
          scopeId: true,
          scope: { select: { id: true, name: true, code: true } },
        },
      },
      project: { select: { id: true, title: true } },
      quote: {
        select: {
          id: true,
          number: true,
          subject: true,
          isDemonstration: true,
          totalSellHt: true,
        },
      },
    },
  });
  return plan;
}

export type SchedulePlanViewPayload = {
  id: string;
  title: string;
  isDemonstration: boolean;
  watermark: string | null;
  status: string;
  revisionKind: string;
  startDate: string | null;
  endDateBase: string | null;
  endDateWithConditional: string | null;
  baseDurationWorkingDays: number | null;
  withConditionalWorkingDays: number | null;
  note: string | null;
  study: { id: string; title: string };
  project: { id: string; title: string };
  scope: { id: string; name: string; code: string } | null;
  quote: {
    id: string;
    number: string;
    subject: string;
    isDemonstration: boolean;
    totalSellHt: number;
  } | null;
  quoteOptions: SchedulePreviewQuoteOption[];
  /** Total HT rattaché sans double comptage (lignes devis uniques). */
  linkedSellHtTotal: number | null;
  linkedCostHtTotal: number | null;
  indicators: ReturnType<typeof computePlanIndicators>;
  dependencies: Array<{
    id: string;
    type: string;
    lagDays: number;
    predecessorStepCode: string;
    successorStepCode: string;
  }>;
  tasks: Array<{
    id: string;
    stepCode: string;
    name: string;
    kind: string;
    includeInBase: boolean;
    holdPoint: boolean;
    holdPointStatus: string | null;
    holdPointBlocksNext: boolean;
    conditional: boolean;
    conditionalConditions: string[];
    startDate: string | null;
    endDate: string | null;
    startHalf: number;
    endHalf: number;
    durationDays: number;
    durationCalendar: string;
    quantitySnapshot: number | null;
    quantityUnit: string | null;
    driverTakeoffCode: string | null;
    rateValue: number | null;
    rateUnit: string | null;
    ratePer: string | null;
    ratePerLabel: string | null;
    parallelUnits: number;
    crew: Array<{ labor_id: string; count: number; label: string }>;
    equipment: Array<{ equipment_id: string; count: number; label: string }>;
    supplies: Array<{ supply_id: string; count?: number; label: string }>;
    preconditions: string[];
    controls: string[];
    dependsOn: Array<{ stepId: string; type: string }>;
    blockingReason: string | null;
    sellHtSnapshot: number | null;
    costHtSnapshot: number | null;
    description: string | null;
  }>;
};

function asIsoDate(v: Date | string | null | undefined): string | null {
  if (!v) return null;
  if (typeof v === "string") return v.slice(0, 10);
  return v.toISOString().slice(0, 10);
}

function asStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string");
}

export async function buildPrepSchedulePlanPayload(
  orgId: string,
  planId: string,
): Promise<SchedulePlanViewPayload | null> {
  const plan = await getPrepSchedulePlanView(orgId, planId);
  if (!plan) return null;

  const deps = await prisma.prepScheduleDependency.findMany({
    where: { planId: plan.id, organizationId: orgId },
    include: {
      predecessor: { select: { stepCode: true } },
      successor: { select: { stepCode: true } },
    },
  });

  const resources = parsePrepResources(plan.study.resourcesJson);
  const laborById = new Map(resources.labor.map((l) => [l.id, l.role]));
  const eqById = new Map(resources.equipment.map((e) => [e.id, e.label]));
  const supplyById = new Map(resources.supplies.map((s) => [s.id, s.label]));

  const quoteOptions = await prisma.commercialQuote.findMany({
    where: {
      organizationId: orgId,
      OR: [{ sourcePrepStudyId: plan.studyId }, { projectId: plan.projectId }],
    },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: {
      id: true,
      number: true,
      subject: true,
      status: true,
      isDemonstration: true,
      totalSellHt: true,
    },
  });

  // Total HT sans double comptage : une ligne devis comptée une seule fois.
  const seenQuoteLines = new Set<string>();
  let linkedSell = 0;
  let linkedCost = 0;
  let hasLink = false;
  for (const t of plan.tasks) {
    for (const ql of t.quoteLinks) {
      if (seenQuoteLines.has(ql.quoteLineId)) continue;
      seenQuoteLines.add(ql.quoteLineId);
      hasLink = true;
      linkedSell += ql.sellHt != null ? d(ql.sellHt) : 0;
      linkedCost += ql.costHt != null ? d(ql.costHt) : 0;
    }
  }

  const tasksForIndicators = plan.tasks.map((t) => ({
    id: t.id,
    stepCode: t.stepCode,
    startDate: asIsoDate(t.startDate),
    endDate: asIsoDate(t.endDate),
    startHalf: t.startHalf,
    endHalf: t.endHalf,
    durationDays: d(t.durationDays),
    durationCalendar: t.durationCalendar,
    kind: t.kind,
    includeInBase: t.includeInBase,
    holdPoint: t.holdPoint,
    conditional: t.conditional,
  }));

  const startDate = asIsoDate(plan.startDate);
  const endDateBase = asIsoDate(plan.endDateBase);
  const indicators = computePlanIndicators({
    tasks: tasksForIndicators,
    startDate,
    endDateBase,
    baseDurationWorkingDays:
      plan.baseDurationWorkingDays != null ? d(plan.baseDurationWorkingDays) : null,
  });

  const tasks = plan.tasks.map((t) => {
    const holdStatus = normalizeHoldPointStatus(t.holdPointStatus, t.holdPoint);
    const crewRaw = Array.isArray(t.crewJson) ? t.crewJson : [];
    const eqRaw = Array.isArray(t.equipmentJson) ? t.equipmentJson : [];
    const suppliesRaw = Array.isArray(t.suppliesJson) ? t.suppliesJson : [];
    const dependsOn = Array.isArray(t.dependsOnJson)
      ? t.dependsOnJson
          .map((x) => {
            if (!x || typeof x !== "object") return null;
            const o = x as { stepId?: string; type?: string };
            if (!o.stepId) return null;
            return { stepId: o.stepId, type: o.type ?? "FS" };
          })
          .filter((x): x is { stepId: string; type: string } => !!x)
      : [];

    return {
      id: t.id,
      stepCode: t.stepCode,
      name: t.name,
      kind: t.kind,
      includeInBase: t.includeInBase,
      holdPoint: t.holdPoint,
      holdPointStatus: holdStatus,
      holdPointBlocksNext: holdPointBlocksSuccessor(t.holdPoint, holdStatus),
      conditional: t.conditional,
      conditionalConditions: asStringList(t.conditionalJson),
      startDate: asIsoDate(t.startDate),
      endDate: asIsoDate(t.endDate),
      startHalf: t.startHalf,
      endHalf: t.endHalf,
      durationDays: d(t.durationDays),
      durationCalendar: t.durationCalendar,
      quantitySnapshot: t.quantitySnapshot != null ? d(t.quantitySnapshot) : null,
      quantityUnit: t.quantityUnit,
      driverTakeoffCode: t.driverTakeoffCode,
      rateValue: t.rateValue != null ? d(t.rateValue) : null,
      rateUnit: t.rateUnit,
      ratePer: t.ratePer,
      ratePerLabel: t.ratePer
        ? RATE_PER_LABELS[t.ratePer as "engin" | "equipe"] ?? t.ratePer
        : null,
      parallelUnits: t.parallelUnits,
      crew: crewRaw
        .map((c) => {
          if (!c || typeof c !== "object") return null;
          const o = c as { labor_id?: string; count?: number };
          if (!o.labor_id) return null;
          return {
            labor_id: o.labor_id,
            count: o.count ?? 1,
            label: laborById.get(o.labor_id) ?? o.labor_id,
          };
        })
        .filter((x): x is { labor_id: string; count: number; label: string } => !!x),
      equipment: eqRaw
        .map((c) => {
          if (!c || typeof c !== "object") return null;
          const o = c as { equipment_id?: string; count?: number };
          if (!o.equipment_id) return null;
          return {
            equipment_id: o.equipment_id,
            count: o.count ?? 1,
            label: eqById.get(o.equipment_id) ?? o.equipment_id,
          };
        })
        .filter((x): x is { equipment_id: string; count: number; label: string } => !!x),
      supplies: suppliesRaw
        .map((c) => {
          if (!c || typeof c !== "object") return null;
          const o = c as { supply_id?: string; count?: number };
          if (!o.supply_id) return null;
          return {
            supply_id: o.supply_id,
            count: o.count,
            label: supplyById.get(o.supply_id) ?? o.supply_id,
          };
        })
        .filter(
          (x): x is { supply_id: string; count: number | undefined; label: string } =>
            x != null,
        ),
      preconditions: asStringList(t.preconditionsJson),
      controls: asStringList(t.controlsJson),
      dependsOn,
      blockingReason: t.blockingReason,
      sellHtSnapshot: t.sellHtSnapshot != null ? d(t.sellHtSnapshot) : null,
      costHtSnapshot: t.costHtSnapshot != null ? d(t.costHtSnapshot) : null,
      description: t.description,
    };
  });

  return {
    id: plan.id,
    title: plan.title,
    isDemonstration: plan.isDemonstration,
    watermark: plan.watermark,
    status: plan.status,
    revisionKind: plan.revisionKind,
    startDate,
    endDateBase,
    endDateWithConditional: asIsoDate(plan.endDateWithConditional),
    baseDurationWorkingDays:
      plan.baseDurationWorkingDays != null ? d(plan.baseDurationWorkingDays) : null,
    withConditionalWorkingDays:
      plan.withConditionalWorkingDays != null ? d(plan.withConditionalWorkingDays) : null,
    note: plan.note,
    study: { id: plan.study.id, title: plan.study.title },
    project: { id: plan.project.id, title: plan.project.title },
    scope: plan.study.scope
      ? {
          id: plan.study.scope.id,
          name: plan.study.scope.name,
          code: plan.study.scope.code,
        }
      : null,
    quote: plan.quote
      ? {
          id: plan.quote.id,
          number: plan.quote.number,
          subject: plan.quote.subject,
          isDemonstration: plan.quote.isDemonstration,
          totalSellHt: d(plan.quote.totalSellHt),
        }
      : null,
    quoteOptions: quoteOptions.map((q) => ({
      id: q.id,
      number: q.number,
      subject: q.subject,
      status: q.status,
      isDemonstration: q.isDemonstration,
      totalSellHt: d(q.totalSellHt),
    })),
    linkedSellHtTotal: hasLink ? Math.round(linkedSell * 100) / 100 : null,
    linkedCostHtTotal: hasLink ? Math.round(linkedCost * 100) / 100 : null,
    indicators,
    dependencies: deps.map((dep) => ({
      id: dep.id,
      type: dep.type,
      lagDays: d(dep.lagDays),
      predecessorStepCode: dep.predecessor.stepCode,
      successorStepCode: dep.successor.stepCode,
    })),
    tasks,
  };
}

/**
 * Lie (ou détache) un devis à un planning existant.
 * Recalcule les associations et snapshots HT — ne touche ni dates ni durées.
 */
export async function linkPrepScheduleQuote(input: {
  orgId: string;
  planId: string;
  quoteId: string | null;
  userId: string;
}): Promise<SchedulePlanViewPayload> {
  const plan = await prisma.prepSchedulePlan.findFirst({
    where: { id: input.planId, organizationId: input.orgId },
    include: {
      tasks: { select: { id: true, takeoffCodesJson: true } },
    },
  });
  if (!plan) throw new PrepError("Planning introuvable", 404);

  if (input.quoteId) {
    const quote = await prisma.commercialQuote.findFirst({
      where: {
        id: input.quoteId,
        organizationId: input.orgId,
        OR: [{ sourcePrepStudyId: plan.studyId }, { projectId: plan.projectId }],
      },
      select: { id: true },
    });
    if (!quote) {
      throw new PrepError(
        "Devis introuvable ou non rattaché à cette étude / ce projet",
        422,
      );
    }
  }

  const finance = await loadQuoteFinanceByTakeoff(
    input.orgId,
    plan.studyId,
    input.quoteId,
  );

  const allQuoteLineIds = [
    ...new Set(
      plan.tasks.flatMap((t) => {
        const takeoffIds = Array.isArray(t.takeoffCodesJson)
          ? t.takeoffCodesJson.filter((x): x is string => typeof x === "string")
          : [];
        return financeForTask(takeoffIds, finance).quoteLineIds;
      }),
    ),
  ];

  await prisma.$transaction(
    async (tx) => {
      await tx.prepScheduleQuoteLink.deleteMany({
        where: { planId: plan.id, organizationId: input.orgId },
      });

      const quoteLineById = new Map(
        allQuoteLineIds.length && input.quoteId
          ? (
              await tx.commercialQuoteLine.findMany({
                where: { id: { in: allQuoteLineIds }, organizationId: input.orgId },
                select: { id: true, lineSellHt: true, lineCostHt: true },
              })
            ).map((l) => [l.id, l] as const)
          : [],
      );
      const codeByLine = new Map(
        allQuoteLineIds.length && input.quoteId
          ? (
              await tx.prepQuoteLink.findMany({
                where: {
                  quoteLineId: { in: allQuoteLineIds },
                  organizationId: input.orgId,
                },
                select: { quoteLineId: true, studyLineCode: true },
              })
            ).map((l) => [l.quoteLineId, l.studyLineCode] as const)
          : [],
      );

      const quoteRows: Prisma.PrepScheduleQuoteLinkCreateManyInput[] = [];

      for (const t of plan.tasks) {
        const takeoffIds = Array.isArray(t.takeoffCodesJson)
          ? t.takeoffCodesJson.filter((x): x is string => typeof x === "string")
          : [];
        const fin = financeForTask(takeoffIds, finance);

        await tx.prepScheduleTask.update({
          where: { id: t.id },
          data: {
            sellHtSnapshot: fin.sellHt,
            costHtSnapshot: fin.costHt,
          },
        });

        if (input.quoteId) {
          for (const qLineId of fin.quoteLineIds) {
            const line = quoteLineById.get(qLineId);
            if (!line) continue;
            quoteRows.push({
              id: crypto.randomUUID().replace(/-/g, "").slice(0, 25),
              organizationId: input.orgId,
              planId: plan.id,
              taskId: t.id,
              quoteId: input.quoteId,
              quoteLineId: line.id,
              studyLineCode: codeByLine.get(line.id) ?? null,
              sellHt: d(line.lineSellHt),
              costHt: d(line.lineCostHt),
            });
          }
        }
      }

      if (quoteRows.length) {
        await tx.prepScheduleQuoteLink.createMany({ data: quoteRows });
      }

      await tx.prepSchedulePlan.update({
        where: { id: plan.id },
        data: { quoteId: input.quoteId },
      });

      await tx.prepScheduleEvent.create({
        data: {
          organizationId: input.orgId,
          planId: plan.id,
          kind: input.quoteId ? "QUOTE_LINKED" : "QUOTE_UNLINKED",
          detailJson: { quoteId: input.quoteId },
          actorUserId: input.userId,
        },
      });
    },
    { timeout: 45_000 },
  );

  const payload = await buildPrepSchedulePlanPayload(input.orgId, plan.id);
  if (!payload) throw new PrepError("Planning introuvable après liaison", 500);
  return payload;
}

export async function updatePrepScheduleHoldPoint(input: {
  orgId: string;
  planId: string;
  taskId: string;
  holdPointStatus: "A_CONTROLER" | "VALIDE" | "RESERVES";
  userId: string;
}): Promise<SchedulePlanViewPayload> {
  const task = await prisma.prepScheduleTask.findFirst({
    where: {
      id: input.taskId,
      planId: input.planId,
      organizationId: input.orgId,
    },
  });
  if (!task) throw new PrepError("Intervention introuvable", 404);
  if (!task.holdPoint) {
    throw new PrepError("Cette intervention n'est pas un point d'arrêt", 422);
  }

  await prisma.$transaction(async (tx) => {
    await tx.prepScheduleTask.update({
      where: { id: task.id },
      data: { holdPointStatus: input.holdPointStatus },
    });
    await tx.prepScheduleEvent.create({
      data: {
        organizationId: input.orgId,
        planId: input.planId,
        kind: "HOLD_POINT_STATUS",
        detailJson: {
          taskId: task.id,
          stepCode: task.stepCode,
          holdPointStatus: input.holdPointStatus,
        },
        actorUserId: input.userId,
      },
    });
  });

  const payload = await buildPrepSchedulePlanPayload(input.orgId, input.planId);
  if (!payload) throw new PrepError("Planning introuvable", 500);
  return payload;
}
