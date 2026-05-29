-- Lier un fichier du classeur chantier à une mission BeWork
ALTER TABLE "ChantierFile" ADD COLUMN IF NOT EXISTS "taskId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ChantierFile_taskId_fkey'
  ) THEN
    ALTER TABLE "ChantierFile"
      ADD CONSTRAINT "ChantierFile_taskId_fkey"
      FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "ChantierFile_taskId_idx" ON "ChantierFile"("taskId");
