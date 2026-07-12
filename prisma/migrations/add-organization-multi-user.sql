-- Organisation multi-utilisateurs (Phase A/B)
-- Additive : conserve clientId legacy

CREATE TYPE "OrganizationMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');

CREATE TABLE IF NOT EXISTS "Organization" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "siret" TEXT,
  "ownerUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Organization_ownerUserId_key" ON "Organization"("ownerUserId");
CREATE INDEX IF NOT EXISTS "Organization_ownerUserId_idx" ON "Organization"("ownerUserId");

ALTER TABLE "Organization"
  ADD CONSTRAINT "Organization_ownerUserId_fkey"
  FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "OrganizationMember" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "OrganizationMemberRole" NOT NULL DEFAULT 'MEMBER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "OrganizationMember_organizationId_userId_key"
  ON "OrganizationMember"("organizationId", "userId");
CREATE INDEX IF NOT EXISTS "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");
CREATE INDEX IF NOT EXISTS "OrganizationMember_organizationId_idx" ON "OrganizationMember"("organizationId");

ALTER TABLE "OrganizationMember"
  ADD CONSTRAINT "OrganizationMember_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrganizationMember"
  ADD CONSTRAINT "OrganizationMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
CREATE INDEX IF NOT EXISTS "Project_organizationId_idx" ON "Project"("organizationId");

DO $$ BEGIN
  ALTER TABLE "Project"
    ADD CONSTRAINT "Project_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
CREATE INDEX IF NOT EXISTS "Task_organizationId_idx" ON "Task"("organizationId");

DO $$ BEGIN
  ALTER TABLE "Task"
    ADD CONSTRAINT "Task_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Colonnes validation client (si absentes)
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "clientDecision" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "clientDecisionAt" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "clientDecisionNote" TEXT;
CREATE INDEX IF NOT EXISTS "Task_clientDecision_idx" ON "Task"("clientDecision");

-- RLS défense en profondeur (app via Prisma / service role)
ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrganizationMember" ENABLE ROW LEVEL SECURITY;
