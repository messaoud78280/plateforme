import type { DpgfAnalysisListRow } from "./types";
import { formatLotDpgfDisplay } from "./intervenant-concerne";
import {
  compareDpgfNumbers,
  findMissingDpgfNumbers,
  formatDpgfRange,
} from "./dpgf-number";

export type DpgfAnalysisListGroup = {
  lot: string;
  lotLabel: string;
  familyName: string;
  familyCode: string | null;
  rows: DpgfAnalysisListRow[];
  toVerifyCount: number;
  dpgfRange: string | null;
  missingDpgfNumbers: string[];
  hasGaps: boolean;
};

export type DpgfAnalysisViewMode = "families" | "dpgf" | "table";

/** Extrait le segment famille du code (ex. ADPGF-04-FSV-001 → FSV). */
export function extractDpgfFamilyCodeFromSheet(codeSheet: string): string | null {
  const parts = codeSheet.trim().split("-");
  if (parts.length < 4) return null;
  return parts[2]?.trim().toUpperCase() || null;
}

function compareLot(a: string, b: string): number {
  return a.localeCompare(b, "fr", { numeric: true, sensitivity: "base" });
}

function compareCodeSheet(a: string, b: string): number {
  return a.localeCompare(b, "fr", { numeric: true, sensitivity: "base" });
}

/** Tri par N° DPGF (101, 102, 400-A…), puis code fiche. */
export function sortDpgfAnalysisListRowsByDpgfNumber(rows: DpgfAnalysisListRow[]): DpgfAnalysisListRow[] {
  return [...rows].sort((a, b) => {
    const dpgfCmp = compareDpgfNumbers(a.numeroDpgf, b.numeroDpgf);
    if (dpgfCmp !== 0) return dpgfCmp;
    const lotCmp = compareLot(a.lot, b.lot);
    if (lotCmp !== 0) return lotCmp;
    return compareCodeSheet(a.codeSheet, b.codeSheet);
  });
}

/** Tri stable : lot → famille → code fiche. */
export function sortDpgfAnalysisListRows(rows: DpgfAnalysisListRow[]): DpgfAnalysisListRow[] {
  return [...rows].sort((a, b) => {
    const lotCmp = compareLot(a.lot, b.lot);
    if (lotCmp !== 0) return lotCmp;

    const famA = a.familyName?.trim() || "";
    const famB = b.familyName?.trim() || "";
    const famCmp = famA.localeCompare(famB, "fr", { sensitivity: "base" });
    if (famCmp !== 0) return famCmp;

    const codeFamCmp = (extractDpgfFamilyCodeFromSheet(a.codeSheet) ?? "").localeCompare(
      extractDpgfFamilyCodeFromSheet(b.codeSheet) ?? "",
      "fr",
      { sensitivity: "base" },
    );
    if (codeFamCmp !== 0) return codeFamCmp;

    const dpgfCmp = compareDpgfNumbers(a.numeroDpgf, b.numeroDpgf);
    if (dpgfCmp !== 0) return dpgfCmp;

    return compareCodeSheet(a.codeSheet, b.codeSheet);
  });
}

function enrichGroupMeta(rows: DpgfAnalysisListRow[]): Pick<
  DpgfAnalysisListGroup,
  "toVerifyCount" | "dpgfRange" | "missingDpgfNumbers" | "hasGaps"
> {
  const numbers = rows.map((r) => r.numeroDpgf);
  const missingDpgfNumbers = findMissingDpgfNumbers(numbers);
  return {
    toVerifyCount: rows.filter((r) => r.status === "a_verifier").length,
    dpgfRange: formatDpgfRange(numbers),
    missingDpgfNumbers,
    hasGaps: missingDpgfNumbers.length > 0,
  };
}

/** Regroupe les fiches par lot puis par famille d'ouvrage. */
export function groupDpgfAnalysisListRows(
  rows: DpgfAnalysisListRow[],
  lotLabels: Record<string, string> = {},
): DpgfAnalysisListGroup[] {
  const sorted = sortDpgfAnalysisListRows(rows);
  const groups: DpgfAnalysisListGroup[] = [];

  for (const row of sorted) {
    const familyName = row.familyName?.trim() || "Sans famille renseignée";
    const prev = groups[groups.length - 1];
    if (prev && prev.lot === row.lot && prev.familyName === familyName) {
      prev.rows.push(row);
      continue;
    }
    groups.push({
      lot: row.lot,
      lotLabel: lotLabels[row.lot] ?? formatLotDpgfDisplay(row.lot, null),
      familyName,
      familyCode: extractDpgfFamilyCodeFromSheet(row.codeSheet),
      rows: [row],
      toVerifyCount: 0,
      dpgfRange: null,
      missingDpgfNumbers: [],
      hasGaps: false,
    });
  }

  for (const group of groups) {
    group.rows.sort((a, b) => compareDpgfNumbers(a.numeroDpgf, b.numeroDpgf) || compareCodeSheet(a.codeSheet, b.codeSheet));
    Object.assign(group, enrichGroupMeta(group.rows));
  }

  return groups;
}

export function parseDpgfAnalysisViewMode(raw: string | undefined): DpgfAnalysisViewMode {
  if (raw === "dpgf" || raw === "table") return raw;
  return "families";
}
