import type { Prisma } from "@prisma/client";
import { isBtpDicoCategory, isBtpDicoLevel, isBtpDicoStatus } from "./labels";
import { normalizeLotCode } from "./lots";
import type { BtpDicoFilterParams, BtpDicoStats } from "./types";

export const BTP_DICO_LIST_LIMIT = 500;

export function buildBtpDicoWhere(params: BtpDicoFilterParams): Prisma.BtpDictionaryTermWhereInput {
  const and: Prisma.BtpDictionaryTermWhereInput[] = [];

  const q = params.q?.trim();
  if (q) {
    and.push({
      OR: [
        { term: { contains: q, mode: "insensitive" } },
        { acronym: { contains: q, mode: "insensitive" } },
        { shortDefinition: { contains: q, mode: "insensitive" } },
        { beginnerExplanation: { contains: q, mode: "insensitive" } },
        { usageExample: { contains: q, mode: "insensitive" } },
        { family: { contains: q, mode: "insensitive" } },
        { lotName: { contains: q, mode: "insensitive" } },
        { keywords: { has: q } },
        { synonyms: { has: q } },
      ],
    });
  }

  if (params.lot?.trim()) {
    const code = normalizeLotCode(params.lot) ?? params.lot.trim();
    and.push({ lotCode: code });
  }
  if (params.family?.trim()) and.push({ family: { contains: params.family.trim(), mode: "insensitive" } });
  if (params.category && isBtpDicoCategory(params.category)) and.push({ category: params.category });
  if (params.level && isBtpDicoLevel(params.level)) and.push({ level: params.level });
  if (params.status && isBtpDicoStatus(params.status)) and.push({ status: params.status });

  if (params.onlyAcronyms) and.push({ AND: [{ acronym: { not: null } }, { acronym: { not: "" } }] });

  if (params.letter?.trim()) {
    const letter = params.letter.trim();
    if (/^[a-zA-Z]$/.test(letter)) {
      and.push({ term: { startsWith: letter, mode: "insensitive" } });
    }
  }

  return and.length > 0 ? { AND: and } : {};
}

export function parseBtpDicoFilters(sp: Record<string, string | undefined>): BtpDicoFilterParams {
  return {
    q: sp.q,
    lot: sp.lot,
    family: sp.family,
    category: sp.category && isBtpDicoCategory(sp.category) ? sp.category : undefined,
    level: sp.level && isBtpDicoLevel(sp.level) ? sp.level : undefined,
    status: sp.status && isBtpDicoStatus(sp.status) ? sp.status : undefined,
    letter: sp.letter,
    onlyAcronyms: sp.acronyms === "1",
  };
}

export async function fetchBtpDicoStats(where: Prisma.BtpDictionaryTermWhereInput): Promise<BtpDicoStats> {
  const { prisma } = await import("@/lib/prisma");
  const [totalTerms, lotsRow, acronyms, toVerify] = await Promise.all([
    prisma.btpDictionaryTerm.count({ where }),
    prisma.btpDictionaryTerm.findMany({ where, select: { lotCode: true }, distinct: ["lotCode"] }),
    prisma.btpDictionaryTerm.count({
      where: { AND: [where, { acronym: { not: null } }, { acronym: { not: "" } }] },
    }),
    prisma.btpDictionaryTerm.count({ where: { AND: [where, { status: "à vérifier" }] } }),
  ]);

  return {
    totalTerms,
    lotsCovered: lotsRow.filter((r) => r.lotCode).length,
    acronyms,
    toVerify,
  };
}
