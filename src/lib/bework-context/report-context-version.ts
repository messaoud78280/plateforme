/**
 * CTX-02D — Version REPORT déterministe (sans migration).
 *
 * SiteDocument.versionNumber ne bump pas sur édition → non fiable pour stale.
 * Empreinte sur l’état réellement exposé à ChatGPT (title, status, quick_notes, payload).
 */
import { createHash } from "node:crypto";
import { digestToBaseVersion } from "@/lib/bework-context/visit-context-version";

export type ReportContextVersionInput = {
  id: string;
  kind: string;
  title: string;
  status: string;
  quickNotes: string | null;
  /** payloadJson tel qu’exposé (objet JSON ou null). */
  payload: unknown;
};

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      out[key] = sortKeysDeep(obj[key]);
    }
    return out;
  }
  return value;
}

export function canonicalizeReportContextPayload(
  input: ReportContextVersionInput,
): string {
  const payload = {
    document_id: input.id,
    kind: input.kind,
    title: input.title,
    status: input.status,
    quick_notes: input.quickNotes ?? null,
    payload: input.payload ?? null,
  };
  return JSON.stringify(sortKeysDeep(payload));
}

export function computeReportContextVersion(
  input: ReportContextVersionInput,
): number {
  const canonical = canonicalizeReportContextPayload(input);
  const digest = createHash("sha256").update(canonical, "utf8").digest();
  return digestToBaseVersion(digest);
}
