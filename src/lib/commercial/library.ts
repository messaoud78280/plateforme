import type { CommercialComponentType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  calculateComponentLineCost,
  calculateWorkItemCosting,
  marginPercentFromCostSell,
  roundMoney,
} from "@/lib/commercial/money";
import { d } from "@/lib/commercial/decimal";

export type CompositionSnapshotComponent = {
  name: string;
  type: string;
  quantityPerUnit: number;
  unit: string;
  unitCostHt: number;
  lossPercent: number;
  lineCostHt: number;
  comment?: string | null;
  materialId?: string | null;
  laborId?: string | null;
  equipmentId?: string | null;
};

export type CompositionSnapshot = {
  workItemId: string;
  workItemName: string;
  workItemReference?: string | null;
  saleUnit: string;
  kind: string;
  feesPercent: number;
  feesAmountHt: number;
  sellMode: string;
  marginPercent: number;
  unitCostHt: number;
  unitSellHt: number;
  snappedAt: string;
  components: CompositionSnapshotComponent[];
  breakdown: {
    materialsHt: number;
    laborHt: number;
    equipmentHt: number;
    subcontractHt: number;
    otherHt: number;
    dryCostHt: number;
    feesHt: number;
    costPriceHt: number;
    marquePercent: number;
    markupPercent: number;
    sellCoefficient: number;
  };
};

function mapComponent<T extends {
  id: string;
  name: string;
  type: string;
  unit: string;
  quantityPerUnit: Prisma.Decimal | number;
  unitCostHt: Prisma.Decimal | number;
  lineCostHt: Prisma.Decimal | number;
  lossPercent?: Prisma.Decimal | number | null;
  comment?: string | null;
  materialId?: string | null;
  laborId?: string | null;
  equipmentId?: string | null;
}>(c: T) {
  return {
    ...c,
    quantityPerUnit: d(c.quantityPerUnit),
    unitCostHt: d(c.unitCostHt),
    lineCostHt: d(c.lineCostHt),
    lossPercent: d(c.lossPercent ?? 0),
  };
}

export function buildCompositionSnapshot(workItem: {
  id: string;
  name: string;
  reference: string | null;
  saleUnit: string;
  kind: string;
  feesPercent: Prisma.Decimal | number;
  feesAmountHt: Prisma.Decimal | number;
  sellMode: string;
  marginPercent: Prisma.Decimal | number;
  unitCostHt: Prisma.Decimal | number;
  unitSellHt: Prisma.Decimal | number;
  components: Array<{
    name: string;
    type: string;
    quantityPerUnit: Prisma.Decimal | number;
    unit: string;
    unitCostHt: Prisma.Decimal | number;
    lineCostHt: Prisma.Decimal | number;
    lossPercent?: Prisma.Decimal | number | null;
    comment?: string | null;
    materialId?: string | null;
    laborId?: string | null;
    equipmentId?: string | null;
  }>;
}): CompositionSnapshot {
  const components = workItem.components.map((c) => ({
    name: c.name,
    type: c.type,
    quantityPerUnit: d(c.quantityPerUnit),
    unit: c.unit,
    unitCostHt: d(c.unitCostHt),
    lossPercent: d(c.lossPercent ?? 0),
    lineCostHt: d(c.lineCostHt),
    comment: c.comment ?? null,
    materialId: c.materialId ?? null,
    laborId: c.laborId ?? null,
    equipmentId: c.equipmentId ?? null,
  }));
  const costing = calculateWorkItemCosting({
    components,
    feesPercent: d(workItem.feesPercent),
    feesAmountHt: d(workItem.feesAmountHt),
    sellMode: workItem.sellMode === "FIXED_SELL" ? "FIXED_SELL" : "MARGIN",
    marginPercent: d(workItem.marginPercent),
    unitSellHt: d(workItem.unitSellHt),
  });
  return {
    workItemId: workItem.id,
    workItemName: workItem.name,
    workItemReference: workItem.reference,
    saleUnit: workItem.saleUnit,
    kind: workItem.kind,
    feesPercent: d(workItem.feesPercent),
    feesAmountHt: d(workItem.feesAmountHt),
    sellMode: workItem.sellMode,
    marginPercent: costing.marquePercent,
    unitCostHt: costing.costPriceHt,
    unitSellHt: costing.unitSellHt,
    snappedAt: new Date().toISOString(),
    components,
    breakdown: {
      materialsHt: costing.materialsHt,
      laborHt: costing.laborHt,
      equipmentHt: costing.equipmentHt,
      subcontractHt: costing.subcontractHt,
      otherHt: costing.otherHt,
      dryCostHt: costing.dryCostHt,
      feesHt: costing.feesHt,
      costPriceHt: costing.costPriceHt,
      marquePercent: costing.marquePercent,
      markupPercent: costing.markupPercent,
      sellCoefficient: costing.sellCoefficient,
    },
  };
}

export async function listWorkItems(
  orgId: string,
  opts?: {
    q?: string;
    take?: number;
    skip?: number;
    /** Défaut : actifs seulement (picker + biblio). */
    active?: boolean;
    kind?: "SIMPLE" | "COMPOSITE";
    favorite?: boolean;
    needsPriceRecalc?: boolean;
    /** Inclure composants (coûteux) — défaut false pour listes. */
    includeComponents?: boolean;
  },
) {
  const q = opts?.q?.trim();
  const active = opts?.active ?? true;
  const where: Prisma.CommercialWorkItemWhereInput = {
    organizationId: orgId,
    isActive: active,
    ...(opts?.kind ? { kind: opts.kind } : {}),
    ...(opts?.favorite ? { isFavorite: true } : {}),
    ...(opts?.needsPriceRecalc ? { needsPriceRecalc: true } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { reference: { contains: q, mode: "insensitive" } },
            { family: { contains: q, mode: "insensitive" } },
            { subFamily: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { tags: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const includeComponents = opts?.includeComponents === true;
  const rows = await prisma.commercialWorkItem.findMany({
    where,
    orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }, { name: "asc" }],
    take: opts?.take ?? 100,
    skip: opts?.skip ?? 0,
    include: {
      ...(includeComponents
        ? { components: { orderBy: { sortOrder: "asc" as const } } }
        : {}),
      _count: { select: { components: true, quoteLines: true } },
    },
  });
  return rows.map((w) => {
    const withComp = w as typeof w & {
      components?: Parameters<typeof mapComponent>[0][];
    };
    return {
      ...w,
      unitCostHt: d(w.unitCostHt),
      unitSellHt: d(w.unitSellHt),
      marginPercent: d(w.marginPercent),
      feesPercent: d(w.feesPercent),
      feesAmountHt: d(w.feesAmountHt),
      quoteLineCount: w._count.quoteLines,
      componentCount: w._count.components,
      components: includeComponents
        ? (withComp.components ?? []).map(mapComponent)
        : [],
    };
  });
}

export async function getLibraryHubStats(orgId: string) {
  const [ouvrages, materiaux, labor, needsRecalc, favorites] = await Promise.all([
    prisma.commercialWorkItem.count({
      where: { organizationId: orgId, isActive: true },
    }),
    prisma.commercialMaterial.count({
      where: { organizationId: orgId, isActive: true },
    }),
    prisma.commercialLaborResource.count({
      where: { organizationId: orgId, isActive: true },
    }),
    prisma.commercialWorkItem.count({
      where: {
        organizationId: orgId,
        isActive: true,
        needsPriceRecalc: true,
      },
    }),
    prisma.commercialWorkItem.count({
      where: { organizationId: orgId, isActive: true, isFavorite: true },
    }),
  ]);
  return {
    ouvrages,
    materiaux,
    mainOeuvre: labor,
    needsRecalc,
    favorites,
  };
}

export async function setWorkItemFavorite(
  orgId: string,
  id: string,
  isFavorite: boolean,
) {
  const existing = await prisma.commercialWorkItem.findFirst({
    where: { id, organizationId: orgId },
    select: { id: true },
  });
  if (!existing) throw new Error("Ouvrage introuvable");
  return prisma.commercialWorkItem.update({
    where: { id },
    data: { isFavorite },
  });
}

/** Décision UI/API : supprimer physiquement ou archiver. */
export function workItemRemovalMode(quoteLineCount: number): "delete" | "archive" {
  return quoteLineCount > 0 ? "archive" : "delete";
}

/** Nombre de lignes de devis liées (snapshot historique indépendant). */
export async function countWorkItemQuoteUsages(orgId: string, workItemId: string) {
  return prisma.commercialQuoteLine.count({
    where: { organizationId: orgId, commercialWorkItemId: workItemId },
  });
}


export async function getWorkItem(orgId: string, id: string) {
  const w = await prisma.commercialWorkItem.findFirst({
    where: { id, organizationId: orgId },
    include: {
      components: {
        orderBy: { sortOrder: "asc" },
        include: {
          material: { select: { id: true, name: true, currentPriceHt: true, unit: true } },
          labor: { select: { id: true, name: true, hourlyCostHt: true, loadedCostHt: true } },
          equipment: {
            select: { id: true, name: true, hourlyCostHt: true, dailyCostHt: true, unit: true },
          },
          subcontractor: { select: { id: true, name: true, tradeName: true } },
        },
      },
      createdBy: { select: { id: true, name: true } },
    },
  });
  if (!w) return null;
  const costing = calculateWorkItemCosting({
    components: w.components.map((c) => ({
      type: c.type,
      quantityPerUnit: d(c.quantityPerUnit),
      unitCostHt: d(c.unitCostHt),
      lossPercent: d(c.lossPercent),
    })),
    feesPercent: d(w.feesPercent),
    feesAmountHt: d(w.feesAmountHt),
    sellMode: w.sellMode === "FIXED_SELL" ? "FIXED_SELL" : "MARGIN",
    marginPercent: d(w.marginPercent),
    unitSellHt: d(w.unitSellHt),
  });
  return {
    ...w,
    unitCostHt: d(w.unitCostHt),
    unitSellHt: d(w.unitSellHt),
    marginPercent: d(w.marginPercent),
    feesPercent: d(w.feesPercent),
    feesAmountHt: d(w.feesAmountHt),
    components: w.components.map((c) => ({
      ...mapComponent(c),
      material: c.material
        ? { ...c.material, currentPriceHt: d(c.material.currentPriceHt) }
        : null,
      labor: c.labor
        ? {
            ...c.labor,
            hourlyCostHt: d(c.labor.hourlyCostHt),
            loadedCostHt: c.labor.loadedCostHt != null ? d(c.labor.loadedCostHt) : null,
          }
        : null,
      equipment: c.equipment
        ? {
            ...c.equipment,
            hourlyCostHt: c.equipment.hourlyCostHt != null ? d(c.equipment.hourlyCostHt) : null,
            dailyCostHt: c.equipment.dailyCostHt != null ? d(c.equipment.dailyCostHt) : null,
          }
        : null,
    })),
    costing,
  };
}

export async function createWorkItem(
  orgId: string,
  data: {
    name: string;
    reference?: string | null;
    description?: string | null;
    family?: string | null;
    subFamily?: string | null;
    tags?: string | null;
    saleUnit?: string;
    kind?: "SIMPLE" | "COMPOSITE";
    unitSellHt?: number;
    marginPercent?: number;
    feesPercent?: number;
    feesAmountHt?: number;
    sellMode?: "MARGIN" | "FIXED_SELL";
    createdById?: string | null;
  },
) {
  const name = data.name.trim();
  if (!name) throw new Error("Nom d’ouvrage requis");
  const kind = data.kind ?? "SIMPLE";
  return prisma.commercialWorkItem.create({
    data: {
      organizationId: orgId,
      name,
      reference: data.reference ?? null,
      description: data.description ?? null,
      family: data.family ?? null,
      subFamily: data.subFamily ?? null,
      tags: data.tags ?? null,
      saleUnit: data.saleUnit ?? "U",
      kind,
      unitSellHt: data.unitSellHt ?? 0,
      marginPercent: data.marginPercent ?? 0,
      feesPercent: data.feesPercent ?? 0,
      feesAmountHt: data.feesAmountHt ?? 0,
      sellMode: data.sellMode ?? "MARGIN",
      createdById: data.createdById ?? null,
    },
  });
}

export async function updateWorkItem(
  orgId: string,
  id: string,
  data: {
    name?: string;
    reference?: string | null;
    description?: string | null;
    family?: string | null;
    subFamily?: string | null;
    tags?: string | null;
    saleUnit?: string;
    kind?: "SIMPLE" | "COMPOSITE";
    unitSellHt?: number;
    marginPercent?: number;
    feesPercent?: number;
    feesAmountHt?: number;
    sellMode?: "MARGIN" | "FIXED_SELL";
    isActive?: boolean;
  },
) {
  const existing = await prisma.commercialWorkItem.findFirst({
    where: { id, organizationId: orgId },
    include: { components: true },
  });
  if (!existing) throw new Error("Ouvrage introuvable");

  const feesPercent = data.feesPercent ?? d(existing.feesPercent);
  const feesAmountHt = data.feesAmountHt ?? d(existing.feesAmountHt);
  const sellMode =
    data.sellMode ??
    (existing.sellMode === "FIXED_SELL" ? "FIXED_SELL" : "MARGIN");

  let unitSellHt = data.unitSellHt;
  let marginPercent = data.marginPercent;

  const costing = calculateWorkItemCosting({
    components: existing.components.map((c) => ({
      type: c.type,
      quantityPerUnit: d(c.quantityPerUnit),
      unitCostHt: d(c.unitCostHt),
      lossPercent: d(c.lossPercent),
    })),
    feesPercent,
    feesAmountHt,
    sellMode,
    marginPercent: marginPercent ?? d(existing.marginPercent),
    unitSellHt: unitSellHt ?? d(existing.unitSellHt),
  });

  if (sellMode === "FIXED_SELL" && unitSellHt !== undefined) {
    marginPercent = costing.marquePercent;
  } else if (sellMode === "MARGIN" && marginPercent !== undefined) {
    unitSellHt = costing.unitSellHt;
  } else if (unitSellHt !== undefined && marginPercent === undefined) {
    marginPercent = marginPercentFromCostSell(costing.costPriceHt, unitSellHt);
  } else if (marginPercent !== undefined && unitSellHt === undefined) {
    unitSellHt = costing.unitSellHt;
  }

  await prisma.commercialWorkItem.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.reference !== undefined ? { reference: data.reference } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.family !== undefined ? { family: data.family } : {}),
      ...(data.subFamily !== undefined ? { subFamily: data.subFamily } : {}),
      ...(data.tags !== undefined ? { tags: data.tags } : {}),
      ...(data.saleUnit !== undefined ? { saleUnit: data.saleUnit } : {}),
      ...(data.kind !== undefined ? { kind: data.kind } : {}),
      ...(data.feesPercent !== undefined ? { feesPercent: data.feesPercent } : {}),
      ...(data.feesAmountHt !== undefined ? { feesAmountHt: data.feesAmountHt } : {}),
      ...(data.sellMode !== undefined ? { sellMode: data.sellMode } : {}),
      ...(unitSellHt !== undefined ? { unitSellHt } : {}),
      ...(marginPercent !== undefined ? { marginPercent } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      unitCostHt: costing.costPriceHt,
      needsPriceRecalc: false,
    },
  });
  return getWorkItem(orgId, id);
}

/** Archive : reste en historique, retiré des nouveaux devis. Ne touche aucun devis. */
export async function archiveWorkItem(orgId: string, id: string) {
  const existing = await prisma.commercialWorkItem.findFirst({
    where: { id, organizationId: orgId },
    select: { id: true, isActive: true },
  });
  if (!existing) throw new Error("Ouvrage introuvable");
  if (!existing.isActive) return getWorkItem(orgId, id);
  await prisma.commercialWorkItem.update({
    where: { id },
    data: { isActive: false },
  });
  return getWorkItem(orgId, id);
}

/** Restaure un ouvrage archivé (de nouveau sélectionnable). */
export async function restoreWorkItem(orgId: string, id: string) {
  const existing = await prisma.commercialWorkItem.findFirst({
    where: { id, organizationId: orgId },
    select: { id: true },
  });
  if (!existing) throw new Error("Ouvrage introuvable");
  await prisma.commercialWorkItem.update({
    where: { id },
    data: { isActive: true },
  });
  return getWorkItem(orgId, id);
}

/**
 * Suppression physique uniquement si l’ouvrage n’est lié à aucune ligne de devis.
 * Sinon → archiver (isActive=false). Ne modifie jamais les snapshots de devis.
 */
export async function deleteWorkItem(orgId: string, id: string) {
  const existing = await prisma.commercialWorkItem.findFirst({
    where: { id, organizationId: orgId },
    select: { id: true },
  });
  if (!existing) throw new Error("Ouvrage introuvable");

  const usage = await countWorkItemQuoteUsages(orgId, id);
  if (usage > 0) {
    const err = new Error(
      "Cet ouvrage a déjà été utilisé dans un devis. Archivez-le pour le retirer des nouveaux devis.",
    ) as Error & { code?: string; usageCount?: number };
    err.code = "WORK_ITEM_IN_USE";
    err.usageCount = usage;
    throw err;
  }

  await prisma.commercialWorkItem.delete({
    where: { id },
  });
  return { deleted: true as const };
}

export async function duplicateWorkItem(orgId: string, id: string, createdById?: string) {
  const source = await prisma.commercialWorkItem.findFirst({
    where: { id, organizationId: orgId },
    include: { components: { orderBy: { sortOrder: "asc" } } },
  });
  if (!source) throw new Error("Ouvrage introuvable");

  return prisma.$transaction(async (tx) => {
    const copy = await tx.commercialWorkItem.create({
      data: {
        organizationId: orgId,
        name: `${source.name} (copie)`,
        reference: source.reference ? `${source.reference}-COP` : null,
        description: source.description,
        family: source.family,
        subFamily: source.subFamily,
        tags: source.tags,
        saleUnit: source.saleUnit,
        kind: source.kind,
        unitCostHt: source.unitCostHt,
        unitSellHt: source.unitSellHt,
        marginPercent: source.marginPercent,
        feesPercent: source.feesPercent,
        feesAmountHt: source.feesAmountHt,
        sellMode: source.sellMode,
        createdById: createdById ?? source.createdById,
      },
    });
    if (source.components.length) {
      await tx.commercialWorkItemComponent.createMany({
        data: source.components.map((c) => ({
          organizationId: orgId,
          workItemId: copy.id,
          name: c.name,
          type: c.type,
          quantityPerUnit: c.quantityPerUnit,
          unit: c.unit,
          unitCostHt: c.unitCostHt,
          lineCostHt: c.lineCostHt,
          lossPercent: c.lossPercent,
          comment: c.comment,
          materialId: c.materialId,
          laborId: c.laborId,
          equipmentId: c.equipmentId,
          subcontractorExternalOrgId: c.subcontractorExternalOrgId,
          sortOrder: c.sortOrder,
        })),
      });
    }
    return copy;
  });
}

export async function upsertWorkItemComponent(
  orgId: string,
  workItemId: string,
  input: {
    componentId?: string;
    name: string;
    type?: CommercialComponentType;
    quantityPerUnit?: number;
    unit?: string;
    unitCostHt?: number;
    lossPercent?: number;
    comment?: string | null;
    materialId?: string | null;
    laborId?: string | null;
    equipmentId?: string | null;
    subcontractorExternalOrgId?: string | null;
    sortOrder?: number;
  },
) {
  const workItem = await prisma.commercialWorkItem.findFirst({
    where: { id: workItemId, organizationId: orgId },
    select: { id: true },
  });
  if (!workItem) throw new Error("Ouvrage introuvable");

  // Cross-org: vérifier chaque ressource liée
  if (input.materialId) {
    const m = await prisma.commercialMaterial.findFirst({
      where: { id: input.materialId, organizationId: orgId },
      select: { id: true, currentPriceHt: true, unit: true, name: true },
    });
    if (!m) throw new Error("Matériau introuvable dans cette organisation");
    if (input.unitCostHt === undefined) input.unitCostHt = d(m.currentPriceHt);
    if (!input.unit) input.unit = m.unit;
    if (!input.name.trim()) input.name = m.name;
  }
  if (input.laborId) {
    const l = await prisma.commercialLaborResource.findFirst({
      where: { id: input.laborId, organizationId: orgId },
      select: { id: true, hourlyCostHt: true, loadedCostHt: true, name: true },
    });
    if (!l) throw new Error("Main-d’œuvre introuvable dans cette organisation");
    const cost = l.loadedCostHt != null ? d(l.loadedCostHt) : d(l.hourlyCostHt);
    if (input.unitCostHt === undefined) input.unitCostHt = cost;
    if (!input.unit) input.unit = "h";
    if (!input.name.trim()) input.name = l.name;
  }
  if (input.equipmentId) {
    const e = await prisma.commercialEquipmentResource.findFirst({
      where: { id: input.equipmentId, organizationId: orgId },
      select: { id: true, hourlyCostHt: true, dailyCostHt: true, unit: true, name: true },
    });
    if (!e) throw new Error("Matériel introuvable dans cette organisation");
    if (input.unitCostHt === undefined) {
      input.unitCostHt =
        e.unit === "j" && e.dailyCostHt != null
          ? d(e.dailyCostHt)
          : d(e.hourlyCostHt ?? e.dailyCostHt ?? 0);
    }
    if (!input.unit) input.unit = e.unit;
    if (!input.name.trim()) input.name = e.name;
  }
  if (input.subcontractorExternalOrgId) {
    const s = await prisma.externalOrganization.findFirst({
      where: { id: input.subcontractorExternalOrgId, hostOrganizationId: orgId },
      select: { id: true },
    });
    if (!s) throw new Error("Sous-traitant introuvable dans cette organisation");
  }

  const quantityPerUnit = input.quantityPerUnit ?? 1;
  const unitCostHt = input.unitCostHt ?? 0;
  const lossPercent = input.lossPercent ?? 0;
  const lineCostHt = calculateComponentLineCost({
    quantityPerUnit,
    unitCostHt,
    lossPercent,
  });

  const payload = {
    name: input.name.trim(),
    type: input.type ?? "MATERIAL",
    quantityPerUnit,
    unit: input.unit ?? "U",
    unitCostHt,
    lineCostHt,
    lossPercent,
    comment: input.comment ?? null,
    materialId: input.materialId ?? null,
    laborId: input.laborId ?? null,
    equipmentId: input.equipmentId ?? null,
    subcontractorExternalOrgId: input.subcontractorExternalOrgId ?? null,
    ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
  };

  if (input.componentId) {
    const existing = await prisma.commercialWorkItemComponent.findFirst({
      where: { id: input.componentId, organizationId: orgId, workItemId },
      select: { id: true },
    });
    if (!existing) throw new Error("Composant introuvable");
    await prisma.commercialWorkItemComponent.update({
      where: { id: input.componentId },
      data: payload,
    });
  } else {
    const max = await prisma.commercialWorkItemComponent.aggregate({
      where: { workItemId },
      _max: { sortOrder: true },
    });
    await prisma.commercialWorkItemComponent.create({
      data: {
        organizationId: orgId,
        workItemId,
        sortOrder: input.sortOrder ?? (max._max.sortOrder ?? -1) + 1,
        ...payload,
      },
    });
  }

  await prisma.commercialWorkItem.update({
    where: { id: workItemId },
    data: { kind: "COMPOSITE" },
  });

  return recomputeWorkItemCost(orgId, workItemId);
}

export async function deleteWorkItemComponent(
  orgId: string,
  workItemId: string,
  componentId: string,
) {
  const existing = await prisma.commercialWorkItemComponent.findFirst({
    where: { id: componentId, organizationId: orgId, workItemId },
    select: { id: true },
  });
  if (!existing) throw new Error("Composant introuvable");
  await prisma.commercialWorkItemComponent.delete({ where: { id: componentId } });
  return recomputeWorkItemCost(orgId, workItemId);
}

export async function recomputeWorkItemCost(orgId: string, workItemId: string) {
  const workItem = await prisma.commercialWorkItem.findFirst({
    where: { id: workItemId, organizationId: orgId },
    include: { components: true },
  });
  if (!workItem) throw new Error("Ouvrage introuvable");

  const costing = calculateWorkItemCosting({
    components: workItem.components.map((c) => ({
      type: c.type,
      quantityPerUnit: d(c.quantityPerUnit),
      unitCostHt: d(c.unitCostHt),
      lossPercent: d(c.lossPercent),
    })),
    feesPercent: d(workItem.feesPercent),
    feesAmountHt: d(workItem.feesAmountHt),
    sellMode: workItem.sellMode === "FIXED_SELL" ? "FIXED_SELL" : "MARGIN",
    marginPercent: d(workItem.marginPercent),
    unitSellHt: d(workItem.unitSellHt),
  });

  // Recalcule aussi lineCostHt des composants (pertes)
  for (const c of workItem.components) {
    const lineCostHt = calculateComponentLineCost({
      quantityPerUnit: d(c.quantityPerUnit),
      unitCostHt: d(c.unitCostHt),
      lossPercent: d(c.lossPercent),
    });
    if (roundMoney(lineCostHt, 4) !== roundMoney(d(c.lineCostHt), 4)) {
      await prisma.commercialWorkItemComponent.update({
        where: { id: c.id },
        data: { lineCostHt },
      });
    }
  }

  await prisma.commercialWorkItem.update({
    where: { id: workItemId },
    data: {
      unitCostHt: costing.costPriceHt,
      unitSellHt: costing.unitSellHt,
      marginPercent: costing.marquePercent,
      needsPriceRecalc: false,
    },
  });
  return getWorkItem(orgId, workItemId);
}

/** Après changement de prix matériau : maj coûts composants + flag ouvrages (pas les devis). */
export async function refreshWorkItemsAfterMaterialPriceChange(
  orgId: string,
  materialId: string,
  newPriceHt: number,
) {
  const comps = await prisma.commercialWorkItemComponent.findMany({
    where: { organizationId: orgId, materialId },
    select: {
      id: true,
      workItemId: true,
      quantityPerUnit: true,
      lossPercent: true,
    },
  });
  if (!comps.length) return { updatedComponents: 0, workItemIds: [] as string[] };

  const workItemIds = [...new Set(comps.map((c) => c.workItemId))];

  await prisma.$transaction(async (tx) => {
    for (const c of comps) {
      const lineCostHt = calculateComponentLineCost({
        quantityPerUnit: d(c.quantityPerUnit),
        unitCostHt: newPriceHt,
        lossPercent: d(c.lossPercent),
      });
      await tx.commercialWorkItemComponent.update({
        where: { id: c.id },
        data: { unitCostHt: newPriceHt, lineCostHt },
      });
    }

    for (const wid of workItemIds) {
      const workItem = await tx.commercialWorkItem.findFirst({
        where: { id: wid, organizationId: orgId },
        include: { components: true },
      });
      if (!workItem) continue;
      const costing = calculateWorkItemCosting({
        components: workItem.components.map((c) => ({
          type: c.type,
          quantityPerUnit: d(c.quantityPerUnit),
          unitCostHt: d(c.unitCostHt),
          lossPercent: d(c.lossPercent),
        })),
        feesPercent: d(workItem.feesPercent),
        feesAmountHt: d(workItem.feesAmountHt),
        sellMode: workItem.sellMode === "FIXED_SELL" ? "FIXED_SELL" : "MARGIN",
        marginPercent: d(workItem.marginPercent),
        unitSellHt: d(workItem.unitSellHt),
      });
      await tx.commercialWorkItem.update({
        where: { id: wid },
        data: {
          unitCostHt: costing.costPriceHt,
          unitSellHt: costing.unitSellHt,
          marginPercent: costing.marquePercent,
          needsPriceRecalc: false,
        },
      });
    }
  });

  return { updatedComponents: comps.length, workItemIds };
}

export async function countWorkItemsUsingMaterial(orgId: string, materialId: string) {
  const rows = await prisma.commercialWorkItemComponent.findMany({
    where: { organizationId: orgId, materialId },
    select: { workItemId: true },
    distinct: ["workItemId"],
  });
  return rows.length;
}

/* ─── Matériaux V2.1 — prix fournisseurs / prix retenu / historique ─── */

export const MATERIAL_PRICE_SOURCE = {
  MANUAL: "MANUAL",
  PURCHASE_ORDER: "PURCHASE_ORDER",
  IMPORT: "IMPORT",
} as const;

/** Seuil d’alerte écart prix fournisseur vs prix retenu */
export const MATERIAL_PRICE_DIFF_ALERT_PERCENT = 5;
/** Prix retenu « ancien » au-delà de N jours → à vérifier */
export const MATERIAL_REFERENCE_STALE_DAYS = 180;
const LOW_MARGIN_THRESHOLD = 15;

function supplierDisplayName(s: {
  tradeName?: string | null;
  name: string;
} | null | undefined) {
  if (!s) return null;
  return (s.tradeName || s.name).trim() || null;
}

function normalizePriceSource(raw?: string | null): string {
  const s = (raw ?? MATERIAL_PRICE_SOURCE.MANUAL).trim().toUpperCase();
  if (s === "PURCHASE_ORDER" || s === "IMPORT" || s === "MANUAL") return s;
  return raw?.trim() || MATERIAL_PRICE_SOURCE.MANUAL;
}

async function assertSupplierInOrg(orgId: string, supplierExternalOrgId: string) {
  const s = await prisma.externalOrganization.findFirst({
    where: {
      id: supplierExternalOrgId,
      hostOrganizationId: orgId,
      type: "SUPPLIER",
    },
    select: { id: true, name: true, tradeName: true, status: true },
  });
  if (!s) throw new Error("Fournisseur introuvable dans cette organisation");
  return s;
}

/** Dernier prix par fournisseur (pour UI drawer). */
export function groupLatestSupplierPrices(
  prices: Array<{
    id: string;
    priceHt: number;
    supplierName: string | null;
    supplierExternalOrgId: string | null;
    supplierReference: string | null;
    source: string | null;
    notedAt: Date;
    supplier?: { id: string; name: string; tradeName: string | null } | null;
  }>,
) {
  const map = new Map<
    string,
    {
      key: string;
      supplierExternalOrgId: string | null;
      supplierName: string;
      priceHt: number;
      priceId: string;
      notedAt: Date;
      source: string | null;
      supplierReference: string | null;
    }
  >();
  for (const p of prices) {
    const name =
      supplierDisplayName(p.supplier) || p.supplierName || "Fournisseur";
    const key = p.supplierExternalOrgId || `name:${name.toLowerCase()}`;
    const existing = map.get(key);
    if (!existing || p.notedAt > existing.notedAt) {
      map.set(key, {
        key,
        supplierExternalOrgId: p.supplierExternalOrgId,
        supplierName: name,
        priceHt: p.priceHt,
        priceId: p.id,
        notedAt: p.notedAt,
        source: p.source,
        supplierReference: p.supplierReference,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.notedAt.getTime() - a.notedAt.getTime());
}

export function materialNeedsPriceReview(input: {
  currentPriceHt: number;
  referencePriceUpdatedAt: Date | null | undefined;
  latestSupplierPriceHt: number | null;
  now?: Date;
}): {
  needsReview: boolean;
  reasons: Array<"STALE" | "SUPPLIER_DIFF" | "NO_PRICE">;
} {
  const reasons: Array<"STALE" | "SUPPLIER_DIFF" | "NO_PRICE"> = [];
  const now = input.now ?? new Date();
  if (!(input.currentPriceHt > 0)) reasons.push("NO_PRICE");
  if (input.referencePriceUpdatedAt) {
    const days =
      (now.getTime() - input.referencePriceUpdatedAt.getTime()) / 86_400_000;
    if (days >= MATERIAL_REFERENCE_STALE_DAYS) reasons.push("STALE");
  } else if (input.currentPriceHt > 0) {
    reasons.push("STALE");
  }
  if (
    input.latestSupplierPriceHt != null &&
    input.currentPriceHt > 0
  ) {
    const diffPct =
      Math.abs(input.latestSupplierPriceHt - input.currentPriceHt) /
      input.currentPriceHt *
      100;
    if (diffPct >= MATERIAL_PRICE_DIFF_ALERT_PERCENT) {
      reasons.push("SUPPLIER_DIFF");
    }
  }
  return { needsReview: reasons.length > 0, reasons };
}

export async function listMaterials(
  orgId: string,
  opts?: { q?: string; take?: number },
) {
  const q = opts?.q?.trim();
  const rows = await prisma.commercialMaterial.findMany({
    where: {
      organizationId: orgId,
      isActive: true,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { reference: { contains: q, mode: "insensitive" } },
              { family: { contains: q, mode: "insensitive" } },
              { supplierName: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    take: opts?.take ?? 200,
    include: {
      preferredSupplier: {
        select: { id: true, name: true, tradeName: true },
      },
      // Synthèse uniquement — pas l’historique complet
      prices: {
        orderBy: { notedAt: "desc" },
        take: 2,
        select: {
          priceHt: true,
          notedAt: true,
          supplierName: true,
          supplierExternalOrgId: true,
        },
      },
      _count: { select: { components: true } },
    },
  });
  return rows.map((m) => {
    const current = d(m.currentPriceHt);
    const prices = m.prices.map((p) => ({ ...p, priceHt: d(p.priceHt) }));
    const previous = prices.length > 1 ? prices[1].priceHt : null;
    const variationPercent =
      previous != null && previous !== 0
        ? roundMoney(((current - previous) / previous) * 100, 1)
        : null;
    const preferredName =
      supplierDisplayName(m.preferredSupplier) || m.supplierName;
    const latestSupplier = prices[0]?.priceHt ?? null;
    const review = materialNeedsPriceReview({
      currentPriceHt: current,
      referencePriceUpdatedAt: m.referencePriceUpdatedAt,
      latestSupplierPriceHt: latestSupplier,
    });
    return {
      ...m,
      currentPriceHt: current,
      preferredSupplierName: preferredName,
      variationPercent,
      needsPriceReview: review.needsReview,
      reviewReasons: review.reasons,
      // Liste : pas d’historique complet (déjà limité à 2 en query)
      prices,
    };
  });
}

export async function getMaterial(orgId: string, id: string) {
  const m = await prisma.commercialMaterial.findFirst({
    where: { id, organizationId: orgId },
    include: {
      preferredSupplier: {
        select: { id: true, name: true, tradeName: true, city: true },
      },
      prices: {
        orderBy: { notedAt: "desc" },
        take: 50,
        include: {
          supplier: {
            select: { id: true, name: true, tradeName: true, city: true },
          },
        },
      },
    },
  });
  if (!m) return null;

  const prices = m.prices.map((p) => ({
    ...p,
    priceHt: d(p.priceHt),
  }));
  const current = d(m.currentPriceHt);
  const previous = prices.length > 1 ? prices[1].priceHt : null;
  const variationHt =
    previous != null ? roundMoney(current - previous, 4) : null;
  const variationPercent =
    previous != null && previous !== 0
      ? roundMoney((variationHt! / previous) * 100, 2)
      : null;

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const oldInWindow = [...prices]
    .reverse()
    .find((p) => p.notedAt <= threeMonthsAgo);
  const evolution3m =
    oldInWindow && oldInWindow.priceHt !== 0
      ? roundMoney(((current - oldInWindow.priceHt) / oldInWindow.priceHt) * 100, 1)
      : variationPercent;

  const supplierQuotes = groupLatestSupplierPrices(prices);
  const preferredId = m.preferredSupplierExternalOrgId;
  const usedBy = await listWorkItemsUsingMaterialDetail(orgId, id);
  const review = materialNeedsPriceReview({
    currentPriceHt: current,
    referencePriceUpdatedAt: m.referencePriceUpdatedAt,
    latestSupplierPriceHt: supplierQuotes[0]?.priceHt ?? null,
  });

  const referenceSourceLabel = (() => {
    const match = prices.find(
      (p) => roundMoney(p.priceHt, 4) === roundMoney(current, 4),
    );
    if (!match) return m.priceSource ?? null;
    const name =
      supplierDisplayName(match.supplier) || match.supplierName || null;
    const date = match.notedAt.toLocaleDateString("fr-FR");
    return name ? `${name} · ${date}` : date;
  })();

  return {
    ...m,
    currentPriceHt: current,
    preferredSupplierName:
      supplierDisplayName(m.preferredSupplier) || m.supplierName,
    prices,
    supplierQuotes,
    usedByWorkItemCount: usedBy.length,
    usedByWorkItems: usedBy,
    previousPriceHt: previous,
    variationHt,
    variationPercent,
    evolution3mPercent: evolution3m,
    referenceSourceLabel,
    needsPriceReview: review.needsReview,
    reviewReasons: review.reasons,
  };
}

export async function listWorkItemsUsingMaterialDetail(
  orgId: string,
  materialId: string,
) {
  const comps = await prisma.commercialWorkItemComponent.findMany({
    where: { organizationId: orgId, materialId },
    select: { workItemId: true },
    distinct: ["workItemId"],
  });
  if (!comps.length) return [];
  const ids = comps.map((c) => c.workItemId);
  const items = await prisma.commercialWorkItem.findMany({
    where: { organizationId: orgId, id: { in: ids }, isActive: true },
    select: {
      id: true,
      name: true,
      saleUnit: true,
      unitCostHt: true,
      unitSellHt: true,
      marginPercent: true,
      kind: true,
    },
    orderBy: { name: "asc" },
  });
  return items.map((w) => ({
    ...w,
    unitCostHt: d(w.unitCostHt),
    unitSellHt: d(w.unitSellHt),
    marginPercent: d(w.marginPercent),
  }));
}

export async function createMaterial(
  orgId: string,
  data: {
    name: string;
    reference?: string | null;
    family?: string | null;
    unit?: string;
    supplierName?: string | null;
    manufacturer?: string | null;
    priceSource?: string | null;
    currentPriceHt?: number;
    notes?: string | null;
  },
) {
  const name = data.name.trim();
  if (!name) throw new Error("Nom matériau requis");
  const price = data.currentPriceHt ?? 0;
  const source = normalizePriceSource(data.priceSource ?? MATERIAL_PRICE_SOURCE.MANUAL);
  return prisma.$transaction(async (tx) => {
    const material = await tx.commercialMaterial.create({
      data: {
        organizationId: orgId,
        name,
        reference: data.reference ?? null,
        family: data.family ?? null,
        unit: data.unit ?? "U",
        supplierName: data.supplierName ?? null,
        manufacturer: data.manufacturer ?? null,
        priceSource: source,
        currentPriceHt: price,
        referencePriceUpdatedAt: price > 0 ? new Date() : null,
        notes: data.notes ?? null,
      },
    });
    if (price > 0) {
      await tx.commercialMaterialPrice.create({
        data: {
          organizationId: orgId,
          materialId: material.id,
          priceHt: price,
          source,
          supplierName: data.supplierName ?? null,
        },
      });
    }
    return material;
  });
}

/**
 * Ajoute un relevé prix fournisseur sans changer le prix retenu.
 * Retourne un prompt si l’écart vs prix retenu ≥ 5 %.
 */
export async function addMaterialSupplierPrice(
  orgId: string,
  materialId: string,
  data: {
    priceHt: number;
    supplierExternalOrgId?: string | null;
    supplierName?: string | null;
    supplierReference?: string | null;
    source?: string | null;
    notedAt?: Date | null;
    comment?: string | null;
    purchaseOrderLineId?: string | null;
  },
) {
  const material = await prisma.commercialMaterial.findFirst({
    where: { id: materialId, organizationId: orgId },
    select: { id: true, currentPriceHt: true, unit: true },
  });
  if (!material) throw new Error("Matériau introuvable");

  const priceHt = roundMoney(Number(data.priceHt) || 0, 4);
  if (!(priceHt > 0)) throw new Error("Prix HT invalide");

  let supplierName = data.supplierName?.trim() || null;
  let supplierExternalOrgId = data.supplierExternalOrgId || null;
  if (supplierExternalOrgId) {
    const s = await assertSupplierInOrg(orgId, supplierExternalOrgId);
    supplierName = supplierDisplayName(s) || supplierName;
  }
  if (!supplierName && !supplierExternalOrgId) {
    throw new Error("Indiquez un fournisseur");
  }

  if (data.purchaseOrderLineId) {
    const line = await prisma.purchaseOrderLine.findFirst({
      where: {
        id: data.purchaseOrderLineId,
        order: { organizationId: orgId },
      },
      select: { id: true },
    });
    if (!line) throw new Error("Ligne de commande introuvable");
  }

  const source = normalizePriceSource(data.source);
  const notedAt = data.notedAt ?? new Date();

  const price = await prisma.commercialMaterialPrice.create({
    data: {
      organizationId: orgId,
      materialId,
      priceHt,
      source,
      supplierName,
      supplierExternalOrgId,
      supplierReference: data.supplierReference?.trim() || null,
      purchaseOrderLineId: data.purchaseOrderLineId ?? null,
      notedAt,
      comment: data.comment?.trim() || null,
    },
  });

  const current = d(material.currentPriceHt);
  const diffPercent =
    current > 0
      ? roundMoney(((priceHt - current) / current) * 100, 1)
      : null;
  const suggestApply =
    current <= 0 ||
    (diffPercent != null &&
      Math.abs(diffPercent) >= MATERIAL_PRICE_DIFF_ALERT_PERCENT);

  return {
    price: { ...price, priceHt },
    currentPriceHt: current,
    diffPercent,
    suggestApply,
  };
}

export async function setMaterialPreferredSupplier(
  orgId: string,
  materialId: string,
  supplierExternalOrgId: string | null,
) {
  const material = await prisma.commercialMaterial.findFirst({
    where: { id: materialId, organizationId: orgId },
    select: { id: true },
  });
  if (!material) throw new Error("Matériau introuvable");

  let supplierName: string | null | undefined = undefined;
  if (supplierExternalOrgId) {
    const s = await assertSupplierInOrg(orgId, supplierExternalOrgId);
    supplierName = supplierDisplayName(s);
  } else {
    supplierName = null;
  }

  await prisma.commercialMaterial.update({
    where: { id: materialId },
    data: {
      preferredSupplierExternalOrgId: supplierExternalOrgId,
      ...(supplierName !== undefined ? { supplierName } : {}),
    },
  });
  return getMaterial(orgId, materialId);
}

export async function previewMaterialReferencePriceImpact(
  orgId: string,
  materialId: string,
  newPriceHt: number,
) {
  const material = await prisma.commercialMaterial.findFirst({
    where: { id: materialId, organizationId: orgId },
    select: { id: true, currentPriceHt: true, name: true, unit: true },
  });
  if (!material) throw new Error("Matériau introuvable");

  const oldPrice = d(material.currentPriceHt);
  const next = roundMoney(newPriceHt, 4);
  const diffPercent =
    oldPrice > 0 ? roundMoney(((next - oldPrice) / oldPrice) * 100, 1) : null;

  const comps = await prisma.commercialWorkItemComponent.findMany({
    where: { organizationId: orgId, materialId },
    include: {
      workItem: {
        include: { components: true },
      },
    },
  });

  const byWork = new Map<string, (typeof comps)[0]["workItem"]>();
  for (const c of comps) {
    if (c.workItem.organizationId !== orgId) continue;
    byWork.set(c.workItemId, c.workItem);
  }

  const impacts: Array<{
    id: string;
    name: string;
    oldCostHt: number;
    newCostHt: number;
    oldMarginPercent: number;
    newMarginPercent: number;
    marginDeltaPoints: number;
    belowLowMargin: boolean;
  }> = [];

  for (const w of byWork.values()) {
    const simulated = w.components.map((c) => ({
      type: c.type,
      quantityPerUnit: d(c.quantityPerUnit),
      unitCostHt:
        c.materialId === materialId ? next : d(c.unitCostHt),
      lossPercent: d(c.lossPercent),
    }));
    const oldCosting = calculateWorkItemCosting({
      components: w.components.map((c) => ({
        type: c.type,
        quantityPerUnit: d(c.quantityPerUnit),
        unitCostHt: d(c.unitCostHt),
        lossPercent: d(c.lossPercent),
      })),
      feesPercent: d(w.feesPercent),
      feesAmountHt: d(w.feesAmountHt),
      sellMode: w.sellMode === "FIXED_SELL" ? "FIXED_SELL" : "MARGIN",
      marginPercent: d(w.marginPercent),
      unitSellHt: d(w.unitSellHt),
    });
    const newCosting = calculateWorkItemCosting({
      components: simulated,
      feesPercent: d(w.feesPercent),
      feesAmountHt: d(w.feesAmountHt),
      sellMode: w.sellMode === "FIXED_SELL" ? "FIXED_SELL" : "MARGIN",
      marginPercent: d(w.marginPercent),
      unitSellHt: d(w.unitSellHt),
    });
    const marginDelta = roundMoney(
      newCosting.marquePercent - oldCosting.marquePercent,
      1,
    );
    impacts.push({
      id: w.id,
      name: w.name,
      oldCostHt: oldCosting.costPriceHt,
      newCostHt: newCosting.costPriceHt,
      oldMarginPercent: oldCosting.marquePercent,
      newMarginPercent: newCosting.marquePercent,
      marginDeltaPoints: marginDelta,
      belowLowMargin:
        newCosting.marquePercent > 0 &&
        newCosting.marquePercent < LOW_MARGIN_THRESHOLD,
    });
  }

  const marginsDropOver2 = impacts.filter((i) => i.marginDeltaPoints <= -2).length;
  const belowLow = impacts.filter((i) => i.belowLowMargin).length;

  return {
    materialId,
    materialName: material.name,
    unit: material.unit,
    oldPriceHt: oldPrice,
    newPriceHt: next,
    diffPercent,
    workItemCount: impacts.length,
    marginsDropOver2Points: marginsDropOver2,
    belowLowMarginCount: belowLow,
    lowMarginThreshold: LOW_MARGIN_THRESHOLD,
    impacts,
  };
}

/**
 * Applique un nouveau prix retenu (+ historique) et recalcule les ouvrages.
 * Idempotent si le prix est déjà le prix retenu.
 */
export async function applyMaterialReferencePrice(
  orgId: string,
  materialId: string,
  data: {
    priceHt: number;
    fromPriceId?: string | null;
    supplierExternalOrgId?: string | null;
    supplierName?: string | null;
    source?: string | null;
    comment?: string | null;
    refreshWorkItems?: boolean;
  },
) {
  const material = await prisma.commercialMaterial.findFirst({
    where: { id: materialId, organizationId: orgId },
    select: {
      id: true,
      currentPriceHt: true,
      supplierName: true,
      preferredSupplierExternalOrgId: true,
    },
  });
  if (!material) throw new Error("Matériau introuvable");

  let priceHt = roundMoney(Number(data.priceHt) || 0, 4);
  let supplierName = data.supplierName?.trim() || null;
  let supplierExternalOrgId = data.supplierExternalOrgId || null;
  let source = normalizePriceSource(data.source);
  let supplierReference: string | null = null;

  if (data.fromPriceId) {
    const from = await prisma.commercialMaterialPrice.findFirst({
      where: {
        id: data.fromPriceId,
        materialId,
        organizationId: orgId,
      },
      include: {
        supplier: { select: { id: true, name: true, tradeName: true } },
      },
    });
    if (!from) throw new Error("Relevé de prix introuvable");
    priceHt = d(from.priceHt);
    supplierExternalOrgId = from.supplierExternalOrgId;
    supplierName =
      supplierDisplayName(from.supplier) || from.supplierName;
    source = normalizePriceSource(from.source);
    supplierReference = from.supplierReference;
  }

  if (supplierExternalOrgId) {
    const s = await assertSupplierInOrg(orgId, supplierExternalOrgId);
    supplierName = supplierDisplayName(s) || supplierName;
  }

  const current = d(material.currentPriceHt);
  if (roundMoney(current, 4) === roundMoney(priceHt, 4)) {
    return {
      material: await getMaterial(orgId, materialId),
      unchanged: true as const,
      refresh: { updatedComponents: 0, workItemIds: [] as string[] },
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.commercialMaterialPrice.create({
      data: {
        organizationId: orgId,
        materialId,
        priceHt,
        source,
        supplierName,
        supplierExternalOrgId,
        supplierReference,
        comment: data.comment?.trim() || "Prix retenu mis à jour",
      },
    });
    await tx.commercialMaterial.update({
      where: { id: materialId },
      data: {
        currentPriceHt: priceHt,
        referencePriceUpdatedAt: new Date(),
        priceSource: source,
        ...(supplierName ? { supplierName } : {}),
      },
    });
  });

  let refresh = { updatedComponents: 0, workItemIds: [] as string[] };
  if (data.refreshWorkItems !== false) {
    refresh = await refreshWorkItemsAfterMaterialPriceChange(
      orgId,
      materialId,
      priceHt,
    );
  }

  return {
    material: await getMaterial(orgId, materialId),
    unchanged: false as const,
    refresh,
  };
}

export async function updateMaterial(
  orgId: string,
  id: string,
  data: {
    name?: string;
    reference?: string | null;
    family?: string | null;
    unit?: string;
    supplierName?: string | null;
    manufacturer?: string | null;
    priceSource?: string | null;
    currentPriceHt?: number;
    notes?: string | null;
    isActive?: boolean;
    refreshWorkItems?: boolean;
  },
) {
  const existing = await prisma.commercialMaterial.findFirst({
    where: { id, organizationId: orgId },
    select: { id: true, currentPriceHt: true },
  });
  if (!existing) throw new Error("Matériau introuvable");

  const priceChanged =
    data.currentPriceHt !== undefined &&
    roundMoney(data.currentPriceHt, 4) !== roundMoney(d(existing.currentPriceHt), 4);

  if (priceChanged) {
    const result = await applyMaterialReferencePrice(orgId, id, {
      priceHt: data.currentPriceHt!,
      supplierName: data.supplierName,
      source: data.priceSource ?? MATERIAL_PRICE_SOURCE.MANUAL,
      refreshWorkItems: data.refreshWorkItems !== false,
    });
    return result.material;
  }

  await prisma.commercialMaterial.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.reference !== undefined ? { reference: data.reference } : {}),
      ...(data.family !== undefined ? { family: data.family } : {}),
      ...(data.unit !== undefined ? { unit: data.unit } : {}),
      ...(data.supplierName !== undefined ? { supplierName: data.supplierName } : {}),
      ...(data.manufacturer !== undefined ? { manufacturer: data.manufacturer } : {}),
      ...(data.priceSource !== undefined ? { priceSource: data.priceSource } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  });

  return getMaterial(orgId, id);
}

/* ─── Main-d’œuvre ─── */

export async function listLaborResources(orgId: string) {
  const rows = await prisma.commercialLaborResource.findMany({
    where: { organizationId: orgId, isActive: true },
    orderBy: { name: "asc" },
  });
  return rows.map((l) => ({
    ...l,
    hourlyCostHt: d(l.hourlyCostHt),
    loadedCostHt: l.loadedCostHt != null ? d(l.loadedCostHt) : null,
  }));
}

export async function createLaborResource(
  orgId: string,
  data: {
    name: string;
    trade?: string | null;
    qualification?: string | null;
    hourlyCostHt?: number;
    loadedCostHt?: number | null;
    notes?: string | null;
  },
) {
  const name = data.name.trim();
  if (!name) throw new Error("Nom main-d’œuvre requis");
  return prisma.commercialLaborResource.create({
    data: {
      organizationId: orgId,
      name,
      trade: data.trade ?? null,
      qualification: data.qualification ?? null,
      hourlyCostHt: data.hourlyCostHt ?? 0,
      loadedCostHt: data.loadedCostHt ?? null,
      notes: data.notes ?? null,
    },
  });
}

export async function updateLaborResource(
  orgId: string,
  id: string,
  data: {
    name?: string;
    trade?: string | null;
    qualification?: string | null;
    hourlyCostHt?: number;
    loadedCostHt?: number | null;
    notes?: string | null;
    isActive?: boolean;
  },
) {
  const existing = await prisma.commercialLaborResource.findFirst({
    where: { id, organizationId: orgId },
    select: { id: true },
  });
  if (!existing) throw new Error("Ressource introuvable");
  return prisma.commercialLaborResource.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.trade !== undefined ? { trade: data.trade } : {}),
      ...(data.qualification !== undefined ? { qualification: data.qualification } : {}),
      ...(data.hourlyCostHt !== undefined ? { hourlyCostHt: data.hourlyCostHt } : {}),
      ...(data.loadedCostHt !== undefined ? { loadedCostHt: data.loadedCostHt } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  });
}

/* ─── Matériel ─── */

export async function listEquipmentResources(orgId: string) {
  const rows = await prisma.commercialEquipmentResource.findMany({
    where: { organizationId: orgId, isActive: true },
    orderBy: { name: "asc" },
  });
  return rows.map((e) => ({
    ...e,
    hourlyCostHt: e.hourlyCostHt != null ? d(e.hourlyCostHt) : null,
    dailyCostHt: e.dailyCostHt != null ? d(e.dailyCostHt) : null,
  }));
}

export async function createEquipmentResource(
  orgId: string,
  data: {
    name: string;
    kind?: string;
    category?: string | null;
    unit?: string;
    hourlyCostHt?: number | null;
    dailyCostHt?: number | null;
    notes?: string | null;
  },
) {
  const name = data.name.trim();
  if (!name) throw new Error("Nom matériel requis");
  return prisma.commercialEquipmentResource.create({
    data: {
      organizationId: orgId,
      name,
      kind: data.kind ?? "OWNED",
      category: data.category ?? null,
      unit: data.unit ?? "h",
      hourlyCostHt: data.hourlyCostHt ?? null,
      dailyCostHt: data.dailyCostHt ?? null,
      notes: data.notes ?? null,
    },
  });
}

export async function updateEquipmentResource(
  orgId: string,
  id: string,
  data: {
    name?: string;
    kind?: string;
    category?: string | null;
    unit?: string;
    hourlyCostHt?: number | null;
    dailyCostHt?: number | null;
    notes?: string | null;
    isActive?: boolean;
  },
) {
  const existing = await prisma.commercialEquipmentResource.findFirst({
    where: { id, organizationId: orgId },
    select: { id: true },
  });
  if (!existing) throw new Error("Matériel introuvable");
  return prisma.commercialEquipmentResource.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.kind !== undefined ? { kind: data.kind } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.unit !== undefined ? { unit: data.unit } : {}),
      ...(data.hourlyCostHt !== undefined ? { hourlyCostHt: data.hourlyCostHt } : {}),
      ...(data.dailyCostHt !== undefined ? { dailyCostHt: data.dailyCostHt } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  });
}

/** Export CSV simple bibliothèque (pas de dépendance lourde). */
export function workItemsToCsv(
  items: Array<{
    reference: string | null;
    name: string;
    family: string | null;
    saleUnit: string;
    kind: string;
    unitCostHt: number;
    unitSellHt: number;
    marginPercent: number;
  }>,
): string {
  const header = "reference;name;family;unit;kind;cost_ht;sell_ht;marque_percent";
  const lines = items.map((w) =>
    [
      w.reference ?? "",
      w.name,
      w.family ?? "",
      w.saleUnit,
      w.kind,
      String(w.unitCostHt).replace(".", ","),
      String(w.unitSellHt).replace(".", ","),
      String(w.marginPercent).replace(".", ","),
    ]
      .map((c) => `"${String(c).replace(/"/g, '""')}"`)
      .join(";"),
  );
  return `\uFEFF${[header, ...lines].join("\n")}`;
}
