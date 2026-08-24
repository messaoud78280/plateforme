import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase";
import { DOCUMENTS_BUCKET } from "@/lib/storage/supabase-object";

export function importSourceStoragePath(opts: {
  organizationId: string;
  sha256: string;
  fileName: string;
}): string {
  const safe = opts.fileName.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80);
  return `commercial/${opts.organizationId}/imports/${opts.sha256.slice(0, 16)}-${safe}`;
}

export async function storeImportSourceFile(opts: {
  organizationId: string;
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  sha256: string;
}): Promise<{ storageKey: string } | { error: string }> {
  const path = importSourceStoragePath({
    organizationId: opts.organizationId,
    sha256: opts.sha256,
    fileName: opts.fileName,
  });
  try {
    const supabase = createServiceRoleClient();
    if (!supabase) return { error: "Stockage indisponible" };
    const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, opts.buffer, {
      contentType: opts.mimeType || "application/octet-stream",
      upsert: true,
    });
    if (error) return { error: error.message };
    return { storageKey: path };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "upload_failed" };
  }
}

export async function findQuoteByImportHash(
  orgId: string,
  sha256: string,
): Promise<{ id: string; number: string } | null> {
  const marker = `importHash:${sha256}`;
  return prisma.commercialQuote.findFirst({
    where: {
      organizationId: orgId,
      internalNotes: { contains: marker },
    },
    select: { id: true, number: true },
    orderBy: { createdAt: "desc" },
  });
}
