-- Colonnes optionnelles Task (alignement schéma Prisma / base Supabase)
-- À exécuter dans le SQL Editor Supabase si les colonnes n'existent pas.
-- Ensuite décommenter les champs dans prisma/schema.prisma et régénérer le client.

ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "priority" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "estimatedActions" TEXT;
