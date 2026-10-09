/**
 * CRUD SupplyOffer + sélection — multi-tenant strict.
 * Retenir une offre ≠ créer un PurchaseOrder.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSupplyOfferFreshness } from "@/lib/supply/offer-freshness";
import {
  computeOfferRenderedCost,
  computeProductCost,
  formatProductSubtotalLabel,
  proposePackagingFromOffer,
} from "@/lib/supply/offer-cost";
import { validateSupplyOfferInput } from "@/lib/supply/offer-validation";
import type {
  SupplyOfferInput,
  SupplyOfferView,
} from "@/lib/supply/offer-types";

function n(v: unknown): number | null {
  if (v == null || v === "") return null;
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : null;
}

function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

function toDate(v: Date | string | null | undefined): Date | null {
  if (v == null || v === "") return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

const OFFER_INCLUDE = {
  supplier: {
    select: {
      id: true,
      name: true,
      tradeName: true,
      city: true,
      parent: { select: { id: true, name: true, tradeName: true } },
    },
  },
  recordedBy: { select: { id: true, name: true } },
} as const;

type OfferRow = Prisma.SupplyOfferGetPayload<{ include: typeof OFFER_INCLUDE }>;

function agencyDisplay(supplier: OfferRow["supplier"]): string {
  const name = supplier.tradeName || supplier.name;
  if (supplier.parent) {
    const parent = supplier.parent.tradeName || supplier.parent.name;
    const city = supplier.city ? `agence de ${supplier.city}` : supplier.name;
    return `${parent} — ${city}`;
  }
  return name;
}

export function mapSupplyOfferToView(
  row: OfferRow,
  opts: {
    selectedOfferId: string | null;
    needQuantity: number;
    needUnit: string;
    includeCrane?: boolean;
    projectId?: string;
  },
): SupplyOfferView {
  const unitPrice = n(row.unitPrice);
  const product = computeProductCost({
    unitPrice,
    priceUnit: row.priceUnit,
    priceTaxMode: row.priceTaxMode,
    vatRate: n(row.vatRate),
    needQuantity: opts.needQuantity,
    needUnit: opts.needUnit,
    unitsPerPack: n(row.unitsPerPack),
  });

  const productCostHt =
    product.status === "KNOWN"
      ? product.amountHtDerived ??
        (product.taxMode === "HT" ? product.amount : null)
      : null;

  const rendered = computeOfferRenderedCost({
    productCostHt,
    deliveryFee: n(row.deliveryFee),
    craneFee: n(row.craneFee),
    otherFees: n(row.otherFees),
    includeDelivery: true,
    includeCrane: opts.includeCrane === true || n(row.craneFee) != null,
    includeOther: n(row.otherFees) != null,
  });

  const packagingProposal = proposePackagingFromOffer({
    calculatedOrValidatedQty: opts.needQuantity,
    unitsPerPack: n(row.unitsPerPack),
  });

  return {
    id: row.id,
    organizationId: row.organizationId,
    requirementId: row.requirementId,
    supplierExternalOrgId: row.supplierExternalOrgId,
    supplierName: row.supplier.name,
    supplierTradeName: row.supplier.tradeName,
    parentSupplierName: row.supplier.parent
      ? row.supplier.parent.tradeName || row.supplier.parent.name
      : null,
    agencyDisplay: agencyDisplay(row.supplier),
    productLabel: row.productLabel,
    productRef: row.productRef,
    techAttributes: row.techAttributes,
    equivalenceStatus: row.equivalenceStatus,
    unitPrice,
    priceUnit: row.priceUnit,
    priceTaxMode: row.priceTaxMode,
    vatRate: n(row.vatRate),
    priceSourceType: row.priceSourceType,
    sourceUrl: row.sourceUrl,
    quoteNumber: row.quoteNumber,
    quoteDocumentRef: row.quoteDocumentRef,
    sourceNote: row.sourceNote,
    observedAt: iso(row.observedAt),
    recordedAt: row.recordedAt.toISOString(),
    validUntil: iso(row.validUntil),
    recordedById: row.recordedById,
    recordedByName: row.recordedBy?.name ?? null,
    packagingLabel: row.packagingLabel,
    unitsPerPack: n(row.unitsPerPack),
    minimumOrderQuantity: n(row.minimumOrderQuantity),
    leadTimeDays: n(row.leadTimeDays),
    availabilityNote: row.availabilityNote,
    deliveryFee: n(row.deliveryFee),
    craneFee: n(row.craneFee),
    otherFees: n(row.otherFees),
    archivedAt: iso(row.archivedAt),
    isSelected: opts.selectedOfferId === row.id,
    freshness: getSupplyOfferFreshness({
      validUntil: row.validUntil,
      observedAt: row.observedAt,
      recordedAt: row.recordedAt,
    }),
    productCost: {
      amount: product.amount,
      taxMode: product.taxMode,
      status: product.status,
      reason: product.reason,
      displayLabel: formatProductSubtotalLabel({
        amount: product.amount,
        taxMode: product.taxMode,
        status: product.status,
        deliveryFee: n(row.deliveryFee),
        craneFee: n(row.craneFee),
        otherFees: n(row.otherFees),
      }),
    },
    renderedCost: {
      knownTotal: rendered.knownTotal,
      completeness: rendered.completeness,
      missingLabels: rendered.missingLabels,
      displayLabel: rendered.displayLabel,
    },
    packagingProposal:
      packagingProposal.packs != null
        ? packagingProposal
        : null,
    productImageUrl: row.productImageUrl ?? null,
    productImageOrigin: row.productImageOrigin ?? null,
    productImageDisplayUrl: productImageDisplayUrl({
      projectId: opts.projectId,
      requirementId: row.requirementId,
      offerId: row.id,
      productImageUrl: row.productImageUrl ?? null,
    }),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function productImageDisplayUrl(opts: {
  projectId?: string;
  requirementId: string;
  offerId: string;
  productImageUrl: string | null;
}): string | null {
  const raw = opts.productImageUrl?.trim() || null;
  if (!raw) return null;
  if (/^https:\/\//i.test(raw)) return raw;
  if (raw.startsWith("storage://") && opts.projectId) {
    return `/api/projets/${opts.projectId}/materiaux/${opts.requirementId}/offers/${opts.offerId}/image`;
  }
  return null;
}

async function assertRequirement(opts: {
  organizationId: string;
  projectId?: string;
  requirementId: string;
}) {
  const req = await prisma.materialRequirement.findFirst({
    where: {
      id: opts.requirementId,
      organizationId: opts.organizationId,
      ...(opts.projectId ? { projectId: opts.projectId } : {}),
    },
    select: {
      id: true,
      organizationId: true,
      projectId: true,
      quantityRequired: true,
      validatedOrderQuantity: true,
      unit: true,
      selectedOfferId: true,
      status: true,
    },
  });
  if (!req) throw new Error("Besoin introuvable");
  return req;
}

async function assertSupplier(opts: {
  organizationId: string;
  supplierExternalOrgId: string;
}) {
  const supplier = await prisma.externalOrganization.findFirst({
    where: {
      id: opts.supplierExternalOrgId,
      hostOrganizationId: opts.organizationId,
      type: { in: ["SUPPLIER", "SUBCONTRACTOR"] },
      status: "ACTIVE",
    },
    select: { id: true },
  });
  if (!supplier) throw new Error("Fournisseur introuvable ou inactif");
  return supplier;
}

export async function listSupplyOffersForRequirement(opts: {
  organizationId: string;
  projectId: string;
  requirementId: string;
  includeArchived?: boolean;
}): Promise<SupplyOfferView[]> {
  const req = await assertRequirement(opts);
  const needQty =
    n(req.validatedOrderQuantity) ?? n(req.quantityRequired) ?? 0;

  const rows = await prisma.supplyOffer.findMany({
    where: {
      organizationId: opts.organizationId,
      requirementId: opts.requirementId,
      ...(opts.includeArchived ? {} : { archivedAt: null }),
    },
    include: OFFER_INCLUDE,
    orderBy: [{ archivedAt: "asc" }, { createdAt: "desc" }],
  });

  return rows.map((r) =>
    mapSupplyOfferToView(r, {
      selectedOfferId: req.selectedOfferId,
      needQuantity: needQty,
      needUnit: req.unit,
      projectId: req.projectId,
    }),
  );
}

export async function createSupplyOffer(opts: {
  organizationId: string;
  projectId: string;
  requirementId: string;
  recordedById: string;
  input: SupplyOfferInput;
}): Promise<SupplyOfferView> {
  const validation = validateSupplyOfferInput(opts.input);
  if (!validation.ok) throw new Error(validation.error);

  const req = await assertRequirement(opts);
  await assertSupplier({
    organizationId: opts.organizationId,
    supplierExternalOrgId: opts.input.supplierExternalOrgId,
  });

  const recordedAt = toDate(opts.input.recordedAt) ?? new Date();
  const unitPrice = n(opts.input.unitPrice);

  const row = await prisma.supplyOffer.create({
    data: {
      organizationId: opts.organizationId,
      requirementId: req.id,
      supplierExternalOrgId: opts.input.supplierExternalOrgId,
      productLabel: opts.input.productLabel.trim(),
      productRef: opts.input.productRef?.trim() || null,
      techAttributes:
        opts.input.techAttributes === undefined
          ? undefined
          : (opts.input.techAttributes as Prisma.InputJsonValue),
      equivalenceStatus: opts.input.equivalenceStatus ?? "TO_VERIFY",
      unitPrice,
      priceUnit: opts.input.priceUnit?.trim() || "U",
      priceTaxMode: opts.input.priceTaxMode ?? "HT",
      vatRate: n(opts.input.vatRate),
      priceSourceType: opts.input.priceSourceType,
      sourceUrl: opts.input.sourceUrl?.trim() || null,
      quoteNumber: opts.input.quoteNumber?.trim() || null,
      quoteDocumentRef: opts.input.quoteDocumentRef?.trim() || null,
      sourceNote: opts.input.sourceNote?.trim() || null,
      observedAt: toDate(opts.input.observedAt),
      recordedAt,
      validUntil: toDate(opts.input.validUntil),
      recordedById: opts.recordedById,
      packagingLabel: opts.input.packagingLabel?.trim() || null,
      unitsPerPack: n(opts.input.unitsPerPack),
      minimumOrderQuantity: n(opts.input.minimumOrderQuantity),
      leadTimeDays: n(opts.input.leadTimeDays),
      availabilityNote: opts.input.availabilityNote?.trim() || null,
      deliveryFee:
        opts.input.deliveryFee === undefined
          ? null
          : n(opts.input.deliveryFee),
      craneFee:
        opts.input.craneFee === undefined ? null : n(opts.input.craneFee),
      otherFees:
        opts.input.otherFees === undefined ? null : n(opts.input.otherFees),
    },
    include: OFFER_INCLUDE,
  });

  const needQty =
    n(req.validatedOrderQuantity) ?? n(req.quantityRequired) ?? 0;
  return mapSupplyOfferToView(row, {
    selectedOfferId: req.selectedOfferId,
    needQuantity: needQty,
    needUnit: req.unit,
    projectId: req.projectId,
  });
}

export async function updateSupplyOffer(opts: {
  organizationId: string;
  projectId: string;
  requirementId: string;
  offerId: string;
  input: Partial<SupplyOfferInput>;
}): Promise<SupplyOfferView> {
  const req = await assertRequirement(opts);
  const existing = await prisma.supplyOffer.findFirst({
    where: {
      id: opts.offerId,
      organizationId: opts.organizationId,
      requirementId: opts.requirementId,
    },
  });
  if (!existing) throw new Error("Offre introuvable");

  const merged: SupplyOfferInput = {
    supplierExternalOrgId:
      opts.input.supplierExternalOrgId ?? existing.supplierExternalOrgId,
    productLabel: opts.input.productLabel ?? existing.productLabel,
    productRef:
      opts.input.productRef !== undefined
        ? opts.input.productRef
        : existing.productRef,
    techAttributes:
      opts.input.techAttributes !== undefined
        ? opts.input.techAttributes
        : existing.techAttributes,
    equivalenceStatus:
      opts.input.equivalenceStatus ?? existing.equivalenceStatus,
    unitPrice:
      opts.input.unitPrice !== undefined
        ? opts.input.unitPrice
        : n(existing.unitPrice),
    priceUnit: opts.input.priceUnit ?? existing.priceUnit,
    priceTaxMode: opts.input.priceTaxMode ?? existing.priceTaxMode,
    vatRate:
      opts.input.vatRate !== undefined ? opts.input.vatRate : n(existing.vatRate),
    priceSourceType: opts.input.priceSourceType ?? existing.priceSourceType,
    sourceUrl:
      opts.input.sourceUrl !== undefined
        ? opts.input.sourceUrl
        : existing.sourceUrl,
    quoteNumber:
      opts.input.quoteNumber !== undefined
        ? opts.input.quoteNumber
        : existing.quoteNumber,
    quoteDocumentRef:
      opts.input.quoteDocumentRef !== undefined
        ? opts.input.quoteDocumentRef
        : existing.quoteDocumentRef,
    sourceNote:
      opts.input.sourceNote !== undefined
        ? opts.input.sourceNote
        : existing.sourceNote,
    observedAt:
      opts.input.observedAt !== undefined
        ? opts.input.observedAt
        : existing.observedAt,
    recordedAt: existing.recordedAt,
    validUntil:
      opts.input.validUntil !== undefined
        ? opts.input.validUntil
        : existing.validUntil,
    packagingLabel:
      opts.input.packagingLabel !== undefined
        ? opts.input.packagingLabel
        : existing.packagingLabel,
    unitsPerPack:
      opts.input.unitsPerPack !== undefined
        ? opts.input.unitsPerPack
        : n(existing.unitsPerPack),
    minimumOrderQuantity:
      opts.input.minimumOrderQuantity !== undefined
        ? opts.input.minimumOrderQuantity
        : n(existing.minimumOrderQuantity),
    leadTimeDays:
      opts.input.leadTimeDays !== undefined
        ? opts.input.leadTimeDays
        : n(existing.leadTimeDays),
    availabilityNote:
      opts.input.availabilityNote !== undefined
        ? opts.input.availabilityNote
        : existing.availabilityNote,
    deliveryFee:
      opts.input.deliveryFee !== undefined
        ? opts.input.deliveryFee
        : n(existing.deliveryFee),
    craneFee:
      opts.input.craneFee !== undefined
        ? opts.input.craneFee
        : n(existing.craneFee),
    otherFees:
      opts.input.otherFees !== undefined
        ? opts.input.otherFees
        : n(existing.otherFees),
  };

  const validation = validateSupplyOfferInput(merged);
  if (!validation.ok) throw new Error(validation.error);

  if (opts.input.supplierExternalOrgId) {
    await assertSupplier({
      organizationId: opts.organizationId,
      supplierExternalOrgId: opts.input.supplierExternalOrgId,
    });
  }

  const row = await prisma.supplyOffer.update({
    where: { id: existing.id },
    data: {
      supplierExternalOrgId: merged.supplierExternalOrgId,
      productLabel: merged.productLabel.trim(),
      productRef: merged.productRef?.trim() || null,
      techAttributes:
        merged.techAttributes === undefined
          ? undefined
          : (merged.techAttributes as Prisma.InputJsonValue),
      equivalenceStatus: merged.equivalenceStatus ?? "TO_VERIFY",
      unitPrice: n(merged.unitPrice),
      priceUnit: merged.priceUnit?.trim() || "U",
      priceTaxMode: merged.priceTaxMode ?? "HT",
      vatRate: n(merged.vatRate),
      priceSourceType: merged.priceSourceType,
      sourceUrl: merged.sourceUrl?.trim() || null,
      quoteNumber: merged.quoteNumber?.trim() || null,
      quoteDocumentRef: merged.quoteDocumentRef?.trim() || null,
      sourceNote: merged.sourceNote?.trim() || null,
      observedAt: toDate(merged.observedAt),
      validUntil: toDate(merged.validUntil),
      packagingLabel: merged.packagingLabel?.trim() || null,
      unitsPerPack: n(merged.unitsPerPack),
      minimumOrderQuantity: n(merged.minimumOrderQuantity),
      leadTimeDays: n(merged.leadTimeDays),
      availabilityNote: merged.availabilityNote?.trim() || null,
      deliveryFee: n(merged.deliveryFee),
      craneFee: n(merged.craneFee),
      otherFees: n(merged.otherFees),
    },
    include: OFFER_INCLUDE,
  });

  const needQty =
    n(req.validatedOrderQuantity) ?? n(req.quantityRequired) ?? 0;
  return mapSupplyOfferToView(row, {
    selectedOfferId: req.selectedOfferId,
    needQuantity: needQty,
    needUnit: req.unit,
    projectId: req.projectId,
  });
}

export async function setSupplyOfferProductImage(opts: {
  organizationId: string;
  projectId: string;
  requirementId: string;
  offerId: string;
  productImageUrl: string | null;
  productImageOrigin: "USER_UPLOAD" | "USER_URL" | "SUPPLIER_URL" | null;
}): Promise<SupplyOfferView> {
  const req = await assertRequirement(opts);
  const existing = await prisma.supplyOffer.findFirst({
    where: {
      id: opts.offerId,
      organizationId: opts.organizationId,
      requirementId: opts.requirementId,
    },
    select: { id: true },
  });
  if (!existing) throw new Error("Offre introuvable");

  const url = opts.productImageUrl?.trim() || null;
  if (url) {
    const isHttps = /^https:\/\//i.test(url);
    const isStorage = url.startsWith("storage://");
    if (!isHttps && !isStorage) {
      throw new Error("Image : seules les URL https:// ou storage:// sont acceptées");
    }
    if (isHttps) {
      try {
        const u = new URL(url);
        if (u.protocol !== "https:") throw new Error("https requis");
      } catch {
        throw new Error("URL d’image invalide");
      }
    }
  }

  const row = await prisma.supplyOffer.update({
    where: { id: existing.id },
    data: {
      productImageUrl: url,
      productImageOrigin: url
        ? opts.productImageOrigin ?? "USER_URL"
        : null,
    },
    include: OFFER_INCLUDE,
  });

  const needQty =
    n(req.validatedOrderQuantity) ?? n(req.quantityRequired) ?? 0;
  return mapSupplyOfferToView(row, {
    selectedOfferId: req.selectedOfferId,
    needQuantity: needQty,
    needUnit: req.unit,
    projectId: req.projectId,
  });
}

export async function archiveSupplyOffer(opts: {
  organizationId: string;
  projectId: string;
  requirementId: string;
  offerId: string;
}): Promise<void> {
  const req = await assertRequirement(opts);
  const existing = await prisma.supplyOffer.findFirst({
    where: {
      id: opts.offerId,
      organizationId: opts.organizationId,
      requirementId: opts.requirementId,
    },
    select: { id: true },
  });
  if (!existing) throw new Error("Offre introuvable");

  await prisma.$transaction(async (tx) => {
    await tx.supplyOffer.update({
      where: { id: existing.id },
      data: { archivedAt: new Date() },
    });
    if (req.selectedOfferId === existing.id) {
      await tx.materialRequirement.update({
        where: { id: req.id },
        data: { selectedOfferId: null },
      });
    }
  });
}

/**
 * Retient une offre pour le besoin.
 * Vérifie org + requirement. Ne crée aucun PurchaseOrder.
 * Les autres offres sont conservées.
 */
export async function selectSupplyOffer(opts: {
  organizationId: string;
  projectId: string;
  requirementId: string;
  offerId: string;
}): Promise<{ selectedOfferId: string; purchaseOrdersCreated: number }> {
  const req = await assertRequirement(opts);
  const offer = await prisma.supplyOffer.findFirst({
    where: {
      id: opts.offerId,
      organizationId: opts.organizationId,
      requirementId: opts.requirementId,
      archivedAt: null,
    },
    select: { id: true, organizationId: true, requirementId: true },
  });
  if (!offer) throw new Error("Offre introuvable ou archivée");
  if (offer.organizationId !== opts.organizationId) {
    throw new Error("Offre hors organisation");
  }
  if (offer.requirementId !== opts.requirementId) {
    throw new Error("L’offre doit appartenir au même besoin");
  }

  const poBefore = await prisma.purchaseOrder.count({
    where: { organizationId: opts.organizationId },
  });

  await prisma.materialRequirement.update({
    where: { id: req.id },
    data: { selectedOfferId: offer.id },
  });

  const poAfter = await prisma.purchaseOrder.count({
    where: { organizationId: opts.organizationId },
  });

  return {
    selectedOfferId: offer.id,
    purchaseOrdersCreated: Math.max(0, poAfter - poBefore),
  };
}

export async function clearSelectedSupplyOffer(opts: {
  organizationId: string;
  projectId: string;
  requirementId: string;
}): Promise<void> {
  const req = await assertRequirement(opts);
  await prisma.materialRequirement.update({
    where: { id: req.id },
    data: { selectedOfferId: null },
  });
}
