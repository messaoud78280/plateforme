"use server";

import { revalidatePath } from "next/cache";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import {
  buildMergeClassificationPatch,
  inferClassificationFromPriceImportMeta,
  workItemHasGenericClassification,
} from "@/lib/be-work-devis-import-classification";
import { prisma } from "@/lib/prisma";
import { mergeCatalogIntoWhere, resolveActiveWorkItemCatalogId } from "@/lib/work-item-catalog";
import { requireCatalogAllowsBulkWrite } from "@/lib/work-item-catalog-policy";

async function guard() {
  await requireBeWorkDevisSession();
}

export type RepairImportClassificationResult = {
  ok: true;
  scanned: number;
  updated: number;
  skipped: number;
  errors: string[];
};

/**
 * Répare les fiches encore en DIV / Non classé / unité générique
 * à partir des métadonnées d’import conservées sur les PriceEntry (sans toucher aux prix).
 */
export async function repairWorkItemsClassificationFromImportMeta(opts?: {
  limit?: number;
}): Promise<RepairImportClassificationResult | { ok: false; error: string }> {
  await guard();
  await requireCatalogAllowsBulkWrite();

  const limit = Math.min(Math.max(opts?.limit ?? 500, 1), 5000);
  const catalogId = await resolveActiveWorkItemCatalogId();

  try {
    const candidates = await prisma.workItem.findMany({
      where: mergeCatalogIntoWhere(catalogId, {
        mergeStatus: { not: "merged" },
        OR: [
          { familyCode: null },
          { familyCode: "DIV" },
          { lot: { contains: "Divers", mode: "insensitive" } },
          { family: { contains: "Non class", mode: "insensitive" } },
          { unit: { in: ["unité", "u", "U"] } },
        ],
      }),
      select: {
        id: true,
        code: true,
        lot: true,
        subLot: true,
        family: true,
        familyCode: true,
        unit: true,
      },
      take: limit,
      orderBy: { updatedAt: "desc" },
    });

    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of candidates) {
      if (!workItemHasGenericClassification(item)) {
        skipped += 1;
        continue;
      }

      const prices = (
        await prisma.priceEntry.findMany({
          where: { workItemId: item.id },
          select: { importMeta: true },
          take: 80,
        })
      ).filter((p) => p.importMeta != null);

      if (prices.length === 0) {
        skipped += 1;
        continue;
      }

      const inferred = inferClassificationFromPriceImportMeta(prices);
      if (!inferred) {
        skipped += 1;
        continue;
      }

      const patch = buildMergeClassificationPatch(item, inferred);
      if (!patch) {
        skipped += 1;
        continue;
      }

      try {
        await prisma.workItem.update({
          where: { id: item.id },
          data: patch,
        });
        updated += 1;
        revalidatePath(`/dashboard/devis/bibliotheque/${item.id}`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erreur inconnue";
        errors.push(`${item.code} : ${msg}`);
      }
    }

    revalidatePath("/dashboard/devis/bibliotheque");
    revalidatePath("/dashboard/devis/recherche");

    return { ok: true, scanned: candidates.length, updated, skipped, errors: errors.slice(0, 40) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur réparation classification";
    return { ok: false, error: msg };
  }
}
