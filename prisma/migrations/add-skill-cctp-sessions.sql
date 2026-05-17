-- Skill CCTP V2 — sessions & pièces jointes (texte extrait)
CREATE TABLE IF NOT EXISTS "SkillCctpSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "requestText" TEXT NOT NULL,
  "projectType" TEXT,
  "lot" TEXT,
  "location" TEXT,
  "constraints" TEXT,
  "detailLevel" TEXT NOT NULL DEFAULT 'standard',
  "availableDocuments" TEXT,
  "normReferences" JSONB,
  "extractedContext" TEXT,
  "resultMarkdown" TEXT,
  "usedLlm" BOOLEAN NOT NULL DEFAULT false,
  "notice" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SkillCctpSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SkillCctpFile" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT,
  "fileSize" INTEGER NOT NULL,
  "extractedText" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SkillCctpFile_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SkillCctpSession_userId_createdAt_idx"
  ON "SkillCctpSession"("userId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "SkillCctpFile_sessionId_idx"
  ON "SkillCctpFile"("sessionId");

DO $$ BEGIN
  ALTER TABLE "SkillCctpSession"
    ADD CONSTRAINT "SkillCctpSession_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SkillCctpFile"
    ADD CONSTRAINT "SkillCctpFile_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "SkillCctpSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
