/**
 * Replanification après update_dependency — graphe FS respecté.
 * npx tsx --test src/lib/preparation/schedule/dependency-replan.test.ts
 */
import assert from "node:assert/strict";
import { computeSchedule } from "@/lib/preparation/schedule/compute";
import { buildStructuralDependencies } from "@/lib/preparation/schedule/dependencies";
import { analyzeScheduleConsistency } from "@/lib/preparation/schedule/consistency";
import { simulateDependencyDateImpact } from "@/lib/bework-patch/impact/simulate-planning";
import type { ImpactPlan } from "@/lib/bework-patch/impact/types";
import type { PrepWorkflowStepDTO } from "@/lib/preparation/schedule/types";

function fixed(days: number): PrepWorkflowStepDTO["duration"] {
  return { mode: "fixed", days, calendar: "working" };
}

function step(
  id: string,
  name: string,
  opts: {
    lot?: string;
    kind?: "work" | "control" | "wait";
    order?: number;
    duration?: PrepWorkflowStepDTO["duration"];
  } = {},
): PrepWorkflowStepDTO {
  return {
    id,
    order: opts.order ?? 1,
    name,
    lot: opts.lot ?? null,
    kind: opts.kind ?? "work",
    description: null,
    execution_phase_id: null,
    takeoff_ids: [],
    duration: opts.duration ?? fixed(1),
    crew: [],
    crew_id: null,
    crew_size: null,
    workload_person_days: null,
    parallelizable: false,
    equipment: [],
    supplies: [],
    preconditions: [],
    controls_before_next: [],
    constraints: [],
    safety: [],
    proofs: [],
    hold_point: false,
    conditional: null,
  };
}

function run(
  steps: PrepWorkflowStepDTO[],
  deps: Record<string, Array<{ step_id: string; type?: "FS" | "SS" | "FF"; lag_days?: number }>>,
  start = "2026-10-12",
) {
  return computeSchedule({
    workflowSteps: steps,
    schedule: {
      start_date: start,
      calendar: {
        working_days: [1, 2, 3, 4, 5],
        holidays: "FR_METROPOLE",
        granularity_days: 0.5,
      },
      tasks: steps.map((s) => ({
        step_id: s.id,
        depends_on: (deps[s.id] ?? []).map((d) => ({
          step_id: d.step_id,
          type: d.type ?? "FS",
          lag_days: d.lag_days ?? 0,
        })),
        include_in_base: true,
      })),
    },
    resources: { labor: [], equipment: [], supplies: [], rates: [] },
    qtyOf: () => null,
  });
}

function placed(r: ReturnType<typeof computeSchedule>, id: string) {
  const p = r.placed.find((x) => x.stepId === id);
  assert.ok(p, `missing ${id}`);
  return p!;
}

// --- TEST A : ancienne date 12, pred finit 21 → B après A ---
{
  const steps = [
    step("A", "Rebouchage des saignées", {
      lot: "PHASE — Finitions",
      order: 1,
      duration: fixed(1),
    }),
    step("B", "Pose prise salle de bains", {
      lot: "PHASE — Appareillage",
      order: 2,
      duration: fixed(0.5),
    }),
  ];
  // Sans dep : B peut démarrer tôt
  const before = run(steps, {});
  assert.equal(placed(before, "B").startDate, "2026-10-12");

  const after = run(steps, {
    B: [{ step_id: "A", type: "FS", lag_days: 0 }],
  });
  const a = placed(after, "A");
  const b = placed(after, "B");
  assert.ok(a.endDate);
  assert.ok(b.startDate);
  assert.ok(
    `${b.startDate}|${b.start.half}` > `${a.endDate}|${a.end.half}` ||
      `${b.startDate}|${b.start.half}` ===
        `${a.endDate}|${(a.end.half + 1) as 0 | 1}` ||
      b.startDate! > a.endDate!,
    `B (${b.startDate}) doit être après A (${a.endDate})`,
  );
  assert.ok(b.startDate! >= "2026-10-13", `B start=${b.startDate}`);
  console.log("A — FS replanifie B après A: ok", {
    A: a.endDate,
    B: b.startDate,
  });
}

// --- TEST B : A → B → C, modif dep B → B et C bougent ---
{
  const steps = [
    step("A", "Préparation", { order: 1, duration: fixed(1) }),
    step("B", "Réseaux", { order: 2, duration: fixed(1) }),
    step("C", "Pose", { order: 3, duration: fixed(1) }),
  ];
  const r = run(steps, {
    B: [{ step_id: "A", type: "FS" }],
    C: [{ step_id: "B", type: "FS" }],
  });
  const a = placed(r, "A");
  const b = placed(r, "B");
  const c = placed(r, "C");
  assert.ok(b.startDate! >= a.endDate!);
  assert.ok(c.startDate! >= b.endDate!);
  console.log("B — chaîne A→B→C: ok", {
    A: a.endDate,
    B: b.startDate,
    C: c.startDate,
  });
}

// --- TEST C : 2 équipes — deps + leveling ---
{
  const steps = [
    step("A", "Équipe 1 travail", { order: 1, duration: fixed(2) }),
    step("B", "Équipe 2 travail", { order: 2, duration: fixed(2) }),
    step("C", "Après A et B", { order: 3, duration: fixed(1) }),
  ];
  steps[0]!.crew_id = "E1";
  steps[1]!.crew_id = "E2";
  steps[2]!.crew_id = "E1";
  const r = run(steps, {
    C: [
      { step_id: "A", type: "FS" },
      { step_id: "B", type: "FS" },
    ],
  });
  const a = placed(r, "A");
  const b = placed(r, "B");
  const c = placed(r, "C");
  // A et B peuvent chevaucher (équipes différentes)
  assert.equal(a.startDate, b.startDate);
  // C après max(A,B)
  const maxEnd = a.endDate! >= b.endDate! ? a.endDate! : b.endDate!;
  assert.ok(c.startDate! >= maxEnd);
  console.log("C — 2 équipes + FS: ok");
}

// --- TEST D : FIXED — durée conservée, date recalculable ---
{
  const steps = [
    step("A", "Amont", { order: 1, duration: fixed(1) }),
    step("B", "Fixed aval", { order: 2, duration: fixed(2) }),
  ];
  const r = run(steps, { B: [{ step_id: "A", type: "FS" }] });
  assert.equal(placed(r, "B").duration.durationDays, 2);
  assert.ok(placed(r, "B").startDate! > placed(r, "A").startDate!);
  console.log("D — FIXED durée conservée: ok");
}

// --- TEST E : MANUAL (durée injectée fixed en entrée recompute) ---
{
  const steps = [
    step("A", "Amont", { order: 1, duration: fixed(1) }),
    step("B", "Manuel", { order: 2, duration: fixed(1.5) }),
  ];
  const r = run(steps, { B: [{ step_id: "A", type: "FS" }] });
  assert.equal(placed(r, "B").duration.durationDays, 1.5);
  console.log("E — MANUAL/fixed durée conservée: ok");
}

// --- TEST F : COMPUTED avec durée déjà résolue en entrée ---
{
  const steps = [
    step("A", "Amont", { order: 1, duration: fixed(1) }),
    step("B", "Computed", { order: 2, duration: fixed(0.5) }),
  ];
  const r = run(steps, { B: [{ step_id: "A", type: "FS" }] });
  assert.equal(placed(r, "B").duration.durationDays, 0.5);
  assert.ok(placed(r, "B").startDate! >= placed(r, "A").endDate!);
  console.log("F — COMPUTED durée + date: ok");
}

// --- TEST G : preview montre impact dates ---
{
  const plan: ImpactPlan = {
    id: "p1",
    title: "Test",
    startDate: "2026-10-12",
    endDateBase: "2026-10-20",
    baseDurationWorkingDays: 7,
    revisionNumber: 1,
    studyVersionAtGeneration: 1,
    takeoffLinks: [],
    tasks: [
      {
        id: "tA",
        stepCode: "A",
        name: "Rebouchage",
        durationDays: 1,
        durationMode: "fixed",
        durationLockedByUser: false,
        driverTakeoffCode: null,
        quantitySnapshot: null,
        quantityUnit: null,
        rateValue: null,
        parallelUnits: 1,
        startDate: "2026-10-21",
        endDate: "2026-10-21",
        dependsOnStepCodes: [],
        lot: "Finitions",
      },
      {
        id: "tB",
        stepCode: "B",
        name: "Prise",
        durationDays: 0.5,
        durationMode: "computed",
        durationLockedByUser: false,
        driverTakeoffCode: null,
        quantitySnapshot: 1,
        quantityUnit: "U",
        rateValue: 12,
        parallelUnits: 1,
        startDate: "2026-10-12",
        endDate: "2026-10-12",
        dependsOnStepCodes: [],
        lot: "Appareillage",
      },
    ],
  };
  const sim = simulateDependencyDateImpact(
    plan,
    new Map([
      [
        "tB",
        [{ step_id: "A", type: "FS" as const, lag_days: 0 }],
      ],
    ]),
  );
  assert.equal(sim.errors.length, 0);
  const movedB = sim.moved.find((m) => m.stepCode === "B");
  assert.ok(movedB, "preview doit montrer B déplacé");
  assert.equal(movedB!.beforeStart, "2026-10-12");
  assert.ok(movedB!.afterStart! > "2026-10-12");
  console.log("G — preview dates: ok", movedB);
}

// --- TEST H : consistency 0 DEP_DATE_VIOLATION ---
{
  const steps = [
    step("A", "Rebouchage des saignées et reprises", {
      lot: "PHASE — Finitions",
      order: 1,
    }),
    step("B", "Pose prises", {
      lot: "PHASE — Appareillage",
      order: 2,
      duration: fixed(0.5),
    }),
    step("C", "Va-et-vient", {
      lot: "PHASE — Éclairage",
      order: 3,
      duration: fixed(0.5),
    }),
  ];
  const deps = {
    B: [{ step_id: "A", type: "FS" as const }],
    C: [{ step_id: "A", type: "FS" as const }],
  };
  // Explicites préservées malgré rôles inférés
  const structural = buildStructuralDependencies(
    steps.map((s) => ({
      id: s.id,
      name: s.name,
      lot: s.lot,
      kind: s.kind,
      order: s.order,
      depends_on: deps[s.id as keyof typeof deps] ?? [],
    })),
  );
  assert.ok((structural.get("B") ?? []).some((d) => d.step_id === "A"));
  assert.ok((structural.get("C") ?? []).some((d) => d.step_id === "A"));

  const r = run(steps, deps);
  const c = analyzeScheduleConsistency(
    r.placed.map((p) => ({
      stepCode: p.stepId,
      name: p.name,
      lot: p.lot,
      kind: p.kind,
      startDate: p.startDate,
      endDate: p.endDate,
      startHalf: p.start.half,
      endHalf: p.end.half,
      durationDays: p.duration.durationDays,
      dependsOn: (deps[p.stepId as keyof typeof deps] ?? []).map((d) => ({
        step_id: d.step_id,
        type: d.type ?? "FS",
        lag_days: 0,
      })),
    })),
  );
  assert.equal(
    c.blockers.filter((b) => b.code === "DEP_DATE_VIOLATION").length,
    0,
    c.blockers.map((b) => b.message).join("; "),
  );
  console.log("H — 0 DEP_DATE_VIOLATION: ok");
}

console.log("OK — dependency-replan tests A–H");
