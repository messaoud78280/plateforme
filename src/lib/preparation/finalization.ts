/**
 * Validation finale du dossier métré (PRO_A_VALIDER → PRO_VALIDE)
 * + règles d'invalidation après modification substantielle.
 */
import type { EngineResult } from "@/lib/preparation/engine/compute";
import { prepLineStatus } from "@/lib/preparation/line-status";
import type { DossierStatus } from "@/lib/preparation/types";

export type FinalizationBlockerCode =
  | "NOT_PROFESSIONAL"
  | "ALREADY_VALIDATED"
  | "WRONG_STATUS"
  | "NO_QUOTE_LINES"
  | "LINES_NOT_VALIDATED"
  | "ENGINE_ERRORS"
  | "REVALIDATE_REQUIRED";

export type FinalizationBlocker = {
  code: FinalizationBlockerCode;
  message: string;
  count?: number;
};

export type FinalizationEligibility = {
  eligible: boolean;
  blockers: FinalizationBlocker[];
  validatedCount: number;
  quoteLineCount: number;
  theoreticalCount: number;
  revalidateCount: number;
  errorCount: number;
  dossierStatus: string;
};

export type FinalValidationChangeKind =
  | "quantity_or_formula_change"
  | "parameter_change"
  | "line_structure_change"
  | "import_replace"
  | "unvalidate_lines"
  | "patch_takeoff"
  | "text_only"
  | "plan_source"
  | "enrich_texts"
  | "metadata"
  | "validate_lines";

/**
 * Une modification substantielle du contenu approuvé invalide PRO_VALIDE.
 * Textes / plan source / métadonnées / validation de lignes : hors périmètre.
 */
export function shouldInvalidateStudyFinalValidation(
  change: FinalValidationChangeKind | { kind: FinalValidationChangeKind },
): boolean {
  const kind = typeof change === "string" ? change : change.kind;
  switch (kind) {
    case "text_only":
    case "plan_source":
    case "enrich_texts":
    case "metadata":
    case "validate_lines":
      return false;
    case "quantity_or_formula_change":
    case "parameter_change":
    case "line_structure_change":
    case "import_replace":
    case "unvalidate_lines":
    case "patch_takeoff":
      return true;
    default:
      return false;
  }
}

export function evaluatePrepStudyFinalizationEligibility(input: {
  dossierStatus: DossierStatus | string;
  mode?: string | null;
  lines: Array<{
    code: string;
    role: string;
    validatedQuantity: number | null;
  }>;
  engine: Pick<EngineResult, "nodes">;
}): FinalizationEligibility {
  const dossierStatus = String(input.dossierStatus ?? "");
  const blockers: FinalizationBlocker[] = [];

  const quoteLines = input.lines.filter((l) => l.role !== "indicator");
  let validatedCount = 0;
  let theoreticalCount = 0;
  let revalidateCount = 0;
  let errorCount = 0;

  for (const line of quoteLines) {
    const st = prepLineStatus(line, input.engine.nodes.get(line.code));
    if (st === "validated") validatedCount++;
    else if (st === "theoretical") theoreticalCount++;
    else if (st === "revalidate") revalidateCount++;
    else if (st === "error") errorCount++;
  }

  const quoteLineCount = quoteLines.length;

  if (input.mode === "DEMONSTRATION" || dossierStatus === "DEMONSTRATION") {
    blockers.push({
      code: "NOT_PROFESSIONAL",
      message: "Le workflow de validation finale s'applique aux dossiers professionnels uniquement.",
    });
  } else if (dossierStatus === "PRO_VALIDE") {
    blockers.push({
      code: "ALREADY_VALIDATED",
      message: "Le métré est déjà validé.",
    });
  } else if (dossierStatus !== "PRO_A_VALIDER") {
    blockers.push({
      code: "WRONG_STATUS",
      message: `Statut dossier incompatible (${dossierStatus || "inconnu"}).`,
    });
  }

  if (quoteLineCount === 0) {
    blockers.push({
      code: "NO_QUOTE_LINES",
      message: "Aucune ligne de quantité devis à valider.",
    });
  }

  if (errorCount > 0) {
    blockers.push({
      code: "ENGINE_ERRORS",
      message: `${errorCount} ligne(s) en erreur moteur — corrigez avant de valider le métré.`,
      count: errorCount,
    });
  }

  if (revalidateCount > 0) {
    blockers.push({
      code: "REVALIDATE_REQUIRED",
      message: `${revalidateCount} quantité(s) à revalider avant de valider le métré.`,
      count: revalidateCount,
    });
  }

  if (theoreticalCount > 0) {
    blockers.push({
      code: "LINES_NOT_VALIDATED",
      message: `${theoreticalCount} quantité(s) restent à valider avant de pouvoir valider le métré.`,
      count: theoreticalCount,
    });
  }

  const eligible =
    input.mode !== "DEMONSTRATION" &&
    dossierStatus === "PRO_A_VALIDER" &&
    quoteLineCount > 0 &&
    validatedCount === quoteLineCount &&
    errorCount === 0 &&
    revalidateCount === 0 &&
    theoreticalCount === 0;

  return {
    eligible,
    blockers: eligible ? [] : blockers,
    validatedCount,
    quoteLineCount,
    theoreticalCount,
    revalidateCount,
    errorCount,
    dossierStatus,
  };
}

/** Libellé sourceFormat — mapping explicite (pas de « ancien format » par défaut). */
export function prepSourceFormatLabel(sourceFormat: string | null | undefined): string | null {
  if (!sourceFormat) return null;
  switch (sourceFormat) {
    case "bework_prep_bundle_v1":
      return null; // format natif — pas de badge
    case "bework_global_metre_v1":
      return "Métré global";
    case "bework_prep_legacy_v0":
    case "legacy_metre_v0":
      return "Importé depuis l'ancien format";
    default:
      return "Source : format importé";
  }
}
