/**
 * Contrat externe IA — bework_schedule_ai_v1.
 * Volontairement simple. L’IA ne génère PAS SchedulePlan interne.
 * PRODUCTIVITY exclu du format IA v1 (domaine interne le conserve).
 */
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  SCHEDULE_ACTIVITY_KINDS_V1,
  SCHEDULE_KIND_EXCLUDED_V1,
  SCHEDULE_RELATION_EXCLUDED_V1,
  SCHEDULE_RELATIONS_V1,
} from "./constants";
import type { DomainIssue } from "./schema";
import { zodIssuesToDomainIssues } from "./schema";

export const BEWORK_SCHEDULE_AI_FORMAT = "bework_schedule_ai_v1" as const;
export const BEWORK_SCHEDULE_AI_FORMAT_V2 = "bework_schedule_ai_v2" as const;

const nonEmpty = z.string().trim().min(1);

const AiKindSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toUpperCase() : value),
  z.enum(SCHEDULE_ACTIVITY_KINDS_V1, {
    errorMap: (_issue, ctx) => {
      const data = String(ctx.data ?? "");
      if ((SCHEDULE_KIND_EXCLUDED_V1 as readonly string[]).includes(data)) {
        return {
          message:
            "Kind MILESTONE exclu de bework_schedule_ai_v1 — kinds autorisés : WORK, CONTROL, WAIT",
        };
      }
      return {
        message: `Kind invalide « ${data} » — autorisés : WORK, CONTROL, WAIT`,
      };
    },
  }),
);

const AiRelationSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toUpperCase() : value),
  z.enum(SCHEDULE_RELATIONS_V1, {
    errorMap: (_issue, ctx) => {
      const data = String(ctx.data ?? "");
      if ((SCHEDULE_RELATION_EXCLUDED_V1 as readonly string[]).includes(data)) {
        return {
          message:
            "Relation SF exclue de bework_schedule_ai_v1 — relations autorisées : FS, SS, FF",
        };
      }
      return {
        message: `Relation invalide « ${data} » — autorisées : FS, SS, FF`,
      };
    },
  }),
);

export const AiScheduleAfterSchema = z.object({
  id: nonEmpty,
  type: AiRelationSchema,
  lag_days: z.number().finite().default(0),
});

export const AiScheduleCrewSchema = z
  .object({
    id: nonEmpty,
    size: z.number().int().positive().optional(),
  })
  .nullable()
  .optional();

export const AiScheduleActivityV1Schema = z
  .object({
    id: nonEmpty,
    name: nonEmpty,
    kind: AiKindSchema,
    duration_days: z.number().finite().nonnegative(),
    takeoff_codes: z.array(nonEmpty).optional().default([]),
    crew: AiScheduleCrewSchema,
    after: z.array(AiScheduleAfterSchema).default([]),
    notes: z.string().optional(),
  })
  .superRefine((act, ctx) => {
    if (act.kind === "WAIT" && act.crew != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["crew"],
        message: `WAIT ${act.id} ne doit pas recevoir de crew actif`,
      });
    }
  });

export const AiScheduleBundleV1Schema = z
  .object({
    format: z.literal(BEWORK_SCHEDULE_AI_FORMAT),
    activities: z
      .array(AiScheduleActivityV1Schema)
      .min(1, "Au moins une activité requise"),
  })
  .superRefine((bundle, ctx) => {
    const seen = new Set<string>();
    for (let i = 0; i < bundle.activities.length; i++) {
      const id = bundle.activities[i]!.id;
      if (seen.has(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["activities", i, "id"],
          message: `ID activité en double : ${id}`,
        });
      }
      seen.add(id);
    }
  });

export type AiScheduleBundleV1 = z.infer<typeof AiScheduleBundleV1Schema>;
export type AiScheduleActivityV1 = z.infer<typeof AiScheduleActivityV1Schema>;

const AiNamedResourceV2Schema = z.object({
  id: nonEmpty,
  label: nonEmpty,
  count: z.number().finite().nonnegative().default(1),
  note: z.string().nullable().optional(),
});

const AiCrewMemberV2Schema = z.object({
  labor_id: nonEmpty,
  role: nonEmpty,
  count: z.number().finite().positive().default(1),
});

const AiTechnicalReferenceV2Schema = z.object({
  code: nonEmpty,
  label: z.string().trim().min(1).nullable().optional(),
  applicability: z
    .enum(["INDICATIVE", "CONTRACTUAL", "TO_CONFIRM"])
    .default("INDICATIVE"),
  source_url: z.string().url().nullable().optional(),
  note: z.string().nullable().optional(),
});

const AiDurationBasisV2Schema = z.object({
  provenance: z.enum([
    "SOURCE_DATA",
    "PLANNING_ASSUMPTION",
    "USER_DECISION",
    "PRODUCTIVITY_RATE",
  ]),
  min_days: z.number().finite().nonnegative().nullable().optional(),
  max_days: z.number().finite().nonnegative().nullable().optional(),
  rationale: z.string().trim().min(1).nullable().optional(),
  to_validate: z.boolean().default(true),
});

export const AiScheduleActivityV2Schema = AiScheduleActivityV1Schema.innerType()
  .extend({
    lot: z.string().trim().min(1).nullable().optional(),
    phase: z.string().trim().min(1).nullable().optional(),
    crew: z
      .object({
        id: nonEmpty,
        size: z.number().int().positive().optional(),
        members: z.array(AiCrewMemberV2Schema).default([]),
      })
      .nullable()
      .optional(),
    equipment: z.array(AiNamedResourceV2Schema).default([]),
    supplies: z.array(AiNamedResourceV2Schema).default([]),
    preconditions: z.array(nonEmpty).default([]),
    controls: z.array(nonEmpty).default([]),
    constraints: z.array(nonEmpty).default([]),
    safety: z.array(nonEmpty).default([]),
    proofs: z.array(nonEmpty).default([]),
    technical_references: z.array(AiTechnicalReferenceV2Schema).default([]),
    assumptions: z.array(nonEmpty).default([]),
    duration_basis: AiDurationBasisV2Schema.nullable().optional(),
    hold_point: z.boolean().default(false),
  })
  .superRefine((act, ctx) => {
    if (
      act.kind === "WAIT" &&
      (act.crew != null || act.equipment.some((item) => item.count > 0))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["crew"],
        message: `WAIT ${act.id} ne doit pas recevoir de ressource active`,
      });
    }
  });

export const AiScheduleBundleV2Schema = z.object({
  format: z.literal(BEWORK_SCHEDULE_AI_FORMAT_V2),
  activities: z
    .array(AiScheduleActivityV2Schema)
    .min(1, "Au moins une activité requise"),
}).superRefine((bundle, ctx) => {
  const seen = new Set<string>();
  bundle.activities.forEach((activity, index) => {
    if (seen.has(activity.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["activities", index, "id"],
        message: `ID activité en double : ${activity.id}`,
      });
    }
    seen.add(activity.id);
  });
});

export type AiScheduleBundleV2 = z.infer<typeof AiScheduleBundleV2Schema>;
export type AiScheduleActivityV2 = z.infer<typeof AiScheduleActivityV2Schema>;
export type AiScheduleBundle = AiScheduleBundleV1 | AiScheduleBundleV2;

export type ParseAiScheduleResult =
  | { ok: true; bundle: AiScheduleBundleV1; inputActivityCount: number }
  | { ok: false; issues: DomainIssue[]; inputActivityCount: number };

export function parseAiScheduleBundleV1(input: unknown): ParseAiScheduleResult {
  const inputActivityCount =
    input &&
    typeof input === "object" &&
    !Array.isArray(input) &&
    Array.isArray((input as { activities?: unknown }).activities)
      ? (input as { activities: unknown[] }).activities.length
      : 0;

  if (input == null || typeof input !== "object" || Array.isArray(input)) {
    return {
      ok: false,
      inputActivityCount,
      issues: [
        {
          code: "INVALID_AI_ROOT",
          path: "",
          value: input,
          message: `Format attendu : ${BEWORK_SCHEDULE_AI_FORMAT}`,
          severity: "ERROR",
        },
      ],
    };
  }

  const format = String((input as { format?: unknown }).format ?? "");
  if (format && format !== BEWORK_SCHEDULE_AI_FORMAT) {
    return {
      ok: false,
      inputActivityCount,
      issues: [
        {
          code: "UNKNOWN_AI_FORMAT",
          path: "format",
          value: format,
          message: `Format attendu : ${BEWORK_SCHEDULE_AI_FORMAT} (reçu : ${format})`,
          severity: "ERROR",
        },
      ],
    };
  }

  const parsed = AiScheduleBundleV1Schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      inputActivityCount,
      issues: zodIssuesToDomainIssues(parsed.error.issues).map((i) => {
        const msg = i.message.toUpperCase();
        let code = i.code;
        if (msg.includes("MILESTONE")) code = "KIND_EXCLUDED_V1";
        if (msg.includes("SF EXCLU") || msg.includes("RELATION SF")) {
          code = "RELATION_EXCLUDED_V1";
        }
        if (msg.includes("WAIT") && msg.includes("CREW")) {
          code = "WAIT_WITH_CREW";
        }
        return { ...i, code };
      }),
    };
  }

  return {
    ok: true,
    bundle: parsed.data,
    inputActivityCount: parsed.data.activities.length,
  };
}

export type ParseAiScheduleAnyResult =
  | { ok: true; bundle: AiScheduleBundle; inputActivityCount: number }
  | { ok: false; issues: DomainIssue[]; inputActivityCount: number };

/** Parse le contrat IA courant sans casser les payloads V1 déjà diffusés. */
export function parseAiScheduleBundle(input: unknown): ParseAiScheduleAnyResult {
  const format =
    input && typeof input === "object" && !Array.isArray(input)
      ? String((input as { format?: unknown }).format ?? "")
      : "";
  if (format !== BEWORK_SCHEDULE_AI_FORMAT_V2) {
    return parseAiScheduleBundleV1(input);
  }
  const inputActivityCount =
    input &&
    typeof input === "object" &&
    Array.isArray((input as { activities?: unknown }).activities)
      ? (input as { activities: unknown[] }).activities.length
      : 0;
  const parsed = AiScheduleBundleV2Schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      inputActivityCount,
      issues: zodIssuesToDomainIssues(parsed.error.issues),
    };
  }
  return {
    ok: true,
    bundle: parsed.data,
    inputActivityCount: parsed.data.activities.length,
  };
}

let cachedAiJsonSchema: Record<string, unknown> | null = null;
let cachedAiV2JsonSchema: Record<string, unknown> | null = null;

export function getAiScheduleBundleV1JsonSchema(): Record<string, unknown> {
  if (cachedAiJsonSchema) return cachedAiJsonSchema;
  cachedAiJsonSchema = zodToJsonSchema(AiScheduleBundleV1Schema, {
    name: "BeworkScheduleAiV1",
    $refStrategy: "none",
  }) as Record<string, unknown>;
  return cachedAiJsonSchema;
}

export function getAiScheduleBundleV2JsonSchema(): Record<string, unknown> {
  if (cachedAiV2JsonSchema) return cachedAiV2JsonSchema;
  cachedAiV2JsonSchema = zodToJsonSchema(AiScheduleBundleV2Schema, {
    name: "BeworkScheduleAiV2",
    $refStrategy: "none",
  }) as Record<string, unknown>;
  return cachedAiV2JsonSchema;
}

export const AI_SCHEDULE_V1_BUSINESS_RULES = [
  "format doit être bework_schedule_ai_v1",
  "kinds autorisés : WORK, CONTROL, WAIT — MILESTONE interdit",
  "relations after.type : FS, SS, FF — SF interdit",
  "duration_days >= 0 (FIXED côté domaine)",
  "WAIT ne doit pas avoir de crew",
  "takeoff_codes = codes lignes métré exécutables (pas indicator)",
  "PRODUCTIVITY non exposé en IA v1",
  "aucune activité ne peut être omise silencieusement",
] as const;

export const AI_SCHEDULE_V2_BUSINESS_RULES = [
  "format doit être bework_schedule_ai_v2",
  ...AI_SCHEDULE_V1_BUSINESS_RULES.slice(1, -2),
  "WAIT ne doit recevoir ni équipe ni matériel actif",
  "références techniques indicatives sauf preuve contractuelle",
  "hypothèses et bases de durée à valider sont conservées",
  "points d’arrêt explicites avant travaux irréversibles",
  "aucune activité ne peut être omise silencieusement",
] as const;
