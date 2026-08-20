/**
 * Démo SETRIM — référentiel ouvrages / ressources (bibliothèque commerciale).
 * Idempotent : ne recrée pas si les références démo existent déjà.
 */
import type { CommercialComponentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  calculateComponentLineCost,
  calculateWorkItemCosting,
  roundMoney,
} from "@/lib/commercial/money";
import { d } from "@/lib/commercial/decimal";
import { ensureCommercialOrgSettings } from "@/lib/commercial/settings";

const DEMO_MARK = "[DEMO-LIB]";

export async function seedDemoCommercialLibrary(opts: {
  organizationId: string;
  createdById?: string | null;
}): Promise<void> {
  const { organizationId, createdById } = opts;
  await ensureCommercialOrgSettings(organizationId);

  const existing = await prisma.commercialWorkItem.count({
    where: {
      organizationId,
      OR: [
        { reference: { startsWith: "ETA-" } },
        { name: { contains: DEMO_MARK } },
        { name: { contains: "Étanchéité bicouche" } },
      ],
    },
  });
  if (existing >= 3) return;

  const materialDefs = [
    {
      name: "Membrane SBS 4 mm",
      reference: "MAT-SBS-4",
      family: "Étanchéité",
      unit: "m²",
      price: 9.8,
      supplierName: "Distributeur étanchéité",
    },
    {
      name: "Primaire bitumineux",
      reference: "MAT-PRI-01",
      family: "Étanchéité",
      unit: "L",
      price: 4.2,
      supplierName: "Distributeur étanchéité",
    },
    {
      name: "Isolant PIR 120 mm",
      reference: "MAT-PIR-120",
      family: "Isolation",
      unit: "m²",
      price: 28.5,
      supplierName: "Distributeur isolation",
    },
    {
      name: "Gravillon de protection",
      reference: "MAT-GRAV",
      family: "Protection",
      unit: "m²",
      price: 3.4,
      supplierName: null,
    },
    {
      name: "Couvertine aluminium",
      reference: "MAT-COV-ALU",
      family: "Acrotères",
      unit: "ml",
      price: 22.0,
      supplierName: "Métallerie",
    },
  ] as const;

  const materials: Record<string, { id: string; price: number; unit: string }> = {};
  for (const m of materialDefs) {
    let row = await prisma.commercialMaterial.findFirst({
      where: { organizationId, reference: m.reference },
    });
    if (!row) {
      row = await prisma.commercialMaterial.create({
        data: {
          organizationId,
          name: m.name,
          reference: m.reference,
          family: m.family,
          unit: m.unit,
          supplierName: m.supplierName,
          currentPriceHt: m.price,
          referencePriceUpdatedAt: new Date(),
          priceSource: "MANUAL",
          isActive: true,
        },
      });
      await prisma.commercialMaterialPrice.create({
        data: {
          organizationId,
          materialId: row.id,
          priceHt: m.price,
          source: "MANUAL",
          supplierName: m.supplierName,
          notedAt: new Date("2026-01-10"),
          comment: `${DEMO_MARK} historique`,
        },
      });
      await prisma.commercialMaterialPrice.create({
        data: {
          organizationId,
          materialId: row.id,
          priceHt: roundMoney(m.price * 0.94, 2),
          source: "MANUAL",
          supplierName: m.supplierName,
          notedAt: new Date("2026-06-02"),
          comment: `${DEMO_MARK} historique`,
        },
      });
      await prisma.commercialMaterialPrice.create({
        data: {
          organizationId,
          materialId: row.id,
          priceHt: m.price,
          source: "MANUAL",
          supplierName: m.supplierName,
          notedAt: new Date("2026-08-18"),
          comment: `${DEMO_MARK} prix retenu`,
        },
      });
    }
    materials[m.reference] = {
      id: row.id,
      price: Number(row.currentPriceHt),
      unit: row.unit,
    };
  }

  let labor = await prisma.commercialLaborResource.findFirst({
    where: { organizationId, name: "Étancheur qualifié" },
  });
  if (!labor) {
    labor = await prisma.commercialLaborResource.create({
      data: {
        organizationId,
        name: "Étancheur qualifié",
        trade: "Étanchéité",
        qualification: "Qualifié",
        hourlyCostHt: 42,
        loadedCostHt: 58,
        isActive: true,
      },
    });
  }

  let equipment = await prisma.commercialEquipmentResource.findFirst({
    where: { organizationId, name: { contains: "Mini-pelle" } },
  });
  if (!equipment) {
    equipment = await prisma.commercialEquipmentResource.create({
      data: {
        organizationId,
        name: "Mini-pelle 2,5 T",
    kind: "RENTAL",
        category: "Terrassement",
        unit: "j",
        hourlyCostHt: 55,
        dailyCostHt: 320,
        isActive: true,
      },
    });
  }

  type CompInput = {
    name: string;
    type: CommercialComponentType;
    quantityPerUnit: number;
    unit: string;
    unitCostHt: number;
    lossPercent?: number;
    materialId?: string | null;
    laborId?: string | null;
    equipmentId?: string | null;
  };

  async function upsertWorkItem(optsWi: {
    reference: string;
    name: string;
    description: string;
    family: string;
    subFamily?: string;
    saleUnit: string;
    kind: "SIMPLE" | "COMPOSITE";
    unitSellHt?: number;
    marginPercent?: number;
    feesPercent?: number;
    sellMode?: "MARGIN" | "FIXED_SELL";
    isFavorite?: boolean;
    components?: CompInput[];
  }) {
    const found = await prisma.commercialWorkItem.findFirst({
      where: { organizationId, reference: optsWi.reference },
      select: { id: true },
    });
    if (found) return found.id;

    const comps = (optsWi.components ?? []).map((c, i) => {
      const line = calculateComponentLineCost({
        quantityPerUnit: c.quantityPerUnit,
        unitCostHt: c.unitCostHt,
        lossPercent: c.lossPercent ?? 0,
      });
      return {
        organizationId,
        name: c.name,
        type: c.type,
        quantityPerUnit: c.quantityPerUnit,
        unit: c.unit,
        unitCostHt: c.unitCostHt,
        lineCostHt: line,
        lossPercent: c.lossPercent ?? 0,
        materialId: c.materialId ?? null,
        laborId: c.laborId ?? null,
        equipmentId: c.equipmentId ?? null,
        sortOrder: i,
      };
    });

    const feesPercent = optsWi.feesPercent ?? (optsWi.kind === "COMPOSITE" ? 8 : 0);
    const marginPercent = optsWi.marginPercent ?? 30;
    const sellMode = optsWi.sellMode ?? (optsWi.kind === "SIMPLE" ? "FIXED_SELL" : "MARGIN");
    const costing = calculateWorkItemCosting({
      components: comps.map((c) => ({
        type: c.type,
        quantityPerUnit: d(c.quantityPerUnit),
        unitCostHt: d(c.unitCostHt),
        lossPercent: d(c.lossPercent),
      })),
      feesPercent,
      feesAmountHt: 0,
      marginPercent,
      sellMode,
      unitSellHt: optsWi.unitSellHt ?? 0,
    });

    const created = await prisma.commercialWorkItem.create({
      data: {
        organizationId,
        reference: optsWi.reference,
        name: optsWi.name,
        description: `${optsWi.description}\n${DEMO_MARK}`,
        family: optsWi.family,
        subFamily: optsWi.subFamily ?? null,
        saleUnit: optsWi.saleUnit,
        kind: optsWi.kind,
        unitCostHt: costing.costPriceHt,
        unitSellHt: costing.unitSellHt,
        marginPercent: costing.marquePercent,
        feesPercent,
        feesAmountHt: 0,
        sellMode,
        isFavorite: Boolean(optsWi.isFavorite),
        isActive: true,
        createdById: createdById ?? null,
        components: comps.length ? { create: comps } : undefined,
      },
    });
    return created.id;
  }

  const sbs = materials["MAT-SBS-4"];
  const pri = materials["MAT-PRI-01"];
  const pir = materials["MAT-PIR-120"];
  const grav = materials["MAT-GRAV"];
  const cov = materials["MAT-COV-ALU"];
  const laborCost = Number(labor.loadedCostHt ?? labor.hourlyCostHt);

  await upsertWorkItem({
    reference: "ETA-001",
    name: "Étanchéité bicouche élastomère",
    description:
      "Fourniture et pose d’une étanchéité bicouche élastomère, y compris primaire, selon plans d’exécution à valider.",
    family: "Étanchéité",
    subFamily: "Toiture terrasse",
    saleUnit: "m²",
    kind: "COMPOSITE",
    marginPercent: 30,
    feesPercent: 8,
    isFavorite: true,
    components: [
      {
        name: "Membrane SBS 4 mm",
        type: "MATERIAL",
        quantityPerUnit: 2.05,
        unit: "m²",
        unitCostHt: sbs.price,
        lossPercent: 3,
        materialId: sbs.id,
      },
      {
        name: "Primaire bitumineux",
        type: "MATERIAL",
        quantityPerUnit: 0.3,
        unit: "L",
        unitCostHt: pri.price,
        materialId: pri.id,
      },
      {
        name: "Étancheur qualifié",
        type: "LABOR",
        quantityPerUnit: 0.35,
        unit: "h",
        unitCostHt: laborCost,
        laborId: labor.id,
      },
      {
        name: "Mini-pelle 2,5 T",
        type: "EQUIPMENT",
        quantityPerUnit: 0.02,
        unit: "j",
        unitCostHt: Number(equipment.dailyCostHt ?? 320),
        equipmentId: equipment.id,
      },
    ],
  });

  await upsertWorkItem({
    reference: "ISO-001",
    name: "Isolation toiture terrasse",
    description:
      "Fourniture et pose d’isolant PIR en toiture terrasse, y compris découpes et sujétions courantes.",
    family: "Isolation",
    saleUnit: "m²",
    kind: "COMPOSITE",
    marginPercent: 28,
    feesPercent: 6,
    components: [
      {
        name: "Isolant PIR 120 mm",
        type: "MATERIAL",
        quantityPerUnit: 1.05,
        unit: "m²",
        unitCostHt: pir.price,
        lossPercent: 5,
        materialId: pir.id,
      },
      {
        name: "Étancheur qualifié",
        type: "LABOR",
        quantityPerUnit: 0.18,
        unit: "h",
        unitCostHt: laborCost,
        laborId: labor.id,
      },
    ],
  });

  await upsertWorkItem({
    reference: "ETA-002",
    name: "Relevé d’étanchéité",
    description:
      "Réalisation de relevés d’étanchéité courants, y compris angles et points singuliers courants.",
    family: "Étanchéité",
    saleUnit: "ml",
    kind: "COMPOSITE",
    marginPercent: 32,
    feesPercent: 8,
    components: [
      {
        name: "Membrane SBS 4 mm",
        type: "MATERIAL",
        quantityPerUnit: 0.55,
        unit: "m²",
        unitCostHt: sbs.price,
        materialId: sbs.id,
      },
      {
        name: "Étancheur qualifié",
        type: "LABOR",
        quantityPerUnit: 0.25,
        unit: "h",
        unitCostHt: laborCost,
        laborId: labor.id,
      },
    ],
  });

  await upsertWorkItem({
    reference: "PRO-001",
    name: "Protection gravillonnée",
    description: "Fourniture et mise en œuvre d’une protection gravillonnée sur étanchéité.",
    family: "Protection",
    saleUnit: "m²",
    kind: "COMPOSITE",
    marginPercent: 25,
    feesPercent: 5,
    components: [
      {
        name: "Gravillon de protection",
        type: "MATERIAL",
        quantityPerUnit: 1.1,
        unit: "m²",
        unitCostHt: grav.price,
        materialId: grav.id,
      },
      {
        name: "Étancheur qualifié",
        type: "LABOR",
        quantityPerUnit: 0.08,
        unit: "h",
        unitCostHt: laborCost,
        laborId: labor.id,
      },
    ],
  });

  await upsertWorkItem({
    reference: "COV-001",
    name: "Couvertine aluminium",
    description:
      "Fourniture et pose de couvertine aluminium, y compris fixations courantes — prix de vente direct.",
    family: "Acrotères",
    saleUnit: "ml",
    kind: "SIMPLE",
    unitSellHt: 48,
    sellMode: "FIXED_SELL",
    marginPercent: 0,
    isFavorite: true,
    components: [
      {
        name: "Couvertine aluminium",
        type: "MATERIAL",
        quantityPerUnit: 1,
        unit: "ml",
        unitCostHt: cov.price,
        materialId: cov.id,
      },
    ],
  });
}
