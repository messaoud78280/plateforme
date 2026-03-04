-- Facturation par actions (1 action = 10 min)
-- À exécuter dans Supabase SQL Editor. Après : npx prisma generate

-- User : abonnement + quotas actions
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionPlan" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "monthlyActionsTotal" INTEGER NOT NULL DEFAULT 120;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "monthlyActionsUsed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "actionsResetAt" TIMESTAMP(3);

-- Task : temps passé + actions déduites
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "timeSpentMinutes" INTEGER;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "actionsUsed" INTEGER;

-- Rôle AGENT (assistante) : ajouter à l'enum UserRole (ignorer si déjà présent)
DO $$ BEGIN
  ALTER TYPE "UserRole" ADD VALUE 'AGENT';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
