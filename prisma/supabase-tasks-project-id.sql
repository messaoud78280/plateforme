-- Lier une tâche à un projet (optionnel)
-- Exécuter après supabase-add-documents-tasks.sql (ou supabase-tasks-agents-validation.sql)
-- Ajoute sur Task : projectId (référence Project).
-- Type TEXT pour correspondre à Project.id (cuid / text dans votre base).

ALTER TABLE "Task" DROP COLUMN IF EXISTS "projectId";

ALTER TABLE "Task"
ADD COLUMN IF NOT EXISTS "projectId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Task_projectId_fkey'
    AND table_name = 'Task'
  ) THEN
    ALTER TABLE "Task"
    ADD CONSTRAINT "Task_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Task_projectId_idx" ON "Task"("projectId");
