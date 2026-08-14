/**
 * GED-V2A — Référence un média Messagerie dans le classeur (même URL, pas de copie).
 * La PJ reste dans la conversation ; le document métier est une entrée ChantierFile.
 */
import { suggestFolderCode } from "@/lib/ged/formats";
import { indexSourceDocument } from "@/lib/ged/index-source-document";
import { messageAttachmentEntityId } from "@/lib/ged/source-identity";

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
  visibility?: string;
  createdAt?: Date;
  dryRun?: boolean;
}): Promise<{ ok: true; chantierFileId: string; created: boolean } | { ok: false; error: string }> {
  const fileUrl = opts.attachment.fileUrl?.trim();
  if (!fileUrl) return { ok: false, error: "Pièce jointe sans fichier" };

  const name = (opts.attachment.name || "Média messagerie").trim().slice(0, 180);
  const isImage = Boolean(opts.attachment.mimeType?.startsWith("image/"));
  const conversationLabel = [opts.companyName, opts.conversationLabel]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(" — ");
  const folderCode = suggestFolderCode({
    filename: name,
    category: isImage ? "Photos" : "À classer",
  });

  const result = await indexSourceDocument({
    projectId: opts.projectId,
    clientId: opts.clientId,
    addedById: opts.addedById,
    name,
    fileUrl,
    fileSize: opts.attachment.fileSize ?? null,
    mimeType: opts.attachment.mimeType ?? null,
    documentType: isImage ? "PHOTO" : "DOCUMENT",
    category: isImage ? "Photos" : "À classer",
    folderCode,
    classificationStatus: isImage ? "CLASSE" : "A_CLASSER",
    visibility: opts.visibility ?? "Interne entreprise cliente",
    emitterName: opts.companyName?.trim() || null,
    createdAt: opts.createdAt,
    dryRun: opts.dryRun,
    primary: {
      entityType: "message_attachment",
      entityId: messageAttachmentEntityId(opts.messageKind, opts.messageId, fileUrl),
      entityLabel: conversationLabel || "Messagerie",
    },
  });

  if (!result.chantierFileId && !result.created) {
    return { ok: false, error: result.reason ?? "Index GED impossible" };
  }
  return {
    ok: true,
    chantierFileId: result.chantierFileId ?? "",
    created: result.created,
  };
}
