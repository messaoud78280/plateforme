/**
 * Export JSON Schema du domaine SchedulePlan V1 pour les contextes IA.
 * Dérivé du schéma Zod — pas de duplication manuelle.
 */
import { zodToJsonSchema } from "zod-to-json-schema";
import { SchedulePlanV1Schema } from "./schema";
import { SCHEDULE_PLAN_SCHEMA_VERSION } from "./constants";

let cached: Record<string, unknown> | null = null;

export function getSchedulePlanV1JsonSchema(): Record<string, unknown> {
  if (cached) return cached;
  cached = zodToJsonSchema(SchedulePlanV1Schema, {
    name: "SchedulePlanV1",
    $refStrategy: "none",
  }) as Record<string, unknown>;
  return cached;
}

/** Règles cross-object non exprimables proprement en JSON Schema seul. */
export const SCHEDULE_PLAN_V1_BUSINESS_RULES = [
  "IDs d'activités uniques",
  "pas d'auto-dépendance",
  "prédécesseur doit exister",
  "pas de cycle (DEPENDENCY_CYCLE)",
  "WAIT sans ressource active",
  "TAKEOFF_LINE existante, executable, non indicator",
  "sourceSnapshot cohérent avec sourceContext (SOURCE_STALE)",
  "invariant input = normalized = validated (aucune activité droppée)",
] as const;

export function getSchedulePlanV1AiContractMeta() {
  return {
    schema_version: SCHEDULE_PLAN_SCHEMA_VERSION,
    domain: "SchedulePlan",
    json_schema: getSchedulePlanV1JsonSchema(),
    exclusions_v1: {
      relations: ["SF"],
      kinds: ["MILESTONE"],
    },
    allowed_relations: ["FS", "SS", "FF"],
    allowed_kinds: ["WORK", "CONTROL", "WAIT"],
    business_rules: [...SCHEDULE_PLAN_V1_BUSINESS_RULES],
  };
}
