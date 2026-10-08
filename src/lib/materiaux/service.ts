/**
 * MATERIAUX-V1B — mutations besoins matériaux.
 */
import type { MaterialRequirementStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeMaterialLabel, unitsCompatible } from "@/lib/materiaux/progress";

export async function findSimilarMaterialRequirements(opts: {
  organizationId: string;
  projectId: string;
  label: string;
  unit: string;
  excludeId?: string;
}) {
  const rows = await prisma.materialRequirement.findMany({
    where: {
      organizationId: opts.organizationId,
      projectId: opts.projectId,
      status: { not: "CANCELLED" },
      ...(opts.excludeId ? { id: { not: opts.excludeId } } : {}),
    },
    select: { id: true, label: true, unit: true, quantityRequired: true },
    take: 50,
  });
  const needle = normalizeMaterialLabel(opts.label);
  return rows.filter(
    (r) =>
      unitsCompatible(r.unit, opts.unit) &&
      (normalizeMaterialLabel(r.label) === needle ||
        normalizeMaterialLabel(r.label).includes(needle) ||
        needle.includes(normalizeMaterialLabel(r.label))),
  );
}

export async function createMaterialRequirement(input: {
  organizationId: string;
  projectId: string;
  createdById: string;
  label: string;
  quantityRequired: number;
  unit: string;
  siteResourceId?: string | null;
  neededAt?: Date | null;
  lossFactor?: number | null;
  force?: boolean;
  category?: import("@prisma/client").MaterialRequirementCategory;
  procurementMode?: import("@prisma/client").MaterialRequirementProcurementMode;
  description?: string | null;
  notes?: string | null;
  status?: import("@prisma/client").MaterialRequirementStatus;
}) {
  const label = input.label.trim();
  const unit = input.unit.trim() || "U";
  const qty = Number(input.quantityRequired);
  if (!label) throw new Error("Matériau requis");
  if (!Number.isFinite(qty) || qty <= 0) throw new Error("Quantité invalide");

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
      return { similar, requirement: null as null };
    }
  }

  const now = new Date();
  const requirement = await prisma.materialRequirement.create({
    data: {
      organizationId: input.organizationId,
      projectId: input.projectId,
      label,
      unit,
      quantityRequired: qty,
      /** SupplyNeed Phase 1 — miroir opérationnel (compat Approvisionnements) */
      validatedOrderQuantity: qty,
      category: input.category ?? "MATERIAL",
      procurementMode: input.procurementMode ?? "ACHAT",
      description: input.description?.trim() || null,
      notes: input.notes?.trim() || null,
      sourceDrift: "NONE",
      siteResourceId: input.siteResourceId || undefined,
      neededAt: input.neededAt ?? undefined,
      lossFactor: input.lossFactor ?? undefined,
      status: input.status ?? "VALIDATED",
      sourceType: "MANUAL",
      sourceLabel: "Saisie manuelle",
      createdById: input.createdById,
      validatedById: input.createdById,
      validatedAt: now,
    },
  });

  return { similar: [], requirement };
}

export async function updateMaterialRequirement(input: {
  organizationId: string;
  id: string;
  label?: string;
  quantityRequired?: number;
  unit?: string;
  neededAt?: Date | null;
  lossFactor?: number | null;
  siteResourceId?: string | null;
  category?: import("@prisma/client").MaterialRequirementCategory;
  procurementMode?: import("@prisma/client").MaterialRequirementProcurementMode;
  description?: string | null;
  notes?: string | null;
  status?: import("@prisma/client").MaterialRequirementStatus;
  /** Si true, autorise le changement de qty malgré BC (BC non modifié). */
  allowQuantityChangeWhenOrdered?: boolean;
}) {
  const existing = await prisma.materialRequirement.findFirst({
    where: { id: input.id, organizationId: input.organizationId },
    select: {
      id: true,
      status: true,
      _count: { select: { orderLinks: true } },
    },
  });
  if (!existing) throw new Error("Besoin introuvable");
  if (existing.status === "CANCELLED") throw new Error("Besoin annulé");

  const hasOrders = existing._count.orderLinks > 0;
  if (
    hasOrders &&
    input.quantityRequired != null &&
    !input.allowQuantityChangeWhenOrdered
  ) {
    throw new Error(
      "Ce besoin est déjà lié à une commande — confirmez explicitement la modification de quantité (la commande ne sera pas modifiée).",
    );
  }

  const data: Prisma.MaterialRequirementUpdateInput = {};
  if (input.label != null) data.label = input.label.trim();
  if (input.unit != null) data.unit = input.unit.trim() || "U";
  if (input.quantityRequired != null) {
    const q = Number(input.quantityRequired);
    if (!Number.isFinite(q) || q <= 0) throw new Error("Quantité invalide");
    data.quantityRequired = q;
    /** Garde quantityRequired et validatedOrderQuantity alignés (SupplyNeed). */
    data.validatedOrderQuantity = q;
  }
  if (input.neededAt !== undefined) data.neededAt = input.neededAt;
  if (input.lossFactor !== undefined) data.lossFactor = input.lossFactor;
  if (input.category != null) data.category = input.category;
  if (input.procurementMode != null) data.procurementMode = input.procurementMode;
  if (input.description !== undefined) {
    data.description = input.description?.trim() || null;
  }
  if (input.notes !== undefined) data.notes = input.notes?.trim() || null;
  if (input.status != null) data.status = input.status;
  if (input.siteResourceId !== undefined) {
    data.siteResource = input.siteResourceId
      ? { connect: { id: input.siteResourceId } }
      : { disconnect: true };
  }

  return prisma.materialRequirement.update({
    where: { id: input.id },
    data,
  });
}

export async function cancelMaterialRequirement(opts: {
  organizationId: string;
  id: string;
}) {
  const existing = await prisma.materialRequirement.findFirst({
    where: { id: opts.id, organizationId: opts.organizationId },
    select: {
      id: true,
      _count: { select: { orderLinks: true } },
    },
  });
  if (!existing) throw new Error("Besoin introuvable");

  return prisma.materialRequirement.update({
    where: { id: opts.id },
    data: { status: "CANCELLED" satisfies MaterialRequirementStatus },
  });
}
