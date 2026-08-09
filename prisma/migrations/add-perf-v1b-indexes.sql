-- PERF-V1B : index observés (non destructif)
-- Notification badge / inbox
CREATE INDEX IF NOT EXISTS "Notification_userId_read_createdAt_idx"
  ON "Notification" ("userId", "read", "createdAt");

-- Direct messages timeline
CREATE INDEX IF NOT EXISTS "DirectMessage_receiverId_createdAt_idx"
  ON "DirectMessage" ("receiverId", "createdAt");

-- TaskMessage unread groupBy already covered by receiverId + V2A taskId_createdAt
CREATE INDEX IF NOT EXISTS "TaskMessage_receiverId_read_idx"
  ON "TaskMessage" ("receiverId", "read");
