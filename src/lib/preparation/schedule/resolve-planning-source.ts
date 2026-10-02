/**
 * Résolution canonique des sources Planning — générique tous métiers.
 * Priorité aux liens structurels (PrepLine / QuoteItem), jamais au matching texte.
 *
 * Chaîne : Quote → Takeoff → Planning
 */

import type { CanonicalPhase } from "./phase";
import {
  isDesignationLikeLot,
  resolveCanonicalPhase,
} from "./phase";

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
    | "workflow"
    | "commercial_section"
    | "takeoff_lot"
    | "inferred"
    | "unclassified";
  classificationConfidence: "high" | "medium" | "low";
  driverTakeoffCode: string | null;
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
      provenance: "ENGINE",
      sourceLineCode: line.code,
      isForfait,
    };
  }

  const computed = asFiniteNumber(line.computedQuantity);
  if (computed != null) {
    return {
      quantity: computed,
      unit,
      provenance: "COMPUTED",
      sourceLineCode: line.code,
      isForfait,
    };
  }

  const declared = asFiniteNumber(line.declaredQuantity);
  if (declared != null) {
    return {
      quantity: declared,
      unit,
      provenance: "DECLARED",
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
 * Matching texte = fallback uniquement (via resolveCanonicalPhase).
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

  let phaseLotCandidate: string | null = null;
  let phaseSource: PlanningTaskSourceResolved["phaseSource"] = "unclassified";
  let confidence: PlanningTaskSourceResolved["classificationConfidence"] =
    "low";

  // 1. Workflow metadata explicite
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

  return {
    sourceLineCode: qty.sourceLineCode ?? primaryCode,
    quantity: qty.quantity,
    unit: qty.unit,
    quantityProvenance: qty.provenance,
    commercialGroup,
    phase,
    phaseSource,
    classificationConfidence: confidence,
    driverTakeoffCode:
      qty.quantity != null ? qty.sourceLineCode ?? primaryCode : primaryCode,
  };
}
