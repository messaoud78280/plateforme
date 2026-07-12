import type { SupabaseClient } from "@supabase/supabase-js";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { DOCUMENTS_BUCKET, extractStoragePathFromUrl } from "@/lib/storage/supabase-object";

export type ResolveDownloadUrlResult = {
  url: string;
  signed: boolean;
  fallback: boolean;
};

/**
 * Résout une URL de téléchargement.
 * - Flag on : URL signée (TTL) si le path est extractible.
 * - Échec ou flag off : URL stockée (compatibilité bucket encore public / anciennes lignes).
 */
export async function resolveDownloadUrl(
  supabase: SupabaseClient,
  storedUrl: string,
  options?: { bucket?: string; expiresIn?: number }
): Promise<ResolveDownloadUrlResult> {
  const bucket = options?.bucket ?? DOCUMENTS_BUCKET;
  const expiresIn = options?.expiresIn ?? 60 * 60;

  if (!storedUrl) {
    return { url: storedUrl, signed: false, fallback: true };
  }

  if (!isFeatureEnabled("secureStorageSignedUrls")) {
    return { url: storedUrl, signed: false, fallback: true };
  }

  const path = extractStoragePathFromUrl(storedUrl, bucket);
  if (!path) {
    return { url: storedUrl, signed: false, fallback: true };
  }

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) {
    console.error("resolveDownloadUrl:", error?.message ?? "signedUrl manquante", { bucket, path });
    return { url: storedUrl, signed: false, fallback: true };
  }

  return { url: data.signedUrl, signed: true, fallback: false };
}
