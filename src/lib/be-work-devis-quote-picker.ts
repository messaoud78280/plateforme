import { prisma } from "@/lib/prisma";
import { keywordSearchWhereClause } from "@/lib/be-work-devis-search";
import { mergeCatalogIntoWhere, resolveActiveWorkItemCatalogId } from "@/lib/work-item-catalog";

export type QuotePickerWorkItem = {
  id: string;
  code: string;
  lot: string;
  family: string | null;
  title: string;
  unit: string;
  fullDescription: string;
  includedItems: string | null;
  excludedItems: string | null;
  vigilancePoints: string | null;
  avgHt: number | null;
};

const PICKER_MAX = 40;

export async function searchWorkItemsForQuotePicker(q: string): Promise<QuotePickerWorkItem[]> {
  const catalogId = await resolveActiveWorkItemCatalogId();
  const t = q.trim();
  const where = mergeCatalogIntoWhere(catalogId, t ? keywordSearchWhereClause(t) : {});
  const items = await prisma.workItem.findMany({
    where,
    take: PICKER_MAX,
    orderBy: [{ lot: "asc" }, { code: "asc" }],
    select: {
      id: true,
      code: true,
      lot: true,
      family: true,
      title: true,
      unit: true,
      fullDescription: true,
      includedItems: true,
      excludedItems: true,
      vigilancePoints: true,
    },
  });
  if (items.length === 0) return [];

  const ids = items.map((i) => i.id);
  const aggregates = await prisma.priceEntry.groupBy({
    by: ["workItemId"],
    where: { workItemId: { in: ids } },
    _avg: { unitPriceHT: true },
  });
  const avgMap = new Map<string, number | null>();
  for (const a of aggregates) {
    avgMap.set(a.workItemId, a._avg.unitPriceHT != null ? Number(a._avg.unitPriceHT) : null);
  }

  return items.map((w) => ({
    ...w,
    avgHt: avgMap.get(w.id) ?? null,
  }));
}
