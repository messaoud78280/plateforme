-- BEWORK SAAS PHASE 1 — socle multi-tenant
-- Additive : préserve toutes les données existantes (SETRIM inclus).

DO $$ BEGIN
  CREATE TYPE "OrganizationKind" AS ENUM ('STANDARD', 'DEMO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "OrganizationSaasStatus" AS ENUM (
    'TRIAL',
    'ACTIVE',
    'TRIAL_EXPIRED',
    'PAST_DUE',
    'SUSPENDED',
    'CANCELED',
    'DELETION_PENDING'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "OrganizationMemberStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Organization"
  ADD COLUMN IF NOT EXISTS "kind" "OrganizationKind" NOT NULL DEFAULT 'STANDARD';

ALTER TABLE "Organization"
  ADD COLUMN IF NOT EXISTS "saasStatus" "OrganizationSaasStatus" NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE "Organization"
  ADD COLUMN IF NOT EXISTS "trialStartedAt" TIMESTAMP(3);

ALTER TABLE "Organization"
  ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);

ALTER TABLE "Organization"
  ADD COLUMN IF NOT EXISTS "onboardingStep" INTEGER;

ALTER TABLE "Organization"
  ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" TIMESTAMP(3);

ALTER TABLE "Organization"
  ADD COLUMN IF NOT EXISTS "onboardingStateJson" JSONB;

CREATE INDEX IF NOT EXISTS "Organization_saasStatus_idx" ON "Organization"("saasStatus");
CREATE INDEX IF NOT EXISTS "Organization_kind_saasStatus_idx" ON "Organization"("kind", "saasStatus");
CREATE INDEX IF NOT EXISTS "Organization_trialEndsAt_idx" ON "Organization"("trialEndsAt");

ALTER TABLE "OrganizationMember"
  ADD COLUMN IF NOT EXISTS "status" "OrganizationMemberStatus" NOT NULL DEFAULT 'ACTIVE';

CREATE INDEX IF NOT EXISTS "OrganizationMember_organizationId_status_idx"
  ON "OrganizationMember"("organizationId", "status");

ALTER TABLE "Invitation"
  ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

CREATE INDEX IF NOT EXISTS "Invitation_organizationId_idx" ON "Invitation"("organizationId");

DO $$ BEGIN
  ALTER TABLE "Invitation"
    ADD CONSTRAINT "Invitation_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Backfill invitations → org du propriétaire invitant
UPDATE "Invitation" i
SET "organizationId" = o."id"
FROM "Organization" o
WHERE i."organizationId" IS NULL
  AND o."ownerUserId" = i."invitedById";

-- Marquer les orgs liées à une DemoEnvironment comme DEMO (SETRIM / bework-demo conservés)
UPDATE "Organization" o
SET "kind" = 'DEMO',
    "saasStatus" = 'ACTIVE'
FROM "DemoEnvironment" d
WHERE d."organizationId" = o."id";

-- Backfill Project.organizationId manquant via clientId = owner
UPDATE "Project" p
SET "organizationId" = o."id"
FROM "Organization" o
WHERE p."organizationId" IS NULL
  AND p."clientId" = o."ownerUserId";

-- Backfill Task.organizationId manquant
UPDATE "Task" t
SET "organizationId" = o."id"
FROM "Organization" o
WHERE t."organizationId" IS NULL
  AND t."clientId" = o."ownerUserId";
