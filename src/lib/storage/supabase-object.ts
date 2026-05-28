import type { SupabaseClient } from "@supabase/supabase-js";

export const DOCUMENTS_BUCKET = "documents";

/** Extrait le chemin objet Supabase depuis une URL public/sign. */
export function extractStoragePathFromUrl(url: string, bucket: string): string | null {
  try {
    const s = new URL(url).toString();
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
