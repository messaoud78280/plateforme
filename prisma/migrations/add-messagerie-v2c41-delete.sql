-- MESSAGERIE-V2C.4.1 — Soft-delete « pour tous » + masquage « pour moi »
-- Non destructif : records et fichiers Storage conservés.

ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "deletedById" TEXT;
CREATE INDEX IF NOT EXISTS "Message_deletedAt_idx" ON "Message"("deletedAt");

ALTER TABLE "DirectMessage" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "DirectMessage" ADD COLUMN IF NOT EXISTS "deletedById" TEXT;
CREATE INDEX IF NOT EXISTS "DirectMessage_deletedAt_idx" ON "DirectMessage"("deletedAt");

ALTER TABLE "TaskMessage" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "TaskMessage" ADD COLUMN IF NOT EXISTS "deletedById" TEXT;
CREATE INDEX IF NOT EXISTS "TaskMessage_deletedAt_idx" ON "TaskMessage"("deletedAt");

CREATE TABLE IF NOT EXISTS "MessageUserHide" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "messageKind" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MessageUserHide_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MessageUserHide_userId_messageKind_messageId_key"
  ON "MessageUserHide"("userId", "messageKind", "messageId");
CREATE INDEX IF NOT EXISTS "MessageUserHide_userId_messageKind_idx"
  ON "MessageUserHide"("userId", "messageKind");
CREATE INDEX IF NOT EXISTS "MessageUserHide_messageKind_messageId_idx"
  ON "MessageUserHide"("messageKind", "messageId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'MessageUserHide_userId_fkey'
  ) THEN
    ALTER TABLE "MessageUserHide"
      ADD CONSTRAINT "MessageUserHide_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
