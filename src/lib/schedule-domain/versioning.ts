/**
 * Stratégie de versioning SchedulePlan.
 *
 * - schemaVersion est un littéral entier dans le snapshot canonique.
 * - V1 reste lisible ; V2 est la version produite courante.
 * - Une évolution de domaine (ex. MILESTONE, SF) = NOUVELLE version (2, 3…).
 * - Pas de migration silencieuse des champs exclus.
 * - Les plans legacy (domainSnapshotJson = null) restent lisibles via tables normalisées.
 * - Lecture future : switch(schemaVersion) → adapter vers le modèle runtime courant.
 */
import {
  SCHEDULE_PLAN_SCHEMA_VERSION,
  SCHEDULE_PLAN_SCHEMA_VERSION_V1,
} from "./constants";
import type { SchedulePlan } from "./schema";

export const SUPPORTED_SCHEDULE_PLAN_SCHEMA_VERSIONS = [
  SCHEDULE_PLAN_SCHEMA_VERSION_V1,
  SCHEDULE_PLAN_SCHEMA_VERSION,
] as const;

export type SupportedSchedulePlanSchemaVersion =
  (typeof SUPPORTED_SCHEDULE_PLAN_SCHEMA_VERSIONS)[number];

export function isSupportedSchedulePlanSchemaVersion(
  v: unknown,
): v is SupportedSchedulePlanSchemaVersion {
  return (SUPPORTED_SCHEDULE_PLAN_SCHEMA_VERSIONS as readonly unknown[]).includes(v);
}

/** Snapshot prêt à persister dans PrepSchedulePlan.domainSnapshotJson. */
export function toDomainSnapshotJson(plan: SchedulePlan): SchedulePlan {
  return plan;
}
