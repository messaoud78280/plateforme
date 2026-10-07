/**
 * Preview AI schedule — pipeline pur, aucune BDD.
 *
 * 1. parse AiScheduleBundleV1
 * 2. adapter → SchedulePlan
 * 3. parse/validate SchedulePlan structurel
 * 4. business validation
 * 5. calculateSchedule
 * 6. draftHash
 */
import { parseAiScheduleBundle } from "./ai-contract";
import { adaptAiScheduleToSchedulePlan } from "./ai-adapter";
import {
  validateSchedulePlanBusinessRules,
  type ScheduleSourceContext,
} from "./business-validator";
import { calculateSchedule, type CalculatedSchedule } from "./calculate";
import { computeScheduleDraftHash } from "./draft-hash";
import {
  parseSchedulePlan,
  type DomainIssue,
  type ScheduleCalendarV1,
  type SchedulePlan,
  type ScheduleResourcesV1,
} from "./schema";

export type PreviewAiScheduleInput = {
  raw: unknown;
  sourceContext: ScheduleSourceContext;
  calendar?: ScheduleCalendarV1;
  resources?: ScheduleResourcesV1;
};

export type PreviewAiScheduleSuccess = {
  ok: true;
  draftHash: string;
  sourceFingerprint: string;
  plan: SchedulePlan;
  calculated: CalculatedSchedule;
  stats: {
    inputActivities: number;
    normalizedActivities: number;
    validatedActivities: number;
    calculatedActivities: number;
    workActivities: number;
    waitActivities: number;
    totalDurationDays: number;
  };
  warnings: DomainIssue[];
};

export type PreviewAiScheduleFailure = {
  ok: false;
  issues: DomainIssue[];
  stats?: {
    inputActivities: number;
    normalizedActivities?: number;
    validatedActivities?: number;
  };
};

export type PreviewAiScheduleResult =
  | PreviewAiScheduleSuccess
  | PreviewAiScheduleFailure;

export function previewAiSchedule(
  input: PreviewAiScheduleInput,
): PreviewAiScheduleResult {
  const parsedAi = parseAiScheduleBundle(input.raw);
  if (!parsedAi.ok) {
    return {
      ok: false,
      issues: parsedAi.issues,
      stats: { inputActivities: parsedAi.inputActivityCount },
    };
  }

  const adapted = adaptAiScheduleToSchedulePlan({
    bundle: parsedAi.bundle,
    sourceSnapshot: {
      projectId: input.sourceContext.projectId,
      takeoffStudyId: input.sourceContext.takeoffStudyId,
      takeoffVersion: input.sourceContext.takeoffVersion,
      takeoffFingerprint: input.sourceContext.takeoffFingerprint,
      quoteId: input.sourceContext.quoteId ?? null,
      quoteVersion: input.sourceContext.quoteVersion ?? null,
    },
    calendar: input.calendar,
    resources: input.resources,
  });

  if (adapted.inputActivityCount !== adapted.normalizedActivityCount) {
    return {
      ok: false,
      issues: [
        {
          code: "ACTIVITY_COUNT_MISMATCH",
          path: "activities",
          value: {
            input: adapted.inputActivityCount,
            normalized: adapted.normalizedActivityCount,
          },
          message: "Activité disparue à l’adaptation (BUG)",
          severity: "ERROR",
        },
      ],
      stats: {
        inputActivities: adapted.inputActivityCount,
        normalizedActivities: adapted.normalizedActivityCount,
      },
    };
  }

  const structural = parseSchedulePlan(adapted.plan);
  if (!structural.ok) {
    return {
      ok: false,
      issues: structural.issues,
      stats: {
        inputActivities: adapted.inputActivityCount,
        normalizedActivities: adapted.normalizedActivityCount,
      },
    };
  }

  const business = validateSchedulePlanBusinessRules(
    structural.plan,
    input.sourceContext,
    {
      inputActivityCount: adapted.inputActivityCount,
      normalizedActivityCount: adapted.normalizedActivityCount,
    },
  );
  if (!business.ok) {
    return {
      ok: false,
      issues: business.issues,
      stats: {
        inputActivities: business.stats.inputActivityCount,
        normalizedActivities: business.stats.normalizedActivityCount,
        validatedActivities: business.stats.validatedActivityCount,
      },
    };
  }

  const quantityByCode = new Map<string, number | null>();
  for (const line of input.sourceContext.lines) {
    const qty =
      line.quantity_for_planning ??
      line.validated_quantity ??
      line.declared_quantity ??
      line.computed_quantity;
    quantityByCode.set(line.code, qty);
  }

  const calc = calculateSchedule(structural.plan, { quantityByCode });
  if (!calc.ok) {
    return {
      ok: false,
      issues: calc.issues,
      stats: {
        inputActivities: adapted.inputActivityCount,
        normalizedActivities: adapted.normalizedActivityCount,
        validatedActivities: business.stats.validatedActivityCount,
      },
    };
  }

  if (
    calc.calculated.activities.length !== adapted.inputActivityCount ||
    calc.calculated.activities.length !== business.stats.validatedActivityCount
  ) {
    return {
      ok: false,
      issues: [
        {
          code: "ACTIVITY_COUNT_MISMATCH",
          path: "activities",
          value: {
            input: adapted.inputActivityCount,
            validated: business.stats.validatedActivityCount,
            calculated: calc.calculated.activities.length,
          },
          message: "Activité disparue au calcul (BUG)",
          severity: "ERROR",
        },
      ],
    };
  }

  const draftHash = computeScheduleDraftHash(structural.plan);
  const warnings = business.issues.filter((i) => i.severity === "WARNING");

  return {
    ok: true,
    draftHash,
    sourceFingerprint: input.sourceContext.takeoffFingerprint,
    plan: structural.plan,
    calculated: calc.calculated,
    stats: {
      inputActivities: adapted.inputActivityCount,
      normalizedActivities: adapted.normalizedActivityCount,
      validatedActivities: business.stats.validatedActivityCount,
      calculatedActivities: calc.calculated.activities.length,
      workActivities: calc.calculated.workActivities,
      waitActivities: calc.calculated.waitActivities,
      totalDurationDays: calc.calculated.totalDurationDays,
    },
    warnings,
  };
}
