/**
 * bework_patch_v1 — façade Phase B/C (parse / validate / adapters / capability).
 * Aucune écriture DB · aucune propagation cross-module en Phase C.
 */

export {
  BEWORK_PATCH_FORMAT,
  BEWORK_PATCH_SCHEMA_VERSION,
  BEWORK_CONTEXT_FORMAT,
  BEWORK_CONTEXT_SCHEMA_VERSION,
  BEWORK_PATCH_SECTIONS,
  BEWORK_CHANGE_INTENTS,
  BEWORK_ENTITY_TYPES,
  CANONICAL_RESOLUTION_STATUSES,
} from "@/lib/bework-patch/types";

export type {
  BeworkPatchV1,
  BeworkPatchOperation,
  BeworkPatchSection,
  BeworkChangeIntent,
  BeworkEntityType,
  BeworkChatgptContextV1,
  CanonicalResolution,
  CanonicalResolutionStatus,
  BeworkSupportedOperationSpec,
} from "@/lib/bework-patch/types";

export {
  BEWORK_PATCH_ERROR_CODES,
  BEWORK_PATCH_WARNING_CODES,
  type BeworkPatchErrorCode,
  type BeworkPatchWarningCode,
  type BeworkPatchIssue,
} from "@/lib/bework-patch/errors";

export {
  OPERATION_CATALOG,
  supportedOperationsForSection,
  intentsForSection,
} from "@/lib/bework-patch/operations-catalog";

export { parseBeworkPatch, type ParseBeworkPatchResult } from "@/lib/bework-patch/parse";

export {
  validatePatchContext,
  validatePatchAgainstChatgptContext,
  type PatchContextSnapshot,
  type ValidatePatchContextResult,
} from "@/lib/bework-patch/validate-context";

export {
  buildCanonicalResolution,
  buildChatgptContextSkeleton,
  contextToClipboardText,
} from "@/lib/bework-patch/context";

export {
  canDelegateToQuotePatch,
  toLegacyQuotePatch,
} from "@/lib/bework-patch/adapters/quote";

export {
  canDelegateToPrepPatch,
  toLegacyPrepPatch,
} from "@/lib/bework-patch/adapters/prep";

export {
  getSectionCapability,
  SECTION_PATCH_CAPABILITY,
  type PatchCapabilityMode,
  type SectionPatchCapability,
} from "@/lib/bework-patch/capability";

export {
  analyzeBeworkPatchInput,
  type BeworkPatchAnalyzeResult,
} from "@/lib/bework-patch/analyze";
