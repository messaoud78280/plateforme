import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import {
  getLibraryHubStats,
  listLaborResources,
  listMaterials,
  listWorkItems,
} from "@/lib/commercial/library";
import {
  LibraryHub,
  type LibraryHubRow,
} from "@/components/commercial/LibraryHub";

export const dynamic = "force-dynamic";

export default async function BibliothequePage() {
  const session = await requireCommercialSession(
    "/dashboard/devis-facturation/bibliotheque",
  );
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) return null;

  const [activeItems, archivedItems, stats, materials, labor] = await Promise.all([
    listWorkItems(orgId, { take: 300, active: true }),
    listWorkItems(orgId, { take: 100, active: false }),
    getLibraryHubStats(orgId),
    listMaterials(orgId, { take: 80 }),
    listLaborResources(orgId),
  ]);

  const rows: LibraryHubRow[] = [...activeItems, ...archivedItems].map((w) => ({
    id: w.id,
    name: w.name,
    reference: w.reference,
    family: w.family,
    subFamily: w.subFamily,
    saleUnit: w.saleUnit,
    unitCostHt: w.unitCostHt,
    unitSellHt: w.unitSellHt,
    marginPercent: w.marginPercent,
    kind: w.kind,
    isActive: w.isActive,
    isFavorite: Boolean((w as { isFavorite?: boolean }).isFavorite),
    needsPriceRecalc: w.needsPriceRecalc,
    quoteLineCount: w.quoteLineCount,
    updatedAt: w.updatedAt,
    description: w.description,
  }));

  return (
    <LibraryHub
      initialItems={rows}
      stats={stats}
      materialsPreview={materials.map((m) => ({
        id: m.id,
        name: m.name,
        unit: m.unit,
        family: m.family,
        currentPriceHt: m.currentPriceHt,
        supplierName: m.supplierName,
        preferredSupplierName: m.preferredSupplierName ?? m.supplierName,
        variationPercent: m.variationPercent ?? null,
        needsPriceReview: Boolean(m.needsPriceReview),
        updatedAt: m.updatedAt,
        referencePriceUpdatedAt: m.referencePriceUpdatedAt ?? null,
      }))}
      laborPreview={labor.slice(0, 80).map((l) => ({
        id: l.id,
        name: l.name,
        hourlyCostHt: l.hourlyCostHt,
        loadedCostHt: l.loadedCostHt,
      }))}
    />
  );
}
