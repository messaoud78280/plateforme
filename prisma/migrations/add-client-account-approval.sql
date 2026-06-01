-- Validation inscription client avant accès plateforme
DO $$ BEGIN
  CREATE TYPE "ClientAccountStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accountStatus" "ClientAccountStatus" NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "approvedById" TEXT;

UPDATE "User" SET "accountStatus" = 'APPROVED' WHERE "accountStatus" IS NULL;

DO $$ BEGIN
  ALTER TABLE "User" ADD CONSTRAINT "User_approvedById_fkey"
    FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
