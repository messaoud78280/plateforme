-- Additive: NOTICE document kind + planning task execution + follow-up ↔ plan link
-- Non-destructive.

DO $$ BEGIN
  ALTER TYPE "SiteDocumentKind" ADD VALUE IF NOT EXISTS 'NOTICE';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "PrepScheduleTask"
  ADD COLUMN IF NOT EXISTS "executionStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
  ADD COLUMN IF NOT EXISTS "progressPercent" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "actualStartDate" DATE,
  ADD COLUMN IF NOT EXISTS "actualEndDate" DATE,
  ADD COLUMN IF NOT EXISTS "executionNotes" TEXT,
  ADD COLUMN IF NOT EXISTS "executionPhotosJson" JSONB,
  ADD COLUMN IF NOT EXISTS "executionReservesJson" JSONB;

ALTER TABLE "FollowUpSheet"
  ADD COLUMN IF NOT EXISTS "prepSchedulePlanId" TEXT;

CREATE INDEX IF NOT EXISTS "FollowUpSheet_prepSchedulePlanId_idx"
  ON "FollowUpSheet"("prepSchedulePlanId");

DO $$ BEGIN
  ALTER TABLE "FollowUpSheet"
    ADD CONSTRAINT "FollowUpSheet_prepSchedulePlanId_fkey"
    FOREIGN KEY ("prepSchedulePlanId") REFERENCES "PrepSchedulePlan"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
