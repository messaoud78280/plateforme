-- Enrichissement des projets : deadline, urgence, date souhaitée, notes
-- + liaison documents ↔ projet (projectId sur Document)
-- À exécuter dans Supabase → SQL Editor après avoir déjà les tables Project et Document.

-- Enum urgence projet
DO $$ BEGIN
  CREATE TYPE "ProjectUrgency" AS ENUM ('BASSE', 'MOYENNE', 'HAUTE', 'URGENTE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Colonnes sur Project
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "dateSouhaitee" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "deadline" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Colonne urgence (avec default si besoin)
DO $$ BEGIN
  ALTER TABLE "Project" ADD COLUMN "urgency" "ProjectUrgency" NOT NULL DEFAULT 'MOYENNE';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- projectId sur Document (optionnel)
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "projectId" TEXT;

-- Contrainte FK Document → Project (après création des colonnes)
DO $$ BEGIN
  ALTER TABLE "Document" ADD CONSTRAINT "Document_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
