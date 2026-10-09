/**
 * Catalogue Matériaux — CRUD org-scopé.
 * Aucun prix inventé. Isolation organizationId stricte.
 */
import { prisma } from "@/lib/prisma";
import {
  normalizeDesignation,
  normalizeGtin,
  normalizeManufacturer,
  normalizeManufacturerRef,
} from "@/lib/catalog/normalize";
import type {
  CatalogListResult,
  CatalogMaterialDetail,
  CatalogMaterialInput,
  CatalogMaterialListItem,
  CatalogMaterialStatus,
} from "@/lib/catalog/types";

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 100;

function mapListItem(row: {
  id: string;
  organizationId: string;
  family: string;
  designation: string;
  unit: string;
  description: string | null;
  status: CatalogMaterialStatus;
  updatedAt: Date;
  createdAt: Date;
  _count: { products: number };
  products: Array<{ _count: { offers: number } }>;
}): CatalogMaterialListItem {
  const offerCount = row.products.reduce((n, p) => n + p._count.offers, 0);
  return {
    id: row.id,
    organizationId: row.organizationId,
    family: row.family,
    designation: row.designation,
    unit: row.unit,
    description: row.description,
    status: row.status,
    productCount: row._count.products,
    offerCount,
    updatedAt: row.updatedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listCatalogMaterials(opts: {
  organizationId: string;
  q?: string | null;
  family?: string | null;
  status?: CatalogMaterialStatus | "ALL" | null;
  page?: number;
  pageSize?: number;
}): Promise<CatalogListResult> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, opts.pageSize ?? DEFAULT_PAGE_SIZE),
  );
  const qNorm = opts.q?.trim() ? normalizeDesignation(opts.q) : null;
  const family = opts.family?.trim() || null;
  const status =
    opts.status && opts.status !== "ALL" ? opts.status : undefined;

  const where = {
    organizationId: opts.organizationId,
    ...(status ? { status } : { status: { not: "ARCHIVED" as const } }),
    ...(family ? { family } : {}),
    ...(qNorm
      ? {
          OR: [
            { designationNormalized: { contains: qNorm } },
            { family: { contains: opts.q!.trim(), mode: "insensitive" as const } },
            {
              products: {
                some: {
                  OR: [
                    {
                      manufacturerNormalized: {
                        contains: qNorm,
                      },
                    },
                    {
                      manufacturerRefNormalized: {
                        contains: normalizeManufacturerRef(opts.q) ?? qNorm,
                      },
                    },
                    { gtin: { contains: opts.q!.trim() } },
                    {
                      label: {
                        contains: opts.q!.trim(),
                        mode: "insensitive" as const,
                      },
                    },
                  ],
                },
              },
            },
          ],
        }
      : {}),
  };

  const [total, rows, familyRows] = await Promise.all([
    prisma.catalogMaterial.count({ where }),
    prisma.catalogMaterial.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { designation: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { products: true } },
        products: {
          where: { status: { not: "ARCHIVED" } },
          select: { _count: { select: { offers: true } } },
        },
      },
    }),
    prisma.catalogMaterial.findMany({
      where: {
        organizationId: opts.organizationId,
        status: { not: "ARCHIVED" },
      },
      select: { family: true },
      distinct: ["family"],
      orderBy: { family: "asc" },
    }),
  ]);

  return {
    items: rows.map(mapListItem),
    total,
    page,
    pageSize,
    families: familyRows.map((f) => f.family).filter(Boolean),
  };
}

export async function getCatalogMaterial(opts: {
  organizationId: string;
  id: string;
}): Promise<CatalogMaterialDetail | null> {
  const row = await prisma.catalogMaterial.findFirst({
    where: { id: opts.id, organizationId: opts.organizationId },
    include: {
      _count: { select: { products: true } },
      products: {
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          label: true,
          manufacturer: true,
          manufacturerRef: true,
          gtin: true,
          status: true,
          imageUrl: true,
          _count: { select: { offers: true } },
        },
      },
    },
  });
  if (!row) return null;
  const offerCount = row.products.reduce((n, p) => n + p._count.offers, 0);
  return {
    id: row.id,
    organizationId: row.organizationId,
    family: row.family,
    designation: row.designation,
    designationNormalized: row.designationNormalized,
    unit: row.unit,
    description: row.description,
    techAttributes: row.techAttributes,
    status: row.status,
    notes: row.notes,
    productCount: row._count.products,
    offerCount,
    updatedAt: row.updatedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    products: row.products.map((p) => ({
      id: p.id,
      label: p.label,
      manufacturer: p.manufacturer,
      manufacturerRef: p.manufacturerRef,
      gtin: p.gtin,
      status: p.status,
      imageUrl: p.imageUrl,
      offerCount: p._count.offers,
    })),
  };
}

export type CatalogMaterialDuplicate = {
  id: string;
  designation: string;
  family: string;
  reason: string;
};

/** Doublons potentiels matériau : même org + désignation normalisée exacte. */
export async function findCatalogMaterialDuplicates(opts: {
  organizationId: string;
  designation: string;
  excludeId?: string | null;
}): Promise<CatalogMaterialDuplicate[]> {
  const norm = normalizeDesignation(opts.designation);
  if (!norm) return [];
  const rows = await prisma.catalogMaterial.findMany({
    where: {
      organizationId: opts.organizationId,
      designationNormalized: norm,
      status: { not: "ARCHIVED" },
      ...(opts.excludeId ? { id: { not: opts.excludeId } } : {}),
    },
    select: { id: true, designation: true, family: true },
    take: 10,
  });
  return rows.map((r) => ({
    id: r.id,
    designation: r.designation,
    family: r.family,
    reason: "même désignation normalisée",
  }));
}

export async function createCatalogMaterial(opts: {
  organizationId: string;
  createdById: string;
  input: CatalogMaterialInput;
  forceCreate?: boolean;
}): Promise<CatalogMaterialDetail> {
  const designation = opts.input.designation.trim();
  if (!designation) throw new Error("Désignation requise");
  const family = opts.input.family.trim();
  if (!family) throw new Error("Famille technique requise");
  const unit = (opts.input.unit ?? "U").trim() || "U";

  const dups = await findCatalogMaterialDuplicates({
    organizationId: opts.organizationId,
    designation,
  });
  if (dups.length > 0 && !opts.forceCreate) {
    const err = new Error(
      "Une fiche matériau avec une désignation similaire existe déjà.",
    ) as Error & { code: string; candidates: CatalogMaterialDuplicate[] };
    err.code = "DUPLICATE";
    err.candidates = dups;
    throw err;
  }

  const row = await prisma.catalogMaterial.create({
    data: {
      organizationId: opts.organizationId,
      family,
      designation,
      designationNormalized: normalizeDesignation(designation),
      unit,
      description: opts.input.description?.trim() || null,
      techAttributes:
        opts.input.techAttributes === undefined
          ? undefined
          : (opts.input.techAttributes as object),
      status: opts.input.status ?? "DRAFT",
      notes: opts.input.notes?.trim() || null,
      createdById: opts.createdById,
    },
  });

  const detail = await getCatalogMaterial({
    organizationId: opts.organizationId,
    id: row.id,
  });
  if (!detail) throw new Error("Création impossible");
  return detail;
}

export async function updateCatalogMaterial(opts: {
  organizationId: string;
  id: string;
  input: Partial<CatalogMaterialInput>;
}): Promise<CatalogMaterialDetail> {
  const existing = await prisma.catalogMaterial.findFirst({
    where: { id: opts.id, organizationId: opts.organizationId },
    select: { id: true },
  });
  if (!existing) throw new Error("Fiche introuvable");

  const designation =
    opts.input.designation !== undefined
      ? opts.input.designation.trim()
      : undefined;
  if (designation !== undefined && !designation) {
    throw new Error("Désignation requise");
  }

  if (designation) {
    const dups = await findCatalogMaterialDuplicates({
      organizationId: opts.organizationId,
      designation,
      excludeId: opts.id,
    });
    if (dups.length > 0) {
      throw new Error(
        `Conflit : désignation déjà utilisée (${dups[0].designation})`,
      );
    }
  }

  await prisma.catalogMaterial.update({
    where: { id: opts.id },
    data: {
      ...(opts.input.family !== undefined
        ? { family: opts.input.family.trim() }
        : {}),
      ...(designation !== undefined
        ? {
            designation,
            designationNormalized: normalizeDesignation(designation),
          }
        : {}),
      ...(opts.input.unit !== undefined
        ? { unit: opts.input.unit.trim() || "U" }
        : {}),
      ...(opts.input.description !== undefined
        ? { description: opts.input.description?.trim() || null }
        : {}),
      ...(opts.input.techAttributes !== undefined
        ? { techAttributes: opts.input.techAttributes as object }
        : {}),
      ...(opts.input.status !== undefined ? { status: opts.input.status } : {}),
      ...(opts.input.notes !== undefined
        ? { notes: opts.input.notes?.trim() || null }
        : {}),
    },
  });

  const detail = await getCatalogMaterial({
    organizationId: opts.organizationId,
    id: opts.id,
  });
  if (!detail) throw new Error("Mise à jour impossible");
  return detail;
}

/** Helpers exportés pour Phase 2+ (produits). */
export {
  normalizeManufacturer,
  normalizeManufacturerRef,
  normalizeGtin,
};
