/**
 * Structure d'exécution explicite (workflowJson.execution_phases).
 * Générique tous métiers — aucun hardcode électricité / terrassement / maçonnerie.
 *
 * commercial_section ≠ takeoff_group ≠ execution_phase.
 */

import type {
  ExecutionPhaseRole,
  PrepExecutionPhaseDTO,
  PrepWorkflowStepDTO,
} from "@/lib/preparation/schedule/types";
import type { CanonicalPhase, PhaseRole } from "@/lib/preparation/schedule/phase";
import { UNCLASSIFIED_PHASE } from "@/lib/preparation/schedule/phase";
import type { StructuralDep } from "@/lib/preparation/schedule/dependencies";

const EXEC_ROLE_TO_PHASE: Record<ExecutionPhaseRole, PhaseRole> = {
  PREPARATION: "preparation",
  DEMOLITION: "demolition",
  EXECUTION: "execution",
  FINISH: "finishes",
  CONTROL: "controls",
  HANDOVER: "handover",
  WAIT: "wait",
  LOGISTICS: "logistics",
  UNCLASSIFIED: "unclassified",
};

const PHASE_ROLE_ORDER: Record<PhaseRole, number> = {
  preparation: 10,
  logistics: 15,
  demolition: 20,
  execution: 35,
  networks: 30,
  installation: 40,
  finishes: 50,
  wait: 60,
  controls: 70,
  handover: 80,
  generic: 45,
  unclassified: 90,
};

const VALID_EXEC_ROLES = new Set<string>([
  "PREPARATION",
  "DEMOLITION",
  "EXECUTION",
  "FINISH",
  "CONTROL",
  "HANDOVER",
  "WAIT",
  "LOGISTICS",
  "UNCLASSIFIED",
]);

export function normalizeExecutionPhaseRole(
  raw: unknown,
): ExecutionPhaseRole {
  const s = String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  const aliases: Record<string, ExecutionPhaseRole> = {
    PREP: "PREPARATION",
    PREPARATION: "PREPARATION",
    DEMOLITION: "DEMOLITION",
    DEPOSE: "DEMOLITION",
    DÉPOSE: "DEMOLITION",
    EXECUTION: "EXECUTION",
    WORK: "EXECUTION",
    INSTALLATION: "EXECUTION",
    NETWORKS: "EXECUTION",
    FINISH: "FINISH",
    FINISHES: "FINISH",
    FINITION: "FINISH",
    FINITIONS: "FINISH",
    CONTROL: "CONTROL",
    CONTROLS: "CONTROL",
    HANDOVER: "HANDOVER",
    REMISE: "HANDOVER",
    WAIT: "WAIT",
    LOGISTICS: "LOGISTICS",
    UNCLASSIFIED: "UNCLASSIFIED",
  };
  const mapped = aliases[s];
  if (mapped) return mapped;
  if (VALID_EXEC_ROLES.has(s)) return s as ExecutionPhaseRole;
  return "UNCLASSIFIED";
}

export function executionRoleToPhaseRole(
  role: ExecutionPhaseRole,
): PhaseRole {
  return EXEC_ROLE_TO_PHASE[role] ?? "unclassified";
}

/** Construit une CanonicalPhase depuis une phase d'exécution explicite. */
export function canonicalPhaseFromExecution(
  phase: PrepExecutionPhaseDTO,
): CanonicalPhase {
  const role = executionRoleToPhaseRole(phase.role);
  return {
    label: phase.label.trim() || UNCLASSIFIED_PHASE,
    order: Number.isFinite(phase.order)
      ? phase.order
      : PHASE_ROLE_ORDER[role] ?? 90,
    role,
    wasDesignationFallback: false,
    source: "structured",
    executionPhaseId: phase.id,
    structureSource: "execution_phase",
  };
}

export type ExecutionStructureIndex = {
  phasesById: Map<string, PrepExecutionPhaseDTO>;
  stepPhase: Map<string, PrepExecutionPhaseDTO>;
  hasExplicitPhases: boolean;
};

export function indexExecutionStructure(
  phases: PrepExecutionPhaseDTO[],
  steps: Array<Pick<PrepWorkflowStepDTO, "id" | "execution_phase_id">>,
): ExecutionStructureIndex {
  const phasesById = new Map<string, PrepExecutionPhaseDTO>();
  for (const p of phases) {
    if (p.id) phasesById.set(p.id, p);
  }
  const stepPhase = new Map<string, PrepExecutionPhaseDTO>();
  for (const s of steps) {
    const pid = (s.execution_phase_id ?? "").trim();
    if (!pid) continue;
    const ph = phasesById.get(pid);
    if (ph) stepPhase.set(s.id, ph);
  }
  return {
    phasesById,
    stepPhase,
    hasExplicitPhases: phasesById.size > 0,
  };
}

export function isExecutionStructured(
  stepId: string,
  index: ExecutionStructureIndex,
): boolean {
  return index.stepPhase.has(stepId);
}

export type PhaseTopologyStep = {
  id: string;
  order: number;
  execution_phase_id?: string | null;
  kind?: string | null;
  /** Dépendances step-level déjà connues (schedule / explicites). */
  depends_on?: Array<{ step_id: string }>;
};

export type PhaseTopology = {
  phaseId: string;
  members: string[];
  internalPreds: Map<string, Set<string>>;
  internalSuccs: Map<string, Set<string>>;
  /** Aucun successeur interne à la phase. */
  terminalTasks: string[];
  /** Aucun prédécesseur interne à la phase. */
  entryTasks: string[];
};

/**
 * Pré-calcule la topologie d'une phase (O(membres + arcs internes)).
 */
export function computePhaseTopology(
  phaseId: string,
  members: PhaseTopologyStep[],
): PhaseTopology {
  const memberIds = new Set(members.map((m) => m.id));
  const internalPreds = new Map<string, Set<string>>();
  const internalSuccs = new Map<string, Set<string>>();
  for (const m of members) {
    internalPreds.set(m.id, new Set());
    internalSuccs.set(m.id, new Set());
  }
  for (const m of members) {
    for (const d of m.depends_on ?? []) {
      const pred = d.step_id;
      if (!memberIds.has(pred) || pred === m.id) continue;
      internalPreds.get(m.id)!.add(pred);
      internalSuccs.get(pred)!.add(m.id);
    }
  }
  const terminalTasks = members
    .filter((m) => (internalSuccs.get(m.id)?.size ?? 0) === 0)
    .map((m) => m.id)
    .sort();
  const entryTasks = members
    .filter((m) => (internalPreds.get(m.id)?.size ?? 0) === 0)
    .map((m) => m.id)
    .sort();
  return {
    phaseId,
    members: [...memberIds].sort(),
    internalPreds,
    internalSuccs,
    terminalTasks,
    entryTasks,
  };
}

/**
 * Barrière de phase : terminalTasks(A) → entryTasks(B).
 * Pas de produit cartésien sur tous les membres — seulement terminaux × entrées.
 */
export function linkPhaseBarrier(
  terminalTasksA: string[],
  entryTasksB: string[],
  add: (succ: string, pred: string) => void,
): void {
  for (const entry of entryTasksB) {
    for (const terminal of terminalTasksA) {
      add(entry, terminal);
    }
  }
}

/**
 * Graphe de dépendances depuis les phases explicites.
 *
 * PHASE BARRIER :
 * - Phase B depends_on [A] ⇒ entryTasks(B) ← terminalTasks(A)
 * - Plusieurs amonts ⇒ barrières cumulées
 * - CONTROL attend toutes les terminalTasks des phases travaux / depends_on
 * - HANDOVER attend CONTROL (sinon travaux)
 * - depends_on step-level explicites fusionnées en aval (mergeDependsOn)
 */
export function buildExplicitPhaseDependencies(input: {
  phases: PrepExecutionPhaseDTO[];
  steps: PhaseTopologyStep[];
}): Map<string, StructuralDep[]> {
  const index = indexExecutionStructure(input.phases, input.steps);
  const result = new Map<string, StructuralDep[]>();
  for (const s of input.steps) result.set(s.id, []);

  if (!index.hasExplicitPhases) return result;

  const stepsByPhase = new Map<string, PhaseTopologyStep[]>();
  for (const s of input.steps) {
    const pid = (s.execution_phase_id ?? "").trim();
    if (!pid || !index.phasesById.has(pid)) continue;
    const list = stepsByPhase.get(pid) ?? [];
    list.push(s);
    stepsByPhase.set(pid, list);
  }

  const topologyByPhase = new Map<string, PhaseTopology>();
  for (const [phaseId, members] of stepsByPhase) {
    topologyByPhase.set(phaseId, computePhaseTopology(phaseId, members));
  }

  const add = (succ: string, pred: string) => {
    if (succ === pred) return;
    const list = result.get(succ) ?? [];
    if (list.some((d) => d.step_id === pred && d.type === "FS")) return;
    list.push({ step_id: pred, type: "FS", lag_days: 0 });
    result.set(succ, list);
  };

  const applyBarrierFromPhases = (
    succPhaseId: string,
    predPhaseIds: string[],
  ) => {
    const succTopo = topologyByPhase.get(succPhaseId);
    if (!succTopo || !succTopo.entryTasks.length) return;
    for (const predId of predPhaseIds) {
      const predTopo = topologyByPhase.get(predId);
      if (!predTopo || !predTopo.terminalTasks.length) continue;
      linkPhaseBarrier(predTopo.terminalTasks, succTopo.entryTasks, add);
    }
  };

  const phasesSorted = [...input.phases].sort(
    (a, b) => a.order - b.order || a.id.localeCompare(b.id),
  );

  const workRoles = new Set<ExecutionPhaseRole>([
    "PREPARATION",
    "DEMOLITION",
    "EXECUTION",
    "FINISH",
    "LOGISTICS",
  ]);

  for (const ph of phasesSorted) {
    const explicitDeps = (ph.depends_on ?? []).filter((id) =>
      index.phasesById.has(id),
    );

    if (explicitDeps.length) {
      applyBarrierFromPhases(ph.id, explicitDeps);
      continue;
    }

    if (ph.role === "CONTROL") {
      const workPhaseIds = phasesSorted
        .filter((p) => workRoles.has(p.role) && p.id !== ph.id)
        .map((p) => p.id);
      applyBarrierFromPhases(ph.id, workPhaseIds);
      continue;
    }
    if (ph.role === "HANDOVER") {
      const controlIds = phasesSorted
        .filter((p) => p.role === "CONTROL")
        .map((p) => p.id);
      if (controlIds.length) {
        applyBarrierFromPhases(ph.id, controlIds);
      } else {
        const workPhaseIds = phasesSorted
          .filter((p) => workRoles.has(p.role))
          .map((p) => p.id);
        applyBarrierFromPhases(ph.id, workPhaseIds);
      }
      continue;
    }

    if (ph.role === "WAIT" || ph.role === "UNCLASSIFIED") {
      continue;
    }

    const prior = phasesSorted.filter(
      (p) =>
        p.order < ph.order &&
        p.role !== "WAIT" &&
        p.role !== "UNCLASSIFIED" &&
        p.role !== "CONTROL" &&
        p.role !== "HANDOVER",
    );
    if (prior.length) {
      applyBarrierFromPhases(ph.id, [prior[prior.length - 1]!.id]);
    }
  }

  return result;
}
