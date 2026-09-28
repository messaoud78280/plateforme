/**
 * BeWork Technical Engine V1 — couche universelle au-dessus de PrepStudy.
 */
export {
  TECHNICAL_BUNDLE_FORMAT,
  TECHNICAL_SCHEMA_VERSION,
  type TechnicalBundleV1,
} from "@/lib/technical-engine/schema";
export {
  parseTechnicalBundle,
  parseTechnicalJsonText,
  type TechnicalParseResult,
  type TechnicalIssue,
} from "@/lib/technical-engine/parse";
export { previewTechnicalImport } from "@/lib/technical-engine/preview";
export { commitTechnicalImport } from "@/lib/technical-engine/commit";
export { adaptPrepBundleToTechnical, isPrepBundleShape } from "@/lib/technical-engine/adapt-prep";
export { technicalToPrepBundleJson } from "@/lib/technical-engine/normalize-to-prep";
export { setStudyScheduleStartDate } from "@/lib/technical-engine/set-start-date";
