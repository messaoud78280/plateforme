export { analyzePatchImpact } from "@/lib/bework-patch/impact/analyze-impact";
export { loadImpactSubgraph } from "@/lib/bework-patch/impact/load-subgraph";
export {
  evaluatePatchSourceProtection,
  inferProposalProvenanceKind,
} from "@/lib/bework-patch/impact/source-protection";
export type {
  AnalyzePatchImpactResult,
  DirectChange,
  DerivedChange,
  ImpactCertainty,
  ImpactSubgraph,
  ImpactSummary,
} from "@/lib/bework-patch/impact/types";
