import type { Prisma } from "@prisma/client";
import {
  BEWORK_DEVIS_FAMILY_LEXICON,
  getBeWorkFamilyLabel,
  isKnownFamilyCode,
  suggestFamilyCodeFromLot,
} from "@/lib/bework-devis-family-codes";

const FAMILY_ORDER = new Map(BEWORK_DEVIS_FAMILY_LEXICON.map((f) => [f.code.toUpperCase(), f.order ?? 0]));

export type LotsGroupedByTrade = {
  tradeCode: string;
  tradeLabel: string;
  order: number;
  lots: string[];
};

/** Code corps de métier (famille BeWork) pour un libellé de lot. */
export function resolveLotTradeCode(lot: string, familyField?: string | null): string {
  return suggestFamilyCodeFromLot(lot, familyField) ?? "GAR";
}

export function resolveLotTradeLabel(lot: string, familyField?: string | null): string {
  const code = resolveLotTradeCode(lot, familyField);
  return getBeWorkFamilyLabel(code) ?? "Autres";
}

/** Regroupe une liste de lots distincts par corps de métier, triés. */
export function groupDistinctLotsByTrade(lots: string[]): LotsGroupedByTrade[] {
  const map = new Map<string, string[]>();
  for (const lot of lots) {
    const code = resolveLotTradeCode(lot);
    const list = map.get(code) ?? [];
    list.push(lot);
    map.set(code, list);
  }

  return [...map.entries()]
    .map(([tradeCode, tradeLots]) => ({
      tradeCode,
      tradeLabel: getBeWorkFamilyLabel(tradeCode) ?? tradeCode,
      order: FAMILY_ORDER.get(tradeCode) ?? 999,
      lots: [...new Set(tradeLots)].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" })),
    }))
    .sort((a, b) => a.order - b.order || a.tradeLabel.localeCompare(b.tradeLabel, "fr"));
}

/** Valeur du select filtre : `trade:ELE` ou `lot:Libellé exact`. */
export function encodeLotFilterValue(opts: { trade?: string; lot?: string }): string {
  if (opts.trade?.trim()) return `trade:${opts.trade.trim().toUpperCase()}`;
  if (opts.lot?.trim()) return `lot:${opts.lot.trim()}`;
  return "";
}

export function parseLotFilterValue(raw?: string | null): { trade?: string; lot?: string } {
  const v = raw?.trim();
  if (!v) return {};
  if (v.startsWith("trade:")) {
    const code = v.slice(6).trim().toUpperCase();
    return isKnownFamilyCode(code) ? { trade: code } : {};
  }
  if (v.startsWith("lot:")) {
    const lot = v.slice(4).trim();
    return lot ? { lot } : {};
  }
  return { lot: v };
}

/** Parse les paramètres URL (lotFilter, trade, lot legacy). */
export function parseLotTradeSearchParams(sp: {
  lotFilter?: string;
  trade?: string;
  lot?: string;
}): { trade?: string; lot?: string } {
  if (sp.trade?.trim()) {
    const code = sp.trade.trim().toUpperCase();
    if (isKnownFamilyCode(code)) return { trade: code };
  }
  const fromFilter = parseLotFilterValue(sp.lotFilter);
  if (fromFilter.trade || fromFilter.lot) return fromFilter;
  if (sp.lot?.trim()) return { lot: sp.lot.trim() };
  return {};
}

/** Filtre Prisma : tous les ouvrages d'un corps de métier (familyCode + termes du lexique). */
export function buildWorkItemTradeWhere(tradeCode: string): Prisma.WorkItemWhereInput {
  const code = tradeCode.trim().toUpperCase();
  const fam = BEWORK_DEVIS_FAMILY_LEXICON.find((f) => f.code.toUpperCase() === code);
  if (!fam) return { familyCode: code };

  const OR: Prisma.WorkItemWhereInput[] = [{ familyCode: code }];
  for (const term of fam.matchTerms) {
    const t = term.trim();
    if (!t) continue;
    OR.push({ lot: { contains: t, mode: "insensitive" } });
    OR.push({ family: { contains: t, mode: "insensitive" } });
  }
  return { OR };
}
