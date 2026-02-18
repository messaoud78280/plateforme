-- Assignation aux agents + notes agence + validation / correction
-- À exécuter dans Supabase → SQL Editor après les tables de base.

ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "assignedToId" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "agencyNotes" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "correctionNote" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "validatedAt" TIMESTAMP(3);

DO $$ BEGIN
  ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey"
    FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
