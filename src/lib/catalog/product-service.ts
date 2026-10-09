/**
 * Produits / offres / observations de prix — Catalogue Matériaux.
 */
import { prisma } from "@/lib/prisma";
import {
  canonicalizeCatalogUrl,
  normalizeGtin,
  normalizeManufacturer,
  normalizeManufacturerRef,
} from "@/lib/catalog/normalize";

export type CatalogProductInput = {
  label: string;
  manufacturer?: string | null;
  manufacturerRef?: string | null;
  gtin?: string | null;
  dimensions?: string | null;
  performances?: string | null;
  techAttributes?: unknown;
  imageUrl?: string | null;
  imageOrigin?: string | null;
  sourceUrl?: string | null;
  notes?: string | null;
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
};

export type CatalogSupplierOfferInput = {
  supplierExternalOrgId: string;
  priceUnit?: string | null;
  packagingLabel?: string | null;
  unitsPerPack?: number | null;
  minimumOrderQuantity?: number | null;
  leadTimeDays?: number | null;
  availabilityNote?: string | null;
  deliveryFee?: number | null;
  craneFee?: number | null;
  otherFees?: number | null;
  sourceUrl?: string | null;
  priceSourceType?: string | null;
  quoteNumber?: string | null;
  quoteDocumentRef?: string | null;
  sourceNote?: string | null;
  imageUrl?: string | null;
  imageOrigin?: string | null;
};

export type CatalogPriceObservationInput = {
  unitPrice?: number | null;
  priceUnit?: string | null;
  priceTaxMode?: "HT" | "TTC";
  vatRate?: number | null;
  observedAt?: string | null;
  validUntil?: string | null;
  priceSourceType: string;
  sourceUrl?: string | null;
  quoteNumber?: string | null;
  quoteDocumentRef?: string | null;
  sourceNote?: string | null;
  sourceSupplyOfferId?: string | null;
};

function n(v: unknown): number | null {
  if (v == null || v === "") return null;
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : null;
}

async function assertMaterial(organizationId: string, materialId: string) {
  const m = await prisma.catalogMaterial.findFirst({
    where: { id: materialId, organizationId },
    select: { id: true },
  });
  if (!m) throw new Error("Fiche matériau introuvable");
  return m;
}

async function assertProduct(organizationId: string, productId: string) {
  const p = await prisma.catalogProduct.findFirst({
    where: { id: productId, organizationId },
    select: { id: true, catalogMaterialId: true },
  });
  if (!p) throw new Error("Produit introuvable");
  return p;
}

export async function findCatalogProductDuplicates(opts: {
  organizationId: string;
  manufacturer?: string | null;
  manufacturerRef?: string | null;
  gtin?: string | null;
  sourceUrl?: string | null;
  excludeId?: string | null;
}) {
  const gtin = normalizeGtin(opts.gtin);
  const mfr = normalizeManufacturer(opts.manufacturer);
  const ref = normalizeManufacturerRef(opts.manufacturerRef);
  const url = canonicalizeCatalogUrl(opts.sourceUrl);
  const out: Array<{ id: string; label: string; reason: string }> = [];

  if (gtin) {
    const rows = await prisma.catalogProduct.findMany({
      where: {
        organizationId: opts.organizationId,
        gtin,
        status: { not: "ARCHIVED" },
        ...(opts.excludeId ? { id: { not: opts.excludeId } } : {}),
      },
      select: { id: true, label: true },
      take: 5,
    });
    for (const r of rows) {
      out.push({ id: r.id, label: r.label, reason: "même GTIN/EAN" });
    }
  }
  if (mfr && ref) {
    const rows = await prisma.catalogProduct.findMany({
      where: {
        organizationId: opts.organizationId,
        manufacturerNormalized: mfr,
        manufacturerRefNormalized: ref,
        status: { not: "ARCHIVED" },
        ...(opts.excludeId ? { id: { not: opts.excludeId } } : {}),
      },
      select: { id: true, label: true },
      take: 5,
    });
    for (const r of rows) {
      if (!out.some((x) => x.id === r.id)) {
        out.push({
          id: r.id,
          label: r.label,
          reason: "même fabricant + référence",
        });
      }
    }
  }
  if (url) {
    const rows = await prisma.catalogProduct.findMany({
      where: {
        organizationId: opts.organizationId,
        status: { not: "ARCHIVED" },
        ...(opts.excludeId ? { id: { not: opts.excludeId } } : {}),
      },
      select: { id: true, label: true, sourceUrl: true },
      take: 50,
    });
    for (const r of rows) {
      if (canonicalizeCatalogUrl(r.sourceUrl) === url && !out.some((x) => x.id === r.id)) {
        out.push({ id: r.id, label: r.label, reason: "même URL produit (indice)" });
      }
    }
  }
  return out;
}

export async function createCatalogProduct(opts: {
  organizationId: string;
  catalogMaterialId: string;
  createdById: string;
  input: CatalogProductInput;
  forceCreate?: boolean;
}) {
  await assertMaterial(opts.organizationId, opts.catalogMaterialId);
  const label = opts.input.label.trim();
  if (!label) throw new Error("Libellé produit requis");

  const dups = await findCatalogProductDuplicates({
    organizationId: opts.organizationId,
    manufacturer: opts.input.manufacturer,
    manufacturerRef: opts.input.manufacturerRef,
    gtin: opts.input.gtin,
    sourceUrl: opts.input.sourceUrl,
  });
  if (dups.length > 0 && !opts.forceCreate) {
    const err = new Error(
      "Un produit commercial potentiellement identique existe déjà.",
    ) as Error & { code: string; candidates: typeof dups };
    err.code = "DUPLICATE";
    err.candidates = dups;
    throw err;
  }

  const gtin = normalizeGtin(opts.input.gtin);
  return prisma.catalogProduct.create({
    data: {
      organizationId: opts.organizationId,
      catalogMaterialId: opts.catalogMaterialId,
      label,
      manufacturer: opts.input.manufacturer?.trim() || null,
      manufacturerNormalized: normalizeManufacturer(opts.input.manufacturer),
      manufacturerRef: opts.input.manufacturerRef?.trim() || null,
      manufacturerRefNormalized: normalizeManufacturerRef(
        opts.input.manufacturerRef,
      ),
      gtin,
      dimensions: opts.input.dimensions?.trim() || null,
      performances: opts.input.performances?.trim() || null,
      techAttributes:
        opts.input.techAttributes === undefined
          ? undefined
          : (opts.input.techAttributes as object),
      imageUrl: opts.input.imageUrl?.trim() || null,
      imageOrigin: opts.input.imageOrigin?.trim() || null,
      sourceUrl: opts.input.sourceUrl?.trim() || null,
      notes: opts.input.notes?.trim() || null,
      status: opts.input.status ?? "ACTIVE",
      createdById: opts.createdById,
    },
  });
}

export async function createCatalogSupplierOffer(opts: {
  organizationId: string;
  catalogProductId: string;
  createdById: string;
  input: CatalogSupplierOfferInput;
}) {
  await assertProduct(opts.organizationId, opts.catalogProductId);
  const supplier = await prisma.externalOrganization.findFirst({
    where: {
      id: opts.input.supplierExternalOrgId,
      hostOrganizationId: opts.organizationId,
      type: { in: ["SUPPLIER", "SUBCONTRACTOR"] },
    },
    select: { id: true },
  });
  if (!supplier) throw new Error("Fournisseur hors organisation");

  return prisma.catalogSupplierOffer.create({
    data: {
      organizationId: opts.organizationId,
      catalogProductId: opts.catalogProductId,
      supplierExternalOrgId: supplier.id,
      priceUnit: opts.input.priceUnit?.trim() || "U",
      packagingLabel: opts.input.packagingLabel?.trim() || null,
      unitsPerPack: n(opts.input.unitsPerPack),
      minimumOrderQuantity: n(opts.input.minimumOrderQuantity),
      leadTimeDays: n(opts.input.leadTimeDays),
      availabilityNote: opts.input.availabilityNote?.trim() || null,
      deliveryFee: n(opts.input.deliveryFee),
      craneFee: n(opts.input.craneFee),
      otherFees: n(opts.input.otherFees),
      sourceUrl: opts.input.sourceUrl?.trim() || null,
      priceSourceType: opts.input.priceSourceType?.trim() || null,
      quoteNumber: opts.input.quoteNumber?.trim() || null,
      quoteDocumentRef: opts.input.quoteDocumentRef?.trim() || null,
      sourceNote: opts.input.sourceNote?.trim() || null,
      imageUrl: opts.input.imageUrl?.trim() || null,
      imageOrigin: opts.input.imageOrigin?.trim() || null,
      createdById: opts.createdById,
    },
  });
}

export async function addCatalogPriceObservation(opts: {
  organizationId: string;
  catalogSupplierOfferId: string;
  recordedById: string;
  input: CatalogPriceObservationInput;
}) {
  const offer = await prisma.catalogSupplierOffer.findFirst({
    where: {
      id: opts.catalogSupplierOfferId,
      organizationId: opts.organizationId,
    },
    select: { id: true },
  });
  if (!offer) throw new Error("Offre catalogue introuvable");

  const source = opts.input.priceSourceType?.trim();
  if (!source) throw new Error("Provenance du prix requise");

  return prisma.catalogPriceObservation.create({
    data: {
      organizationId: opts.organizationId,
      catalogSupplierOfferId: offer.id,
      unitPrice: n(opts.input.unitPrice),
      priceUnit: opts.input.priceUnit?.trim() || "U",
      priceTaxMode: opts.input.priceTaxMode === "TTC" ? "TTC" : "HT",
      vatRate: n(opts.input.vatRate),
      observedAt: opts.input.observedAt
        ? new Date(opts.input.observedAt)
        : null,
      validUntil: opts.input.validUntil
        ? new Date(opts.input.validUntil)
        : null,
      priceSourceType: source,
      sourceUrl: opts.input.sourceUrl?.trim() || null,
      quoteNumber: opts.input.quoteNumber?.trim() || null,
      quoteDocumentRef: opts.input.quoteDocumentRef?.trim() || null,
      sourceNote: opts.input.sourceNote?.trim() || null,
      sourceSupplyOfferId: opts.input.sourceSupplyOfferId?.trim() || null,
      recordedById: opts.recordedById,
    },
  });
}

export async function loadCatalogStudy(opts: {
  organizationId: string;
  materialId: string;
}) {
  const material = await prisma.catalogMaterial.findFirst({
    where: { id: opts.materialId, organizationId: opts.organizationId },
    include: {
      products: {
        where: { status: { not: "ARCHIVED" } },
        orderBy: { updatedAt: "desc" },
        include: {
          offers: {
            where: { archivedAt: null },
            orderBy: { updatedAt: "desc" },
            include: {
              supplier: {
                select: {
                  id: true,
                  name: true,
                  tradeName: true,
                  city: true,
                  parent: { select: { name: true, tradeName: true } },
                },
              },
              priceObservations: {
                orderBy: { recordedAt: "desc" },
                take: 20,
              },
            },
          },
        },
      },
    },
  });
  if (!material) return null;

  return {
    id: material.id,
    family: material.family,
    designation: material.designation,
    unit: material.unit,
    description: material.description,
    techAttributes: material.techAttributes,
    status: material.status,
    notes: material.notes,
    products: material.products.map((p) => ({
      id: p.id,
      label: p.label,
      manufacturer: p.manufacturer,
      manufacturerRef: p.manufacturerRef,
      gtin: p.gtin,
      dimensions: p.dimensions,
      performances: p.performances,
      imageUrl: p.imageUrl,
      imageOrigin: p.imageOrigin,
      sourceUrl: p.sourceUrl,
      status: p.status,
      offers: p.offers.map((o) => {
        const latest = o.priceObservations[0] ?? null;
        const agency = o.supplier.parent
          ? `${o.supplier.parent.tradeName || o.supplier.parent.name} — ${
              o.supplier.city ? `agence de ${o.supplier.city}` : o.supplier.name
            }`
          : o.supplier.tradeName || o.supplier.name;
        return {
          id: o.id,
          supplierName: o.supplier.name,
          agencyDisplay: agency,
          supplierExternalOrgId: o.supplierExternalOrgId,
          priceUnit: o.priceUnit,
          packagingLabel: o.packagingLabel,
          unitsPerPack:
            o.unitsPerPack == null ? null : Number(o.unitsPerPack),
          leadTimeDays:
            o.leadTimeDays == null ? null : Number(o.leadTimeDays),
          availabilityNote: o.availabilityNote,
          deliveryFee: o.deliveryFee == null ? null : Number(o.deliveryFee),
          craneFee: o.craneFee == null ? null : Number(o.craneFee),
          otherFees: o.otherFees == null ? null : Number(o.otherFees),
          sourceUrl: o.sourceUrl,
          priceSourceType: o.priceSourceType,
          imageUrl: o.imageUrl || p.imageUrl,
          latestPrice: latest
            ? {
                unitPrice:
                  latest.unitPrice == null ? null : Number(latest.unitPrice),
                priceUnit: latest.priceUnit,
                priceTaxMode: latest.priceTaxMode,
                observedAt: latest.observedAt?.toISOString() ?? null,
                recordedAt: latest.recordedAt.toISOString(),
                priceSourceType: latest.priceSourceType,
                sourceUrl: latest.sourceUrl,
              }
            : null,
          priceHistory: o.priceObservations.map((h) => ({
            id: h.id,
            unitPrice: h.unitPrice == null ? null : Number(h.unitPrice),
            priceUnit: h.priceUnit,
            priceTaxMode: h.priceTaxMode,
            observedAt: h.observedAt?.toISOString() ?? null,
            recordedAt: h.recordedAt.toISOString(),
            priceSourceType: h.priceSourceType,
          })),
        };
      }),
    })),
  };
}

export async function updateCatalogProductImage(opts: {
  organizationId: string;
  productId: string;
  imageUrl: string | null;
  imageOrigin: string | null;
}) {
  const p = await assertProduct(opts.organizationId, opts.productId);
  return prisma.catalogProduct.update({
    where: { id: p.id },
    data: {
      imageUrl: opts.imageUrl?.trim() || null,
      imageOrigin: opts.imageUrl ? opts.imageOrigin : null,
    },
  });
}
