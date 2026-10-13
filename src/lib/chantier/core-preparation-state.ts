/**
 * Source unique — état métier MÉTRÉ / DEVIS / PLANNING (Phase 1 cohérence).
 *
 * Réutilise CTX-03 (`evaluateQuoteStudySyncState`) et CTX-04
 * (`evaluatePlanningStudyVersionSync`) — pas de duplication des comparaisons
 * de versions.
 *
 * Consommateurs : preparation-state (liste), project-workspace (fiche).
 * Ne décide pas de la progression globale ni de la nextAction.
 */
import {
  evaluateQuoteStudySyncState,
  type QuoteStudySyncDetectState,
} from "@/lib/preparation/quote-bridge/quote-sync-state";
import {
  evaluatePlanningQuoteDrift,
  evaluatePlanningStudyVersionSync,
  type PlanningSyncDetectState,
} from "@/lib/preparation/schedule/planning-sync-state";
import {
  getQuotePreparationPhase,
  quotePreparationStateLabel,
} from "@/lib/chantier/quote-workflow-status";

/** État métier métré (dossier), indépendant de l’existence seule. */
export type MetreCoreKind =
  | "ABSENT"
  | "IN_PROGRESS"
  | "NEEDS_VALIDATION"
  | "VALIDATED";

export type CoreModuleProgressBucket = "done" | "progress" | "todo" | "na";

export type MetreCoreState = {
  kind: MetreCoreKind;
  exists: boolean;
  dossierStatus: string | null;
  lineCount: number;
  /** Libellé métier principal (ex. « À valider · 32 postes »). */
  displayLabel: string;
  /**
   * Bucket pour les formules de progression existantes (Phase 1 :
   * ne pas redéfinir ce que signifie « terminé » au niveau 7 étapes).
   */
  progressBucket: CoreModuleProgressBucket;
  /** Prêt « chaîne chantier » — validé dossier uniquement. */
  workflowReady: boolean;
};

export type QuoteCoreState = {
  exists: boolean;
  commercialStatus: string | null;
  syncState: QuoteStudySyncDetectState;
  needsRevalidation: boolean;
  displayLabel: string;
  progressBucket: CoreModuleProgressBucket;
  /** Existence + statut commercial « prêt » (inchangé Phase 1 pour 5/7). */
  workflowReady: boolean;
};

export type PlanningCoreState = {
  exists: boolean;
  planStatus: string | null;
  syncState: PlanningSyncDetectState;
  needsUpdate: boolean;
  displayLabel: string;
  /** Info secondaire (ex. date début). */
  secondaryLabel: string | null;
  progressBucket: CoreModuleProgressBucket;
  /** Plan présent (inchangé Phase 1 pour 5/7). */
  workflowReady: boolean;
  /** Motif lisible (métré CTX-04 ou devis modifié). */
  syncHint: string | null;
};

export type CorePreparationTriple = {
  metre: MetreCoreState;
  devis: QuoteCoreState;
  planning: PlanningCoreState;
};

function posteSuffix(count: number): string {
  if (count <= 0) return "";
  return ` · ${count} poste${count > 1 ? "s" : ""}`;
}

/**
 * Métré — source unique.
 * PRO_A_VALIDER → NEEDS_VALIDATION (pas « terminé »).
 * PRO_VALIDE / DEMONSTRATION → VALIDATED.
 */
export function evaluateMetreCoreState(input: {
  study: {
    dossierStatus: string | null;
    lineCount: number;
  } | null;
}): MetreCoreState {
  if (!input.study) {
    return {
      kind: "ABSENT",
      exists: false,
      dossierStatus: null,
      lineCount: 0,
      displayLabel: "À préparer",
      progressBucket: "todo",
      workflowReady: false,
    };
  }
  const status = input.study.dossierStatus;
  const posts = posteSuffix(input.study.lineCount);

  if (status === "PRO_VALIDE" || status === "DEMONSTRATION") {
    return {
      kind: "VALIDATED",
      exists: true,
      dossierStatus: status,
      lineCount: input.study.lineCount,
      displayLabel: `Validé${posts}`,
      progressBucket: "done",
      workflowReady: true,
    };
  }

  if (status === "PRO_A_VALIDER") {
    return {
      kind: "NEEDS_VALIDATION",
      exists: true,
      dossierStatus: status,
      lineCount: input.study.lineCount,
      displayLabel: `À valider${posts}`,
      progressBucket: "progress",
      /**
       * Phase 1 : non validé dossier → pas « terminé ».
       * Le compteur 5/7 peut baisser mécaniquement ; la formule elle-même
       * n’est pas réécrite.
       */
      workflowReady: false,
    };
  }

  return {
    kind: "IN_PROGRESS",
    exists: true,
    dossierStatus: status,
    lineCount: input.study.lineCount,
    displayLabel: `En cours${posts}`,
    progressBucket: "progress",
    workflowReady: false,
  };
}

/**
 * Devis — sync CTX-03 prioritaire sur le statut commercial.
 * VALIDATED + MODIFICATION_DISPONIBLE → « À revalider » (pas « Prêt »).
 */
export function evaluateQuoteCoreState(input: {
  quote: { status: string } | null;
  hasMetreProvenance: boolean;
  currentStudyVersion: number | null | undefined;
  transferStudyVersion: number | null | undefined;
  hasSignificantQuantityDiffs?: boolean | null;
}): QuoteCoreState {
  if (!input.quote) {
    return {
      exists: false,
      commercialStatus: null,
      syncState: "ABSENT",
      needsRevalidation: false,
      displayLabel: "À préparer",
      progressBucket: "todo",
      workflowReady: false,
    };
  }

  const sync = evaluateQuoteStudySyncState({
    hasQuote: true,
    hasMetreProvenance: input.hasMetreProvenance,
    currentStudyVersion: input.currentStudyVersion,
    transferStudyVersion: input.transferStudyVersion,
    hasSignificantQuantityDiffs: input.hasSignificantQuantityDiffs,
  });

  const phase = getQuotePreparationPhase(input.quote.status);
  const commercialLabel = quotePreparationStateLabel(input.quote.status);
  const commercialReady = phase === "ready" || phase === "accepted";
  const needsRevalidation = sync.syncState === "MODIFICATION_DISPONIBLE";
  const needsVerify = sync.syncState === "A_VERIFIER";

  let displayLabel = commercialLabel;
  if (needsRevalidation) {
    // Conserver l’info DRAFT sans masquer le blocking sync.
    displayLabel =
      phase === "draft" || input.quote.status === "DRAFT"
        ? "Brouillon · à revalider"
        : "À revalider";
  } else if (needsVerify && input.hasMetreProvenance) {
    displayLabel = "À vérifier";
  }

  // Progression Phase 1 : conserver le bucket commercial (86 % inchangé).
  let progressBucket: CoreModuleProgressBucket = "progress";
  if (phase === "ready" || phase === "accepted") progressBucket = "done";
  else if (phase === "closed") progressBucket = "todo";

  return {
    exists: true,
    commercialStatus: input.quote.status,
    syncState: sync.syncState,
    needsRevalidation,
    displayLabel,
    progressBucket,
    workflowReady: commercialReady,
  };
}

/**
 * Planning — sync CTX-04 prioritaire.
 * CURRENT + MODIFICATION_DISPONIBLE → « Modification disponible » (pas « Prêt »).
 */
export function evaluatePlanningCoreState(input: {
  plan: {
    status: string;
    studyVersionAtGeneration?: number | null;
    startDateLabel?: string | null;
    quoteId?: string | null;
    createdAt?: Date | string | null;
    quoteUpdatedAt?: Date | string | null;
    quoteVersionAtGeneration?: number | null;
    currentQuoteVersion?: number | null;
  } | null;
  archivedOnly?: boolean;
  currentStudyVersion: number | null | undefined;
}): PlanningCoreState {
  if (
    !input.plan ||
    input.plan.status === "ARCHIVED" ||
    input.archivedOnly
  ) {
    return {
      exists: false,
      planStatus: input.plan?.status ?? null,
      syncState: "ABSENT",
      needsUpdate: false,
      displayLabel: input.archivedOnly
        ? "Aucun planning actif"
        : "À préparer",
      secondaryLabel: null,
      progressBucket: "todo",
      workflowReady: false,
      syncHint: null,
    };
  }

  const quoteDrift = evaluatePlanningQuoteDrift({
    hasPlan: true,
    quoteLinked: Boolean(input.plan.quoteId),
    planGeneratedAt: input.plan.createdAt,
    quoteUpdatedAt: input.plan.quoteUpdatedAt,
    quoteVersionAtGeneration: input.plan.quoteVersionAtGeneration,
    currentQuoteVersion: input.plan.currentQuoteVersion,
  });

  if (input.plan.status === "DRAFT" && !quoteDrift.stale) {
    return {
      exists: true,
      planStatus: input.plan.status,
      syncState: "A_JOUR",
      needsUpdate: false,
      displayLabel: "En préparation",
      secondaryLabel: input.plan.startDateLabel ?? null,
      progressBucket: "progress",
      workflowReady: true,
      syncHint: null,
    };
  }

  const sync = evaluatePlanningStudyVersionSync({
    hasPlan: true,
    currentStudyVersion: input.currentStudyVersion,
    studyVersionAtGeneration: input.plan.studyVersionAtGeneration,
  });

  const quoteOverridesStudy =
    quoteDrift.stale && sync.syncState === "A_JOUR";
  const syncState: PlanningSyncDetectState = quoteOverridesStudy
    ? "A_VERIFIER"
    : sync.syncState;
  const needsUpdate = syncState === "MODIFICATION_DISPONIBLE";
  const needsVerify = syncState === "A_VERIFIER";

  let displayLabel = input.plan.status === "DRAFT" ? "En préparation" : "Prêt";
  if (needsUpdate) displayLabel = "Modification disponible";
  else if (needsVerify) displayLabel = "À vérifier";

  return {
    exists: true,
    planStatus: input.plan.status,
    syncState,
    needsUpdate,
    displayLabel,
    secondaryLabel: input.plan.startDateLabel ?? null,
    // Progression Phase 1 : plan présent non-brouillon = done (86 % inchangé).
    progressBucket: input.plan.status === "DRAFT" ? "progress" : "done",
    workflowReady: true,
    syncHint: quoteOverridesStudy ? quoteDrift.hint : sync.hint,
  };
}

/** Triple métré/devis/planning à partir de données déjà chargées (pas de fetch). */
export function evaluateCorePreparationTriple(input: {
  study: {
    id: string;
    dossierStatus: string | null;
    lineCount: number;
    version?: number | null;
  } | null;
  quote: { id: string; status: string } | null;
  quoteSync?: {
    hasMetreProvenance: boolean;
    currentStudyVersion: number | null | undefined;
    transferStudyVersion: number | null | undefined;
    hasSignificantQuantityDiffs?: boolean | null;
  } | null;
  plan: {
    id: string;
    status: string;
    studyId?: string | null;
    studyVersionAtGeneration?: number | null;
    startDateLabel?: string | null;
    quoteId?: string | null;
    createdAt?: Date | string | null;
    quoteUpdatedAt?: Date | string | null;
    quoteVersionAtGeneration?: number | null;
    currentQuoteVersion?: number | null;
  } | null;
  planStudyVersion?: number | null;
  archivedOnly?: boolean;
}): CorePreparationTriple {
  const metre = evaluateMetreCoreState({ study: input.study });

  const devis = evaluateQuoteCoreState({
    quote: input.quote,
    hasMetreProvenance: input.quoteSync?.hasMetreProvenance ?? false,
    currentStudyVersion: input.quoteSync?.currentStudyVersion ?? null,
    transferStudyVersion: input.quoteSync?.transferStudyVersion ?? null,
    hasSignificantQuantityDiffs:
      input.quoteSync?.hasSignificantQuantityDiffs ?? null,
  });

  const planning = evaluatePlanningCoreState({
    plan: input.plan,
    archivedOnly: input.archivedOnly,
    currentStudyVersion:
      input.planStudyVersion ?? input.study?.version ?? null,
  });

  return { metre, devis, planning };
}
