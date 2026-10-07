/**
 * Constantes SchedulePlan V1 — alignées sur le schéma Zod (source de vérité).
 * Pas de SF, pas de MILESTONE en V1.
 */

/** Version produite par les nouveaux CREATE. La lecture V1 reste supportée. */
export const SCHEDULE_PLAN_SCHEMA_VERSION_V1 = 1 as const;
export const SCHEDULE_PLAN_SCHEMA_VERSION = 2 as const;
export const SCHEDULE_PLAN_SCHEMA_VERSIONS = [
  SCHEDULE_PLAN_SCHEMA_VERSION_V1,
  SCHEDULE_PLAN_SCHEMA_VERSION,
] as const;

export const SCHEDULE_ACTIVITY_KINDS_V1 = ["WORK", "CONTROL", "WAIT"] as const;
export type ScheduleActivityKindV1 = (typeof SCHEDULE_ACTIVITY_KINDS_V1)[number];

export const SCHEDULE_RELATIONS_V1 = ["FS", "SS", "FF"] as const;
export type ScheduleRelationV1 = (typeof SCHEDULE_RELATIONS_V1)[number];

/** Explicitement exclus de V1 — toute apparition = ERROR. */
export const SCHEDULE_RELATION_EXCLUDED_V1 = ["SF"] as const;
export const SCHEDULE_KIND_EXCLUDED_V1 = ["MILESTONE"] as const;

export const SCHEDULE_SOURCE_LINK_TYPES_V1 = [
  "TAKEOFF_LINE",
  "QUOTE_ITEM",
  "MANUAL",
] as const;
export type ScheduleSourceLinkTypeV1 = (typeof SCHEDULE_SOURCE_LINK_TYPES_V1)[number];

export const SCHEDULE_DURATION_MODES_V1 = ["FIXED", "PRODUCTIVITY"] as const;
export type ScheduleDurationModeV1 = (typeof SCHEDULE_DURATION_MODES_V1)[number];

export const SCHEDULE_DURATION_ROUNDINGS_V1 = [
  "ceil_half_day",
  "ceil_day",
  "none",
] as const;

export const SCHEDULE_RATE_PER_V1 = ["equipe", "engin"] as const;
export const SCHEDULE_CALENDAR_KIND_V1 = ["working", "calendar"] as const;
