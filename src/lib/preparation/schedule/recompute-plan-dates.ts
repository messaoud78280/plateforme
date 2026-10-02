/**
 * Recalcule dates / halves / baseDuration d'un plan persisté après édition structurelle.
 * Réutilise computeSchedule (deps + resource leveling + calendrier + execution_phases).
 */
import type { Prisma } from "@prisma/client";
import { d } from "@/lib/commercial/decimal";
import { computeSchedule } from "@/lib/preparation/schedule/compute";
import { parseCrewJson } from "@/lib/preparation/schedule/crew";
import { normalizeDependsOnJson } from "@/lib/bework-patch/operation-contracts";
import { parsePrepWorkflow } from "@/lib/preparation/schedule/parse";
import type {
  PrepScheduleDTO,
  PrepWorkflowStepDTO,
} from "@/lib/preparation/schedule/types";

function asIso(v: Date | string | null | undefined): string | null {
  if (!v) return null;
  if (typeof v === "string") return v.slice(0, 10);
  return v.toISOString().slice(0, 10);
}

type TaskRow = {
  id: string;
  stepCode: string;
  name: string;
  kind: string;
  sortOrder: number;
  lot: string | null;
  description: string | null;
  includeInBase: boolean;
  holdPoint: boolean;
  conditional: boolean;
  durationDays: unknown;
  durationCalendar: string;
  durationLockedByUser: boolean;
  durationMode: string;
  startHalf: number;
  endHalf: number;
  crewJson: unknown;
  takeoffCodesJson: unknown;
  dependsOnJson: unknown;
  parallelUnits: number;
};

export async function recomputePersistedPlanDatesInTx(
  tx: Prisma.TransactionClient,
  input: {
    orgId: string;
    planId: string;
    /** Durées déjà écrites en DB (ou overrides id/stepCode → days). */
    durationOverrides?: Map<string, number>;
  },
): Promise<{
  baseDurationWorkingDays: number | null;
  endDateBase: string | null;
  tasksUpdated: number;
}> {
  const plan = await tx.prepSchedulePlan.findFirst({
    where: { id: input.planId, organizationId: input.orgId },
    select: {
      id: true,
      studyId: true,
      startDate: true,
      tasks: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          stepCode: true,
          name: true,
          kind: true,
          sortOrder: true,
          lot: true,
          description: true,
          includeInBase: true,
          holdPoint: true,
          conditional: true,
          durationDays: true,
          durationCalendar: true,
          durationLockedByUser: true,
          durationMode: true,
          startHalf: true,
          endHalf: true,
          crewJson: true,
          takeoffCodesJson: true,
          dependsOnJson: true,
          parallelUnits: true,
        },
      },
    },
  });
  if (!plan || !plan.tasks.length) {
    return { baseDurationWorkingDays: null, endDateBase: null, tasksUpdated: 0 };
  }

  const study = await tx.prepStudy.findFirst({
    where: { id: plan.studyId, organizationId: input.orgId },
    select: { scheduleJson: true, workflowJson: true },
  });

  const scheduleRaw =
    study?.scheduleJson &&
    typeof study.scheduleJson === "object" &&
    !Array.isArray(study.scheduleJson)
      ? (study.scheduleJson as {
          calendar?: PrepScheduleDTO["calendar"];
          start_date?: string | null;
        })
      : null;

  const workflowParsed = parsePrepWorkflow(study?.workflowJson ?? null);
  const phaseByStep = new Map(
    workflowParsed.steps.map((s) => [s.id, s.execution_phase_id ?? null]),
  );
  const executionPhases = workflowParsed.execution_phases;

  const calendar: PrepScheduleDTO["calendar"] = scheduleRaw?.calendar ?? {
    working_days: [1, 2, 3, 4, 5],
    holidays: "FR_METROPOLE",
    granularity_days: 0.5,
  };

  const startIso =
    asIso(plan.startDate) ??
    (typeof scheduleRaw?.start_date === "string" ? scheduleRaw.start_date : null);

  const workflowSteps: PrepWorkflowStepDTO[] = plan.tasks.map((t: TaskRow) => {
    const crew = parseCrewJson(t.crewJson);
    const override =
      input.durationOverrides?.get(t.id) ??
      input.durationOverrides?.get(t.stepCode);
    const days = override != null ? override : d(t.durationDays);
    const takeoffIds = Array.isArray(t.takeoffCodesJson)
      ? t.takeoffCodesJson.filter((x): x is string => typeof x === "string")
      : [];
    return {
      id: t.stepCode,
      order: t.sortOrder,
      name: t.name,
      lot: t.lot,
      kind: (t.kind === "control" || t.kind === "wait" ? t.kind : "work") as
        | "work"
        | "control"
        | "wait",
      description: t.description,
      execution_phase_id: phaseByStep.get(t.stepCode) ?? null,
      takeoff_ids: takeoffIds,
      duration: {
        mode: "fixed",
        days,
        calendar: t.durationCalendar === "calendar" ? "calendar" : "working",
      },
      crew: crew.members.map((m) => ({ labor_id: m.labor_id, count: m.count })),
      crew_id: crew.crewId,
      crew_size: crew.crewSize,
      workload_person_days: crew.workloadPersonDays,
      parallelizable: crew.parallelizable,
      equipment: [],
      supplies: [],
      preconditions: [],
      controls_before_next: [],
      constraints: [],
      safety: [],
      proofs: [],
      hold_point: t.holdPoint,
      conditional: t.conditional ? { conditions: [] } : null,
    };
  });

  const scheduleTasks = plan.tasks.map((t: TaskRow) => {
    const crew = parseCrewJson(t.crewJson);
    const depends_on = normalizeDependsOnJson(t.dependsOnJson);
    return {
      step_id: t.stepCode,
      depends_on,
      include_in_base: t.includeInBase,
      crew_id: crew.crewId,
      parallelizable: crew.parallelizable,
    };
  });

  const computed = computeSchedule({
    workflowSteps,
    schedule: {
      start_date: startIso,
      calendar,
      tasks: scheduleTasks,
    },
    resources: { labor: [], equipment: [], supplies: [], rates: [] },
    qtyOf: () => null,
    executionPhases: executionPhases.length ? executionPhases : null,
  });

  if (computed.errors.length) {
    throw Object.assign(new Error(computed.errors[0]!), {
      code: "SCHEDULE_RECOMPUTE_FAILED",
    });
  }

  const byStep = new Map(computed.placed.map((p) => [p.stepId, p]));
  let tasksUpdated = 0;
  for (const t of plan.tasks) {
    const placed = byStep.get(t.stepCode);
    if (!placed) continue;
    const data: Prisma.PrepScheduleTaskUpdateInput = {
      startDate: placed.startDate ? new Date(placed.startDate) : null,
      endDate: placed.endDate ? new Date(placed.endDate) : null,
      startHalf: placed.start.half,
      endHalf: placed.end.half,
    };
    // Ne pas écraser une durée verrouillée manuellement (override déjà injecté en entrée).
    if (!t.durationLockedByUser) {
      data.durationDays = placed.duration.durationDays;
      data.computedDurationDays = placed.duration.durationDays;
    }
    await tx.prepScheduleTask.update({
      where: { id: t.id },
      data,
    });
    tasksUpdated += 1;
  }

  const endDateBase = computed.baseEnd ? computed.baseEnd.date : null;
  await tx.prepSchedulePlan.update({
    where: { id: plan.id },
    data: {
      endDateBase: endDateBase ? new Date(`${endDateBase}T12:00:00.000Z`) : null,
      baseDurationWorkingDays: computed.baseDurationWorkingDays,
      withConditionalWorkingDays: computed.withConditionalDurationWorkingDays,
    },
  });

  return {
    baseDurationWorkingDays: computed.baseDurationWorkingDays,
    endDateBase,
    tasksUpdated,
  };
}
