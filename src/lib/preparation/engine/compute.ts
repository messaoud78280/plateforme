/**
 * Moteur de recalcul du métré : graphe paramètres + lignes, tri topologique,
 * évaluation en double précision (aucun arrondi intermédiaire), propagation des provenances.
 */
import {
  FormulaError,
  evaluateFormula,
  formulaLiterals,
  formulaRefs,
  parseFormula,
  type FormulaNode,
} from "@/lib/preparation/engine/formula";
import type {
  BaseProvenance,
  PrepIssue,
  PrepLineDTO,
  PrepParamDTO,
  StoredProvenance,
} from "@/lib/preparation/types";

export type EngineParam = Pick<PrepParamDTO, "key" | "value" | "formula" | "provenance">;
export type EngineLine = Pick<
  PrepLineDTO,
  "code" | "formula" | "declaredQuantity" | "provenance" | "literalProvenance"
>;

export type EngineNode = {
  id: string;
  kind: "param" | "line";
  value: number | null;
  error: string | null;
  /** Références directes de la formule. */
  refs: string[];
  /** Entrées de base → provenance (paramètres saisis, forfaits, constantes). */
  bases: Map<string, BaseProvenance>;
  hasFormula: boolean;
};

export type EngineResult = {
  nodes: Map<string, EngineNode>;
  order: string[];
  dependents: Map<string, string[]>;
  structural: PrepIssue[];
};

const CONST_PREFIX = "#const:";

export function isConstantBase(id: string): boolean {
  return id.startsWith(CONST_PREFIX);
}

export function computeStudy(input: { params: EngineParam[]; lines: EngineLine[] }): EngineResult {
  const structural: PrepIssue[] = [];
  const nodes = new Map<string, EngineNode>();
  const asts = new Map<string, FormulaNode>();
  const ownBase = new Map<string, BaseProvenance>();
  const literalProv = new Map<string, StoredProvenance>();

  const register = (
    id: string,
    kind: "param" | "line",
    path: string,
    formula: string | null,
    value: number | null,
    provenance: StoredProvenance | null,
    literalProvenance: StoredProvenance | null,
  ) => {
    if (nodes.has(id)) {
      structural.push({ path, message: `Identifiant en double : ${id}`, severity: "error" });
      return;
    }
    const node: EngineNode = {
      id,
      kind,
      value: null,
      error: null,
      refs: [],
      bases: new Map(),
      hasFormula: !!formula,
    };
    nodes.set(id, node);
    if (formula) {
      try {
        const ast = parseFormula(formula);
        asts.set(id, ast);
        node.refs = [...formulaRefs(ast)];
        if (formulaLiterals(ast).length > 0) {
          literalProv.set(id, literalProvenance ?? "HYPOTHESE");
        }
      } catch (e) {
        const msg = e instanceof FormulaError ? e.message : "Formule invalide";
        node.error = `Formule invalide : ${msg}`;
        structural.push({ path, message: `${id} — formule invalide : ${msg}`, severity: "error" });
      }
    } else {
      node.value = value !== null && Number.isFinite(value) ? value : null;
      ownBase.set(id, provenance ?? "HYPOTHESE");
      if (node.value === null) node.error = "Valeur manquante";
    }
  };

  input.params.forEach((p, i) =>
    register(p.key, "param", `parameters[${i}]`, p.formula, p.value, p.provenance, null),
  );
  input.lines.forEach((l, i) =>
    register(
      l.code,
      "line",
      `takeoff.items[${i}]`,
      l.formula,
      l.declaredQuantity,
      l.provenance,
      l.literalProvenance,
    ),
  );

  for (const node of nodes.values()) {
    const unknown = node.refs.filter((r) => !nodes.has(r));
    if (unknown.length) {
      node.error = `Référence inconnue : ${unknown.join(", ")}`;
      structural.push({
        path: node.id,
        message: `${node.id} — référence inconnue : ${unknown.join(", ")}`,
        severity: "error",
      });
      node.refs = node.refs.filter((r) => nodes.has(r));
    }
  }

  // Tri topologique (Kahn)
  const dependents = new Map<string, string[]>();
  const indeg = new Map<string, number>();
  for (const id of nodes.keys()) {
    dependents.set(id, []);
    indeg.set(id, 0);
  }
  for (const node of nodes.values()) {
    for (const r of node.refs) {
      dependents.get(r)!.push(node.id);
      indeg.set(node.id, indeg.get(node.id)! + 1);
    }
  }
  const queue: string[] = [];
  for (const [id, d] of indeg) if (d === 0) queue.push(id);
  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    for (const dep of dependents.get(id)!) {
      const d = indeg.get(dep)! - 1;
      indeg.set(dep, d);
      if (d === 0) queue.push(dep);
    }
  }
  if (order.length !== nodes.size) {
    const cyclic = [...indeg].filter(([, d]) => d > 0).map(([id]) => id);
    structural.push({
      path: "graph",
      message: `Dépendance circulaire entre : ${cyclic.join(", ")}`,
      severity: "error",
    });
    for (const id of cyclic) {
      const n = nodes.get(id)!;
      n.error = "Dépendance circulaire";
      order.push(id);
    }
  }

  // Évaluation
  for (const id of order) {
    const node = nodes.get(id)!;
    const own = ownBase.get(id);
    if (own) node.bases.set(id, own);
    const lit = literalProv.get(id);
    if (lit) node.bases.set(`${CONST_PREFIX}${id}`, lit);
    for (const r of node.refs) {
      for (const [b, p] of nodes.get(r)!.bases) node.bases.set(b, p);
    }
    if (!node.hasFormula || node.error) continue;
    const failed = node.refs.find((r) => nodes.get(r)!.error !== null);
    if (failed) {
      node.error = `Dépend d'une valeur en erreur (${failed})`;
      continue;
    }
    try {
      const v = evaluateFormula(asts.get(id)!, (ref) => nodes.get(ref)?.value ?? null);
      if (!Number.isFinite(v)) throw new FormulaError("Résultat non numérique");
      node.value = v;
    } catch (e) {
      node.error = e instanceof FormulaError ? e.message : "Erreur de calcul";
    }
  }

  return { nodes, order, dependents, structural };
}

/** Tous les nœuds impactés (transitivement) par la modification de `ids`. */
export function descendantsOf(result: EngineResult, ids: Iterable<string>): Set<string> {
  const out = new Set<string>();
  const stack = [...ids];
  while (stack.length) {
    const id = stack.pop()!;
    for (const d of result.dependents.get(id) ?? []) {
      if (!out.has(d)) {
        out.add(d);
        stack.push(d);
      }
    }
  }
  return out;
}

/**
 * Paramètres saisissables dont dépend directement une ligne
 * (en traversant les paramètres dérivés, sans traverser les autres lignes).
 */
export function inputParamsOf(result: EngineResult, id: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const visit = (ref: string) => {
    if (seen.has(ref)) return;
    seen.add(ref);
    const n = result.nodes.get(ref);
    if (!n || n.kind !== "param") return;
    if (n.hasFormula) n.refs.forEach(visit);
    else out.push(ref);
  };
  result.nodes.get(id)?.refs.forEach(visit);
  return out;
}

export type ProvenanceSummary = {
  counts: Partial<Record<BaseProvenance, number>>;
  hypotheses: string[];
  toVerify: string[];
  manual: string[];
  constants: boolean;
  /** Toutes les entrées sont relevées ou saisies manuellement. */
  reliable: boolean;
};

export function summarizeBases(bases: Map<string, BaseProvenance>): ProvenanceSummary {
  const counts: Partial<Record<BaseProvenance, number>> = {};
  const hypotheses: string[] = [];
  const toVerify: string[] = [];
  const manual: string[] = [];
  let constants = false;
  for (const [id, p] of bases) {
    counts[p] = (counts[p] ?? 0) + 1;
    if (isConstantBase(id)) constants = true;
    if (p === "HYPOTHESE") hypotheses.push(id);
    else if (p === "RELEVE_A_VERIFIER") toVerify.push(id);
    else if (p === "SAISIE_MANUELLE") manual.push(id);
  }
  const reliable =
    bases.size > 0 && [...bases.values()].every((p) => p === "RELEVE" || p === "SAISIE_MANUELLE");
  return { counts, hypotheses, toVerify, manual, constants, reliable };
}

/** Tolérance de contrôle : max(0,001 ; 0,1 % de la valeur). */
export function quantitiesDiffer(a: number, b: number): boolean {
  return Math.abs(a - b) > Math.max(0.001, Math.abs(a) * 0.001);
}
