/**
 * Réutiliser le catalogue dans un besoin chantier (SupplyOffer).
 * Snapshot daté — jamais de rétention auto ni BC. Prix ancien → À actualiser.
 */
import { prisma } from "@/lib/prisma";
import { getSupplyOfferFreshness } from "@/lib/supply/offer-freshness";
import {
  createSupplyOffer,
  setSupplyOfferProductImage,
  SupplyOfferDuplicateError,
} from "@/lib/supply/offer-service";
import type {
  SupplyOfferPriceSourceType,
  SupplyOfferView,
} from "@/lib/supply/offer-types";
import { normalizeDesignation } from "@/lib/catalog/normalize";

function n(v: unknown): number | null {
  if (v == null) return null;
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : null;
}

const PRICE_SOURCES = new Set([
  "WEB_VERIFIED",
  "SUPPLIER_QUOTE",
  "USER_ENTERED",
  "IMPORT",
]);

function mapPriceSource(raw: string | null | undefined): SupplyOfferPriceSourceType {
  if (raw && PRICE_SOURCES.has(raw)) return raw as SupplyOfferPriceSourceType;
  return "IMPORT";
}

export type CatalogSupplySearchHit = {
  catalogMaterialId: string;
  catalogProductId: string;
  catalogSupplierOfferId: string;
  family: string;
  materialDesignation: string;
  materialUnit: string;
  productLabel: string;
  manufacturer: string | null;
  manufacturerRef: string | null;
  gtin: string | null;
  imageUrl: string | null;
  supplierName: string;
  supplierExternalOrgId: string;
  packagingLabel: string | null;
  latestPrice: {
    id: string;
    unitPrice: number | null;
    priceUnit: string;
    priceTaxMode: string;
    observedAt: string | null;
    recordedAt: string;
    priceSourceType: string;
    sourceUrl: string | null;
  } | null;
  priceFreshness: "FRESH" | "TO_REFRESH" | "EXPIRED";
  priceFreshnessLabel: string;
};

function freshnessLabel(f: "FRESH" | "TO_REFRESH" | "EXPIRED"): string {
  if (f === "FRESH") return "Prix récent";
  if (f === "TO_REFRESH") return "À actualiser";
  return "Prix expiré — à actualiser";
}

export async function searchCatalogForSupply(opts: {
  organizationId: string;
  q?: string | null;
  limit?: number;
}): Promise<CatalogSupplySearchHit[]> {
  const limit = Math.min(40, Math.max(1, opts.limit ?? 20));
  const q = opts.q?.trim() || "";
  const qNorm = q ? normalizeDesignation(q) : null;

  const products = await prisma.catalogProduct.findMany({
    where: {
      organizationId: opts.organizationId,
      status: { not: "ARCHIVED" },
      ...(qNorm
        ? {
            OR: [
              { label: { contains: q, mode: "insensitive" } },
              { manufacturerNormalized: { contains: qNorm } },
              {
                manufacturerRefNormalized: {
                  contains: qNorm,
                },
              },
              { gtin: { contains: q } },
              {
                material: {
                  OR: [
                    { designationNormalized: { contains: qNorm } },
                    { family: { contains: q, mode: "insensitive" } },
                  ],
                },
              },
            ],
          }
        : {}),
    },
    take: limit,
    orderBy: { updatedAt: "desc" },
    include: {
      material: {
        select: {
          id: true,
          family: true,
          designation: true,
          unit: true,
        },
      },
      offers: {
        where: { archivedAt: null },
        orderBy: { updatedAt: "desc" },
        take: 3,
        include: {
          supplier: {
            select: { id: true, name: true, tradeName: true },
          },
          priceObservations: {
            orderBy: { recordedAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  const hits: CatalogSupplySearchHit[] = [];
  for (const p of products) {
    for (const o of p.offers) {
      const latest = o.priceObservations[0] ?? null;
      const freshness = getSupplyOfferFreshness({
        validUntil: latest?.validUntil ?? null,
        observedAt: latest?.observedAt ?? null,
        recordedAt: latest?.recordedAt ?? null,
      });
      hits.push({
        catalogMaterialId: p.material.id,
        catalogProductId: p.id,
        catalogSupplierOfferId: o.id,
        family: p.material.family,
        materialDesignation: p.material.designation,
        materialUnit: p.material.unit,
        productLabel: p.label,
        manufacturer: p.manufacturer,
        manufacturerRef: p.manufacturerRef,
        gtin: p.gtin,
        imageUrl: o.imageUrl || p.imageUrl,
        supplierName: o.supplier.tradeName || o.supplier.name,
        supplierExternalOrgId: o.supplierExternalOrgId,
        packagingLabel: o.packagingLabel,
        latestPrice: latest
          ? {
              id: latest.id,
              unitPrice: n(latest.unitPrice),
              priceUnit: latest.priceUnit,
              priceTaxMode: latest.priceTaxMode,
              observedAt: latest.observedAt?.toISOString() ?? null,
              recordedAt: latest.recordedAt.toISOString(),
              priceSourceType: latest.priceSourceType,
              sourceUrl: latest.sourceUrl,
            }
          : null,
        priceFreshness: freshness,
        priceFreshnessLabel: freshnessLabel(freshness),
      });
    }
  }
  return hits.slice(0, limit);
}

export type ApplyCatalogPreview = {
  catalogSupplierOfferId: string;
  requirementId: string;
  projectId: string;
  need: { id: string; label: string; unit: string };
  snapshot: {
    productLabel: string;
    productRef: string | null;
    manufacturer: string | null;
    gtin: string | null;
    supplierExternalOrgId: string;
    supplierName: string;
    unitPrice: number | null;
    priceUnit: string;
    priceTaxMode: "HT" | "TTC";
    vatRate: number | null;
    priceSourceType: SupplyOfferPriceSourceType;
    sourceUrl: string | null;
    observedAt: string | null;
    packagingLabel: string | null;
    unitsPerPack: number | null;
    leadTimeDays: number | null;
    deliveryFee: number | null;
    craneFee: number | null;
    otherFees: number | null;
    imageUrl: string | null;
    imageOrigin: string | null;
    catalogPriceObservationId: string | null;
  };
  compatibility: {
    unitMatch: boolean;
    needUnit: string;
    catalogUnit: string;
    equivalenceStatus: "TO_VERIFY";
    notes: string[];
  };
  priceFreshness: "FRESH" | "TO_REFRESH" | "EXPIRED";
  priceFreshnessLabel: string;
  existingOfferCandidates: Array<{
    id: string;
    productLabel: string;
    productRef: string | null;
    matchReasons: string[];
  }>;
};

async function loadCatalogOfferBundle(
  organizationId: string,
  catalogSupplierOfferId: string,
) {
  return prisma.catalogSupplierOffer.findFirst({
    where: { id: catalogSupplierOfferId, organizationId, archivedAt: null },
    include: {
      supplier: { select: { id: true, name: true, tradeName: true } },
      product: {
        include: {
          material: {
            select: { id: true, designation: true, unit: true, family: true },
          },
        },
      },
      priceObservations: {
        orderBy: { recordedAt: "desc" },
        take: 1,
      },
    },
  });
}

export async function previewApplyCatalogToSupply(opts: {
  organizationId: string;
  projectId: string;
  requirementId: string;
  catalogSupplierOfferId: string;
}): Promise<ApplyCatalogPreview> {
  const need = await prisma.materialRequirement.findFirst({
    where: {
      id: opts.requirementId,
      organizationId: opts.organizationId,
      projectId: opts.projectId,
    },
    select: { id: true, label: true, unit: true },
  });
  if (!need) throw new Error("Besoin chantier introuvable");

  const bundle = await loadCatalogOfferBundle(
    opts.organizationId,
    opts.catalogSupplierOfferId,
  );
  if (!bundle) throw new Error("Offre catalogue introuvable");

  const latest = bundle.priceObservations[0] ?? null;
  const freshness = getSupplyOfferFreshness({
    validUntil: latest?.validUntil ?? null,
    observedAt: latest?.observedAt ?? null,
    recordedAt: latest?.recordedAt ?? null,
  });

  const catalogUnit =
    latest?.priceUnit || bundle.priceUnit || bundle.product.material.unit;
  const unitMatch =
    need.unit.trim().toLowerCase() === catalogUnit.trim().toLowerCase();

  const notes: string[] = [
    "Équivalence technique non confirmée automatiquement — statut À vérifier.",
  ];
  if (!unitMatch) {
    notes.push(
      `Unités différentes : besoin « ${need.unit} » vs catalogue « ${catalogUnit} » — à valider.`,
    );
  }
  if (freshness !== "FRESH") {
    notes.push(
      `${freshnessLabel(freshness)} — le prix chantier ne sera pas mis à jour automatiquement plus tard.`,
    );
  }
  if (latest?.unitPrice == null) {
    notes.push("Aucun prix catalogue daté — offre créée sans montant inventé.");
  }

  // Doublons potentiels sur le besoin (aperçu, sans throw)
  const existingRows = await prisma.supplyOffer.findMany({
    where: {
      organizationId: opts.organizationId,
      requirementId: need.id,
      archivedAt: null,
      supplierExternalOrgId: bundle.supplierExternalOrgId,
    },
    select: {
      id: true,
      productLabel: true,
      productRef: true,
      sourceUrl: true,
      techAttributes: true,
    },
    take: 10,
  });
  const existingOfferCandidates = existingRows
    .filter((r) => {
      const refMatch =
        bundle.product.manufacturerRef &&
        r.productRef &&
        r.productRef.trim().toLowerCase() ===
          bundle.product.manufacturerRef.trim().toLowerCase();
      const urlMatch =
        bundle.sourceUrl &&
        r.sourceUrl &&
        r.sourceUrl.trim() === bundle.sourceUrl.trim();
      const tech = r.techAttributes as Record<string, unknown> | null;
      const catalogMatch =
        tech &&
        typeof tech === "object" &&
        tech.catalogSupplierOfferId === bundle.id;
      return Boolean(refMatch || urlMatch || catalogMatch);
    })
    .map((r) => ({
      id: r.id,
      productLabel: r.productLabel,
      productRef: r.productRef,
      matchReasons: ["offre potentiellement équivalente déjà sur ce besoin"],
    }));

  return {
    catalogSupplierOfferId: bundle.id,
    requirementId: need.id,
    projectId: opts.projectId,
    need,
    snapshot: {
      productLabel: bundle.product.label,
      productRef: bundle.product.manufacturerRef,
      manufacturer: bundle.product.manufacturer,
      gtin: bundle.product.gtin,
      supplierExternalOrgId: bundle.supplierExternalOrgId,
      supplierName: bundle.supplier.tradeName || bundle.supplier.name,
      unitPrice: latest ? n(latest.unitPrice) : null,
      priceUnit: latest?.priceUnit || bundle.priceUnit || "U",
      priceTaxMode: latest?.priceTaxMode === "TTC" ? "TTC" : "HT",
      vatRate: latest ? n(latest.vatRate) : null,
      priceSourceType: mapPriceSource(
        latest?.priceSourceType || bundle.priceSourceType,
      ),
      sourceUrl: latest?.sourceUrl || bundle.sourceUrl,
      observedAt: latest?.observedAt?.toISOString() ?? null,
      packagingLabel: bundle.packagingLabel,
      unitsPerPack: n(bundle.unitsPerPack),
      leadTimeDays: n(bundle.leadTimeDays),
      deliveryFee: n(bundle.deliveryFee),
      craneFee: n(bundle.craneFee),
      otherFees: n(bundle.otherFees),
      imageUrl: bundle.imageUrl || bundle.product.imageUrl,
      imageOrigin: bundle.imageOrigin || bundle.product.imageOrigin,
      catalogPriceObservationId: latest?.id ?? null,
    },
    compatibility: {
      unitMatch,
      needUnit: need.unit,
      catalogUnit,
      equivalenceStatus: "TO_VERIFY",
      notes,
    },
    priceFreshness: freshness,
    priceFreshnessLabel: freshnessLabel(freshness),
    existingOfferCandidates,
  };
}

export async function commitApplyCatalogToSupply(opts: {
  organizationId: string;
  projectId: string;
  requirementId: string;
  catalogSupplierOfferId: string;
  recordedById: string;
  forceCreate?: boolean;
}): Promise<{
  offer: SupplyOfferView;
  mode: "CREATED" | "DUPLICATE_BLOCKED";
  priceFreshnessLabel: string;
}> {
  const preview = await previewApplyCatalogToSupply({
    organizationId: opts.organizationId,
    projectId: opts.projectId,
    requirementId: opts.requirementId,
    catalogSupplierOfferId: opts.catalogSupplierOfferId,
  });

  if (preview.existingOfferCandidates.length > 0 && !opts.forceCreate) {
    throw new SupplyOfferDuplicateError(
      preview.existingOfferCandidates.map((c) => ({
        id: c.id,
        supplierExternalOrgId: preview.snapshot.supplierExternalOrgId,
        productLabel: c.productLabel,
        productRef: c.productRef,
        sourceUrl: preview.snapshot.sourceUrl,
        unitPrice: preview.snapshot.unitPrice,
        archivedAt: null,
        matchReasons: c.matchReasons,
      })),
    );
  }

  const s = preview.snapshot;
  const techAttributes = {
    catalogMaterialId: undefined as string | undefined,
    catalogProductId: undefined as string | undefined,
    catalogSupplierOfferId: opts.catalogSupplierOfferId,
    catalogPriceObservationId: s.catalogPriceObservationId,
    catalogAppliedAt: new Date().toISOString(),
    manufacturer: s.manufacturer,
    ...(s.gtin ? { ean: s.gtin, gtin: s.gtin } : {}),
    priceFreshnessAtApply: preview.priceFreshness,
  };

  // Remplir ids matériau/produit depuis le bundle
  const bundle = await loadCatalogOfferBundle(
    opts.organizationId,
    opts.catalogSupplierOfferId,
  );
  if (bundle) {
    techAttributes.catalogMaterialId = bundle.product.material.id;
    techAttributes.catalogProductId = bundle.product.id;
  }

  try {
    let offer = await createSupplyOffer({
      organizationId: opts.organizationId,
      projectId: opts.projectId,
      requirementId: opts.requirementId,
      recordedById: opts.recordedById,
      forceCreate: opts.forceCreate === true,
      input: {
        supplierExternalOrgId: s.supplierExternalOrgId,
        productLabel: s.productLabel,
        productRef: s.productRef,
        techAttributes,
        equivalenceStatus: "TO_VERIFY",
        unitPrice: s.unitPrice,
        priceUnit: s.priceUnit,
        priceTaxMode: s.priceTaxMode,
        vatRate: s.vatRate,
        priceSourceType: s.priceSourceType,
        sourceUrl: s.sourceUrl,
        sourceNote: [
          `Snapshot catalogue ${opts.catalogSupplierOfferId}`,
          s.catalogPriceObservationId
            ? `observation ${s.catalogPriceObservationId}`
            : null,
          s.observedAt ? `prix observé ${s.observedAt.slice(0, 10)}` : null,
          preview.priceFreshness !== "FRESH"
            ? preview.priceFreshnessLabel
            : null,
        ]
          .filter(Boolean)
          .join(" · "),
        observedAt: s.observedAt,
        packagingLabel: s.packagingLabel,
        unitsPerPack: s.unitsPerPack,
        leadTimeDays: s.leadTimeDays,
        deliveryFee: s.deliveryFee,
        craneFee: s.craneFee,
        otherFees: s.otherFees,
      },
    });

    if (s.imageUrl) {
      const origin =
        s.imageOrigin === "USER_UPLOAD" ||
        s.imageOrigin === "USER_URL" ||
        s.imageOrigin === "SUPPLIER_URL"
          ? s.imageOrigin
          : "SUPPLIER_URL";
      try {
        offer = await setSupplyOfferProductImage({
          organizationId: opts.organizationId,
          projectId: opts.projectId,
          requirementId: opts.requirementId,
          offerId: offer.id,
          productImageUrl: s.imageUrl,
          productImageOrigin: origin,
        });
      } catch {
        // Image optionnelle — l’offre reste créée
      }
    }

    return {
      offer,
      mode: "CREATED",
      priceFreshnessLabel: preview.priceFreshnessLabel,
    };
  } catch (e) {
    if (e instanceof SupplyOfferDuplicateError) throw e;
    throw e;
  }
}
