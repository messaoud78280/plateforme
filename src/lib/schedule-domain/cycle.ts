/**
 * Détection de cycles sur SchedulePlan — pure, pas de BDD.
 * Si cycle → DEPENDENCY_CYCLE ; aucune activité ne doit être calculée.
 */

export type CycleDetectionResult =
  | { hasCycle: false }
  | { hasCycle: true; path: string[] };

/**
 * depsByActivity : activité → liste de prédécesseurs (activityId).
 */
export function detectScheduleDependencyCycle(
  depsByActivity: Map<string, string[]>,
): CycleDetectionResult {
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
    for (const pred of depsByActivity.get(id) ?? []) {
      if (dfs(pred)) return true;
    }
    stack.pop();
    visiting.delete(id);
    visited.add(id);
    return false;
  };

  const ids = [...depsByActivity.keys()];
  for (const id of ids) {
    if (dfs(id)) {
      const last = stack[stack.length - 1]!;
      const start = stack.indexOf(last);
      return { hasCycle: true, path: stack.slice(start) };
    }
  }
  return { hasCycle: false };
}

export function buildDepsMapFromPredecessors(
  activities: Array<{
    id: string;
    predecessors: Array<{ activityId: string }>;
  }>,
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const a of activities) {
    map.set(
      a.id,
      a.predecessors.map((p) => p.activityId),
    );
  }
  return map;
}
