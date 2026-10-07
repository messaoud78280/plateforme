/**
 * Adapter pur : bework_schedule_ai_v1 → SchedulePlan V1.
 * Aucun Prisma / fetch / React / mutation.
 */
import { SCHEDULE_PLAN_SCHEMA_VERSION } from "./constants";
import type { AiScheduleBundleV1 } from "./ai-contract";
import type {
  ScheduleActivityV1,
  ScheduleCalendarV1,
  SchedulePlanV1,
  ScheduleResourcesV1,
  ScheduleSourceSnapshotV1,
} from "./schema";

export type AdaptAiScheduleInput = {
  bundle: AiScheduleBundleV1;
  sourceSnapshot: ScheduleSourceSnapshotV1;
  calendar?: ScheduleCalendarV1;
  resources?: ScheduleResourcesV1;
};

export type AdaptAiScheduleResult = {
  plan: SchedulePlanV1;
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
  input: AdaptAiScheduleInput,
): AdaptAiScheduleResult {
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
    schemaVersion: SCHEDULE_PLAN_SCHEMA_VERSION,
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
