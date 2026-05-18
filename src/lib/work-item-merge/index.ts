export {
  normalizeWorkItemDesignation,
  workItemDesignationForMerge,
} from "@/lib/work-item-merge/normalize-designation";
export { findWorkItemMergeBlocker } from "@/lib/work-item-merge/merge-blockers";
export {
  pickCanonicalWorkItem,
  canonicalDesignationFromItem,
} from "@/lib/work-item-merge/pick-canonical";
export { scoreWorkItemDesignationSimilarity } from "@/lib/work-item-merge/similarity";
export {
  analyzeWorkItemDuplicates,
  clusterExactDuplicates,
  type DuplicateAnalysisResult,
  type DuplicateCluster,
  type WorkItemForDuplicateScan,
} from "@/lib/work-item-merge/detect-duplicates";

/** Filtre Prisma : lignes visibles dans la liste principale (pas les variantes fusionnées). */
import type { Prisma } from "@prisma/client";

export const WORK_ITEM_VISIBLE_IN_LIST: Prisma.WorkItemWhereInput = {
  mergeStatus: { in: ["unique", "canonical"] },
};
