/**
 * Merge safe lors d'une régénération planning.
 * Identité stable : stepCode + driverTakeoffCode (fallback stepCode seul).
 */

export type EnrichmentSnapshot = {
  stepCode: string;
  driverTakeoffCode: string | null;
  crewJson: unknown;
  equipmentJson: unknown;
  suppliesJson: unknown;
  preconditionsJson: unknown;
  controlsJson: unknown;
  constraintsJson: unknown;
  safetyJson: unknown;
  description: string | null;
  rateId: string | null;
  rateValue: number | null;
  rateUnit: string | null;
  ratePer: string | null;
  parallelUnits: number;
  durationMode: string;
  durationDays: number;
  durationLockedByUser: boolean;
  computedDurationDays: number | null;
};

export type FreshTaskFields = {
  stepCode: string;
  driverTakeoffCode: string | null;
  quantitySnapshot: number | null;
  quantityUnit: string | null;
  lot: string | null;
  name: string;
  kind: string;
  description: string | null;
  takeoffCodesJson: unknown;
  dependsOnJson: unknown;
  preconditionsJson: unknown;
  controlsJson: unknown;
  constraintsJson: unknown;
  safetyJson: unknown;
  equipmentJson: unknown;
  suppliesJson: unknown;
  rateId: string | null;
  rateValue: number | null;
  rateUnit: string | null;
  ratePer: string | null;
  parallelUnits: number;
  durationMode: string;
  durationDays: number;
  crewJson: unknown;
};

export type MergedTaskFields = FreshTaskFields & {
  durationLockedByUser: boolean;
  computedDurationDays: number | null;
  preserved: string[];
  refreshed: string[];
};

function enrichmentKey(stepCode: string, driverTakeoffCode: string | null): string {
  return `${stepCode}::${driverTakeoffCode ?? ""}`;
}

export function indexEnrichments(
  rows: EnrichmentSnapshot[],
): Map<string, EnrichmentSnapshot> {
  const byBoth = new Map<string, EnrichmentSnapshot>();
  const byStep = new Map<string, EnrichmentSnapshot>();
  for (const r of rows) {
    byBoth.set(enrichmentKey(r.stepCode, r.driverTakeoffCode), r);
    // step seul seulement si unique
    if (!byStep.has(r.stepCode)) byStep.set(r.stepCode, r);
    else byStep.set(r.stepCode, null as unknown as EnrichmentSnapshot);
  }
  // Nettoyer les collisions step-only
  for (const [k, v] of [...byStep.entries()]) {
    if (!v) byStep.delete(k);
  }
  const out = new Map<string, EnrichmentSnapshot>();
  for (const [k, v] of byBoth) out.set(k, v);
  for (const [step, v] of byStep) {
    const key = enrichmentKey(step, v.driverTakeoffCode);
    if (!out.has(key)) out.set(`STEPONLY::${step}`, v);
  }
  return out;
}

export function findEnrichment(
  index: Map<string, EnrichmentSnapshot>,
  stepCode: string,
  driverTakeoffCode: string | null,
): EnrichmentSnapshot | null {
  const exact = index.get(enrichmentKey(stepCode, driverTakeoffCode));
  if (exact) return exact;
  if (driverTakeoffCode) {
    const stepOnly = index.get(`STEPONLY::${stepCode}`);
    if (stepOnly) return stepOnly;
  }
  return index.get(`STEPONLY::${stepCode}`) ?? null;
}

function jsonNonEmpty(v: unknown): boolean {
  if (v == null) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v as object).length > 0;
  if (typeof v === "string") return v.trim().length > 0;
  return true;
}

function preferUserJson(fresh: unknown, prev: unknown): unknown {
  return jsonNonEmpty(prev) ? prev : fresh;
}

/**
 * Rafraîchit le structurel source ; préserve les enrichissements utilisateur.
 */
export function mergeTaskOnRegeneration(
  fresh: FreshTaskFields,
  prev: EnrichmentSnapshot | null,
): MergedTaskFields {
  if (!prev) {
    return {
      ...fresh,
      durationLockedByUser: false,
      computedDurationDays: fresh.durationDays,
      preserved: [],
      refreshed: [
        "quantitySnapshot",
        "quantityUnit",
        "lot",
        "dependsOnJson",
        "takeoffCodesJson",
      ],
    };
  }

  const preserved: string[] = [];
  const refreshed: string[] = [
    "quantitySnapshot",
    "quantityUnit",
    "lot",
    "takeoffCodesJson",
    "dependsOnJson",
    "name",
    "kind",
  ];

  const crewJson = preferUserJson(fresh.crewJson, prev.crewJson);
  if (crewJson === prev.crewJson && jsonNonEmpty(prev.crewJson)) {
    preserved.push("crewJson");
  }

  const equipmentJson = preferUserJson(fresh.equipmentJson, prev.equipmentJson);
  if (equipmentJson === prev.equipmentJson && jsonNonEmpty(prev.equipmentJson)) {
    preserved.push("equipmentJson");
  }
  const suppliesJson = preferUserJson(fresh.suppliesJson, prev.suppliesJson);
  if (suppliesJson === prev.suppliesJson && jsonNonEmpty(prev.suppliesJson)) {
    preserved.push("suppliesJson");
  }
  const preconditionsJson = preferUserJson(
    fresh.preconditionsJson,
    prev.preconditionsJson,
  );
  if (
    preconditionsJson === prev.preconditionsJson &&
    jsonNonEmpty(prev.preconditionsJson)
  ) {
    preserved.push("preconditionsJson");
  }
  const controlsJson = preferUserJson(fresh.controlsJson, prev.controlsJson);
  if (controlsJson === prev.controlsJson && jsonNonEmpty(prev.controlsJson)) {
    preserved.push("controlsJson");
  }
  const constraintsJson = preferUserJson(
    fresh.constraintsJson,
    prev.constraintsJson,
  );
  if (
    constraintsJson === prev.constraintsJson &&
    jsonNonEmpty(prev.constraintsJson)
  ) {
    preserved.push("constraintsJson");
  }
  const safetyJson = preferUserJson(fresh.safetyJson, prev.safetyJson);
  if (safetyJson === prev.safetyJson && jsonNonEmpty(prev.safetyJson)) {
    preserved.push("safetyJson");
  }

  // Description enrichie : si l'utilisateur a modifié (≠ source fraîche précédente absente)
  let description = fresh.description;
  if (
    prev.description &&
    prev.description.trim() &&
    fresh.description &&
    prev.description.trim() !== fresh.description.trim()
  ) {
    // Conserver l'enrichissement manuel s'il est plus long / distinct
    if (prev.description.length >= (fresh.description?.length ?? 0)) {
      description = prev.description;
      preserved.push("description");
    }
  } else if (
    prev.description &&
    (!fresh.description || !fresh.description.trim())
  ) {
    description = prev.description;
    preserved.push("description");
  }

  // Rates manuels : si prev a un rate et fresh n'en a pas, ou durationLocked
  let rateId = fresh.rateId;
  let rateValue = fresh.rateValue;
  let rateUnit = fresh.rateUnit;
  let ratePer = fresh.ratePer;
  let parallelUnits = fresh.parallelUnits;
  if (prev.rateValue != null && fresh.rateValue == null) {
    rateId = prev.rateId;
    rateValue = prev.rateValue;
    rateUnit = prev.rateUnit;
    ratePer = prev.ratePer;
    parallelUnits = prev.parallelUnits;
    preserved.push("rate*");
  } else if (
    prev.rateValue != null &&
    fresh.rateValue != null &&
    Number(prev.rateValue) !== Number(fresh.rateValue)
  ) {
    // Préférer le rate utilisateur si duration was computed from it
    if (prev.durationMode === "computed" || prev.durationLockedByUser) {
      rateId = prev.rateId;
      rateValue = prev.rateValue;
      rateUnit = prev.rateUnit;
      ratePer = prev.ratePer;
      parallelUnits = prev.parallelUnits;
      preserved.push("rate*");
    }
  }

  let durationMode = fresh.durationMode;
  let durationDays = fresh.durationDays;
  let durationLockedByUser = false;
  let computedDurationDays: number | null = fresh.durationDays;

  if (prev.durationLockedByUser) {
    durationMode = "manual";
    durationDays = prev.durationDays;
    durationLockedByUser = true;
    computedDurationDays = prev.computedDurationDays;
    preserved.push("durationLocked");
  }

  return {
    ...fresh,
    description,
    crewJson,
    equipmentJson,
    suppliesJson,
    preconditionsJson,
    controlsJson,
    constraintsJson,
    safetyJson,
    rateId,
    rateValue,
    rateUnit,
    ratePer,
    parallelUnits,
    durationMode,
    durationDays,
    durationLockedByUser,
    computedDurationDays,
    preserved,
    refreshed,
  };
}
