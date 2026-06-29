import type { Prisma } from "@prisma/client";
import { isWorkItemStatus } from "@/lib/be-work-devis-labels";
import { formatLotDpgfDisplay } from "./intervenant-concerne";
import { isDpgfAnalysisLevel, isDpgfAnalysisSource } from "./labels";
import type { DpgfAnalysisFilterParams, DpgfAnalysisStats, DpgfAnalysisSheetLinks } from "./types";

export const DPGF_ANALYSIS_LIST_LIMIT = 200;

export type DpgfLotOption = {
  lot: string;
  label: string;
};

export function buildDpgfAnalysisWhere(params: DpgfAnalysisFilterParams): Prisma.DpgfAnalysisSheetWhereInput {
  const and: Prisma.DpgfAnalysisSheetWhereInput[] = [];

  const q = params.q?.trim();
  if (q) {
    and.push({
      OR: [
        { codeSheet: { contains: q, mode: "insensitive" } },
        { originalDesignation: { contains: q, mode: "insensitive" } },
        { simplifiedDesignation: { contains: q, mode: "insensitive" } },
        { lot: { contains: q, mode: "insensitive" } },
        { familyName: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (params.lot?.trim()) and.push({ lot: params.lot.trim() });
  if (params.trade?.trim()) and.push({ tradeCode: params.trade.trim().toUpperCase() });
  if (params.family?.trim()) and.push({ familyName: { contains: params.family.trim(), mode: "insensitive" } });
  if (params.ouvrageType?.trim()) and.push({ ouvrageType: { contains: params.ouvrageType.trim(), mode: "insensitive" } });
  if (params.unit?.trim()) and.push({ unit: params.unit.trim() });

  if (params.level && isDpgfAnalysisLevel(params.level)) and.push({ comprehensionLevel: params.level });
  if (params.status && isWorkItemStatus(params.status)) and.push({ status: params.status });
  if (params.source && isDpgfAnalysisSource(params.source)) and.push({ source: params.source });

  if (params.hasModeOperatoire) and.push({ hasModeOperatoire: true });
  if (params.hasVigilance) and.push({ hasVigilancePoints: true });
  if (params.hasQuestions) and.push({ hasQuestions: true });

  return and.length > 0 ? { AND: and } : {};
}

export function parseDpgfAnalysisFilters(sp: Record<string, string | undefined>): DpgfAnalysisFilterParams {
  return {
    q: sp.q,
    lot: sp.lot,
    trade: sp.trade,
    family: sp.family,
    ouvrageType: sp.ouvrageType,
    unit: sp.unit,
    level: sp.level && isDpgfAnalysisLevel(sp.level) ? sp.level : undefined,
    status: sp.status && isWorkItemStatus(sp.status) ? sp.status : undefined,
    source: sp.source && isDpgfAnalysisSource(sp.source) ? sp.source : undefined,
    hasModeOperatoire: sp.hasMode === "1",
    hasVigilance: sp.hasVigilance === "1",
    hasQuestions: sp.hasQuestions === "1",
  };
}

export async function fetchDpgfAnalysisStats(where: Prisma.DpgfAnalysisSheetWhereInput): Promise<DpgfAnalysisStats> {
  const { prisma } = await import("@/lib/prisma");
  const [totalSheets, lotsRow, toVerify, validated, levelDebutant, levelIntermediaire, levelConfirme] =
    await Promise.all([
      prisma.dpgfAnalysisSheet.count({ where }),
      prisma.dpgfAnalysisSheet.findMany({ where, select: { lot: true }, distinct: ["lot"] }),
      prisma.dpgfAnalysisSheet.count({ where: { ...where, status: "a_verifier" } }),
      prisma.dpgfAnalysisSheet.count({ where: { ...where, status: "valide" } }),
      prisma.dpgfAnalysisSheet.count({ where: { ...where, comprehensionLevel: "debutant" } }),
      prisma.dpgfAnalysisSheet.count({ where: { ...where, comprehensionLevel: "intermediaire" } }),
      prisma.dpgfAnalysisSheet.count({ where: { ...where, comprehensionLevel: "confirme" } }),
    ]);

  return {
    totalSheets,
    lotsCovered: lotsRow.length,
    toVerify,
    validated,
    levelDebutant,
    levelIntermediaire,
    levelConfirme,
  };
}

/** Libellés lot DPGF (ex. « Lot 01 - Fondations - Gros Œuvre ») depuis links.lotNote. */
export async function fetchDpgfLotOptions(where: Prisma.DpgfAnalysisSheetWhereInput): Promise<DpgfLotOption[]> {
  const { prisma } = await import("@/lib/prisma");

  const sheets = await prisma.dpgfAnalysisSheet.findMany({
    where,
    select: { lot: true, links: true },
    orderBy: [{ lot: "asc" }, { updatedAt: "desc" }],
  });

  const byLot = new Map<string, string>();
  for (const sheet of sheets) {
    if (byLot.has(sheet.lot)) continue;
    const links = (sheet.links ?? {}) as DpgfAnalysisSheetLinks;
    byLot.set(sheet.lot, formatLotDpgfDisplay(sheet.lot, links.lotNote));
  }

  return [...byLot.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "fr", { numeric: true, sensitivity: "base" }))
    .map(([lot, label]) => ({ lot, label }));
}
