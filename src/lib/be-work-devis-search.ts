import type { Prisma, WorkItem } from "@prisma/client";
import {
  isBeWorkPriceDocSourceType,
  isWorkItemQualityLevel,
  isWorkItemStatus,
} from "@/lib/be-work-devis-labels";
import { prisma } from "@/lib/prisma";

/** Tri côté application après agrégation des prix (pas de ORDER BY SQL sur les agrégats). */
export const WORK_ITEM_SORT_KEYS = [
  "updated_desc",
  "code_asc",
  "lot_asc",
  "title_asc",
  "status_asc",
  "priceCount_desc",
  "avgHt_desc",
  "avgHt_asc",
] as const;

export type WorkItemSortKey = (typeof WORK_ITEM_SORT_KEYS)[number];

export function parseWorkItemSortKey(v: string | undefined): WorkItemSortKey {
  if (v && (WORK_ITEM_SORT_KEYS as readonly string[]).includes(v)) return v as WorkItemSortKey;
  return "updated_desc";
}

/** Clause OR « mot approximatif » sur les champs texte ouvrage (Prisma contains + insensitive). */
export function keywordSearchWhereClause(q: string): Prisma.WorkItemWhereInput {
  const t = q.trim();
  if (!t) return {};
  return {
    OR: [
      { code: { contains: t, mode: "insensitive" } },
      { lot: { contains: t, mode: "insensitive" } },
      { subLot: { contains: t, mode: "insensitive" } },
      { family: { contains: t, mode: "insensitive" } },
      { title: { contains: t, mode: "insensitive" } },
      { shortDescription: { contains: t, mode: "insensitive" } },
      { fullDescription: { contains: t, mode: "insensitive" } },
      { technicalReference: { contains: t, mode: "insensitive" } },
      { vigilancePoints: { contains: t, mode: "insensitive" } },
      { includedItems: { contains: t, mode: "insensitive" } },
      { excludedItems: { contains: t, mode: "insensitive" } },
    ],
  };
}

export type WorkItemFilterParams = {
  q?: string;
  lot?: string;
  subLot?: string;
  unit?: string;
  status?: string;
  gamme?: string;
  /** Filtre « contient » sur la référence technique */
  techRef?: string;
  /** Département sur une ligne de prix associée */
  priceDept?: string;
  /** Type de source documentaire sur une ligne de prix associée */
  priceSourceType?: string;
};

export function buildWorkItemWhere(params: WorkItemFilterParams): Prisma.WorkItemWhereInput {
  const AND: Prisma.WorkItemWhereInput[] = [];

  const q = params.q?.trim();
  if (q) AND.push(keywordSearchWhereClause(q));

  const lot = params.lot?.trim();
  if (lot) AND.push({ lot });

  const subLot = params.subLot?.trim();
  if (subLot) AND.push({ subLot });

  const unit = params.unit?.trim();
  if (unit) AND.push({ unit });

  const status = params.status?.trim();
  if (status && isWorkItemStatus(status)) AND.push({ status });

  const gamme = params.gamme?.trim();
  if (gamme && isWorkItemQualityLevel(gamme)) AND.push({ qualityLevel: gamme });

  const techRef = params.techRef?.trim();
  if (techRef) AND.push({ technicalReference: { contains: techRef, mode: "insensitive" } });

  const priceDept = params.priceDept?.trim();
  const pst = params.priceSourceType?.trim();
  if (priceDept || (pst && isBeWorkPriceDocSourceType(pst))) {
    const peFilter: Prisma.PriceEntryWhereInput = {};
    if (priceDept) peFilter.department = priceDept;
    if (pst && isBeWorkPriceDocSourceType(pst)) peFilter.sourceType = pst;
    AND.push({ priceEntries: { some: peFilter } });
  }

  return AND.length ? { AND } : {};
}

export type ItemAgg = { count: number; avgHt: number | null };

export type WorkItemWithPriceStats = WorkItem & {
  priceCount: number;
  avgHt: number | null;
};

export function mergeAggregates(items: WorkItem[], aggMap: Map<string, ItemAgg>): WorkItemWithPriceStats[] {
  return items.map((w) => {
    const a = aggMap.get(w.id) ?? { count: 0, avgHt: null };
    return { ...w, priceCount: a.count, avgHt: a.avgHt };
  });
}

export function sortMergedWorkItems(rows: WorkItemWithPriceStats[], sort: WorkItemSortKey): void {
  const cmp = (a: string, b: string) => a.localeCompare(b, "fr", { sensitivity: "base" });
  rows.sort((r1, r2) => {
    switch (sort) {
      case "updated_desc":
        return r2.updatedAt.getTime() - r1.updatedAt.getTime();
      case "code_asc":
        return cmp(r1.code, r2.code);
      case "lot_asc":
        return cmp(r1.lot, r2.lot) || cmp(r1.code, r2.code);
      case "title_asc":
        return cmp(r1.title, r2.title) || cmp(r1.code, r2.code);
      case "status_asc":
        return cmp(r1.status, r2.status) || cmp(r1.code, r2.code);
      case "priceCount_desc":
        return r2.priceCount - r1.priceCount || r2.updatedAt.getTime() - r1.updatedAt.getTime();
      case "avgHt_desc": {
        if (r1.avgHt == null && r2.avgHt == null) return cmp(r1.code, r2.code);
        if (r1.avgHt == null) return 1;
        if (r2.avgHt == null) return -1;
        return r2.avgHt - r1.avgHt || cmp(r1.code, r2.code);
      }
      case "avgHt_asc": {
        if (r1.avgHt == null && r2.avgHt == null) return cmp(r1.code, r2.code);
        if (r1.avgHt == null) return 1;
        if (r2.avgHt == null) return -1;
        return r1.avgHt - r2.avgHt || cmp(r1.code, r2.code);
      }
      default:
        return 0;
    }
  });
}

const DEFAULT_MAX_ROWS = 2000;

export async function fetchWorkItemsWithPriceStats(
  where: Prisma.WorkItemWhereInput,
  sort: WorkItemSortKey,
  maxRows = DEFAULT_MAX_ROWS,
): Promise<WorkItemWithPriceStats[]> {
  const items = await prisma.workItem.findMany({
    where,
    take: maxRows,
  });
  const ids = items.map((i) => i.id);
  if (ids.length === 0) return [];

  const aggregates = await prisma.priceEntry.groupBy({
    by: ["workItemId"],
    where: { workItemId: { in: ids } },
    _avg: { unitPriceHT: true },
    _count: { _all: true },
  });

  const aggMap = new Map<string, ItemAgg>();
  for (const a of aggregates) {
    aggMap.set(a.workItemId, {
      count: a._count._all,
      avgHt: a._avg.unitPriceHT != null ? Number(a._avg.unitPriceHT) : null,
    });
  }

  const merged = mergeAggregates(items, aggMap);
  sortMergedWorkItems(merged, sort);
  return merged;
}

export function excerptDesignation(
  w: Pick<WorkItem, "shortDescription" | "fullDescription">,
  maxLen = 140,
): string {
  const raw = (w.shortDescription?.trim() || w.fullDescription?.trim() || "").replace(/\s+/g, " ");
  if (raw.length <= maxLen) return raw;
  return `${raw.slice(0, maxLen - 1)}…`;
}
