/**
 * Mapping MaterialRequirement (Prisma) → SupplyNeed (domaine).
 */
import type { MaterialRequirement } from "@prisma/client";
import { toSupplyQuantities } from "@/lib/supply/quantities";
import type {
  SupplyCategory,
  SupplyNeed,
  SupplyNeedStatus,
  SupplyProcurementMode,
  SupplySourceDrift,
} from "@/lib/supply/types";

function asStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean);
}

function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

function num(v: unknown): number | null {
  if (v == null) return null;
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : null;
}

export type MaterialRequirementSupplyFields = Pick<
  MaterialRequirement,
  | "id"
  | "organizationId"
  | "projectId"
  | "label"
  | "description"
  | "category"
  | "procurementMode"
  | "status"
  | "quantityRequired"
  | "unit"
  | "lossFactor"
  | "sourceQuantity"
  | "sourceUnit"
  | "calculatedQuantity"
  | "validatedOrderQuantity"
  | "packaging"
  | "packagingSize"
  | "packagingUnit"
  | "neededAt"
  | "orderDeadlineAt"
  | "supplierLeadTimeDays"
  | "takeoffCodes"
  | "scheduleTaskIds"
  | "prepStudyId"
  | "schedulePlanId"
  | "sourceFingerprint"
  | "sourceDrift"
  | "sourceType"
  | "sourceId"
  | "sourceLabel"
  | "siteResourceId"
  | "notes"
  | "createdAt"
  | "updatedAt"
>;

export function mapMaterialRequirementToSupplyNeed(
  row: MaterialRequirementSupplyFields,
): SupplyNeed {
  return {
    id: row.id,
    organizationId: row.organizationId,
    projectId: row.projectId,
    label: row.label,
    description: row.description,
    category: row.category as SupplyCategory,
    procurementMode: row.procurementMode as SupplyProcurementMode,
    status: row.status as SupplyNeedStatus,
    quantities: toSupplyQuantities(row),
    neededAt: iso(row.neededAt),
    orderDeadlineAt: iso(row.orderDeadlineAt),
    supplierLeadTimeDays: num(row.supplierLeadTimeDays),
    takeoffCodes: asStringArray(row.takeoffCodes),
    scheduleTaskIds: asStringArray(row.scheduleTaskIds),
    prepStudyId: row.prepStudyId,
    schedulePlanId: row.schedulePlanId,
    sourceFingerprint: row.sourceFingerprint,
    sourceDrift: row.sourceDrift as SupplySourceDrift,
    sourceType: row.sourceType,
    sourceId: row.sourceId,
    sourceLabel: row.sourceLabel,
    siteResourceId: row.siteResourceId,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
