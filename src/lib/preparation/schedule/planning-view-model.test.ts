/**
 * Tests view-model présentation Planning — fixtures locales, aucune BDD.
 * Exécution : node --import tsx src/lib/preparation/schedule/planning-view-model.test.ts
 */
import assert from "node:assert/strict";
import {
  buildPlanningViewModel,
  detectSemanticSourceWarning,
  filterPlanningTasks,
} from "./planning-view-model";
import type { SchedulePlanViewPayload } from "./transfer";

function basePlan(
  overrides: Partial<SchedulePlanViewPayload> = {},
): SchedulePlanViewPayload {
  const tasks: SchedulePlanViewPayload["tasks"] = [
    {
      id: "t1",
      stepCode: "Q01-01",
      name: "Installation chantier",
      kind: "work",
      lot: "01 — Préparation & sécurité",
      includeInBase: true,
      holdPoint: false,
      holdPointStatus: null,
      holdPointBlocksNext: false,
      conditional: false,
      conditionalConditions: [],
      startDate: "2026-10-12",
      endDate: "2026-10-12",
      startHalf: 0,
      endHalf: 1,
      durationDays: 1,
      durationCalendar: "working",
      durationMode: "fixed",
      quantitySnapshot: null,
      quantityUnit: null,
      driverTakeoffCode: null,
      rateId: null,
      rateValue: null,
      rateUnit: null,
      ratePer: null,
      ratePerLabel: null,
      parallelUnits: 1,
      crewId: null,
      crewSize: null,
      parallelizable: false,
      workloadPersonDays: null,
      workloadSource: null,
      crew: [],
      equipment: [],
      supplies: [],
      preconditions: [],
      controls: [],
      safety: [],
      dependsOn: [],
      blockingReason: null,
      sellHtSnapshot: 100,
      costHtSnapshot: 50,
      description: null,
    },
    {
      id: "t2",
      stepCode: "Q03-01",
      name: "Distribution générale",
      kind: "work",
      lot: "02 — Réseaux",
      includeInBase: true,
      holdPoint: false,
      holdPointStatus: null,
      holdPointBlocksNext: false,
      conditional: false,
      conditionalConditions: [],
      startDate: "2026-10-13",
      endDate: "2026-10-14",
      startHalf: 0,
      endHalf: 1,
      durationDays: 2,
      durationCalendar: "working",
      durationMode: "computed",
      quantitySnapshot: 60,
      quantityUnit: "ml",
      driverTakeoffCode: "Q03-01",
      rateId: "r1",
      rateValue: 30,
      rateUnit: "ml/j",
      ratePer: "equipe",
      ratePerLabel: "équipe",
      parallelUnits: 1,
      crewId: "ELEC-A",
      crewSize: 2,
      parallelizable: true,
      workloadPersonDays: 4,
      workloadSource: "DERIVED",
      crew: [
        { labor_id: "elec", count: 1, label: "électricien" },
        { labor_id: "aide", count: 1, label: "aide" },
      ],
      equipment: [{ equipment_id: "m1", count: 1, label: "Multimètre" }],
      supplies: [],
      preconditions: ["Zone accessible"],
      controls: ["Continuité"],
      safety: ["EPI"],
      dependsOn: [{ stepId: "Q01-01", type: "FS" }],
      blockingReason: null,
      sellHtSnapshot: 500,
      costHtSnapshot: 200,
      description: "1. Préparer\n2. Tirer\n3. Raccorder",
    },
    {
      id: "t3",
      stepCode: "Q08-01",
      name: "Contrôle final",
      kind: "control",
      lot: "04 — Contrôles",
      includeInBase: true,
      holdPoint: true,
      holdPointStatus: "A_CONTROLER",
      holdPointBlocksNext: true,
      conditional: false,
      conditionalConditions: [],
      startDate: "2026-10-15",
      endDate: "2026-10-15",
      startHalf: 0,
      endHalf: 0,
      durationDays: 0.5,
      durationCalendar: "working",
      durationMode: "fixed",
      quantitySnapshot: null,
      quantityUnit: null,
      driverTakeoffCode: null,
      rateId: null,
      rateValue: null,
      rateUnit: null,
      ratePer: null,
      ratePerLabel: null,
      parallelUnits: 1,
      crewId: "ELEC-A",
      crewSize: 2,
      parallelizable: false,
      workloadPersonDays: 1,
      workloadSource: "PROVIDED",
      crew: [],
      equipment: [],
      supplies: [],
      preconditions: [],
      controls: ["Essais"],
      safety: [],
      dependsOn: [{ stepId: "Q03-01", type: "FS" }],
      blockingReason: null,
      sellHtSnapshot: null,
      costHtSnapshot: null,
      description: null,
    },
    {
      id: "t4",
      stepCode: "Q09-01",
      name: "Remise des clés",
      kind: "work",
      lot: "05 — Remise",
      includeInBase: true,
      holdPoint: false,
      holdPointStatus: null,
      holdPointBlocksNext: false,
      conditional: false,
      conditionalConditions: [],
      startDate: "2026-10-16",
      endDate: "2026-10-16",
      startHalf: 0,
      endHalf: 1,
      durationDays: 1,
      durationCalendar: "working",
      durationMode: "computed_workload",
      quantitySnapshot: null,
      quantityUnit: null,
      driverTakeoffCode: null,
      rateId: null,
      rateValue: null,
      rateUnit: null,
      ratePer: null,
      ratePerLabel: null,
      parallelUnits: 1,
      crewId: "ELEC-B",
      crewSize: 1,
      parallelizable: false,
      workloadPersonDays: 1,
      workloadSource: "PROVIDED",
      crew: [],
      equipment: [],
      supplies: [],
      preconditions: [],
      controls: [],
      safety: [],
      dependsOn: [{ stepId: "Q08-01", type: "FS" }],
      blockingReason: null,
      sellHtSnapshot: null,
      costHtSnapshot: null,
      description: null,
    },
  ];

  return {
    id: "plan1",
    title: "Planning test",
    isDemonstration: false,
    watermark: null,
    status: "READY",
    revisionKind: "BASE",
    revisionNumber: 1,
    siblingCurrentPlanId: null,
    studyVersionAtGeneration: 1,
    startDate: "2026-10-12",
    endDateBase: "2026-10-16",
    endDateWithConditional: null,
    baseDurationWorkingDays: 5,
    withConditionalWorkingDays: null,
    note: null,
    study: { id: "s1", title: "Étude", version: 1 },
    project: {
      id: "p1",
      title: "Construction d'une maison individuelle R+1 de 120 m² — MOREL",
    },
    scope: null,
    quote: {
      id: "q1",
      number: "DEV-1",
      subject: "Rénovation électrique appartement T3 65 m²",
      isDemonstration: false,
      totalSellHt: 1000,
    },
    quoteOptions: [],
    linkedSellHtTotal: 600,
    linkedCostHtTotal: 250,
    indicators: {
      workloadDays: 4.5,
      workingSpanDays: 5,
      calendarSpanDays: 5,
      waitDays: 0,
    },
    dependencies: [
      {
        id: "d1",
        type: "FS",
        lagDays: 0,
        predecessorStepCode: "Q01-01",
        successorStepCode: "Q03-01",
      },
      {
        id: "d2",
        type: "FS",
        lagDays: 0,
        predecessorStepCode: "Q03-01",
        successorStepCode: "Q08-01",
      },
      {
        id: "d3",
        type: "FS",
        lagDays: 0,
        predecessorStepCode: "Q08-01",
        successorStepCode: "Q09-01",
      },
    ],
    tasks,
    ...overrides,
  };
}

const vm = buildPlanningViewModel(basePlan());

const complete = vm.tasks.find((x) => x.stepCode === "Q03-01")!;
assert.equal(complete.missing.crew, false);
assert.equal(complete.missing.rate, false);
assert.ok(complete.crewDisplay.includes("ELEC-A"));
assert.ok(complete.quantityDisplay.includes("60"));
assert.ok(complete.rateDisplay.includes("30"));
assert.ok(complete.workloadDisplay.includes("4 h.j"));
assert.equal(complete.dependsOn[0]?.stepId, "Q01-01");
assert.match(complete.durationModeLabel, /rendement/i);

const incomplete = vm.tasks.find((x) => x.stepCode === "Q01-01")!;
assert.equal(incomplete.missing.crew, true);
assert.equal(incomplete.missing.rate, true);
assert.equal(incomplete.crewDisplay, "Équipe à renseigner");
assert.equal(incomplete.rateDisplay, "Rendement à renseigner");
assert.equal(incomplete.quantityDisplay, "À renseigner");

const half = vm.tasks.find((x) => x.stepCode === "Q08-01")!;
assert.equal(half.durationLabel, "0,5 j");

assert.ok(vm.phases.length >= 3);
assert.ok(vm.phases.every((p) => p.label !== "Installation chantier"));

assert.deepEqual(
  vm.resources.map((r) => r.crewId).sort(),
  ["ELEC-A", "ELEC-B"],
);
assert.equal(vm.resources.find((r) => r.crewId === "ELEC-A")!.taskCount, 2);

const rateGroups = [...vm.quality.warnings, ...vm.quality.infos].filter(
  (g) =>
    g.code.includes("RATE") ||
    g.code.includes("PRODUCTIVITY") ||
    g.code.includes("CREW"),
);
assert.equal(new Set(rateGroups.map((g) => g.code)).size, rateGroups.length);

assert.ok(
  filterPlanningTasks(vm.tasks, "no_crew", "").every((t) => t.missing.crew),
);
assert.ok(
  filterPlanningTasks(vm.tasks, "no_rate", "").every((t) => t.missing.rate),
);

assert.match(
  detectSemanticSourceWarning(basePlan()) ?? "",
  /ne semblent pas correspondre/i,
);
assert.equal(
  detectSemanticSourceWarning(
    basePlan({
      quote: {
        id: "q1",
        number: "DEV-1",
        subject: "Maison individuelle R+1",
        isDemonstration: false,
        totalSellHt: 1000,
      },
    }),
  ),
  null,
);

assert.equal(vm.summary.durationCumulatedDays, 4.5);
assert.equal(vm.summary.workloadKnownHj, 6);
assert.equal(vm.summary.crewsFilled, 3);

console.log("planning-view-model.test.ts PASS");
