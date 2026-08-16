/**
 * GED-FIX-1 — Distinguer fichier réellement ouvrable vs placeholder / attendu.
 */
import {
  DOCUMENTS_BUCKET,
  extractStoragePathFromUrl,
} from "@/lib/storage/supabase-object";
import { classifyDocumentsRef } from "@/lib/storage/documents-ref-migrate";

/** Placeholders démo sans objet Storage — jamais « Ouvrir ». */
export function isDemoPlaceholderFileUrl(url: string | null | undefined): boolean {
  const u = String(url ?? "").trim().toLowerCase();
  if (!u) return false;
  return (
    u.startsWith("/demo-assets/") ||
    u.includes("/placeholder-document") ||
    u.startsWith("demo-assets/")
  );
}

/**
 * Routes app authentifiées qui servent un PDF réel (pas Storage).
 * Ex. /api/commercial/quotes/{id}/pdf
 */
export function isAppServedFileUrl(url: string | null | undefined): boolean {
  const u = String(url ?? "").trim();
  if (!u.startsWith("/api/")) return false;
  return (
    /^\/api\/commercial\/(quotes|invoices|progress-statements|amendments)\/[^/]+\/(pdf|accepted-pdf)\b/i.test(
      u,
    ) || /^\/api\/commercial\/amendments\/[^/]+\/pdf\b/i.test(u)
  );
}

/** Chemin objet documents résolu (storage://, URL publique, path nu). */
export function resolveDocumentsObjectPath(
  url: string | null | undefined,
): string | null {
  const raw = String(url ?? "").trim();
  if (!raw) return null;
  if (isDemoPlaceholderFileUrl(raw)) return null;
  if (raw.startsWith("/api/") || raw.startsWith("ged://")) return null;

  const fromExtract = extractStoragePathFromUrl(raw, DOCUMENTS_BUCKET);
  if (fromExtract) return fromExtract;

  const classified = classifyDocumentsRef(raw);
  if (
    (classified.class === "A_STORAGE_REF" ||
      classified.class === "B_PUBLIC_CONVERTIBLE" ||
      classified.class === "E_RAW_PATH") &&
    classified.path
  ) {
    return classified.path;
  }
  return null;
}

export function canOpenGedFileUrl(url: string | null | undefined): boolean {
  const raw = String(url ?? "").trim();
  if (!raw) return false;
  if (isDemoPlaceholderFileUrl(raw)) return false;
  if (isAppServedFileUrl(raw)) return true;
  return Boolean(resolveDocumentsObjectPath(raw));
}
