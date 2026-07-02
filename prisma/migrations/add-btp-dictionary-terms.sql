-- Dico BTP — lexique interne (PostgreSQL / Supabase)
-- Définitions, acronymes et explications techniques par lot travaux.

CREATE TABLE IF NOT EXISTS "BtpDictionaryTerm" (
    "id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "acronym" TEXT,
    "lotCode" TEXT,
    "lotName" TEXT,
    "family" TEXT,
    "category" TEXT,
    "shortDefinition" TEXT NOT NULL,
    "beginnerExplanation" TEXT,
    "usageExample" TEXT,
    "keywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "synonyms" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "vigilancePoints" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "linkedDocuments" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "level" TEXT NOT NULL DEFAULT 'débutant',
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'à vérifier',
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BtpDictionaryTerm_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BtpDictionaryTerm_term_idx" ON "BtpDictionaryTerm"("term");
CREATE INDEX IF NOT EXISTS "BtpDictionaryTerm_lotCode_idx" ON "BtpDictionaryTerm"("lotCode");
CREATE INDEX IF NOT EXISTS "BtpDictionaryTerm_family_idx" ON "BtpDictionaryTerm"("family");
CREATE INDEX IF NOT EXISTS "BtpDictionaryTerm_category_idx" ON "BtpDictionaryTerm"("category");
CREATE INDEX IF NOT EXISTS "BtpDictionaryTerm_status_idx" ON "BtpDictionaryTerm"("status");
CREATE INDEX IF NOT EXISTS "BtpDictionaryTerm_updatedAt_idx" ON "BtpDictionaryTerm"("updatedAt");

-- Recherche sur les tableaux (mots-clés / synonymes).
CREATE INDEX IF NOT EXISTS "BtpDictionaryTerm_keywords_idx" ON "BtpDictionaryTerm" USING GIN ("keywords");
CREATE INDEX IF NOT EXISTS "BtpDictionaryTerm_synonyms_idx" ON "BtpDictionaryTerm" USING GIN ("synonyms");
