-- Validation client après transmission du compte rendu (P1 hub d'échange)
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "clientDecision" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "clientDecisionAt" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "clientDecisionNote" TEXT;

CREATE INDEX IF NOT EXISTS "Task_clientDecision_idx" ON "Task"("clientDecision");
