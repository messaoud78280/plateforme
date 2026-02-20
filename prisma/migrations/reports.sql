-- Exécuter dans Supabase SQL Editor pour ajouter les tables Report, ReportAttachment, ReportComment
-- Après: npx prisma generate
-- Note : CREATE TYPE ne supporte pas IF NOT EXISTS en PostgreSQL, on utilise un bloc DO

DO $$ BEGIN
  CREATE TYPE "ReportType" AS ENUM ('JOURNALIER', 'HEBDOMADAIRE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Report" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "reportType" "ReportType" NOT NULL DEFAULT 'HEBDOMADAIRE',
  "periodStart" DATE NOT NULL,
  "periodEnd" DATE NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ReportAttachment" (
  "id" TEXT NOT NULL,
  "reportId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "mimeType" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReportAttachment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ReportComment" (
  "id" TEXT NOT NULL,
  "reportId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReportComment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Report" ADD CONSTRAINT "Report_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReportAttachment" ADD CONSTRAINT "ReportAttachment_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReportComment" ADD CONSTRAINT "ReportComment_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReportComment" ADD CONSTRAINT "ReportComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Report_projectId_idx" ON "Report"("projectId");
CREATE INDEX IF NOT EXISTS "Report_periodStart_idx" ON "Report"("periodStart");
CREATE INDEX IF NOT EXISTS "ReportAttachment_reportId_idx" ON "ReportAttachment"("reportId");
CREATE INDEX IF NOT EXISTS "ReportComment_reportId_idx" ON "ReportComment"("reportId");
