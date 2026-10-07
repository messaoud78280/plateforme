/**
 * Tests domaine SchedulePlan V1 (Zod).
 * node --import tsx src/lib/schedule-domain/schema.test.ts
 */
import assert from "node:assert/strict";
import {
  parseSchedulePlan,
  SchedulePlanV1Schema,
  getSchedulePlanV1JsonSchema,
  getSchedulePlanV1AiContractMeta,
  toDomainSnapshotJson,
  SCHEDULE_PLAN_SCHEMA_VERSION,
  SCHEDULE_PLAN_SCHEMA_VERSION_V1,
  isSupportedSchedulePlanSchemaVersion,
  fixturePlanSingleActivity,
  fixturePlanTwoWorkFs,
  fixturePlanWithWait,
} from "./index";

function run() {
  // --- A : 1 activité valide ---
  {
    const r = parseSchedulePlan(fixturePlanSingleActivity());
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.plan.schemaVersion, 1);
      assert.equal(r.plan.activities.length, 1);
      assert.equal(r.plan.activities[0]!.id, "P01");
      assert.equal(r.plan.activities[0]!.duration.mode, "FIXED");
    }
  }

  // --- B : 2 WORK + FS ---
  {
    const r = parseSchedulePlan(fixturePlanTwoWorkFs());
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.plan.activities.length, 2);
      assert.equal(r.plan.activities[1]!.predecessors[0]!.relation, "FS");
    }
  }

  // --- C : WAIT sans ressource ---
  {
    const r = parseSchedulePlan(fixturePlanWithWait());
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.plan.activities.some((a) => a.kind === "WAIT"), true);
    }
  }

  // --- WAIT avec ressource → ERROR ---
  {
    const bad = fixturePlanWithWait();
    bad.activities[2]!.resourceRequirements = {
      crewId: "X",
      labor: [],
      equipment: [],
    };
    const r = parseSchedulePlan(bad);
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.ok(r.issues.some((i) => i.code === "WAIT_WITH_RESOURCES"));
    }
  }

  // --- SF exclu → ERROR explicite ---
  {
    const bad = fixturePlanTwoWorkFs();
    (bad.activities[1]!.predecessors[0] as { relation: string }).relation = "SF";
    const r = parseSchedulePlan(bad);
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.ok(r.issues.some((i) => i.code === "RELATION_EXCLUDED_V1"));
      assert.ok(r.issues.some((i) => i.message.includes("SF")));
    }
  }

  // --- MILESTONE exclu → ERROR explicite ---
  {
    const bad = fixturePlanSingleActivity();
    (bad.activities[0] as { kind: string }).kind = "MILESTONE";
    const r = parseSchedulePlan(bad);
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.ok(r.issues.some((i) => i.code === "KIND_EXCLUDED_V1"));
      assert.ok(r.issues.some((i) => i.message.includes("MILESTONE")));
    }
  }

  // --- ID dupliqué ---
  {
    const bad = fixturePlanTwoWorkFs();
    bad.activities[1]!.id = "P01";
    const r = parseSchedulePlan(bad);
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.ok(r.issues.some((i) => i.code === "DUPLICATE_ACTIVITY_ID"));
    }
  }

  // --- Auto-dépendance ---
  {
    const bad = fixturePlanSingleActivity();
    bad.activities[0]!.predecessors = [
      { activityId: "P01", relation: "FS", lagDays: 0 },
    ];
    const r = parseSchedulePlan(bad);
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.ok(r.issues.some((i) => i.code === "SELF_DEPENDENCY"));
    }
  }

  // --- Prédécesseur inconnu ---
  {
    const bad = fixturePlanSingleActivity();
    bad.activities[0]!.predecessors = [
      { activityId: "PX", relation: "FS", lagDays: 0 },
    ];
    const r = parseSchedulePlan(bad);
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.ok(r.issues.some((i) => i.code === "UNKNOWN_PREDECESSOR"));
    }
  }

  // --- Durée négative ---
  {
    const bad = fixturePlanSingleActivity();
    bad.activities[0]!.duration = { mode: "FIXED", days: -1, calendar: "working" };
    const r = parseSchedulePlan(bad);
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.ok(r.issues.length > 0);
      assert.ok(r.issues.every((i) => i.severity === "ERROR"));
    }
  }

  // --- PRODUCTIVITY valide ---
  {
    const plan = fixturePlanSingleActivity();
    plan.activities[0]!.duration = {
      mode: "PRODUCTIVITY",
      sourceCode: "GO-00-01",
      rate: 25,
      rateUnit: "m³/j",
      parallelUnits: 1,
      rounding: "ceil_half_day",
    };
    plan.resources.rates = [
      {
        id: "R1",
        label: "Terrassement",
        value: 25,
        unit: "m³/j",
        per: "equipe",
        provenance: "PLANNING_ASSUMPTION",
      },
    ];
    const r = parseSchedulePlan(plan);
    assert.equal(r.ok, true);
  }

  // --- schemaVersion inconnue ---
  {
    const r = parseSchedulePlan({
      ...fixturePlanSingleActivity(),
      schemaVersion: 99,
    });
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.ok(r.issues.some((i) => i.code === "UNSUPPORTED_SCHEMA_VERSION"));
    }
  }

  // --- activities vide ---
  {
    const r = parseSchedulePlan({
      ...fixturePlanSingleActivity(),
      activities: [],
    });
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.ok(r.issues.some((i) => i.code === "EMPTY_ACTIVITIES"));
    }
  }

  // --- Aucun drop silencieux : objet partiel → ERROR ---
  {
    const r = parseSchedulePlan({
      schemaVersion: 1,
      sourceSnapshot: {
        projectId: "p",
        takeoffStudyId: "s",
        takeoffVersion: 1,
        takeoffFingerprint: "fp",
      },
      activities: [{ id: "P01", name: "X" }],
    });
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.ok(r.issues.length > 0);
      // L'activité n'est pas « disparue » : elle produit une erreur duration
      assert.ok(
        r.issues.some(
          (i) =>
            i.path.includes("activities") ||
            i.message.toLowerCase().includes("duration"),
        ),
      );
    }
  }

  // --- Snapshot canonique conserve schemaVersion + blocs ---
  {
    const plan = parseSchedulePlan(fixturePlanTwoWorkFs());
    assert.equal(plan.ok, true);
    if (plan.ok) {
      const snap = toDomainSnapshotJson(plan.plan);
      assert.equal(snap.schemaVersion, SCHEDULE_PLAN_SCHEMA_VERSION_V1);
      assert.ok(snap.sourceSnapshot);
      assert.ok(snap.calendar);
      assert.ok(snap.resources);
      assert.equal(snap.activities.length, 2);
    }
  }

  // --- JSON Schema exportable (IA) dérivé de Zod ---
  {
    const js = getSchedulePlanV1JsonSchema();
    assert.ok(js && typeof js === "object");
    const meta = getSchedulePlanV1AiContractMeta();
    assert.equal(meta.schema_version, 1);
    assert.deepEqual(meta.exclusions_v1.relations, ["SF"]);
    assert.deepEqual(meta.exclusions_v1.kinds, ["MILESTONE"]);
    assert.ok(isSupportedSchedulePlanSchemaVersion(1));
    assert.ok(isSupportedSchedulePlanSchemaVersion(SCHEDULE_PLAN_SCHEMA_VERSION));
  }

  // --- safeParse Zod direct ---
  {
    const ok = SchedulePlanV1Schema.safeParse(fixturePlanSingleActivity());
    assert.equal(ok.success, true);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        suite: "schedule-domain/schema.test.ts",
        schemaVersion: SCHEDULE_PLAN_SCHEMA_VERSION,
      },
      null,
      2,
    ),
  );
}

run();
