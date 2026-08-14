-- GED V2.0.3 — documents entreprise sans chantier.
-- projectId / folderId optionnels. organizationId = frontière de sécurité.

ALTER TABLE "ChantierFile" ALTER COLUMN "projectId" DROP NOT NULL;

ALTER TABLE "ChantierFile" ALTER COLUMN "folderId" DROP NOT NULL;

ALTER TABLE "ChantierFile" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

UPDATE "ChantierFile" cf
SET "organizationId" = p."organizationId"
FROM "Project" p
WHERE cf."projectId" = p."id"
  AND cf."organizationId" IS NULL
  AND p."organizationId" IS NOT NULL;

UPDATE "ChantierFile" cf
SET "organizationId" = o.id
FROM "Project" p
JOIN "Organization" o ON o."ownerUserId" = p."clientId"
WHERE cf."projectId" = p."id"
  AND cf."organizationId" IS NULL;

ALTER TABLE "ChantierFile" DROP CONSTRAINT IF EXISTS "ChantierFile_organizationId_fkey";

ALTER TABLE "ChantierFile"
  ADD CONSTRAINT "ChantierFile_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "ChantierFile_organizationId_idx"
  ON "ChantierFile" ("organizationId");

CREATE INDEX IF NOT EXISTS "ChantierFile_organizationId_createdAt_idx"
  ON "ChantierFile" ("organizationId", "createdAt");
