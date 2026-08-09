import type { SupabaseClient } from "@supabase/supabase-js";
import { DOCUMENTS_BUCKET, extractStoragePathFromUrl } from "@/lib/storage/supabase-object";

export type ResolveDownloadUrlResult = {
  url: string;
  signed: boolean;
  fallback: boolean;
};

/**
 * Résout une URL de téléchargement via signed URL uniquement.
 * GED-V2A.2 : aucun fallback getPublicUrl / URL publique.
 */
export async function resolveDownloadUrl(
  supabase: SupabaseClient,
  storedUrl: string,
  options?: { bucket?: string; expiresIn?: number }
): Promise<ResolveDownloadUrlResult> {
  const bucket = options?.bucket ?? DOCUMENTS_BUCKET;
  const expiresIn = Math.min(20 * 60, Math.max(60, options?.expiresIn ?? 15 * 60));

  if (!storedUrl) {
    return { url: "", signed: false, fallback: false };
  }

  const path = extractStoragePathFromUrl(storedUrl, bucket);
  if (!path) {
    return { url: "", signed: false, fallback: false };
  }

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) {
    console.error("resolveDownloadUrl:", error?.message ?? "signedUrl manquante", { bucket, path });
    return { url: "", signed: false, fallback: false };
  }

  return { url: data.signedUrl, signed: true, fallback: false };
}
