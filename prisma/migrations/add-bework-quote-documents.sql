-- BeWork Devis : projets clients & documents de chiffrage (devis, DPGF, etc.)
-- Supabase / PostgreSQL — idempotent (relancer ne casse pas si déjà appliqué).
--
-- PRÉREQUIS : la table "WorkItem" doit exister (sinon la dernière table échoue).
-- Si besoin, exécutez d’abord prisma/migrations/bework-devis.sql dans le MÊME projet.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND LOWER(table_name) = 'workitem'
  ) THEN
    RAISE EXCEPTION
      'Table "WorkItem" absente. Ouvrez prisma/migrations/bework-devis.sql, exécutez-le entièrement dans ce projet Supabase, puis relancez ce fichier.';
  END IF;
END $$;

-- WorkItem sans colonne « code » (vieille base / migration incomplète) : obligatoire pour Prisma + lignes de devis
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND LOWER(table_name) = 'workitem'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND LOWER(table_name) = 'workitem' AND column_name = 'code'
  ) THEN
    ALTER TABLE "WorkItem" ADD COLUMN "code" TEXT;
    UPDATE "WorkItem" SET "code" = "id" WHERE "code" IS NULL OR TRIM("code") = '';
    ALTER TABLE "WorkItem" ALTER COLUMN "code" SET NOT NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "WorkItem_code_key" ON "WorkItem"("code");

DO $$ BEGIN
  CREATE TYPE "QuoteDocumentType" AS ENUM (
    'devis_estimatif',
    'dpgf_consultation',
    'devis_corrige',
    'comparatif_devis',
    'devis_contractuel'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "QuoteDocumentStatus" AS ENUM (
    'brouillon',
    'a_verifier',
    'pret_a_envoyer',
    'envoye',
    'archive'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "QuoteProject" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT,
    "clientPhone" TEXT,
    "projectName" TEXT NOT NULL,
    "projectAddress" TEXT,
    "projectCity" TEXT,
    "projectDepartment" TEXT,
    "projectType" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteProject_pkey" PRIMARY KEY ("id")
);

-- Table déjà créée par une ancienne variante : ajouter les colonnes Prisma manquantes (sinon P2022 en prod)
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "clientName" TEXT NOT NULL DEFAULT 'Client';
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "clientEmail" TEXT;
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "clientPhone" TEXT;
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "projectName" TEXT NOT NULL DEFAULT 'Projet sans nom';
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "projectAddress" TEXT;
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "projectCity" TEXT;
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "projectDepartment" TEXT;
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "projectType" TEXT;
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "QuoteProject" SET "projectName" = COALESCE(NULLIF(TRIM("projectName"), ''), NULLIF(TRIM("clientName"), ''), 'Projet sans nom') WHERE "projectName" IS NULL OR TRIM("projectName") = '';
UPDATE "QuoteProject" SET "clientName" = COALESCE(NULLIF(TRIM("clientName"), ''), 'Client') WHERE "clientName" IS NULL OR TRIM("clientName") = '';
UPDATE "QuoteProject" SET "createdAt" = COALESCE("createdAt", CURRENT_TIMESTAMP) WHERE "createdAt" IS NULL;
UPDATE "QuoteProject" SET "updatedAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP) WHERE "updatedAt" IS NULL;
ALTER TABLE "QuoteProject" ALTER COLUMN "clientName" DROP DEFAULT;
ALTER TABLE "QuoteProject" ALTER COLUMN "projectName" DROP DEFAULT;

CREATE INDEX IF NOT EXISTS "QuoteProject_clientName_idx" ON "QuoteProject"("clientName");
CREATE INDEX IF NOT EXISTS "QuoteProject_projectName_idx" ON "QuoteProject"("projectName");

CREATE TABLE IF NOT EXISTS "QuoteDocument" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "documentType" "QuoteDocumentType" NOT NULL DEFAULT 'devis_estimatif',
    "title" TEXT NOT NULL,
    "status" "QuoteDocumentStatus" NOT NULL DEFAULT 'brouillon',
    "issueDate" DATE NOT NULL,
    "validityDate" DATE,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "globalVatRate" DECIMAL(6,4) NOT NULL DEFAULT 20,
    "subtotalHT" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalVat" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalTTC" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "notesClient" TEXT,
    "internalNotes" TEXT,
    "legalDisclaimer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteDocument_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "QuoteDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "QuoteProject"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "QuoteDocument" ADD COLUMN IF NOT EXISTS "projectId" TEXT;
ALTER TABLE "QuoteDocument" ADD COLUMN IF NOT EXISTS "documentNumber" TEXT;
ALTER TABLE "QuoteDocument" ADD COLUMN IF NOT EXISTS "documentType" "QuoteDocumentType" NOT NULL DEFAULT 'devis_estimatif';
ALTER TABLE "QuoteDocument" ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT 'Document';
ALTER TABLE "QuoteDocument" ADD COLUMN IF NOT EXISTS "status" "QuoteDocumentStatus" NOT NULL DEFAULT 'brouillon';
ALTER TABLE "QuoteDocument" ADD COLUMN IF NOT EXISTS "issueDate" DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE "QuoteDocument" ADD COLUMN IF NOT EXISTS "validityDate" DATE;
ALTER TABLE "QuoteDocument" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'EUR';
ALTER TABLE "QuoteDocument" ADD COLUMN IF NOT EXISTS "globalVatRate" DECIMAL(6,4) NOT NULL DEFAULT 20;
ALTER TABLE "QuoteDocument" ADD COLUMN IF NOT EXISTS "subtotalHT" DECIMAL(14,4) NOT NULL DEFAULT 0;
ALTER TABLE "QuoteDocument" ADD COLUMN IF NOT EXISTS "totalVat" DECIMAL(14,4) NOT NULL DEFAULT 0;
ALTER TABLE "QuoteDocument" ADD COLUMN IF NOT EXISTS "totalTTC" DECIMAL(14,4) NOT NULL DEFAULT 0;
ALTER TABLE "QuoteDocument" ADD COLUMN IF NOT EXISTS "notesClient" TEXT;
ALTER TABLE "QuoteDocument" ADD COLUMN IF NOT EXISTS "internalNotes" TEXT;
ALTER TABLE "QuoteDocument" ADD COLUMN IF NOT EXISTS "legalDisclaimer" TEXT;
ALTER TABLE "QuoteDocument" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "QuoteDocument" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "QuoteDocument" SET "title" = COALESCE(NULLIF(TRIM("title"), ''), 'Document') WHERE "title" IS NULL OR TRIM("title") = '';
UPDATE "QuoteDocument" SET "documentNumber" = 'DOC-' || "id" WHERE "documentNumber" IS NULL OR TRIM("documentNumber") = '';
UPDATE "QuoteDocument" d
SET "projectId" = (SELECT p."id" FROM "QuoteProject" p ORDER BY p."createdAt" ASC NULLS LAST LIMIT 1)
WHERE d."projectId" IS NULL
  AND (SELECT COUNT(*)::INT FROM "QuoteProject") = 1;
UPDATE "QuoteDocument" SET "issueDate" = COALESCE("issueDate", CURRENT_DATE) WHERE "issueDate" IS NULL;
UPDATE "QuoteDocument" SET "createdAt" = COALESCE("createdAt", CURRENT_TIMESTAMP) WHERE "createdAt" IS NULL;
UPDATE "QuoteDocument" SET "updatedAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP) WHERE "updatedAt" IS NULL;
ALTER TABLE "QuoteDocument" ALTER COLUMN "title" DROP DEFAULT;
ALTER TABLE "QuoteDocument" ALTER COLUMN "documentNumber" DROP DEFAULT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "QuoteDocument" WHERE "projectId" IS NULL) THEN
    ALTER TABLE "QuoteDocument" ALTER COLUMN "projectId" SET NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "QuoteDocument" WHERE "documentNumber" IS NULL) THEN
    ALTER TABLE "QuoteDocument" ALTER COLUMN "documentNumber" SET NOT NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "QuoteDocument_documentNumber_key" ON "QuoteDocument"("documentNumber");
CREATE INDEX IF NOT EXISTS "QuoteDocument_projectId_idx" ON "QuoteDocument"("projectId");
CREATE INDEX IF NOT EXISTS "QuoteDocument_status_idx" ON "QuoteDocument"("status");
CREATE INDEX IF NOT EXISTS "QuoteDocument_documentType_idx" ON "QuoteDocument"("documentType");

CREATE TABLE IF NOT EXISTS "QuoteLine" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "workItemId" TEXT,
    "lot" TEXT NOT NULL,
    "family" TEXT,
    "code" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(14,4) NOT NULL,
    "unitPriceHT" DECIMAL(14,4) NOT NULL,
    "vatRate" DECIMAL(6,4) NOT NULL,
    "totalHT" DECIMAL(14,4) NOT NULL,
    "totalVat" DECIMAL(14,4) NOT NULL,
    "totalTTC" DECIMAL(14,4) NOT NULL,
    "includedItems" TEXT,
    "excludedItems" TEXT,
    "vigilancePoints" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteLine_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "QuoteLine_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "QuoteDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuoteLine_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Ancienne QuoteLine : colonnes Prisma manquantes (CREATE TABLE IF NOT EXISTS n’actualise pas le schéma)
ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "documentId" TEXT;
ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "workItemId" TEXT;
ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "lot" TEXT NOT NULL DEFAULT 'Divers';
ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "family" TEXT;
ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "code" TEXT;
ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT 'Ligne';
ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "description" TEXT NOT NULL DEFAULT '—';
ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "unit" TEXT NOT NULL DEFAULT 'u';
ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "quantity" DECIMAL(14,4) NOT NULL DEFAULT 0;
ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "unitPriceHT" DECIMAL(14,4) NOT NULL DEFAULT 0;
ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "vatRate" DECIMAL(6,4) NOT NULL DEFAULT 0;
ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "totalHT" DECIMAL(14,4) NOT NULL DEFAULT 0;
ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "totalVat" DECIMAL(14,4) NOT NULL DEFAULT 0;
ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "totalTTC" DECIMAL(14,4) NOT NULL DEFAULT 0;
ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "includedItems" TEXT;
ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "excludedItems" TEXT;
ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "vigilancePoints" TEXT;
ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "QuoteLine" SET "title" = COALESCE(NULLIF(TRIM("title"), ''), 'Ligne') WHERE "title" IS NULL OR TRIM("title") = '';
UPDATE "QuoteLine" SET "description" = COALESCE(NULLIF(TRIM("description"), ''), '—') WHERE "description" IS NULL OR TRIM("description") = '';
UPDATE "QuoteLine" SET "createdAt" = COALESCE("createdAt", CURRENT_TIMESTAMP) WHERE "createdAt" IS NULL;
UPDATE "QuoteLine" SET "updatedAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP) WHERE "updatedAt" IS NULL;
ALTER TABLE "QuoteLine" ALTER COLUMN "title" DROP DEFAULT;
ALTER TABLE "QuoteLine" ALTER COLUMN "description" DROP DEFAULT;

CREATE INDEX IF NOT EXISTS "QuoteLine_documentId_idx" ON "QuoteLine"("documentId");
CREATE INDEX IF NOT EXISTS "QuoteLine_workItemId_idx" ON "QuoteLine"("workItemId");
CREATE INDEX IF NOT EXISTS "QuoteLine_lot_idx" ON "QuoteLine"("lot");
