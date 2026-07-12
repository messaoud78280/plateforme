-- Liens de démonstration commerciale Pilotage (isolés des tables métier)
CREATE TABLE IF NOT EXISTS "DemoPilotageLink" (
  "id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "scenarioId" TEXT NOT NULL DEFAULT 'go-logements-public',
  "prospectName" TEXT,
  "prospectCompany" TEXT,
  "accessCodeHash" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "maxViews" INTEGER,
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "firstViewedAt" TIMESTAMP(3),
  "lastViewedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "personalization" JSONB,
  "sectionsVisited" JSONB,
  "interests" JSONB,
  "interestNote" TEXT,
  "commercialNotes" TEXT,
  "sandboxResetAt" TIMESTAMP(3),
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DemoPilotageLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DemoPilotageLink_token_key" ON "DemoPilotageLink"("token");
CREATE INDEX IF NOT EXISTS "DemoPilotageLink_status_idx" ON "DemoPilotageLink"("status");
CREATE INDEX IF NOT EXISTS "DemoPilotageLink_expiresAt_idx" ON "DemoPilotageLink"("expiresAt");
CREATE INDEX IF NOT EXISTS "DemoPilotageLink_createdById_idx" ON "DemoPilotageLink"("createdById");
CREATE INDEX IF NOT EXISTS "DemoPilotageLink_prospectCompany_idx" ON "DemoPilotageLink"("prospectCompany");

DO $$ BEGIN
  ALTER TABLE "DemoPilotageLink" ADD CONSTRAINT "DemoPilotageLink_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
