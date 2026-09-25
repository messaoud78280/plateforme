-- MÉTRÉ & PRÉPARATION DE CHANTIER — Phase 1 (bework_prep_bundle_v1)
-- Migration strictement additive : 5 nouvelles tables, aucune table existante modifiée.
-- Idempotente (rejouable sans effet de bord).

CREATE TABLE IF NOT EXISTS "PrepStudy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "trade" TEXT,
    "description" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'PROFESSIONAL',
    "dossierStatus" TEXT NOT NULL DEFAULT 'PRO_A_VALIDER',
    "bundleId" TEXT,
    "sourceFormat" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "sourcesJson" JSONB,
    "hypothesesJson" JSONB,
    "elementsJson" JSONB,
    "lotsJson" JSONB,
    "checksJson" JSONB,
    "resourcesJson" JSONB,
    "workflowJson" JSONB,
    "scheduleJson" JSONB,
    "decisionsJson" JSONB,
    "variantsJson" JSONB,
    "disclaimersJson" JSONB,
    "createdById" TEXT,
    "updatedById" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PrepStudy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PrepParameter" (
    "id" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "value" DECIMAL(24,10),
    "formula" TEXT,
    "provenance" TEXT,
    "sourceRef" TEXT,
    "evidenceJson" JSONB,
    "hypothesisId" TEXT,
    "note" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "originalValue" DECIMAL(24,10),
    "originalProvenance" TEXT,
    "modifiedById" TEXT,
    "modifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PrepParameter_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PrepTakeoffLine" (
    "id" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "lot" TEXT NOT NULL,
    "subLot" TEXT,
    "designation" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL,
    "elementIdsJson" JSONB,
    "formula" TEXT,
    "declaredQuantity" DECIMAL(24,10),
    "provenance" TEXT,
    "literalProvenance" TEXT,
    "justification" TEXT,
    "role" TEXT NOT NULL DEFAULT 'quote',
    "nature" TEXT,
    "dependsOnDecisionsJson" JSONB,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "computedQuantity" DECIMAL(24,10),
    "computeError" TEXT,
    "originalDeclared" DECIMAL(24,10),
    "originalProvenance" TEXT,
    "validatedQuantity" DECIMAL(24,10),
    "validatedAt" TIMESTAMP(3),
    "validatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PrepTakeoffLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PrepImport" (
    "id" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "bundleId" TEXT,
    "fingerprint" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "summaryJson" JSONB NOT NULL,
    "snapshotBeforeJson" JSONB,
    "versionAfter" INTEGER NOT NULL,
    "appliedById" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "undoneAt" TIMESTAMP(3),
    CONSTRAINT "PrepImport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PrepStudyEvent" (
    "id" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "detailJson" JSONB,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrepStudyEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PrepStudy_organizationId_projectId_idx" ON "PrepStudy"("organizationId", "projectId");
CREATE INDEX IF NOT EXISTS "PrepStudy_projectId_archivedAt_idx" ON "PrepStudy"("projectId", "archivedAt");
CREATE INDEX IF NOT EXISTS "PrepParameter_organizationId_idx" ON "PrepParameter"("organizationId");
CREATE UNIQUE INDEX IF NOT EXISTS "PrepParameter_studyId_key_key" ON "PrepParameter"("studyId", "key");
CREATE INDEX IF NOT EXISTS "PrepTakeoffLine_organizationId_idx" ON "PrepTakeoffLine"("organizationId");
CREATE UNIQUE INDEX IF NOT EXISTS "PrepTakeoffLine_studyId_code_key" ON "PrepTakeoffLine"("studyId", "code");
CREATE INDEX IF NOT EXISTS "PrepImport_studyId_appliedAt_idx" ON "PrepImport"("studyId", "appliedAt");
CREATE INDEX IF NOT EXISTS "PrepImport_organizationId_projectId_fingerprint_idx" ON "PrepImport"("organizationId", "projectId", "fingerprint");
CREATE INDEX IF NOT EXISTS "PrepStudyEvent_studyId_createdAt_idx" ON "PrepStudyEvent"("studyId", "createdAt");
CREATE INDEX IF NOT EXISTS "PrepStudyEvent_organizationId_idx" ON "PrepStudyEvent"("organizationId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrepStudy_organizationId_fkey') THEN
    ALTER TABLE "PrepStudy" ADD CONSTRAINT "PrepStudy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrepStudy_projectId_fkey') THEN
    ALTER TABLE "PrepStudy" ADD CONSTRAINT "PrepStudy_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrepParameter_studyId_fkey') THEN
    ALTER TABLE "PrepParameter" ADD CONSTRAINT "PrepParameter_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "PrepStudy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrepTakeoffLine_studyId_fkey') THEN
    ALTER TABLE "PrepTakeoffLine" ADD CONSTRAINT "PrepTakeoffLine_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "PrepStudy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrepImport_studyId_fkey') THEN
    ALTER TABLE "PrepImport" ADD CONSTRAINT "PrepImport_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "PrepStudy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrepStudyEvent_studyId_fkey') THEN
    ALTER TABLE "PrepStudyEvent" ADD CONSTRAINT "PrepStudyEvent_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "PrepStudy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Pas d'accès via l'API REST Supabase (Prisma se connecte en propriétaire des tables).
ALTER TABLE "PrepStudy" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PrepParameter" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PrepTakeoffLine" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PrepImport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PrepStudyEvent" ENABLE ROW LEVEL SECURITY;
