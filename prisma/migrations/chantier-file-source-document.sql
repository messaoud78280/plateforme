ALTER TABLE "ChantierFile" ADD COLUMN IF NOT EXISTS "sourceDocumentId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "ChantierFile_sourceDocumentId_key"
  ON "ChantierFile"("sourceDocumentId")
  WHERE "sourceDocumentId" IS NOT NULL;
