/**
 * FICHES-SUIVI-V2B — helpers KPI / urgence (source unique effectiveUrgency).
 */

export function isFollowUpUrgentLevel(level: string | null | undefined): boolean {
  return level === "URGENT" || level === "CRITIQUE";
}

export function sheetEffectiveUrgency(sheet: {
  urgency?: string | null;
  attention?: { effectiveUrgency?: string | null } | null;
}): string {
  return sheet.attention?.effectiveUrgency ?? sheet.urgency ?? "NORMAL";
}
