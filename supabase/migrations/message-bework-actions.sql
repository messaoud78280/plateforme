-- Action BeWork depuis messagerie : provenance message + MessageAction + kind SYSTEM

ALTER TABLE "AgendaEvent" ADD COLUMN IF NOT EXISTS "sourceMessageKind" TEXT;
ALTER TABLE "AgendaEvent" ADD COLUMN IF NOT EXISTS "sourceMessageId" TEXT;
CREATE INDEX IF NOT EXISTS "AgendaEvent_sourceMessageKind_sourceMessageId_idx"
  ON "AgendaEvent"("sourceMessageKind", "sourceMessageId");

ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "sourceMessageKind" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "sourceMessageId" TEXT;
CREATE INDEX IF NOT EXISTS "Task_sourceMessageKind_sourceMessageId_idx"
  ON "Task"("sourceMessageKind", "sourceMessageId");

ALTER TABLE "FollowUpSheet" ADD COLUMN IF NOT EXISTS "sourceMessageKind" TEXT;
ALTER TABLE "FollowUpSheet" ADD COLUMN IF NOT EXISTS "sourceMessageId" TEXT;
CREATE INDEX IF NOT EXISTS "FollowUpSheet_sourceMessageKind_sourceMessageId_idx"
  ON "FollowUpSheet"("sourceMessageKind", "sourceMessageId");

ALTER TABLE "TaskMessage" ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'USER';
ALTER TABLE "TaskMessage" ADD COLUMN IF NOT EXISTS "payloadJson" JSONB;

ALTER TABLE "DirectMessage" ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'USER';
ALTER TABLE "DirectMessage" ADD COLUMN IF NOT EXISTS "payloadJson" JSONB;

CREATE TABLE IF NOT EXISTS "MessageAction" (
  "id" TEXT PRIMARY KEY,
  "sourceMessageKind" TEXT NOT NULL,
  "sourceMessageId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "title" TEXT NOT NULL,
  "assigneeId" TEXT,
  "dueAt" TIMESTAMP(3),
  "priority" TEXT,
  "createdById" TEXT NOT NULL,
  "agendaEventId" TEXT,
  "taskId" TEXT,
  "followUpSheetId" TEXT,
  "metaJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "completedById" TEXT,
  CONSTRAINT "MessageAction_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "MessageAction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MessageAction_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "MessageAction_assigneeId_status_dueAt_idx" ON "MessageAction"("assigneeId", "status", "dueAt");
CREATE INDEX IF NOT EXISTS "MessageAction_createdById_status_idx" ON "MessageAction"("createdById", "status");
CREATE INDEX IF NOT EXISTS "MessageAction_sourceMessageKind_sourceMessageId_idx" ON "MessageAction"("sourceMessageKind", "sourceMessageId");
CREATE INDEX IF NOT EXISTS "MessageAction_status_dueAt_idx" ON "MessageAction"("status", "dueAt");
