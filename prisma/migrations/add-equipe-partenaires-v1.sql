-- V1 Utilisateurs & accès / Équipe & partenaires
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "personType" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accessStatus" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "permissionProfile" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "jobTitle" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "externalOrganizationId" TEXT;

ALTER TABLE "Invitation" ADD COLUMN IF NOT EXISTS "personType" TEXT;
ALTER TABLE "Invitation" ADD COLUMN IF NOT EXISTS "permissionProfile" TEXT;
ALTER TABLE "Invitation" ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE "Invitation" ADD COLUMN IF NOT EXISTS "lastName" TEXT;
ALTER TABLE "Invitation" ADD COLUMN IF NOT EXISTS "companyName" TEXT;
ALTER TABLE "Invitation" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "Invitation" ADD COLUMN IF NOT EXISTS "jobTitle" TEXT;
ALTER TABLE "Invitation" ADD COLUMN IF NOT EXISTS "projectIdsJson" JSONB;
ALTER TABLE "Invitation" ADD COLUMN IF NOT EXISTS "externalOrganizationId" TEXT;

CREATE TABLE IF NOT EXISTS "ExternalOrganization" (
  "id" TEXT NOT NULL,
  "hostOrganizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExternalOrganization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProjectAccess" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "scopesJson" JSONB,
  "grantedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectAccess_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AccessAuditLog" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT,
  "actorUserId" TEXT,
  "targetUserId" TEXT,
  "action" TEXT NOT NULL,
  "detail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccessAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ExternalOrganization_hostOrganizationId_idx" ON "ExternalOrganization"("hostOrganizationId");
CREATE INDEX IF NOT EXISTS "ExternalOrganization_hostOrganizationId_type_idx" ON "ExternalOrganization"("hostOrganizationId", "type");
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectAccess_projectId_userId_key" ON "ProjectAccess"("projectId", "userId");
CREATE INDEX IF NOT EXISTS "ProjectAccess_userId_idx" ON "ProjectAccess"("userId");
CREATE INDEX IF NOT EXISTS "ProjectAccess_projectId_idx" ON "ProjectAccess"("projectId");
CREATE INDEX IF NOT EXISTS "AccessAuditLog_organizationId_createdAt_idx" ON "AccessAuditLog"("organizationId", "createdAt");
CREATE INDEX IF NOT EXISTS "AccessAuditLog_targetUserId_createdAt_idx" ON "AccessAuditLog"("targetUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "User_externalOrganizationId_idx" ON "User"("externalOrganizationId");

DO $$ BEGIN
  ALTER TABLE "ExternalOrganization"
    ADD CONSTRAINT "ExternalOrganization_hostOrganizationId_fkey"
    FOREIGN KEY ("hostOrganizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "User"
    ADD CONSTRAINT "User_externalOrganizationId_fkey"
    FOREIGN KEY ("externalOrganizationId") REFERENCES "ExternalOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ProjectAccess"
    ADD CONSTRAINT "ProjectAccess_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ProjectAccess"
    ADD CONSTRAINT "ProjectAccess_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ProjectAccess"
    ADD CONSTRAINT "ProjectAccess_grantedById_fkey"
    FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "AccessAuditLog"
    ADD CONSTRAINT "AccessAuditLog_actorUserId_fkey"
    FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "AccessAuditLog"
    ADD CONSTRAINT "AccessAuditLog_targetUserId_fkey"
    FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
