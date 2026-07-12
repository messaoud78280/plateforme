-- Pilotage travaux — cockpit : santé, jalons, blocages
-- Appliqué sur Supabase (projet jaxgjtryrnlyelniisrf) le 2026-07-12

ALTER TABLE "WorksitePilotage" ADD COLUMN IF NOT EXISTS "healthScore" INTEGER;
ALTER TABLE "WorksitePilotage" ADD COLUMN IF NOT EXISTS "healthLabel" TEXT;
ALTER TABLE "WorksitePilotage" ADD COLUMN IF NOT EXISTS "healthUpdatedAt" TIMESTAMP(3);
ALTER TABLE "WorksitePilotage" ADD COLUMN IF NOT EXISTS "serviceLevel" TEXT NOT NULL DEFAULT 'ESSENTIEL';

CREATE TABLE IF NOT EXISTS "PilotageMilestone" (
  "id" TEXT NOT NULL,
  "pilotageId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'Travaux',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "plannedAt" DATE,
  "actualAt" DATE,
  "responsibleName" TEXT,
  "validatorName" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Non démarré',
  "progressPct" INTEGER NOT NULL DEFAULT 0,
  "prerequisites" TEXT,
  "proofUrl" TEXT,
  "sourceType" TEXT NOT NULL DEFAULT 'Modèle BeWork',
  "verificationStatus" TEXT NOT NULL DEFAULT 'À vérifier',
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PilotageMilestone_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PilotageMilestone_pilotageId_sortOrder_idx" ON "PilotageMilestone"("pilotageId", "sortOrder");
CREATE INDEX IF NOT EXISTS "PilotageMilestone_pilotageId_status_idx" ON "PilotageMilestone"("pilotageId", "status");
CREATE INDEX IF NOT EXISTS "PilotageMilestone_plannedAt_idx" ON "PilotageMilestone"("plannedAt");

DO $$ BEGIN
  ALTER TABLE "PilotageMilestone" ADD CONSTRAINT "PilotageMilestone_pilotageId_fkey"
    FOREIGN KEY ("pilotageId") REFERENCES "WorksitePilotage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "PilotageBlocker" (
  "id" TEXT NOT NULL,
  "pilotageId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'Important',
  "originType" TEXT,
  "originId" TEXT,
  "originLabel" TEXT,
  "consequence" TEXT,
  "impactedMilestone" TEXT,
  "internalOwner" TEXT,
  "externalDecider" TEXT,
  "nextAction" TEXT,
  "nextFollowUpAt" DATE,
  "priority" TEXT NOT NULL DEFAULT 'Haute',
  "status" TEXT NOT NULL DEFAULT 'Ouvert',
  "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PilotageBlocker_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PilotageBlocker_pilotageId_status_idx" ON "PilotageBlocker"("pilotageId", "status");
CREATE INDEX IF NOT EXISTS "PilotageBlocker_severity_idx" ON "PilotageBlocker"("severity");
CREATE INDEX IF NOT EXISTS "PilotageBlocker_openedAt_idx" ON "PilotageBlocker"("openedAt");

DO $$ BEGIN
  ALTER TABLE "PilotageBlocker" ADD CONSTRAINT "PilotageBlocker_pilotageId_fkey"
    FOREIGN KEY ("pilotageId") REFERENCES "WorksitePilotage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
