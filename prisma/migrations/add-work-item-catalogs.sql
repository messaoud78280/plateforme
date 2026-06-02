-- Bibliothèques d’ouvrages multiples (historique conservée + nouvelle base propre)

DO $$ BEGIN
  CREATE TYPE "WorkItemCatalogStatus" AS ENUM ('active', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "DcePricingFillStatus" AS ENUM ('draft', 'extracting', 'extracted', 'matching', 'ready', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "DcePricingTargetDocType" AS ENUM ('dpgf', 'bpu');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "WorkItemCatalog" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" "WorkItemCatalogStatus" NOT NULL DEFAULT 'active',
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "sourceLabel" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkItemCatalog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WorkItemCatalog_slug_key" ON "WorkItemCatalog"("slug");
CREATE INDEX IF NOT EXISTS "WorkItemCatalog_status_idx" ON "WorkItemCatalog"("status");
CREATE INDEX IF NOT EXISTS "WorkItemCatalog_isDefault_idx" ON "WorkItemCatalog"("isDefault");

INSERT INTO "WorkItemCatalog" ("id", "slug", "name", "description", "status", "isDefault", "sourceLabel", "updatedAt")
VALUES
  (
    'bework-catalog-historique',
    'historique',
    'Bibliothèque historique',
    'Imports mélangés existants (Artiprix partiel, Martin, VRD…). Consultation et anciens devis — ne pas recodifier en masse.',
    'active',
    false,
    'Mixte historique',
    CURRENT_TIMESTAMP
  ),
  (
    'bework-catalog-artiprix-2026',
    'artiprix-2026',
    'Artiprix BeWork 2026',
    'Nouvelle bibliothèque propre : import Artiprix complet, codification BW-LOT-FAM-OUV dès l’import, DCE → BPU/DPGF.',
    'active',
    true,
    'Artiprix',
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "isDefault" = EXCLUDED."isDefault",
  "updatedAt" = CURRENT_TIMESTAMP;

UPDATE "WorkItemCatalog" SET "isDefault" = false WHERE "id" <> 'bework-catalog-artiprix-2026';
UPDATE "WorkItemCatalog" SET "isDefault" = true WHERE "id" = 'bework-catalog-artiprix-2026';

ALTER TABLE "WorkItem" ADD COLUMN IF NOT EXISTS "catalogId" TEXT;

UPDATE "WorkItem"
SET "catalogId" = 'bework-catalog-historique'
WHERE "catalogId" IS NULL;

ALTER TABLE "WorkItem" ALTER COLUMN "catalogId" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'WorkItem_catalogId_fkey'
  ) THEN
    ALTER TABLE "WorkItem"
      ADD CONSTRAINT "WorkItem_catalogId_fkey"
      FOREIGN KEY ("catalogId") REFERENCES "WorkItemCatalog"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DROP INDEX IF EXISTS "WorkItem_code_key";
DROP INDEX IF EXISTS "WorkItem_codeBework_key";

CREATE UNIQUE INDEX IF NOT EXISTS "WorkItem_catalogId_code_key" ON "WorkItem"("catalogId", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "WorkItem_catalogId_codeBework_key"
  ON "WorkItem"("catalogId", "codeBework")
  WHERE "codeBework" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "WorkItem_catalogId_idx" ON "WorkItem"("catalogId");

CREATE TABLE IF NOT EXISTS "DcePricingFillSession" (
  "id" TEXT NOT NULL,
  "catalogId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "targetDocType" "DcePricingTargetDocType" NOT NULL DEFAULT 'dpgf',
  "dceFileName" TEXT,
  "extractedText" TEXT,
  "lines" JSONB,
  "matchReport" JSONB,
  "status" "DcePricingFillStatus" NOT NULL DEFAULT 'draft',
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DcePricingFillSession_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DcePricingFillSession_catalogId_fkey"
    FOREIGN KEY ("catalogId") REFERENCES "WorkItemCatalog"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "DcePricingFillSession_catalogId_idx" ON "DcePricingFillSession"("catalogId");
CREATE INDEX IF NOT EXISTS "DcePricingFillSession_status_idx" ON "DcePricingFillSession"("status");
CREATE INDEX IF NOT EXISTS "DcePricingFillSession_createdAt_idx" ON "DcePricingFillSession"("createdAt");
