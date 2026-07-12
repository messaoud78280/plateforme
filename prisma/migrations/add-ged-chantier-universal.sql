-- GED chantier universelle — extension ChantierFile + liens / commentaires / favoris
-- Appliqué via Supabase MCP (add_ged_chantier_fields / add_ged_chantier_fks)

ALTER TABLE "ChantierFile" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "ChantierFile" ADD COLUMN IF NOT EXISTS "subcategory" TEXT;
ALTER TABLE "ChantierFile" ADD COLUMN IF NOT EXISTS "tags" TEXT;
ALTER TABLE "ChantierFile" ADD COLUMN IF NOT EXISTS "versionLabel" TEXT DEFAULT '1';
ALTER TABLE "ChantierFile" ADD COLUMN IF NOT EXISTS "indice" TEXT;
ALTER TABLE "ChantierFile" ADD COLUMN IF NOT EXISTS "visibility" TEXT NOT NULL DEFAULT 'Interne entreprise cliente';
ALTER TABLE "ChantierFile" ADD COLUMN IF NOT EXISTS "isCurrentVersion" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "ChantierFile" ADD COLUMN IF NOT EXISTS "replacesFileId" TEXT;
ALTER TABLE "ChantierFile" ADD COLUMN IF NOT EXISTS "checksum" TEXT;
ALTER TABLE "ChantierFile" ADD COLUMN IF NOT EXISTS "classificationStatus" TEXT NOT NULL DEFAULT 'CLASSE';
ALTER TABLE "ChantierFile" ADD COLUMN IF NOT EXISTS "storagePath" TEXT;
ALTER TABLE "ChantierFile" ADD COLUMN IF NOT EXISTS "previewStatus" TEXT;
ALTER TABLE "ChantierFile" ADD COLUMN IF NOT EXISTS "documentDate" DATE;
ALTER TABLE "ChantierFile" ADD COLUMN IF NOT EXISTS "emitterName" TEXT;
ALTER TABLE "ChantierFile" ADD COLUMN IF NOT EXISTS "financialMeta" JSONB;
ALTER TABLE "ChantierFile" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "ChantierFile" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

ALTER TABLE "PilotageMarketDocument" ADD COLUMN IF NOT EXISTS "chantierFileId" TEXT;
