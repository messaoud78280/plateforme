/**
 * Structure d'exécution générique — fixtures tous métiers + libellés opaques.
 * Aucun hardcode électricité / terrassement / maçonnerie dans le moteur :
 * le moteur ne lit que phase / role / order / dependencies.
 */
import assert from "node:assert/strict";
import {
  parsePrepWorkflow,
  parsePrepSchedule,
} from "./parse";
import { computeSchedule } from "./compute";
import { resolvePlanningTaskSource } from "./resolve-planning-source";
import { analyzeScheduleConsistency } from "./consistency";
import { mergeTaskOnRegeneration } from "./merge-tasks";
import { evaluatePlanningStudyVersionSync } from "./planning-sync-state";
import { detectDependencyCycle } from "./dependencies";
import {
  computePhaseTopology,
  buildExplicitPhaseDependencies,
} from "./execution-structure";
import type {
  PrepExecutionPhaseDTO,
  PrepResourcesDTO,
  PrepScheduleDTO,
  PrepWorkflowStepDTO,
} from "./types";

function fixed(days: number) {
  return { mode: "fixed" as const, days, calendar: "working" as const };
}

function emptyStep(
  partial: Partial<PrepWorkflowStepDTO> &
    Pick<PrepWorkflowStepDTO, "id" | "order" | "name" | "execution_phase_id">,
): PrepWorkflowStepDTO {
  return {
    kind: "work",
    takeoff_ids: [],
    duration: fixed(0.5),
    crew: [],
    equipment: [],
    supplies: [],
    preconditions: [],
    controls_before_next: [],
    constraints: [],
    safety: [],
    proofs: [],
    ...partial,
  };
}

function scheduleFor(steps: PrepWorkflowStepDTO[]): PrepScheduleDTO {
  return {
    start_date: "2026-10-12",
    calendar: {
      working_days: [1, 2, 3, 4, 5],
      holidays: "FR_METROPOLE",
      granularity_days: 0.5,
    },
    tasks: steps.map((s) => ({ step_id: s.id, depends_on: [] })),
  };
}

const emptyResources: PrepResourcesDTO = {
  labor: [],
  equipment: [],
  supplies: [],
  rates: [],
};

function assertPhaseOrder(
  placed: Array<{ stepId: string; startDate: string | null }>,
  before: string,
  after: string,
) {
  const a = placed.find((p) => p.stepId === before);
  const b = placed.find((p) => p.stepId === after);
  assert.ok(a && b, `missing ${before} or ${after}`);
  assert.ok(a!.startDate && b!.startDate);
  assert.ok(
    a!.startDate! <= b!.startDate!,
    `${before} (${a!.startDate}) doit précéder ou égaler ${after} (${b!.startDate})`,
  );
}

function assertControlAfterWorks(
  placed: Array<{ stepId: string; startDate: string | null; endDate: string | null }>,
  controlId: string,
  workIds: string[],
) {
  const ctrl = placed.find((p) => p.stepId === controlId)!;
  for (const w of workIds) {
    const work = placed.find((p) => p.stepId === w)!;
    assert.ok(work.endDate && ctrl.startDate);
    assert.ok(
      work.endDate! <= ctrl.startDate! ||
        (work.endDate === ctrl.startDate && true),
      `${w} doit finir avant/au début de ${controlId}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Fixture Électricité (phases fournies — moteur ignore le métier)
// ---------------------------------------------------------------------------
const ELEC_PHASES: PrepExecutionPhaseDTO[] = [
  { id: "ph_prep", label: "Installation de chantier", role: "PREPARATION", order: 10 },
  {
    id: "ph_depose",
    label: "Dépose installation existante",
    role: "DEMOLITION",
    order: 20,
    depends_on: ["ph_prep"],
  },
  {
    id: "ph_dist",
    label: "Distribution électrique",
    role: "EXECUTION",
    order: 30,
    depends_on: ["ph_depose"],
  },
  {
    id: "ph_appareillage",
    label: "Pose appareillages",
    role: "EXECUTION",
    order: 40,
    depends_on: ["ph_dist"],
  },
  {
    id: "ph_ctrl",
    label: "Contrôles électriques",
    role: "CONTROL",
    order: 70,
    depends_on: ["ph_appareillage"],
  },
  {
    id: "ph_remise",
    label: "Remise au client",
    role: "HANDOVER",
    order: 80,
    depends_on: ["ph_ctrl"],
  },
];

const ELEC_STEPS = [
  emptyStep({ id: "E1", order: 10, name: "Protections chantier", execution_phase_id: "ph_prep" }),
  emptyStep({ id: "E2", order: 20, name: "Dépose tableau", execution_phase_id: "ph_depose" }),
  emptyStep({ id: "E3", order: 30, name: "Gaines ICTA", execution_phase_id: "ph_dist", duration: fixed(1) }),
  emptyStep({ id: "E4", order: 40, name: "Prises", execution_phase_id: "ph_appareillage" }),
  emptyStep({ id: "E5", order: 50, name: "Interrupteurs", execution_phase_id: "ph_appareillage" }),
  emptyStep({
    id: "E6",
    order: 60,
    name: "Essais",
    execution_phase_id: "ph_ctrl",
    kind: "control",
    duration: fixed(1),
  }),
  emptyStep({ id: "E7", order: 70, name: "Nettoyage remise", execution_phase_id: "ph_remise" }),
];

// ---------------------------------------------------------------------------
// Fixture Terrassement
// ---------------------------------------------------------------------------
const TERR_PHASES: PrepExecutionPhaseDTO[] = [
  { id: "t_prep", label: "Installation engins", role: "PREPARATION", order: 10 },
  {
    id: "t_decap",
    label: "Décapage terre végétale",
    role: "EXECUTION",
    order: 20,
    depends_on: ["t_prep"],
  },
  {
    id: "t_fouille",
    label: "Terrassement des fouilles",
    role: "EXECUTION",
    order: 30,
    depends_on: ["t_decap"],
  },
  {
    id: "t_ctrl",
    label: "Contrôle niveaux",
    role: "CONTROL",
    order: 40,
    depends_on: ["t_fouille"],
  },
  {
    id: "t_hand",
    label: "Remise plateforme",
    role: "HANDOVER",
    order: 50,
    depends_on: ["t_ctrl"],
  },
];

const TERR_STEPS = [
  emptyStep({ id: "T1", order: 10, name: "Base vie engins", execution_phase_id: "t_prep" }),
  emptyStep({ id: "T2", order: 20, name: "Décapage", execution_phase_id: "t_decap", duration: fixed(1) }),
  emptyStep({ id: "T3", order: 30, name: "Fouilles", execution_phase_id: "t_fouille", duration: fixed(2) }),
  emptyStep({ id: "T4", order: 40, name: "Contrôle assise", execution_phase_id: "t_ctrl", kind: "control" }),
  emptyStep({ id: "T5", order: 50, name: "Réception plateforme", execution_phase_id: "t_hand" }),
];

// ---------------------------------------------------------------------------
// Fixture Maçonnerie
// ---------------------------------------------------------------------------
const MAC_PHASES: PrepExecutionPhaseDTO[] = [
  { id: "m_prep", label: "Implantation", role: "PREPARATION", order: 10 },
  {
    id: "m_fond",
    label: "Fondations",
    role: "EXECUTION",
    order: 20,
    depends_on: ["m_prep"],
  },
  {
    id: "m_elev",
    label: "Élévation des murs",
    role: "EXECUTION",
    order: 30,
    depends_on: ["m_fond"],
  },
  {
    id: "m_fin",
    label: "Enduits",
    role: "FINISH",
    order: 40,
    depends_on: ["m_elev"],
  },
  {
    id: "m_ctrl",
    label: "Contrôle verticalité",
    role: "CONTROL",
    order: 50,
    depends_on: ["m_fin"],
  },
  {
    id: "m_hand",
    label: "Remise gros œuvre",
    role: "HANDOVER",
    order: 60,
    depends_on: ["m_ctrl"],
  },
];

const MAC_STEPS = [
  emptyStep({ id: "M1", order: 10, name: "Implantation axes", execution_phase_id: "m_prep" }),
  emptyStep({ id: "M2", order: 20, name: "Semelles", execution_phase_id: "m_fond", duration: fixed(1) }),
  emptyStep({ id: "M3", order: 30, name: "Élévation", execution_phase_id: "m_elev", duration: fixed(2) }),
  emptyStep({ id: "M4", order: 40, name: "Enduits", execution_phase_id: "m_fin" }),
  emptyStep({ id: "M5", order: 50, name: "Contrôle", execution_phase_id: "m_ctrl", kind: "control" }),
  emptyStep({ id: "M6", order: 60, name: "Remise", execution_phase_id: "m_hand" }),
];

// ---------------------------------------------------------------------------
// Fixture opaque Alpha / Bravo / Charlie — prouve l'absence de lexical métier
// ---------------------------------------------------------------------------
const OPAQUE_PHASES: PrepExecutionPhaseDTO[] = [
  { id: "phase_alpha", label: "Phase Alpha", role: "PREPARATION", order: 10 },
  {
    id: "phase_bravo",
    label: "Phase Bravo",
    role: "EXECUTION",
    order: 20,
    depends_on: ["phase_alpha"],
  },
  {
    id: "phase_charlie",
    label: "Phase Charlie",
    role: "CONTROL",
    order: 30,
    depends_on: ["phase_bravo"],
  },
];

const OPAQUE_STEPS = [
  emptyStep({ id: "T1", order: 10, name: "T1", execution_phase_id: "phase_alpha" }),
  emptyStep({ id: "T2", order: 20, name: "T2", execution_phase_id: "phase_bravo", duration: fixed(1) }),
  emptyStep({
    id: "T3",
    order: 30,
    name: "T3",
    execution_phase_id: "phase_charlie",
    kind: "control",
  }),
];

function runStructuredFixture(
  label: string,
  phases: PrepExecutionPhaseDTO[],
  steps: PrepWorkflowStepDTO[],
  chain: string[],
) {
  const workflowJson = { execution_phases: phases, steps };
  const parsed = parsePrepWorkflow(workflowJson);
  assert.equal(parsed.execution_phases.length, phases.length, label);
  assert.ok(parsed.steps.every((s) => s.execution_phase_id), label);

  const result = computeSchedule({
    workflowSteps: parsed.steps,
    schedule: scheduleFor(parsed.steps),
    resources: emptyResources,
    qtyOf: () => 1,
    executionPhases: parsed.execution_phases,
  });
  assert.equal(result.errors.length, 0, `${label}: ${result.errors.join(";")}`);
  assert.equal(result.placed.length, steps.length, label);

  for (let i = 0; i < chain.length - 1; i++) {
    assertPhaseOrder(result.placed, chain[i]!, chain[i + 1]!);
  }

  // Toutes structurées
  for (const s of parsed.steps) {
    const src = resolvePlanningTaskSource({
      stepId: s.id,
      stepName: s.name,
      stepKind: s.kind,
      executionPhaseId: s.execution_phase_id,
      executionPhases: parsed.execution_phases,
      line: { code: s.id, validatedQuantity: 1, unit: "U" },
    });
    assert.equal(src.structureClass, "structured", `${label} ${s.id}`);
    assert.equal(src.phaseSource, "execution_phase", `${label} ${s.id}`);
  }

  const consistency = analyzeScheduleConsistency(
    result.placed.map((p) => {
      const s = parsed.steps.find((x) => x.id === p.stepId)!;
      const src = resolvePlanningTaskSource({
        stepId: s.id,
        stepName: s.name,
        stepKind: s.kind,
        executionPhaseId: s.execution_phase_id,
        executionPhases: parsed.execution_phases,
      });
      return {
        stepCode: p.stepId,
        name: p.name,
        lot: src.phase.label,
        kind: p.kind,
        startDate: p.startDate,
        endDate: p.endDate,
        startHalf: p.start.half,
        endHalf: p.end.half,
        durationDays: p.duration.durationDays,
        dependsOn: (p.dependsOn ?? []).map((d) => ({
          step_id: d.stepId,
          type: d.type as "FS",
          lag_days: d.lagDays ?? 0,
        })),
        executionPhaseId: s.execution_phase_id,
        structureClass: src.structureClass,
      };
    }),
  );
  assert.equal(consistency.structuredTasks, steps.length, label);
  assert.equal(consistency.unstructuredTasks, 0, label);
  assert.ok(
    !consistency.warnings.some((w) => w.code === "UNSTRUCTURED_EXECUTION_TASK"),
    label,
  );

  console.log(`OK ${label}: ${result.placed.map((p) => p.stepId).join(" → ")} duration=${result.baseDurationWorkingDays}`);
  return result;
}

// --- Tests ---
console.log("=== Structure d'exécution générique ===");

runStructuredFixture("électricité", ELEC_PHASES, ELEC_STEPS, [
  "E1",
  "E2",
  "E3",
  "E4",
  "E6",
  "E7",
]);

runStructuredFixture("terrassement", TERR_PHASES, TERR_STEPS, [
  "T1",
  "T2",
  "T3",
  "T4",
  "T5",
]);

runStructuredFixture("maçonnerie", MAC_PHASES, MAC_STEPS, [
  "M1",
  "M2",
  "M3",
  "M4",
  "M5",
  "M6",
]);

const opaque = runStructuredFixture("opaque Alpha/Bravo/Charlie", OPAQUE_PHASES, OPAQUE_STEPS, [
  "T1",
  "T2",
  "T3",
]);
assertControlAfterWorks(opaque.placed, "T3", ["T2"]);

// Parse round-trip opaque — le moteur n'a pas besoin de comprendre les mots
const opaqueParsed = parsePrepWorkflow({
  execution_phases: OPAQUE_PHASES,
  steps: OPAQUE_STEPS,
});
assert.equal(opaqueParsed.execution_phases[0]!.label, "Phase Alpha");
assert.equal(opaqueParsed.steps[1]!.execution_phase_id, "phase_bravo");

// Commercial section / takeoff lot NE déterminent PAS seuls la chronologie
// quand execution_phases est présent
{
  const result = computeSchedule({
    workflowSteps: OPAQUE_STEPS.map((s) => ({
      ...s,
      lot: "LOT COMMERCIAL INVERSÉ QUI DIRAIT DÉPOSE",
      name: s.name, // T1/T2/T3 opaques
    })),
    schedule: scheduleFor(OPAQUE_STEPS),
    resources: emptyResources,
    qtyOf: () => 1,
    executionPhases: OPAQUE_PHASES,
  });
  assertPhaseOrder(result.placed, "T1", "T2");
  assertPhaseOrder(result.placed, "T2", "T3");
  console.log("OK commercial/lot n'écrasent pas execution_phases");
}

// Quantity non-régression (validated → dry-run)
{
  const src = resolvePlanningTaskSource({
    stepId: "S-Q04-02",
    stepName: "Prises",
    executionPhaseId: "ph_appareillage",
    executionPhases: ELEC_PHASES,
    line: {
      code: "Q04-02",
      validatedQuantity: 6,
      unit: "U",
    },
  });
  assert.equal(src.quantity, 6);
  assert.equal(src.quantityProvenance, "VALIDATED");
  assert.equal(src.structureClass, "structured");
  console.log("OK quantity propagation + execution_phase");
}

// Safe merge non-régression
{
  const merged = mergeTaskOnRegeneration(
    {
      stepCode: "T2",
      driverTakeoffCode: "X",
      quantitySnapshot: 1,
      quantityUnit: "U",
      lot: "Phase Bravo",
      name: "T2",
      kind: "work",
      description: "fresh",
      takeoffCodesJson: ["X"],
      dependsOnJson: [],
      preconditionsJson: [],
      controlsJson: [],
      constraintsJson: [],
      safetyJson: [],
      equipmentJson: [],
      suppliesJson: [],
      rateId: null,
      rateValue: null,
      rateUnit: null,
      ratePer: null,
      parallelUnits: 1,
      durationMode: "fixed",
      durationDays: 1,
      crewJson: [],
    },
    {
      stepCode: "T2",
      driverTakeoffCode: "X",
      crewJson: { crew_id: "CREW-A", crew_size: 2 },
      equipmentJson: [{ equipment_id: "e1", count: 1 }],
      suppliesJson: [],
      preconditionsJson: ["P1"],
      controlsJson: ["C1"],
      constraintsJson: [],
      safetyJson: ["S1"],
      description: "manuel",
      rateId: "r1",
      rateValue: 10,
      rateUnit: "U/j",
      ratePer: "equipe",
      parallelUnits: 1,
      durationMode: "fixed",
      durationDays: 1,
      durationLockedByUser: true,
      computedDurationDays: 1,
    },
  );
  assert.ok(merged.preserved.includes("crewJson"));
  assert.equal(merged.durationLockedByUser, true);
  assert.equal(merged.description, "manuel");
  console.log("OK safe merge");
}

// CTX-04 non-régression
{
  const ctx = evaluatePlanningStudyVersionSync({
    hasPlan: true,
    currentStudyVersion: 5,
    studyVersionAtGeneration: 1,
  });
  assert.equal(ctx.syncState, "MODIFICATION_DISPONIBLE");
  console.log("OK CTX-04");
}

// Unstructured warning sur tâche generic sans phase
{
  const steps = [
    emptyStep({
      id: "U1",
      order: 10,
      name: "Tâche opaque sans phase",
      execution_phase_id: null,
      lot: null,
    }),
  ];
  // remove execution_phase_id
  delete (steps[0] as { execution_phase_id?: string | null }).execution_phase_id;
  const src = resolvePlanningTaskSource({
    stepId: "U1",
    stepName: "Tâche opaque sans phase",
    line: { code: "U1", validatedQuantity: 1, unit: "U" },
  });
  assert.equal(src.structureClass, "unstructured");
  const c = analyzeScheduleConsistency([
    {
      stepCode: "U1",
      name: "Tâche opaque sans phase",
      lot: null,
      kind: "work",
      startDate: "2026-10-12",
      endDate: "2026-10-12",
      startHalf: 0,
      endHalf: 0,
      durationDays: 0.5,
      dependsOn: [],
      structureClass: "unstructured",
    },
  ]);
  assert.ok(
    c.warnings.some((w) => w.code === "UNSTRUCTURED_EXECUTION_TASK"),
  );
  assert.equal(c.unstructuredTasks, 1);
  console.log("OK UNSTRUCTURED_EXECUTION_TASK");
}

// Pas de cycle sur opaque
{
  const deps = new Map(
    opaque.placed.map((p) => [
      p.stepId,
      (p.dependsOn ?? []).map((d) => ({ step_id: d.stepId })),
    ]),
  );
  assert.equal(detectDependencyCycle(deps).hasCycle, false);
}

// =========================================================================
// PHASE BARRIER — Tests A / B / C
// =========================================================================

function instantKey(p: { startDate: string | null; start: { half: number }; endDate: string | null; end: { half: number } }, which: "start" | "end") {
  if (which === "start") return `${p.startDate}|${p.start.half}`;
  return `${p.endDate}|${p.end.half}`;
}

// TEST A — parallèle de durées différentes : B attend A2 (3j), pas seulement le dernier order
{
  const phases: PrepExecutionPhaseDTO[] = [
    { id: "ph_a", label: "Phase A", role: "EXECUTION", order: 10 },
    { id: "ph_b", label: "Phase B", role: "EXECUTION", order: 20, depends_on: ["ph_a"] },
  ];
  const steps = [
    emptyStep({ id: "A1", order: 10, name: "A1", execution_phase_id: "ph_a", duration: fixed(0.5), crew_id: "crew-a1" }),
    emptyStep({ id: "A2", order: 20, name: "A2", execution_phase_id: "ph_a", duration: fixed(3), crew_id: "crew-a2" }),
    emptyStep({ id: "A3", order: 30, name: "A3", execution_phase_id: "ph_a", duration: fixed(1), crew_id: "crew-a3" }),
    emptyStep({ id: "B1", order: 40, name: "B1", execution_phase_id: "ph_b", duration: fixed(0.5), crew_id: "crew-b1" }),
  ];
  const topo = computePhaseTopology("ph_a", steps.slice(0, 3));
  assert.deepEqual(topo.terminalTasks.sort(), ["A1", "A2", "A3"]);
  assert.deepEqual(topo.entryTasks.sort(), ["A1", "A2", "A3"]);

  const result = computeSchedule({
    workflowSteps: steps,
    schedule: scheduleFor(steps),
    resources: emptyResources,
    qtyOf: () => 1,
    executionPhases: phases,
  });
  assert.equal(result.errors.length, 0);
  const a2 = result.placed.find((p) => p.stepId === "A2")!;
  const b1 = result.placed.find((p) => p.stepId === "B1")!;
  assert.ok(a2.endDate && b1.startDate);
  // B1 ne démarre pas avant fin A2
  assert.ok(
    instantKey(a2, "end") <= instantKey(b1, "start") ||
      (a2.endDate === b1.startDate && a2.end.half <= b1.start.half),
    `B1 (${instantKey(b1, "start")}) doit attendre fin A2 (${instantKey(a2, "end")})`,
  );
  // B1 dépend explicitement de A1, A2, A3 (barrière)
  const bPreds = new Set((b1.dependsOn ?? []).map((d) => d.stepId));
  assert.ok(bPreds.has("A1") && bPreds.has("A2") && bPreds.has("A3"), "barrière complète");
  // Durée chantier ≥ 3.5 j (A2=3 + B1=0.5) — A3=1 ne suffit pas
  assert.ok(
    (result.baseDurationWorkingDays ?? 0) >= 3.5,
    `durée=${result.baseDurationWorkingDays} doit être ≥ 3.5`,
  );
  console.log("OK TEST A — B attend A2 (3j), pas seulement dernier order");
}

// TEST B — graphe interne : terminal = A2 + A3
{
  const phases: PrepExecutionPhaseDTO[] = [
    { id: "ph_a", label: "Phase A", role: "EXECUTION", order: 10 },
    { id: "ph_b", label: "Phase B", role: "EXECUTION", order: 20, depends_on: ["ph_a"] },
  ];
  const steps = [
    emptyStep({ id: "A1", order: 10, name: "A1", execution_phase_id: "ph_a", duration: fixed(0.5) }),
    emptyStep({ id: "A2", order: 20, name: "A2", execution_phase_id: "ph_a", duration: fixed(2) }),
    emptyStep({ id: "A3", order: 30, name: "A3", execution_phase_id: "ph_a", duration: fixed(0.5) }),
    emptyStep({ id: "B1", order: 40, name: "B1", execution_phase_id: "ph_b", duration: fixed(0.5) }),
  ];
  // A1 → A3 explicite ; A2 indépendant
  const schedule: PrepScheduleDTO = {
    start_date: "2026-10-12",
    calendar: {
      working_days: [1, 2, 3, 4, 5],
      holidays: "FR_METROPOLE",
      granularity_days: 0.5,
    },
    tasks: [
      { step_id: "A1", depends_on: [] },
      { step_id: "A2", depends_on: [] },
      { step_id: "A3", depends_on: [{ step_id: "A1", type: "FS", lag_days: 0 }] },
      { step_id: "B1", depends_on: [] },
    ],
  };
  const topo = computePhaseTopology(
    "ph_a",
    steps.slice(0, 3).map((s) => ({
      ...s,
      depends_on:
        s.id === "A3" ? [{ step_id: "A1" }] : [],
    })),
  );
  assert.deepEqual(topo.terminalTasks.sort(), ["A2", "A3"]);
  assert.deepEqual(topo.entryTasks.sort(), ["A1", "A2"]);

  const barrier = buildExplicitPhaseDependencies({
    phases,
    steps: steps.map((s) => ({
      id: s.id,
      order: s.order,
      execution_phase_id: s.execution_phase_id,
      depends_on:
        s.id === "A3" ? [{ step_id: "A1" }] : [],
    })),
  });
  const bDeps = (barrier.get("B1") ?? []).map((d) => d.step_id).sort();
  assert.deepEqual(bDeps, ["A2", "A3"]);

  const result = computeSchedule({
    workflowSteps: steps,
    schedule,
    resources: emptyResources,
    qtyOf: () => 1,
    executionPhases: phases,
  });
  const a2 = result.placed.find((p) => p.stepId === "A2")!;
  const a3 = result.placed.find((p) => p.stepId === "A3")!;
  const b1 = result.placed.find((p) => p.stepId === "B1")!;
  assert.ok(instantKey(a2, "end") <= instantKey(b1, "start") || a2.endDate! <= b1.startDate!);
  assert.ok(instantKey(a3, "end") <= instantKey(b1, "start") || a3.endDate! <= b1.startDate!);
  console.log("OK TEST B — B attend A2 ET A3 (terminaux)");
}

// TEST C — plusieurs entry tasks B
{
  const phases: PrepExecutionPhaseDTO[] = [
    { id: "ph_a", label: "Phase A", role: "EXECUTION", order: 10 },
    { id: "ph_b", label: "Phase B", role: "EXECUTION", order: 20, depends_on: ["ph_a"] },
  ];
  const steps = [
    emptyStep({ id: "A1", order: 10, name: "A1", execution_phase_id: "ph_a", duration: fixed(2) }),
    emptyStep({ id: "B1", order: 20, name: "B1", execution_phase_id: "ph_b", duration: fixed(0.5) }),
    emptyStep({ id: "B2", order: 30, name: "B2", execution_phase_id: "ph_b", duration: fixed(0.5) }),
    emptyStep({ id: "B3", order: 40, name: "B3", execution_phase_id: "ph_b", duration: fixed(0.5) }),
    emptyStep({ id: "B4", order: 50, name: "B4", execution_phase_id: "ph_b", duration: fixed(0.5) }),
  ];
  const schedule: PrepScheduleDTO = {
    start_date: "2026-10-12",
    calendar: {
      working_days: [1, 2, 3, 4, 5],
      holidays: "FR_METROPOLE",
      granularity_days: 0.5,
    },
    tasks: [
      { step_id: "A1", depends_on: [] },
      { step_id: "B1", depends_on: [] },
      { step_id: "B2", depends_on: [] },
      { step_id: "B3", depends_on: [] },
      { step_id: "B4", depends_on: [{ step_id: "B3", type: "FS", lag_days: 0 }] },
    ],
  };
  const topoB = computePhaseTopology(
    "ph_b",
    steps.slice(1).map((s) => ({
      ...s,
      depends_on: s.id === "B4" ? [{ step_id: "B3" }] : [],
    })),
  );
  assert.deepEqual(topoB.entryTasks.sort(), ["B1", "B2", "B3"]);
  assert.deepEqual(topoB.terminalTasks.sort(), ["B1", "B2", "B4"]);

  const result = computeSchedule({
    workflowSteps: steps,
    schedule,
    resources: emptyResources,
    qtyOf: () => 1,
    executionPhases: phases,
  });
  const a1 = result.placed.find((p) => p.stepId === "A1")!;
  for (const id of ["B1", "B2", "B3"]) {
    const b = result.placed.find((p) => p.stepId === id)!;
    assert.ok(
      a1.endDate! <= b.startDate! ||
        (a1.endDate === b.startDate && a1.end.half <= b.start.half),
      `${id} ne démarre pas avant fin A1`,
    );
    const preds = new Set((b.dependsOn ?? []).map((d) => d.stepId));
    assert.ok(preds.has("A1"), `${id} barrière A1`);
  }
  // B4 n'est pas entry — barrière via B3 explicite, pas forcément arc direct A1→B4
  const b4 = result.placed.find((p) => p.stepId === "B4")!;
  assert.ok(a1.endDate! <= b4.startDate!);
  console.log("OK TEST C — entryTasks B1/B2/B3 barriérés ; B4 via B3");
}

console.log("\nPHASE BARRIER + STRUCTURE D'EXÉCUTION — TOUS TESTS PASSÉS");
