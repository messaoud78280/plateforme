-- BeWork Universal Patch journal (Phase E) — additif, idempotent

CREATE TABLE IF NOT EXISTS "BeworkUniversalPatch" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "patchId" TEXT NOT NULL,
    "originSection" TEXT NOT NULL,
    "originEntityId" TEXT NOT NULL,
    "changeIntent" TEXT NOT NULL,
    "reason" TEXT,
    "syncMode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "previewFingerprint" TEXT NOT NULL,
    "directChangesJson" JSONB NOT NULL,
    "derivedChangesJson" JSONB NOT NULL,
    "protectedImpactsJson" JSONB,
    "overridesJson" JSONB,
    "versionsBeforeJson" JSONB NOT NULL,
    "versionsAfterJson" JSONB NOT NULL,
    "studyId" TEXT,
    "quoteId" TEXT,
    "planId" TEXT,
    "actorUserId" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BeworkUniversalPatch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BeworkUniversalPatch_organizationId_patchId_key"
  ON "BeworkUniversalPatch"("organizationId", "patchId");

CREATE INDEX IF NOT EXISTS "BeworkUniversalPatch_organizationId_createdAt_idx"
  ON "BeworkUniversalPatch"("organizationId", "createdAt");

CREATE INDEX IF NOT EXISTS "BeworkUniversalPatch_projectId_createdAt_idx"
  ON "BeworkUniversalPatch"("projectId", "createdAt");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BeworkUniversalPatch_organizationId_fkey') THEN
    ALTER TABLE "BeworkUniversalPatch"
      ADD CONSTRAINT "BeworkUniversalPatch_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BeworkUniversalPatch_projectId_fkey') THEN
    ALTER TABLE "BeworkUniversalPatch"
      ADD CONSTRAINT "BeworkUniversalPatch_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "BeworkUniversalPatch" ENABLE ROW LEVEL SECURITY;
