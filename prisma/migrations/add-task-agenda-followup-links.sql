-- Phase 0 cohérence métier : Task ↔ FollowUpSheet, AgendaEvent ↔ Task
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "followUpSheetId" TEXT;
ALTER TABLE "AgendaEvent" ADD COLUMN IF NOT EXISTS "taskId" TEXT;

CREATE INDEX IF NOT EXISTS "Task_followUpSheetId_idx" ON "Task"("followUpSheetId");
CREATE INDEX IF NOT EXISTS "AgendaEvent_taskId_startAt_idx" ON "AgendaEvent"("taskId", "startAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Task_followUpSheetId_fkey'
  ) THEN
    ALTER TABLE "Task"
      ADD CONSTRAINT "Task_followUpSheetId_fkey"
      FOREIGN KEY ("followUpSheetId") REFERENCES "FollowUpSheet"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AgendaEvent_taskId_fkey'
  ) THEN
    ALTER TABLE "AgendaEvent"
      ADD CONSTRAINT "AgendaEvent_taskId_fkey"
      FOREIGN KEY ("taskId") REFERENCES "Task"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
