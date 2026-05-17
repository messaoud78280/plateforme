CREATE TABLE IF NOT EXISTS "SkillPpspsSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "siteName" TEXT,
  "siteAddress" TEXT,
  "detailLevel" TEXT NOT NULL DEFAULT 'standard',
  "formSnapshot" JSONB NOT NULL,
  "extractedContext" TEXT,
  "resultMarkdown" TEXT,
  "usedLlm" BOOLEAN NOT NULL DEFAULT false,
  "notice" TEXT,
  "meta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SkillPpspsSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SkillPpspsFile" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT,
  "fileSize" INTEGER NOT NULL,
  "extractedText" TEXT,
  "storagePath" TEXT,
  "storageUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SkillPpspsFile_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SkillPpspsSession_userId_createdAt_idx"
  ON "SkillPpspsSession"("userId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "SkillPpspsFile_sessionId_idx"
  ON "SkillPpspsFile"("sessionId");

DO $$ BEGIN
  ALTER TABLE "SkillPpspsSession"
    ADD CONSTRAINT "SkillPpspsSession_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SkillPpspsFile"
    ADD CONSTRAINT "SkillPpspsFile_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "SkillPpspsSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
