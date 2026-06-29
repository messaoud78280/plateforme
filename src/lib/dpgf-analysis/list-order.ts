import type { DpgfAnalysisListRow } from "./types";
import { formatLotDpgfDisplay } from "./intervenant-concerne";

export type DpgfAnalysisListGroup = {
  lot: string;
  lotLabel: string;
  familyName: string;
  familyCode: string | null;
  rows: DpgfAnalysisListRow[];
};

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

    return compareCodeSheet(a.codeSheet, b.codeSheet);
  });
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
    });
  }

  return groups;
}
