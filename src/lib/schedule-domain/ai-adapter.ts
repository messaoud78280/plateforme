/**
 * Adapter pur : bework_schedule_ai_v1/v2 → SchedulePlan V1/V2.
 * Aucun Prisma / fetch / React / mutation.
 */
import {
  SCHEDULE_PLAN_SCHEMA_VERSION,
  SCHEDULE_PLAN_SCHEMA_VERSION_V1,
} from "./constants";
import {
  BEWORK_SCHEDULE_AI_FORMAT_V2,
  type AiScheduleBundle,
  type AiScheduleBundleV1,
  type AiScheduleBundleV2,
} from "./ai-contract";
import type {
  ScheduleActivityV1,
  ScheduleActivityV2,
  ScheduleCalendarV1,
  SchedulePlan,
  SchedulePlanV1,
  SchedulePlanV2,
  ScheduleResourcesV1,
  ScheduleSourceSnapshotV1,
} from "./schema";

export type AdaptAiScheduleInput = {
  bundle: AiScheduleBundle;
  sourceSnapshot: ScheduleSourceSnapshotV1;
  calendar?: ScheduleCalendarV1;
  resources?: ScheduleResourcesV1;
};

export type AdaptAiScheduleResult = {
  plan: SchedulePlan;
  inputActivityCount: number;
  normalizedActivityCount: number;
};

const DEFAULT_CALENDAR: ScheduleCalendarV1 = {
  workingDays: [1, 2, 3, 4, 5],
  holidays: "FR_METROPOLE",
  granularityDays: 0.5,
  startDate: null,
};

/**
 * Mapping déterministe IA → domaine.
 * 1 activité input = 1 activité normalisée (jamais de drop).
 */
export function adaptAiScheduleV1ToSchedulePlan(
  input: AdaptAiScheduleInput & { bundle: AiScheduleBundleV1 },
): AdaptAiScheduleResult & { plan: SchedulePlanV1 } {
  const { bundle, sourceSnapshot } = input;
  const inputActivityCount = bundle.activities.length;

  const activities: ScheduleActivityV1[] = bundle.activities.map((a) => {
    const sourceLinks = (a.takeoff_codes ?? []).map((code) => ({
      type: "TAKEOFF_LINE" as const,
      code,
    }));

    const resourceRequirements: ScheduleActivityV1["resourceRequirements"] = {
      crewId: a.crew?.id ?? null,
      crewSize: a.crew?.size ?? null,
      labor: [],
      equipment: [],
    };

    return {
      id: a.id,
      name: a.name,
      kind: a.kind,
      sourceLinks,
      duration: {
        mode: "FIXED" as const,
        days: a.duration_days,
        calendar: a.kind === "WAIT" ? ("calendar" as const) : ("working" as const),
      },
      resourceRequirements,
      predecessors: (a.after ?? []).map((dep) => ({
        activityId: dep.id,
        relation: dep.type,
        lagDays: dep.lag_days ?? 0,
      })),
      notes: a.notes ?? null,
    };
  });

  const plan: SchedulePlanV1 = {
    schemaVersion: SCHEDULE_PLAN_SCHEMA_VERSION_V1,
    sourceSnapshot,
    calendar: input.calendar ?? DEFAULT_CALENDAR,
    resources: input.resources ?? { labor: [], equipment: [], rates: [] },
    activities,
  };

  return {
    plan,
    inputActivityCount,
    normalizedActivityCount: plan.activities.length,
  };
}

function adaptV2(
  input: AdaptAiScheduleInput & { bundle: AiScheduleBundleV2 },
): AdaptAiScheduleResult & { plan: SchedulePlanV2 } {
  const { bundle, sourceSnapshot } = input;
  const activities: ScheduleActivityV2[] = bundle.activities.map((a) => ({
    id: a.id,
    name: a.name,
    kind: a.kind,
    sourceLinks: (a.takeoff_codes ?? []).map((code) => ({
      type: "TAKEOFF_LINE" as const,
      code,
    })),
    duration: {
      mode: "FIXED" as const,
      days: a.duration_days,
      calendar: a.kind === "WAIT" ? ("calendar" as const) : ("working" as const),
    },
    resourceRequirements: {
      crewId: a.crew?.id ?? null,
      crewSize: a.crew?.size ?? null,
      labor: (a.crew?.members ?? []).map((member) => ({
        laborId: member.labor_id,
        count: member.count,
      })),
      equipment: a.equipment.map((item) => ({
        equipmentId: item.id,
        count: item.count,
      })),
    },
    predecessors: a.after.map((dep) => ({
      activityId: dep.id,
      relation: dep.type,
      lagDays: dep.lag_days ?? 0,
    })),
    notes: a.notes ?? null,
    lot: a.lot ?? null,
    phase: a.phase ?? null,
    crewMembers: (a.crew?.members ?? []).map((member) => ({
      laborId: member.labor_id,
      role: member.role,
      count: member.count,
    })),
    equipment: a.equipment,
    supplies: a.supplies,
    preconditions: a.preconditions,
    controls: a.controls,
    constraints: a.constraints,
    safety: a.safety,
    proofs: a.proofs,
    technicalReferences: a.technical_references.map((ref) => ({
      code: ref.code,
      label: ref.label ?? null,
      applicability: ref.applicability,
      sourceUrl: ref.source_url ?? null,
      note: ref.note ?? null,
    })),
    assumptions: a.assumptions,
    durationBasis: a.duration_basis
      ? {
          provenance: a.duration_basis.provenance,
          minDays: a.duration_basis.min_days ?? null,
          maxDays: a.duration_basis.max_days ?? null,
          rationale: a.duration_basis.rationale ?? null,
          toValidate: a.duration_basis.to_validate,
        }
      : null,
    holdPoint: a.hold_point,
  }));

  const laborById = new Map(
    (input.resources?.labor ?? []).map((item) => [item.id, item]),
  );
  const equipmentById = new Map(
    (input.resources?.equipment ?? []).map((item) => [item.id, item]),
  );
  for (const activity of bundle.activities) {
    for (const member of activity.crew?.members ?? []) {
      laborById.set(member.labor_id, {
        id: member.labor_id,
        role: member.role,
        note: null,
      });
    }
    for (const item of activity.equipment) {
      equipmentById.set(item.id, {
        id: item.id,
        category: "chantier",
        label: item.label,
        note: item.note ?? null,
      });
    }
  }

  const plan: SchedulePlanV2 = {
    schemaVersion: SCHEDULE_PLAN_SCHEMA_VERSION,
    sourceSnapshot,
    calendar: input.calendar ?? DEFAULT_CALENDAR,
    resources: {
      labor: [...laborById.values()],
      equipment: [...equipmentById.values()],
      rates: input.resources?.rates ?? [],
    },
    activities,
  };
  return {
    plan,
    inputActivityCount: bundle.activities.length,
    normalizedActivityCount: activities.length,
  };
}

export function adaptAiScheduleToSchedulePlan(
  input: AdaptAiScheduleInput,
): AdaptAiScheduleResult {
  return input.bundle.format === BEWORK_SCHEDULE_AI_FORMAT_V2
    ? adaptV2({ ...input, bundle: input.bundle })
    : adaptAiScheduleV1ToSchedulePlan({ ...input, bundle: input.bundle });
}
