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

let cachedAiJsonSchema: Record<string, unknown> | null = null;

export function getAiScheduleBundleV1JsonSchema(): Record<string, unknown> {
  if (cachedAiJsonSchema) return cachedAiJsonSchema;
  cachedAiJsonSchema = zodToJsonSchema(AiScheduleBundleV1Schema, {
    name: "BeworkScheduleAiV1",
    $refStrategy: "none",
  }) as Record<string, unknown>;
  return cachedAiJsonSchema;
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
