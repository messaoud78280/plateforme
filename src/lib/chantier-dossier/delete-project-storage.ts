import type { SupabaseClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { chantierPreviewPdfPath } from "@/lib/storage/chantier-pdf-preview";
import { DOCUMENTS_BUCKET, extractStoragePathFromUrl } from "@/lib/storage/supabase-object";

/** Supprime les fichiers Storage liés au classeur (originaux + PDF d’aperçu). */
export async function deleteChantierProjectStorage(
  supabase: SupabaseClient,
  projectId: string
): Promise<void> {
  const files = await prisma.chantierFile.findMany({
    where: { projectId },
    select: { id: true, fileUrl: true },
  });

  const paths = new Set<string>();
  for (const f of files) {
    paths.add(chantierPreviewPdfPath(projectId, f.id));
    if (f.fileUrl) {
      const p = extractStoragePathFromUrl(f.fileUrl, DOCUMENTS_BUCKET);
      if (p) paths.add(p);
    }
  }

  if (paths.size === 0) return;

  const list = [...paths];
  const chunkSize = 50;
  for (let i = 0; i < list.length; i += chunkSize) {
    const chunk = list.slice(i, i + chunkSize);
    const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).remove(chunk);
    if (error) {
      console.error("Suppression Storage chantier (lot):", error.message);
    }
  }
}
