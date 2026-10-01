/**
 * Éligibilité commit Phase E — FULL_SYNC / SAFE_PARTIAL_SYNC / QUOTE_ONLY / BLOCKED.
 */
import type { BeworkPatchV1 } from "@/lib/bework-patch/types";
import type { AnalyzePatchImpactResult } from "@/lib/bework-patch/impact/types";

export type SyncMode =
  | "FULL_SYNC"
  | "SAFE_PARTIAL_SYNC"
  | "QUOTE_ONLY"
  | "PLANNING_ONLY";

export type CommitEligibility =
  | {
      ok: true;
      mode: SyncMode;
      buttonLabel: string;
      warnings: string[];
    }
  | {
      ok: false;
      reason: string;
      code: string;
    };

export function evaluateCommitEligibility(input: {
  patch: BeworkPatchV1;
  impact: AnalyzePatchImpactResult;
}): CommitEligibility {
  const { patch, impact } = input;

  if (impact.errors.length) {
    return {
      ok: false,
      reason: impact.errors[0]!.message,
      code: impact.errors[0]!.code,
    };
  }

  // Commercial → QUOTE_ONLY
  if (
    patch.origin.section === "QUOTE" &&
    patch.change_intent === "COMMERCIAL_ADJUSTMENT"
  ) {
    if (impact.protectedEntities.some((p) => p.section === "QUOTE")) {
      return {
        ok: false,
        reason: "Devis protégé — ajustement commercial impossible.",
        code: "PROTECTED_ENTITY",
      };
    }
    return {
      ok: true,
      mode: "QUOTE_ONLY",
      buttonLabel: "Appliquer et synchroniser",
      warnings: [],
    };
  }

  // CTX-02A — PLANNING local (pas de remontée métré/devis)
  if (patch.origin.section === "PLANNING") {
    const unsupported = patch.operations.filter(
      (op) =>
        op.op !== "update_task" &&
        op.op !== "update_duration",
    );
    if (unsupported.length) {
      return {
        ok: false,
        reason: `Opération ${unsupported[0]!.op} non supportée pour le commit PLANNING (CTX-02A).`,
        code: "OPERATION_NOT_ALLOWED_FOR_SECTION",
      };
    }
    if (!patch.operations.length) {
      return {
        ok: false,
        reason: "Aucune opération planning.",
        code: "EMPTY_OPERATIONS",
      };
    }
    return {
      ok: true,
      mode: "PLANNING_ONLY",
      buttonLabel: "Appliquer au planning",
      warnings: impact.warnings
        .filter((w) => w.code === "PLANNING_SCOPE")
        .map((w) => w.message),
    };
  }

  if (
    patch.origin.section === "VISIT" ||
    patch.origin.section === "FOLLOW_UP" ||
    patch.origin.section === "REPORT" ||
    patch.origin.section === "NOTICE"
  ) {
    return {
      ok: false,
      reason: `Section ${patch.origin.section} : preview uniquement (Phase E).`,
      code: "PREVIEW_ONLY",
    };
  }

  // TAKEOFF technique ou QUOTE technical
  if (patch.origin.section === "TAKEOFF") {
    if (impact.canonicalResolution.status !== "EXACT") {
      return {
        ok: false,
        reason:
          impact.canonicalResolution.status === "PARTIAL"
            ? "Résolution PARTIAL — source technique précise non résolue. Commit refusé."
            : "Résolution NONE — aucune propagation autorisée.",
        code: "CANONICAL_SOURCE_UNRESOLVED",
      };
    }

    const unresolved = impact.derivedChanges.filter(
      (d) =>
        d.section === "TAKEOFF" &&
        (d.certainty === "PARTIAL" || d.blockReason === "CALCULATION_UNRESOLVED"),
    );
    if (unresolved.length) {
      return {
        ok: false,
        reason: "Recalcul métré non déterministe — commit refusé.",
        code: "CALCULATION_UNRESOLVED",
      };
    }

    const hasProtectedQuote = impact.protectedEntities.some(
      (p) => p.section === "QUOTE",
    );
    const hasOverride = impact.overrides.length > 0;
    const quoteBlocked = impact.derivedChanges.some(
      (d) =>
        d.section === "QUOTE" &&
        d.blocked &&
        (d.quoteLinkClass === "PROTECTED" ||
          d.quoteLinkClass === "LIKELY_OVERRIDE"),
    );

    // Override sans autre chemin : on peut quand même SAFE_PARTIAL (skip quote)
    if (hasOverride || hasProtectedQuote || quoteBlocked) {
      const warnings: string[] = [];
      if (hasProtectedQuote) {
        warnings.push(
          "Devis contractuel protégé — ne sera pas modifié. Une révision / un avenant sera nécessaire.",
        );
      }
      if (hasOverride) {
        warnings.push(
          "Une valeur manuelle semble avoir été appliquée sur le devis. Cette ligne ne sera pas resynchronisée.",
        );
      }
      return {
        ok: true,
        mode: "SAFE_PARTIAL_SYNC",
        buttonLabel: "Appliquer les modifications autorisées",
        warnings,
      };
    }

    // Tous les derived QUOTE/PLANNING non bloqués doivent être CERTAIN
    const writableDerived = impact.derivedChanges.filter((d) => !d.blocked);
    const nonCertain = writableDerived.filter(
      (d) => d.certainty !== "CERTAIN" && d.certainty !== "PARTIAL",
    );
    // PARTIAL on planning dates is OK for SAFE but for FULL we allow PARTIAL dates with CERTAIN qty
    const blockingUncertainty = writableDerived.filter(
      (d) =>
        d.section !== "PLANNING" &&
        d.certainty !== "CERTAIN" &&
        d.field !== "end_date",
    );
    if (blockingUncertainty.length || nonCertain.some((d) => d.certainty === "NONE")) {
      return {
        ok: false,
        reason: "Impacts dérivés non certains — commit refusé.",
        code: "IMPACT_UNCERTAIN",
      };
    }

    return {
      ok: true,
      mode: "FULL_SYNC",
      buttonLabel: "Appliquer et synchroniser",
      warnings: [],
    };
  }

  // QUOTE TECHNICAL_CORRECTION — pas de FULL cross-module auto en V1 si PARTIAL
  if (patch.origin.section === "QUOTE") {
    if (impact.canonicalResolution.status === "NONE") {
      // modification locale devis seulement si pas protégé
      if (impact.protectedEntities.length) {
        return {
          ok: false,
          reason: "Devis protégé.",
          code: "PROTECTED_ENTITY",
        };
      }
      return {
        ok: true,
        mode: "QUOTE_ONLY",
        buttonLabel: "Appliquer et synchroniser",
        warnings: [],
      };
    }
    return {
      ok: false,
      reason:
        "Correction technique depuis devis : résolution non EXACTE — commit cross-module refusé en Phase E.",
      code: "CANONICAL_SOURCE_UNRESOLVED",
    };
  }

  return {
    ok: false,
    reason: "Cas non supporté par le commit Phase E.",
    code: "UNSUPPORTED",
  };
}
