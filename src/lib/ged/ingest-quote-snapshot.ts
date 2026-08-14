/**
 * GED V2 — référence le snapshot PDF devis accepté dans le classeur (même storageKey).
 * N’altère pas l’immutabilité CommercialQuoteSnapshot.
 */
import { prisma } from "@/lib/prisma";
import { ensureChantierFolders } from "@/lib/chantier-dossier/folders";
import { buildDocumentsStorageRef } from "@/lib/storage/supabase-object";

export async function ingestAcceptedQuoteSnapshot(opts: {
  organizationId: string;
  quoteId: string;
  snapshotId: string;
  storageKey: string;
  addedById: string;
}): Promise<{ chantierFileId: string | null; linked: boolean; reason?: string }> {
  const existing = await prisma.chantierFileLink.findFirst({
    where: { entityType: "commercial_quote_snapshot", entityId: opts.snapshotId },
    select: { fileId: true },
  });
  if (existing) {
    return { chantierFileId: existing.fileId, linked: false, reason: "already_linked" };
  }

  const quote = await prisma.commercialQuote.findFirst({
    where: { id: opts.quoteId, organizationId: opts.organizationId },
    select: {
      id: true,
      number: true,
      projectId: true,
      project: { select: { id: true, clientId: true, title: true } },
      clientExternalOrg: { select: { name: true, tradeName: true } },
    },
  });
  if (!quote?.projectId || !quote.project) {
    return { chantierFileId: null, linked: false, reason: "no_project" };
  }

  await ensureChantierFolders(quote.projectId);
  const folder =
    (await prisma.chantierFolder.findFirst({
      where: { projectId: quote.projectId, code: "01" },
      select: { id: true },
    })) ??
    (await prisma.chantierFolder.findFirst({
      where: { projectId: quote.projectId, code: "00" },
      select: { id: true },
    }));
  if (!folder) return { chantierFileId: null, linked: false, reason: "no_folder" };

  const clientName =
    quote.clientExternalOrg?.tradeName || quote.clientExternalOrg?.name || null;
  const storedRef = opts.storageKey.startsWith("storage://")
    ? opts.storageKey
    : buildDocumentsStorageRef(opts.storageKey);

  const file = await prisma.chantierFile.create({
    data: {
      projectId: quote.projectId,
      folderId: folder.id,
      clientId: quote.project.clientId,
      name: `${quote.number}.pdf`,
      fileUrl: storedRef,
      mimeType: "application/pdf",
      documentType: "DEVIS",
      category: "Contractuel",
      status: "RECU",
      visibility: "Interne entreprise cliente",
      classificationStatus: "CLASSE",
      isCurrentVersion: true,
      addedById: opts.addedById,
      emitterName: clientName,
    },
    select: { id: true },
  });

  await prisma.chantierFileLink.createMany({
    data: [
      {
        fileId: file.id,
        entityType: "commercial_quote",
        entityId: quote.id,
        entityLabel: quote.number,
        createdById: opts.addedById,
      },
      {
        fileId: file.id,
        entityType: "commercial_quote_snapshot",
        entityId: opts.snapshotId,
        entityLabel: "PDF accepté",
        createdById: opts.addedById,
      },
    ],
  });

  return { chantierFileId: file.id, linked: true };
}
