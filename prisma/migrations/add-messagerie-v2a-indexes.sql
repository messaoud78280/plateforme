-- MESSAGERIE-V2A : index pour pagination / non-lus (non destructif)
-- Safe to re-run with IF NOT EXISTS

CREATE INDEX IF NOT EXISTS "TaskMessage_taskId_createdAt_idx"
  ON "TaskMessage" ("taskId", "createdAt");

CREATE INDEX IF NOT EXISTS "DirectMessage_receiverId_read_idx"
  ON "DirectMessage" ("receiverId", "read");

CREATE INDEX IF NOT EXISTS "Message_receiverId_read_idx"
  ON "Message" ("receiverId", "read");
