/**
 * GED-V2A — Référence un média Messagerie dans le classeur (même URL, pas de copie).
 * La PJ reste dans la conversation ; le document métier est une entrée ChantierFile.
 */
import { prisma } from "@/lib/prisma";
import { ensureChantierFolders } from "@/lib/chantier-dossier/folders";
import { suggestFolderCode } from "@/lib/ged/formats";

type Att = {
  name?: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string | null;
};

export async function linkMessageAttachmentToChantier(opts: {
  projectId: string;
  clientId: string;
  addedById: string;
  messageKind: string;
  messageId: string;
  attachment: Att;
  conversationLabel?: string | null;
  companyName?: string | null;
}): Promise<{ ok: true; chantierFileId: string } | { ok: false; error: string }> {
  const fileUrl = opts.attachment.fileUrl?.trim();
  if (!fileUrl) return { ok: false, error: "Pièce jointe sans fichier" };

  const name = (opts.attachment.name || "Média messagerie").trim().slice(0, 180);
  const existing = await prisma.chantierFileLink.findFirst({
    where: {
      entityType: "message_attachment",
      entityId: `${opts.messageKind}:${opts.messageId}:${fileUrl.slice(-48)}`,
    },
    select: { fileId: true },
  });
  if (existing) return { ok: true, chantierFileId: existing.fileId };

  await ensureChantierFolders(opts.projectId);
  const folderCode = suggestFolderCode({
    filename: name,
    category: opts.attachment.mimeType?.startsWith("image/") ? "Photos" : "À classer",
  });
  const folder =
    (await prisma.chantierFolder.findFirst({
      where: { projectId: opts.projectId, code: folderCode },
      select: { id: true },
    })) ??
    (await prisma.chantierFolder.findFirst({
      where: { projectId: opts.projectId, code: "00" },
      select: { id: true },
    }));
  if (!folder) return { ok: false, error: "Rubrique introuvable" };

  const isImage = Boolean(opts.attachment.mimeType?.startsWith("image/"));
  const conversationLabel = [opts.companyName, opts.conversationLabel]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(" — ");
  const file = await prisma.chantierFile.create({
    data: {
      projectId: opts.projectId,
      folderId: folder.id,
      clientId: opts.clientId,
      name,
      fileUrl,
      fileSize: opts.attachment.fileSize ?? null,
      mimeType: opts.attachment.mimeType ?? null,
      documentType: isImage ? "PHOTO" : "DOCUMENT",
      category: isImage ? "Photos" : "À classer",
      status: "RECU",
      visibility: "Interne entreprise cliente",
      classificationStatus: isImage ? "CLASSE" : "A_CLASSER",
      addedById: opts.addedById,
      emitterName: opts.companyName?.trim() || null,
    },
    select: { id: true },
  });

  await prisma.chantierFileLink.create({
    data: {
      fileId: file.id,
      entityType: "message_attachment",
      entityId: `${opts.messageKind}:${opts.messageId}:${fileUrl.slice(-48)}`,
      entityLabel: conversationLabel || "Messagerie",
      createdById: opts.addedById,
    },
  });

  return { ok: true, chantierFileId: file.id };
}
