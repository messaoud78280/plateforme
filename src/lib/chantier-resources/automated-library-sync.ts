/**
 * Synchronisation automatique bibliothèque d’ouvrages → ressources chantier (par lots).
 */

import type { PrismaClient } from "@prisma/client";
import { WORK_ITEM_VISIBLE_IN_LIST } from "@/lib/work-item-merge";
import {
  applyGroupingDraft,
  loadResourceDedupRowsForApply,
} from "@/lib/chantier-resources/apply-grouping-draft";
import {
  applyResourceDuplicateCleanup,
  buildResourceDuplicateCleanupPreview,
  dedupeAllResourceAliases,
} from "@/lib/chantier-resources/execute-cleanup";
import { extractCandidatesFromWorkItem } from "@/lib/chantier-resources/extract-from-work-item";
import { normalizeAndGroupResources, type ExistingResourceIndex, type GroupingProposalDraft } from "@/lib/chantier-resources/normalize-and-group";

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

export type LibrarySyncRunMeta = {
  mode: "automated_library_sync";
  phase: "processing" | "finalizing" | "done";
  cursor: string | null;
  stats: LibrarySyncStats;
  totalWorkItems?: number;
};

export type LibrarySyncBatchResult = {
  runId: string;
  done: boolean;
  /** Dernier lot traité : appeler finalize avant de considérer la synchro terminée. */
  needsFinalize?: boolean;
  stats: LibrarySyncStats;
  batchWorkItems: number;
  totalWorkItems: number | null;
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

const EMPTY_STATS = (): LibrarySyncStats => ({
  workItemsProcessed: 0,
  candidatesExtracted: 0,
  aliasesMerged: 0,
  variantsCreated: 0,
  resourcesCreated: 0,
  resourcesMatched: 0,
  skipped: 0,
  aliasesRemoved: 0,
  resourceFichesMerged: 0,
});

async function loadExistingResourceIndex(prisma: PrismaClient): Promise<ExistingResourceIndex[]> {
  return prisma.siteResource.findMany({
    where: { status: { not: "fusionne" }, mergedIntoId: null },
    select: {
      id: true,
      shortName: true,
      orderUnit: true,
      aliases: { select: { label: true, normalizedLabel: true } },
    },
  });
}

function pushVirtual(virtualCreated: ExistingResourceIndex[], p: GroupingProposalDraft, persistedId?: string | null) {
  const id = persistedId ?? `virtual-${p.normalizedSourceLabel}`;
  virtualCreated.push({
    id,
    shortName: p.candidate.suggestedShortName,
    orderUnit: p.candidate.suggestedUnit,
    aliases: [{ label: p.sourceLabel, normalizedLabel: p.normalizedSourceLabel }],
  });
}

/** Même périmètre que la bibliothèque « Ouvrages (liste) » : canoniques + uniques, hors archivés. */
const SYNC_WORK_ITEM_WHERE = {
  AND: [WORK_ITEM_VISIBLE_IN_LIST, { status: { not: "archive" as const } }],
};

async function countActiveWorkItems(prisma: PrismaClient) {
  return prisma.workItem.count({ where: SYNC_WORK_ITEM_WHERE });
}

/** Nettoyage global (alias + fusions) — requête séparée pour éviter les timeouts HTTP. */
export async function finalizeLibrarySync(prisma: PrismaClient, runId: string): Promise<LibrarySyncBatchResult> {
  const run = await prisma.siteResourceExtractionRun.findUnique({ where: { id: runId } });
  if (!run) throw new Error("Synchronisation introuvable.");
  const m = run.meta as LibrarySyncRunMeta | null;
  if (m?.mode !== "automated_library_sync") throw new Error("Run de synchronisation invalide.");
  if (m.phase === "done") {
    return {
      runId,
      done: true,
      stats: m.stats,
      batchWorkItems: 0,
      totalWorkItems: m.totalWorkItems ?? null,
    };
  }
  const stats = { ...EMPTY_STATS(), ...m?.stats };
  await finalizeSync(prisma, runId, stats);
  return {
    runId,
    done: true,
    stats,
    batchWorkItems: 0,
    totalWorkItems: m?.totalWorkItems ?? null,
  };
}

async function finalizeSync(prisma: PrismaClient, runId: string, stats: LibrarySyncStats) {
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
    where: { id: runId },
    data: {
      status: "applied",
      workItemCount: stats.workItemsProcessed,
      candidateCount: stats.candidatesExtracted,
      proposalCount: 0,
      meta: {
        mode: "automated_library_sync",
        phase: "done",
        cursor: null,
        stats,
        aliasDedupe,
        merge,
      } satisfies LibrarySyncRunMeta & { aliasDedupe: unknown; merge: unknown },
    },
  });
}

/** Traite un lot d’ouvrages (appel répété côté client jusqu’à done=true). */
export async function processLibrarySyncBatch(
  prisma: PrismaClient,
  opts: { runId?: string | null; batchSize?: number },
): Promise<LibrarySyncBatchResult> {
  const batchSize = Math.min(opts.batchSize ?? 12, 40);
  let runId = opts.runId?.trim() || null;

  let meta: LibrarySyncRunMeta | null = null;
  let stats: LibrarySyncStats = EMPTY_STATS();

  if (runId) {
    const run = await prisma.siteResourceExtractionRun.findUnique({ where: { id: runId } });
    if (!run) {
      runId = null;
    } else {
      const m = run.meta as LibrarySyncRunMeta | null;
      if (m?.mode === "automated_library_sync" && m.phase === "processing") {
        meta = m;
        stats = { ...EMPTY_STATS(), ...m.stats };
      } else if (m?.mode === "automated_library_sync" && m.phase === "finalizing") {
        return {
          runId: run.id,
          done: false,
          needsFinalize: true,
          stats: m.stats,
          batchWorkItems: 0,
          totalWorkItems: m.totalWorkItems ?? null,
        };
      } else if (m?.mode === "automated_library_sync" && m.phase === "done") {
        return {
          runId: run.id,
          done: true,
          stats: m.stats,
          batchWorkItems: 0,
          totalWorkItems: m.totalWorkItems ?? null,
        };
      } else {
        runId = null;
      }
    }
  }

  if (!runId) {
    const totalWorkItems = await countActiveWorkItems(prisma);
    stats = EMPTY_STATS();
    meta = { mode: "automated_library_sync", phase: "processing", cursor: null, stats, totalWorkItems };
    const run = await prisma.siteResourceExtractionRun.create({
      data: {
        label: `Sync auto ${new Date().toLocaleString("fr-FR")}`,
        status: "preview",
        workItemCount: 0,
        candidateCount: 0,
        proposalCount: 0,
        meta,
      },
    });
    runId = run.id;
  }

  if (!meta || !runId) {
    throw new Error("Impossible d'initialiser la synchronisation.");
  }

  const dbExisting = await loadExistingResourceIndex(prisma);
  const virtualCreated: ExistingResourceIndex[] = [];

  const batch = await prisma.workItem.findMany({
    where: SYNC_WORK_ITEM_WHERE,
    select: WORK_ITEM_SELECT,
    orderBy: { id: "asc" },
    take: batchSize,
    ...(meta.cursor ? { skip: 1, cursor: { id: meta.cursor } } : {}),
  });

  if (batch.length === 0) {
    await prisma.siteResourceExtractionRun.update({
      where: { id: runId },
      data: {
        meta: {
          mode: "automated_library_sync",
          phase: "finalizing",
          cursor: null,
          stats,
          totalWorkItems: meta.totalWorkItems,
        } satisfies LibrarySyncRunMeta,
      },
    });
    return {
      runId,
      done: false,
      needsFinalize: true,
      stats,
      batchWorkItems: 0,
      totalWorkItems: meta.totalWorkItems ?? null,
    };
  }

  let dedupRows = await loadResourceDedupRowsForApply(prisma);

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
      const applied = await applyGroupingDraft(prisma, p, runId, { dedupRows });
      if (applied.dedupRows) dedupRows = applied.dedupRows;
        switch (applied.action) {
          case "alias":
            stats.aliasesMerged += 1;
            if (applied.resourceId) pushVirtual(virtualCreated, p, applied.resourceId);
            break;
          case "variant":
            stats.variantsCreated += 1;
            if (applied.resourceId) pushVirtual(virtualCreated, p, applied.resourceId);
            break;
          case "created":
            stats.resourcesCreated += 1;
            pushVirtual(virtualCreated, p, applied.resourceId);
            break;
          case "matched":
            stats.resourcesMatched += 1;
            if (applied.resourceId) pushVirtual(virtualCreated, p, applied.resourceId);
            break;
          default:
            stats.skipped += 1;
        }
    }
  }

  const nextCursor = batch[batch.length - 1]!.id;
  const totalWorkItems = meta.totalWorkItems ?? (await countActiveWorkItems(prisma));

  await prisma.siteResourceExtractionRun.update({
    where: { id: runId },
    data: {
      meta: {
        mode: "automated_library_sync",
        phase: "processing",
        cursor: nextCursor,
        stats,
        totalWorkItems,
      } satisfies LibrarySyncRunMeta,
    },
  });

  return {
    runId,
    done: false,
    stats,
    batchWorkItems: batch.length,
    totalWorkItems,
  };
}

export type LibrarySyncProgress = LibrarySyncBatchResult & {
  phase: "batch" | "finalize" | "done";
};

function isTransientDbError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /Server has closed the connection|ECONNRESET|Connection terminated|Can't reach database server|P1001|P1017|ETIMEDOUT|socket hang up/i.test(
    msg,
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withDbRetry<T>(
  getClient: () => PrismaClient,
  client: PrismaClient,
  fn: (db: PrismaClient) => Promise<T>,
  onReconnect?: () => void,
): Promise<{ client: PrismaClient; value: T }> {
  let db = client;
  const maxAttempts = 12;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const value = await fn(db);
      return { client: db, value };
    } catch (e) {
      if (!isTransientDbError(e) || attempt >= maxAttempts - 1) throw e;
      onReconnect?.();
      await db.$disconnect().catch(() => {});
      await sleep(Math.min(30000, 2000 * (attempt + 1)));
      db = getClient();
    }
  }

  throw new Error("Échec après reconnexions répétées.");
}

/** Sync complète en une fois (scripts CLI — pas de limite HTTP). */
export async function syncLibraryToChantierResourcesCore(
  prisma: PrismaClient,
  opts?: {
    batchSize?: number;
    /** Reprendre un run interrompu (curseur en base). */
    initialRunId?: string | null;
    onProgress?: (p: LibrarySyncProgress) => void;
    /** Recréer Prisma après coupure réseau (scripts CLI). */
    createClient?: () => PrismaClient;
    onReconnect?: () => void;
    /** Recréer Prisma après chaque lot (connexions courtes — pooler Supabase). */
    shortLivedConnections?: boolean;
  },
): Promise<{ runId: string; stats: LibrarySyncStats; prisma: PrismaClient }> {
  const batchSize = opts?.batchSize ?? 8;
  const shortLived = opts?.shortLivedConnections ?? Boolean(opts?.createClient);
  const getClient = opts?.createClient ?? (() => prisma);
  let client = prisma;
  let runId: string | null = opts?.initialRunId?.trim() || null;
  let result!: LibrarySyncBatchResult;
  let loops = 0;
  const maxLoops = 5000;

  do {
    const batch = await withDbRetry(
      getClient,
      client,
      (db) => processLibrarySyncBatch(db, { runId, batchSize }),
      opts?.onReconnect,
    );
    client = batch.client;
    result = batch.value;
    runId = result.runId;
    opts?.onProgress?.({ ...result, phase: "batch" });

    if (shortLived && opts?.createClient) {
      await client.$disconnect().catch(() => {});
      client = getClient();
    }

    if (result.needsFinalize && runId) {
      opts?.onProgress?.({ ...result, phase: "finalize" });
      const fin = await withDbRetry(
        getClient,
        client,
        (db) => finalizeLibrarySync(db, runId!),
        opts?.onReconnect,
      );
      client = fin.client;
      result = fin.value;
      opts?.onProgress?.({ ...result, phase: "done" });
      break;
    }

    loops += 1;
    if (loops >= maxLoops) {
      throw new Error("Synchronisation interrompue : trop de lots (vérifiez le curseur en base).");
    }
  } while (!result.done);

  return {
    runId: result.runId,
    stats: result.stats,
    prisma: client,
  };
}

/** Dernier run synchro bibliothèque non terminé (reprise CLI). */
export async function findResumableLibrarySyncRunId(prisma: PrismaClient): Promise<string | null> {
  const runs = await prisma.siteResourceExtractionRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 15,
  });
  for (const run of runs) {
    const m = run.meta as LibrarySyncRunMeta | null;
    if (
      m?.mode === "automated_library_sync" &&
      (m.phase === "processing" || m.phase === "finalizing")
    ) {
      return run.id;
    }
  }
  return null;
}
