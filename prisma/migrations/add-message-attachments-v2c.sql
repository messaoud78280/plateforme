-- MESSAGERIE-V2C : pièces jointes sur messages chantier (non destructif)
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "attachmentsJson" JSONB;
