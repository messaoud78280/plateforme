/**
 * Dépendances structurelles planning (phases / contrôles / remise).
 * Complète les depends_on explicites du workflow — n'invente pas de métier hors règles.
 *
 * Priorité :
 * 1. execution_phases explicites (workflowJson) → graphe gate déterministe
 * 2. fallback legacy par rôle inféré (ROLE_SEQ)
 */

import {
  resolveCanonicalPhase,
  type CanonicalPhase,
  type PhaseRole,
} from "@/lib/preparation/schedule/phase";
import {
  buildExplicitPhaseDependencies,
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

/**
 * Génère des FS structurels.
 * Si `executionPhases` non vide → graphe explicite (prioritaire).
 * Sinon → chaîne legacy par rôle inféré.
 */
export function buildStructuralDependencies(
  steps: StructuralStep[],
  executionPhases?: PrepExecutionPhaseDTO[] | null,
): Map<string, StructuralDep[]> {
  const phases = executionPhases ?? [];
  const hasExplicit = phases.length > 0;

  let extras: Map<string, StructuralDep[]>;

  if (hasExplicit) {
    extras = buildExplicitPhaseDependencies({
      phases,
      steps: steps.map((s) => ({
        id: s.id,
        order: s.order ?? 0,
        execution_phase_id: s.execution_phase_id,
        kind: s.kind,
        depends_on: (s.depends_on ?? []).map((d) => ({ step_id: d.step_id })),
      })),
    });
  } else {
    extras = buildLegacyRoleDependencies(steps);
  }

  const result = new Map<string, StructuralDep[]>();
  for (const s of steps) {
    const existing = (s.depends_on ?? []).map((d) => ({
      step_id: d.step_id,
      type: d.type ?? ("FS" as const),
      lag_days: d.lag_days ?? 0,
    }));
    const extra = extras.get(s.id) ?? [];
    const merged = mergeDependsOn(
      existing.filter((d) => d.step_id !== s.id),
      extra.filter((d) => d.step_id !== s.id),
    );
    result.set(s.id, merged);
  }
  return result;
}

function buildLegacyRoleDependencies(
  steps: StructuralStep[],
): Map<string, StructuralDep[]> {
  const phases = new Map<string, CanonicalPhase>();
  for (const s of steps) {
    phases.set(
      s.id,
      resolveCanonicalPhase({
        lot: s.lot,
        name: s.name,
        kind: s.kind,
        description: s.description,
      }),
    );
  }

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
  const workRoles: PhaseRole[] = [
    "networks",
    "execution",
    "installation",
    "finishes",
  ];
  for (const c of controls) {
    for (const role of workRoles) {
      for (const w of byRole.get(role) ?? []) add(c, w);
    }
  }

  const handover = byRole.get("handover") ?? [];
  for (const h of handover) {
    if (controls.length) {
      for (const c of controls) add(h, c);
    } else {
      for (const role of workRoles) {
        for (const w of byRole.get(role) ?? []) add(h, w);
      }
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
