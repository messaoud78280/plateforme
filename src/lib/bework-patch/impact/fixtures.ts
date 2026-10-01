/**
 * Fixture Impact Engine — longueur 54 → 65 (volume 25,92 → 31,20).
 * Aucune dépendance DB.
 */
import type { BeworkPatchV1 } from "@/lib/bework-patch/types";
import type { ImpactSubgraph } from "@/lib/bework-patch/impact/types";

export const FIXTURE_PROJECT_ID = "proj_impact_54";
export const FIXTURE_STUDY_ID = "study_ter";
export const FIXTURE_PARAM_LONGUEUR_ID = "param_longueur";
export const FIXTURE_LINE_TER03_ID = "line_ter03";
export const FIXTURE_QUOTE_ID = "quote_0153";
export const FIXTURE_QUOTE_LINE_ID = "qline_ter03";
export const FIXTURE_PLAN_ID = "plan_1";
export const FIXTURE_TASK_TERR04_ID = "task_terr04";

/** 54 × 0,60 × 0,80 = 25,92 */
export function buildFixtureSubgraph54(opts?: {
  quoteStatus?: string;
  quoteQtyOverride?: number;
  quantityAtTransfer?: number;
}): ImpactSubgraph {
  const quoteQty = opts?.quoteQtyOverride ?? 25.92;
  const atTransfer = opts?.quantityAtTransfer ?? 25.92;
  return {
    projectId: FIXTURE_PROJECT_ID,
    study: {
      id: FIXTURE_STUDY_ID,
      title: "Métré terrassement",
      version: 3,
      params: [
        {
          id: FIXTURE_PARAM_LONGUEUR_ID,
          key: "longueur",
          label: "Longueur",
          value: 54,
          unit: "ml",
          formula: null,
        },
        {
          id: "param_largeur",
          key: "largeur",
          label: "Largeur",
          value: 0.6,
          unit: "m",
          formula: null,
        },
        {
          id: "param_profondeur",
          key: "profondeur",
          label: "Profondeur",
          value: 0.8,
          unit: "m",
          formula: null,
        },
      ],
      lines: [
        {
          id: FIXTURE_LINE_TER03_ID,
          code: "TER-03",
          designation: "Volume fouille",
          unit: "m³",
          formula: "longueur * largeur * profondeur",
          declaredQuantity: null,
          role: "quote",
        },
      ],
    },
    quotes: [
      {
        id: FIXTURE_QUOTE_ID,
        number: "DEV-2026-0153",
        status: opts?.quoteStatus ?? "DRAFT",
        versionNumber: 1,
        versionId: "qv_1",
        lines: [
          {
            id: FIXTURE_QUOTE_LINE_ID,
            designation: "Fouille volume",
            quantity: quoteQty,
            unit: "m³",
            unitSellHt: 120,
            discountPercent: 0,
            vatRate: 20,
            kind: "WORK",
          },
        ],
      },
    ],
    quoteLinks: [
      {
        id: "link_1",
        studyId: FIXTURE_STUDY_ID,
        studyLineCode: "TER-03",
        quoteId: FIXTURE_QUOTE_ID,
        quoteLineId: FIXTURE_QUOTE_LINE_ID,
        quantityAtTransfer: atTransfer,
      },
    ],
    plans: [
      {
        id: FIXTURE_PLAN_ID,
        title: "Planning terrassement",
        startDate: "2026-11-02",
        endDateBase: "2026-11-27",
        baseDurationWorkingDays: 19.5,
        revisionNumber: 1,
        studyVersionAtGeneration: 3,
        tasks: [
          {
            id: FIXTURE_TASK_TERR04_ID,
            stepCode: "TERR-04",
            name: "Excavation",
            description: null,
            durationDays: 1.5,
            durationMode: "computed",
            durationLockedByUser: false,
            driverTakeoffCode: "TER-03",
            quantitySnapshot: 25.92,
            quantityUnit: "m³",
            // 25.92 / 1.5 = 17.28 m³/j
            rateValue: 17.28,
            parallelUnits: 1,
            startDate: "2026-11-10",
            endDate: "2026-11-11",
            dependsOnStepCodes: [],
            lot: "Terrassement",
          },
        ],
        takeoffLinks: [
          { taskId: FIXTURE_TASK_TERR04_ID, studyLineCode: "TER-03" },
        ],
      },
    ],
    visit: null,
    followUp: null,
  };
}

export function buildPatch54to65(): BeworkPatchV1 {
  return {
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "patch_longueur_54_65",
    origin: {
      section: "TAKEOFF",
      project_id: FIXTURE_PROJECT_ID,
      entity_id: FIXTURE_STUDY_ID,
      base_version: 3,
    },
    change_intent: "TECHNICAL_CORRECTION",
    reason: "Longueur confirmée sur chantier",
    operations: [
      {
        op: "update_parameter",
        target: {
          entity_type: "PREP_PARAMETER",
          study_id: FIXTURE_STUDY_ID,
          parameter_id: FIXTURE_PARAM_LONGUEUR_ID,
          parameter_key: "longueur",
        },
        changes: { value: 65 },
      },
    ],
  };
}

export function buildPatchPu120to115(): BeworkPatchV1 {
  return {
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "patch_pu_115",
    origin: {
      section: "QUOTE",
      project_id: FIXTURE_PROJECT_ID,
      entity_id: FIXTURE_QUOTE_ID,
      base_version: 1,
    },
    change_intent: "COMMERCIAL_ADJUSTMENT",
    reason: "Ajustement PU",
    operations: [
      {
        op: "update_quote_item",
        target: {
          entity_type: "QUOTE_ITEM",
          quote_id: FIXTURE_QUOTE_ID,
          item_id: FIXTURE_QUOTE_LINE_ID,
        },
        changes: { unit_price_ht: 115 },
      },
    ],
  };
}

export function buildPatchPlanningDuration1to2(): BeworkPatchV1 {
  return {
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "patch_dur_2",
    origin: {
      section: "PLANNING",
      project_id: FIXTURE_PROJECT_ID,
      entity_id: FIXTURE_PLAN_ID,
      base_version: 1,
    },
    change_intent: "PLANNING_ADJUSTMENT",
    reason: "Durée revue",
    operations: [
      {
        op: "update_duration",
        target: {
          entity_type: "PREP_SCHEDULE_TASK",
          plan_id: FIXTURE_PLAN_ID,
          task_id: FIXTURE_TASK_TERR04_ID,
          step_code: "TERR-04",
        },
        changes: { duration_days: 2 },
      },
    ],
  };
}

export function buildPatchQuoteTechnicalPartial(): BeworkPatchV1 {
  return {
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "patch_quote_tech_partial",
    origin: {
      section: "QUOTE",
      project_id: FIXTURE_PROJECT_ID,
      entity_id: FIXTURE_QUOTE_ID,
      base_version: 1,
    },
    change_intent: "TECHNICAL_CORRECTION",
    reason: "Correction technique depuis devis",
    operations: [
      {
        op: "update_quote_item",
        target: {
          entity_type: "QUOTE_ITEM",
          quote_id: FIXTURE_QUOTE_ID,
          item_id: FIXTURE_QUOTE_LINE_ID,
        },
        changes: { quantity: 30 },
      },
    ],
  };
}
