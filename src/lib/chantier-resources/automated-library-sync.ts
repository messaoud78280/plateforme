/**
 * Synchronisation automatique bibliothèque d’ouvrages → ressources chantier.
 * Applique directement les regroupements (sans validation manuelle).
 */

import type { PrismaClient } from "@prisma/client";
import { applyGroupingDraft } from "@/lib/chantier-resources/apply-grouping-draft";
import {
  applyResourceDuplicateCleanup,
  buildResourceDuplicateCleanupPreview,
  dedupeAllResourceAliases,
} from "@/lib/chantier-resources/execute-cleanup";
import { extractCandidatesFromWorkItem } from "@/lib/chantier-resources/extract-from-work-item";
import {
  normalizeAndGroupResources,
  type ExistingResourceIndex,
  type GroupingProposalDraft,
} from "@/lib/chantier-resources/normalize-and-group";

export type LibrarySyncStats = {
  workItemsProcessed: number;
  candidatesExtracted: number;
  aliasesMerged: number;
  variantsCreated: number;
  resourcesCreated: number;
  resourcesMatched: number;
  skipped: number;
  aliasesRemoved: number;
  resourceFichesMerged: number;
};

export type LibrarySyncResult = {
  runId: string;
  stats: LibrarySyncStats;
};

const WORK_ITEM_SELECT = {
  id: true,
  code: true,
  title: true,
  unit: true,
  lot: true,
  includedItems: true,
  fullDescription: true,
  shortDescription: true,
} as const;

export async function syncLibraryToChantierResourcesCore(
  prisma: PrismaClient,
  opts?: { batchSize?: number; maxWorkItems?: number },
): Promise<LibrarySyncResult> {
  const batchSize = Math.min(opts?.batchSize ?? 150, 300);
  const maxWorkItems = opts?.maxWorkItems ?? 15_000;

  const stats: LibrarySyncStats = {
    workItemsProcessed: 0,
    candidatesExtracted: 0,
    aliasesMerged: 0,
    variantsCreated: 0,
    resourcesCreated: 0,
    resourcesMatched: 0,
    skipped: 0,
    aliasesRemoved: 0,
    resourceFichesMerged: 0,
  };

  const dbExisting = await prisma.siteResource.findMany({
    where: { status: { not: "fusionne" }, mergedIntoId: null },
    select: {
      id: true,
      shortName: true,
      orderUnit: true,
      aliases: { select: { label: true, normalizedLabel: true } },
    },
  });

  const virtualCreated: ExistingResourceIndex[] = [];

  const run = await prisma.siteResourceExtractionRun.create({
    data: {
      label: `Sync auto ${new Date().toLocaleString("fr-FR")}`,
      status: "applied",
      workItemCount: 0,
      candidateCount: 0,
      proposalCount: 0,
      meta: { mode: "automated_library_sync" },
    },
  });

  let cursor: string | undefined;
  let processed = 0;

  while (processed < maxWorkItems) {
    const batch = await prisma.workItem.findMany({
      where: { status: { not: "archive" } },
      select: WORK_ITEM_SELECT,
      orderBy: { id: "asc" },
      take: batchSize,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
    if (batch.length === 0) break;

    for (const wi of batch) {
      stats.workItemsProcessed += 1;
      const candidates = extractCandidatesFromWorkItem(wi);
      stats.candidatesExtracted += candidates.length;
      if (!candidates.length) continue;

      const proposals = normalizeAndGroupResources({
        candidates,
        existingResources: [...dbExisting, ...virtualCreated],
        sourceWorkItemId: wi.id,
      });

      for (const p of proposals) {
        const applied = await applyGroupingDraft(prisma, p, run.id);
        switch (applied.action) {
          case "alias":
            stats.aliasesMerged += 1;
            break;
          case "variant":
            stats.variantsCreated += 1;
            break;
          case "created":
            stats.resourcesCreated += 1;
            pushVirtual(virtualCreated, p);
            break;
          case "matched":
            stats.resourcesMatched += 1;
            break;
          default:
            stats.skipped += 1;
        }
      }
    }

    cursor = batch[batch.length - 1]!.id;
    processed += batch.length;
    if (batch.length < batchSize) break;
  }

  const aliasDedupe = await dedupeAllResourceAliases(prisma);
  stats.aliasesRemoved = aliasDedupe.removed;

  const preview = await buildResourceDuplicateCleanupPreview(prisma);
  const merge = await applyResourceDuplicateCleanup(prisma, preview);
  stats.resourceFichesMerged = merge.merged;

  await prisma.siteResourceGroupingProposal.updateMany({
    where: { status: "pending" },
    data: {
      status: "rejected",
      reviewedAt: new Date(),
      reviewNote: "Remplacé par synchronisation automatique bibliothèque",
    },
  });

  await prisma.siteResourceExtractionRun.update({
    where: { id: run.id },
    data: {
      workItemCount: stats.workItemsProcessed,
      candidateCount: stats.candidatesExtracted,
      proposalCount: 0,
      meta: {
        mode: "automated_library_sync",
        stats,
        aliasDedupe,
        merge,
      },
    },
  });

  return { runId: run.id, stats };
}

function pushVirtual(virtualCreated: ExistingResourceIndex[], p: GroupingProposalDraft) {
  if (p.proposalType !== "new_resource" && p.proposalType !== "keep_separate") return;
  virtualCreated.push({
    id: `virtual-${p.normalizedSourceLabel}`,
    shortName: p.candidate.suggestedShortName,
    orderUnit: p.candidate.suggestedUnit,
    aliases: [{ label: p.sourceLabel, normalizedLabel: p.normalizedSourceLabel }],
  });
}
