/**
 * Résolution canonique des sources Planning — générique tous métiers.
 * Priorité aux liens structurels (PrepLine / QuoteItem), jamais au matching texte.
 *
 * Chaîne : Quote → Takeoff → Planning
 */

import { mapProvenanceKind } from "@/lib/bework-context/provenance";
import type { CanonicalPhase } from "./phase";
import {
  isDesignationLikeLot,
  resolveCanonicalPhase,
} from "./phase";
import type { PrepExecutionPhaseDTO } from "./types";
import { canonicalPhaseFromExecution } from "./execution-structure";

/** Provenance quantité (alignée sur le métré / devis). */
export type QuantityProvenance =
  | "MEASURE"
  | "PLAN"
  | "CALCULATION"
  | "HYPOTHESIS"
  | "MANUAL"
  | "UNKNOWN"
  | "VALIDATED"
  | "COMPUTED"
  | "DECLARED"
  | "ENGINE";

export type TakeoffLineQuantitySource = {
  code: string;
  unit?: string | null;
  validatedQuantity?: number | null;
  computedQuantity?: number | null;
  declaredQuantity?: number | null;
  /** Valeur moteur computeStudy (nodes.value) — optionnelle. */
  engineValue?: number | null;
  lot?: string | null;
  designation?: string | null;
  provenance?: string | null;
};

/** Conserve la provenance métré (ex. HYPOTHESIS) — jamais promue en VALIDATED. */
function lineSourceProvenance(
  line: TakeoffLineQuantitySource,
  fallback: QuantityProvenance,
): QuantityProvenance {
  const kind = mapProvenanceKind({ provenance: line.provenance });
  if (kind === "HYPOTHESIS") return "HYPOTHESIS";
  if (kind === "MANUAL") return "MANUAL";
  if (kind === "MEASURE") return "MEASURE";
  if (kind === "PLAN") return "PLAN";
  if (kind === "CALCULATION") return "CALCULATION";
  return fallback;
}

export type ResolvedTakeoffQuantity = {
  quantity: number | null;
  unit: string | null;
  provenance: QuantityProvenance;
  sourceLineCode: string | null;
  /** Explicite : 1 Forfait reste une quantité valide. */
  isForfait: boolean;
};

export type PlanningTaskSourceInput = {
  stepId: string;
  stepName: string;
  stepKind?: string | null;
  stepLot?: string | null;
  stepDescription?: string | null;
  takeoffIds?: string[];
  /** Section commerciale devis (titre) si connue via lien structurel. */
  commercialSectionTitle?: string | null;
  /** Metadata workflow explicite (phase / groupe). */
  workflowPhase?: string | null;
  /** Référence phase d'exécution explicite (workflow.execution_phases). */
  executionPhaseId?: string | null;
  /** Catalogue des phases d'exécution du workflow. */
  executionPhases?: PrepExecutionPhaseDTO[] | null;
  line?: TakeoffLineQuantitySource | null;
  engineValue?: number | null;
};

export type PlanningTaskSourceResolved = {
  sourceLineCode: string | null;
  quantity: number | null;
  unit: string | null;
  quantityProvenance: QuantityProvenance;
  /** Groupe commercial devis — n'est pas une phase temporelle. */
  commercialGroup: string | null;
  /** Phase d'exécution résolue. */
  phase: CanonicalPhase;
  phaseSource:
    | "execution_phase"
    | "workflow"
    | "commercial_section"
    | "takeoff_lot"
    | "inferred"
    | "unclassified";
  classificationConfidence: "high" | "medium" | "low";
  driverTakeoffCode: string | null;
  /** structured | fallback | unstructured — pour qualité planning. */
  structureClass: "structured" | "fallback" | "unstructured";
};

function asFiniteNumber(n: unknown): number | null {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  return n;
}

/**
 * Priorité quantité métré → planning :
 * 1. validatedQuantity
 * 2. engineValue (si fini)
 * 3. computedQuantity
 * 4. declaredQuantity
 * 5. null
 *
 * Ne jamais inventer. 1 Forfait reste 1.
 */
export function resolveCanonicalTakeoffQuantity(
  line: TakeoffLineQuantitySource | null | undefined,
  engineValue?: number | null,
): ResolvedTakeoffQuantity {
  if (!line) {
    return {
      quantity: null,
      unit: null,
      provenance: "UNKNOWN",
      sourceLineCode: null,
      isForfait: false,
    };
  }
  const unit = (line.unit ?? "").trim() || null;
  const isForfait = !!unit && /forfait/i.test(unit);

  const validated = asFiniteNumber(line.validatedQuantity);
  if (validated != null) {
    return {
      quantity: validated,
      unit,
      provenance: "VALIDATED",
      sourceLineCode: line.code,
      isForfait,
    };
  }

  const engine = asFiniteNumber(engineValue ?? line.engineValue);
  if (engine != null) {
    return {
      quantity: engine,
      unit,
      provenance: lineSourceProvenance(line, "ENGINE"),
      sourceLineCode: line.code,
      isForfait,
    };
  }

  const computed = asFiniteNumber(line.computedQuantity);
  if (computed != null) {
    return {
      quantity: computed,
      unit,
      provenance: lineSourceProvenance(line, "COMPUTED"),
      sourceLineCode: line.code,
      isForfait,
    };
  }

  const declared = asFiniteNumber(line.declaredQuantity);
  if (declared != null) {
    return {
      quantity: declared,
      unit,
      provenance: lineSourceProvenance(line, "DECLARED"),
      sourceLineCode: line.code,
      isForfait,
    };
  }

  return {
    quantity: null,
    unit,
    provenance: "UNKNOWN",
    sourceLineCode: line.code,
    isForfait,
  };
}

/** Résolveur qtyOf pour computeSchedule — liens par code PrepLine. */
export function makeTakeoffQuantityResolver(
  lineByCode: Map<string, TakeoffLineQuantitySource>,
  engineValueOf?: (code: string) => number | null,
): (code: string) => number | null {
  return (code: string) => {
    const line = lineByCode.get(code);
    const engine = engineValueOf?.(code) ?? null;
    return resolveCanonicalTakeoffQuantity(line, engine).quantity;
  };
}

function cleanCommercialTitle(title: string | null | undefined): string | null {
  if (!title?.trim()) return null;
  return title.replace(/^Lot\s*\d+\s*[—–-]\s*/i, "").trim() || title.trim();
}

function isBroadCatchAllPhase(lot: string): boolean {
  return /^phase\s*\d+/i.test(lot.trim());
}

/**
 * Résout identité + quantité + phase d'exécution pour une tâche planning.
 *
 * Priorité phase :
 * 1. execution_phase_id explicite (workflow.execution_phases)
 * 2. metadata workflow (lot workflow non désignation)
 * 3. section commerciale / lot takeoff (legacy fallback)
 * 4. inférence texte (legacy)
 * 5. UNCLASSIFIED
 *
 * Matching texte = fallback uniquement.
 */
export function resolvePlanningTaskSource(
  input: PlanningTaskSourceInput,
): PlanningTaskSourceResolved {
  const takeoffIds = input.takeoffIds ?? [];
  const primaryCode =
    input.line?.code ??
    (takeoffIds.length === 1 ? takeoffIds[0]! : takeoffIds[0] ?? null);

  const qty = resolveCanonicalTakeoffQuantity(
    input.line ??
      (primaryCode
        ? { code: primaryCode, engineValue: input.engineValue }
        : null),
    input.engineValue,
  );

  const commercialGroup = cleanCommercialTitle(input.commercialSectionTitle);
  const workflowPhase = (input.workflowPhase ?? "").trim() || null;
  const takeoffLot = (input.line?.lot ?? input.stepLot ?? "").trim() || null;
  const designation = input.stepName;

  // 0. Phase d'exécution explicite — prioritaire, tous métiers
  const execId = (input.executionPhaseId ?? "").trim();
  const execPhases = input.executionPhases ?? [];
  if (execId && execPhases.length) {
    const ep = execPhases.find((p) => p.id === execId);
    if (ep) {
      const phase = canonicalPhaseFromExecution(ep);
      return {
        sourceLineCode: qty.sourceLineCode ?? primaryCode,
        quantity: qty.quantity,
        unit: qty.unit,
        quantityProvenance: qty.provenance,
        commercialGroup,
        phase,
        phaseSource: "execution_phase",
        classificationConfidence: "high",
        driverTakeoffCode:
          qty.quantity != null ? qty.sourceLineCode ?? primaryCode : primaryCode,
        structureClass: "structured",
      };
    }
  }

  let phaseLotCandidate: string | null = null;
  let phaseSource: PlanningTaskSourceResolved["phaseSource"] = "unclassified";
  let confidence: PlanningTaskSourceResolved["classificationConfidence"] =
    "low";

  // 1. Workflow metadata explicite (lot step — pas commercial)
  if (
    workflowPhase &&
    !isDesignationLikeLot(workflowPhase, designation)
  ) {
    phaseLotCandidate = workflowPhase;
    phaseSource = "workflow";
    confidence = "high";
  }

  // 2. Section commerciale structurée (si lot takeoff faible / catch-all / designation)
  // Ne pas coller le titre commercial dans `lot` : le passer via commercialSection
  // pour éviter qu'un libellé « Installation & déposes » force le rôle dépose.
  const takeoffWeak =
    !takeoffLot ||
    isDesignationLikeLot(takeoffLot, designation) ||
    isBroadCatchAllPhase(takeoffLot);

  let commercialPreferred = false;
  if (
    !phaseLotCandidate &&
    commercialGroup &&
    !isDesignationLikeLot(commercialGroup, designation) &&
    takeoffWeak
  ) {
    commercialPreferred = true;
    phaseSource = "commercial_section";
    confidence = "high";
  }

  // 3. Lot takeoff valide
  if (
    !phaseLotCandidate &&
    !commercialPreferred &&
    takeoffLot &&
    !isDesignationLikeLot(takeoffLot, designation) &&
    !isBroadCatchAllPhase(takeoffLot)
  ) {
    phaseLotCandidate = takeoffLot;
    phaseSource = "takeoff_lot";
    confidence = "medium";
  }

  // 4. Fallback : lot brut seulement si pas de section commerciale
  if (!phaseLotCandidate && !commercialPreferred && takeoffLot) {
    phaseLotCandidate = takeoffLot;
    phaseSource = "takeoff_lot";
    confidence = "low";
  }

  const phase = resolveCanonicalPhase({
    lot: phaseLotCandidate,
    name: designation,
    kind: input.stepKind,
    description: input.stepDescription,
    commercialSection: commercialGroup,
  });

  if (commercialPreferred && phase.label === commercialGroup) {
    phaseSource = "commercial_section";
  } else if (phase.source === "inferred") {
    phaseSource = "inferred";
    confidence = confidence === "high" ? "medium" : "low";
  } else if (phase.source === "unclassified") {
    phaseSource = "unclassified";
    confidence = "low";
  }

  const structureClass: PlanningTaskSourceResolved["structureClass"] =
    phase.structureSource === "unstructured" ||
    phase.role === "unclassified" ||
    phase.role === "generic"
      ? "unstructured"
      : "fallback";

  return {
    sourceLineCode: qty.sourceLineCode ?? primaryCode,
    quantity: qty.quantity,
    unit: qty.unit,
    quantityProvenance: qty.provenance,
    commercialGroup,
    phase: {
      ...phase,
      structureSource:
        structureClass === "unstructured"
          ? "unstructured"
          : "legacy_fallback",
    },
    phaseSource,
    classificationConfidence: confidence,
    driverTakeoffCode:
      qty.quantity != null ? qty.sourceLineCode ?? primaryCode : primaryCode,
    structureClass,
  };
}
