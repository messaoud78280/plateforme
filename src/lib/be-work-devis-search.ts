import type { Prisma, WorkItem } from "@prisma/client";
import {
  isBeWorkPriceDocSourceType,
  isWorkItemItemType,
  isWorkItemQualityLevel,
  isWorkItemStatus,
  WORK_ITEM_ITEM_TYPES_ANNEX,
} from "@/lib/be-work-devis-labels";
import { buildWorkItemTradeWhere } from "@/lib/bework-devis-lot-trades";
import { isKnownFamilyCode } from "@/lib/bework-devis-family-codes";
import { buildVariantToCanonicalMap, rollupPriceAggregatesToCanonicals } from "@/lib/be-work-devis-price-roll-up";
import { prisma } from "@/lib/prisma";
import { WORK_ITEM_VISIBLE_IN_LIST } from "@/lib/work-item-merge";
import { workItemCatalogScope } from "@/lib/work-item-catalog";

/** Tri côté application après agrégation des prix (pas de ORDER BY SQL sur les agrégats). */
export const WORK_ITEM_SORT_KEYS = [
  "updated_desc",
  "code_asc",
  "lot_asc",
  "title_asc",
  "status_asc",
  "itemType_asc",
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
  /** Catalogue actif (obligatoire pour isoler les bibliothèques). */
  catalogId: string;
  q?: string;
  /** Filtre par corps de métier (code famille BeWork, ex. ELE, MAC). */
  trade?: string;
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
  /** Type d’ouvrage (enum Prisma) */
  itemType?: string;
  /** « 1 » : uniquement ouvrage_technique (prioritaire sur onlyAnnexes si les deux sont envoyés) */
  onlyTechnical?: string;
  /** « 1 » : uniquement types annexes (hors ouvrage_technique) */
  onlyAnnexes?: string;
};

export type BibliothequeStats = {
  totalRows: number;
  technicalCount: number;
  etudeControleCount: number;
  administratifCount: number;
  garantieCount: number;
  fraisAnnexeCount: number;
  totalPriceEntries: number;
  globalAvgUnitHt: number | null;
  /** Lignes effectivement chargées pour la liste (≤ plafond de fetch). */
  displayedRows?: number;
  /** Vrai si des ouvrages correspondant aux filtres ne sont pas chargés dans la liste. */
  listTruncated?: boolean;
};

function countItemTypeBucket(
  itemType: WorkItem["itemType"] | null,
  n: number,
  acc: Pick<
    BibliothequeStats,
    "technicalCount" | "etudeControleCount" | "administratifCount" | "garantieCount" | "fraisAnnexeCount"
  >,
): void {
  switch (itemType) {
    case "ouvrage_technique":
      acc.technicalCount += n;
      break;
    case "etude_controle":
      acc.etudeControleCount += n;
      break;
    case "prestation_administrative":
      acc.administratifCount += n;
      break;
    case "garantie_assurance":
      acc.garantieCount += n;
      break;
    case "frais_annexe":
      acc.fraisAnnexeCount += n;
      break;
    default:
      acc.technicalCount += n;
  }
}

/** Totaux réels en base (filtres SQL, hors filtre prix moyen post-agrégation). */
export async function fetchBibliothequeStatsFromDb(
  where: Prisma.WorkItemWhereInput,
): Promise<BibliothequeStats> {
  const [byType, priceAgg] = await Promise.all([
    prisma.workItem.groupBy({
      by: ["itemType"],
      where,
      _count: { _all: true },
    }),
    prisma.priceEntry.aggregate({
      where: { workItem: where },
      _count: { _all: true },
      _sum: { unitPriceHT: true },
    }),
  ]);

  const buckets = {
    technicalCount: 0,
    etudeControleCount: 0,
    administratifCount: 0,
    garantieCount: 0,
    fraisAnnexeCount: 0,
  };
  let totalRows = 0;
  for (const row of byType) {
    const n = row._count._all;
    totalRows += n;
    countItemTypeBucket(row.itemType, n, buckets);
  }

  const totalPriceEntries = priceAgg._count._all;
  const sumHt = priceAgg._sum.unitPriceHT;
  const globalAvgUnitHt =
    totalPriceEntries > 0 && sumHt != null ? Number(sumHt) / totalPriceEntries : null;

  return {
    totalRows,
    ...buckets,
    totalPriceEntries,
    globalAvgUnitHt,
  };
}

export function computeBibliothequeStats(items: WorkItemWithPriceStats[]): BibliothequeStats {
  const buckets = {
    technicalCount: 0,
    etudeControleCount: 0,
    administratifCount: 0,
    garantieCount: 0,
    fraisAnnexeCount: 0,
  };
  let totalPriceEntries = 0;
  let weightedSum = 0;
  let weight = 0;

  for (const r of items) {
    totalPriceEntries += r.priceCount;
    countItemTypeBucket(r.itemType, 1, buckets);
    if (r.avgHt != null && r.priceCount > 0) {
      weightedSum += r.avgHt * r.priceCount;
      weight += r.priceCount;
    }
  }

  return {
    totalRows: items.length,
    ...buckets,
    totalPriceEntries,
    globalAvgUnitHt: weight > 0 ? weightedSum / weight : null,
  };
}

function parsePriceFilterInput(raw: string | undefined): number | null {
  if (raw == null) return null;
  const t = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/**
 * Filtre sur le prix moyen HT affiché (post-agrégation).
 * Avec un minimum : exclut les ouvrages sans prix moyen.
 * Avec un maximum seul : inclut aussi les ouvrages sans prix.
 */
export function filterWorkItemsByAvgPriceRange(
  rows: WorkItemWithPriceStats[],
  priceMinStr?: string,
  priceMaxStr?: string,
): WorkItemWithPriceStats[] {
  const min = parsePriceFilterInput(priceMinStr);
  const max = parsePriceFilterInput(priceMaxStr);
  if (min == null && max == null) return rows;

  return rows.filter((r) => {
    const avg = r.avgHt;
    if (min != null) {
      if (avg == null) return false;
      if (avg < min) return false;
    }
    if (max != null) {
      if (avg == null) return true;
      if (avg > max) return false;
    }
    return true;
  });
}

export function buildWorkItemWhere(params: WorkItemFilterParams): Prisma.WorkItemWhereInput {
  const AND: Prisma.WorkItemWhereInput[] = [WORK_ITEM_VISIBLE_IN_LIST, workItemCatalogScope(params.catalogId)];

  const q = params.q?.trim();
  if (q) AND.push(keywordSearchWhereClause(q));

  const trade = params.trade?.trim().toUpperCase();
  if (trade && isKnownFamilyCode(trade)) {
    AND.push(buildWorkItemTradeWhere(trade));
  } else {
    const lot = params.lot?.trim();
    if (lot) AND.push({ lot });
  }

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

  if (params.onlyTechnical?.trim() === "1") {
    AND.push({ itemType: "ouvrage_technique" });
  } else if (params.onlyAnnexes?.trim() === "1") {
    AND.push({ itemType: { in: [...WORK_ITEM_ITEM_TYPES_ANNEX] } });
  } else {
    const it = params.itemType?.trim();
    if (it && isWorkItemItemType(it)) AND.push({ itemType: it });
  }

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
      case "itemType_asc":
        return cmp(r1.itemType, r2.itemType) || cmp(r1.code, r2.code);
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

/** Plafond de chargement pour la liste (perf mémoire). Surcharge via BEWORK_BIBLIOTHEQUE_MAX_ROWS. */
export const BIBLIOTHEQUE_LIST_FETCH_LIMIT = (() => {
  const raw = process.env.BEWORK_BIBLIOTHEQUE_MAX_ROWS?.trim();
  if (raw) {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return Math.min(Math.floor(n), 50_000);
  }
  return 10_000;
})();

export async function fetchWorkItemsWithPriceStats(
  where: Prisma.WorkItemWhereInput,
  sort: WorkItemSortKey,
  maxRows = BIBLIOTHEQUE_LIST_FETCH_LIMIT,
): Promise<WorkItemWithPriceStats[]> {
  const items = await prisma.workItem.findMany({
    where,
    take: maxRows,
  });
  const ids = items.map((i) => i.id);
  if (ids.length === 0) return [];

  const canonicalIds = items.filter((i) => i.mergeStatus === "canonical").map((i) => i.id);
  const variantToCanonical = await buildVariantToCanonicalMap(prisma, canonicalIds);
  const variantIds = [...variantToCanonical.keys()];
  const allPriceItemIds = [...new Set([...ids, ...variantIds])];

  const aggregates = await prisma.priceEntry.groupBy({
    by: ["workItemId"],
    where: { workItemId: { in: allPriceItemIds } },
    _avg: { unitPriceHT: true },
    _count: { _all: true },
  });

  const aggMap = rollupPriceAggregatesToCanonicals(aggregates, variantToCanonical);

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
