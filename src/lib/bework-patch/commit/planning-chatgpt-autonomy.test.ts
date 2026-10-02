/**
 * Autonomie pipeline PLANNING ChatGPT —
 * recalcul calendaire (phases) + contrats depends_on + round-trip champs.
 * Fixtures locales — aucune écriture BDD / MOREL.
 *
 * npx tsx src/lib/bework-patch/commit/planning-chatgpt-autonomy.test.ts
 */
import assert from "node:assert/strict";
import { computeSchedule } from "@/lib/preparation/schedule/compute";
import type {
  PrepExecutionPhaseDTO,
  PrepScheduleDTO,
  PrepWorkflowStepDTO,
} from "@/lib/preparation/schedule/types";
import {
  fieldContractsForOp,
  normalizeDependsOnJson,
  UPDATE_DEPENDENCY_DEPENDS_ON_CONTRACT,
} from "@/lib/bework-patch/operation-contracts";
import { supportedOperationsForSection } from "@/lib/bework-patch/operations-catalog";
import { parseBeworkPatch } from "@/lib/bework-patch/parse";

function fixed(days: number): PrepWorkflowStepDTO["duration"] {
  return { mode: "fixed", days, calendar: "working" };
}

function emptyStep(
  partial: Pick<PrepWorkflowStepDTO, "id" | "order" | "name"> &
    Partial<PrepWorkflowStepDTO>,
): PrepWorkflowStepDTO {
  return {
    lot: null,
    kind: "work",
    description: null,
    execution_phase_id: null,
    takeoff_ids: [],
    duration: fixed(0.5),
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
    ...partial,
  };
}

function place(input: {
  steps: PrepWorkflowStepDTO[];
  phases: PrepExecutionPhaseDTO[];
  deps?: PrepScheduleDTO["tasks"];
  start?: string;
}) {
  return computeSchedule({
    workflowSteps: input.steps,
    schedule: {
      start_date: input.start ?? "2026-10-26",
      calendar: {
        working_days: [1, 2, 3, 4, 5],
        holidays: "FR_METROPOLE",
        granularity_days: 0.5,
      },
      tasks:
        input.deps ??
        input.steps.map((s) => ({
          step_id: s.id,
          depends_on: [],
          include_in_base: true,
          crew_id: s.crew_id,
          parallelizable: s.parallelizable,
        })),
    },
    resources: { labor: [], equipment: [], supplies: [], rates: [] },
    qtyOf: () => null,
    executionPhases: input.phases,
  });
}

function iso(p: { startDate: string | null; endDate: string | null }) {
  return { start: p.startDate, end: p.endDate };
}

// --- A. crew exclusif : pas de chevauchement ---
{
  const phases: PrepExecutionPhaseDTO[] = [
    { id: "ph_a", label: "A", role: "execution", order: 10 },
  ];
  const steps = [
    emptyStep({
      id: "A1",
      order: 10,
      name: "Circuit A",
      execution_phase_id: "ph_a",
      duration: fixed(2),
      crew_id: "ELEC-A",
      crew_size: 2,
    }),
    emptyStep({
      id: "A2",
      order: 20,
      name: "Circuit B",
      execution_phase_id: "ph_a",
      duration: fixed(2),
      crew_id: "ELEC-A",
      crew_size: 2,
    }),
  ];
  const r = place({ steps, phases });
  assert.equal(r.errors.length, 0, r.errors.join("; "));
  const a1 = r.placed.find((p) => p.stepId === "A1")!;
  const a2 = r.placed.find((p) => p.stepId === "A2")!;
  assert.ok(a1.endDate && a2.startDate);
  // A2 ne démarre pas avant la fin de A1 (même crew)
  assert.ok(
    a2.startDate! >= a1.endDate!,
    `chevauchement crew: A1=${a1.endDate} A2=${a2.startDate}`,
  );
  console.log("A — crew exclusif sans chevauchement: ok");
}

// --- B. dependency FS ---
{
  const phases: PrepExecutionPhaseDTO[] = [
    { id: "ph_a", label: "A", role: "execution", order: 10 },
    { id: "ph_b", label: "B", role: "execution", order: 20 },
  ];
  const steps = [
    emptyStep({
      id: "A",
      order: 10,
      name: "A",
      execution_phase_id: "ph_a",
      duration: fixed(1),
    }),
    emptyStep({
      id: "B",
      order: 20,
      name: "B",
      execution_phase_id: "ph_b",
      duration: fixed(1),
    }),
  ];
  const r = place({
    steps,
    phases,
    deps: [
      { step_id: "A", depends_on: [], include_in_base: true },
      {
        step_id: "B",
        depends_on: [{ step_id: "A", type: "FS", lag_days: 0 }],
        include_in_base: true,
      },
    ],
  });
  assert.equal(r.errors.length, 0);
  const a = r.placed.find((p) => p.stepId === "A")!;
  const b = r.placed.find((p) => p.stepId === "B")!;
  assert.ok(b.startDate! >= a.endDate!, `FS violated ${a.endDate} → ${b.startDate}`);
  console.log("B — dependency FS: ok");
}

// --- C. changement durée → aval recalculé ---
{
  const phases: PrepExecutionPhaseDTO[] = [
    { id: "ph_a", label: "A", role: "execution", order: 10 },
    { id: "ph_b", label: "B", role: "execution", order: 20 },
  ];
  const mk = (daysA: number) =>
    place({
      steps: [
        emptyStep({
          id: "A",
          order: 10,
          name: "A",
          execution_phase_id: "ph_a",
          duration: fixed(daysA),
        }),
        emptyStep({
          id: "B",
          order: 20,
          name: "B",
          execution_phase_id: "ph_b",
          duration: fixed(0.5),
        }),
      ],
      phases,
      deps: [
        { step_id: "A", depends_on: [], include_in_base: true },
        {
          step_id: "B",
          depends_on: [{ step_id: "A", type: "FS", lag_days: 0 }],
          include_in_base: true,
        },
      ],
    });
  const before = mk(0.5);
  const after = mk(1);
  const b0 = before.placed.find((p) => p.stepId === "B")!;
  const b1 = after.placed.find((p) => p.stepId === "B")!;
  assert.ok(b1.startDate! > b0.startDate!, `aval non recalculé ${b0.startDate} vs ${b1.startDate}`);
  console.log("C — durée A 0.5→1 j déplace B: ok");
}

// --- D. round-trip champs + contrat depends_on ---
{
  const contracts = fieldContractsForOp("update_dependency");
  assert.equal(contracts.length, 1);
  assert.equal(contracts[0]!.field, "depends_on");
  assert.deepEqual(
    contracts[0]!.example,
    UPDATE_DEPENDENCY_DEPENDS_ON_CONTRACT.example,
  );

  const ops = supportedOperationsForSection("PLANNING");
  const depOp = ops.find((o) => o.op === "update_dependency");
  assert.ok(depOp?.field_contracts?.length);
  assert.equal(depOp!.field_contracts![0]!.field, "depends_on");

  const parsedDeps = normalizeDependsOnJson([
    { stepId: "ELEC-01", type: "FS", lagDays: 1 },
    { step_id: "ELEC-02", type: "SS", lag_days: 0 },
  ]);
  assert.deepEqual(parsedDeps, [
    { step_id: "ELEC-01", type: "FS", lag_days: 1 },
    { step_id: "ELEC-02", type: "SS", lag_days: 0 },
  ]);

  // Patch minimal valide selon le contrat exporté
  const example = UPDATE_DEPENDENCY_DEPENDS_ON_CONTRACT.minimal_operation_example;
  const patch = parseBeworkPatch({
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "patch_dep_contract_01",
    origin: {
      section: "PLANNING",
      project_id: "proj_1",
      entity_id: "plan_1",
      base_version: 1,
    },
    change_intent: "PLANNING_ADJUSTMENT",
    reason: "test contrat",
    operations: [
      {
        ...example,
        target: {
          ...example.target,
          plan_id: "plan_1",
          task_id: "task_remise",
        },
      },
    ],
  });
  assert.equal(patch.ok, true, patch.ok ? "" : patch.errors.map((e) => e.message).join("; "));

  // Round-trip sémantique : champs enrichissement exposés tels qu'écrits
  const written = {
    preconditions: ["Tableau hors tension"],
    controls: ["Mesure isolement"],
    safety: ["EPI gants"],
    depends_on: [{ step_id: "ELEC-CTRL-01", type: "FS" as const, lag_days: 0 }],
    equipment: [{ equipment_id: "multi", count: 1 }],
    supplies: [{ supply_id: "gaine", count: 2 }],
  };
  const restored = {
    preconditions: written.preconditions,
    controls: written.controls,
    safety: written.safety,
    depends_on: normalizeDependsOnJson(
      written.depends_on.map((d) => ({
        stepId: d.step_id,
        type: d.type,
        lagDays: d.lag_days,
      })),
    ),
    equipment: written.equipment,
    supplies: written.supplies,
  };
  assert.deepEqual(restored.preconditions, written.preconditions);
  assert.deepEqual(restored.controls, written.controls);
  assert.deepEqual(restored.safety, written.safety);
  assert.deepEqual(restored.depends_on, written.depends_on);
  assert.deepEqual(restored.equipment, written.equipment);
  assert.deepEqual(restored.supplies, written.supplies);
  console.log("D — contrat depends_on + round-trip champs: ok");
}

// --- E. MOREL-like dry-run : remise après exécution (phases) ---
{
  const phases: PrepExecutionPhaseDTO[] = [
    { id: "ph_prep", label: "Préparation", role: "preparation", order: 10 },
    { id: "ph_exec", label: "Exécution", role: "execution", order: 20 },
    { id: "ph_ctrl", label: "Contrôles", role: "control", order: 30 },
    { id: "ph_remise", label: "Remise", role: "handover", order: 40 },
  ];
  const steps = [
    emptyStep({
      id: "CMD-SDB",
      order: 10,
      name: "Commande SDB",
      execution_phase_id: "ph_prep",
      duration: fixed(0.5),
      crew_id: "ELEC-A",
    }),
    emptyStep({
      id: "CIRCUIT-PLAQUES",
      order: 20,
      name: "Circuit plaques",
      execution_phase_id: "ph_exec",
      duration: fixed(1),
      crew_id: "ELEC-A",
    }),
    emptyStep({
      id: "CIRCUIT-LV",
      order: 30,
      name: "Circuit lave-vaisselle",
      execution_phase_id: "ph_exec",
      duration: fixed(0.5),
      crew_id: "ELEC-A",
    }),
    emptyStep({
      id: "CTRL",
      order: 40,
      name: "Contrôles / essais",
      execution_phase_id: "ph_ctrl",
      kind: "control",
      duration: fixed(1),
      crew_id: "ELEC-A",
    }),
    emptyStep({
      id: "REMISE",
      order: 50,
      name: "Remise client",
      execution_phase_id: "ph_remise",
      duration: fixed(0.5),
    }),
  ];

  // Sans phases : leveling crew peut placer REMISE avant des circuits
  // (repro du bug). Avec phases : barrière structurelle.
  const withPhases = place({ steps, phases });
  assert.equal(withPhases.errors.length, 0, withPhases.errors.join("; "));

  const byId = new Map(withPhases.placed.map((p) => [p.stepId, p]));
  const remise = byId.get("REMISE")!;
  const plaques = byId.get("CIRCUIT-PLAQUES")!;
  const lv = byId.get("CIRCUIT-LV")!;
  const ctrl = byId.get("CTRL")!;

  assert.ok(remise.startDate && plaques.endDate && lv.endDate && ctrl.endDate);
  assert.ok(
    remise.startDate! >= plaques.endDate!,
    `remise avant plaques: ${JSON.stringify({
      remise: iso(remise),
      plaques: iso(plaques),
    })}`,
  );
  assert.ok(
    remise.startDate! >= lv.endDate!,
    `remise avant lave-vaisselle: ${JSON.stringify({
      remise: iso(remise),
      lv: iso(lv),
    })}`,
  );
  assert.ok(
    remise.startDate! >= ctrl.endDate!,
    `remise avant contrôles: ${JSON.stringify({
      remise: iso(remise),
      ctrl: iso(ctrl),
    })}`,
  );
  console.log("E — MOREL dry-run phases : remise après exécution: ok", {
    plaques: iso(plaques),
    lv: iso(lv),
    ctrl: iso(ctrl),
    remise: iso(remise),
  });
}

// --- E2. fallback legacy : remise après tâches generic (sans execution_phases) ---
{
  const steps = [
    emptyStep({
      id: "CIRCUIT-PLAQUES",
      order: 20,
      name: "Circuit plaques 32A",
      lot: "PHASE 02 — Réseaux",
      duration: fixed(1),
      crew_id: "ELEC-A",
    }),
    emptyStep({
      id: "CIRCUIT-LV",
      order: 30,
      name: "Circuit lave-vaisselle",
      lot: "PHASE 02 — Réseaux",
      duration: fixed(0.5),
      crew_id: "ELEC-A",
    }),
    emptyStep({
      id: "CTRL",
      order: 40,
      name: "Contrôles électriques et essais",
      kind: "control",
      lot: "PHASE 07 — Contrôles",
      duration: fixed(1),
      crew_id: "ELEC-A",
    }),
    emptyStep({
      id: "REMISE",
      order: 50,
      name: "Nettoyage et remise client",
      lot: "PHASE 08 — Remise",
      duration: fixed(0.5),
      crew_id: "ELEC-A",
    }),
  ];
  const legacy = place({ steps, phases: [] });
  assert.equal(legacy.errors.length, 0, legacy.errors.join("; "));
  const byId = new Map(legacy.placed.map((p) => [p.stepId, p]));
  const remise = byId.get("REMISE")!;
  const plaques = byId.get("CIRCUIT-PLAQUES")!;
  const lv = byId.get("CIRCUIT-LV")!;
  assert.ok(remise.startDate! >= plaques.endDate!, "remise avant plaques (legacy)");
  assert.ok(remise.startDate! >= lv.endDate!, "remise avant lave-vaisselle (legacy)");
  console.log("E2 — legacy generic → remise après exécution: ok", {
    plaques: iso(plaques),
    lv: iso(lv),
    remise: iso(remise),
  });
}

console.log("\nALL planning-chatgpt-autonomy tests passed");
