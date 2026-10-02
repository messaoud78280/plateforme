/**
 * Planning exécution — phases / deps / merge / consistency / resources.
 * Fixtures locales uniquement — aucune BDD.
 */
import assert from "node:assert/strict";
import { resolveCanonicalPhase, isDesignationLikeLot } from "./phase";
import {
  buildStructuralDependencies,
  detectDependencyCycle,
} from "./dependencies";
import {
  findEnrichment,
  indexEnrichments,
  mergeTaskOnRegeneration,
} from "./merge-tasks";
import { analyzeScheduleConsistency } from "./consistency";
import {
  computeSchedule,
  detectFragmentedLotFallback,
  resolveScheduleResourceKey,
} from "./compute";
import type {
  PrepResourcesDTO,
  PrepScheduleDTO,
  PrepWorkflowStepDTO,
} from "./types";
import {
  PLANNING_COMMIT_SUPPORTED_OPS,
  PLANNING_COMMIT_UNSUPPORTED_OPS,
  isPlanningCommitSupportedOp,
} from "@/lib/bework-patch/commit/planning-capability";
import { supportedOperationsForSection } from "@/lib/bework-patch/operations-catalog";
import { analyzeSourceIntegrity } from "./source-integrity";

// --- Phase : jamais lot = name ---
assert.equal(
  isDesignationLikeLot(
    "Séjour — Fourniture et pose de prises",
    "Séjour — Fourniture et pose de prises",
  ),
  true,
);
const ctrl = resolveCanonicalPhase({
  lot: "PHASE 1 — Installation & déposes",
  name: "Contrôles électriques, essais de fonctionnement et vérifications finales",
});
assert.equal(ctrl.role, "controls");
const clean = resolveCanonicalPhase({
  lot: "PHASE 1 — Installation & déposes",
  name: "Nettoyage de fin de chantier et remise de l'installation au client",
});
assert.equal(clean.role, "handover");
const prise = resolveCanonicalPhase({
  lot: "PHASE 1 — Installation & déposes",
  name: "Cuisine — Installation de prises de courant non spécialisées 16 A",
  commercialSection: "LOT 04 — PRISES DE COURANT ET APPAREILLAGES",
});
assert.ok(
  prise.role === "installation" ||
    /PRISE|APPAREILLAGE/i.test(prise.label) ||
    prise.role === "generic",
  `prise role unexpected: ${prise.role} / ${prise.label}`,
);
// Ne doit plus rester collé à « PHASE 1 — Installation & déposes » comme vérité d'exécution
assert.notEqual(prise.role, "demolition");
assert.notEqual(prise.role, "preparation");
const desig = resolveCanonicalPhase({
  lot: "Rebouchage des saignées et reprises localisées après encastrement",
  name: "Rebouchage des saignées et reprises localisées après encastrement",
});
assert.equal(desig.wasDesignationFallback, true);
assert.equal(desig.role, "finishes");
assert.equal(desig.label, "Finitions");
assert.notEqual(
  desig.label,
  "Rebouchage des saignées et reprises localisées après encastrement",
);

// --- Resource : désignation ≠ ressource exclusive ---
const stepDesig: PrepWorkflowStepDTO = {
  id: "S1",
  order: 1,
  name: "Rebouchage des saignées et reprises localisées après encastrement",
  lot: "Rebouchage des saignées et reprises localisées après encastrement",
  kind: "work",
  takeoff_ids: [],
  duration: { mode: "fixed", days: 1, calendar: "working", provenance: "HYPOTHESE" },
  crew: [],
  equipment: [],
  supplies: [],
  preconditions: [],
  controls_before_next: [],
  constraints: [],
  safety: [],
  proofs: [],
};
const rk = resolveScheduleResourceKey(stepDesig, null);
assert.equal(rk.key, "DEFAULT-A");

const stepCrew = { ...stepDesig, crew_id: "ELEC-A", lot: "Réseaux" };
assert.equal(resolveScheduleResourceKey(stepCrew, null).key, "CREW:ELEC-A");

// --- Merge safe ---
const prev = {
  stepCode: "S-A",
  driverTakeoffCode: "Q01",
  crewJson: { crew_id: "ELEC-A", crew_size: 2, members: [] },
  equipmentJson: [{ equipment_id: "esc", count: 1 }],
  suppliesJson: [],
  preconditionsJson: ["Zone accessible"],
  controlsJson: ["Continuité"],
  constraintsJson: [],
  safetyJson: ["EPI"],
  description: "Mode opératoire enrichi manuellement",
  rateId: "r1",
  rateValue: 15,
  rateUnit: "ml/j",
  ratePer: "equipe",
  parallelUnits: 1,
  durationMode: "computed",
  durationDays: 2,
  durationLockedByUser: false,
  computedDurationDays: 2,
};
const idx = indexEnrichments([prev]);
const found = findEnrichment(idx, "S-A", "Q01");
assert.ok(found);
const merged = mergeTaskOnRegeneration(
  {
    stepCode: "S-A",
    driverTakeoffCode: "Q01",
    quantitySnapshot: 80,
    quantityUnit: "ml",
    lot: "Réseaux",
    name: "Tirage",
    kind: "work",
    description: "Description source courte",
    takeoffCodesJson: ["Q01"],
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
  found,
);
assert.equal(merged.quantitySnapshot, 80);
assert.deepEqual(merged.crewJson, prev.crewJson);
assert.equal(merged.rateValue, 15);
assert.ok(merged.preserved.includes("crewJson"));
assert.ok(merged.preserved.includes("rate*"));

// Quantité change + crew conservé
assert.equal(merged.quantitySnapshot, 80);

// --- Dépendances structurelles + contrôle final ---
const steps = [
  { id: "A", name: "Distribution sous gaines", lot: "Réseaux", kind: "work" },
  { id: "B", name: "Pose prises séjour", lot: "Appareillage & pose", kind: "work" },
  { id: "C", name: "Contrôles électriques et vérifications finales", lot: "Contrôles", kind: "control" },
  { id: "D", name: "Nettoyage et remise au client", lot: "Remise", kind: "work" },
];
const deps = buildStructuralDependencies(steps);
assert.ok((deps.get("C") ?? []).some((d) => d.step_id === "A"));
assert.ok((deps.get("C") ?? []).some((d) => d.step_id === "B"));
assert.ok((deps.get("D") ?? []).some((d) => d.step_id === "C"));

// Cycle
const cycle = detectDependencyCycle(
  new Map([
    ["A", [{ step_id: "B" }]],
    ["B", [{ step_id: "A" }]],
  ]),
);
assert.equal(cycle.hasCycle, true);

// --- Schedule fixture MOREL-like : contrôle après travaux ---
const emptyRes: PrepResourcesDTO = {
  labor: [],
  equipment: [],
  supplies: [],
  rates: [],
};
const wf: PrepWorkflowStepDTO[] = [
  {
    id: "S-NET",
    order: 1,
    name: "Création de la distribution électrique générale sous gaines ICTA",
    lot: "PHASE 3 — Réseaux",
    kind: "work",
    takeoff_ids: ["Q03"],
    duration: { mode: "fixed", days: 1, calendar: "working", provenance: "HYPOTHESE" },
    crew: [],
    equipment: [],
    supplies: [],
    preconditions: [],
    controls_before_next: [],
    constraints: [],
    safety: [],
    proofs: [],
  },
  {
    id: "S-PRISE",
    order: 2,
    name: "Séjour — Fourniture et pose de prises de courant 16 A avec terre",
    lot: "PHASE 1 — Installation & déposes",
    kind: "work",
    takeoff_ids: ["Q04"],
    duration: { mode: "fixed", days: 0.5, calendar: "working", provenance: "HYPOTHESE" },
    crew: [],
    equipment: [],
    supplies: [],
    preconditions: [],
    controls_before_next: [],
    constraints: [],
    safety: [],
    proofs: [],
  },
  {
    id: "S-CTRL",
    order: 3,
    name: "Contrôles électriques, essais de fonctionnement et vérifications finales",
    lot: "PHASE 3 — Réseaux",
    kind: "control",
    takeoff_ids: ["Q08"],
    duration: { mode: "fixed", days: 1, calendar: "working", provenance: "HYPOTHESE" },
    crew: [],
    equipment: [],
    supplies: [],
    preconditions: [],
    controls_before_next: [],
    constraints: [],
    safety: [],
    proofs: [],
  },
  {
    id: "S-CLEAN",
    order: 4,
    name: "Nettoyage de fin de chantier et remise de l'installation au client",
    lot: "PHASE 1 — Installation & déposes",
    kind: "work",
    takeoff_ids: ["Q09"],
    duration: { mode: "fixed", days: 0.5, calendar: "working", provenance: "HYPOTHESE" },
    crew: [],
    equipment: [],
    supplies: [],
    preconditions: [],
    controls_before_next: [],
    constraints: [],
    safety: [],
    proofs: [],
  },
];
const sched: PrepScheduleDTO = {
  start_date: "2026-10-12",
  start_date_provenance: "HYPOTHESE",
  calendar: { working_days: [1, 2, 3, 4, 5], holidays: "FR_METROPOLE", granularity_days: 0.5 },
  tasks: wf.map((s) => ({
    step_id: s.id,
    depends_on: [],
    include_in_base: true,
  })),
};
const result = computeSchedule({
  workflowSteps: wf,
  schedule: sched,
  resources: emptyRes,
  qtyOf: () => null,
});
assert.equal(result.errors.length, 0);
const byId = new Map(result.placed.map((p) => [p.stepId, p]));
const net = byId.get("S-NET")!;
const priseT = byId.get("S-PRISE")!;
const ctrlT = byId.get("S-CTRL")!;
const cleanT = byId.get("S-CLEAN")!;
assert.ok(ctrlT.startDate && net.endDate);
assert.ok(
  `${ctrlT.startDate}|${ctrlT.start.half}` >= `${net.endDate}|${net.end.half}` ||
    `${ctrlT.startDate}|${ctrlT.start.half}` > `${net.endDate}|0`,
  "contrôle après réseaux",
);
assert.ok(
  `${ctrlT.startDate}|${ctrlT.start.half}` >= `${priseT.endDate}|${priseT.end.half}` ||
    `${ctrlT.startDate}` > `${priseT.endDate}`,
  "contrôle après pose",
);
assert.ok(
  `${cleanT.startDate}` >= `${ctrlT.endDate}`,
  "remise après contrôle",
);
assert.equal(cleanT.lot, "Remise");
assert.equal(ctrlT.lot, "Contrôles");

// Même crew : pas de chevauchement
const wfCrew: PrepWorkflowStepDTO[] = [
  { ...wf[0]!, id: "C1", crew_id: "ELEC-A", name: "Tâche 1 réseaux" },
  { ...wf[1]!, id: "C2", crew_id: "ELEC-A", name: "Tâche 2 prises" },
];
const schedCrew: PrepScheduleDTO = {
  ...sched,
  tasks: [
    { step_id: "C1", depends_on: [], include_in_base: true },
    { step_id: "C2", depends_on: [], include_in_base: true },
  ],
};
const rCrew = computeSchedule({
  workflowSteps: wfCrew,
  schedule: schedCrew,
  resources: emptyRes,
  qtyOf: () => null,
});
const c1 = rCrew.placed.find((p) => p.stepId === "C1")!;
const c2 = rCrew.placed.find((p) => p.stepId === "C2")!;
const overlap =
  `${c1.startDate}|${c1.start.half}` <= `${c2.endDate}|${c2.end.half}` &&
  `${c2.startDate}|${c2.start.half}` <= `${c1.endDate}|${c1.end.half}`;
assert.equal(overlap, false);

// Deux crews : parallélisme possible
const wf2: PrepWorkflowStepDTO[] = [
  { ...wf[0]!, id: "A1", crew_id: "ELEC-A", name: "A réseaux", lot: "Réseaux" },
  { ...wf[0]!, id: "B1", crew_id: "ELEC-B", name: "B réseaux", lot: "Réseaux" },
];
const r2 = computeSchedule({
  workflowSteps: wf2,
  schedule: {
    ...sched,
    tasks: [
      { step_id: "A1", depends_on: [], include_in_base: true },
      { step_id: "B1", depends_on: [], include_in_base: true },
    ],
  },
  resources: emptyRes,
  qtyOf: () => null,
});
assert.equal(r2.placed[0]!.startDate, r2.placed[1]!.startDate);

// Fragmentation
assert.equal(
  detectFragmentedLotFallback(
    [
      { ...stepDesig, id: "1", name: "A", lot: "A" },
      { ...stepDesig, id: "2", name: "B", lot: "B" },
      { ...stepDesig, id: "3", name: "C", lot: "C" },
      { ...stepDesig, id: "4", name: "D", lot: "D" },
    ],
    [
      { step_id: "1", depends_on: [], include_in_base: true },
      { step_id: "2", depends_on: [], include_in_base: true },
      { step_id: "3", depends_on: [], include_in_base: true },
      { step_id: "4", depends_on: [], include_in_base: true },
    ],
  ),
  true,
);

// Consistency CONTROL_BEFORE_WORK
const bad = analyzeScheduleConsistency([
  {
    stepCode: "CTRL",
    name: "Contrôles électriques et vérifications finales",
    lot: "Contrôles",
    kind: "control",
    startDate: "2026-10-14",
    endDate: "2026-10-14",
    startHalf: 0,
    endHalf: 1,
    durationDays: 1,
    dependsOn: [],
  },
  {
    stepCode: "WORK",
    name: "Pose prises",
    lot: "Appareillage & pose",
    kind: "work",
    startDate: "2026-10-15",
    endDate: "2026-10-15",
    startHalf: 0,
    endHalf: 0,
    durationDays: 0.5,
    dependsOn: [],
  },
]);
assert.equal(bad.ok, false);
assert.ok(bad.blockers.some((b) => b.code === "CONTROL_BEFORE_WORK"));

// Source integrity
const integ = analyzeSourceIntegrity({
  organizationId: "org1",
  project: { id: "p1", organizationId: "org1" },
  study: { id: "s1", projectId: "p1", organizationId: "org1", version: 1 },
  quote: {
    id: "q1",
    projectId: "p2",
    organizationId: "org1",
    sourcePrepStudyId: "s1",
  },
});
assert.equal(integ.ok, false);

// Contrat ChatGPT
const exposed = supportedOperationsForSection("PLANNING").map((o) => o.op);
assert.ok(exposed.includes("update_dependency"));
assert.ok(isPlanningCommitSupportedOp("update_dependency"));
for (const op of PLANNING_COMMIT_UNSUPPORTED_OPS) {
  assert.ok(!exposed.includes(op));
}
assert.ok(PLANNING_COMMIT_SUPPORTED_OPS.includes("update_dependency"));

console.log("schedule-execution-reorder.test.ts OK");
