export {
  suggestWorkItemReclassification,
  workItemNeedsReclassification,
  areFamilyCodesCompatible,
  isMisclassifiedGenericItem,
  type ClassificationConfidence,
  type ClassificationSuggestion,
  type WorkItemForClassification,
} from "@/lib/work-item-library-cleanup/classification";
export {
  computePriceStatsFromEntries,
  buildPriceStatsMap,
  type WorkItemPriceStats,
} from "@/lib/work-item-library-cleanup/price-stats";
export { pickCanonicalWorkItemWithPrices } from "@/lib/work-item-library-cleanup/pick-canonical-with-prices";
export {
  buildDuplicateReviewGroups,
  type DuplicateReviewGroup,
  type DuplicateReviewMember,
} from "@/lib/work-item-library-cleanup/duplicate-review";
export {
  appendJobLog,
  defaultBatchSize,
  type CleanupJobLogEntry,
  type CleanupJobCursor,
} from "@/lib/work-item-library-cleanup/batch-job";
