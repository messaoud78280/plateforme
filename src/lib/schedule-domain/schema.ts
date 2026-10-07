/**
 * SchedulePlan V1 — schéma Zod = source unique de vérité.
 * Types TS, validation runtime, Preview/Commit et JSON Schema IA dérivent d’ici.
 *
 * Exclusions V1 explicites (ERROR, jamais de mapping silencieux) :
 * - relation SF
 * - kind MILESTONE
 */
import { z } from "zod";
import {
  SCHEDULE_ACTIVITY_KINDS_V1,
  SCHEDULE_CALENDAR_KIND_V1,
  SCHEDULE_DURATION_ROUNDINGS_V1,
  SCHEDULE_KIND_EXCLUDED_V1,
  SCHEDULE_PLAN_SCHEMA_VERSION,
  SCHEDULE_PLAN_SCHEMA_VERSION_V1,
  SCHEDULE_PLAN_SCHEMA_VERSIONS,
  SCHEDULE_RATE_PER_V1,
  SCHEDULE_RELATION_EXCLUDED_V1,
  SCHEDULE_RELATIONS_V1,
} from "./constants";

const nonEmpty = z.string().trim().min(1);

function pathStr(path: (string | number)[]): string {
  if (!path.length) return "";
  return path
    .map((p, i) => (typeof p === "number" ? `[${p}]` : i === 0 ? p : `.${p}`))
    .join("")
    .replace(/\.\[/g, "[");
}

/** Kind V1 : WORK | CONTROL | WAIT — MILESTONE = ERROR explicite (enum → JSON Schema). */
export const ScheduleActivityKindSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toUpperCase() : value),
  z.enum(SCHEDULE_ACTIVITY_KINDS_V1, {
    errorMap: (_issue, ctx) => {
      const data = String(ctx.data ?? "");
      if ((SCHEDULE_KIND_EXCLUDED_V1 as readonly string[]).includes(data)) {
        return {
          message:
            "Kind MILESTONE exclu de SchedulePlan V1 — kinds autorisés : WORK, CONTROL, WAIT",
        };
      }
      return {
        message: `Kind invalide « ${data} » — autorisés : WORK, CONTROL, WAIT`,
      };
    },
  }),
);

/** Relations V1 : FS | SS | FF — SF = ERROR explicite (enum → JSON Schema). */
export const ScheduleRelationSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toUpperCase() : value),
  z.enum(SCHEDULE_RELATIONS_V1, {
    errorMap: (_issue, ctx) => {
      const data = String(ctx.data ?? "");
      if ((SCHEDULE_RELATION_EXCLUDED_V1 as readonly string[]).includes(data)) {
        return {
          message:
            "Relation SF exclue de SchedulePlan V1 — relations autorisées : FS, SS, FF",
        };
      }
      return {
        message: `Relation invalide « ${data} » — autorisées : FS, SS, FF`,
      };
    },
  }),
);

export const ScheduleSourceSnapshotSchema = z.object({
  projectId: nonEmpty,
  takeoffStudyId: nonEmpty,
  takeoffVersion: z.number().int().nonnegative(),
  takeoffFingerprint: nonEmpty,
  quoteId: z.string().trim().min(1).nullable().optional(),
  quoteVersion: z.number().int().nonnegative().nullable().optional(),
});

export const ScheduleSourceLinkSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("TAKEOFF_LINE"),
    code: nonEmpty,
  }),
  z.object({
    type: z.literal("QUOTE_ITEM"),
    quoteLineId: nonEmpty,
    studyLineCode: z.string().trim().min(1).nullable().optional(),
  }),
  z.object({
    type: z.literal("MANUAL"),
    label: z.string().trim().min(1).nullable().optional(),
  }),
]);

export const ScheduleDurationFixedSchema = z.object({
  mode: z.literal("FIXED"),
  days: z.number().finite().nonnegative(),
  calendar: z.enum(SCHEDULE_CALENDAR_KIND_V1).default("working"),
});

export const ScheduleDurationProductivitySchema = z.object({
  mode: z.literal("PRODUCTIVITY"),
  sourceCode: nonEmpty,
  rate: z.number().finite().positive(),
  rateUnit: nonEmpty,
  rateId: z.string().trim().min(1).nullable().optional(),
  parallelUnits: z.number().finite().positive().default(1),
  rounding: z.enum(SCHEDULE_DURATION_ROUNDINGS_V1).default("ceil_half_day"),
});

export const ScheduleDurationSchema = z.discriminatedUnion("mode", [
  ScheduleDurationFixedSchema,
  ScheduleDurationProductivitySchema,
]);

export const SchedulePredecessorSchema = z.object({
  activityId: nonEmpty,
  relation: ScheduleRelationSchema,
  lagDays: z.number().finite().default(0),
});

export const ScheduleResourceRequirementSchema = z.object({
  crewId: z.string().trim().min(1).nullable().optional(),
  crewSize: z.number().finite().positive().nullable().optional(),
  labor: z
    .array(
      z.object({
        laborId: nonEmpty,
        count: z.number().finite().nonnegative().default(1),
      }),
    )
    .default([]),
  equipment: z
    .array(
      z.object({
        equipmentId: nonEmpty,
        count: z.number().finite().nonnegative().default(1),
      }),
    )
    .default([]),
});

export const ScheduleActivitySchema = z.object({
  id: nonEmpty,
  name: nonEmpty,
  kind: ScheduleActivityKindSchema,
  sourceLinks: z.array(ScheduleSourceLinkSchema).default([]),
  duration: ScheduleDurationSchema,
  resourceRequirements: ScheduleResourceRequirementSchema.default({
    labor: [],
    equipment: [],
  }),
  predecessors: z.array(SchedulePredecessorSchema).default([]),
  notes: z.string().nullable().optional(),
});

export const ScheduleTechnicalReferenceSchema = z.object({
  code: nonEmpty,
  label: z.string().trim().min(1).nullable().optional(),
  applicability: z
    .enum(["INDICATIVE", "CONTRACTUAL", "TO_CONFIRM"])
    .default("INDICATIVE"),
  sourceUrl: z.string().url().nullable().optional(),
  note: z.string().nullable().optional(),
});

export const ScheduleCrewMemberSchema = z.object({
  laborId: nonEmpty,
  role: nonEmpty,
  count: z.number().finite().positive().default(1),
});

export const ScheduleNamedResourceSchema = z.object({
  id: nonEmpty,
  label: nonEmpty,
  count: z.number().finite().nonnegative().default(1),
  note: z.string().nullable().optional(),
});

export const ScheduleDurationBasisSchema = z.object({
  provenance: z.enum([
    "SOURCE_DATA",
    "PLANNING_ASSUMPTION",
    "USER_DECISION",
    "PRODUCTIVITY_RATE",
  ]),
  minDays: z.number().finite().nonnegative().nullable().optional(),
  maxDays: z.number().finite().nonnegative().nullable().optional(),
  rationale: z.string().trim().min(1).nullable().optional(),
  toValidate: z.boolean().default(true),
});

/** Enrichissements chantier V2 ; les tableaux restent explicites et traçables. */
export const ScheduleActivityV2Schema = ScheduleActivitySchema.extend({
  lot: z.string().trim().min(1).nullable().optional(),
  phase: z.string().trim().min(1).nullable().optional(),
  crewMembers: z.array(ScheduleCrewMemberSchema).default([]),
  equipment: z.array(ScheduleNamedResourceSchema).default([]),
  supplies: z.array(ScheduleNamedResourceSchema).default([]),
  preconditions: z.array(nonEmpty).default([]),
  controls: z.array(nonEmpty).default([]),
  constraints: z.array(nonEmpty).default([]),
  safety: z.array(nonEmpty).default([]),
  proofs: z.array(nonEmpty).default([]),
  technicalReferences: z.array(ScheduleTechnicalReferenceSchema).default([]),
  assumptions: z.array(nonEmpty).default([]),
  durationBasis: ScheduleDurationBasisSchema.nullable().optional(),
  holdPoint: z.boolean().default(false),
});

export const ScheduleLaborSchema = z.object({
  id: nonEmpty,
  role: nonEmpty,
  note: z.string().nullable().optional(),
});

export const ScheduleEquipmentSchema = z.object({
  id: nonEmpty,
  category: z.string().trim().min(1).default("autre"),
  label: nonEmpty,
  note: z.string().nullable().optional(),
});

export const ScheduleRateSchema = z.object({
  id: nonEmpty,
  label: nonEmpty,
  value: z.number().finite().positive(),
  unit: nonEmpty,
  per: z.enum(SCHEDULE_RATE_PER_V1).default("equipe"),
  provenance: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});

export const ScheduleResourcesSchema = z.object({
  labor: z.array(ScheduleLaborSchema).default([]),
  equipment: z.array(ScheduleEquipmentSchema).default([]),
  rates: z.array(ScheduleRateSchema).default([]),
});

export const ScheduleCalendarSchema = z.object({
  workingDays: z
    .array(z.number().int().min(1).max(7))
    .min(1)
    .default([1, 2, 3, 4, 5]),
  holidays: z
    .union([z.literal("FR_METROPOLE"), z.array(z.string()), z.null()])
    .default("FR_METROPOLE"),
  granularityDays: z.number().finite().positive().default(0.5),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "startDate doit être YYYY-MM-DD")
    .nullable()
    .optional(),
});

/**
 * Modèle métier canonique SchedulePlan V1.
 * Indépendant de ChatGPT, Prisma, React et de la saisie manuelle.
 */
const SchedulePlanV1BaseSchema = z.object({
    schemaVersion: z.literal(SCHEDULE_PLAN_SCHEMA_VERSION_V1),
    sourceSnapshot: ScheduleSourceSnapshotSchema,
    calendar: ScheduleCalendarSchema.default({
      workingDays: [1, 2, 3, 4, 5],
      holidays: "FR_METROPOLE",
      granularityDays: 0.5,
    }),
    resources: ScheduleResourcesSchema.default({
      labor: [],
      equipment: [],
      rates: [],
    }),
    activities: z.array(ScheduleActivitySchema).min(1, "Au moins une activité requise"),
});

const SchedulePlanV2BaseSchema = SchedulePlanV1BaseSchema.extend({
  schemaVersion: z.literal(SCHEDULE_PLAN_SCHEMA_VERSION),
  activities: z.array(ScheduleActivityV2Schema).min(1, "Au moins une activité requise"),
});

function validatePlanRelations(
  plan: z.infer<typeof SchedulePlanV1BaseSchema> | z.infer<typeof SchedulePlanV2BaseSchema>,
  ctx: z.RefinementCtx,
) {
    const seen = new Set<string>();
    for (let i = 0; i < plan.activities.length; i++) {
      const id = plan.activities[i]!.id;
      if (seen.has(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["activities", i, "id"],
          message: `ID activité en double : ${id}`,
        });
      }
      seen.add(id);
    }

    for (let i = 0; i < plan.activities.length; i++) {
      const act = plan.activities[i]!;
      for (let j = 0; j < act.predecessors.length; j++) {
        const pred = act.predecessors[j]!;
        if (pred.activityId === act.id) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["activities", i, "predecessors", j, "activityId"],
            message: `Auto-dépendance interdite sur ${act.id}`,
          });
        }
        if (!seen.has(pred.activityId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["activities", i, "predecessors", j, "activityId"],
            message: `Prédécesseur inconnu : ${pred.activityId}`,
          });
        }
      }

      if (act.kind === "WAIT") {
        const req = act.resourceRequirements;
        const hasCrew =
          Boolean(req.crewId) ||
          (req.crewSize != null && req.crewSize > 0) ||
          req.labor.some((l) => l.count > 0) ||
          req.equipment.some((e) => e.count > 0);
        if (hasCrew) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["activities", i, "resourceRequirements"],
            message: `WAIT ${act.id} ne doit pas avoir de ressource active`,
          });
        }
      }
    }
}

export const SchedulePlanV1Schema =
  SchedulePlanV1BaseSchema.superRefine(validatePlanRelations);
export const SchedulePlanV2Schema =
  SchedulePlanV2BaseSchema.superRefine(validatePlanRelations);
export const SchedulePlanSchema = z.union([
  SchedulePlanV1Schema,
  SchedulePlanV2Schema,
]);

export type SchedulePlanV1 = z.infer<typeof SchedulePlanV1Schema>;
export type SchedulePlanV2 = z.infer<typeof SchedulePlanV2Schema>;
export type SchedulePlan = SchedulePlanV1 | SchedulePlanV2;
export type ScheduleActivityV1 = z.infer<typeof ScheduleActivitySchema>;
export type ScheduleActivityV2 = z.infer<typeof ScheduleActivityV2Schema>;
export type ScheduleActivity = ScheduleActivityV1 | ScheduleActivityV2;
export type ScheduleSourceSnapshotV1 = z.infer<typeof ScheduleSourceSnapshotSchema>;
export type ScheduleCalendarV1 = z.infer<typeof ScheduleCalendarSchema>;
export type ScheduleResourcesV1 = z.infer<typeof ScheduleResourcesSchema>;
export type ScheduleDurationV1 = z.infer<typeof ScheduleDurationSchema>;
export type SchedulePredecessorV1 = z.infer<typeof SchedulePredecessorSchema>;
export type ScheduleSourceLinkV1 = z.infer<typeof ScheduleSourceLinkSchema>;

export type DomainIssueSeverity = "ERROR" | "WARNING";

export type DomainIssue = {
  code: string;
  path: string;
  value: unknown;
  message: string;
  severity: DomainIssueSeverity;
};

export type ParseSchedulePlanResult =
  | { ok: true; plan: SchedulePlan }
  | { ok: false; issues: DomainIssue[] };

function issueCodeFromZod(issue: z.ZodIssue): string {
  const msg = issue.message.toUpperCase();
  if (msg.includes("MILESTONE")) return "KIND_EXCLUDED_V1";
  if (msg.includes("RELATION SF") || msg.includes("SF EXCLU")) return "RELATION_EXCLUDED_V1";
  if (issue.code === z.ZodIssueCode.invalid_literal && issue.path[0] === "schemaVersion") {
    return "UNSUPPORTED_SCHEMA_VERSION";
  }
  if (msg.includes("EN DOUBLE")) return "DUPLICATE_ACTIVITY_ID";
  if (msg.includes("AUTO-DÉPENDANCE") || msg.includes("AUTO-DEPENDANCE")) {
    return "SELF_DEPENDENCY";
  }
  if (msg.includes("PRÉDÉCESSEUR INCONNU") || msg.includes("PREDECESSEUR INCONNU")) {
    return "UNKNOWN_PREDECESSOR";
  }
  if (msg.includes("WAIT") && msg.includes("RESSOURCE")) return "WAIT_WITH_RESOURCES";
  if (issue.code === z.ZodIssueCode.too_small && issue.path.includes("activities")) {
    return "EMPTY_ACTIVITIES";
  }
  return "DOMAIN_VALIDATION_ERROR";
}

export function zodIssuesToDomainIssues(issues: z.ZodIssue[]): DomainIssue[] {
  return issues.map((issue) => ({
    code: issueCodeFromZod(issue),
    path: pathStr(issue.path as (string | number)[]),
    value: "received" in issue ? (issue as { received?: unknown }).received : undefined,
    message: issue.message,
    severity: "ERROR" as const,
  }));
}

/**
 * Parse strict d’un SchedulePlan.
 * Aucun filtrage silencieux : entrée invalide → issues[].
 */
export function parseSchedulePlan(input: unknown): ParseSchedulePlanResult {
  if (input == null || typeof input !== "object" || Array.isArray(input)) {
    return {
      ok: false,
      issues: [
        {
          code: "INVALID_ROOT",
          path: "",
          value: input,
          message: "SchedulePlan doit être un objet",
          severity: "ERROR",
        },
      ],
    };
  }

  const raw = input as Record<string, unknown>;
  if (
    "schemaVersion" in raw &&
    !(SCHEDULE_PLAN_SCHEMA_VERSIONS as readonly unknown[]).includes(raw.schemaVersion) &&
    raw.schemaVersion !== undefined
  ) {
    return {
      ok: false,
      issues: [
        {
          code: "UNSUPPORTED_SCHEMA_VERSION",
          path: "schemaVersion",
          value: raw.schemaVersion,
          message: `schemaVersion ${String(raw.schemaVersion)} non supportée — versions acceptées : ${SCHEDULE_PLAN_SCHEMA_VERSIONS.join(", ")}`,
          severity: "ERROR",
        },
      ],
    };
  }

  const parsed =
    raw.schemaVersion === SCHEDULE_PLAN_SCHEMA_VERSION_V1
      ? SchedulePlanV1Schema.safeParse(input)
      : SchedulePlanV2Schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, issues: zodIssuesToDomainIssues(parsed.error.issues) };
  }
  return { ok: true, plan: parsed.data };
}

/** Accès direct (throw) — pour code interne après garde. */
export function parseSchedulePlanOrThrow(input: unknown): SchedulePlan {
  const r = parseSchedulePlan(input);
  if (!r.ok) {
    throw Object.assign(new Error(r.issues[0]?.message ?? "SchedulePlan invalide"), {
      code: r.issues[0]?.code ?? "DOMAIN_VALIDATION_ERROR",
      issues: r.issues,
    });
  }
  return r.plan;
}
