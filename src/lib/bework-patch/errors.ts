/**
 * Codes d’erreur / warning stables — bework_patch_v1.
 */

export const BEWORK_PATCH_ERROR_CODES = [
  "INVALID_JSON",
  "UNSUPPORTED_SCHEMA_VERSION",
  "INVALID_PATCH_TYPE",
  "INVALID_PATCH_ID",
  "UNKNOWN_OPERATION",
  "INVALID_TARGET",
  "TARGET_NOT_FOUND",
  "TARGET_ID_CODE_MISMATCH",
  "PROJECT_MISMATCH",
  "ORGANIZATION_MISMATCH",
  "VERSION_CONFLICT",
  "UNSUPPORTED_INTENT",
  "INTENT_OPERATION_MISMATCH",
  "CANONICAL_SOURCE_UNRESOLVED",
  "PROTECTED_ENTITY",
  "DUPLICATE_PATCH",
  "INVALID_SECTION",
  "EMPTY_OPERATIONS",
  "INVALID_FIELD",
  "INVALID_FIELD_TYPE",
  "OPERATION_NOT_ALLOWED_FOR_SECTION",
  "STUDY_MISSING",
] as const;
export type BeworkPatchErrorCode = (typeof BEWORK_PATCH_ERROR_CODES)[number];

export const BEWORK_PATCH_WARNING_CODES = [
  "PARTIAL_CANONICAL_RESOLUTION",
  "MANUAL_OVERRIDE_PRESENT",
  "CONTRACTUAL_ENTITY_LINKED",
  "DOWNSTREAM_IMPACT_POSSIBLE",
  "UNLINKED_QUOTE_ITEM",
  "UNLINKED_SCHEDULE_TASK",
  "LEGACY_ENTITY",
  "LEGACY_PATCH_DELEGATED",
  "REASON_MISSING",
  "LIKELY_OVERRIDE",
  "CALCULATION_UNRESOLVED",
  "SECTION_OUT_OF_SCOPE",
  "COMMERCIAL_SCOPE",
  "PLANNING_SCOPE",
  "IMPACT_UNSUPPORTED",
  "NONE_CANONICAL",
] as const;
export type BeworkPatchWarningCode = (typeof BEWORK_PATCH_WARNING_CODES)[number];

export type BeworkPatchIssue = {
  code: BeworkPatchErrorCode | BeworkPatchWarningCode;
  path: string;
  message: string;
  severity: "error" | "warn";
};

export function err(
  code: BeworkPatchErrorCode,
  path: string,
  message: string,
): BeworkPatchIssue {
  return { code, path, message, severity: "error" };
}

export function warn(
  code: BeworkPatchWarningCode,
  path: string,
  message: string,
): BeworkPatchIssue {
  return { code, path, message, severity: "warn" };
}
