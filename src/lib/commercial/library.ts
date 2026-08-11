import type { CommercialComponentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  calculateWorkItemUnitCost,
  marginPercentFromCostSell,
  roundMoney,
  sellFromCostAndMarginPercent,
} from "@/lib/commercial/money";
import { d } from "@/lib/commercial/decimal";

export async function listWorkItems(orgId: string) {
  const rows = await prisma.commercialWorkItem.findMany({
    where: { organizationId: orgId, isActive: true },
    orderBy: { name: "asc" },
    include: {
      components: { orderBy: { sortOrder: "asc" } },
    },
  });
  return rows.map((w) => ({
    ...w,
    unitCostHt: d(w.unitCostHt),
    unitSellHt: d(w.unitSellHt),
    marginPercent: d(w.marginPercent),
    components: w.components.map((c) => ({
      ...c,
      quantityPerUnit: d(c.quantityPerUnit),
      unitCostHt: d(c.unitCostHt),
      lineCostHt: d(c.lineCostHt),
    })),
  }));
}

export async function createWorkItem(
  orgId: string,
  data: {
    name: string;
    reference?: string | null;
    description?: string | null;
    family?: string | null;
    subFamily?: string | null;
    saleUnit?: string;
    unitSellHt?: number;
    marginPercent?: number;
  },
) {
  const name = data.name.trim();
  if (!name) throw new Error("Nom d’ouvrage requis");
  return prisma.commercialWorkItem.create({
    data: {
      organizationId: orgId,
      name,
      reference: data.reference ?? null,
      description: data.description ?? null,
      family: data.family ?? null,
      subFamily: data.subFamily ?? null,
      saleUnit: data.saleUnit ?? "U",
      unitSellHt: data.unitSellHt ?? 0,
      marginPercent: data.marginPercent ?? 0,
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
    saleUnit?: string;
    unitSellHt?: number;
    marginPercent?: number;
    isActive?: boolean;
  },
) {
  const existing = await prisma.commercialWorkItem.findFirst({
    where: { id, organizationId: orgId },
    select: { id: true, unitCostHt: true },
  });
  if (!existing) throw new Error("Ouvrage introuvable");

  const unitCostHt = d(existing.unitCostHt);
  let unitSellHt = data.unitSellHt;
  let marginPercent = data.marginPercent;

  if (unitSellHt !== undefined && marginPercent === undefined) {
    marginPercent = marginPercentFromCostSell(unitCostHt, unitSellHt);
  } else if (marginPercent !== undefined && unitSellHt === undefined) {
    unitSellHt = sellFromCostAndMarginPercent(unitCostHt, marginPercent);
  }

  return prisma.commercialWorkItem.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.reference !== undefined ? { reference: data.reference } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.family !== undefined ? { family: data.family } : {}),
      ...(data.subFamily !== undefined ? { subFamily: data.subFamily } : {}),
      ...(data.saleUnit !== undefined ? { saleUnit: data.saleUnit } : {}),
      ...(unitSellHt !== undefined ? { unitSellHt } : {}),
      ...(marginPercent !== undefined ? { marginPercent } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  });
}

export async function deleteWorkItem(orgId: string, id: string) {
  const existing = await prisma.commercialWorkItem.findFirst({
    where: { id, organizationId: orgId },
    select: { id: true },
  });
  if (!existing) throw new Error("Ouvrage introuvable");
  return prisma.commercialWorkItem.update({
    where: { id },
    data: { isActive: false },
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
    materialId?: string | null;
    laborId?: string | null;
    equipmentId?: string | null;
    sortOrder?: number;
  },
) {
  const workItem = await prisma.commercialWorkItem.findFirst({
    where: { id: workItemId, organizationId: orgId },
    select: { id: true, marginPercent: true },
  });
  if (!workItem) throw new Error("Ouvrage introuvable");

  const quantityPerUnit = input.quantityPerUnit ?? 1;
  const unitCostHt = input.unitCostHt ?? 0;
  const lineCostHt = roundMoney(quantityPerUnit * unitCostHt, 4);

  const payload = {
    name: input.name.trim(),
    type: input.type ?? "MATERIAL",
    quantityPerUnit,
    unit: input.unit ?? "U",
    unitCostHt,
    lineCostHt,
    materialId: input.materialId ?? null,
    laborId: input.laborId ?? null,
    equipmentId: input.equipmentId ?? null,
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

  const unitCostHt = calculateWorkItemUnitCost(
    workItem.components.map((c) => ({
      type: c.type,
      quantityPerUnit: d(c.quantityPerUnit),
      unitCostHt: d(c.unitCostHt),
    })),
  );
  const marginPercent = d(workItem.marginPercent);
  const unitSellHt =
    marginPercent > 0
      ? sellFromCostAndMarginPercent(unitCostHt, marginPercent)
      : d(workItem.unitSellHt) || unitCostHt;

  return prisma.commercialWorkItem.update({
    where: { id: workItemId },
    data: {
      unitCostHt,
      unitSellHt,
      marginPercent: marginPercentFromCostSell(unitCostHt, unitSellHt),
    },
    include: { components: { orderBy: { sortOrder: "asc" } } },
  });
}

/* ─── Matériaux ─── */

export async function listMaterials(orgId: string) {
  const rows = await prisma.commercialMaterial.findMany({
    where: { organizationId: orgId, isActive: true },
    orderBy: { name: "asc" },
    include: {
      prices: { orderBy: { notedAt: "desc" }, take: 5 },
    },
  });
  return rows.map((m) => ({
    ...m,
    currentPriceHt: d(m.currentPriceHt),
    prices: m.prices.map((p) => ({ ...p, priceHt: d(p.priceHt) })),
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
    currentPriceHt?: number;
    notes?: string | null;
  },
) {
  const name = data.name.trim();
  if (!name) throw new Error("Nom matériau requis");
  const price = data.currentPriceHt ?? 0;
  return prisma.$transaction(async (tx) => {
    const material = await tx.commercialMaterial.create({
      data: {
        organizationId: orgId,
        name,
        reference: data.reference ?? null,
        family: data.family ?? null,
        unit: data.unit ?? "U",
        supplierName: data.supplierName ?? null,
        currentPriceHt: price,
        notes: data.notes ?? null,
      },
    });
    if (price > 0) {
      await tx.commercialMaterialPrice.create({
        data: {
          organizationId: orgId,
          materialId: material.id,
          priceHt: price,
          source: "création",
        },
      });
    }
    return material;
  });
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
    currentPriceHt?: number;
    notes?: string | null;
    isActive?: boolean;
  },
) {
  const existing = await prisma.commercialMaterial.findFirst({
    where: { id, organizationId: orgId },
    select: { id: true, currentPriceHt: true },
  });
  if (!existing) throw new Error("Matériau introuvable");

  return prisma.$transaction(async (tx) => {
    if (
      data.currentPriceHt !== undefined &&
      roundMoney(data.currentPriceHt, 4) !== roundMoney(d(existing.currentPriceHt), 4)
    ) {
      await tx.commercialMaterialPrice.create({
        data: {
          organizationId: orgId,
          materialId: id,
          priceHt: data.currentPriceHt,
          source: "mise à jour",
        },
      });
    }
    return tx.commercialMaterial.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.reference !== undefined ? { reference: data.reference } : {}),
        ...(data.family !== undefined ? { family: data.family } : {}),
        ...(data.unit !== undefined ? { unit: data.unit } : {}),
        ...(data.supplierName !== undefined ? { supplierName: data.supplierName } : {}),
        ...(data.currentPriceHt !== undefined ? { currentPriceHt: data.currentPriceHt } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
  });
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
      ...(data.hourlyCostHt !== undefined ? { hourlyCostHt: data.hourlyCostHt } : {}),
      ...(data.loadedCostHt !== undefined ? { loadedCostHt: data.loadedCostHt } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  });
}
