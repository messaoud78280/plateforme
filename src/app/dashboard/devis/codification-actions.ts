"use server";

import { revalidatePath } from "next/cache";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import {
  buildCodificationBeforeAfterReport,
  buildWorkItemCodificationProposals,
  type CodificationBeforeAfterReport,
  type CodificationProposalRow,
} from "@/lib/bework-work-item-codification";
import type { CodificationMappingRule } from "@/lib/bework-work-item-codification/classify";
import { prisma } from "@/lib/prisma";
import { Prisma, type WorkItemCodificationStatus } from "@prisma/client";
import { WORK_ITEM_VISIBLE_IN_LIST } from "@/lib/work-item-merge";

const REVALIDATE = [
  "/dashboard/devis/bibliotheque",
  "/dashboard/devis/bibliotheque/codification",
  "/dashboard/devis/bibliotheque/recodification",
];

function revalidateCodification() {
  for (const p of REVALIDATE) revalidatePath(p);
}

function migrationHint(msg: string): string | null {
  if (/codeBework|WorkItemCodification|codificationStatus/.test(msg)) {
    return "Migration requise : exécutez prisma/migrations/add-workitem-bework-codification.sql sur Supabase.";
  }
  return null;
}

const WORK_ITEM_SELECT = {
  id: true,
  code: true,
  codeBework: true,
  sourceCode: true,
  lot: true,
  family: true,
  familyCode: true,
  title: true,
  fullDescription: true,
  unit: true,
  itemType: true,
  codificationStatus: true,
  normalizedDesignation: true,
} satisfies Prisma.WorkItemSelect;

export type CodificationListFilters = {
  lotCode?: string;
  familleCode?: string;
  sousFamilleCode?: string;
  codificationStatus?: WorkItemCodificationStatus;
  onlyNeedsReview?: boolean;
  q?: string;
};

async function guard() {
  await requireBeWorkDevisSession();
}

async function loadMappingRules(): Promise<CodificationMappingRule[]> {
  try {
    const rows = await prisma.workItemCodificationMapping.findMany({
      where: { active: true },
      orderBy: [{ priority: "desc" }, { sourcePattern: "asc" }],
    });
    return rows.map((r) => ({
      sourcePattern: r.sourcePattern,
      matchType: r.matchType,
      lotCode: r.lotCode,
      familleCode: r.familleCode,
      ouvrageCode: r.ouvrageCode,
      sousFamilleCode: r.sousFamilleCode,
      sousFamilleNom: r.sousFamilleNom,
      priority: r.priority,
    }));
  } catch {
    return [];
  }
}

async function fetchWorkItemsForCodification(filters?: CodificationListFilters) {
  const where: Prisma.WorkItemWhereInput = {
    ...WORK_ITEM_VISIBLE_IN_LIST,
  };

  if (filters?.lotCode) where.lotCode = filters.lotCode;
  if (filters?.familleCode) where.familyCode = filters.familleCode;
  if (filters?.sousFamilleCode) where.sousFamilleCode = filters.sousFamilleCode;
  if (filters?.codificationStatus) where.codificationStatus = filters.codificationStatus;
  if (filters?.onlyNeedsReview) {
    where.codificationStatus = { in: ["a_verifier", "pending"] };
  }
  if (filters?.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { code: { contains: q, mode: "insensitive" } },
      { sourceCode: { contains: q, mode: "insensitive" } },
      { codeBework: { contains: q, mode: "insensitive" } },
    ];
  }

  const items = await prisma.workItem.findMany({
    where,
    orderBy: [{ lotCode: "asc" }, { code: "asc" }],
    select: WORK_ITEM_SELECT,
    take: 5000,
  });

  const ids = items.map((i) => i.id);
  const aggs =
    ids.length > 0
      ? await prisma.priceEntry.groupBy({
          by: ["workItemId"],
          where: { workItemId: { in: ids } },
          _avg: { unitPriceHT: true },
          _count: { id: true },
        })
      : [];

  const avgMap = new Map(
    aggs.map((a) => [a.workItemId, a._avg.unitPriceHT != null ? Number(a._avg.unitPriceHT) : null]),
  );
  const countMap = new Map(aggs.map((a) => [a.workItemId, a._count.id]));

  return items.map((i) => ({
    ...i,
    avgHt: avgMap.get(i.id) ?? null,
    priceSourceCount: countMap.get(i.id) ?? 0,
  }));
}

function toProposalInputs(
  items: Awaited<ReturnType<typeof fetchWorkItemsForCodification>>,
) {
  return items.map((i) => ({
    id: i.id,
    code: i.code,
    codeBework: i.codeBework,
    sourceCode: i.sourceCode,
    lot: i.lot,
    family: i.family,
    familyCode: i.familyCode,
    title: i.title,
    fullDescription: i.fullDescription,
    unit: i.unit,
    itemType: i.itemType,
    codificationStatus: i.codificationStatus,
    normalizedDesignation: i.normalizedDesignation,
    avgHt: i.avgHt,
    priceSourceCount: i.priceSourceCount,
  }));
}

export async function getWorkItemCodificationProposals(
  filters?: CodificationListFilters,
): Promise<{ proposals: CodificationProposalRow[]; report: CodificationBeforeAfterReport } | { error: string }> {
  await guard();
  try {
    const [items, allBework, rules] = await Promise.all([
      fetchWorkItemsForCodification(filters),
      prisma.workItem.findMany({
        where: { codeBework: { not: null } },
        select: { codeBework: true },
      }),
      loadMappingRules(),
    ]);

    const existing = new Set(
      allBework.map((r) => r.codeBework!.trim().toUpperCase()).filter(Boolean),
    );
    const inputs = toProposalInputs(items);
    const proposals = buildWorkItemCodificationProposals(inputs, existing, rules);
    const report = buildCodificationBeforeAfterReport(inputs, proposals);
    return { proposals, report };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur";
    return { error: migrationHint(msg) ?? msg };
  }
}

export type CodificationListRow = CodificationProposalRow & {
  codificationStatus: WorkItemCodificationStatus;
};

export async function listWorkItemsForCodificationAdmin(
  filters?: CodificationListFilters,
): Promise<{ rows: CodificationListRow[]; report: CodificationBeforeAfterReport } | { error: string }> {
  const res = await getWorkItemCodificationProposals(filters);
  if ("error" in res) return res;

  const items = await fetchWorkItemsForCodification(filters);
  const statusMap = new Map(items.map((i) => [i.id, i.codificationStatus]));

  const rows: CodificationListRow[] = res.proposals.map((p) => ({
    ...p,
    codificationStatus: statusMap.get(p.id) ?? p.proposedStatus,
  }));

  const merged = new Map(rows.map((r) => [r.id, r]));
  for (const item of items) {
    if (!merged.has(item.id) && item.codeBework) {
      merged.set(item.id, {
        id: item.id,
        codeSource: item.sourceCode ?? item.code,
        currentCode: item.code,
        currentCodeBework: item.codeBework,
        proposedCodeBework: item.codeBework,
        importSource: null,
        lotCode: "",
        familleCode: item.familyCode ?? "",
        familleNom: "",
        sousFamilleCode: null,
        sousFamilleNom: null,
        ouvrageCode: "",
        designationNormalisee: item.normalizedDesignation ?? item.title,
        designationSource: item.title,
        unite: item.unit,
        proposedStatus: item.codificationStatus,
        confidence: "haute",
        matchReason: "Déjà codifié",
        groupKey: "",
        variantIndex: 0,
        avgHt: item.avgHt,
        priceSourceCount: item.priceSourceCount,
        codificationStatus: item.codificationStatus,
      });
    }
  }

  return { rows: [...merged.values()], report: res.report };
}

type ApplyOptions = {
  dryRun?: boolean;
  onlyAuto?: boolean;
  workItemIds?: string[];
};

function buildSnapshot(item: {
  code: string;
  codeBework: string | null;
  sourceCode: string | null;
  sourceLine: string | null;
  familyCode: string | null;
  lotCode: string | null;
  familleNom: string | null;
  sousFamilleCode: string | null;
  sousFamilleNom: string | null;
  ouvrageCode: string | null;
  importSource: string | null;
  designationSource: string | null;
  normalizedDesignation: string | null;
  codificationStatus: WorkItemCodificationStatus;
}): Prisma.InputJsonValue {
  return {
    code: item.code,
    codeBework: item.codeBework,
    sourceCode: item.sourceCode,
    sourceLine: item.sourceLine,
    familyCode: item.familyCode,
    lotCode: item.lotCode,
    familleNom: item.familleNom,
    sousFamilleCode: item.sousFamilleCode,
    sousFamilleNom: item.sousFamilleNom,
    ouvrageCode: item.ouvrageCode,
    importSource: item.importSource,
    designationSource: item.designationSource,
    normalizedDesignation: item.normalizedDesignation,
    codificationStatus: item.codificationStatus,
  };
}

export async function applyWorkItemCodificationBatch(
  options: ApplyOptions = {},
): Promise<
  | { ok: true; applied: number; skipped: number; dryRun: boolean; report: CodificationBeforeAfterReport }
  | { ok: false; error: string }
> {
  await guard();
  const dryRun = options.dryRun ?? false;
  const onlyAuto = options.onlyAuto ?? false;

  try {
    const preview = await getWorkItemCodificationProposals();
    if ("error" in preview) return { ok: false, error: preview.error };

    let targets = preview.proposals;
    if (options.workItemIds?.length) {
      const set = new Set(options.workItemIds);
      targets = targets.filter((p) => set.has(p.id));
    }
    if (onlyAuto) targets = targets.filter((p) => p.proposedStatus === "auto");

    if (dryRun) {
      return {
        ok: true,
        applied: targets.length,
        skipped: preview.proposals.length - targets.length,
        dryRun: true,
        report: preview.report,
      };
    }

    let applied = 0;
    let skipped = 0;
    const jobId = `cod-${Date.now()}`;

    await prisma.$transaction(async (tx) => {
      for (const p of targets) {
        const item = await tx.workItem.findUnique({
          where: { id: p.id },
          select: {
            id: true,
            code: true,
            codeBework: true,
            sourceCode: true,
            sourceLine: true,
            familyCode: true,
            lotCode: true,
            familleNom: true,
            sousFamilleCode: true,
            sousFamilleNom: true,
            ouvrageCode: true,
            importSource: true,
            designationSource: true,
            normalizedDesignation: true,
            codificationStatus: true,
          },
        });
        if (!item) {
          skipped += 1;
          continue;
        }

        const preservedSource = item.sourceCode?.trim() || item.code;
        const snapshot = buildSnapshot(item);

        await tx.workItemCodificationRevert.create({
          data: {
            workItemId: item.id,
            jobId,
            snapshot,
          },
        });

        await tx.workItem.update({
          where: { id: item.id },
          data: {
            codeBework: p.proposedCodeBework,
            sourceCode: preservedSource,
            importSource: p.importSource ?? item.importSource,
            lotCode: p.lotCode,
            familyCode: p.familleCode,
            familleNom: p.familleNom,
            sousFamilleCode: p.sousFamilleCode,
            sousFamilleNom: p.sousFamilleNom,
            ouvrageCode: p.ouvrageCode,
            designationSource: p.designationSource,
            normalizedDesignation: p.designationNormalisee,
            codificationStatus: p.proposedStatus,
            codificationSnapshot: snapshot,
            codificationAppliedAt: new Date(),
          },
        });
        applied += 1;
      }

      await tx.libraryCleanupJob.create({
        data: {
          jobType: "workitem_codification_apply",
          status: "completed",
          dryRun: false,
          processedCount: applied,
          successCount: applied,
          errorCount: skipped,
          logs: {
            jobId,
            applied,
            skipped,
            sample: targets.slice(0, 20).map((t) => ({
              id: t.id,
              from: t.codeSource,
              to: t.proposedCodeBework,
            })),
          },
          finishedAt: new Date(),
          startedAt: new Date(),
        },
      });
    });

    revalidateCodification();
    const after = await getWorkItemCodificationProposals();
    const report = "error" in after ? preview.report : after.report;

    return { ok: true, applied, skipped, dryRun: false, report };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur";
    return { ok: false, error: migrationHint(msg) ?? msg };
  }
}

export async function validateWorkItemCodification(
  workItemId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await guard();
  try {
    await prisma.workItem.update({
      where: { id: workItemId },
      data: { codificationStatus: "valide" },
    });
    revalidateCodification();
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur";
    return { ok: false, error: migrationHint(msg) ?? msg };
  }
}

export async function revertWorkItemCodification(
  workItemId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await guard();
  try {
    await prisma.$transaction(async (tx) => {
      const revert = await tx.workItemCodificationRevert.findFirst({
        where: { workItemId, revertedAt: null },
        orderBy: { appliedAt: "desc" },
      });
      if (!revert) throw new Error("Aucun instantané réversible pour cet ouvrage.");

      const snap = revert.snapshot as Record<string, unknown>;
      await tx.workItem.update({
        where: { id: workItemId },
        data: {
          code: typeof snap.code === "string" ? snap.code : undefined,
          codeBework: (snap.codeBework as string | null) ?? null,
          sourceCode: (snap.sourceCode as string | null) ?? undefined,
          sourceLine: (snap.sourceLine as string | null) ?? undefined,
          familyCode: (snap.familyCode as string | null) ?? undefined,
          lotCode: (snap.lotCode as string | null) ?? undefined,
          familleNom: (snap.familleNom as string | null) ?? undefined,
          sousFamilleCode: (snap.sousFamilleCode as string | null) ?? undefined,
          sousFamilleNom: (snap.sousFamilleNom as string | null) ?? undefined,
          ouvrageCode: (snap.ouvrageCode as string | null) ?? undefined,
          importSource: (snap.importSource as string | null) ?? undefined,
          designationSource: (snap.designationSource as string | null) ?? undefined,
          normalizedDesignation: (snap.normalizedDesignation as string | null) ?? undefined,
          codificationStatus: (snap.codificationStatus as WorkItemCodificationStatus) ?? "pending",
          codificationSnapshot: Prisma.DbNull,
          codificationAppliedAt: null,
        },
      });
      await tx.workItemCodificationRevert.update({
        where: { id: revert.id },
        data: { revertedAt: new Date() },
      });
    });
    revalidateCodification();
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur";
    return { ok: false, error: msg };
  }
}

export async function listCodificationMappingRules() {
  await guard();
  try {
    return prisma.workItemCodificationMapping.findMany({
      where: { active: true },
      orderBy: [{ priority: "desc" }, { sourcePattern: "asc" }],
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur";
    throw new Error(migrationHint(msg) ?? msg);
  }
}
