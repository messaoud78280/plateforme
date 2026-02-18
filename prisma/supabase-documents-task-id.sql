-- Lier un document à une tâche (pièces jointes du dépôt de tâche)
-- Exécuter après les scripts de base.
-- Ajoute sur Document : taskId (référence Task, optionnel).

ALTER TABLE "Document" DROP COLUMN IF EXISTS "taskId";

ALTER TABLE "Document"
ADD COLUMN IF NOT EXISTS "taskId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Document_taskId_fkey'
    AND table_name = 'Document'
  ) THEN
    ALTER TABLE "Document"
    ADD CONSTRAINT "Document_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Document_taskId_idx" ON "Document"("taskId");
