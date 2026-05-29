-- Débit crédits traçable + compte rendu client (missions)
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "creditsDeductedAt" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "clientReport" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "clientReportSentAt" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "clientReportSentById" TEXT;
