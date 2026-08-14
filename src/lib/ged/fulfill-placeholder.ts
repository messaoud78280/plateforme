/**
 * GED V2 — rattacher un upload à une pièce attendue (même rubrique, nom proche).
 */
import { prisma } from "@/lib/prisma";

export function namesLookLikeSameDocument(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na.length < 4 || nb.length < 4) return false;
  return na.includes(nb) || nb.includes(na);
}

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\.[a-z0-9]{2,4}$/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export async function fulfillMatchingPlaceholder(opts: {
  projectId: string;
  folderId: string;
  filename: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string | null;
  storagePath: string;
  checksum: string;
  addedById: string;
}): Promise<{ id: string } | null> {
  const missings = await prisma.chantierFile.findMany({
    where: {
      projectId: opts.projectId,
      folderId: opts.folderId,
      fileUrl: null,
      status: { in: ["MANQUANT", "A_RELANCER"] },
      deletedAt: null,
    },
    select: { id: true, name: true },
    take: 30,
  });
  if (missings.length === 0) return null;

  const incoming = normalizeName(opts.filename);
  const match =
    missings.find((m) => namesLookLikeSameDocument(opts.filename, m.name)) ??
    (missings.length === 1 ? missings[0] : null);

  if (!match) return null;

  await prisma.chantierFile.update({
    where: { id: match.id },
    data: {
      fileUrl: opts.fileUrl,
      fileSize: opts.fileSize,
      mimeType: opts.mimeType,
      storagePath: opts.storagePath,
      checksum: opts.checksum,
      status: "RECU",
      addedById: opts.addedById,
      classificationStatus: "CLASSE",
    },
  });
  return { id: match.id };
}
