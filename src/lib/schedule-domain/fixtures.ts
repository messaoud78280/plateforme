import type { SchedulePlanV1 } from "./schema";
import { SCHEDULE_PLAN_SCHEMA_VERSION } from "./constants";

/** Plan minimal valide — 1 activité FIXED. */
export function fixturePlanSingleActivity(
  overrides?: Partial<SchedulePlanV1>,
): SchedulePlanV1 {
  return {
    schemaVersion: SCHEDULE_PLAN_SCHEMA_VERSION,
    sourceSnapshot: {
      projectId: "proj_test",
      takeoffStudyId: "study_test",
      takeoffVersion: 1,
      takeoffFingerprint: "fp_test",
      quoteId: null,
      quoteVersion: null,
    },
    calendar: {
      workingDays: [1, 2, 3, 4, 5],
      holidays: "FR_METROPOLE",
      granularityDays: 0.5,
      startDate: "2026-10-06",
    },
    resources: { labor: [], equipment: [], rates: [] },
    activities: [
      {
        id: "P01",
        name: "Installation chantier",
        kind: "WORK",
        sourceLinks: [{ type: "TAKEOFF_LINE", code: "GO-00-01" }],
        duration: { mode: "FIXED", days: 1, calendar: "working" },
        resourceRequirements: { labor: [], equipment: [] },
        predecessors: [],
        notes: null,
      },
    ],
    ...overrides,
  };
}

/** Installation 1 j → Terrassement 2 j (FS). */
export function fixturePlanTwoWorkFs(): SchedulePlanV1 {
  const base = fixturePlanSingleActivity();
  return {
    ...base,
    activities: [
      {
        id: "P01",
        name: "Installation chantier",
        kind: "WORK",
        sourceLinks: [{ type: "TAKEOFF_LINE", code: "GO-00-01" }],
        duration: { mode: "FIXED", days: 1, calendar: "working" },
        resourceRequirements: {
          crewId: "TERR-A",
          crewSize: 2,
          labor: [],
          equipment: [],
        },
        predecessors: [],
        notes: null,
      },
      {
        id: "P02",
        name: "Terrassement",
        kind: "WORK",
        sourceLinks: [{ type: "TAKEOFF_LINE", code: "GO-00-02" }],
        duration: { mode: "FIXED", days: 2, calendar: "working" },
        resourceRequirements: {
          crewId: "TERR-A",
          crewSize: 2,
          labor: [],
          equipment: [],
        },
        predecessors: [{ activityId: "P01", relation: "FS", lagDays: 0 }],
        notes: null,
      },
    ],
  };
}

/** WORK + WAIT 2 j calendaires. */
export function fixturePlanWithWait(): SchedulePlanV1 {
  const base = fixturePlanTwoWorkFs();
  return {
    ...base,
    activities: [
      ...base.activities,
      {
        id: "P03",
        name: "Attente / cure",
        kind: "WAIT",
        sourceLinks: [],
        duration: { mode: "FIXED", days: 2, calendar: "calendar" },
        resourceRequirements: { labor: [], equipment: [] },
        predecessors: [{ activityId: "P02", relation: "FS", lagDays: 0 }],
        notes: null,
      },
    ],
  };
}
