/**
 * CTX-09A — Sections du pipeline universel analyze→commit.
 * Une section AVAILABLE doit forcément passer par ce contrat
 * (évite AVAILABLE sans subgraph/analyze comme NOTICE avant CTX-09A).
 */
import { getSectionCapability } from "@/lib/bework-patch/capability";
import {
  BEWORK_PATCH_SECTIONS,
  type BeworkPatchSection,
} from "@/lib/bework-patch/types";

/**
 * True si la section doit charger un impact subgraph + produire commitMeta
 * lors de POST /api/bework-patch/analyze.
 */
export function isUniversalPipelineSection(
  section: BeworkPatchSection,
): boolean {
  return getSectionCapability(section).mode === "AVAILABLE";
}

export function universalPipelineSections(): BeworkPatchSection[] {
  return BEWORK_PATCH_SECTIONS.filter(isUniversalPipelineSection);
}
