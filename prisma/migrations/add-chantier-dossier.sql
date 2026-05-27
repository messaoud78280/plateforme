-- Dossiers chantier BeWork — rubriques + fichiers + champs projet
-- Idempotent : safe à rejouer sur Supabase

-- Statut chantier
DO $$ BEGIN
  CREATE TYPE "ChantierStatus" AS ENUM ('ETUDE', 'EN_COURS', 'EN_ATTENTE', 'RECEPTION', 'TERMINE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Statut fichier dossier
DO $$ BEGIN
  CREATE TYPE "ChantierFileStatus" AS ENUM ('RECU', 'A_VERIFIER', 'VALIDE', 'MANQUANT', 'A_RELANCER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Champs chantier sur Project
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "siteAddress" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "siteCity" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "internalManager" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "signedQuoteAmount" DECIMAL(14, 2);
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "plannedStartDate" DATE;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "plannedEndDate" DATE;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "chantierStatus" "ChantierStatus" NOT NULL DEFAULT 'ETUDE';

-- Rubriques dossier
CREATE TABLE IF NOT EXISTS "ChantierFolder" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChantierFolder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ChantierFolder_projectId_code_key" ON "ChantierFolder"("projectId", "code");
CREATE INDEX IF NOT EXISTS "ChantierFolder_projectId_sortOrder_idx" ON "ChantierFolder"("projectId", "sortOrder");

DO $$ BEGIN
  ALTER TABLE "ChantierFolder" ADD CONSTRAINT "ChantierFolder_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Fichiers dossier
CREATE TABLE IF NOT EXISTS "ChantierFile" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "folderId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "fileUrl" TEXT,
  "fileSize" INTEGER,
  "mimeType" TEXT,
  "documentType" TEXT,
  "status" "ChantierFileStatus" NOT NULL DEFAULT 'RECU',
  "comment" TEXT,
  "addedById" TEXT,
  "aiSummary" TEXT,
  "aiClassifiedAt" TIMESTAMP(3),
  "aiSuggestedFolderId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChantierFile_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ChantierFile_projectId_folderId_idx" ON "ChantierFile"("projectId", "folderId");
CREATE INDEX IF NOT EXISTS "ChantierFile_clientId_idx" ON "ChantierFile"("clientId");
CREATE INDEX IF NOT EXISTS "ChantierFile_status_idx" ON "ChantierFile"("status");

DO $$ BEGIN
  ALTER TABLE "ChantierFile" ADD CONSTRAINT "ChantierFile_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ChantierFile" ADD CONSTRAINT "ChantierFile_folderId_fkey"
    FOREIGN KEY ("folderId") REFERENCES "ChantierFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ChantierFile" ADD CONSTRAINT "ChantierFile_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ChantierFile" ADD CONSTRAINT "ChantierFile_addedById_fkey"
    FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
