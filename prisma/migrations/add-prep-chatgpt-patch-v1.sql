-- MÉTRÉ — patches ChatGPT bework_prep_patch_v1 (additif, idempotent)

CREATE TABLE IF NOT EXISTS "PrepChatgptPatch" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "patchId" TEXT NOT NULL,
    "versionBefore" INTEGER NOT NULL,
    "versionAfter" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "summaryJson" JSONB NOT NULL,
    "snapshotBeforeJson" JSONB NOT NULL,
    "fingerprintAfter" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "undoneAt" TIMESTAMP(3),
    "appliedById" TEXT,
    CONSTRAINT "PrepChatgptPatch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PrepChatgptPatch_studyId_patchId_key"
  ON "PrepChatgptPatch"("studyId", "patchId");
CREATE INDEX IF NOT EXISTS "PrepChatgptPatch_organizationId_studyId_idx"
  ON "PrepChatgptPatch"("organizationId", "studyId");
CREATE INDEX IF NOT EXISTS "PrepChatgptPatch_studyId_status_appliedAt_idx"
  ON "PrepChatgptPatch"("studyId", "status", "appliedAt");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrepChatgptPatch_organizationId_fkey') THEN
    ALTER TABLE "PrepChatgptPatch"
      ADD CONSTRAINT "PrepChatgptPatch_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrepChatgptPatch_studyId_fkey') THEN
    ALTER TABLE "PrepChatgptPatch"
      ADD CONSTRAINT "PrepChatgptPatch_studyId_fkey"
      FOREIGN KEY ("studyId") REFERENCES "PrepStudy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "PrepChatgptPatch" ENABLE ROW LEVEL SECURITY;
