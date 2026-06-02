-- Codification BeWork BW-[LOT]-[FAMILLE]-[OUVRAGE]-[VARIANTE]
-- Réversible : ne modifie pas les PriceEntry ; préserve sourceCode.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND LOWER(table_name) = 'workitem'
  ) THEN
    RAISE EXCEPTION 'Table "WorkItem" absente — exécutez prisma/migrations/bework-devis.sql d''abord.';
  END IF;
END $$;

DO $$ BEGIN
  CREATE TYPE "WorkItemCodificationStatus" AS ENUM ('pending', 'auto', 'a_verifier', 'valide');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "WorkItemCodificationMappingMatchType" AS ENUM ('exact', 'prefix', 'regex', 'artiprix_chapter');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LibraryCleanupJobType') THEN
    ALTER TYPE "LibraryCleanupJobType" ADD VALUE IF NOT EXISTS 'workitem_codification_preview';
    ALTER TYPE "LibraryCleanupJobType" ADD VALUE IF NOT EXISTS 'workitem_codification_apply';
  END IF;
END $$;

ALTER TABLE "WorkItem" ADD COLUMN IF NOT EXISTS "codeBework" TEXT;
ALTER TABLE "WorkItem" ADD COLUMN IF NOT EXISTS "importSource" TEXT;
ALTER TABLE "WorkItem" ADD COLUMN IF NOT EXISTS "lotCode" TEXT;
ALTER TABLE "WorkItem" ADD COLUMN IF NOT EXISTS "familleNom" TEXT;
ALTER TABLE "WorkItem" ADD COLUMN IF NOT EXISTS "sousFamilleCode" TEXT;
ALTER TABLE "WorkItem" ADD COLUMN IF NOT EXISTS "sousFamilleNom" TEXT;
ALTER TABLE "WorkItem" ADD COLUMN IF NOT EXISTS "ouvrageCode" TEXT;
ALTER TABLE "WorkItem" ADD COLUMN IF NOT EXISTS "designationSource" TEXT;
ALTER TABLE "WorkItem" ADD COLUMN IF NOT EXISTS "codificationStatus" "WorkItemCodificationStatus" NOT NULL DEFAULT 'pending';
ALTER TABLE "WorkItem" ADD COLUMN IF NOT EXISTS "codificationSnapshot" JSONB;
ALTER TABLE "WorkItem" ADD COLUMN IF NOT EXISTS "codificationAppliedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "WorkItem_codeBework_key" ON "WorkItem"("codeBework") WHERE "codeBework" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "WorkItem_codeBework_idx" ON "WorkItem"("codeBework");
CREATE INDEX IF NOT EXISTS "WorkItem_lotCode_idx" ON "WorkItem"("lotCode");
CREATE INDEX IF NOT EXISTS "WorkItem_sousFamilleCode_idx" ON "WorkItem"("sousFamilleCode");
CREATE INDEX IF NOT EXISTS "WorkItem_ouvrageCode_idx" ON "WorkItem"("ouvrageCode");
CREATE INDEX IF NOT EXISTS "WorkItem_codificationStatus_idx" ON "WorkItem"("codificationStatus");
CREATE INDEX IF NOT EXISTS "WorkItem_importSource_idx" ON "WorkItem"("importSource");

-- Préremplir code_source depuis code si absent (sans écraser)
UPDATE "WorkItem"
SET "sourceCode" = "code"
WHERE "sourceCode" IS NULL OR TRIM("sourceCode") = '';

UPDATE "WorkItem"
SET "designationSource" = COALESCE(NULLIF(TRIM("title"), ''), LEFT("fullDescription", 500))
WHERE "designationSource" IS NULL OR TRIM("designationSource") = '';

CREATE TABLE IF NOT EXISTS "WorkItemCodificationMapping" (
  "id" TEXT NOT NULL,
  "sourcePattern" TEXT NOT NULL,
  "matchType" "WorkItemCodificationMappingMatchType" NOT NULL DEFAULT 'exact',
  "lotCode" TEXT NOT NULL,
  "familleCode" TEXT NOT NULL,
  "ouvrageCode" TEXT NOT NULL,
  "sousFamilleCode" TEXT,
  "sousFamilleNom" TEXT,
  "importSourceHint" TEXT,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "note" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkItemCodificationMapping_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WorkItemCodificationMapping_active_idx" ON "WorkItemCodificationMapping"("active");
CREATE INDEX IF NOT EXISTS "WorkItemCodificationMapping_matchType_idx" ON "WorkItemCodificationMapping"("matchType");
CREATE INDEX IF NOT EXISTS "WorkItemCodificationMapping_priority_idx" ON "WorkItemCodificationMapping"("priority");
CREATE INDEX IF NOT EXISTS "WorkItemCodificationMapping_lot_fam_ouv_idx" ON "WorkItemCodificationMapping"("lotCode", "familleCode", "ouvrageCode");

CREATE TABLE IF NOT EXISTS "WorkItemCodificationRevert" (
  "id" TEXT NOT NULL,
  "workItemId" TEXT NOT NULL,
  "jobId" TEXT,
  "snapshot" JSONB NOT NULL,
  "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revertedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkItemCodificationRevert_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkItemCodificationRevert_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "WorkItemCodificationRevert_workItemId_idx" ON "WorkItemCodificationRevert"("workItemId");
CREATE INDEX IF NOT EXISTS "WorkItemCodificationRevert_jobId_idx" ON "WorkItemCodificationRevert"("jobId");
CREATE INDEX IF NOT EXISTS "WorkItemCodificationRevert_appliedAt_idx" ON "WorkItemCodificationRevert"("appliedAt");

-- Correspondances de base (Artiprix chapitres fréquents)
INSERT INTO "WorkItemCodificationMapping" ("id", "sourcePattern", "matchType", "lotCode", "familleCode", "ouvrageCode", "sousFamilleCode", "sousFamilleNom", "importSourceHint", "priority", "note")
VALUES
  ('map-artiprix-1-11', '1.11', 'artiprix_chapter', 'GO', 'DEM', 'CLO', 'CLO', 'Démolition de cloisons', 'Artiprix', 100, 'Démolitions cloisons'),
  ('map-artiprix-1-1', '1.1', 'artiprix_chapter', 'GO', 'DEM', 'DEC', NULL, NULL, 'Artiprix', 90, 'Décapages / démolitions générales'),
  ('map-artiprix-2-1', '2.1', 'artiprix_chapter', 'GO', 'TER', 'FOU', NULL, 'Fouilles', 'Artiprix', 90, 'Terrassement fouilles'),
  ('map-artiprix-2-2', '2.2', 'artiprix_chapter', 'GO', 'TER', 'TRC', NULL, 'Tranchées', 'Artiprix', 90, 'Terrassement tranchées'),
  ('map-vrd-e', 'VRD-E', 'prefix', 'VRD', 'ASS', 'CAN', NULL, 'Canalisations VRD', NULL, 80, 'Codes internes VRD-E'),
  ('map-vrd-t', 'VRD-T', 'prefix', 'VRD', 'TER', 'REM', NULL, 'Terrassement VRD', NULL, 80, 'Codes internes VRD-T'),
  ('map-bw-demolition', 'BW-DEMOLITION', 'prefix', 'GO', 'DEM', 'DEC', NULL, NULL, 'BeWork', 70, 'Anciens codes texte BW-DEMOLITION'),
  ('map-bw-martin', 'BW-MARTIN', 'prefix', 'GO', 'MAC', 'GEN', NULL, 'Import devis Martin', 'Martin', 50, 'Recodification progressive — reclassement manuel conseillé')
ON CONFLICT ("id") DO NOTHING;
