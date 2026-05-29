/**
 * Statistiques prix observés pour choix canonique et revue doublons.
 */

export type WorkItemPriceStats = {
  workItemId: string;
  priceCount: number;
  minHt: number | null;
  maxHt: number | null;
  avgHt: number | null;
  referenceHt: number | null;
};

export type PriceEntryLite = {
  workItemId: string;
  unitPriceHT: { toString(): string } | number;
};

export function computePriceStatsFromEntries(
  workItemId: string,
  entries: PriceEntryLite[],
): WorkItemPriceStats {
  if (entries.length === 0) {
    return {
      workItemId,
      priceCount: 0,
      minHt: null,
      maxHt: null,
      avgHt: null,
      referenceHt: null,
    };
  }

  const values = entries.map((e) => Number(e.unitPriceHT)).filter((v) => Number.isFinite(v) && v >= 0);
  if (values.length === 0) {
    return {
      workItemId,
      priceCount: 0,
      minHt: null,
      maxHt: null,
      avgHt: null,
      referenceHt: null,
    };
  }

  const minHt = Math.min(...values);
  const maxHt = Math.max(...values);
  const avgHt = values.reduce((a, b) => a + b, 0) / values.length;

  return {
    workItemId,
    priceCount: values.length,
    minHt,
    maxHt,
    avgHt,
    /** Stratégie BeWork : prix le plus élevé comme référence pour éviter sous-chiffrage. */
    referenceHt: maxHt,
  };
}

export function buildPriceStatsMap(
  entries: PriceEntryLite[],
): Map<string, WorkItemPriceStats> {
  const byItem = new Map<string, PriceEntryLite[]>();
  for (const e of entries) {
    const list = byItem.get(e.workItemId) ?? [];
    list.push(e);
    byItem.set(e.workItemId, list);
  }

  const map = new Map<string, WorkItemPriceStats>();
  for (const [id, rows] of byItem) {
    map.set(id, computePriceStatsFromEntries(id, rows));
  }
  return map;
}
