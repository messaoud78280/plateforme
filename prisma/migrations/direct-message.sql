-- Migration : table DirectMessage pour messages directs gérant/agent
-- Exécuter dans Supabase SQL Editor si la migration Prisma n'est pas appliquée

CREATE TABLE IF NOT EXISTS "DirectMessage" (
  "id" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "receiverId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "attachmentsJson" JSONB,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DirectMessage_senderId_idx" ON "DirectMessage"("senderId");
CREATE INDEX IF NOT EXISTS "DirectMessage_receiverId_idx" ON "DirectMessage"("receiverId");

ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
