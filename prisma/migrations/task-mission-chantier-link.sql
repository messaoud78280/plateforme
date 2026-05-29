-- Liaison missions ↔ chantiers (types, créateur, actions estimées, notes client)
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "missionType" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "createdById" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "estimatedActions" INTEGER;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "clientVisibleNotes" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Task_createdById_fkey'
  ) THEN
    ALTER TABLE "Task"
      ADD CONSTRAINT "Task_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
