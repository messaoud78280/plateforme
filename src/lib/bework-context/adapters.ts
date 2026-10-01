/**
 * Adapters progressifs — dérivent des vues module depuis le snapshot canonique.
 * Ne remplacent PAS les builders legacy en production (zéro régression CTX-01).
 */
import type {
  ProjectContextQuote,
  ProjectContextSchedule,
  ProjectContextSnapshot,
  ProjectContextTakeoff,
  ProjectContextVisit,
} from "./types";

export function getTakeoffFromContext(
  snapshot: ProjectContextSnapshot,
  studyId: string,
): ProjectContextTakeoff | null {
  return snapshot.takeoffs.find((t) => t.id === studyId) ?? null;
}

export function getQuoteFromContext(
  snapshot: ProjectContextSnapshot,
  quoteId: string,
): ProjectContextQuote | null {
  return snapshot.quotes.find((q) => q.id === quoteId) ?? null;
}

export function getScheduleFromContext(
  snapshot: ProjectContextSnapshot,
  planId: string,
): ProjectContextSchedule | null {
  return snapshot.schedules.find((s) => s.id === planId) ?? null;
}

export function getVisitFromContext(
  snapshot: ProjectContextSnapshot,
  visitId: string,
): ProjectContextVisit | null {
  return snapshot.visits.find((v) => v.id === visitId) ?? null;
}

/** Devis de référence d’un scope, s’il existe. */
export function getScopeReferenceQuote(
  snapshot: ProjectContextSnapshot,
  scopeId: string,
): ProjectContextQuote | null {
  const scope = snapshot.scopes.find((s) => s.id === scopeId);
  if (!scope?.referenceQuoteId) return null;
  return getQuoteFromContext(snapshot, scope.referenceQuoteId);
}

/** Tous les devis d’un scope (multi-devis). */
export function getQuotesForScope(
  snapshot: ProjectContextSnapshot,
  scopeId: string,
): ProjectContextQuote[] {
  return snapshot.quotes.filter((q) => q.scopeId === scopeId);
}

/** Métrés d’un scope. */
export function getTakeoffsForScope(
  snapshot: ProjectContextSnapshot,
  scopeId: string,
): ProjectContextTakeoff[] {
  return snapshot.takeoffs.filter((t) => t.scopeId === scopeId);
}

/**
 * Vue compacte TAKEOFF compatible esprit bework_chatgpt_context_v1
 * (sans remplacer buildUniversalPatchContext).
 */
export function adaptTakeoffForChatgptContext(
  snapshot: ProjectContextSnapshot,
  studyId: string,
): Record<string, unknown> | null {
  const study = getTakeoffFromContext(snapshot, studyId);
  if (!study) return null;
  return {
    source: "bework_project_context_v1",
    section: "TAKEOFF",
    project: {
      id: snapshot.project.id,
      title: snapshot.project.title,
    },
    target: {
      entity_type: "PREP_STUDY",
      id: study.id,
      version: study.version,
      code: study.title,
    },
    data: {
      title: study.title,
      scope_id: study.scopeId,
      parameters: study.parameters.map((p) => ({
        id: p.id,
        key: p.key,
        label: p.label,
        value: p.value,
        unit: p.unit,
        formula: p.formula,
        provenance: p.provenance,
        provenance_kind: p.provenanceKind,
      })),
      lines: study.lines.map((l) => ({
        id: l.id,
        code: l.code,
        designation: l.designation,
        unit: l.unit,
        formula: l.formula,
        declared_quantity: l.declaredQuantity,
        validated_quantity: l.validatedQuantity,
        provenance: l.provenance,
        provenance_kind: l.provenanceKind,
        role: l.role,
      })),
      sources: study.sources.map((s) => ({
        id: s.id,
        display_title: s.displayTitle,
        chantier_file_id: s.chantierFileId,
        revision: s.revision,
      })),
    },
    versions: snapshot.versions,
  };
}

/**
 * Vue compacte QUOTE — ne remplace pas buildQuotePatchContextForChatgpt.
 */
export function adaptQuoteForChatgptContext(
  snapshot: ProjectContextSnapshot,
  quoteId: string,
): Record<string, unknown> | null {
  const quote = getQuoteFromContext(snapshot, quoteId);
  if (!quote) return null;
  return {
    source: "bework_project_context_v1",
    section: "QUOTE",
    type: "bework_quote_context_v1_from_canonical",
    project: {
      id: snapshot.project.id,
      title: snapshot.project.title,
    },
    target: {
      quote_number: quote.number,
      base_version: quote.versionNumber,
      subject: quote.subject,
      is_scope_reference: quote.isScopeReference,
      scope_id: quote.scopeId,
      transfer_study_version: quote.transfer?.studyVersion ?? null,
    },
    totals: {
      total_ht: quote.totalSellHt,
      total_ttc: quote.totalTtc,
    },
    sections: quote.sections.map((s) => ({
      section_id: s.id,
      title: s.title,
      items: s.lines.map((l) => ({
        item_id: l.id,
        designation: l.designation,
        quantity: l.quantity,
        unit: l.unit,
        unit_price_ht: l.unitSellHt,
        line_ht: l.lineSellHt,
        study_line_code: l.studyLineCode,
      })),
    })),
    versions: snapshot.versions,
  };
}

/**
 * Comparaison légère ancien/nouveau (diagnostic, pas de bascule prod).
 */
export function diffContextKeys(
  legacyKeys: string[],
  canonicalKeys: string[],
): { onlyLegacy: string[]; onlyCanonical: string[]; shared: string[] } {
  const L = new Set(legacyKeys);
  const C = new Set(canonicalKeys);
  return {
    onlyLegacy: legacyKeys.filter((k) => !C.has(k)),
    onlyCanonical: canonicalKeys.filter((k) => !L.has(k)),
    shared: legacyKeys.filter((k) => C.has(k)),
  };
}
