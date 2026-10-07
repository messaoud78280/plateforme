/**
 * Tests mapping purs (sans BDD).
 * node --import tsx src/lib/schedule-domain/repository/mapping.test.ts
 */
import assert from "node:assert/strict";
import { BEWORK_SCHEDULE_AI_FORMAT } from "../ai-contract";
import { previewAiSchedule } from "../preview";
import {
  domainSnapshotForPersist,
  expectedDependencyCount,
  expectedTakeoffLinkCount,
  mapActivityKindToPrisma,
  mapDurationModeToPrisma,
  mapPlanTasksForPersistence,
} from "./mapping";

function run() {
  assert.equal(mapActivityKindToPrisma("WORK"), "work");
  assert.equal(mapActivityKindToPrisma("CONTROL"), "control");
  assert.equal(mapActivityKindToPrisma("WAIT"), "wait");
  assert.equal(mapDurationModeToPrisma("FIXED"), "fixed");
  assert.equal(mapDurationModeToPrisma("PRODUCTIVITY"), "computed");

  const lines = [
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
  ];

  const preview = previewAiSchedule({
    raw: {
      format: BEWORK_SCHEDULE_AI_FORMAT,
      activities: [
        {
          id: "P01",
          name: "Installation",
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
      ],
    },
    sourceContext: {
      projectId: "p",
      takeoffStudyId: "s",
      takeoffVersion: 1,
      takeoffFingerprint: "fp",
      lines,
    },
  });
  assert.equal(preview.ok, true);
  if (!preview.ok) throw new Error("preview");

  const qty = new Map(lines.map((l) => [l.code, l.quantity_for_planning] as const));
  const rows = mapPlanTasksForPersistence(preview.plan, preview.calculated, qty);
  assert.equal(rows.length, 2);
  assert.equal(rows[0]!.stepCode, "P01");
  assert.equal(rows[0]!.kind, "work");
  assert.equal(rows[0]!.durationMode, "fixed");
  assert.equal(rows[1]!.dependsOnJson && Array.isArray(rows[1]!.dependsOnJson)
    ? (rows[1]!.dependsOnJson as unknown[]).length
    : -1, 1);
  assert.equal(expectedDependencyCount(preview.plan), 1);
  assert.equal(expectedTakeoffLinkCount(preview.plan), 2);

  const snap = domainSnapshotForPersist(preview.plan) as {
    schemaVersion: number;
    activities: unknown[];
  };
  assert.equal(snap.schemaVersion, 1);
  assert.equal(snap.activities.length, 2);

  // ROCKMAN fixture mémoire 22/27
  const rockLines = Array.from({ length: 22 }, (_, i) => ({
    code: `GO-${String(i).padStart(2, "0")}-01`,
    executable: true,
    role: "quote",
    quantity_for_planning: 10,
    validated_quantity: 10,
    declared_quantity: 10,
    computed_quantity: 10,
  }));
  const rockPreview = previewAiSchedule({
    raw: {
      format: BEWORK_SCHEDULE_AI_FORMAT,
      activities: rockLines.map((l, i) => ({
        id: `P${String(i + 1).padStart(2, "0")}`,
        name: `T${i + 1}`,
        kind: "WORK",
        duration_days: i < 21 ? 1 : 6,
        takeoff_codes: [l.code],
        after:
          i === 0
            ? []
            : [{ id: `P${String(i).padStart(2, "0")}`, type: "FS", lag_days: 0 }],
      })),
    },
    sourceContext: {
      projectId: "rockman-fixture",
      takeoffStudyId: "s",
      takeoffVersion: 4,
      takeoffFingerprint: "fp",
      lines: rockLines,
    },
  });
  assert.equal(rockPreview.ok, true);
  if (rockPreview.ok) {
    assert.equal(rockPreview.stats.inputActivities, 22);
    assert.equal(rockPreview.stats.calculatedActivities, 22);
    assert.equal(rockPreview.stats.totalDurationDays, 27);
    const mapped = mapPlanTasksForPersistence(
      rockPreview.plan,
      rockPreview.calculated,
      new Map(rockLines.map((l) => [l.code, l.quantity_for_planning])),
    );
    assert.equal(mapped.length, 22);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        suite: "repository/mapping.test.ts",
        dbRequired: false,
        rockmanFixture: { activities: 22, days: 27 },
      },
      null,
      2,
    ),
  );
}

run();
