/**
 * Phase B1 — Version de contenu SiteDocument partagée.
 *
 * Réutilise l’empreinte REPORT/NOTICE (SHA-256 → uint48) pour :
 * - pipeline universel (REPORT / NOTICE) ;
 * - garde stale de l’import document structuré (CR / NOTICE / PPSPS).
 *
 * Ne pas utiliser SiteDocument.versionNumber (ne suit pas le contenu).
 */
import {
  computeReportContextVersion,
  type ReportContextVersionInput,
} from "@/lib/bework-context/report-context-version";

export type SiteDocumentContentVersionInput = ReportContextVersionInput;

export function siteDocumentToContentVersionInput(row: {
  id: string;
  kind: string;
  title: string;
  status: string;
  quickNotes: string | null;
  payloadJson: unknown;
}): SiteDocumentContentVersionInput {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    status: row.status,
    quickNotes: row.quickNotes,
    payload: row.payloadJson,
  };
}

export function computeSiteDocumentContentVersion(
  input: SiteDocumentContentVersionInput,
): number {
  return computeReportContextVersion(input);
}

export function computeSiteDocumentContentVersionFromRow(row: {
  id: string;
  kind: string;
  title: string;
  status: string;
  quickNotes: string | null;
  payloadJson: unknown;
}): number {
  return computeSiteDocumentContentVersion(
    siteDocumentToContentVersionInput(row),
  );
}
