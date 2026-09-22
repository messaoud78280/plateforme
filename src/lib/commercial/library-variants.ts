/**
 * Variantes d’ouvrage commercial (parentWorkItemId).
 * Les devis figent le prix via snapshot — modifier une variante n’altère pas les devis passés.
 */
import { prisma } from "@/lib/prisma";
import {
  duplicateWorkItem,
  getWorkItem,
  recordLibraryHistoryEvent,
  updateWorkItem,
} from "@/lib/commercial/library";

export async function createWorkItemVariant(opts: {
  orgId: string;
  parentId: string;
  name: string;
  reference?: string | null;
  description?: string | null;
  unitSellHt?: number;
  saleUnit?: string;
  variantKind?: "TECHNICAL" | "COMMERCIAL" | "CUSTOM" | null;
  createdById?: string | null;
  copyDocuments?: boolean;
}) {
  const parent = await prisma.commercialWorkItem.findFirst({
    where: { id: opts.parentId, organizationId: opts.orgId },
    include: { components: { orderBy: { sortOrder: "asc" } } },
  });
  if (!parent) throw new Error("Ouvrage parent introuvable");
  if (parent.parentWorkItemId) {
    throw new Error("Impossible de créer une variante d’une variante — choisissez l’ouvrage principal.");
  }

  const name = opts.name.trim();
  if (!name) throw new Error("Nom de variante requis");

  const variant = await prisma.commercialWorkItem.create({
    data: {
      organizationId: opts.orgId,
      name,
      reference: opts.reference?.trim() || null,
      description: opts.description?.trim() || parent.description,
      shortDescription: parent.shortDescription,
      family: parent.family,
      subFamily: parent.subFamily,
      tags: parent.tags,
      saleUnit: opts.saleUnit?.trim() || parent.saleUnit,
      kind: parent.kind,
      unitCostHt: parent.unitCostHt,
      unitSellHt: opts.unitSellHt ?? parent.unitSellHt,
      marginPercent: parent.marginPercent,
      feesPercent: parent.feesPercent,
      feesAmountHt: parent.feesAmountHt,
      sellMode: parent.sellMode,
      costKnown: parent.costKnown,
      parentWorkItemId: parent.id,
      variantKind: opts.variantKind ?? "TECHNICAL",
      internalNotes: parent.internalNotes,
      implementationTips: parent.implementationTips,
      vigilancePoints: parent.vigilancePoints,
      technicalAttributes: parent.technicalAttributes ?? undefined,
      createdById: opts.createdById ?? null,
      isActive: true,
    },
  });

  if (parent.components.length) {
    await prisma.commercialWorkItemComponent.createMany({
      data: parent.components.map((c) => ({
        organizationId: opts.orgId,
        workItemId: variant.id,
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

  // Documents : non copiés automatiquement (évite partage de storagePath / suppressions croisées).
  // L’utilisateur ajoute les photos sur la variante si besoin.

  await recordLibraryHistoryEvent(opts.orgId, parent.id, {
    label: "Variante créée",
    detail: name,
    toStatus: "variant_created",
    actorUserId: opts.createdById ?? null,
  });

  return getWorkItem(opts.orgId, variant.id);
}

export async function linkAsVariant(opts: {
  orgId: string;
  workItemId: string;
  parentId: string;
  variantKind?: string | null;
  actorUserId?: string | null;
}) {
  if (opts.workItemId === opts.parentId) {
    throw new Error("Un ouvrage ne peut pas être variante de lui-même");
  }
  const [child, parent] = await Promise.all([
    prisma.commercialWorkItem.findFirst({
      where: { id: opts.workItemId, organizationId: opts.orgId },
    }),
    prisma.commercialWorkItem.findFirst({
      where: { id: opts.parentId, organizationId: opts.orgId },
    }),
  ]);
  if (!child || !parent) throw new Error("Ouvrage introuvable");
  if (parent.parentWorkItemId) {
    throw new Error("Le parent choisi est déjà une variante");
  }
  // Empêcher cycle : parent ne doit pas être descendant de child
  if (parent.parentWorkItemId === child.id) {
    throw new Error("Liaison circulaire interdite");
  }

  await prisma.commercialWorkItem.update({
    where: { id: child.id },
    data: {
      parentWorkItemId: parent.id,
      variantKind: opts.variantKind ?? child.variantKind ?? "TECHNICAL",
    },
  });

  await recordLibraryHistoryEvent(opts.orgId, parent.id, {
    label: "Variante liée",
    detail: child.name,
    toStatus: "variant_linked",
    actorUserId: opts.actorUserId ?? null,
  });

  return getWorkItem(opts.orgId, child.id);
}

export async function unlinkVariant(opts: {
  orgId: string;
  workItemId: string;
  actorUserId?: string | null;
}) {
  const child = await prisma.commercialWorkItem.findFirst({
    where: { id: opts.workItemId, organizationId: opts.orgId },
  });
  if (!child) throw new Error("Ouvrage introuvable");
  const parentId = child.parentWorkItemId;
  await prisma.commercialWorkItem.update({
    where: { id: child.id },
    data: { parentWorkItemId: null, variantKind: null },
  });
  if (parentId) {
    await recordLibraryHistoryEvent(opts.orgId, parentId, {
      label: "Variante détachée",
      detail: child.name,
      toStatus: "variant_unlinked",
      actorUserId: opts.actorUserId ?? null,
    });
  }
  return getWorkItem(opts.orgId, child.id);
}

export async function listVariantsForParent(orgId: string, parentId: string) {
  return prisma.commercialWorkItem.findMany({
    where: { organizationId: orgId, parentWorkItemId: parentId, isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      reference: true,
      saleUnit: true,
      unitSellHt: true,
      unitCostHt: true,
      variantKind: true,
      description: true,
      kind: true,
    },
  });
}

/** Pour le picker devis : racines + compteur de variantes. */
export async function listWorkItemsWithVariantMeta(
  orgId: string,
  opts?: { q?: string; take?: number },
) {
  const q = opts?.q?.trim();
  const rows = await prisma.commercialWorkItem.findMany({
    where: {
      organizationId: orgId,
      isActive: true,
      parentWorkItemId: null,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { reference: { contains: q, mode: "insensitive" } },
              {
                variants: {
                  some: {
                    isActive: true,
                    OR: [
                      { name: { contains: q, mode: "insensitive" } },
                      { reference: { contains: q, mode: "insensitive" } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    },
    take: opts?.take ?? 80,
    orderBy: [{ isFavorite: "desc" }, { name: "asc" }],
    include: {
      variants: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          reference: true,
          saleUnit: true,
          unitSellHt: true,
          unitCostHt: true,
          marginPercent: true,
          variantKind: true,
        },
      },
    },
  });
  return rows.map((w) => ({
    id: w.id,
    name: w.name,
    reference: w.reference,
    saleUnit: w.saleUnit,
    unitSellHt: Number(w.unitSellHt),
    unitCostHt: Number(w.unitCostHt),
    marginPercent: Number(w.marginPercent),
    variants: w.variants.map((v) => ({
      id: v.id,
      name: v.name,
      reference: v.reference,
      saleUnit: v.saleUnit,
      unitSellHt: Number(v.unitSellHt),
      unitCostHt: Number(v.unitCostHt),
      marginPercent: Number(v.marginPercent),
      variantKind: v.variantKind,
    })),
  }));
}

export { duplicateWorkItem, updateWorkItem };
