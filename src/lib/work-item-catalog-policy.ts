import type { WorkItemCatalog } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  CATALOG_ARTIPRIX_2026_ID,
  CATALOG_ARTIPRIX_SLUG,
  CATALOG_HISTORIQUE_ID,
  CATALOG_HISTORIQUE_SLUG,
  HISTORIQUE_IMPORT_WARNING,
  HISTORIQUE_WRITE_BLOCKED_MESSAGE,
} from "@/lib/work-item-catalog-constants";
import {
  getDefaultWorkItemCatalogId,
  resolveActiveWorkItemCatalogId,
} from "@/lib/work-item-catalog";

export {
  CATALOG_ARTIPRIX_SLUG,
  CATALOG_HISTORIQUE_SLUG,
  HISTORIQUE_IMPORT_WARNING,
  HISTORIQUE_WRITE_BLOCKED_MESSAGE,
} from "@/lib/work-item-catalog-constants";

export type WorkItemCatalogContext = {
  id: string;
  name: string;
  slug: string;
  isHistorique: boolean;
  isProduction: boolean;
  allowBulkWrite: boolean;
};

export function isHistoriqueCatalogRef(catalog: Pick<WorkItemCatalog, "id" | "slug">): boolean {
  return catalog.id === CATALOG_HISTORIQUE_ID || catalog.slug === CATALOG_HISTORIQUE_SLUG;
}

export function isProductionCatalogRef(
  catalog: Pick<WorkItemCatalog, "id" | "slug"> & { isDefault?: boolean },
): boolean {
  return (
    catalog.id === CATALOG_ARTIPRIX_2026_ID ||
    catalog.slug === CATALOG_ARTIPRIX_SLUG ||
    catalog.isDefault === true
  );
}

export async function getWorkItemCatalogContext(
  catalogId: string,
): Promise<WorkItemCatalogContext | null> {
  const row = await prisma.workItemCatalog.findFirst({
    where: { id: catalogId, status: "active" },
    select: { id: true, name: true, slug: true, isDefault: true },
  });
  if (!row) return null;
  const isHistorique = isHistoriqueCatalogRef(row);
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    isHistorique,
    isProduction: isProductionCatalogRef(row),
    allowBulkWrite: !isHistorique,
  };
}

export async function resolveCatalogContext(
  preferredId?: string | null,
): Promise<WorkItemCatalogContext> {
  const id = await resolveActiveWorkItemCatalogId(preferredId);
  const ctx = await getWorkItemCatalogContext(id);
  if (ctx) return ctx;
  const fallback = await getWorkItemCatalogContext(await getDefaultWorkItemCatalogId());
  if (!fallback) throw new Error("Aucun catalogue ouvrage actif.");
  return fallback;
}

export type CatalogWriteCheckResult =
  | { ok: true; catalog: WorkItemCatalogContext }
  | { ok: false; error: string; requiresHistoriqueConfirmation?: boolean };

/** Vérifie si une écriture de masse est autorisée sur le catalogue actif. */
export async function checkCatalogAllowsBulkWrite(
  preferredCatalogId?: string | null,
  opts?: { confirmHistoriqueImport?: boolean },
): Promise<CatalogWriteCheckResult> {
  const catalog = await resolveCatalogContext(preferredCatalogId);
  if (catalog.allowBulkWrite) return { ok: true, catalog };
  if (opts?.confirmHistoriqueImport === true) return { ok: true, catalog };
  return {
    ok: false,
    error: HISTORIQUE_WRITE_BLOCKED_MESSAGE,
    requiresHistoriqueConfirmation: true,
  };
}

export async function requireCatalogAllowsBulkWrite(
  preferredCatalogId?: string | null,
  opts?: { confirmHistoriqueImport?: boolean },
): Promise<WorkItemCatalogContext> {
  const check = await checkCatalogAllowsBulkWrite(preferredCatalogId, opts);
  if (!check.ok) throw new Error(check.error);
  return check.catalog;
}

/** Sur la page d’import, bascule vers Artiprix 2026 si l’historique était sélectionné. */
export async function preferProductionCatalogForImportRoute(
  setCookie: (catalogId: string) => Promise<void>,
): Promise<WorkItemCatalogContext> {
  const ctx = await resolveCatalogContext();
  if (!ctx.isHistorique) return ctx;
  await setCookie(CATALOG_ARTIPRIX_2026_ID);
  const next = await getWorkItemCatalogContext(CATALOG_ARTIPRIX_2026_ID);
  if (!next) throw new Error("Catalogue Artiprix BeWork 2026 introuvable.");
  return next;
}
