-- SAAS-ADMIN-1 — Administration centrale BeWork
-- Rôle plateforme, journal admin, sessions support.

CREATE TYPE "PlatformRole" AS ENUM ('PLATFORM_ADMIN');
CREATE TYPE "PlatformSupportMode" AS ENUM ('READ_ONLY', 'INTERVENTION');

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "platformRole" "PlatformRole",
  ADD COLUMN IF NOT EXISTS "platformMfaEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "PlatformAdminAuditEvent" (
  "id" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "organizationId" TEXT,
  "action" TEXT NOT NULL,
  "context" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlatformAdminAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PlatformSupportSession" (
  "id" TEXT NOT NULL,
  "adminUserId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "mode" "PlatformSupportMode" NOT NULL,
  "reason" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "endedAt" TIMESTAMP(3),
  "endedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformSupportSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PlatformAdminAuditEvent_createdAt_idx" ON "PlatformAdminAuditEvent"("createdAt");
CREATE INDEX IF NOT EXISTS "PlatformAdminAuditEvent_organizationId_createdAt_idx" ON "PlatformAdminAuditEvent"("organizationId", "createdAt");
CREATE INDEX IF NOT EXISTS "PlatformAdminAuditEvent_actorUserId_createdAt_idx" ON "PlatformAdminAuditEvent"("actorUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "PlatformAdminAuditEvent_action_createdAt_idx" ON "PlatformAdminAuditEvent"("action", "createdAt");

CREATE INDEX IF NOT EXISTS "PlatformSupportSession_adminUserId_endedAt_idx" ON "PlatformSupportSession"("adminUserId", "endedAt");
CREATE INDEX IF NOT EXISTS "PlatformSupportSession_organizationId_endedAt_idx" ON "PlatformSupportSession"("organizationId", "endedAt");
CREATE INDEX IF NOT EXISTS "PlatformSupportSession_endsAt_idx" ON "PlatformSupportSession"("endsAt");

DO $$ BEGIN
  ALTER TABLE "PlatformAdminAuditEvent"
    ADD CONSTRAINT "PlatformAdminAuditEvent_actorUserId_fkey"
    FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PlatformAdminAuditEvent"
    ADD CONSTRAINT "PlatformAdminAuditEvent_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PlatformSupportSession"
    ADD CONSTRAINT "PlatformSupportSession_adminUserId_fkey"
    FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PlatformSupportSession"
    ADD CONSTRAINT "PlatformSupportSession_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
