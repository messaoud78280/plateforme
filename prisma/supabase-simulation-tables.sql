-- Tables et colonnes pour la simulation TaskFlow Solutions
-- Exécuter après les scripts de base (supabase-add-documents-tasks, etc.)
-- Ajoute : TaskComment, Invoice, Metric, colonnes User (company, phone), UserRole MANAGER, Activity (projectId, metadata)

-- 1. Étendre UserRole avec MANAGER (ignorer si déjà présent)
DO $$ BEGIN
  ALTER TYPE "UserRole" ADD VALUE 'MANAGER';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Colonnes User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "company" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;

-- 3. Colonnes Activity
ALTER TABLE "Activity" DROP COLUMN IF EXISTS "projectId";
ALTER TABLE "Activity" ADD COLUMN IF NOT EXISTS "projectId" TEXT;
ALTER TABLE "Activity" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Activity_projectId_fkey'
    AND table_name = 'Activity'
  ) THEN
    ALTER TABLE "Activity"
    ADD CONSTRAINT "Activity_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 4. Table TaskComment
CREATE TABLE IF NOT EXISTS "TaskComment" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "TaskComment_taskId_idx" ON "TaskComment"("taskId");

-- 5. Enum InvoiceStatus
DO $$ BEGIN
  CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 6. Table Invoice
CREATE TABLE IF NOT EXISTS "Invoice" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "invoiceNumber" TEXT NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
  "issueDate" TIMESTAMP(3) NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "paidDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Invoice_invoiceNumber_key" UNIQUE ("invoiceNumber")
);

ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Invoice_projectId_idx" ON "Invoice"("projectId");

-- 7. Table Metric
CREATE TABLE IF NOT EXISTS "Metric" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "metricDate" TIMESTAMP(3) NOT NULL,
  "metricType" TEXT NOT NULL,
  "metricData" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Metric_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Metric" ADD CONSTRAINT "Metric_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Metric_projectId_idx" ON "Metric"("projectId");
CREATE INDEX IF NOT EXISTS "Metric_projectId_metricDate_idx" ON "Metric"("projectId", "metricDate");
