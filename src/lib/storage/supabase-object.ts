import type { SupabaseClient } from "@supabase/supabase-js";

export const DOCUMENTS_BUCKET = "documents";

/** Référence opaque GED (nouveaux uploads) — pas une URL publique. */
export function buildDocumentsStorageRef(path: string): string {
  return `storage://${DOCUMENTS_BUCKET}/${path.replace(/^\/+/, "")}`;
}

/**
 * Extrait le chemin objet Supabase depuis :
 * - storage://bucket/path (nouveau)
 * - URL public/sign historique
 */
export function extractStoragePathFromUrl(url: string, bucket: string): string | null {
  const raw = String(url || "").trim();
  if (!raw) return null;

  if (raw.startsWith("storage://")) {
    const rest = raw.slice("storage://".length);
    const slash = rest.indexOf("/");
    if (slash <= 0) return null;
    const b = rest.slice(0, slash);
    const path = decodeURIComponent(rest.slice(slash + 1));
    if (b !== bucket || !path) return null;
    return path;
  }

  // Path nu historique (chantiers/…, commercial/…) dans le bucket documents
  if (
    bucket === DOCUMENTS_BUCKET &&
    !raw.includes("://") &&
    !raw.startsWith("/") &&
    (raw.startsWith("chantiers/") ||
      raw.startsWith("purchase-orders/") ||
      raw.startsWith("commercial/") ||
      raw.startsWith("reports/") ||
      raw.startsWith("appointments/") ||
      raw.startsWith("projects/") ||
      raw.startsWith("orgs/") ||
      raw.startsWith("skill-") ||
      raw.startsWith("dico-") ||
      raw.startsWith("dm/"))
  ) {
    return raw.replace(/^\/+/, "");
  }

  try {
    const s = new URL(raw).toString();
    const idx = s.indexOf("/storage/v1/object/");
    if (idx === -1) return null;
    const tail = s.slice(idx);
    const m = tail.match(new RegExp(`/storage/v1/object/(public|sign)/${bucket}/(.+)$`));
    if (!m?.[2]) return null;
    return decodeURIComponent(m[2].split("?")[0] ?? "");
  } catch {
    return null;
  }
}

export async function downloadStorageObject(
  supabase: SupabaseClient,
  bucket: string,
  path: string
): Promise<{ blob: Blob; contentType: string } | null> {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) return null;
  const contentType = (data as Blob).type || "application/octet-stream";
  return { blob: data, contentType };
}
