-- Scripts optionnels 4 à 7 (idempotent). Copier TOUT le fichier dans Supabase SQL Editor.
-- PostgreSQL n'accepte PAS "ADD CONSTRAINT IF NOT EXISTS" : on utilise des blocs DO.

DO $$ BEGIN CREATE TYPE "ProjectUrgency" AS ENUM ('BASSE', 'MOYENNE', 'HAUTE', 'URGENTE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "dateSouhaitee" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "deadline" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "notes" TEXT;
DO $$ BEGIN ALTER TABLE "Project" ADD COLUMN "urgency" "ProjectUrgency" NOT NULL DEFAULT 'MOYENNE';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "projectId" TEXT;
DO $$ BEGIN ALTER TABLE "Document" ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "assignedToId" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "agencyNotes" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "correctionNote" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "validatedAt" TIMESTAMP(3);
DO $$ BEGIN ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "projectId" TEXT;
DO $$ BEGIN ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "Task_projectId_idx" ON "Task"("projectId");

ALTER TABLE "Alert" ADD COLUMN IF NOT EXISTS "actionUrl" TEXT;
