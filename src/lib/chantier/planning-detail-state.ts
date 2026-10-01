/**
 * Projection UI détail planning — délègue CTX-04 à evaluatePlanningStudyVersionSync.
 * Ne recalcule pas le métier.
 */

import {
  evaluatePlanningStudyVersionSync,
  type PlanningSyncDetectState,
} from "@/lib/preparation/schedule/planning-sync-state";

export type PlanningDetailSyncVariant = "ok" | "warn" | "alert" | "neutral";

export type PlanningDetailState = {
  status: string;
  revisionNumber: number | null;
  syncState: PlanningSyncDetectState;
  syncLabel: string | null;
  syncVariant: PlanningDetailSyncVariant;
  syncMessage: string | null;
  needsUpdate: boolean;
  /** Date de démarrage formatée — toujours secondaire face au sync. */
  startDateLabel: string | null;
  /**
   * Badge principal.
   * Stale → Modification disponible ; sinon statut technique condensé.
   */
  primaryLabel: string;
  primaryVariant: PlanningDetailSyncVariant;
  secondaryLabel: string | null;
};

export function planningSyncDisplayLabel(
  syncState: PlanningSyncDetectState,
): string | null {
  switch (syncState) {
    case "A_JOUR":
      return "À jour";
    case "MODIFICATION_DISPONIBLE":
      return "Modification disponible";
    case "A_VERIFIER":
      return "À vérifier";
    case "ABSENT":
      return null;
  }
}

export function planningSyncUserMessage(
  syncState: PlanningSyncDetectState,
): string | null {
  switch (syncState) {
    case "MODIFICATION_DISPONIBLE":
      return "Le métré utilisé pour générer ce planning a évolué. Le planning peut nécessiter une mise à jour.";
    case "A_VERIFIER":
      return "L’alignement avec le métré n’a pas pu être confirmé. Vérifiez avant de considérer ce planning comme à jour.";
    default:
      return null;
  }
}

function variantForSync(
  syncState: PlanningSyncDetectState,
): PlanningDetailSyncVariant {
  if (syncState === "MODIFICATION_DISPONIBLE") return "alert";
  if (syncState === "A_VERIFIER") return "warn";
  if (syncState === "A_JOUR") return "ok";
  return "neutral";
}

/**
 * Construit l’état affiché sur la page détail d’UN planning.
 * Délègue exclusivement à evaluatePlanningStudyVersionSync (CTX-04).
 */
export function buildPlanningDetailState(input: {
  status: string;
  revisionNumber?: number | null;
  studyVersionAtGeneration: number | null | undefined;
  currentStudyVersion: number | null | undefined;
  startDateLabel?: string | null;
}): PlanningDetailState {
  const status = input.status;
  const revisionNumber = input.revisionNumber ?? null;
  const startDateLabel = input.startDateLabel ?? null;

  const evalResult = evaluatePlanningStudyVersionSync({
    hasPlan: true,
    currentStudyVersion: input.currentStudyVersion,
    studyVersionAtGeneration: input.studyVersionAtGeneration,
  });

  const syncState = evalResult.syncState;
  const syncLabel = planningSyncDisplayLabel(syncState);
  const syncVariant = variantForSync(syncState);
  const needsUpdate = syncState === "MODIFICATION_DISPONIBLE";
  const needsVerify = syncState === "A_VERIFIER";

  let primaryLabel: string;
  let primaryVariant: PlanningDetailSyncVariant;
  let secondaryLabel: string | null = startDateLabel;

  if (needsUpdate) {
    primaryLabel = "Modification disponible";
    primaryVariant = "alert";
  } else if (needsVerify) {
    primaryLabel = "À vérifier";
    primaryVariant = "warn";
  } else if (status === "DRAFT") {
    primaryLabel = "En préparation";
    primaryVariant = "neutral";
  } else if (syncState === "A_JOUR") {
    primaryLabel = "À jour";
    primaryVariant = "ok";
  } else {
    primaryLabel = status;
    primaryVariant = "neutral";
  }

  // Date toujours secondaire — jamais en lieu du sync.
  if (startDateLabel && primaryLabel !== startDateLabel) {
    secondaryLabel = startDateLabel;
  }

  return {
    status,
    revisionNumber,
    syncState,
    syncLabel,
    syncVariant,
    syncMessage: planningSyncUserMessage(syncState),
    needsUpdate,
    startDateLabel,
    primaryLabel,
    primaryVariant,
    secondaryLabel,
  };
}
