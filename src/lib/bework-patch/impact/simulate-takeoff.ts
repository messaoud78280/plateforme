/**
 * Simulation métré — recalcul déterministe via computeStudy (mémoire uniquement).
 */
import { computeStudy } from "@/lib/preparation/engine/compute";
import type { ImpactStudy } from "@/lib/bework-patch/impact/types";
import type { BeworkPatchIssue } from "@/lib/bework-patch/errors";

export type TakeoffSimResult = {
  beforeByCode: Map<string, number | null>;
  afterByCode: Map<string, number | null>;
  beforeByParam: Map<string, number | null>;
  afterByParam: Map<string, number | null>;
  unresolved: BeworkPatchIssue[];
  changedLineCodes: string[];
};

function roundQty(n: number | null): number | null {
  if (n == null || !Number.isFinite(n)) return null;
  return Math.round(n * 1e6) / 1e6;
}

export function simulateTakeoffFromParamChange(input: {
  study: ImpactStudy;
  /** key → new value */
  paramUpdates: Record<string, number | null>;
  /** code → declared quantity override (si pas de formule) */
  lineDeclaredUpdates?: Record<string, number | null>;
}): TakeoffSimResult {
  const unresolved: BeworkPatchIssue[] = [];
  const paramsBefore = input.study.params.map((p) => ({
    key: p.key,
    value: p.value,
    formula: p.formula,
    provenance: null as null,
  }));
  const linesBefore = input.study.lines.map((l) => ({
    code: l.code,
    formula: l.formula,
    declaredQuantity: l.declaredQuantity,
    provenance: null as null,
    literalProvenance: null as null,
  }));

  const beforeEngine = computeStudy({ params: paramsBefore, lines: linesBefore });

  const paramsAfter = input.study.params.map((p) => ({
    key: p.key,
    value:
      p.key in input.paramUpdates ? input.paramUpdates[p.key]! : p.value,
    formula: p.formula,
    provenance: null as null,
  }));
  const declared = input.lineDeclaredUpdates ?? {};
  const linesAfter = input.study.lines.map((l) => ({
    code: l.code,
    formula: l.formula,
    declaredQuantity:
      l.code in declared ? declared[l.code]! : l.declaredQuantity,
    provenance: null as null,
    literalProvenance: null as null,
  }));

  const afterEngine = computeStudy({ params: paramsAfter, lines: linesAfter });

  const beforeByCode = new Map<string, number | null>();
  const afterByCode = new Map<string, number | null>();
  const beforeByParam = new Map<string, number | null>();
  const afterByParam = new Map<string, number | null>();
  const changedLineCodes: string[] = [];

  for (const p of input.study.params) {
    beforeByParam.set(p.key, roundQty(beforeEngine.nodes.get(p.key)?.value ?? p.value));
    afterByParam.set(p.key, roundQty(afterEngine.nodes.get(p.key)?.value ?? null));
  }

  for (const l of input.study.lines) {
    const b = roundQty(beforeEngine.nodes.get(l.code)?.value ?? null);
    const a = roundQty(afterEngine.nodes.get(l.code)?.value ?? null);
    beforeByCode.set(l.code, b);
    afterByCode.set(l.code, a);
    const afterNode = afterEngine.nodes.get(l.code);
    if (afterNode?.error && l.formula) {
      unresolved.push({
        code: "CALCULATION_UNRESOLVED",
        path: `lines.${l.code}`,
        message: `Recalcul impossible pour ${l.code} : ${afterNode.error}`,
        severity: "warn",
      });
    }
    if (b !== a && (b != null || a != null)) {
      if (b == null || a == null || Math.abs(b - a) > 1e-9) {
        changedLineCodes.push(l.code);
      }
    }
  }

  return {
    beforeByCode,
    afterByCode,
    beforeByParam,
    afterByParam,
    unresolved,
    changedLineCodes,
  };
}
