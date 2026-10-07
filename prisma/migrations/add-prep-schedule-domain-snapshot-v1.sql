-- SchedulePlan domaine snapshot — additif, idempotent
-- Colonne dédiée PrepSchedulePlan.domainSnapshotJson
-- NE PAS réutiliser summaryJson.
-- Plans legacy : domainSnapshotJson reste NULL.
-- NE PAS APPLIQUER en production sans accord explicite (Phase 8+).

ALTER TABLE "PrepSchedulePlan"
  ADD COLUMN IF NOT EXISTS "domainSnapshotJson" JSONB;

COMMENT ON COLUMN "PrepSchedulePlan"."domainSnapshotJson" IS
  'Snapshot canonique SchedulePlan (schemaVersion, sourceSnapshot, calendar, resources, activities). Nullable pour plans legacy.';
