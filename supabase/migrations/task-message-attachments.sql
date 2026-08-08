-- Pièces jointes sur messages de mission (photos, PDF…)
ALTER TABLE "TaskMessage" ADD COLUMN IF NOT EXISTS "attachmentsJson" JSONB;
