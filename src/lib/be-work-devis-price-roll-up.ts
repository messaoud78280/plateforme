import type { PrismaClient } from "@prisma/client";
import type { ItemAgg } from "@/lib/be-work-devis-search";

/** IDs d’ouvrages dont les `PriceEntry` doivent apparaître sur une fiche (canonique + variantes fusionnées). */
export async function workItemIdsForPriceRollUp(
  prisma: PrismaClient,
  workItem: { id: string; mergeStatus: string },
): Promise<string[]> {
  if (workItem.mergeStatus !== "canonical") {
    return [workItem.id];
  }
  const variants = await prisma.workItem.findMany({
    where: { canonicalWorkItemId: workItem.id, mergeStatus: "merged" },
    select: { id: true },
  });
  return [workItem.id, ...variants.map((v) => v.id)];
}

/** Regroupe les agrégats prix des variantes fusionnées sur l’ID de la fiche canonique. */
export function rollupPriceAggregatesToCanonicals(
  aggregates: { workItemId: string; _count: { _all: number }; _avg: { unitPriceHT: unknown } }[],
  variantToCanonical: Map<string, string>,
): Map<string, ItemAgg> {
  const aggMap = new Map<string, ItemAgg & { weightedSum: number }>();

  for (const a of aggregates) {
    const targetId = variantToCanonical.get(a.workItemId) ?? a.workItemId;
    const count = a._count._all;
    const avgHt = a._avg.unitPriceHT != null ? Number(a._avg.unitPriceHT) : null;

    const prev = aggMap.get(targetId) ?? { count: 0, avgHt: null, weightedSum: 0 };
    prev.count += count;
    if (avgHt != null && count > 0) {
      prev.weightedSum += avgHt * count;
    }
    aggMap.set(targetId, prev);
  }

  const out = new Map<string, ItemAgg>();
  for (const [id, v] of aggMap) {
    out.set(id, {
      count: v.count,
      avgHt: v.count > 0 ? v.weightedSum / v.count : null,
    });
  }
  return out;
}

/** Map variante fusionnée → fiche canonique pour un lot d’IDs affichés en liste. */
export async function buildVariantToCanonicalMap(
  prisma: PrismaClient,
  canonicalIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (canonicalIds.length === 0) return map;

  const variants = await prisma.workItem.findMany({
    where: {
      canonicalWorkItemId: { in: canonicalIds },
      mergeStatus: "merged",
    },
    select: { id: true, canonicalWorkItemId: true },
  });

  for (const v of variants) {
    if (v.canonicalWorkItemId) map.set(v.id, v.canonicalWorkItemId);
  }
  return map;
}
