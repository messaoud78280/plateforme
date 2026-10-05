-- Soft archive chantier (Project) — pattern PrepStudy / WorksitePilotage
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "archivedById" TEXT;
CREATE INDEX IF NOT EXISTS "Project_organizationId_archivedAt_idx" ON "Project"("organizationId", "archivedAt");
CREATE INDEX IF NOT EXISTS "Project_archivedAt_idx" ON "Project"("archivedAt");
