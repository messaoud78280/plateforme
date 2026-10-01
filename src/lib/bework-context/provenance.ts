/**
 * Mapping provenance stockée → kind exploitable ChatGPT (sans inventer).
 * Valeurs réelles PrepParameter / PrepTakeoffLine : RELEVE | RELEVE_A_VERIFIER | HYPOTHESE | SAISIE_MANUELLE.
 * Une formule présente sans provenance littérale ⇒ CALCULATION.
 */
import type { ProjectContextProvenanceKind } from "./types";

export function mapProvenanceKind(input: {
  provenance: string | null | undefined;
  formula?: string | null;
}): ProjectContextProvenanceKind {
  const p = (input.provenance ?? "").trim().toUpperCase();
  if (p === "RELEVE" || p === "RELEVE_A_VERIFIER") return "MEASURE";
  if (p === "HYPOTHESE") return "HYPOTHESIS";
  if (p === "SAISIE_MANUELLE") return "MANUAL";
  if (p === "PLAN" || p === "PLAN_SOURCE" || p === "DOCUMENT") return "PLAN";
  if (p === "CALCULE" || p === "CALCULATION") return "CALCULATION";
  if (!p && input.formula && input.formula.trim()) return "CALCULATION";
  if (!p) return "UNKNOWN";
  return "UNKNOWN";
}
