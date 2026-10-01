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
