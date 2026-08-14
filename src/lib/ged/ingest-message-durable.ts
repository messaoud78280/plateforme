/**
 * GED V2 — ingestion automatique des PJ durables messagerie chantier.
 * Même URL (pas de copie physique). Les photos/audio restent dans la conversation.
 */
import { linkMessageAttachmentToChantier } from "@/lib/ged/link-message-to-chantier";
import { isDurableDocument } from "@/lib/ged/durable-file";

type Att = {
  name?: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string | null;
  kind?: string | null;
};

export async function ingestDurableMessageAttachments(opts: {
  projectId: string;
  clientId: string;
  addedById: string;
  messageKind: string;
  messageId: string;
  attachments: Att[];
  conversationLabel?: string | null;
  companyName?: string | null;
  visibility?: string;
  createdAt?: Date;
  dryRun?: boolean;
}): Promise<{ linked: number; existing: number; skipped: number }> {
  let linked = 0;
  let existing = 0;
  let skipped = 0;
  for (const att of opts.attachments) {
    if (!att.fileUrl) {
      skipped += 1;
      continue;
    }
    if (!isDurableDocument(att)) {
      skipped += 1;
      continue;
    }
    const result = await linkMessageAttachmentToChantier({
      projectId: opts.projectId,
      clientId: opts.clientId,
      addedById: opts.addedById,
      messageKind: opts.messageKind,
      messageId: opts.messageId,
      attachment: att,
      conversationLabel: opts.conversationLabel,
      companyName: opts.companyName,
      visibility: opts.visibility,
      createdAt: opts.createdAt,
      dryRun: opts.dryRun,
    });
    if (!result.ok) skipped += 1;
    else if (result.created) linked += 1;
    else existing += 1;
  }
  return { linked, existing, skipped };
}
