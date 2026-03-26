import type { PeriodKey } from "@/lib/reportStats";

/** Clés autorisées pour les rapports (stats + export) — unique source de vérité côté API */
export const REPORT_PERIOD_KEYS = ["7d", "30d", "3m", "6m", "1y"] as const satisfies readonly PeriodKey[];

const PERIOD_SET = new Set<string>(REPORT_PERIOD_KEYS);

/**
 * Valide le paramètre `period` des query strings.
 * `null` ou chaîne vide → défaut **30d** (comportement historique).
 */
export function parseReportPeriodParam(raw: string | null): PeriodKey | null {
  const v = raw === null || raw === "" ? "30d" : raw.trim();
  return PERIOD_SET.has(v) ? (v as PeriodKey) : null;
}

export type ReportExportFormat = "csv" | "pdf";

export function parseReportExportFormatParam(raw: string | null): ReportExportFormat | null {
  if (raw === null || raw === "") return "pdf";
  const v = raw.trim().toLowerCase();
  if (v === "csv" || v === "pdf") return v;
  return null;
}
