ALTER TABLE "SkillPpspsSession" ADD COLUMN IF NOT EXISTS "projectId" TEXT;
ALTER TABLE "SkillPpspsSession" ADD COLUMN IF NOT EXISTS "generationMode" TEXT NOT NULL DEFAULT 'analyse_risques';
ALTER TABLE "SkillPpspsSession" ADD COLUMN IF NOT EXISTS "linkedDocumentId" TEXT;

CREATE INDEX IF NOT EXISTS "SkillPpspsSession_projectId_idx" ON "SkillPpspsSession"("projectId");

DO $$ BEGIN
  ALTER TABLE "SkillPpspsSession"
    ADD CONSTRAINT "SkillPpspsSession_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
