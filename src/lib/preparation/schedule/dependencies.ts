/**
 * Dépendances structurelles planning (phases / contrôles / remise).
 * Complète les depends_on explicites du workflow — n'invente pas de métier hors règles.
 *
 * Priorité :
 * 1. depends_on métier EXPLICITES — source de vérité pour le placement
 *    (purge uniquement des inversions dures : remise / contrôle final → travaux)
 * 2. execution_phases explicites (workflowJson) → graphe gate déterministe
 * 3. fallback legacy par rôle inféré (ROLE_SEQ) — n’écrase jamais une FS explicite
 * 4. réduction transitive (graphe minimal)
 *
 * IMPORTANT : une FS utilisateur ne doit jamais être effacée parce qu’un rôle
 * inféré (ex. « finishes ») est mal classé. Sinon computeSchedule ignore le
 * graphe persisté et les dates restent incohérentes (DEP_DATE_VIOLATION).
 */

import {
  hasFinalControlMarkers,
  resolveCanonicalPhase,
  type CanonicalPhase,
  type PhaseRole,
} from "@/lib/preparation/schedule/phase";
import {
  buildExplicitPhaseDependencies,
  canonicalPhaseFromExecution,
} from "@/lib/preparation/schedule/execution-structure";
import type { PrepExecutionPhaseDTO } from "@/lib/preparation/schedule/types";

export type StructuralDep = {
  step_id: string;
  type: "FS" | "SS" | "FF";
  lag_days?: number;
};

export type StructuralStep = {
  id: string;
  name: string;
  lot?: string | null;
  kind?: string | null;
  description?: string | null;
  order?: number;
  execution_phase_id?: string | null;
  depends_on?: StructuralDep[];
};

const ROLE_SEQ: PhaseRole[] = [
  "preparation",
  "logistics",
  "demolition",
  "networks",
  "execution",
  "installation",
  "finishes",
  "wait",
  "controls",
  "handover",
];

/** Rôles « travaux » — une remise / contrôle final ne doit jamais les précéder. */
export const WORK_PHASE_ROLES: PhaseRole[] = [
  "preparation",
  "logistics",
  "demolition",
  "networks",
  "execution",
  "installation",
  "finishes",
  "generic",
  "unclassified",
];

function roleIndex(role: PhaseRole): number {
  const i = ROLE_SEQ.indexOf(role);
  return i >= 0 ? i : 3; // generic ~ mid
}

export function mergeDependsOn(
  existing: StructuralDep[],
  extras: StructuralDep[],
): StructuralDep[] {
  const out = [...existing];
  const seen = new Set(
    existing.map((d) => `${d.step_id}|${d.type}|${d.lag_days ?? 0}`),
  );
  for (const d of extras) {
    const k = `${d.step_id}|${d.type}|${d.lag_days ?? 0}`;
    if (seen.has(k)) continue;
    out.push(d);
    seen.add(k);
  }
  return out;
}

function isWorkRole(role: PhaseRole): boolean {
  return WORK_PHASE_ROLES.includes(role);
}

const EXEC_WORK_ROLES = new Set([
  "EXECUTION",
  "FINISH",
  "DEMOLITION",
  "PREPARATION",
  "LOGISTICS",
]);

/**
 * Contrôle FINAL — ne doit pas précéder des travaux restants.
 * Contrôle intermédiaire (hold-point / phase suivie d'une EXECUTION) : autorisé avant travaux.
 */
export function isFinalControlStep(
  step: Pick<StructuralStep, "name" | "lot" | "kind" | "description">,
  phase: CanonicalPhase,
  executionPhases?: PrepExecutionPhaseDTO[] | null,
): boolean {
  if (phase.role !== "controls") return false;

  // Phase d'exécution explicite : intermédiaire si une phase travaux dépend d'elle
  if (phase.executionPhaseId && executionPhases?.length) {
    const successorWork = executionPhases.some(
      (p) =>
        EXEC_WORK_ROLES.has(p.role) &&
        (p.depends_on ?? []).includes(phase.executionPhaseId!),
    );
    if (successorWork) return false;
  }

  const blob = `${step.name} ${step.description ?? ""}`;
  const t = blob
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (
    /intermediaire|hold.?point|avant\s+(pose|coulage|chape|reprise|travaux)|point\s+d['']arret/.test(
      t,
    )
  ) {
    return false;
  }
  if (hasFinalControlMarkers(blob)) return true;
  const lot = (step.lot ?? "").trim();
  if (/^contr[oô]les?\s*$/i.test(lot)) return true;
  // Rôle controls legacy sans successeur travaux → final (conservateur)
  return true;
}

/**
 * Purge les arêtes qui inversent l'ordre logique des rôles terminaux.
 * Les depends_on métier non contradictoires sont conservés.
 */
export function sanitizeInvertedRoleDependencies(
  steps: StructuralStep[],
  phasesById: Map<string, CanonicalPhase>,
  executionPhases?: PrepExecutionPhaseDTO[] | null,
): Map<string, StructuralDep[]> {
  const stepById = new Map(steps.map((s) => [s.id, s]));
  const result = new Map<string, StructuralDep[]>();
  for (const s of steps) {
    const succPhase = phasesById.get(s.id)!;
    const kept: StructuralDep[] = [];
    for (const d of s.depends_on ?? []) {
      if (!d.step_id || d.step_id === s.id) continue;
      const predPhase = phasesById.get(d.step_id);
      if (!predPhase) {
        kept.push({
          step_id: d.step_id,
          type: d.type ?? "FS",
          lag_days: d.lag_days ?? 0,
        });
        continue;
      }

      // HANDOVER / REMISE finale ne précède jamais des travaux restants
      if (predPhase.role === "handover" && isWorkRole(succPhase.role)) {
        continue;
      }
      // Remise avant contrôle final
      if (predPhase.role === "handover" && succPhase.role === "controls") {
        continue;
      }
      // Contrôle FINAL ne précède pas des travaux encore à exécuter
      if (
        predPhase.role === "controls" &&
        isWorkRole(succPhase.role) &&
        isFinalControlStep(
          stepById.get(d.step_id) ?? {
            name: d.step_id,
            lot: null,
            kind: null,
            description: null,
          },
          predPhase,
          executionPhases,
        )
      ) {
        continue;
      }

      // Toute autre FS explicite est conservée (y compris entre rôles travail
      // dont l’ordre ROLE_SEQ inféré serait trompeur — ex. rebouchage « finishes »
      // avant pose appareillage « installation »).
      kept.push({
        step_id: d.step_id,
        type: d.type ?? "FS",
        lag_days: d.lag_days ?? 0,
      });
    }
    result.set(s.id, kept);
  }
  return result;
}

/**
 * Réduction transitive : si D dépend de A et de C, et C dépend (transitivement) de A,
 * retire D←A (redondant). Conserve SS/FF et le graphe minimal FS.
 */
export function reduceTransitiveDependencies(
  depsByStep: Map<string, StructuralDep[]>,
): Map<string, StructuralDep[]> {
  const preds = new Map<string, Set<string>>();
  for (const [succ, list] of depsByStep) {
    const set = new Set<string>();
    for (const d of list) {
      if (d.type === "FS" || !d.type) set.add(d.step_id);
    }
    preds.set(succ, set);
  }

  /** true si `from` dépend transitivement de `target` (from ← … ← target). */
  const reaches = (from: string, target: string): boolean => {
    const stack = [...(preds.get(from) ?? [])];
    const seen = new Set<string>();
    while (stack.length) {
      const n = stack.pop()!;
      if (n === target) return true;
      if (seen.has(n)) continue;
      seen.add(n);
      for (const p of preds.get(n) ?? []) stack.push(p);
    }
    return false;
  };

  const out = new Map<string, StructuralDep[]>();
  for (const [succ, list] of depsByStep) {
    const kept: StructuralDep[] = [];
    for (const d of list) {
      if (d.type && d.type !== "FS") {
        kept.push(d);
        continue;
      }
      const others = list
        .filter((x) => x.step_id !== d.step_id && (!x.type || x.type === "FS"))
        .map((x) => x.step_id);
      // D←A redondant si un autre prédécesseur B vérifie B←…←A
      if (others.some((other) => reaches(other, d.step_id))) continue;
      kept.push(d);
    }
    out.set(succ, kept);
  }
  return out;
}

/**
 * Génère des FS structurels.
 * Si `executionPhases` non vide → graphe explicite (prioritaire).
 * Sinon → chaîne legacy par rôle inféré.
 *
 * Les arêtes explicites qui inversent HANDOVER/CONTROL final → travaux
 * sont purgées avant fusion. Les structurelles cycliques sont ignorées.
 */
export function buildStructuralDependencies(
  steps: StructuralStep[],
  executionPhases?: PrepExecutionPhaseDTO[] | null,
): Map<string, StructuralDep[]> {
  const phases = executionPhases ?? [];
  const hasExplicit = phases.length > 0;

  const phasesById = new Map<string, CanonicalPhase>();
  for (const s of steps) {
    const exec = s.execution_phase_id
      ? phases.find((p) => p.id === s.execution_phase_id)
      : null;
    if (exec) {
      phasesById.set(s.id, canonicalPhaseFromExecution(exec));
    } else {
      phasesById.set(
        s.id,
        resolveCanonicalPhase({
          lot: s.lot,
          name: s.name,
          kind: s.kind,
          description: s.description,
        }),
      );
    }
  }

  // 1. Purger les inversions explicites (ChatGPT / regen) avant toute fusion
  const sanitized = sanitizeInvertedRoleDependencies(
    steps,
    phasesById,
    phases,
  );

  let extras: Map<string, StructuralDep[]>;

  if (hasExplicit) {
    extras = buildExplicitPhaseDependencies({
      phases,
      steps: steps.map((s) => ({
        id: s.id,
        order: s.order ?? 0,
        execution_phase_id: s.execution_phase_id,
        kind: s.kind,
        depends_on: (sanitized.get(s.id) ?? []).map((d) => ({
          step_id: d.step_id,
        })),
      })),
    });
  } else {
    extras = buildLegacyRoleDependencies(steps, phasesById, phases);
  }

  // 2. Base = depends_on explicites assainis
  const result = new Map<string, StructuralDep[]>();
  for (const s of steps) {
    result.set(s.id, [...(sanitized.get(s.id) ?? [])]);
  }

  // 3. Ajouter les structurelles une par une sans créer de cycle
  for (const s of steps) {
    const extra = extras.get(s.id) ?? [];
    for (const d of extra) {
      if (!d.step_id || d.step_id === s.id) continue;
      const current = result.get(s.id) ?? [];
      if (
        current.some(
          (x) =>
            x.step_id === d.step_id &&
            x.type === (d.type ?? "FS") &&
            (x.lag_days ?? 0) === (d.lag_days ?? 0),
        )
      ) {
        continue;
      }
      const candidate = new Map(result);
      candidate.set(s.id, [
        ...current,
        {
          step_id: d.step_id,
          type: d.type ?? "FS",
          lag_days: d.lag_days ?? 0,
        },
      ]);
      const cycle = detectDependencyCycle(
        new Map(
          [...candidate.entries()].map(([k, v]) => [
            k,
            v.map((x) => ({ step_id: x.step_id })),
          ]),
        ),
      );
      if (cycle.hasCycle) continue;
      result.set(s.id, candidate.get(s.id)!);
    }
  }

  // 4. Graphe minimal
  return reduceTransitiveDependencies(result);
}

function buildLegacyRoleDependencies(
  steps: StructuralStep[],
  phases: Map<string, CanonicalPhase>,
  executionPhases?: PrepExecutionPhaseDTO[] | null,
): Map<string, StructuralDep[]> {
  const byRole = new Map<PhaseRole, string[]>();
  for (const s of steps) {
    const p = phases.get(s.id)!;
    const list = byRole.get(p.role) ?? [];
    list.push(s.id);
    byRole.set(p.role, list);
  }

  const extras = new Map<string, StructuralDep[]>();
  const add = (succ: string, pred: string) => {
    if (succ === pred) return;
    const list = extras.get(succ) ?? [];
    list.push({ step_id: pred, type: "FS", lag_days: 0 });
    extras.set(succ, list);
  };

  // Chaîne legacy : gate = toutes les tâches amont (conservateur historiques)
  for (let i = 1; i < ROLE_SEQ.length; i++) {
    const prevRole = ROLE_SEQ[i - 1]!;
    const curRole = ROLE_SEQ[i]!;
    const preds = byRole.get(prevRole) ?? [];
    const succs = byRole.get(curRole) ?? [];
    if (!preds.length || !succs.length) continue;
    for (const succ of succs) {
      for (const pred of preds) add(succ, pred);
    }
  }

  const controls = byRole.get("controls") ?? [];
  for (const c of controls) {
    const cStep = steps.find((s) => s.id === c)!;
    const cPhase = phases.get(c)!;
    // Contrôle intermédiaire : ne pas forcer l'attente de tous les travaux
    if (!isFinalControlStep(cStep, cPhase, executionPhases)) continue;
    for (const role of WORK_PHASE_ROLES) {
      if (role === "preparation" || role === "logistics") continue;
      for (const w of byRole.get(role) ?? []) add(c, w);
    }
  }

  const handover = byRole.get("handover") ?? [];
  for (const h of handover) {
    for (const c of controls) {
      const cStep = steps.find((s) => s.id === c);
      const cPhase = phases.get(c);
      if (
        cStep &&
        cPhase &&
        isFinalControlStep(cStep, cPhase, executionPhases)
      ) {
        add(h, c);
      }
    }
    for (const role of WORK_PHASE_ROLES) {
      for (const w of byRole.get(role) ?? []) add(h, w);
    }
  }

  return extras;
}

/** Détecte un cycle dans un graphe step_id → preds */
export function detectDependencyCycle(
  depsByStep: Map<string, Array<{ step_id: string }>>,
): { hasCycle: boolean; path: string[] } {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];

  const dfs = (id: string): boolean => {
    if (visiting.has(id)) {
      stack.push(id);
      return true;
    }
    if (visited.has(id)) return false;
    visiting.add(id);
    stack.push(id);
    for (const d of depsByStep.get(id) ?? []) {
      if (dfs(d.step_id)) return true;
    }
    stack.pop();
    visiting.delete(id);
    visited.add(id);
    return false;
  };

  for (const id of depsByStep.keys()) {
    if (dfs(id)) {
      const last = stack[stack.length - 1]!;
      const start = stack.indexOf(last);
      return { hasCycle: true, path: stack.slice(start) };
    }
  }
  return { hasCycle: false, path: [] };
}

export function comparePhaseOrder(
  a: CanonicalPhase,
  b: CanonicalPhase,
): number {
  if (a.order !== b.order) return a.order - b.order;
  return roleIndex(a.role) - roleIndex(b.role);
}
