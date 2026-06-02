"use server";

import { revalidatePath } from "next/cache";
import type { LibraryCleanupJobType, Prisma, WorkItemClassificationConfidence } from "@prisma/client";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { prisma } from "@/lib/prisma";
import { getBeWorkFamilyLabel } from "@/lib/bework-devis-family-codes";
import {
  normalizeWorkItemDesignation,
  workItemDesignationForMerge,
  WORK_ITEM_VISIBLE_IN_LIST,
} from "@/lib/work-item-merge";
import { applyWorkItemMerge } from "@/app/dashboard/devis/work-item-merge-actions";
import {
  appendJobLog,
  buildDuplicateReviewGroups,
  defaultBatchSize,
  suggestWorkItemReclassification,
  type CleanupJobLogEntry,
  type DuplicateReviewGroup,
  type WorkItemPriceStats,
} from "@/lib/work-item-library-cleanup";
import { mergeCatalogIntoWhere, resolveActiveWorkItemCatalogId } from "@/lib/work-item-catalog";
import { requireCatalogAllowsBulkWrite } from "@/lib/work-item-catalog-policy";

const REVALIDATE_PATHS = [
  "/dashboard/devis/bibliotheque",
  "/dashboard/devis/bibliotheque/nettoyage",
  "/dashboard/devis/bibliotheque/nettoyage/doublons",
  "/dashboard/devis/bibliotheque/nettoyage/reclasser",
  "/dashboard/devis/bibliotheque/fusions",
];

function revalidateCleanup() {
  for (const p of REVALIDATE_PATHS) revalidatePath(p);
}

function migrationHint(msg: string): string | null {
  if (/LibraryCleanupJob|WorkItemClassificationProposal/.test(msg)) {
    return "Migration requise : exécutez prisma/migrations/add-library-cleanup-jobs.sql sur Supabase.";
  }
  return null;
}

const CLASSIFICATION_SELECT = {
  id: true,
  code: true,
  title: true,
  shortDescription: true,
  fullDescription: true,
  lot: true,
  subLot: true,
  family: true,
  familyCode: true,
  unit: true,
  itemType: true,
} satisfies Prisma.WorkItemSelect;

const DUPLICATE_SCAN_SELECT = {
  ...CLASSIFICATION_SELECT,
  normalizedDesignation: true,
  updatedAt: true,
} satisfies Prisma.WorkItemSelect;

function parseLogs(raw: unknown): CleanupJobLogEntry[] {
  return Array.isArray(raw) ? (raw as CleanupJobLogEntry[]) : [];
}

async function getSessionUserId(): Promise<string | null> {
  const session = await requireBeWorkDevisSession();
  return session.user?.id ?? null;
}

export async function listLibraryCleanupJobs(limit = 20) {
  await requireBeWorkDevisSession();
  try {
    return prisma.libraryCleanupJob.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur";
    throw new Error(migrationHint(msg) ?? msg);
  }
}

export async function createLibraryCleanupJob(input: {
  jobType: LibraryCleanupJobType;
  dryRun?: boolean;
  batchSize?: number;
}) {
  const userId = await getSessionUserId();
  try {
    return prisma.libraryCleanupJob.create({
      data: {
        jobType: input.jobType,
        dryRun: input.dryRun ?? true,
        batchSize: defaultBatchSize(input.batchSize),
        status: "pending",
        createdByUserId: userId,
        logs: [],
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur";
    throw new Error(migrationHint(msg) ?? msg);
  }
}

/** Analyse reclassements — dry-run par lot, stocke les propositions pending. */
export async function runClassificationPreviewBatch(opts?: {
  jobId?: string;
  batchSize?: number;
  onlyHighConfidence?: boolean;
}): Promise<
  | {
      ok: true;
      jobId: string;
      processed: number;
      proposalsCreated: number;
      hasMore: boolean;
      lastProcessedId: string | null;
    }
  | { ok: false; error: string }
> {
  await requireBeWorkDevisSession();

  try {
    let job =
      opts?.jobId != null
        ? await prisma.libraryCleanupJob.findUnique({ where: { id: opts.jobId } })
        : null;

    if (!job) {
      job = await createLibraryCleanupJob({
        jobType: "classification_preview",
        dryRun: true,
        batchSize: opts?.batchSize,
      });
    }

    const batchSize = defaultBatchSize(job.batchSize);
    let logs = parseLogs(job.logs);
    const cursorId = job.lastProcessedId ?? undefined;

    await prisma.libraryCleanupJob.update({
      where: { id: job.id },
      data: { status: "running", startedAt: job.startedAt ?? new Date() },
    });

    const catalogId = await resolveActiveWorkItemCatalogId();
    const items = await prisma.workItem.findMany({
      where: mergeCatalogIntoWhere(catalogId, {
        ...WORK_ITEM_VISIBLE_IN_LIST,
        OR: [
          { familyCode: null },
          { familyCode: { equals: "DIV", mode: "insensitive" } },
          { lot: { contains: "divers", mode: "insensitive" } },
          { lot: { contains: "classer", mode: "insensitive" } },
          { lot: { equals: "Non classé", mode: "insensitive" } },
        ],
        ...(cursorId ? { id: { gt: cursorId } } : {}),
      }),
      select: CLASSIFICATION_SELECT,
      orderBy: { id: "asc" },
      take: batchSize + 1,
    });

    const batch = items.slice(0, batchSize);
    const hasMore = items.length > batchSize;
    let proposalsCreated = 0;
    let successCount = 0;

    for (const item of batch) {
      try {
        const suggestion = suggestWorkItemReclassification(item);
        if (!suggestion) {
          successCount += 1;
          continue;
        }
        if (opts?.onlyHighConfidence && suggestion.confidence !== "haute") {
          successCount += 1;
          continue;
        }

        const existing = await prisma.workItemClassificationProposal.findFirst({
          where: {
            workItemId: item.id,
            status: "pending",
            proposedFamilyCode: suggestion.proposedFamilyCode,
          },
        });
        if (existing) {
          successCount += 1;
          continue;
        }

        await prisma.workItemClassificationProposal.create({
          data: {
            workItemId: item.id,
            jobId: job.id,
            currentFamilyCode: item.familyCode,
            currentLot: item.lot,
            proposedFamilyCode: suggestion.proposedFamilyCode,
            proposedLot: suggestion.proposedLot,
            proposedFamily: suggestion.proposedFamily,
            confidence: suggestion.confidence as WorkItemClassificationConfidence,
            matchReason: suggestion.matchReason,
            status: "pending",
          },
        });
        proposalsCreated += 1;
        successCount += 1;
        logs = appendJobLog(logs, {
          level: "info",
          message: `Proposition ${suggestion.proposedFamilyCode} (${suggestion.confidence}) — ${item.code}`,
          workItemId: item.id,
        });
      } catch (err) {
        logs = appendJobLog(logs, {
          level: "error",
          message: err instanceof Error ? err.message : "Erreur item",
          workItemId: item.id,
        });
      }
    }

    const lastProcessedId = batch.length > 0 ? batch[batch.length - 1]!.id : job.lastProcessedId;

    await prisma.libraryCleanupJob.update({
      where: { id: job.id },
      data: {
        status: hasMore ? "running" : "completed",
        finishedAt: hasMore ? null : new Date(),
        processedCount: { increment: batch.length },
        successCount: { increment: successCount },
        lastProcessedId,
        logs,
      },
    });

    revalidateCleanup();
    return {
      ok: true,
      jobId: job.id,
      processed: batch.length,
      proposalsCreated,
      hasMore,
      lastProcessedId,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur analyse classifications";
    return { ok: false, error: migrationHint(msg) ?? msg };
  }
}

/** Applique les reclassements confiance haute — par lot. */
export async function applyHighConfidenceClassificationsBatch(opts?: {
  jobId?: string;
  batchSize?: number;
  dryRun?: boolean;
}): Promise<
  | { ok: true; jobId: string; applied: number; skipped: number; hasMore: boolean }
  | { ok: false; error: string }
> {
  await requireBeWorkDevisSession();
  const dryRun = opts?.dryRun ?? false;
  if (!dryRun) await requireCatalogAllowsBulkWrite();
  const batchSize = defaultBatchSize(opts?.batchSize);

  try {
    const job = await createLibraryCleanupJob({
      jobType: "classification_apply",
      dryRun,
      batchSize,
    });

    const proposals = await prisma.workItemClassificationProposal.findMany({
      where: { status: "pending", confidence: "haute" },
      include: { workItem: { select: { id: true, code: true } } },
      orderBy: { createdAt: "asc" },
      take: batchSize + 1,
    });

    const batch = proposals.slice(0, batchSize);
    const hasMore = proposals.length > batchSize;
    let applied = 0;
    let skipped = 0;
    let logs = parseLogs(job.logs);

    for (const p of batch) {
      if (dryRun) {
        applied += 1;
        continue;
      }

      try {
        await prisma.$transaction([
          prisma.workItem.update({
            where: { id: p.workItemId },
            data: {
              familyCode: p.proposedFamilyCode,
              lot: p.proposedLot ?? getBeWorkFamilyLabel(p.proposedFamilyCode) ?? p.proposedFamilyCode,
              family: p.proposedFamily ?? getBeWorkFamilyLabel(p.proposedFamilyCode),
            },
          }),
          prisma.workItemClassificationProposal.update({
            where: { id: p.id },
            data: { status: "approved", reviewedAt: new Date(), reviewNote: "Appliqué auto (confiance haute)" },
          }),
        ]);
        applied += 1;
        logs = appendJobLog(logs, {
          level: "info",
          message: `Reclassé ${p.workItem.code} → ${p.proposedFamilyCode}`,
          workItemId: p.workItemId,
        });
      } catch {
        skipped += 1;
      }
    }

    await prisma.libraryCleanupJob.update({
      where: { id: job.id },
      data: {
        status: hasMore ? "running" : "completed",
        finishedAt: hasMore ? null : new Date(),
        processedCount: batch.length,
        successCount: applied,
        errorCount: skipped,
        logs,
      },
    });

    revalidateCleanup();
    return { ok: true, jobId: job.id, applied, skipped, hasMore };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur application reclassements";
    return { ok: false, error: migrationHint(msg) ?? msg };
  }
}

export async function fetchPendingClassificationProposals(opts?: {
  confidence?: WorkItemClassificationConfidence;
  limit?: number;
}) {
  await requireBeWorkDevisSession();
  try {
    return prisma.workItemClassificationProposal.findMany({
      where: {
        status: "pending",
        ...(opts?.confidence ? { confidence: opts.confidence } : {}),
      },
      include: {
        workItem: {
          select: {
            id: true,
            code: true,
            title: true,
            lot: true,
            familyCode: true,
            unit: true,
          },
        },
      },
      orderBy: [{ confidence: "asc" }, { createdAt: "desc" }],
      take: opts?.limit ?? 100,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur";
    throw new Error(migrationHint(msg) ?? msg);
  }
}

export async function reviewClassificationProposal(input: {
  proposalId: string;
  action: "approve" | "reject" | "ignore";
  customFamilyCode?: string;
  customLot?: string;
}) {
  await requireBeWorkDevisSession();
  try {
    const proposal = await prisma.workItemClassificationProposal.findUnique({
      where: { id: input.proposalId },
      include: { workItem: true },
    });
    if (!proposal) return { ok: false as const, error: "Proposition introuvable." };

    if (input.action === "reject" || input.action === "ignore") {
      await prisma.workItemClassificationProposal.update({
        where: { id: proposal.id },
        data: {
          status: input.action === "ignore" ? "ignored" : "rejected",
          reviewedAt: new Date(),
        },
      });
      revalidateCleanup();
      return { ok: true as const };
    }

    const familyCode = input.customFamilyCode?.trim().toUpperCase() ?? proposal.proposedFamilyCode;
    const lot = input.customLot?.trim() ?? proposal.proposedLot ?? getBeWorkFamilyLabel(familyCode) ?? familyCode;

    await prisma.$transaction([
      prisma.workItem.update({
        where: { id: proposal.workItemId },
        data: {
          familyCode,
          lot,
          family: getBeWorkFamilyLabel(familyCode) ?? proposal.proposedFamily,
        },
      }),
      prisma.workItemClassificationProposal.update({
        where: { id: proposal.id },
        data: { status: "approved", reviewedAt: new Date(), reviewNote: "Validé manuellement" },
      }),
    ]);

    revalidateCleanup();
    return { ok: true as const };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur validation";
    return { ok: false as const, error: msg };
  }
}

/** Détection doublons par lot (sans fusion). */
export async function detectDuplicateGroupsBatch(opts?: {
  batchSize?: number;
  cursorId?: string;
}): Promise<
  | { ok: true; groups: DuplicateReviewGroup[]; scanned: number; hasMore: boolean; nextCursorId: string | null }
  | { ok: false; error: string }
> {
  await requireBeWorkDevisSession();
  const batchSize = Math.min(Math.max(opts?.batchSize ?? 50, 20), 80);

  try {
    const catalogId = await resolveActiveWorkItemCatalogId();
    const items = await prisma.workItem.findMany({
      where: mergeCatalogIntoWhere(catalogId, {
        ...WORK_ITEM_VISIBLE_IN_LIST,
        ...(opts?.cursorId ? { id: { gt: opts.cursorId } } : {}),
      }),
      select: DUPLICATE_SCAN_SELECT,
      orderBy: { id: "asc" },
      take: batchSize,
    });

    if (items.length === 0) {
      return { ok: true, groups: [], scanned: 0, hasMore: false, nextCursorId: null };
    }

    const ids = items.map((i) => i.id);
    const priceAgg = await prisma.priceEntry.groupBy({
      by: ["workItemId"],
      where: { workItemId: { in: ids } },
      _count: { _all: true },
      _max: { unitPriceHT: true },
      _min: { unitPriceHT: true },
      _avg: { unitPriceHT: true },
    });

    const priceStatsMap = new Map<string, WorkItemPriceStats>();
    for (const row of priceAgg) {
      const count = row._count._all;
      const minHt = row._min.unitPriceHT != null ? Number(row._min.unitPriceHT) : null;
      const maxHt = row._max.unitPriceHT != null ? Number(row._max.unitPriceHT) : null;
      const avgHt = row._avg.unitPriceHT != null ? Number(row._avg.unitPriceHT) : null;
      priceStatsMap.set(row.workItemId, {
        workItemId: row.workItemId,
        priceCount: count,
        minHt,
        maxHt,
        avgHt,
        referenceHt: maxHt,
      });
    }

    const groups = buildDuplicateReviewGroups(items, [], priceStatsMap);
    const nextCursorId = items[items.length - 1]!.id;

    return {
      ok: true,
      groups,
      scanned: items.length,
      hasMore: items.length >= batchSize,
      nextCursorId,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur détection doublons";
    return { ok: false, error: msg };
  }
}

/** Fusion d’un groupe validé — par tranches de variantes (évite blocage). */
export async function mergeDuplicateGroup(input: {
  canonicalId: string;
  memberIds: string[];
  dryRun?: boolean;
  /** Index de reprise dans memberIds (hors canonique). */
  memberOffset?: number;
  /** Nombre max de variantes fusionnées sur cet appel (défaut 5). */
  chunkSize?: number;
}): Promise<
  | {
      ok: true;
      mergedCount: number;
      dryRun: boolean;
      done: boolean;
      nextOffset: number;
      totalMembers: number;
    }
  | { ok: false; error: string }
> {
  await requireBeWorkDevisSession();

  const userId = await getSessionUserId();
  const dryRun = input.dryRun ?? false;
  const allMembers = [...new Set(input.memberIds.filter((id) => id && id !== input.canonicalId))];
  const chunkSize = Math.min(Math.max(input.chunkSize ?? 5, 1), 10);
  const memberOffset = input.memberOffset ?? 0;

  if (dryRun) {
    return {
      ok: true,
      mergedCount: Math.min(chunkSize, allMembers.length - memberOffset),
      dryRun: true,
      done: memberOffset + chunkSize >= allMembers.length,
      nextOffset: Math.min(memberOffset + chunkSize, allMembers.length),
      totalMembers: allMembers.length,
    };
  }

  await requireCatalogAllowsBulkWrite();

  if (memberOffset >= allMembers.length) {
    return {
      ok: true,
      mergedCount: 0,
      dryRun: false,
      done: true,
      nextOffset: allMembers.length,
      totalMembers: allMembers.length,
    };
  }

  try {
    const res = await applyWorkItemMerge(input.canonicalId, input.memberIds, {
      note: "Fusion bibliothèque nettoyage",
      mode: "library_cleanup",
      maxMembers: chunkSize,
      memberOffset,
      skipRevalidate: memberOffset + chunkSize < allMembers.length,
    });

    if (!res.ok) return res;

    if (res.done) {
      try {
        const job = await createLibraryCleanupJob({
          jobType: "duplicate_merge",
          dryRun: false,
          batchSize: chunkSize,
        });
        await prisma.libraryCleanupJob.update({
          where: { id: job.id },
          data: {
            status: "completed",
            finishedAt: new Date(),
            processedCount: allMembers.length,
            successCount: allMembers.length,
            createdByUserId: userId,
            logs: appendJobLog([], {
              level: "info",
              message: `Fusion terminée : ${allMembers.length} variante(s) → ${input.canonicalId}`,
              workItemId: input.canonicalId,
            }),
          },
        });
      } catch {
        /* journal optionnel */
      }
      revalidateCleanup();
    }

    return {
      ok: true,
      mergedCount: res.mergedCount,
      dryRun: false,
      done: res.done,
      nextOffset: res.nextOffset,
      totalMembers: res.totalMembers,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur fusion";
    return { ok: false, error: msg };
  }
}

/** Normalise normalizedDesignation par lot. */
export async function normalizeDesignationsBatch(opts?: {
  batchSize?: number;
  cursorId?: string;
}): Promise<
  | { ok: true; updated: number; hasMore: boolean; nextCursorId: string | null }
  | { ok: false; error: string }
> {
  await requireBeWorkDevisSession();
  const batchSize = defaultBatchSize(opts?.batchSize);

  try {
    const catalogId = await resolveActiveWorkItemCatalogId();
    const items = await prisma.workItem.findMany({
      where: mergeCatalogIntoWhere(catalogId, {
        ...WORK_ITEM_VISIBLE_IN_LIST,
        ...(opts?.cursorId ? { id: { gt: opts.cursorId } } : {}),
      }),
      select: {
        id: true,
        title: true,
        shortDescription: true,
        fullDescription: true,
      },
      orderBy: { id: "asc" },
      take: batchSize + 1,
    });

    const batch = items.slice(0, batchSize);
    const hasMore = items.length > batchSize;
    let updated = 0;

    for (const item of batch) {
      const n = normalizeWorkItemDesignation(workItemDesignationForMerge(item));
      await prisma.workItem.update({
        where: { id: item.id },
        data: { normalizedDesignation: n },
      });
      updated += 1;
    }

    revalidateCleanup();
    return {
      ok: true,
      updated,
      hasMore,
      nextCursorId: batch.length > 0 ? batch[batch.length - 1]!.id : null,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur normalisation";
    return { ok: false, error: msg };
  }
}

export async function markDuplicateGroupAsDistinct(input: { workItemIds: string[]; note?: string }) {
  await requireBeWorkDevisSession();
  try {
    await prisma.workItemClassificationProposal.createMany({
      data: input.workItemIds.map((workItemId) => ({
        workItemId,
        currentFamilyCode: null,
        proposedFamilyCode: "DISTINCT",
        confidence: "haute" as WorkItemClassificationConfidence,
        matchReason: input.note ?? "Marqué non doublon manuellement",
        status: "ignored",
        reviewedAt: new Date(),
      })),
      skipDuplicates: true,
    });
    return { ok: true as const };
  } catch {
    return { ok: true as const };
  }
}
