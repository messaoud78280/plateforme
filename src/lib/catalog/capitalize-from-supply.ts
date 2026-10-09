/**
 * Capitalisation SupplyOffer chantier → Catalogue Matériaux (org-privé).
 * Preview + commit atomique. Idempotent via sourceSupplyOfferId.
 * Ne mute jamais l’offre chantier.
 */
import { prisma } from "@/lib/prisma";
import {
  normalizeDesignation,
  normalizeGtin,
  normalizeManufacturer,
  normalizeManufacturerRef,
} from "@/lib/catalog/normalize";
import { extractEanFromTechAttributes } from "@/lib/supply/offer-duplicates";
import {
  createCatalogMaterial,
  findCatalogMaterialDuplicates,
} from "@/lib/catalog/service";
import {
  createCatalogProduct,
  createCatalogSupplierOffer,
  addCatalogPriceObservation,
  findCatalogProductDuplicates,
} from "@/lib/catalog/product-service";

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function extractManufacturer(tech: unknown): string | null {
  if (!tech || typeof tech !== "object") return null;
  const o = tech as Record<string, unknown>;
  for (const key of [
    "manufacturer",
    "fabricant",
    "brand",
    "marque",
    "maker",
  ]) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

export type CapitalizePreview = {
  mode: "ALREADY_DONE" | "ATTACH" | "CREATE";
  supplyOfferId: string;
  source: {
    productLabel: string;
    productRef: string | null;
    manufacturer: string | null;
    gtin: string | null;
    sourceUrl: string | null;
    imageUrl: string | null;
    imageOrigin: string | null;
    supplierName: string;
    supplierExternalOrgId: string;
    unitPrice: number | null;
    priceUnit: string;
    priceTaxMode: string;
    priceSourceType: string;
    observedAt: string | null;
    packagingLabel: string | null;
  };
  proposed: {
    material: {
      family: string;
      designation: string;
      unit: string;
      description: string | null;
    };
    product: {
      label: string;
      manufacturer: string | null;
      manufacturerRef: string | null;
      gtin: string | null;
      sourceUrl: string | null;
      imageUrl: string | null;
      imageOrigin: string | null;
    };
    offer: {
      packagingLabel: string | null;
      unitsPerPack: number | null;
      leadTimeDays: number | null;
      deliveryFee: number | null;
      craneFee: number | null;
      otherFees: number | null;
      sourceUrl: string | null;
    };
    price: {
      unitPrice: number | null;
      priceUnit: string;
      priceTaxMode: "HT" | "TTC";
      vatRate: number | null;
      observedAt: string | null;
      priceSourceType: string;
    };
  };
  existing?: {
    catalogMaterialId: string;
    catalogProductId: string;
    catalogSupplierOfferId: string;
    catalogPriceObservationId: string;
  };
  materialCandidates: Array<{
    id: string;
    designation: string;
    family: string;
    reason: string;
  }>;
  productCandidates: Array<{ id: string; label: string; reason: string }>;
  warnings: string[];
  excludedFromCopy: string[];
};

async function loadSupplyOfferForCapitalize(
  organizationId: string,
  supplyOfferId: string,
) {
  return prisma.supplyOffer.findFirst({
    where: { id: supplyOfferId, organizationId },
    include: {
      supplier: { select: { id: true, name: true, tradeName: true } },
      requirement: {
        select: {
          id: true,
          label: true,
          unit: true,
          description: true,
          category: true,
        },
      },
    },
  });
}

function buildProposed(offer: NonNullable<
  Awaited<ReturnType<typeof loadSupplyOfferForCapitalize>>
>): CapitalizePreview["proposed"] {
  const manufacturer = extractManufacturer(offer.techAttributes);
  const gtin =
    normalizeGtin(extractEanFromTechAttributes(offer.techAttributes)) ?? null;
  const familyByCategory: Record<string, string> = {
    MATERIAL: "Matériaux",
    CONSUMABLE: "Consommables",
    EQUIPMENT_RENTAL: "Location matériel",
    WASTE: "Déchets",
    TRANSPORT: "Transport",
    EXTERNAL_SERVICE: "Prestations externes",
    OTHER: "À classer",
  };
  const family =
    familyByCategory[offer.requirement.category] ?? "À classer";

  return {
    material: {
      family,
      designation: offer.requirement.label.trim(),
      unit: offer.requirement.unit?.trim() || "U",
      description: offer.requirement.description?.trim() || null,
    },
    product: {
      label: offer.productLabel.trim(),
      manufacturer,
      manufacturerRef: offer.productRef?.trim() || null,
      gtin,
      sourceUrl: offer.sourceUrl?.trim() || null,
      imageUrl: offer.productImageUrl?.trim() || null,
      imageOrigin: offer.productImageOrigin?.trim() || null,
    },
    offer: {
      packagingLabel: offer.packagingLabel?.trim() || null,
      unitsPerPack: num(offer.unitsPerPack),
      leadTimeDays: num(offer.leadTimeDays),
      deliveryFee: num(offer.deliveryFee),
      craneFee: num(offer.craneFee),
      otherFees: num(offer.otherFees),
      sourceUrl: offer.sourceUrl?.trim() || null,
    },
    price: {
      unitPrice: num(offer.unitPrice),
      priceUnit: offer.priceUnit?.trim() || "U",
      priceTaxMode: offer.priceTaxMode === "TTC" ? "TTC" : "HT",
      vatRate: num(offer.vatRate),
      observedAt: offer.observedAt?.toISOString() ?? null,
      priceSourceType: offer.priceSourceType,
    },
  };
}

export async function previewCapitalizeSupplyOffer(opts: {
  organizationId: string;
  supplyOfferId: string;
}): Promise<CapitalizePreview> {
  const offer = await loadSupplyOfferForCapitalize(
    opts.organizationId,
    opts.supplyOfferId,
  );
  if (!offer) throw new Error("Offre chantier introuvable");

  const proposed = buildProposed(offer);
  const warnings: string[] = [];
  if (!proposed.product.manufacturer) {
    warnings.push(
      "Fabricant inconnu sur l’offre — non inventé ; à compléter plus tard dans le catalogue.",
    );
  }
  if (proposed.price.unitPrice == null) {
    warnings.push("Aucun prix unitaire justifié — observation créée sans montant.");
  }
  if (!proposed.product.gtin && !proposed.product.manufacturerRef) {
    warnings.push(
      "Ni GTIN ni référence fabricant — anti-doublon limité à l’URL et à la désignation.",
    );
  }

  const excludedFromCopy = [
    "Quantités chantier / métré",
    "Dates de besoin chantier",
    "Statut retenu / BC",
    "Liens planning / takeoff",
  ];

  const prior = await prisma.catalogPriceObservation.findFirst({
    where: {
      organizationId: opts.organizationId,
      sourceSupplyOfferId: offer.id,
    },
    include: {
      offer: {
        select: {
          id: true,
          catalogProductId: true,
          product: { select: { catalogMaterialId: true } },
        },
      },
    },
    orderBy: { recordedAt: "desc" },
  });

  if (prior) {
    return {
      mode: "ALREADY_DONE",
      supplyOfferId: offer.id,
      source: {
        productLabel: offer.productLabel,
        productRef: offer.productRef,
        manufacturer: proposed.product.manufacturer,
        gtin: proposed.product.gtin,
        sourceUrl: offer.sourceUrl,
        imageUrl: offer.productImageUrl,
        imageOrigin: offer.productImageOrigin,
        supplierName:
          offer.supplier.tradeName || offer.supplier.name,
        supplierExternalOrgId: offer.supplierExternalOrgId,
        unitPrice: proposed.price.unitPrice,
        priceUnit: proposed.price.priceUnit,
        priceTaxMode: proposed.price.priceTaxMode,
        priceSourceType: offer.priceSourceType,
        observedAt: proposed.price.observedAt,
        packagingLabel: offer.packagingLabel,
      },
      proposed,
      existing: {
        catalogMaterialId: prior.offer.product.catalogMaterialId,
        catalogProductId: prior.offer.catalogProductId,
        catalogSupplierOfferId: prior.offer.id,
        catalogPriceObservationId: prior.id,
      },
      materialCandidates: [],
      productCandidates: [],
      warnings: [
        ...warnings,
        "Cette offre a déjà été capitalisée — aucune écriture supplémentaire.",
      ],
      excludedFromCopy,
    };
  }

  const productCandidates = await findCatalogProductDuplicates({
    organizationId: opts.organizationId,
    manufacturer: proposed.product.manufacturer,
    manufacturerRef: proposed.product.manufacturerRef,
    gtin: proposed.product.gtin,
    sourceUrl: proposed.product.sourceUrl,
  });

  const materialCandidates = await findCatalogMaterialDuplicates({
    organizationId: opts.organizationId,
    designation: proposed.material.designation,
  });

  const hardProductMatch = productCandidates.filter(
    (c) =>
      c.reason === "même GTIN/EAN" ||
      c.reason === "même fabricant + référence",
  );

  return {
    mode: hardProductMatch.length > 0 ? "ATTACH" : "CREATE",
    supplyOfferId: offer.id,
    source: {
      productLabel: offer.productLabel,
      productRef: offer.productRef,
      manufacturer: proposed.product.manufacturer,
      gtin: proposed.product.gtin,
      sourceUrl: offer.sourceUrl,
      imageUrl: offer.productImageUrl,
      imageOrigin: offer.productImageOrigin,
      supplierName: offer.supplier.tradeName || offer.supplier.name,
      supplierExternalOrgId: offer.supplierExternalOrgId,
      unitPrice: proposed.price.unitPrice,
      priceUnit: proposed.price.priceUnit,
      priceTaxMode: proposed.price.priceTaxMode,
      priceSourceType: offer.priceSourceType,
      observedAt: proposed.price.observedAt,
      packagingLabel: offer.packagingLabel,
    },
    proposed,
    materialCandidates,
    productCandidates,
    warnings,
    excludedFromCopy,
  };
}

export async function commitCapitalizeSupplyOffer(opts: {
  organizationId: string;
  supplyOfferId: string;
  recordedById: string;
  /** Matériau catalogue existant à rattacher (sinon création / 1er candidat forcé). */
  catalogMaterialId?: string | null;
  /** Produit catalogue existant à rattacher. */
  catalogProductId?: string | null;
  forceCreateMaterial?: boolean;
  forceCreateProduct?: boolean;
}): Promise<{
  catalogMaterialId: string;
  catalogProductId: string;
  catalogSupplierOfferId: string;
  catalogPriceObservationId: string;
  mode: "ALREADY_DONE" | "ATTACH" | "CREATE";
}> {
  const preview = await previewCapitalizeSupplyOffer({
    organizationId: opts.organizationId,
    supplyOfferId: opts.supplyOfferId,
  });

  if (preview.mode === "ALREADY_DONE" && preview.existing) {
    return { ...preview.existing, mode: "ALREADY_DONE" };
  }

  const offer = await loadSupplyOfferForCapitalize(
    opts.organizationId,
    opts.supplyOfferId,
  );
  if (!offer) throw new Error("Offre chantier introuvable");
  const proposed = preview.proposed;

  // Double-check concurrency
  const race = await prisma.catalogPriceObservation.findFirst({
    where: {
      organizationId: opts.organizationId,
      sourceSupplyOfferId: offer.id,
    },
    include: {
      offer: {
        select: {
          id: true,
          catalogProductId: true,
          product: { select: { catalogMaterialId: true } },
        },
      },
    },
  });
  if (race) {
    return {
      catalogMaterialId: race.offer.product.catalogMaterialId,
      catalogProductId: race.offer.catalogProductId,
      catalogSupplierOfferId: race.offer.id,
      catalogPriceObservationId: race.id,
      mode: "ALREADY_DONE",
    };
  }

  let materialId = opts.catalogMaterialId?.trim() || null;
  let productId = opts.catalogProductId?.trim() || null;
  let mode: "ATTACH" | "CREATE" = productId ? "ATTACH" : preview.mode === "ATTACH" ? "ATTACH" : "CREATE";

  if (productId) {
    const p = await prisma.catalogProduct.findFirst({
      where: { id: productId, organizationId: opts.organizationId },
      select: { id: true, catalogMaterialId: true },
    });
    if (!p) throw new Error("Produit catalogue introuvable");
    materialId = p.catalogMaterialId;
    productId = p.id;
    mode = "ATTACH";
  } else if (
    preview.productCandidates.some(
      (c) =>
        c.reason === "même GTIN/EAN" ||
        c.reason === "même fabricant + référence",
    ) &&
    !opts.forceCreateProduct
  ) {
    const preferred = preview.productCandidates.find(
      (c) =>
        c.reason === "même GTIN/EAN" ||
        c.reason === "même fabricant + référence",
    )!;
    productId = preferred.id;
    const p = await prisma.catalogProduct.findFirst({
      where: { id: productId, organizationId: opts.organizationId },
      select: { catalogMaterialId: true },
    });
    if (!p) throw new Error("Produit catalogue introuvable");
    materialId = p.catalogMaterialId;
    mode = "ATTACH";
  }

  if (!materialId) {
    if (
      preview.materialCandidates.length > 0 &&
      !opts.forceCreateMaterial
    ) {
      materialId = preview.materialCandidates[0]!.id;
    } else {
      const created = await createCatalogMaterial({
        organizationId: opts.organizationId,
        createdById: opts.recordedById,
        forceCreate: opts.forceCreateMaterial === true,
        input: {
          family: proposed.material.family,
          designation: proposed.material.designation,
          unit: proposed.material.unit,
          description: proposed.material.description,
          status: "ACTIVE",
          notes: `Capitalisé depuis offre chantier ${offer.id}`,
        },
      });
      materialId = created.id;
    }
  } else {
    const m = await prisma.catalogMaterial.findFirst({
      where: { id: materialId, organizationId: opts.organizationId },
      select: { id: true },
    });
    if (!m) throw new Error("Matériau catalogue introuvable");
  }

  if (!productId) {
    const created = await createCatalogProduct({
      organizationId: opts.organizationId,
      catalogMaterialId: materialId,
      createdById: opts.recordedById,
      forceCreate: opts.forceCreateProduct === true,
      input: {
        label: proposed.product.label,
        manufacturer: proposed.product.manufacturer,
        manufacturerRef: proposed.product.manufacturerRef,
        gtin: proposed.product.gtin,
        sourceUrl: proposed.product.sourceUrl,
        imageUrl: proposed.product.imageUrl,
        imageOrigin: proposed.product.imageOrigin,
        techAttributes: offer.techAttributes ?? undefined,
        status: "ACTIVE",
        notes: `Capitalisé depuis offre chantier ${offer.id}`,
      },
    });
    productId = created.id;
    mode = "CREATE";
  } else {
    // Enrichissement prudent : remplir image / URL / GTIN seulement si vides
    const existing = await prisma.catalogProduct.findFirst({
      where: { id: productId, organizationId: opts.organizationId },
    });
    if (existing) {
      await prisma.catalogProduct.update({
        where: { id: existing.id },
        data: {
          ...(existing.imageUrl || !proposed.product.imageUrl
            ? {}
            : {
                imageUrl: proposed.product.imageUrl,
                imageOrigin: proposed.product.imageOrigin,
              }),
          ...(existing.sourceUrl || !proposed.product.sourceUrl
            ? {}
            : { sourceUrl: proposed.product.sourceUrl }),
          ...(existing.gtin || !proposed.product.gtin
            ? {}
            : { gtin: proposed.product.gtin }),
          ...(existing.manufacturer || !proposed.product.manufacturer
            ? {}
            : {
                manufacturer: proposed.product.manufacturer,
                manufacturerNormalized: normalizeManufacturer(
                  proposed.product.manufacturer,
                ),
              }),
          updatedAt: new Date(),
        },
      });
    }
  }

  let catalogOffer = await prisma.catalogSupplierOffer.findFirst({
    where: {
      organizationId: opts.organizationId,
      catalogProductId: productId,
      supplierExternalOrgId: offer.supplierExternalOrgId,
      archivedAt: null,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!catalogOffer) {
    catalogOffer = await createCatalogSupplierOffer({
      organizationId: opts.organizationId,
      catalogProductId: productId,
      createdById: opts.recordedById,
      input: {
        supplierExternalOrgId: offer.supplierExternalOrgId,
        priceUnit: proposed.price.priceUnit,
        packagingLabel: proposed.offer.packagingLabel,
        unitsPerPack: proposed.offer.unitsPerPack,
        leadTimeDays: proposed.offer.leadTimeDays,
        availabilityNote: offer.availabilityNote,
        deliveryFee: proposed.offer.deliveryFee,
        craneFee: proposed.offer.craneFee,
        otherFees: proposed.offer.otherFees,
        sourceUrl: proposed.offer.sourceUrl,
        priceSourceType: offer.priceSourceType,
        quoteNumber: offer.quoteNumber,
        quoteDocumentRef: offer.quoteDocumentRef,
        sourceNote: offer.sourceNote,
        imageUrl: proposed.product.imageUrl,
        imageOrigin: proposed.product.imageOrigin,
      },
    });
  } else {
    // Enrichir champs null uniquement
    await prisma.catalogSupplierOffer.update({
      where: { id: catalogOffer.id },
      data: {
        ...(catalogOffer.packagingLabel || !proposed.offer.packagingLabel
          ? {}
          : { packagingLabel: proposed.offer.packagingLabel }),
        ...(catalogOffer.sourceUrl || !proposed.offer.sourceUrl
          ? {}
          : { sourceUrl: proposed.offer.sourceUrl }),
        ...(catalogOffer.imageUrl || !proposed.product.imageUrl
          ? {}
          : {
              imageUrl: proposed.product.imageUrl,
              imageOrigin: proposed.product.imageOrigin,
            }),
        updatedAt: new Date(),
      },
    });
  }

  // Idempotence finale avant insert prix
  const again = await prisma.catalogPriceObservation.findFirst({
    where: {
      organizationId: opts.organizationId,
      sourceSupplyOfferId: offer.id,
    },
  });
  if (again) {
    return {
      catalogMaterialId: materialId,
      catalogProductId: productId,
      catalogSupplierOfferId: catalogOffer.id,
      catalogPriceObservationId: again.id,
      mode: "ALREADY_DONE",
    };
  }

  const observation = await addCatalogPriceObservation({
    organizationId: opts.organizationId,
    catalogSupplierOfferId: catalogOffer.id,
    recordedById: opts.recordedById,
    input: {
      unitPrice: proposed.price.unitPrice,
      priceUnit: proposed.price.priceUnit,
      priceTaxMode: proposed.price.priceTaxMode,
      vatRate: proposed.price.vatRate,
      observedAt: proposed.price.observedAt,
      validUntil: offer.validUntil?.toISOString() ?? null,
      priceSourceType: proposed.price.priceSourceType,
      sourceUrl: proposed.offer.sourceUrl,
      quoteNumber: offer.quoteNumber,
      quoteDocumentRef: offer.quoteDocumentRef,
      sourceNote: offer.sourceNote
        ? `${offer.sourceNote}\n[Capitalisé depuis SupplyOffer ${offer.id}]`
        : `Capitalisé depuis SupplyOffer ${offer.id}`,
      sourceSupplyOfferId: offer.id,
    },
  });

  // Garantir que l’offre chantier n’a pas été touchée (lecture seule)
  void normalizeDesignation(proposed.material.designation);
  void normalizeManufacturerRef(proposed.product.manufacturerRef);

  return {
    catalogMaterialId: materialId,
    catalogProductId: productId,
    catalogSupplierOfferId: catalogOffer.id,
    catalogPriceObservationId: observation.id,
    mode,
  };
}
