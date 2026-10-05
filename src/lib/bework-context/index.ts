/**
 * Contexte chantier canonique BeWork (CTX-01) — lecture seule.
 */
export {
  buildProjectContext,
  ProjectContextError,
  TAKEOFF_LINE_SOFT_LIMIT,
  QUOTE_LINE_SOFT_LIMIT,
  type BuildProjectContextOptions,
} from "./build-project-context";

export {
  PROJECT_CONTEXT_FORMAT,
  PROJECT_CONTEXT_SCHEMA_VERSION,
  type ProjectContextSnapshot,
  type ProjectContextProvenanceKind,
  type ProjectContextSource,
  type ProjectContextTakeoff,
  type ProjectContextQuote,
  type ProjectContextSchedule,
  type ProjectContextVisit,
} from "./types";

export {
  mapProvenanceKind,
  evaluateSourceProtection,
  compareProvenance,
  isProtectedSource,
  provenanceLabelFr,
  PROVENANCE_RANK,
  PROTECTED_PROVENANCE_KINDS,
} from "./provenance";

export {
  getTakeoffFromContext,
  getQuoteFromContext,
  getScheduleFromContext,
  getVisitFromContext,
  getScopeReferenceQuote,
  getQuotesForScope,
  getTakeoffsForScope,
  adaptTakeoffForChatgptContext,
  adaptVisitForChatgptContext,
  adaptQuoteForChatgptContext,
  diffContextKeys,
  TAKEOFF_CHATGPT_INSTRUCTIONS,
} from "./adapters";

export {
  computeVisitContextVersion,
  canonicalizeVisitContextPayload,
  digestToBaseVersion,
  isVisitContextStale,
  type VisitContextVersionInput,
} from "./visit-context-version";

export {
  buildTakeoffCreateContext,
  buildTakeoffCreateContextFromVisit,
  buildTakeoffModifyContext,
  buildTakeoffVersionsBlock,
  resolveProjectCurrentTakeoff,
  computeTakeoffCreateSourcesFingerprint,
  loadCurrentTakeoffCreateSourcesFingerprint,
  TAKEOFF_CREATE_INSTRUCTIONS,
  type BeworkTakeoffCreateContextV1,
  type BeworkTakeoffModifyContextV1,
  type BeworkTakeoffChatgptContextV1,
  type TakeoffContextVersionsBlock,
} from "./adapt-takeoff-create";

export {
  buildQuoteCreateContext,
  computeQuoteCreateSourcesFingerprint,
  loadCurrentQuoteCreateSourcesFingerprint,
  previewQuoteCreateFromBundle,
  commitQuoteCreateFromBundle,
  QUOTE_CREATE_INSTRUCTIONS,
  type BeworkQuoteCreateContextV1,
  type QuoteCreatePreviewResult,
  type QuoteCreateQuantityDrift,
} from "./adapt-quote-create";

export {
  buildPlanningCreateContext,
  computePlanningCreateSourcesFingerprint,
  loadCurrentPlanningCreateSourcesFingerprint,
  previewPlanningCreateFromBundle,
  commitPlanningCreateFromBundle,
  parseBeworkScheduleBundle,
  PLANNING_CREATE_INSTRUCTIONS,
  BEWORK_SCHEDULE_BUNDLE_FORMAT,
  type BeworkPlanningCreateContextV1,
  type BeworkScheduleBundleV1,
  type PlanningCreatePreviewResult,
} from "./adapt-planning-create";
