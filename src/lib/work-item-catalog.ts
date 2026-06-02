import { cookies } from "next/headers";
import type { Prisma, WorkItemCatalog } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const WORK_ITEM_CATALOG_COOKIE = "bework_work_catalog_id";

export const CATALOG_HISTORIQUE_ID = "bework-catalog-historique";
export const CATALOG_ARTIPRIX_2026_ID = "bework-catalog-artiprix-2026";

export type WorkItemCatalogSummary = Pick<
  WorkItemCatalog,
  "id" | "slug" | "name" | "description" | "status" | "isDefault" | "sourceLabel"
> & { workItemCount?: number };

export function workItemCatalogScope(catalogId: string): Prisma.WorkItemWhereInput {
  return { catalogId };
}

/** Filtre catalogue à fusionner dans les requêtes ouvrages. */
export function mergeCatalogIntoWhere(
  catalogId: string,
  where: Prisma.WorkItemWhereInput = {},
): Prisma.WorkItemWhereInput {
  const AND = Array.isArray(where.AND) ? [...where.AND] : where.AND ? [where.AND] : [];
  return { ...where, AND: [...AND, workItemCatalogScope(catalogId)] };
}

export async function ensureWorkItemCatalogsExist(): Promise<void> {
  const count = await prisma.workItemCatalog.count();
  if (count > 0) return;

  await prisma.workItemCatalog.createMany({
    data: [
      {
        id: CATALOG_HISTORIQUE_ID,
        slug: "historique",
        name: "Bibliothèque historique",
        description:
          "Imports mélangés existants. Consultation et anciens devis — ne pas recodifier en masse.",
        isDefault: false,
        sourceLabel: "Mixte historique",
      },
      {
        id: CATALOG_ARTIPRIX_2026_ID,
        slug: "artiprix-2026",
        name: "Artiprix BeWork 2026",
        description:
          "Bibliothèque propre : Artiprix, codification BeWork, remplissage BPU/DPGF depuis DCE.",
        isDefault: true,
        sourceLabel: "Artiprix",
      },
    ],
    skipDuplicates: true,
  });
}

export async function listWorkItemCatalogs(): Promise<WorkItemCatalogSummary[]> {
  await ensureWorkItemCatalogsExist();
  const rows = await prisma.workItemCatalog.findMany({
    where: { status: "active" },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      status: true,
      isDefault: true,
      sourceLabel: true,
      _count: { select: { workItems: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    status: r.status,
    isDefault: r.isDefault,
    sourceLabel: r.sourceLabel,
    workItemCount: r._count.workItems,
  }));
}

export async function getDefaultWorkItemCatalogId(): Promise<string> {
  await ensureWorkItemCatalogsExist();
  const def = await prisma.workItemCatalog.findFirst({
    where: { isDefault: true, status: "active" },
    select: { id: true },
  });
  if (def) return def.id;
  return CATALOG_ARTIPRIX_2026_ID;
}

export async function resolveActiveWorkItemCatalogId(
  preferredId?: string | null,
): Promise<string> {
  await ensureWorkItemCatalogsExist();

  if (preferredId?.trim()) {
    const ok = await prisma.workItemCatalog.findFirst({
      where: { id: preferredId.trim(), status: "active" },
      select: { id: true },
    });
    if (ok) return ok.id;
  }

  const jar = await cookies();
  const fromCookie = jar.get(WORK_ITEM_CATALOG_COOKIE)?.value?.trim();
  if (fromCookie) {
    const ok = await prisma.workItemCatalog.findFirst({
      where: { id: fromCookie, status: "active" },
      select: { id: true },
    });
    if (ok) return ok.id;
  }

  return getDefaultWorkItemCatalogId();
}

export async function findWorkItemByCatalogCode(
  catalogId: string,
  code: string,
): Promise<{ id: string; code: string } | null> {
  return prisma.workItem.findFirst({
    where: { catalogId, code: code.trim() },
    select: { id: true, code: true },
  });
}
