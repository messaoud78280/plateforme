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

export { mapProvenanceKind } from "./provenance";

export {
  getTakeoffFromContext,
  getQuoteFromContext,
  getScheduleFromContext,
  getVisitFromContext,
  getScopeReferenceQuote,
  getQuotesForScope,
  getTakeoffsForScope,
  adaptTakeoffForChatgptContext,
  adaptQuoteForChatgptContext,
  diffContextKeys,
} from "./adapters";
