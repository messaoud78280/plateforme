import type { SiteResourceGroupingProposalType } from "@prisma/client";
import type { ExtractedResourceCandidate } from "@/lib/chantier-resources/extract-from-work-item";
import { scoreSimilarity } from "@/lib/chantier-resources/similarity";
import { normalizeResourceLabel } from "@/lib/chantier-resources/normalize-label";
import { isPersistedResourceId } from "@/lib/chantier-resources/resource-id";

export type ExistingResourceIndex = {
  id: string;
  shortName: string;
  orderUnit: string;
  aliases: { label: string; normalizedLabel: string }[];
};

export type GroupingProposalDraft = {
  proposalType: SiteResourceGroupingProposalType;
  similarityScore: number;
  sourceLabel: string;
  normalizedSourceLabel: string;
  targetSiteResourceId: string | null;
  sourceWorkItemId: string | null;
  sourceField: ExtractedResourceCandidate["sourceField"];
  sourceSnippet: string;
  matchReasons: string[];
  candidate: ExtractedResourceCandidate;
};

function bestMatch(
  candidate: ExtractedResourceCandidate,
  existing: ExistingResourceIndex[],
): { resource: ExistingResourceIndex; score: number; reasons: string[]; hint: ReturnType<typeof scoreSimilarity>["proposalHint"] } | null {
  let best: { resource: ExistingResourceIndex; score: number; reasons: string[]; hint: ReturnType<typeof scoreSimilarity>["proposalHint"] } | null = null;

  for (const res of existing) {
    const labels = [res.shortName, ...res.aliases.map((a) => a.label)];
    for (const lab of labels) {
      const sim = scoreSimilarity(candidate.label, lab, {
        unitA: candidate.suggestedUnit,
        unitB: res.orderUnit,
      });
      if (!best || sim.score > best.score) {
        best = { resource: res, score: sim.score, reasons: sim.reasons, hint: sim.proposalHint };
      }
      if (candidate.normalizedLabel === normalizeResourceLabel(lab) && sim.score < 95) {
        best = { resource: res, score: 95, reasons: ["Alias normalisé identique"], hint: "merge_as_alias" };
      }
    }
  }
  return best;
}

/**
 * Propose des regroupements sans écrire en base — validation humaine requise ensuite.
 */
export function normalizeAndGroupResources(input: {
  candidates: ExtractedResourceCandidate[];
  existingResources: ExistingResourceIndex[];
  sourceWorkItemId?: string | null;
}): GroupingProposalDraft[] {
  const proposals: GroupingProposalDraft[] = [];
  const virtualExisting = [...input.existingResources];

  for (const candidate of input.candidates) {
    const match = bestMatch(candidate, virtualExisting);

    let proposalType: SiteResourceGroupingProposalType = "new_resource";
    let targetId: string | null = null;
    let score = 0;
    let reasons: string[] = [];

    if (match) {
      score = match.score;
      reasons = match.reasons;
      const persistedTarget = isPersistedResourceId(match.resource.id) ? match.resource.id : null;

      if (match.hint === "merge_as_alias" && score >= 90 && persistedTarget) {
        proposalType = "merge_as_alias";
        targetId = persistedTarget;
      } else if ((match.hint === "create_variant" || (score >= 70 && score < 90)) && persistedTarget) {
        proposalType = "create_variant";
        targetId = persistedTarget;
      } else if (score >= 50 && score < 70 && persistedTarget) {
        proposalType = "keep_separate";
        targetId = persistedTarget;
      } else if (score >= 70 && !persistedTarget) {
        proposalType = "new_resource";
        reasons = [...reasons, "Cible en mémoire uniquement — création en base"];
      } else if (score < 50) {
        proposalType = "new_resource";
      }
    } else {
      proposalType = "new_resource";
      reasons = ["Aucune ressource existante proche"];
    }

    proposals.push({
      proposalType,
      similarityScore: score,
      sourceLabel: candidate.label,
      normalizedSourceLabel: candidate.normalizedLabel,
      targetSiteResourceId: targetId,
      sourceWorkItemId: input.sourceWorkItemId ?? null,
      sourceField: candidate.sourceField,
      sourceSnippet: candidate.sourceSnippet,
      matchReasons: reasons,
      candidate,
    });

    if (proposalType === "new_resource") {
      virtualExisting.push({
        id: `draft-${candidate.normalizedLabel}`,
        shortName: candidate.suggestedShortName,
        orderUnit: candidate.suggestedUnit,
        aliases: [{ label: candidate.label, normalizedLabel: candidate.normalizedLabel }],
      });
    }
  }

  return proposals;
}

export function bucketProposals(proposals: GroupingProposalDraft[]) {
  return {
    newResource: proposals.filter((p) => p.proposalType === "new_resource"),
    mergeAsAlias: proposals.filter((p) => p.proposalType === "merge_as_alias"),
    createVariant: proposals.filter((p) => p.proposalType === "create_variant"),
    toReview: proposals.filter((p) => p.proposalType === "keep_separate"),
  };
}
