-- Mémoire des missions : contacts et fournisseurs sur Task
-- À exécuter dans Supabase → SQL Editor

ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "contactsJson" JSONB;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "suppliersJson" JSONB;
