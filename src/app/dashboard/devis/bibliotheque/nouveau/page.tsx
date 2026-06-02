import Link from "next/link";
import { WorkItemEditorForm } from "@/components/devis/WorkItemEditorForm";
import { WorkItemCatalogBar } from "@/components/devis/WorkItemCatalogBar";
import {
  ensureArtiprixCatalogForImportRoute,
  getWorkItemCatalogsForUi,
} from "@/app/dashboard/devis/catalog-actions";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { resolveActiveWorkItemCatalogId } from "@/lib/work-item-catalog";
import { getWorkItemCatalogContext } from "@/lib/work-item-catalog-policy";

export default async function NouveauOuvragePage() {
  await requireBeWorkDevisSession();
  await ensureArtiprixCatalogForImportRoute();

  const [catalogs, activeCatalogId] = await Promise.all([
    getWorkItemCatalogsForUi(),
    resolveActiveWorkItemCatalogId(),
  ]);
  const catalogCtx = await getWorkItemCatalogContext(activeCatalogId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 px-1">
        <Link
          href="/dashboard/devis/bibliotheque"
          className="text-sm font-semibold text-[#1d4ed8] hover:underline"
        >
          ← Bibliothèque
        </Link>
      </div>
      <header className="px-1">
        <h1 className="font-heading text-xl font-bold text-slate-900 sm:text-2xl">Nouvel ouvrage</h1>
        <p className="mt-1 text-sm text-slate-600">
          Créer une fiche ouvrage dans le catalogue actif. Les imports Artiprix génèrent un code BeWork propre ; le code
          d’origine est conservé en traçabilité.
        </p>
      </header>
      <WorkItemCatalogBar catalogs={catalogs} activeCatalogId={activeCatalogId} />
      <WorkItemEditorForm
        mode="create"
        enableStructuredPaste
        catalogIsHistorique={catalogCtx?.isHistorique ?? false}
        catalogName={catalogCtx?.name}
      />
    </div>
  );
}
