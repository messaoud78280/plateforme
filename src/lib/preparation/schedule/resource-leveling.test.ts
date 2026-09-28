/**
 * Resource leveling universel — tests A→G.
 * Exécution : npx tsx src/lib/preparation/schedule/resource-leveling.test.ts
 */
import assert from "node:assert/strict";
import {
  computeSchedule,
  resolveScheduleResourceKey,
} from "@/lib/preparation/schedule/compute";
import type {
  PrepResourcesDTO,
  PrepScheduleDTO,
  PrepWorkflowStepDTO,
} from "@/lib/preparation/schedule/types";

const EMPTY_RESOURCES: PrepResourcesDTO = {
  labor: [],
  equipment: [],
  supplies: [],
  rates: [],
};

const CALENDAR = {
  working_days: [1, 2, 3, 4, 5],
  holidays: null as null,
  granularity_days: 0.5,
};

function step(partial: {
  id: string;
  name?: string;
  order: number;
  lot?: string | null;
  crew_id?: string | null;
  parallelizable?: boolean;
  days?: number;
  kind?: PrepWorkflowStepDTO["kind"];
}): PrepWorkflowStepDTO {
  return {
    id: partial.id,
    name: partial.name ?? partial.id,
    kind: partial.kind ?? "work",
    order: partial.order,
    lot: partial.lot ?? null,
    description: null,
    takeoff_ids: [],
    crew: [],
    crew_id: partial.crew_id ?? null,
    parallelizable: partial.parallelizable === true,
    equipment: [],
    supplies: [],
    preconditions: [],
    controls_before_next: [],
    constraints: [],
    safety: [],
    proofs: [],
    hold_point: false,
    conditional: null,
    duration: {
      mode: "fixed",
      days: partial.days ?? 1,
      calendar: "working",
    },
  };
}

function overlaps(aStart: string, aEnd: string, aSH: number, aEH: number, bStart: string, bEnd: string, bSH: number, bEH: number) {
  const a0 = `${aStart}:${aSH}`;
  const a1 = `${aEnd}:${aEH}`;
  const b0 = `${bStart}:${bSH}`;
  const b1 = `${bEnd}:${bEH}`;
  return a0 <= b1 && b0 <= a1;
}

function countOverlaps(
  placed: Array<{
    start: { date: string; half: number };
    end: { date: string; half: number };
  }>,
): number {
  let n = 0;
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      const a = placed[i]!;
      const b = placed[j]!;
      if (
        overlaps(
          a.start.date,
          a.end.date,
          a.start.half,
          a.end.half,
          b.start.date,
          b.end.date,
          b.start.half,
          b.end.half,
        )
      ) {
        n++;
      }
    }
  }
  return n;
}

// --- TEST A : 10 × 1 j, 1 équipe, aucune dépendance → ≈ 10 j ---
{
  const workflow = Array.from({ length: 10 }, (_, i) =>
    step({
      id: `T${i + 1}`,
      order: i + 1,
      crew_id: "ELEC-A",
      days: 1,
    }),
  );
  const schedule: PrepScheduleDTO = {
    start_date: "2026-11-02",
    calendar: CALENDAR,
    tasks: workflow.map((s) => ({
      step_id: s.id,
      depends_on: [],
      include_in_base: true,
    })),
  };
  const r = computeSchedule({
    workflowSteps: workflow,
    schedule,
    resources: EMPTY_RESOURCES,
    qtyOf: () => null,
  });
  assert.equal(r.errors.length, 0);
  assert.ok(
    r.baseDurationWorkingDays != null &&
      Math.abs(r.baseDurationWorkingDays - 10) < 0.01,
    `TEST A durée=${r.baseDurationWorkingDays} attendu ≈ 10`,
  );
  assert.equal(countOverlaps(r.placed), 0, "TEST A : aucun chevauchement");
  console.log("ok — TEST A (10×1j / 1 équipe → 10 j)");
}

// --- TEST B : 10 × 1 j, 2 équipes → ≈ 5 j ---
{
  const workflow = Array.from({ length: 10 }, (_, i) =>
    step({
      id: `T${i + 1}`,
      order: i + 1,
      crew_id: i % 2 === 0 ? "ELEC-A" : "ELEC-B",
      days: 1,
    }),
  );
  const schedule: PrepScheduleDTO = {
    start_date: "2026-11-02",
    calendar: CALENDAR,
    tasks: workflow.map((s) => ({
      step_id: s.id,
      depends_on: [],
      include_in_base: true,
    })),
  };
  const r = computeSchedule({
    workflowSteps: workflow,
    schedule,
    resources: EMPTY_RESOURCES,
    qtyOf: () => null,
  });
  assert.ok(
    r.baseDurationWorkingDays != null &&
      Math.abs(r.baseDurationWorkingDays - 5) < 0.01,
    `TEST B durée=${r.baseDurationWorkingDays} attendu ≈ 5`,
  );
  console.log("ok — TEST B (10×1j / 2 équipes → ≈ 5 j)");
}

// --- TEST C : FS A→B→C ---
{
  const workflow = [
    step({ id: "A", order: 1, crew_id: "X", days: 1 }),
    step({ id: "B", order: 2, crew_id: "Y", days: 1 }),
    step({ id: "C", order: 3, crew_id: "Z", days: 1 }),
  ];
  const schedule: PrepScheduleDTO = {
    start_date: "2026-11-02",
    calendar: CALENDAR,
    tasks: [
      { step_id: "A", depends_on: [], include_in_base: true },
      {
        step_id: "B",
        depends_on: [{ step_id: "A", type: "FS", lag_days: 0 }],
        include_in_base: true,
      },
      {
        step_id: "C",
        depends_on: [{ step_id: "B", type: "FS", lag_days: 0 }],
        include_in_base: true,
      },
    ],
  };
  const r = computeSchedule({
    workflowSteps: workflow,
    schedule,
    resources: EMPTY_RESOURCES,
    qtyOf: () => null,
  });
  const a = r.placed.find((t) => t.stepId === "A")!;
  const b = r.placed.find((t) => t.stepId === "B")!;
  const c = r.placed.find((t) => t.stepId === "C")!;
  const rank = (d: string, h: number) => d.replace(/-/g, "") + String(h);
  assert.ok(
    rank(b.start.date, b.start.half) > rank(a.end.date, a.end.half) ||
      (b.start.date === a.end.date && a.end.half === 0 && b.start.half === 1) ||
      b.start.date > a.end.date,
    `FS A→B : B doit démarrer après A (${a.end.date}h${a.end.half} → ${b.start.date}h${b.start.half})`,
  );
  assert.ok(
    c.start.date > b.end.date ||
      (c.start.date === b.end.date && c.start.half > b.end.half) ||
      (c.start.date === b.end.date && b.end.half === 0 && c.start.half === 1),
    `FS B→C : C doit démarrer après B`,
  );
  assert.ok(
    r.baseDurationWorkingDays != null && r.baseDurationWorkingDays >= 3,
    `TEST C durée=${r.baseDurationWorkingDays}`,
  );
  console.log("ok — TEST C (FS A→B→C)");
}

// --- TEST D : équipes distinctes, aucune dépendance → parallèle ---
{
  const workflow = [
    step({ id: "A", order: 1, crew_id: "ELEC-A", days: 2 }),
    step({ id: "B", order: 2, crew_id: "ELEC-B", days: 2 }),
  ];
  const schedule: PrepScheduleDTO = {
    start_date: "2026-11-02",
    calendar: CALENDAR,
    tasks: [
      { step_id: "A", depends_on: [], include_in_base: true },
      { step_id: "B", depends_on: [], include_in_base: true },
    ],
  };
  const r = computeSchedule({
    workflowSteps: workflow,
    schedule,
    resources: EMPTY_RESOURCES,
    qtyOf: () => null,
  });
  assert.equal(r.placed[0]!.start.date, r.placed[1]!.start.date);
  assert.ok(
    r.baseDurationWorkingDays != null &&
      Math.abs(r.baseDurationWorkingDays - 2) < 0.01,
    `TEST D durée=${r.baseDurationWorkingDays}`,
  );
  console.log("ok — TEST D (équipes distinctes → parallèle)");
}

// --- TEST E : même équipe, parallelizable=false → aucun chevauchement ---
{
  const workflow = [
    step({ id: "A", order: 1, crew_id: "ELEC-A", days: 1, parallelizable: false }),
    step({ id: "B", order: 2, crew_id: "ELEC-A", days: 1, parallelizable: false }),
  ];
  const schedule: PrepScheduleDTO = {
    start_date: "2026-11-02",
    calendar: CALENDAR,
    tasks: [
      { step_id: "A", depends_on: [], include_in_base: true },
      { step_id: "B", depends_on: [], include_in_base: true, parallelizable: false },
    ],
  };
  const r = computeSchedule({
    workflowSteps: workflow,
    schedule,
    resources: EMPTY_RESOURCES,
    qtyOf: () => null,
  });
  assert.equal(countOverlaps(r.placed), 0);
  // parallelizable=true même crew → toujours séquencé
  const workflow2 = [
    step({ id: "A", order: 1, crew_id: "ELEC-A", days: 1, parallelizable: true }),
    step({ id: "B", order: 2, crew_id: "ELEC-A", days: 1, parallelizable: true }),
  ];
  const r2 = computeSchedule({
    workflowSteps: workflow2,
    schedule: {
      start_date: "2026-11-02",
      calendar: CALENDAR,
      tasks: [
        { step_id: "A", depends_on: [], include_in_base: true, parallelizable: true },
        { step_id: "B", depends_on: [], include_in_base: true, parallelizable: true },
      ],
    },
    resources: EMPTY_RESOURCES,
    qtyOf: () => null,
  });
  assert.equal(countOverlaps(r2.placed), 0, "parallelizable≠même crew parallèle");
  console.log("ok — TEST E (même équipe → séquencé même si parallelizable)");
}

// --- TEST F : aucun crew, même lot → fallback LOT → séquencement ---
{
  const workflow = Array.from({ length: 4 }, (_, i) =>
    step({
      id: `T${i + 1}`,
      order: i + 1,
      lot: "Électricité",
      days: 1,
    }),
  );
  const r = computeSchedule({
    workflowSteps: workflow,
    schedule: {
      start_date: "2026-11-02",
      calendar: CALENDAR,
      tasks: workflow.map((s) => ({
        step_id: s.id,
        depends_on: [],
        include_in_base: true,
      })),
    },
    resources: EMPTY_RESOURCES,
    qtyOf: () => null,
  });
  assert.ok(r.placed.every((t) => t.resourceKeySource === "lot"));
  assert.ok(r.placed.every((t) => t.crewId == null), "fallback non écrit comme crew_id");
  assert.ok(
    r.baseDurationWorkingDays != null &&
      Math.abs(r.baseDurationWorkingDays - 4) < 0.01,
    `TEST F durée=${r.baseDurationWorkingDays}`,
  );
  assert.equal(countOverlaps(r.placed), 0);
  console.log("ok — TEST F (fallback lot → séquencement)");
}

// --- TEST G : métier inconnu, pas de hardcode ---
{
  const workflow = [
    step({ id: "U1", order: 1, lot: "Métier inventé XYZ", days: 1.5 }),
    step({ id: "U2", order: 2, lot: "Métier inventé XYZ", days: 2 }),
  ];
  const r = computeSchedule({
    workflowSteps: workflow,
    schedule: {
      start_date: "2026-11-02",
      calendar: CALENDAR,
      tasks: [
        { step_id: "U1", depends_on: [], include_in_base: true },
        { step_id: "U2", depends_on: [], include_in_base: true },
      ],
    },
    resources: EMPTY_RESOURCES,
    qtyOf: () => null,
  });
  assert.equal(r.errors.length, 0);
  assert.ok(
    r.baseDurationWorkingDays != null &&
      Math.abs(r.baseDurationWorkingDays - 3.5) < 0.01,
    `TEST G durée=${r.baseDurationWorkingDays}`,
  );
  const key = resolveScheduleResourceKey(workflow[0]!);
  assert.equal(key.source, "lot");
  assert.match(key.key, /^LOT:/);
  console.log("ok — TEST G (métier inconnu)");
}

// --- DEFAULT-A sans lot ---
{
  const workflow = [
    step({ id: "D1", order: 1, days: 1 }),
    step({ id: "D2", order: 2, days: 1 }),
  ];
  const r = computeSchedule({
    workflowSteps: workflow,
    schedule: {
      start_date: "2026-11-02",
      calendar: CALENDAR,
      tasks: [
        { step_id: "D1", depends_on: [], include_in_base: true },
        { step_id: "D2", depends_on: [], include_in_base: true },
      ],
    },
    resources: EMPTY_RESOURCES,
    qtyOf: () => null,
  });
  assert.ok(r.placed.every((t) => t.resourceKey === "DEFAULT-A"));
  assert.ok(
    r.baseDurationWorkingDays != null &&
      Math.abs(r.baseDurationWorkingDays - 2) < 0.01,
  );
  console.log("ok — DEFAULT-A sans lot");
}

// --- Fixture Électricité : 26 tâches, charge ≈ 19.5–20, 0 deps, 0 crew → durée ≈ charge ---
{
  const days = [
    0.5, 1, 0.5, 1, 1, 0.5, 1, 0.5, 1, 1, 0.5, 1, 0.5, 1, 1, 0.5, 1, 0.5, 1, 1, 0.5,
    1, 0.5, 1, 0.5, 0.5,
  ];
  const charge = days.reduce((a, b) => a + b, 0);
  const workflow = days.map((d, i) =>
    step({
      id: `S-E${i + 1}`,
      order: i + 1,
      lot: "Électricité",
      days: d,
    }),
  );
  const r = computeSchedule({
    workflowSteps: workflow,
    schedule: {
      start_date: "2026-11-02",
      calendar: { ...CALENDAR, holidays: "FR_METROPOLE" },
      tasks: workflow.map((s) => ({
        step_id: s.id,
        depends_on: [],
        include_in_base: true,
      })),
    },
    resources: EMPTY_RESOURCES,
    qtyOf: () => null,
  });
  assert.equal(r.placed.length, 26);
  assert.ok(Math.abs(charge - 20) < 0.01);
  assert.ok(
    r.baseDurationWorkingDays != null &&
      Math.abs(r.baseDurationWorkingDays - charge) < 0.01,
    `Élec fixture durée=${r.baseDurationWorkingDays} charge=${charge}`,
  );
  assert.equal(countOverlaps(r.placed), 0);
  console.log(
    `ok — fixture Électricité (${r.placed.length} tâches, charge=${charge}, durée=${r.baseDurationWorkingDays})`,
  );
}

// --- Fragmentation lots (désignations uniques) → DEFAULT-A unique ---
{
  const workflow = Array.from({ length: 6 }, (_, i) =>
    step({
      id: `F${i + 1}`,
      order: i + 1,
      lot: `Poste unique désignation très longue ${i + 1}`,
      days: 1,
    }),
  );
  const r = computeSchedule({
    workflowSteps: workflow,
    schedule: {
      start_date: "2026-11-02",
      calendar: CALENDAR,
      tasks: workflow.map((s) => ({
        step_id: s.id,
        depends_on: [],
        include_in_base: true,
      })),
    },
    resources: EMPTY_RESOURCES,
    qtyOf: () => null,
  });
  assert.ok(r.placed.every((t) => t.resourceKey === "DEFAULT-A"));
  assert.ok(
    r.baseDurationWorkingDays != null &&
      Math.abs(r.baseDurationWorkingDays - 6) < 0.01,
  );
  console.log("ok — fragmentation lots → DEFAULT-A");
}

console.log("ok — resource-leveling A→G");
