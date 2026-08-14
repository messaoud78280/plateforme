-- GED V2 — indexes recherche / filtres (pas de nouvelle table)
CREATE INDEX IF NOT EXISTS "ChantierFile_projectId_createdAt_idx"
  ON "ChantierFile" ("projectId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "ChantierFile_status_deletedAt_idx"
  ON "ChantierFile" ("status", "deletedAt");
