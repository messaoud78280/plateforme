/**
 * CTX-03 — Détection lecture seule : alignement devis ↔ version métré source.
 * Aucune écriture. Ne modifie jamais le devis commercial.
 */
export type QuoteStudySyncDetectState =
  | "A_JOUR"
  | "MODIFICATION_DISPONIBLE"
  | "A_VERIFIER"
  | "ABSENT";

export type QuoteStudyVersionEval = {
  syncState: QuoteStudySyncDetectState;
  hint: string | null;
  versionGap: number | null;
  /** Motif principal de la décision (diagnostic / tests). */
  reason:
    | "ABSENT"
    | "INDEPENDENT"
    | "SOURCE_UNKNOWN"
    | "STUDY_UNKNOWN"
    | "VERSION_AHEAD"
    | "VERSION_INCOHERENT"
    | "QUANTITY_DIFF"
    | "ALIGNED";
};

/**
 * Évalue l’état de synchronisation d’un devis par rapport à son métré lié.
 *
 * - Devis indépendant (pas de transfer / lien) → A_JOUR (pas d’erreur artificielle)
 * - Transfer présent mais studyVersion manquante → A_VERIFIER
 * - current > transfer → MODIFICATION_DISPONIBLE (À revalider)
 * - current < transfer → A_VERIFIER
 * - versions égales + écarts quantité significatifs (PrepQuoteLink) → MODIFICATION_DISPONIBLE
 * - versions égales sans écart quantité → A_JOUR
 */
export function evaluateQuoteStudySyncState(input: {
  hasQuote: boolean;
  /** Au moins un PrepQuoteTransfer ou PrepQuoteLink vers un métré. */
  hasMetreProvenance: boolean;
  currentStudyVersion: number | null | undefined;
  transferStudyVersion: number | null | undefined;
  /**
   * true = au moins un écart de quantité lié (PrepQuoteLink vs métré).
   * false = aucun écart quantité détecté.
   * null/undefined = non calculé (décision sur la version seule).
   */
  hasSignificantQuantityDiffs?: boolean | null;
}): QuoteStudyVersionEval {
  if (!input.hasQuote) {
    return {
      syncState: "ABSENT",
      hint: null,
      versionGap: null,
      reason: "ABSENT",
    };
  }

  if (!input.hasMetreProvenance) {
    return {
      syncState: "A_JOUR",
      hint: null,
      versionGap: null,
      reason: "INDEPENDENT",
    };
  }

  const source = input.transferStudyVersion;
  const current = input.currentStudyVersion;

  if (source == null || !Number.isFinite(Number(source))) {
    return {
      syncState: "A_VERIFIER",
      hint: "Version du métré source inconnue — le devis ne peut pas être considéré comme synchronisé.",
      versionGap: null,
      reason: "SOURCE_UNKNOWN",
    };
  }

  if (current == null || !Number.isFinite(Number(current))) {
    return {
      syncState: "A_VERIFIER",
      hint: "Métré source du devis introuvable pour vérifier l’alignement.",
      versionGap: null,
      reason: "STUDY_UNKNOWN",
    };
  }

  const src = Number(source);
  const cur = Number(current);
  const gap = cur - src;

  if (gap > 0) {
    return {
      syncState: "MODIFICATION_DISPONIBLE",
      hint: `Le métré a été modifié depuis la synchronisation de ce devis (métré V${cur}, devis basé sur V${src}).`,
      versionGap: gap,
      reason: "VERSION_AHEAD",
    };
  }

  if (gap < 0) {
    return {
      syncState: "A_VERIFIER",
      hint: `Incohérence de versions : devis source V${src} > métré courant V${cur}`,
      versionGap: gap,
      reason: "VERSION_INCOHERENT",
    };
  }

  if (input.hasSignificantQuantityDiffs === true) {
    return {
      syncState: "MODIFICATION_DISPONIBLE",
      hint: "Des quantités du métré diffèrent des postes liés de ce devis.",
      versionGap: 0,
      reason: "QUANTITY_DIFF",
    };
  }

  return {
    syncState: "A_JOUR",
    hint: null,
    versionGap: 0,
    reason: "ALIGNED",
  };
}

export function isQuoteARevalider(input: Parameters<typeof evaluateQuoteStudySyncState>[0]): boolean {
  return evaluateQuoteStudySyncState(input).syncState === "MODIFICATION_DISPONIBLE";
}

/**
 * Écart quantité significatif entre snapshot de transfert et quantité métré courante.
 * Utilise les caches métré (validated/computed/declared) — pas de recalcul moteur.
 */
export function hasQuantityDiffAgainstTransfer(input: {
  quantityAtTransfer: number | null | undefined;
  currentQuantity: number | null | undefined;
  epsilon?: number;
}): boolean {
  if (input.quantityAtTransfer == null || input.currentQuantity == null) return false;
  const eps = input.epsilon ?? 1e-9;
  return Math.abs(Number(input.currentQuantity) - Number(input.quantityAtTransfer)) > eps;
}
