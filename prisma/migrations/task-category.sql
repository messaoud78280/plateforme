-- Colonne Task.category (alignement schéma Prisma / base Railway)
-- À exécuter dans le SQL Editor de ta base (Railway, Supabase, etc.) si la colonne n'existe pas.

ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "category" TEXT;
