-- MESSAGERIE-V2C.6 — Canaux chantier par acteurs (périmètres de confidentialité)

CREATE TABLE IF NOT EXISTS "ProjectChannel" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "externalOrganizationId" TEXT,
  "dedupeKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectChannel_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProjectChannel_dedupeKey_key" ON "ProjectChannel"("dedupeKey");
CREATE INDEX IF NOT EXISTS "ProjectChannel_projectId_type_idx" ON "ProjectChannel"("projectId", "type");
CREATE INDEX IF NOT EXISTS "ProjectChannel_externalOrganizationId_idx" ON "ProjectChannel"("externalOrganizationId");

DO $$ BEGIN
  ALTER TABLE "ProjectChannel"
    ADD CONSTRAINT "ProjectChannel_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ProjectChannel"
    ADD CONSTRAINT "ProjectChannel_externalOrganizationId_fkey"
    FOREIGN KEY ("externalOrganizationId") REFERENCES "ExternalOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ProjectChannelParticipant" (
  "id" TEXT NOT NULL,
  "channelId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "addedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectChannelParticipant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProjectChannelParticipant_channelId_userId_key"
  ON "ProjectChannelParticipant"("channelId", "userId");
CREATE INDEX IF NOT EXISTS "ProjectChannelParticipant_userId_idx" ON "ProjectChannelParticipant"("userId");
CREATE INDEX IF NOT EXISTS "ProjectChannelParticipant_channelId_idx" ON "ProjectChannelParticipant"("channelId");

DO $$ BEGIN
  ALTER TABLE "ProjectChannelParticipant"
    ADD CONSTRAINT "ProjectChannelParticipant_channelId_fkey"
    FOREIGN KEY ("channelId") REFERENCES "ProjectChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ProjectChannelParticipant"
    ADD CONSTRAINT "ProjectChannelParticipant_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ProjectChannelParticipant"
    ADD CONSTRAINT "ProjectChannelParticipant_addedById_fkey"
    FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "channelId" TEXT;

CREATE INDEX IF NOT EXISTS "Message_channelId_createdAt_idx" ON "Message"("channelId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "Message"
    ADD CONSTRAINT "Message_channelId_fkey"
    FOREIGN KEY ("channelId") REFERENCES "ProjectChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "MessageChannelReceipt" (
  "id" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MessageChannelReceipt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MessageChannelReceipt_messageId_userId_key"
  ON "MessageChannelReceipt"("messageId", "userId");
CREATE INDEX IF NOT EXISTS "MessageChannelReceipt_userId_read_idx"
  ON "MessageChannelReceipt"("userId", "read");
CREATE INDEX IF NOT EXISTS "MessageChannelReceipt_messageId_idx"
  ON "MessageChannelReceipt"("messageId");

DO $$ BEGIN
  ALTER TABLE "MessageChannelReceipt"
    ADD CONSTRAINT "MessageChannelReceipt_messageId_fkey"
    FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "MessageChannelReceipt"
    ADD CONSTRAINT "MessageChannelReceipt_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
