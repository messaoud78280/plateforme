/**
 * Tests pipeline Preview AI — contrats 1–12 + cycle.
 * node --import tsx src/lib/schedule-domain/preview-pipeline.test.ts
 *
 * Aucune écriture BDD.
 */
import assert from "node:assert/strict";
import { previewAiSchedule } from "./preview";
import { computeScheduleDraftHash } from "./draft-hash";
import { parseSchedulePlan } from "./schema";
import { fixturePlanTwoWorkFs } from "./fixtures";
import {
  detectScheduleDependencyCycle,
  buildDepsMapFromPredecessors,
} from "./cycle";
import { BEWORK_SCHEDULE_AI_FORMAT } from "./ai-contract";
import {
  validateSchedulePlanBusinessRules,
  type ScheduleSourceContext,
} from "./business-validator";

function baseContext(
  overrides?: Partial<ScheduleSourceContext>,
): ScheduleSourceContext {
  return {
    projectId: "proj_test",
    takeoffStudyId: "study_test",
    takeoffVersion: 1,
    takeoffFingerprint: "fp_A",
    lines: [
      {
        code: "GO-00-01",
        executable: true,
        role: "quote",
        quantity_for_planning: 10,
        validated_quantity: 10,
        declared_quantity: 10,
        computed_quantity: 10,
      },
      {
        code: "GO-00-02",
        executable: true,
        role: "quote",
        quantity_for_planning: 20,
        validated_quantity: 20,
        declared_quantity: 20,
        computed_quantity: 20,
      },
      {
        code: "SUR-01",
        executable: false,
        role: "indicator",
        quantity_for_planning: null,
        validated_quantity: null,
        declared_quantity: null,
        computed_quantity: null,
      },
    ],
    ...overrides,
  };
}

function aiBundle(activities: unknown[]) {
  return { format: BEWORK_SCHEDULE_AI_FORMAT, activities };
}

function run() {
  // Contrôle cycle standalone
  {
    const cycle = detectScheduleDependencyCycle(
      buildDepsMapFromPredecessors([
        { id: "P01", predecessors: [{ activityId: "P03" }] },
        { id: "P02", predecessors: [{ activityId: "P01" }] },
        { id: "P03", predecessors: [{ activityId: "P02" }] },
      ]),
    );
    assert.equal(cycle.hasCycle, true);
  }

  // TEST 1 — une activité
  {
    const r = previewAiSchedule({
      raw: aiBundle([
        {
          id: "P01",
          name: "Installation chantier",
          kind: "WORK",
          duration_days: 1,
          takeoff_codes: ["GO-00-01"],
          crew: null,
          after: [],
        },
      ]),
      sourceContext: baseContext(),
      calendar: {
        workingDays: [1, 2, 3, 4, 5],
        holidays: "FR_METROPOLE",
        granularityDays: 0.5,
        startDate: "2026-10-06",
      },
    });
    assert.equal(r.ok, true, JSON.stringify(r));
    if (r.ok) {
      assert.equal(r.stats.inputActivities, 1);
      assert.equal(r.stats.normalizedActivities, 1);
      assert.equal(r.stats.calculatedActivities, 1);
      assert.equal(r.stats.totalDurationDays, 1);
    }
  }

  // TEST 2 — deux activités FS → 3 j
  {
    const r = previewAiSchedule({
      raw: aiBundle([
        {
          id: "P01",
          name: "Installation chantier",
          kind: "WORK",
          duration_days: 1,
          takeoff_codes: ["GO-00-01"],
          after: [],
        },
        {
          id: "P02",
          name: "Fouilles",
          kind: "WORK",
          duration_days: 2,
          takeoff_codes: ["GO-00-02"],
          after: [{ id: "P01", type: "FS", lag_days: 0 }],
        },
      ]),
      sourceContext: baseContext(),
      calendar: {
        workingDays: [1, 2, 3, 4, 5],
        holidays: null,
        granularityDays: 0.5,
        startDate: "2026-10-06",
      },
    });
    assert.equal(r.ok, true, JSON.stringify(r));
    if (r.ok) {
      assert.equal(r.stats.totalDurationDays, 3);
      assert.equal(r.stats.inputActivities, 2);
      assert.equal(r.stats.calculatedActivities, 2);
    }
  }

  // TEST 3 — WAIT
  {
    const r = previewAiSchedule({
      raw: aiBundle([
        {
          id: "P01",
          name: "Béton",
          kind: "WORK",
          duration_days: 1,
          takeoff_codes: ["GO-00-01"],
          after: [],
        },
        {
          id: "P02",
          name: "Cure",
          kind: "WAIT",
          duration_days: 2,
          takeoff_codes: [],
          crew: null,
          after: [{ id: "P01", type: "FS", lag_days: 0 }],
        },
      ]),
      sourceContext: baseContext(),
      calendar: {
        workingDays: [1, 2, 3, 4, 5],
        holidays: null,
        granularityDays: 0.5,
        startDate: "2026-10-06",
      },
    });
    assert.equal(r.ok, true, JSON.stringify(r));
    if (r.ok) {
      assert.equal(r.stats.totalDurationDays, 3);
      assert.equal(r.stats.waitActivities, 1);
      const wait = r.plan.activities.find((a) => a.id === "P02")!;
      assert.equal(wait.resourceRequirements.crewId ?? null, null);
    }
  }

  // TEST 4 — indicator
  {
    const r = previewAiSchedule({
      raw: aiBundle([
        {
          id: "P01",
          name: "Surface",
          kind: "WORK",
          duration_days: 1,
          takeoff_codes: ["SUR-01"],
          after: [],
        },
      ]),
      sourceContext: baseContext(),
    });
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.ok(r.issues.some((i) => i.code === "TAKEOFF_LINE_NOT_EXECUTABLE"));
    }
  }

  // TEST 5 — ligne inexistante
  {
    const r = previewAiSchedule({
      raw: aiBundle([
        {
          id: "P01",
          name: "X",
          kind: "WORK",
          duration_days: 1,
          takeoff_codes: ["GO-99-99"],
          after: [],
        },
      ]),
      sourceContext: baseContext(),
    });
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.ok(r.issues.some((i) => i.code === "TAKEOFF_LINE_NOT_FOUND"));
    }
  }

  // TEST 6 — cycle indirect
  {
    const r = previewAiSchedule({
      raw: aiBundle([
        {
          id: "P01",
          name: "A",
          kind: "WORK",
          duration_days: 1,
          takeoff_codes: ["GO-00-01"],
          after: [{ id: "P03", type: "FS", lag_days: 0 }],
        },
        {
          id: "P02",
          name: "B",
          kind: "WORK",
          duration_days: 1,
          takeoff_codes: ["GO-00-02"],
          after: [{ id: "P01", type: "FS", lag_days: 0 }],
        },
        {
          id: "P03",
          name: "C",
          kind: "WORK",
          duration_days: 1,
          takeoff_codes: ["GO-00-01"],
          after: [{ id: "P02", type: "FS", lag_days: 0 }],
        },
      ]),
      sourceContext: baseContext(),
    });
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.ok(r.issues.some((i) => i.code === "DEPENDENCY_CYCLE"));
    }
  }

  // TEST 7 — SF
  {
    const r = previewAiSchedule({
      raw: aiBundle([
        {
          id: "P01",
          name: "A",
          kind: "WORK",
          duration_days: 1,
          takeoff_codes: ["GO-00-01"],
          after: [],
        },
        {
          id: "P02",
          name: "B",
          kind: "WORK",
          duration_days: 1,
          takeoff_codes: ["GO-00-02"],
          after: [{ id: "P01", type: "SF", lag_days: 0 }],
        },
      ]),
      sourceContext: baseContext(),
    });
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.ok(r.issues.some((i) => i.code === "RELATION_EXCLUDED_V1"));
    }
  }

  // TEST 8 — MILESTONE
  {
    const r = previewAiSchedule({
      raw: aiBundle([
        {
          id: "P01",
          name: "Jalon",
          kind: "MILESTONE",
          duration_days: 0,
          takeoff_codes: [],
          after: [],
        },
      ]),
      sourceContext: baseContext(),
    });
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.ok(r.issues.some((i) => i.code === "KIND_EXCLUDED_V1"));
    }
  }

  // TEST 9 — WAIT avec crew
  {
    const r = previewAiSchedule({
      raw: aiBundle([
        {
          id: "P01",
          name: "Cure",
          kind: "WAIT",
          duration_days: 2,
          takeoff_codes: [],
          crew: { id: "TERR-A", size: 2 },
          after: [],
        },
      ]),
      sourceContext: baseContext(),
    });
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.ok(
        r.issues.some(
          (i) => i.code === "WAIT_WITH_CREW" || i.code === "WAIT_WITH_RESOURCES",
        ),
      );
    }
  }

  // TEST 10 — 22 dont une mauvaise → FAIL, pas 21 acceptées
  {
    const activities = Array.from({ length: 22 }, (_, i) => ({
      id: `P${String(i + 1).padStart(2, "0")}`,
      name: `Tâche ${i + 1}`,
      kind: "WORK",
      duration_days: 1,
      takeoff_codes: i === 10 ? ["GO-99-99"] : ["GO-00-01"],
      after:
        i === 0
          ? []
          : [{ id: `P${String(i).padStart(2, "0")}`, type: "FS", lag_days: 0 }],
    }));
    const r = previewAiSchedule({
      raw: aiBundle(activities),
      sourceContext: baseContext(),
    });
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.ok(r.issues.some((i) => i.code === "TAKEOFF_LINE_NOT_FOUND"));
      assert.ok(
        (r.stats?.validatedActivities ?? 0) === 0 ||
          r.stats?.validatedActivities === undefined,
      );
    }
  }

  // TEST 11 — hash déterministe (ordre clés)
  {
    const planA = parseSchedulePlan(fixturePlanTwoWorkFs());
    assert.equal(planA.ok, true);
    if (planA.ok) {
      const h1 = computeScheduleDraftHash(planA.plan);
      // Reconstruire avec clés dans un autre ordre littéral
      const shuffled = JSON.parse(
        JSON.stringify({
          activities: planA.plan.activities,
          resources: planA.plan.resources,
          calendar: planA.plan.calendar,
          sourceSnapshot: planA.plan.sourceSnapshot,
          schemaVersion: planA.plan.schemaVersion,
        }),
      );
      const planB = parseSchedulePlan(shuffled);
      assert.equal(planB.ok, true);
      if (planB.ok) {
        const h2 = computeScheduleDraftHash(planB.plan);
        assert.equal(h1, h2);
      }
    }
  }

  // TEST 12 — source fingerprint différent (plan A vs context B)
  {
    const built = previewAiSchedule({
      raw: aiBundle([
        {
          id: "P01",
          name: "Installation",
          kind: "WORK",
          duration_days: 1,
          takeoff_codes: ["GO-00-01"],
          after: [],
        },
      ]),
      sourceContext: baseContext({ takeoffFingerprint: "fp_A" }),
    });
    assert.equal(built.ok, true);
    if (built.ok) {
      const stale = validateSchedulePlanBusinessRules(
        built.plan,
        baseContext({ takeoffFingerprint: "fp_B" }),
      );
      assert.equal(stale.ok, false);
      assert.ok(
        stale.issues.some(
          (i) => i.code === "SOURCE_STALE" || i.code === "SOURCE_MISMATCH",
        ),
      );
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        suite: "preview-pipeline.test.ts",
        tests: "1-12 + cycle",
        dbWrites: 0,
      },
      null,
      2,
    ),
  );
}

run();
