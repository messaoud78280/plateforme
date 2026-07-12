-- Migration Pilotage administratif des travaux
-- À appliquer en développement / staging via : npx prisma db push
-- ou exécution SQL manuelle sur PostgreSQL.

CREATE TYPE "PilotageStatus" AS ENUM (
  'A_PREPARER',
  'EN_COURS',
  'SOUS_SURVEILLANCE',
  'BLOQUE',
  'TERMINE',
  'ARCHIVE'
);

-- Les tables détaillées sont générées par Prisma.
-- Préférer : NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma db push
