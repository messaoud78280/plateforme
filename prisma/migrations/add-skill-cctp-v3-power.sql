ALTER TABLE "SkillCctpSession" ADD COLUMN IF NOT EXISTS "generationMode" TEXT NOT NULL DEFAULT 'redaction';
ALTER TABLE "SkillCctpSession" ADD COLUMN IF NOT EXISTS "marketProfile" TEXT;
ALTER TABLE "SkillCctpSession" ADD COLUMN IF NOT EXISTS "meta" JSONB;
