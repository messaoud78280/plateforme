import { createServiceRoleClient } from "@/lib/supabase";

const BUCKET = "documents";

export async function uploadCctpSkillFile(opts: {
  userId: string;
  sessionId: string;
  fileName: string;
  buffer: Buffer;
  mimeType: string;
}): Promise<{ storagePath: string; storageUrl: string } | null> {
  const supabase = createServiceRoleClient();
  if (!supabase) return null;

  const safeName = opts.fileName.replace(/[^a-zA-Z0-9._-àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ ]/g, "_");
  const storagePath = `skill-cctp/${opts.userId}/${opts.sessionId}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, opts.buffer, {
    contentType: opts.mimeType || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    console.error("[skill-cctp/storage]", error.message);
    return null;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return { storagePath, storageUrl: data.publicUrl };
}
