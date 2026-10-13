/**
 * CTX-04 — Détection lecture seule : alignement planning ↔ version métré source.
 * Aucune écriture. Ne remplace pas revisionNumber (révision propre du planning).
 */

export type PlanningSyncDetectState =
  | "A_JOUR"
  | "MODIFICATION_DISPONIBLE"
  | "A_VERIFIER"
  | "ABSENT";

export type PlanningStudyVersionEval = {
  syncState: PlanningSyncDetectState;
  hint: string | null;
  /** Écart positif = métré en avance sur le planning. */
  versionGap: number | null;
};

/**
 * Compare la version courante du métré lié au planning
 * avec `studyVersionAtGeneration`.
 *
 * - current > source → MODIFICATION_DISPONIBLE
 * - current === source → A_JOUR
 * - source inconnue (null) → A_VERIFIER (jamais « à jour » artificiel)
 * - current < source → A_VERIFIER (incohérence, ne pas masquer)
 */
export function evaluatePlanningStudyVersionSync(input: {
  hasPlan: boolean;
  /** Version courante du PrepStudy réellement lié au plan (plan.studyId). */
  currentStudyVersion: number | null | undefined;
  studyVersionAtGeneration: number | null | undefined;
}): PlanningStudyVersionEval {
  if (!input.hasPlan) {
    return { syncState: "ABSENT", hint: null, versionGap: null };
  }

  const source = input.studyVersionAtGeneration;
  const current = input.currentStudyVersion;

  if (source == null || !Number.isFinite(Number(source))) {
    return {
      syncState: "A_VERIFIER",
      hint: "Version du métré source inconnue — le planning ne peut pas être considéré comme à jour.",
      versionGap: null,
    };
  }

  if (current == null || !Number.isFinite(Number(current))) {
    return {
      syncState: "A_VERIFIER",
      hint: "Métré source du planning introuvable pour vérifier l’alignement.",
      versionGap: null,
    };
  }

  const src = Number(source);
  const cur = Number(current);
  const gap = cur - src;

  if (gap > 0) {
    return {
      syncState: "MODIFICATION_DISPONIBLE",
      hint: `Métré V${cur} plus récent que le planning (généré sur V${src})`,
      versionGap: gap,
    };
  }

  if (gap < 0) {
    return {
      syncState: "A_VERIFIER",
      hint: `Incohérence de versions : planning source V${src} > métré courant V${cur}`,
      versionGap: gap,
    };
  }

  return { syncState: "A_JOUR", hint: null, versionGap: 0 };
}

function toEpochMs(value: Date | string | null | undefined): number | null {
  if (value == null) return null;
  const ms = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Détection lecture seule : un devis lié a bougé après la génération du planning.
 * Ne réécrit ni durées, ni quantités, ni le plan.
 *
 * - pas de devis rattaché → pas d’alerte
 * - version courante > version figée à la génération → à vérifier
 * - même version (ou version inconnue) mais devis modifié après createdAt du plan → à vérifier
 */
export function evaluatePlanningQuoteDrift(input: {
  hasPlan: boolean;
  quoteLinked: boolean;
  planGeneratedAt?: Date | string | null;
  quoteUpdatedAt?: Date | string | null;
  quoteVersionAtGeneration?: number | null;
  currentQuoteVersion?: number | null;
}): { stale: boolean; hint: string | null } {
  if (!input.hasPlan || !input.quoteLinked) {
    return { stale: false, hint: null };
  }

  const generated = input.quoteVersionAtGeneration;
  const current = input.currentQuoteVersion;
  if (
    generated != null &&
    current != null &&
    Number.isFinite(Number(generated)) &&
    Number.isFinite(Number(current)) &&
    Number(current) > Number(generated)
  ) {
    return {
      stale: true,
      hint: `Le devis a été modifié (v${Number(current)}, planning généré sur v${Number(generated)}). Vérifiez le planning avant de l’utiliser.`,
    };
  }

  const planMs = toEpochMs(input.planGeneratedAt);
  const quoteMs = toEpochMs(input.quoteUpdatedAt);
  if (planMs != null && quoteMs != null && quoteMs > planMs) {
    return {
      stale: true,
      hint: "Le devis a été modifié après la génération de ce planning. Vérifiez le planning avant de l’utiliser.",
    };
  }

  return { stale: false, hint: null };
}

/** Vrai si le planning doit être présenté comme « modification disponible ». */
export function isPlanningModificationDisponible(input: {
  hasPlan: boolean;
  currentStudyVersion: number | null | undefined;
  studyVersionAtGeneration: number | null | undefined;
}): boolean {
  return (
    evaluatePlanningStudyVersionSync(input).syncState ===
    "MODIFICATION_DISPONIBLE"
  );
}
