/**
 * Politique centrale de provenance / protection des données sources.
 * Source unique — utilisée par le contexte ChatGPT et le guard patch.
 *
 * Une hypothèse n'est JAMAIS une mesure.
 * Une source inférieure ne peut pas écraser une source supérieure.
 */
import type { ProjectContextProvenanceKind } from "./types";

export type { ProjectContextProvenanceKind };

/** Rang de fiabilité — plus élevé = plus protégé. */
export const PROVENANCE_RANK: Record<ProjectContextProvenanceKind, number> = {
  MANUAL: 90,
  MEASURE: 80,
  PLAN: 70,
  CALCULATION: 50,
  HYPOTHESIS: 20,
  UNKNOWN: 10,
};

/** Provenances considérées protégées (ne pas écraser silencieusement). */
export const PROTECTED_PROVENANCE_KINDS = new Set<ProjectContextProvenanceKind>([
  "MANUAL",
  "MEASURE",
  "PLAN",
]);

export function mapProvenanceKind(input: {
  provenance: string | null | undefined;
  formula?: string | null;
}): ProjectContextProvenanceKind {
  const p = (input.provenance ?? "").trim().toUpperCase();
  if (p === "RELEVE" || p === "RELEVE_A_VERIFIER") return "MEASURE";
  if (p === "HYPOTHESE" || p === "HYPOTHESIS") return "HYPOTHESIS";
  if (p === "SAISIE_MANUELLE" || p === "MANUAL") return "MANUAL";
  if (p === "PLAN" || p === "PLAN_SOURCE" || p === "DOCUMENT") return "PLAN";
  if (p === "CALCULE" || p === "CALCULATION") return "CALCULATION";
  if (!p && input.formula && input.formula.trim()) return "CALCULATION";
  if (!p) return "UNKNOWN";
  return "UNKNOWN";
}

export function provenanceRank(kind: ProjectContextProvenanceKind): number {
  return PROVENANCE_RANK[kind] ?? PROVENANCE_RANK.UNKNOWN;
}

/**
 * Compare deux provenances.
 * > 0 : a plus fiable que b
 * < 0 : a moins fiable que b
 * 0 : égalité
 */
export function compareProvenance(
  a: ProjectContextProvenanceKind,
  b: ProjectContextProvenanceKind,
): number {
  return provenanceRank(a) - provenanceRank(b);
}

export function isProtectedProvenanceKind(
  kind: ProjectContextProvenanceKind,
): boolean {
  return PROTECTED_PROVENANCE_KINDS.has(kind);
}

export function isProtectedSource(input: {
  provenanceKind: ProjectContextProvenanceKind;
  /** validated_quantity non null = quantité retenue protégée. */
  hasValidatedQuantity?: boolean;
}): boolean {
  if (input.hasValidatedQuantity) return true;
  return isProtectedProvenanceKind(input.provenanceKind);
}

export type SourceProtectionDecision =
  | { status: "ALLOW"; warning?: string }
  | {
      status: "BLOCKED";
      code: "PROTECTED_SOURCE_CONFLICT";
      message: string;
    }
  | {
      status: "OVERRIDE_OK";
      warning: string;
    };

export type EvaluateSourceProtectionInput = {
  currentKind: ProjectContextProvenanceKind;
  /** Provenance justifiant la proposition — UNKNOWN si non déclarée. */
  proposalKind: ProjectContextProvenanceKind;
  currentValue: unknown;
  proposalValue: unknown;
  hasValidatedQuantity?: boolean;
  /** Intent du patch. */
  intent: string;
  /** Motif obligatoire pour TECHNICAL_OVERRIDE. */
  reason?: string | null;
  fieldLabel?: string;
};

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (typeof a === "number" && typeof b === "number") {
    return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 1e-9;
  }
  return false;
}

/**
 * Garde centrale : peut-on appliquer la proposition sur la valeur actuelle ?
 *
 * - Donnée protégée (MANUAL/MEASURE/PLAN / validated) + source plus faible → BLOCKED
 * - Sauf TECHNICAL_OVERRIDE + motif → OVERRIDE_OK
 * - Valeur null → ne pas inventer sans override
 * - HYPOTHESIS / UNKNOWN actuelles : modifiables (pas protégées)
 */
export function evaluateSourceProtection(
  input: EvaluateSourceProtectionInput,
): SourceProtectionDecision {
  if (valuesEqual(input.currentValue, input.proposalValue)) {
    return { status: "ALLOW" };
  }

  const intent = (input.intent ?? "").toUpperCase();
  const isOverride =
    intent === "TECHNICAL_OVERRIDE" &&
    typeof input.reason === "string" &&
    input.reason.trim().length > 0;

  const field = input.fieldLabel ?? "Cette valeur";
  const protectedSource = isProtectedSource({
    provenanceKind: input.currentKind,
    hasValidatedQuantity: input.hasValidatedQuantity,
  });

  // Valeur absente : une HYPOTHESIS ne peut pas la renseigner silencieusement
  // (reste « à confirmer »). Autres provenances : premier remplissage autorisé.
  if (
    (input.currentValue === null || input.currentValue === undefined) &&
    input.proposalValue !== null &&
    input.proposalValue !== undefined &&
    input.proposalKind === "HYPOTHESIS"
  ) {
    if (isOverride) {
      return {
        status: "OVERRIDE_OK",
        warning: `${field} était indéterminée — validation explicite (TECHNICAL_OVERRIDE) pour retenir l'hypothèse proposée.`,
      };
    }
    return {
      status: "BLOCKED",
      code: "PROTECTED_SOURCE_CONFLICT",
      message: `${field} est indéterminée (à confirmer). Une hypothèse ne peut pas la renseigner automatiquement.`,
    };
  }

  if (!protectedSource) {
    // HYPOTHESIS / UNKNOWN / CALCULATION : pas de protection dure.
    return { status: "ALLOW" };
  }

  // Donnée protégée : tout remplacement de valeur exige TECHNICAL_OVERRIDE + motif.
  // Une HYPOTHESIS / UNKNOWN / source inférieure ne peut jamais écraser silencieusement.
  if (isOverride) {
    return {
      status: "OVERRIDE_OK",
      warning: `⚠ Remplacement explicite d'une donnée protégée (${provenanceLabelFr(
        input.currentKind,
      )}${
        input.hasValidatedQuantity ? " + quantité validée" : ""
      } → ${provenanceLabelFr(input.proposalKind)}).`,
    };
  }

  const proposalNote =
    input.proposalKind === "HYPOTHESIS"
      ? "Une hypothèse"
      : input.proposalKind === "UNKNOWN"
        ? "Une donnée non confirmée"
        : `Une source ${provenanceLabelFr(input.proposalKind)}`;

  return {
    status: "BLOCKED",
    code: "PROTECTED_SOURCE_CONFLICT",
    message: `${field} a été saisie ou validée par l'utilisateur (${provenanceLabelFr(
      input.currentKind,
    )}${
      input.hasValidatedQuantity ? ", quantité validée" : ""
    }). ${proposalNote} ne peut pas la remplacer automatiquement. Utilisez TECHNICAL_OVERRIDE avec un motif et une confirmation.`,
  };
}

/** Libellé FR pour preview. */
export function provenanceLabelFr(kind: ProjectContextProvenanceKind): string {
  switch (kind) {
    case "MANUAL":
      return "SAISIE MANUELLE";
    case "MEASURE":
      return "MESURE / RELEVÉ";
    case "PLAN":
      return "PLAN / DOCUMENT";
    case "CALCULATION":
      return "CALCUL";
    case "HYPOTHESIS":
      return "HYPOTHÈSE";
    case "UNKNOWN":
      return "ORIGINE INCONNUE";
  }
}
