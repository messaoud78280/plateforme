-- V2 messagerie chantier : canaux INTERNE / CLIENT / FOURNISSEUR
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "channel" TEXT NOT NULL DEFAULT 'CLIENT';
CREATE INDEX IF NOT EXISTS "Message_projectId_channel_createdAt_idx"
  ON "Message"("projectId", "channel", "createdAt");
