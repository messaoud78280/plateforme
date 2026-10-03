/**
 * Tests A–L — générateur de dépendances générique (pas de hardcode cuisine/SDB).
 * Aucune BDD.
 */
import assert from "node:assert/strict";
import {
  buildStructuralDependencies,
  detectDependencyCycle,
  reduceTransitiveDependencies,
  sanitizeInvertedRoleDependencies,
} from "./dependencies";
import { resolveCanonicalPhase } from "./phase";
import { analyzeScheduleConsistency } from "./consistency";
import { computeSchedule } from "./compute";
import type {
  PrepExecutionPhaseDTO,
  PrepResourcesDTO,
  PrepScheduleDTO,
  PrepWorkflowStepDTO,
} from "./types";

const emptyRes: PrepResourcesDTO = {
  labor: [],
  equipment: [],
  supplies: [],
  rates: [],
};

function fixed(days = 0.5): PrepWorkflowStepDTO["duration"] {
  return {
    mode: "fixed",
    days,
    calendar: "working",
    provenance: "HYPOTHESE",
  };
}

function step(
  id: string,
  name: string,
  opts: Partial<PrepWorkflowStepDTO> & { lot?: string } = {},
): PrepWorkflowStepDTO {
  return {
    id,
    order: opts.order ?? 1,
    name,
    lot: opts.lot ?? null,
    kind: opts.kind ?? "work",
    description: opts.description ?? null,
    execution_phase_id: opts.execution_phase_id ?? null,
    takeoff_ids: opts.takeoff_ids ?? [],
    duration: opts.duration ?? fixed(),
    crew: [],
    equipment: [],
    supplies: [],
    preconditions: [],
    controls_before_next: [],
    constraints: [],
    safety: [],
    proofs: [],
  };
}

function scheduleFor(
  steps: PrepWorkflowStepDTO[],
  deps: Record<string, string[]> = {},
): PrepScheduleDTO {
  return {
    start_date: "2026-10-12",
    start_date_provenance: "HYPOTHESE",
    calendar: {
      working_days: [1, 2, 3, 4, 5],
      holidays: "FR_METROPOLE",
      granularity_days: 0.5,
    },
    tasks: steps.map((s) => ({
      step_id: s.id,
      depends_on: (deps[s.id] ?? []).map((p) => ({
        step_id: p,
        type: "FS" as const,
        lag_days: 0,
      })),
      include_in_base: true,
    })),
  };
}

function consistencyOf(placed: ReturnType<typeof computeSchedule>["placed"]) {
  return analyzeScheduleConsistency(
    placed.map((t) => ({
      stepCode: t.stepId,
      name: t.name,
      lot: t.lot,
      kind: t.kind,
      description: t.description,
      startDate: t.startDate,
      endDate: t.endDate,
      startHalf: t.start.half,
      endHalf: t.end.half,
      durationDays: t.duration.durationDays,
      dependsOn: t.dependsOn.map((d) => ({
        step_id: d.stepId,
        type: "FS" as const,
        lag_days: 0,
      })),
    })),
  );
}

function assertNotBefore(
  placed: ReturnType<typeof computeSchedule>["placed"],
  earlyId: string,
  lateId: string,
  label: string,
) {
  const a = placed.find((p) => p.stepId === earlyId)!;
  const b = placed.find((p) => p.stepId === lateId)!;
  assert.ok(a && b, label);
  const ae = `${a.endDate}|${a.end.half}`;
  const bs = `${b.startDate}|${b.start.half}`;
  assert.ok(
    ae <= bs || a.endDate! < b.startDate!,
    `${label}: ${earlyId} doit finir avant/au début de ${lateId} (${ae} vs ${bs})`,
  );
}

// ---------------------------------------------------------------------------
// TEST A — PREPARATION → EXECUTION → HANDOVER
// ---------------------------------------------------------------------------
{
  const steps = [
    step("P", "Installation et préparation du chantier", {
      lot: "Préparation",
      order: 1,
    }),
    step("E", "Pose des réseaux et appareillages", {
      lot: "Réseaux",
      order: 2,
    }),
    step("H", "Nettoyage de fin de chantier et remise au client", {
      lot: "Remise",
      order: 3,
    }),
  ];
  // Inversion artificielle : travaux dépendent de la remise
  const deps = buildStructuralDependencies(
    steps.map((s) => ({
      id: s.id,
      name: s.name,
      lot: s.lot,
      kind: s.kind,
      order: s.order,
      depends_on:
        s.id === "E" ? [{ step_id: "H", type: "FS" as const }] : [],
    })),
  );
  assert.ok(
    !(deps.get("E") ?? []).some((d) => d.step_id === "H"),
    "A: HANDOVER ne reste pas prédécesseur d'EXECUTION",
  );
  assert.ok(
    (deps.get("H") ?? []).some((d) => d.step_id === "E"),
    "A: HANDOVER attend EXECUTION",
  );
  const r = computeSchedule({
    workflowSteps: steps,
    schedule: scheduleFor(steps, { E: ["H"] }),
    resources: emptyRes,
    qtyOf: () => null,
  });
  assert.equal(r.errors.length, 0, "A");
  assertNotBefore(r.placed, "E", "H", "A");
  const c = consistencyOf(r.placed);
  assert.equal(
    c.blockers.filter((b) => b.code === "HANDOVER_BEFORE_WORK").length,
    0,
    "A blockers",
  );
  console.log("OK TEST A — HANDOVER jamais prédécesseur auto d'EXECUTION");
}

// ---------------------------------------------------------------------------
// TEST B — EXECUTION → CONTROL FINAL → HANDOVER
// ---------------------------------------------------------------------------
{
  const steps = [
    step("E", "Distribution sous gaines", { lot: "Réseaux", order: 1 }),
    step("C", "Contrôles électriques et vérifications finales", {
      lot: "Contrôles",
      kind: "control",
      order: 2,
    }),
    step("H", "Remise de l'installation au client", {
      lot: "Remise",
      order: 3,
    }),
  ];
  const r = computeSchedule({
    workflowSteps: steps,
    schedule: scheduleFor(steps),
    resources: emptyRes,
    qtyOf: () => null,
  });
  assert.equal(r.errors.length, 0);
  assertNotBefore(r.placed, "E", "C", "B");
  assertNotBefore(r.placed, "C", "H", "B");
  console.log("OK TEST B — EXECUTION → CONTROL FINAL → HANDOVER");
}

// ---------------------------------------------------------------------------
// TEST C — CONTROL INTERMÉDIAIRE → EXECUTION B autorisé
// ---------------------------------------------------------------------------
{
  const phases: PrepExecutionPhaseDTO[] = [
    { id: "ph_a", label: "Travaux A", role: "EXECUTION", order: 10 },
    {
      id: "ph_ctrl",
      label: "Contrôle intermédiaire",
      role: "CONTROL",
      order: 20,
      depends_on: ["ph_a"],
    },
    {
      id: "ph_b",
      label: "Travaux B",
      role: "EXECUTION",
      order: 30,
      depends_on: ["ph_ctrl"],
    },
  ];
  const steps = [
    step("A", "Ouvrage A", { execution_phase_id: "ph_a", order: 1 }),
    step("CTRL", "Contrôle d'étanchéité avant reprise", {
      execution_phase_id: "ph_ctrl",
      kind: "control",
      order: 2,
    }),
    step("B", "Ouvrage B", { execution_phase_id: "ph_b", order: 3 }),
  ];
  const deps = buildStructuralDependencies(
    steps.map((s) => ({
      id: s.id,
      name: s.name,
      kind: s.kind,
      order: s.order,
      execution_phase_id: s.execution_phase_id,
      depends_on: [],
    })),
    phases,
  );
  assert.ok(
    (deps.get("B") ?? []).some((d) => d.step_id === "CTRL"),
    "C: B attend contrôle intermédiaire",
  );
  const r = computeSchedule({
    workflowSteps: steps,
    schedule: scheduleFor(steps),
    resources: emptyRes,
    qtyOf: () => null,
    executionPhases: phases,
  });
  assert.equal(r.errors.length, 0);
  assertNotBefore(r.placed, "A", "CTRL", "C");
  assertNotBefore(r.placed, "CTRL", "B", "C");
  const c = consistencyOf(r.placed);
  assert.equal(
    c.blockers.filter((b) => b.code === "CONTROL_BEFORE_WORK").length,
    0,
    "C: contrôle intermédiaire autorisé",
  );
  console.log("OK TEST C — CONTROL INTERMÉDIAIRE → EXECUTION B");
}

// ---------------------------------------------------------------------------
// TEST D — terminalTasks phase N → entryTasks phase N+1
// ---------------------------------------------------------------------------
{
  const phases: PrepExecutionPhaseDTO[] = [
    { id: "p1", label: "Phase 1", role: "EXECUTION", order: 10 },
    {
      id: "p2",
      label: "Phase 2",
      role: "EXECUTION",
      order: 20,
      depends_on: ["p1"],
    },
  ];
  const steps = [
    step("A1", "A1", { execution_phase_id: "p1", order: 1 }),
    step("A2", "A2", { execution_phase_id: "p1", order: 2 }),
    step("B1", "B1", { execution_phase_id: "p2", order: 3 }),
    step("B2", "B2", { execution_phase_id: "p2", order: 4 }),
  ];
  const deps = buildStructuralDependencies(
    steps.map((s) => ({
      id: s.id,
      name: s.name,
      order: s.order,
      execution_phase_id: s.execution_phase_id,
      depends_on:
        s.id === "A2"
          ? [{ step_id: "A1", type: "FS" as const }]
          : s.id === "B2"
            ? [{ step_id: "B1", type: "FS" as const }]
            : [],
    })),
    phases,
  );
  // entry B1 ← terminal A2 (pas produit cartésien A1×B1)
  assert.ok((deps.get("B1") ?? []).some((d) => d.step_id === "A2"));
  assert.ok(!(deps.get("B2") ?? []).some((d) => d.step_id === "A1"));
  console.log("OK TEST D — terminalTasks → entryTasks");
}

// ---------------------------------------------------------------------------
// TEST E — dépendances explicites préservées
// ---------------------------------------------------------------------------
{
  const steps = [
    step("A", "Fouilles", { lot: "Terrassements", order: 1 }),
    step("B", "Fondations", { lot: "Maçonnerie", order: 2 }),
    step("C", "Élévation", { lot: "Maçonnerie", order: 3 }),
  ];
  const deps = buildStructuralDependencies(
    steps.map((s) => ({
      id: s.id,
      name: s.name,
      lot: s.lot,
      order: s.order,
      depends_on:
        s.id === "B"
          ? [{ step_id: "A", type: "FS" as const }]
          : s.id === "C"
            ? [{ step_id: "B", type: "FS" as const }]
            : [],
    })),
  );
  assert.ok((deps.get("B") ?? []).some((d) => d.step_id === "A"));
  assert.ok((deps.get("C") ?? []).some((d) => d.step_id === "B"));
  console.log("OK TEST E — dépendances explicites préservées");
}

// ---------------------------------------------------------------------------
// TEST F — pas d'explosion transitive
// ---------------------------------------------------------------------------
{
  const raw = new Map([
    ["A", [] as { step_id: string; type: "FS" }[]],
    ["B", [{ step_id: "A", type: "FS" as const }]],
    [
      "C",
      [
        { step_id: "A", type: "FS" as const },
        { step_id: "B", type: "FS" as const },
      ],
    ],
    [
      "D",
      [
        { step_id: "A", type: "FS" as const },
        { step_id: "B", type: "FS" as const },
        { step_id: "C", type: "FS" as const },
      ],
    ],
  ]);
  const reduced = reduceTransitiveDependencies(raw);
  assert.deepEqual(
    (reduced.get("D") ?? []).map((d) => d.step_id).sort(),
    ["C"],
  );
  assert.deepEqual(
    (reduced.get("C") ?? []).map((d) => d.step_id).sort(),
    ["B"],
  );
  console.log("OK TEST F — réduction transitive");
}

// ---------------------------------------------------------------------------
// TEST G — regen avec enrichissements / deps inversées corrigées
// ---------------------------------------------------------------------------
{
  assert.equal(
    resolveCanonicalPhase({
      name: "Livraison et pose du mobilier",
      lot: "Cuisine",
    }).role,
    "generic",
    "G: livraison ≠ handover",
  );
  assert.equal(
    resolveCanonicalPhase({
      name: "Nettoyage des zones de travail",
      lot: "Cuisine",
    }).role,
    "generic",
    "G: nettoyage courant ≠ handover",
  );
  assert.equal(
    resolveCanonicalPhase({
      name: "Finitions, joints, essais et nettoyage de fin de chantier",
      lot: "Finitions",
    }).role,
    "finishes",
    "G: finitions+nettoyage ≠ handover",
  );
  assert.equal(
    resolveCanonicalPhase({
      name: "Contrôle étanchéité et essais",
      lot: "Cuisine",
    }).role,
    "generic",
    "G: contrôle intermédiaire texte ≠ controls final",
  );

  const steps = [
    step("S-Q03-01", "Livraison et pose du mobilier", {
      lot: "Finitions",
      order: 1,
    }),
    step("S-Q03-04", "Pose carrelage sol", { lot: "Finitions", order: 2 }),
    step("S-Q03-09", "Contrôles et vérifications finales", {
      lot: "Contrôles",
      kind: "control",
      order: 3,
    }),
    step("S-Q04-01", "Remise de l'ouvrage au client", {
      lot: "Remise",
      order: 4,
    }),
    step(
      "S-Q01-01",
      "Installation, protections et préparation du chantier",
      { lot: "Préparation", order: 5 },
    ),
  ];
  const r = computeSchedule({
    workflowSteps: steps,
    schedule: scheduleFor(steps, {
      "S-Q03-04": ["S-Q03-01"], // inversion si Q03-01 était faussement Remise
      "S-Q01-01": ["S-Q04-01", "S-Q03-09"],
    }),
    resources: emptyRes,
    qtyOf: () => null,
  });
  assert.equal(r.errors.length, 0);
  const c = consistencyOf(r.placed);
  assert.equal(
    c.blockers.filter(
      (b) =>
        b.code === "HANDOVER_BEFORE_WORK" || b.code === "CONTROL_BEFORE_WORK",
    ).length,
    0,
    `G blockers: ${c.blockers.map((b) => b.message).join("; ")}`,
  );
  console.log("OK TEST G — regen sans inversion de phases");
}

// ---------------------------------------------------------------------------
// TEST H — graphe cyclique → preview BLOCKED (computeSchedule errors)
// ---------------------------------------------------------------------------
{
  const cycle = detectDependencyCycle(
    new Map([
      ["A", [{ step_id: "B" }]],
      ["B", [{ step_id: "A" }]],
    ]),
  );
  assert.equal(cycle.hasCycle, true);
  const steps = [
    step("A", "Tâche A", { order: 1 }),
    step("B", "Tâche B", { order: 2 }),
  ];
  const r = computeSchedule({
    workflowSteps: steps,
    schedule: scheduleFor(steps, { A: ["B"], B: ["A"] }),
    resources: emptyRes,
    qtyOf: () => null,
  });
  assert.ok(r.errors.length > 0, "H: cycle → erreur compute");
  assert.equal(r.placed.length, 0);
  console.log("OK TEST H — cycle → preview bloquée");
}

// ---------------------------------------------------------------------------
// TEST I — fixture terrassement
// ---------------------------------------------------------------------------
{
  const phases: PrepExecutionPhaseDTO[] = [
    { id: "t_prep", label: "Préparation", role: "PREPARATION", order: 10 },
    {
      id: "t_exec",
      label: "Terrassement",
      role: "EXECUTION",
      order: 20,
      depends_on: ["t_prep"],
    },
    {
      id: "t_ctrl",
      label: "Contrôles",
      role: "CONTROL",
      order: 30,
      depends_on: ["t_exec"],
    },
    {
      id: "t_hand",
      label: "Remise",
      role: "HANDOVER",
      order: 40,
      depends_on: ["t_ctrl"],
    },
  ];
  const steps = [
    step("T1", "Installation chantier", {
      execution_phase_id: "t_prep",
      order: 1,
    }),
    step("T2", "Fouilles en pleine masse", {
      execution_phase_id: "t_exec",
      order: 2,
      duration: fixed(2),
    }),
    step("T3", "Contrôles de fond de fouille et vérifications finales", {
      execution_phase_id: "t_ctrl",
      kind: "control",
      order: 3,
    }),
    step("T4", "Remise au client", {
      execution_phase_id: "t_hand",
      order: 4,
    }),
  ];
  const r = computeSchedule({
    workflowSteps: steps,
    schedule: scheduleFor(steps),
    resources: emptyRes,
    qtyOf: () => null,
    executionPhases: phases,
  });
  assert.equal(r.errors.length, 0);
  assertNotBefore(r.placed, "T1", "T2", "I");
  assertNotBefore(r.placed, "T2", "T3", "I");
  assertNotBefore(r.placed, "T3", "T4", "I");
  assert.equal(consistencyOf(r.placed).blockers.length, 0, "I");
  console.log("OK TEST I — terrassement");
}

// ---------------------------------------------------------------------------
// TEST J — fixture maçonnerie
// ---------------------------------------------------------------------------
{
  const phases: PrepExecutionPhaseDTO[] = [
    { id: "m_demo", label: "Dépose", role: "DEMOLITION", order: 10 },
    {
      id: "m_exec",
      label: "Élévation",
      role: "EXECUTION",
      order: 20,
      depends_on: ["m_demo"],
    },
    {
      id: "m_fin",
      label: "Finitions",
      role: "FINISH",
      order: 30,
      depends_on: ["m_exec"],
    },
    {
      id: "m_hand",
      label: "Remise",
      role: "HANDOVER",
      order: 40,
      depends_on: ["m_fin"],
    },
  ];
  const steps = [
    step("M1", "Dépose cloisons", { execution_phase_id: "m_demo", order: 1 }),
    step("M2", "Élévation parpaings", {
      execution_phase_id: "m_exec",
      order: 2,
      duration: fixed(2),
    }),
    step("M3", "Enduits de finition", {
      execution_phase_id: "m_fin",
      order: 3,
    }),
    step("M4", "Remise de l'ouvrage au client", {
      execution_phase_id: "m_hand",
      order: 4,
    }),
  ];
  const r = computeSchedule({
    workflowSteps: steps,
    schedule: scheduleFor(steps),
    resources: emptyRes,
    qtyOf: () => null,
    executionPhases: phases,
  });
  assert.equal(r.errors.length, 0);
  assertNotBefore(r.placed, "M1", "M2", "J");
  assertNotBefore(r.placed, "M2", "M3", "J");
  assertNotBefore(r.placed, "M3", "M4", "J");
  console.log("OK TEST J — maçonnerie");
}

// ---------------------------------------------------------------------------
// TEST K — fixture électricité
// ---------------------------------------------------------------------------
{
  const steps = [
    step("K1", "Création de la distribution électrique sous gaines", {
      lot: "Réseaux",
      order: 1,
    }),
    step("K2", "Pose prises et appareillages", {
      lot: "Appareillage & pose",
      order: 2,
    }),
    step("K3", "Contrôles électriques et vérifications finales", {
      lot: "Contrôles",
      kind: "control",
      order: 3,
    }),
    step("K4", "Nettoyage de fin de chantier et remise au client", {
      lot: "Remise",
      order: 4,
    }),
  ];
  const r = computeSchedule({
    workflowSteps: steps,
    schedule: scheduleFor(steps, {
      // inversion type ChatGPT
      K1: ["K4"],
      K2: ["K3"],
    }),
    resources: emptyRes,
    qtyOf: () => null,
  });
  assert.equal(r.errors.length, 0);
  assertNotBefore(r.placed, "K1", "K3", "K");
  assertNotBefore(r.placed, "K2", "K3", "K");
  assertNotBefore(r.placed, "K3", "K4", "K");
  const blockers = consistencyOf(r.placed).blockers.filter(
    (b) =>
      b.code === "HANDOVER_BEFORE_WORK" || b.code === "CONTROL_BEFORE_WORK",
  );
  assert.equal(blockers.length, 0, blockers.map((b) => b.message).join("; "));
  console.log("OK TEST K — électricité");
}

// ---------------------------------------------------------------------------
// TEST L — rénovation multi-lots (générique, pas cuisine hardcodée)
// ---------------------------------------------------------------------------
{
  const steps = [
    step("L1", "Installation et préparation du chantier en site occupé", {
      lot: "Préparation",
      order: 1,
    }),
    step("L2", "Dépose des ouvrages existants", {
      lot: "Déposes",
      order: 2,
    }),
    step("L3", "Réseaux plomberie et électricité", {
      lot: "Réseaux",
      order: 3,
      duration: fixed(2),
    }),
    step("L4", "Pose revêtements et finitions", {
      lot: "Finitions",
      order: 4,
      duration: fixed(2),
    }),
    step("L5", "Contrôles globaux et vérifications finales", {
      lot: "Contrôles",
      kind: "control",
      order: 5,
    }),
    step("L6", "Remise de l'ouvrage au client", {
      lot: "Remise",
      order: 6,
    }),
  ];
  const r = computeSchedule({
    workflowSteps: steps,
    schedule: scheduleFor(steps, {
      L3: ["L6"], // inversion remise→travaux
      L4: ["L5"], // inversion contrôle final→finitions
      L1: ["L6", "L5"],
    }),
    resources: emptyRes,
    qtyOf: () => null,
  });
  assert.equal(r.errors.length, 0);
  assertNotBefore(r.placed, "L1", "L2", "L");
  assertNotBefore(r.placed, "L2", "L3", "L");
  assertNotBefore(r.placed, "L4", "L5", "L");
  assertNotBefore(r.placed, "L5", "L6", "L");
  const c = consistencyOf(r.placed);
  assert.equal(
    c.blockers.filter(
      (b) =>
        b.code === "HANDOVER_BEFORE_WORK" || b.code === "CONTROL_BEFORE_WORK",
    ).length,
    0,
    `L: ${c.blockers.map((b) => b.message).join("; ")}`,
  );

  // sanitize unitaire
  const phases = new Map(
    steps.map((s) => [
      s.id,
      resolveCanonicalPhase({ lot: s.lot, name: s.name, kind: s.kind }),
    ]),
  );
  const sanitized = sanitizeInvertedRoleDependencies(
    steps.map((s) => ({
      id: s.id,
      name: s.name,
      lot: s.lot,
      kind: s.kind,
      depends_on:
        s.id === "L3"
          ? [{ step_id: "L6", type: "FS" as const }]
          : s.id === "L4"
            ? [{ step_id: "L5", type: "FS" as const }]
            : [],
    })),
    phases,
  );
  assert.ok(!(sanitized.get("L3") ?? []).some((d) => d.step_id === "L6"));
  assert.ok(!(sanitized.get("L4") ?? []).some((d) => d.step_id === "L5"));
  console.log("OK TEST L — rénovation multi-lots");
}

console.log("\nOK — schedule-deps-inversion tests A–L");
