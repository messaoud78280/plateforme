/**
 * Mutations SupplyNeed — persiste sur MaterialRequirement.
 * Compat MATERIAUX-V1B : quantityRequired toujours synchronisé avec validatedOrderQuantity.
 */
import type {
  MaterialRequirementCategory,
  MaterialRequirementProcurementMode,
  MaterialRequirementSourceDrift,
  MaterialRequirementSourceType,
  MaterialRequirementStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { findSimilarMaterialRequirements } from "@/lib/materiaux/service";
import { computeOrderDeadline } from "@/lib/supply/deadline";
import { mapMaterialRequirementToSupplyNeed } from "@/lib/supply/map-material-requirement";
import type { SupplyNeed } from "@/lib/supply/types";

const SUPPLY_SELECT = {
  id: true,
  organizationId: true,
  projectId: true,
  label: true,
  description: true,
  category: true,
  procurementMode: true,
  status: true,
  quantityRequired: true,
  unit: true,
  lossFactor: true,
  sourceQuantity: true,
  sourceUnit: true,
  calculatedQuantity: true,
  validatedOrderQuantity: true,
  packaging: true,
  packagingSize: true,
  packagingUnit: true,
  neededAt: true,
  orderDeadlineAt: true,
  supplierLeadTimeDays: true,
  takeoffCodes: true,
  scheduleTaskIds: true,
  prepStudyId: true,
  schedulePlanId: true,
  sourceFingerprint: true,
  sourceDrift: true,
  sourceType: true,
  sourceId: true,
  sourceLabel: true,
  siteResourceId: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} as const;

function syncOrderQty(validated: number): {
  validatedOrderQuantity: number;
  quantityRequired: number;
} {
  if (!Number.isFinite(validated) || validated <= 0) {
    throw new Error("Quantité à commander invalide");
  }
  return { validatedOrderQuantity: validated, quantityRequired: validated };
}

export async function getSupplyNeed(opts: {
  organizationId: string;
  id: string;
}): Promise<SupplyNeed | null> {
  const row = await prisma.materialRequirement.findFirst({
    where: { id: opts.id, organizationId: opts.organizationId },
    select: SUPPLY_SELECT,
  });
  return row ? mapMaterialRequirementToSupplyNeed(row) : null;
}

export async function listSupplyNeedsForProject(opts: {
  organizationId: string;
  projectId: string;
  category?: MaterialRequirementCategory;
  includeCancelled?: boolean;
}): Promise<SupplyNeed[]> {
  const rows = await prisma.materialRequirement.findMany({
    where: {
      organizationId: opts.organizationId,
      projectId: opts.projectId,
      ...(opts.category ? { category: opts.category } : {}),
      ...(opts.includeCancelled ? {} : { status: { not: "CANCELLED" } }),
    },
    select: SUPPLY_SELECT,
    orderBy: [{ category: "asc" }, { status: "asc" }, { label: "asc" }],
  });
  return rows.map(mapMaterialRequirementToSupplyNeed);
}

export async function createSupplyNeed(input: {
  organizationId: string;
  projectId: string;
  createdById: string;
  label: string;
  unit: string;
  /** Quantité validée commande — alimente aussi quantityRequired (legacy) */
  validatedOrderQuantity: number;
  category?: MaterialRequirementCategory;
  procurementMode?: MaterialRequirementProcurementMode;
  description?: string | null;
  sourceQuantity?: number | null;
  sourceUnit?: string | null;
  calculatedQuantity?: number | null;
  lossFactor?: number | null;
  packaging?: string | null;
  packagingSize?: number | null;
  packagingUnit?: string | null;
  neededAt?: Date | null;
  supplierLeadTimeDays?: number | null;
  takeoffCodes?: string[] | null;
  scheduleTaskIds?: string[] | null;
  prepStudyId?: string | null;
  schedulePlanId?: string | null;
  sourceFingerprint?: string | null;
  sourceType?: MaterialRequirementSourceType;
  sourceId?: string | null;
  sourceLabel?: string | null;
  siteResourceId?: string | null;
  notes?: string | null;
  status?: MaterialRequirementStatus;
  force?: boolean;
}): Promise<
  | { similar: Array<{ id: string; label: string; unit: string; quantityRequired: unknown }>; need: null }
  | { similar: []; need: SupplyNeed }
> {
  const label = input.label.trim();
  const unit = input.unit.trim() || "U";
  if (!label) throw new Error("Désignation requise");
  const qtySync = syncOrderQty(input.validatedOrderQuantity);

  const project = await prisma.project.findFirst({
    where: { id: input.projectId, organizationId: input.organizationId },
    select: { id: true },
  });
  if (!project) throw new Error("Chantier introuvable");

  if (!input.force) {
    const similar = await findSimilarMaterialRequirements({
      organizationId: input.organizationId,
      projectId: input.projectId,
      label,
      unit,
    });
    if (similar.length > 0) {
      return { similar, need: null };
    }
  }

  // Hypothèse ne doit jamais écraser une quantité source
  if (
    input.sourceType === "HYPOTHESIS" &&
    input.sourceQuantity != null &&
    input.sourceType
  ) {
    // sourceQuantity peut coexister ; on ne la remplace pas — juste validation
  }
  if (input.sourceQuantity != null && input.calculatedQuantity != null) {
    // OK : source et calcul séparés
  }

  const orderDeadlineAt = computeOrderDeadline({
    neededAt: input.neededAt ?? null,
    supplierLeadTimeDays: input.supplierLeadTimeDays ?? null,
  });

  const now = new Date();
  const status = input.status ?? "VALIDATED";
  const row = await prisma.materialRequirement.create({
    data: {
      organizationId: input.organizationId,
      projectId: input.projectId,
      label,
      unit,
      ...qtySync,
      category: input.category ?? "MATERIAL",
      procurementMode: input.procurementMode ?? "ACHAT",
      description: input.description?.trim() || null,
      sourceQuantity: input.sourceQuantity ?? null,
      sourceUnit: input.sourceUnit?.trim() || null,
      calculatedQuantity: input.calculatedQuantity ?? null,
      lossFactor: input.lossFactor ?? null,
      packaging: input.packaging?.trim() || null,
      packagingSize: input.packagingSize ?? null,
      packagingUnit: input.packagingUnit?.trim() || null,
      neededAt: input.neededAt ?? null,
      supplierLeadTimeDays: input.supplierLeadTimeDays ?? null,
      orderDeadlineAt,
      takeoffCodes: input.takeoffCodes?.length ? input.takeoffCodes : undefined,
      scheduleTaskIds: input.scheduleTaskIds?.length
        ? input.scheduleTaskIds
        : undefined,
      prepStudyId: input.prepStudyId ?? null,
      schedulePlanId: input.schedulePlanId ?? null,
      sourceFingerprint: input.sourceFingerprint ?? null,
      sourceDrift: "NONE",
      sourceType: input.sourceType ?? "MANUAL",
      sourceId: input.sourceId ?? null,
      sourceLabel: input.sourceLabel ?? (input.sourceType ? null : "Saisie manuelle"),
      siteResourceId: input.siteResourceId || undefined,
      notes: input.notes?.trim() || null,
      status,
      createdById: input.createdById,
      validatedById:
        status === "VALIDATED" || status === "TO_ORDER" ? input.createdById : undefined,
      validatedAt:
        status === "VALIDATED" || status === "TO_ORDER" ? now : undefined,
    },
    select: SUPPLY_SELECT,
  });

  return { similar: [], need: mapMaterialRequirementToSupplyNeed(row) };
}

export async function updateSupplyNeed(input: {
  organizationId: string;
  id: string;
  label?: string;
  unit?: string;
  validatedOrderQuantity?: number;
  category?: MaterialRequirementCategory;
  procurementMode?: MaterialRequirementProcurementMode;
  description?: string | null;
  sourceQuantity?: number | null;
  sourceUnit?: string | null;
  calculatedQuantity?: number | null;
  lossFactor?: number | null;
  packaging?: string | null;
  packagingSize?: number | null;
  packagingUnit?: string | null;
  neededAt?: Date | null;
  supplierLeadTimeDays?: number | null;
  takeoffCodes?: string[] | null;
  scheduleTaskIds?: string[] | null;
  prepStudyId?: string | null;
  schedulePlanId?: string | null;
  sourceFingerprint?: string | null;
  sourceDrift?: MaterialRequirementSourceDrift;
  sourceType?: MaterialRequirementSourceType;
  sourceId?: string | null;
  sourceLabel?: string | null;
  siteResourceId?: string | null;
  notes?: string | null;
  status?: MaterialRequirementStatus;
  /** Si true et besoin engagé BC + drift, refuse l’écrasement de quantité */
  allowQuantityChangeWhenOrdered?: boolean;
}): Promise<SupplyNeed> {
  const existing = await prisma.materialRequirement.findFirst({
    where: { id: input.id, organizationId: input.organizationId },
    select: {
      id: true,
      status: true,
      neededAt: true,
      supplierLeadTimeDays: true,
      _count: { select: { orderLinks: true } },
    },
  });
  if (!existing) throw new Error("Besoin introuvable");
  if (existing.status === "CANCELLED") throw new Error("Besoin annulé");

  const hasOrders = existing._count.orderLinks > 0;
  if (
    hasOrders &&
    input.validatedOrderQuantity != null &&
    !input.allowQuantityChangeWhenOrdered
  ) {
    throw new Error(
      "Besoin déjà engagé dans une commande — modification de quantité refusée sans décision explicite",
    );
  }

  const data: Prisma.MaterialRequirementUpdateInput = {};
  if (input.label != null) data.label = input.label.trim();
  if (input.unit != null) data.unit = input.unit.trim() || "U";
  if (input.validatedOrderQuantity != null) {
    const sync = syncOrderQty(input.validatedOrderQuantity);
    data.validatedOrderQuantity = sync.validatedOrderQuantity;
    data.quantityRequired = sync.quantityRequired;
  }
  if (input.category != null) data.category = input.category;
  if (input.procurementMode != null) data.procurementMode = input.procurementMode;
  if (input.description !== undefined) data.description = input.description?.trim() || null;
  if (input.sourceQuantity !== undefined) data.sourceQuantity = input.sourceQuantity;
  if (input.sourceUnit !== undefined) data.sourceUnit = input.sourceUnit?.trim() || null;
  if (input.calculatedQuantity !== undefined) {
    data.calculatedQuantity = input.calculatedQuantity;
  }
  if (input.lossFactor !== undefined) data.lossFactor = input.lossFactor;
  if (input.packaging !== undefined) data.packaging = input.packaging?.trim() || null;
  if (input.packagingSize !== undefined) data.packagingSize = input.packagingSize;
  if (input.packagingUnit !== undefined) {
    data.packagingUnit = input.packagingUnit?.trim() || null;
  }
  if (input.takeoffCodes !== undefined) {
    data.takeoffCodes = input.takeoffCodes?.length ? input.takeoffCodes : Prisma.JsonNull;
  }
  if (input.scheduleTaskIds !== undefined) {
    data.scheduleTaskIds = input.scheduleTaskIds?.length
      ? input.scheduleTaskIds
      : Prisma.JsonNull;
  }
  if (input.prepStudyId !== undefined) data.prepStudyId = input.prepStudyId;
  if (input.schedulePlanId !== undefined) data.schedulePlanId = input.schedulePlanId;
  if (input.sourceFingerprint !== undefined) {
    data.sourceFingerprint = input.sourceFingerprint;
  }
  if (input.sourceDrift !== undefined) data.sourceDrift = input.sourceDrift;
  if (input.sourceType !== undefined) data.sourceType = input.sourceType;
  if (input.sourceId !== undefined) data.sourceId = input.sourceId;
  if (input.sourceLabel !== undefined) data.sourceLabel = input.sourceLabel;
  if (input.notes !== undefined) data.notes = input.notes?.trim() || null;
  if (input.status !== undefined) data.status = input.status;
  if (input.siteResourceId !== undefined) {
    data.siteResource = input.siteResourceId
      ? { connect: { id: input.siteResourceId } }
      : { disconnect: true };
  }

  const nextNeededAt =
    input.neededAt !== undefined ? input.neededAt : existing.neededAt;
  const nextLead =
    input.supplierLeadTimeDays !== undefined
      ? input.supplierLeadTimeDays
      : existing.supplierLeadTimeDays != null
        ? Number(existing.supplierLeadTimeDays)
        : null;

  if (input.neededAt !== undefined) data.neededAt = input.neededAt;
  if (input.supplierLeadTimeDays !== undefined) {
    data.supplierLeadTimeDays = input.supplierLeadTimeDays;
  }
  if (
    input.neededAt !== undefined ||
    input.supplierLeadTimeDays !== undefined
  ) {
    data.orderDeadlineAt = computeOrderDeadline({
      neededAt: nextNeededAt,
      supplierLeadTimeDays: nextLead,
    });
  }

  const row = await prisma.materialRequirement.update({
    where: { id: input.id },
    data,
    select: SUPPLY_SELECT,
  });
  return mapMaterialRequirementToSupplyNeed(row);
}
