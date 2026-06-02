"use server";

import { revalidatePath } from "next/cache";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import {
  buildRecodificationProposals,
  isMartinImportCode,
  parseSourceLineFromMartinCode,
  type RecodeProposalRow,
} from "@/lib/be-work-devis-recodification";
import { DEFAULT_BEWORK_FAMILY_CODE, generateBeWorkCode, suggestFamilyCodeFromWorkItem } from "@/lib/bework-devis-family-codes";
import { prisma } from "@/lib/prisma";
import { requireCatalogAllowsBulkWrite } from "@/lib/work-item-catalog-policy";
import type { PrismaClient } from "@prisma/client";

type PrismaTx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use">;

async function guard() {
  await requireBeWorkDevisSession();
}

export async function getRecodificationProposals(): Promise<RecodeProposalRow[]> {
  await guard();

  const [allRows, candidates] = await Promise.all([
    prisma.workItem.findMany({ select: { code: true } }),
    prisma.workItem.findMany({
      where: {
        code: { startsWith: "BW-MARTIN-", mode: "insensitive" },
      },
      orderBy: [{ lot: "asc" }, { code: "asc" }],
      select: {
        id: true,
        code: true,
        lot: true,
        family: true,
        title: true,
        status: true,
      },
    }),
  ]);

  const allCodes = new Set(allRows.map((r) => r.code.toUpperCase()));
  if (candidates.length === 0) return [];

  const ids = candidates.map((c) => c.id);
  const aggs = await prisma.priceEntry.groupBy({
    by: ["workItemId"],
    where: { workItemId: { in: ids } },
    _avg: { unitPriceHT: true },
  });
  const avgMap = new Map(aggs.map((a) => [a.workItemId, a._avg.unitPriceHT != null ? Number(a._avg.unitPriceHT) : null]));

  const inputs = candidates.map((c) => ({
    id: c.id,
    code: c.code,
    lot: c.lot,
    family: c.family,
    title: c.title,
    status: c.status,
    avgHt: avgMap.get(c.id) ?? null,
  }));

  return buildRecodificationProposals(inputs, allCodes);
}

async function allocateNextGenericCode(tx: PrismaTx, family: string, excludeWorkItemId: string): Promise<string> {
  const fam = family.toUpperCase();
  const prefix = `BW-${fam}-`;
  const rows = await tx.workItem.findMany({
    where: { code: { startsWith: prefix, mode: "insensitive" } },
    select: { code: true, id: true },
  });

  let max = 0;
  const used = new Set<string>();
  for (const r of rows) {
    const u = r.code.toUpperCase();
    if (r.id !== excludeWorkItemId) used.add(u);
    if (r.id === excludeWorkItemId) continue;
    const m = /^BW-[A-Z]{3}-(\d+)$/i.exec(r.code);
    if (m) max = Math.max(max, Number.parseInt(m[1], 10));
  }

  let n = max + 1;
  let candidate = generateBeWorkCode(fam, n);
  while (used.has(candidate.toUpperCase())) {
    n += 1;
    candidate = generateBeWorkCode(fam, n);
  }
  return candidate;
}

export async function applyWorkItemRecodification(workItemId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await guard();
  if (!workItemId.trim()) return { ok: false, error: "Identifiant manquant." };

  try {
    await requireCatalogAllowsBulkWrite();
    await prisma.$transaction(async (tx) => {
      const item = await tx.workItem.findUnique({
        where: { id: workItemId },
        select: { id: true, code: true, lot: true, family: true, title: true, itemType: true },
      });
      if (!item) throw new Error("Ouvrage introuvable.");
      if (!isMartinImportCode(item.code)) {
        throw new Error("Cet ouvrage n’est plus éligible (code déjà recodifié ou non Martin).");
      }

      const fam = (
        suggestFamilyCodeFromWorkItem({
          lot: item.lot,
          family: item.family,
          title: item.title,
          itemType: item.itemType,
        }) ?? DEFAULT_BEWORK_FAMILY_CODE
      ).toUpperCase();
      const newCode = await allocateNextGenericCode(tx, fam, item.id);
      const line = parseSourceLineFromMartinCode(item.code);
      const oldCode = item.code;

      await tx.workItem.update({
        where: { id: item.id },
        data: {
          code: newCode,
          sourceCode: oldCode,
          sourceLine: line ?? undefined,
          familyCode: fam,
        },
      });
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inconnue.";
    return { ok: false, error: msg };
  }

  revalidatePath("/dashboard/devis/bibliotheque");
  revalidatePath("/dashboard/devis/bibliotheque/recodification");
  revalidatePath("/dashboard/devis/recherche");
  revalidatePath("/dashboard/devis/prix");
  revalidatePath(`/dashboard/devis/bibliotheque/${workItemId}`);
  return { ok: true };
}
