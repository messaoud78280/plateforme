/**
 * Stratégie de versioning SchedulePlan.
 *
 * - schemaVersion est un littéral entier dans le snapshot canonique.
 * - V1 = SCHEDULE_PLAN_SCHEMA_VERSION (1).
 * - Une évolution de domaine (ex. MILESTONE, SF) = NOUVELLE version (2, 3…).
 * - Pas de migration silencieuse des champs exclus.
 * - Les plans legacy (domainSnapshotJson = null) restent lisibles via tables normalisées.
 * - Lecture future : switch(schemaVersion) → adapter vers le modèle runtime courant.
 */
import { SCHEDULE_PLAN_SCHEMA_VERSION } from "./constants";
import type { SchedulePlanV1 } from "./schema";

export const SUPPORTED_SCHEDULE_PLAN_SCHEMA_VERSIONS = [SCHEDULE_PLAN_SCHEMA_VERSION] as const;

export type SupportedSchedulePlanSchemaVersion =
  (typeof SUPPORTED_SCHEDULE_PLAN_SCHEMA_VERSIONS)[number];

export function isSupportedSchedulePlanSchemaVersion(
  v: unknown,
): v is SupportedSchedulePlanSchemaVersion {
  return v === SCHEDULE_PLAN_SCHEMA_VERSION;
}

/** Snapshot prêt à persister dans PrepSchedulePlan.domainSnapshotJson. */
export function toDomainSnapshotJson(plan: SchedulePlanV1): SchedulePlanV1 {
  return {
    schemaVersion: plan.schemaVersion,
    sourceSnapshot: plan.sourceSnapshot,
    calendar: plan.calendar,
    resources: plan.resources,
    activities: plan.activities,
  };
}
