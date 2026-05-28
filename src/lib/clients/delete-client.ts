import type { SupabaseClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { deleteChantierProjectStorage } from "@/lib/chantier-dossier/delete-project-storage";
import { DOCUMENTS_BUCKET, extractStoragePathFromUrl } from "@/lib/storage/supabase-object";

/** Supprime les fichiers Storage liés aux chantiers et documents du client. */
export async function deleteClientStorageFiles(
  supabase: SupabaseClient,
  clientId: string
): Promise<void> {
  const projects = await prisma.project.findMany({
    where: { clientId },
    select: { id: true },
  });
  for (const p of projects) {
    await deleteChantierProjectStorage(supabase, p.id);
  }

  const documents = await prisma.document.findMany({
    where: { clientId },
    select: { fileUrl: true },
  });
  const paths = documents
    .map((d) => extractStoragePathFromUrl(d.fileUrl, DOCUMENTS_BUCKET))
    .filter((p): p is string => Boolean(p));

  if (paths.length === 0) return;

  const chunkSize = 50;
  for (let i = 0; i < paths.length; i += chunkSize) {
    const chunk = paths.slice(i, i + chunkSize);
    const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).remove(chunk);
    if (error) {
      console.error("Suppression Storage documents client:", error.message);
    }
  }
}
