"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { prisma } from "@/lib/prisma";
import {
  analyzeWorkItemDuplicates,
  canonicalDesignationFromItem,
  normalizeWorkItemDesignation,
  workItemDesignationForMerge,
  WORK_ITEM_MERGE_MEMBER_CHUNK,
  WORK_ITEM_VISIBLE_IN_LIST,
  type DuplicateCluster,
} from "@/lib/work-item-merge";
import { mergeCatalogIntoWhere, resolveActiveWorkItemCatalogId } from "@/lib/work-item-catalog";
import { requireCatalogAllowsBulkWrite } from "@/lib/work-item-catalog-policy";

const REVALIDATE = [
  "/dashboard/devis/bibliotheque",
  "/dashboard/devis/bibliotheque/fusions",
  "/dashboard/devis/bibliotheque/nettoyage",
  "/dashboard/devis/bibliotheque/nettoyage/doublons",
];

function revalidateAll() {
  for (const p of REVALIDATE) revalidatePath(p);
}

export type MergeAnalysisSummary = {
  analyzed: number;
  exactDuplicateGroups: number;
  quasiDuplicateGroups: number;
  autoMergedCount: number;
  proposalsCreated: number;
  skippedWithBlocker: number;
};

const SCAN_SELECT = {
  id: true,
  code: true,
  title: true,
  shortDescription: true,
  fullDescription: true,
  lot: true,
  family: true,
  unit: true,
  normalizedDesignation: true,
  updatedAt: true,
  mergeStatus: true,
  canonicalWorkItemId: true,
} satisfies Prisma.WorkItemSelect;

/** Applique une fusion réversible (aucune suppression). */
export async function applyWorkItemMerge(
  canonicalId: string,
  memberIds: string[],
  opts?: {
    note?: string;
    mode?: string;
    /** Fusionner au plus N variantes (défaut : tout le lot passé). */
    maxMembers?: number;
    /** Offset dans la liste complète des variantes (fusion progressive). */
    memberOffset?: number;
    skipRevalidate?: boolean;
  },
) {
  await requireBeWorkDevisSession();
  await requireCatalogAllowsBulkWrite();
  const allMembers = [...new Set(memberIds.filter((id) => id && id !== canonicalId))];
  const offset = opts?.memberOffset ?? 0;
  const limit = opts?.maxMembers ?? allMembers.length;
  const uniqueMembers = allMembers.slice(offset, offset + limit);

  if (uniqueMembers.length === 0) {
    if (offset > 0 && offset < allMembers.length) {
      return {
        ok: true as const,
        mergedCount: 0,
        done: true,
        nextOffset: allMembers.length,
        totalMembers: allMembers.length,
      };
    }
    return { ok: false as const, error: "Aucune variante à fusionner." };
  }

  const canonical = await prisma.workItem.findUnique({ where: { id: canonicalId } });
  if (!canonical) return { ok: false as const, error: "Fiche canonique introuvable." };

  const designation = workItemDesignationForMerge(canonical);
  const normalized = normalizeWorkItemDesignation(designation);
  const now = new Date();

  await prisma.workItem.update({
    where: { id: canonicalId },
    data: {
      mergeStatus: "canonical",
      canonicalWorkItemId: null,
      normalizedDesignation: normalized,
      mergedAt: null,
      mergeNote: opts?.note ?? null,
    },
  });

  for (let i = 0; i < uniqueMembers.length; i += WORK_ITEM_MERGE_MEMBER_CHUNK) {
    const chunk = uniqueMembers.slice(i, i + WORK_ITEM_MERGE_MEMBER_CHUNK);
    await prisma.workItem.updateMany({
      where: { id: { in: chunk } },
      data: {
        mergeStatus: "merged",
        canonicalWorkItemId: canonicalId,
        normalizedDesignation: normalized,
        mergedAt: now,
        mergeNote: opts?.note ?? opts?.mode ?? null,
      },
    });
  }

  const nextOffset = offset + uniqueMembers.length;
  const done = nextOffset >= allMembers.length;

  if (!opts?.skipRevalidate) {
    revalidateAll();
    revalidatePath(`/dashboard/devis/bibliotheque/${canonicalId}`);
  }

  return {
    ok: true as const,
    mergedCount: uniqueMembers.length,
    done,
    nextOffset,
    totalMembers: allMembers.length,
  };
}

async function applyClusterMerge(cluster: DuplicateCluster, mode: string) {
  const canonicalId = cluster.canonical.id;
  const memberIds = cluster.members.filter((m) => m.id !== canonicalId).map((m) => m.id);
  if (memberIds.length === 0) return 0;
  const res = await applyWorkItemMerge(canonicalId, memberIds, { mode });
  return res.ok ? res.mergedCount : 0;
}

async function createMergeProposal(cluster: DuplicateCluster) {
  const canonical = cluster.canonical;
  const existing = await prisma.workItemMergeProposal.findFirst({
    where: {
      status: "pending",
      normalizedKey: cluster.normalizedKey,
    },
  });
  if (existing) return null;

  return prisma.workItemMergeProposal.create({
    data: {
      status: "pending",
      proposedCanonicalId: canonical.id,
      canonicalDesignation: cluster.canonicalDesignation,
      normalizedKey: cluster.normalizedKey,
      similarityScore: cluster.maxSimilarity,
      matchReasons: cluster.matchReasons,
      mergeMode: cluster.mergeMode,
      members: {
        create: cluster.members.map((m) => ({
          workItemId: m.id,
          isCanonical: m.id === canonical.id,
          designation: workItemDesignationForMerge(m),
          similarityScore: m.id === canonical.id ? 100 : cluster.maxSimilarity,
        })),
      },
    },
  });
}

export type MergeBatchProgress = MergeAnalysisSummary & {
  hasMore: boolean;
  nextCursorId: string | null;
  batchSize: number;
};

const MERGE_SCAN_BATCH = 80;
const MERGE_NORMALIZE_CHUNK = 25;
const MERGE_AUTO_CLUSTERS_PER_BATCH = 2;

async function normalizeDesignationsChunk(items: { id: string; title: string; shortDescription: string | null; fullDescription: string | null }[]) {
  for (let i = 0; i < items.length; i += MERGE_NORMALIZE_CHUNK) {
    const slice = items.slice(i, i + MERGE_NORMALIZE_CHUNK);
    await Promise.all(
      slice.map((item) => {
        const n = normalizeWorkItemDesignation(workItemDesignationForMerge(item));
        return prisma.workItem.update({
          where: { id: item.id },
          data: { normalizedDesignation: n },
        });
      }),
    );
  }
}

/** Analyse + fusion par lot (évite de traiter toute la base d’un coup). */
export async function analyzeAndMergeWorkItemDuplicatesBatch(opts?: {
  lot?: string;
  cursorId?: string;
  batchSize?: number;
  maxAutoMerges?: number;
  skipAutoMerge?: boolean;
}): Promise<{ ok: true; progress: MergeBatchProgress } | { ok: false; error: string }> {
  await requireBeWorkDevisSession();
  if (!opts?.skipAutoMerge) {
    await requireCatalogAllowsBulkWrite();
  }

  try {
    const catalogId = await resolveActiveWorkItemCatalogId();
    const batchSize = Math.min(Math.max(opts?.batchSize ?? MERGE_SCAN_BATCH, 20), 100);
    const items = await prisma.workItem.findMany({
      where: mergeCatalogIntoWhere(catalogId, {
        ...WORK_ITEM_VISIBLE_IN_LIST,
        ...(opts?.lot?.trim() ? { lot: { equals: opts.lot.trim(), mode: "insensitive" } } : {}),
        ...(opts?.cursorId ? { id: { gt: opts.cursorId } } : {}),
      }),
      select: SCAN_SELECT,
      take: batchSize + 1,
      orderBy: { id: "asc" },
    });

    const batch = items.slice(0, batchSize);
    const hasMore = items.length > batchSize;
    if (batch.length === 0) {
      return {
        ok: true,
        progress: {
          analyzed: 0,
          exactDuplicateGroups: 0,
          quasiDuplicateGroups: 0,
          autoMergedCount: 0,
          proposalsCreated: 0,
          skippedWithBlocker: 0,
          hasMore: false,
          nextCursorId: null,
          batchSize,
        },
      };
    }

    const analysis = analyzeWorkItemDuplicates(batch);

    let autoMergedCount = 0;
    if (!opts?.skipAutoMerge) {
      const maxAuto = opts?.maxAutoMerges ?? MERGE_AUTO_CLUSTERS_PER_BATCH;
      for (const cluster of analysis.autoMergeGroups.slice(0, maxAuto)) {
        autoMergedCount += await applyClusterMerge(cluster, cluster.mergeMode);
      }
    }

    let proposalsCreated = 0;
    for (const cluster of analysis.reviewGroups.slice(0, 5)) {
      const p = await createMergeProposal(cluster);
      if (p) proposalsCreated += 1;
    }

    await normalizeDesignationsChunk(batch);

    revalidateAll();
    return {
      ok: true,
      progress: {
        analyzed: analysis.analyzed,
        exactDuplicateGroups: analysis.exactDuplicateGroups,
        quasiDuplicateGroups: analysis.quasiDuplicateGroups,
        autoMergedCount,
        proposalsCreated,
        skippedWithBlocker: analysis.skippedWithBlocker,
        hasMore,
        nextCursorId: batch[batch.length - 1]!.id,
        batchSize,
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur analyse doublons";
    if (/mergeStatus|normalizedDesignation|WorkItemMergeProposal/.test(msg)) {
      return {
        ok: false,
        error:
          "Migration base requise : exécutez prisma/migrations/add-work-item-duplicate-merge.sql sur Supabase.",
      };
    }
    return { ok: false, error: msg };
  }
}

/** @deprecated Préférer {@link analyzeAndMergeWorkItemDuplicatesBatch} — traite un lot limité. */
export async function analyzeAndMergeWorkItemDuplicates(opts?: {
  lot?: string;
  limit?: number;
}): Promise<{ ok: true; summary: MergeAnalysisSummary } | { ok: false; error: string }> {
  const res = await analyzeAndMergeWorkItemDuplicatesBatch({
    lot: opts?.lot,
    batchSize: Math.min(opts?.limit ?? MERGE_SCAN_BATCH, 100),
    maxAutoMerges: MERGE_AUTO_CLUSTERS_PER_BATCH,
  });
  if (!res.ok) return res;
  return { ok: true, summary: res.progress };
}

export async function unmergeWorkItem(workItemId: string) {
  await requireBeWorkDevisSession();
  const item = await prisma.workItem.findUnique({
    where: { id: workItemId },
    select: { id: true, mergeStatus: true, canonicalWorkItemId: true },
  });
  if (!item) return { ok: false as const, error: "Ouvrage introuvable." };

  if (item.mergeStatus === "merged" && item.canonicalWorkItemId) {
    await prisma.workItem.update({
      where: { id: workItemId },
      data: {
        mergeStatus: "unique",
        canonicalWorkItemId: null,
        mergedAt: null,
        mergeNote: null,
      },
    });
    const remaining = await prisma.workItem.count({
      where: { canonicalWorkItemId: item.canonicalWorkItemId, mergeStatus: "merged" },
    });
    if (remaining === 0) {
      await prisma.workItem.update({
        where: { id: item.canonicalWorkItemId },
        data: { mergeStatus: "unique" },
      });
    }
    revalidateAll();
    revalidatePath(`/dashboard/devis/bibliotheque/${item.canonicalWorkItemId}`);
    return { ok: true as const };
  }

  if (item.mergeStatus === "canonical") {
    await prisma.workItem.updateMany({
      where: { canonicalWorkItemId: workItemId },
      data: {
        mergeStatus: "unique",
        canonicalWorkItemId: null,
        mergedAt: null,
        mergeNote: null,
      },
    });
    await prisma.workItem.update({
      where: { id: workItemId },
      data: { mergeStatus: "unique" },
    });
    revalidateAll();
    return { ok: true as const };
  }

  return { ok: false as const, error: "Cette fiche n'est pas fusionnée." };
}

export async function approveWorkItemMergeProposal(proposalId: string) {
  await requireBeWorkDevisSession();
  const proposal = await prisma.workItemMergeProposal.findUnique({
    where: { id: proposalId },
    include: { members: true },
  });
  if (!proposal || proposal.status !== "pending") {
    return { ok: false as const, error: "Proposition introuvable ou déjà traitée." };
  }

  const canonicalMember =
    proposal.members.find((m) => m.isCanonical) ?? proposal.members[0];
  if (!canonicalMember) return { ok: false as const, error: "Aucun membre dans la proposition." };

  const memberIds = proposal.members
    .filter((m) => m.workItemId !== canonicalMember.workItemId)
    .map((m) => m.workItemId);

  const res = await applyWorkItemMerge(canonicalMember.workItemId, memberIds, {
    note: "Fusion validée",
    mode: proposal.mergeMode,
  });

  if (!res.ok) return res;

  await prisma.workItemMergeProposal.update({
    where: { id: proposalId },
    data: { status: "approved", reviewedAt: new Date() },
  });

  revalidateAll();
  return { ok: true as const, mergedCount: res.mergedCount };
}

export async function rejectWorkItemMergeProposal(proposalId: string, note?: string) {
  await requireBeWorkDevisSession();
  await prisma.workItemMergeProposal.update({
    where: { id: proposalId },
    data: { status: "rejected", reviewedAt: new Date(), reviewNote: note?.trim() || null },
  });
  revalidateAll();
  return { ok: true as const };
}

export async function fetchPendingWorkItemMergeProposals() {
  await requireBeWorkDevisSession();
  return prisma.workItemMergeProposal.findMany({
    where: { status: "pending" },
    orderBy: [{ similarityScore: "desc" }, { createdAt: "desc" }],
    take: 200,
    include: {
      members: {
        include: {
          workItem: {
            select: {
              id: true,
              code: true,
              title: true,
              lot: true,
              unit: true,
              priceEntries: { select: { id: true }, take: 1 },
            },
          },
        },
      },
      proposedCanonical: { select: { id: true, code: true, title: true } },
    },
  });
}

export async function fetchWorkItemMergeStats() {
  await requireBeWorkDevisSession();
  const [pendingProposals, mergedVariants, canonicalCards] = await Promise.all([
    prisma.workItemMergeProposal.count({ where: { status: "pending" } }),
    prisma.workItem.count({ where: { mergeStatus: "merged" } }),
    prisma.workItem.count({ where: { mergeStatus: "canonical" } }),
  ]);
  return { pendingProposals, mergedVariants, canonicalCards };
}

export async function fetchWorkItemWithMergedVariants(workItemId: string) {
  await requireBeWorkDevisSession();
  const item = await prisma.workItem.findUnique({
    where: { id: workItemId },
    include: {
      mergedVariants: {
        orderBy: { mergedAt: "desc" },
        include: {
          priceEntries: {
            select: {
              id: true,
              sourceName: true,
              unitPriceHT: true,
              variantDesignation: true,
              updatedAt: true,
            },
            orderBy: { updatedAt: "desc" },
            take: 20,
          },
        },
      },
      canonicalWorkItem: true,
    },
  });
  if (!item) return null;

  if (item.mergeStatus === "merged" && item.canonicalWorkItemId) {
    return prisma.workItem.findUnique({
      where: { id: item.canonicalWorkItemId },
      include: {
        mergedVariants: {
          orderBy: { mergedAt: "desc" },
          include: {
            priceEntries: {
              select: {
                id: true,
                sourceName: true,
                unitPriceHT: true,
                variantDesignation: true,
                updatedAt: true,
              },
              orderBy: { updatedAt: "desc" },
              take: 20,
            },
          },
        },
      },
    });
  }

  return item;
}

export async function countMergedVariantsForCanonicalIds(canonicalIds: string[]) {
  if (canonicalIds.length === 0) return new Map<string, number>();
  const rows = await prisma.workItem.groupBy({
    by: ["canonicalWorkItemId"],
    where: {
      canonicalWorkItemId: { in: canonicalIds },
      mergeStatus: "merged",
    },
    _count: { _all: true },
  });
  const map = new Map<string, number>();
  for (const r of rows) {
    if (r.canonicalWorkItemId) map.set(r.canonicalWorkItemId, r._count._all);
  }
  return map;
}
