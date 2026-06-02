import Link from "next/link";
import { DcePricingFillPanel } from "@/components/devis/DcePricingFillPanel";
import { WorkItemCatalogBar } from "@/components/devis/WorkItemCatalogBar";
import { listDceFillSessions } from "@/app/dashboard/devis/dce-fill-actions";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { listWorkItemCatalogs, resolveActiveWorkItemCatalogId } from "@/lib/work-item-catalog";
export default async function DceRemplissagePage() {
  await requireBeWorkDevisSession();
  const [catalogs, activeCatalogId, sessions] = await Promise.all([
    listWorkItemCatalogs(),
    resolveActiveWorkItemCatalogId(),
    listDceFillSessions(),
  ]);

  return (
    <div className="space-y-8 px-1">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-800/80">Marchés publics</p>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
            Remplir BPU / DPGF depuis un DCE
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
            Extraction des lignes du dossier de consultation, rapprochement avec la bibliothèque active, puis export vers
            vos documents de chiffrage. Les anciennes bibliothèques restent disponibles sans mélange de codes.
          </p>
        </div>
        <Link
          href="/dashboard/devis/bibliotheque"
          className="inline-flex w-fit rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
        >
          ← Bibliothèque
        </Link>
      </div>

      <WorkItemCatalogBar catalogs={catalogs} activeCatalogId={activeCatalogId} />

      <DcePricingFillPanel />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-slate-900">Sessions récentes</h2>
        {sessions.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">Aucune extraction pour ce catalogue.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-[11px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Titre</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Lignes</th>
                  <th className="py-2 pr-3">Rapprochées</th>
                  <th className="py-2 pr-3">Statut</th>
                  <th className="py-2">Fichier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2 font-medium text-slate-900">{s.title}</td>
                    <td className="py-2 uppercase text-xs text-slate-600">{s.targetDocType}</td>
                    <td className="py-2 tabular-nums">{s.lineCount}</td>
                    <td className="py-2 tabular-nums text-emerald-700">{s.matchedCount}</td>
                    <td className="py-2 text-xs">{s.status}</td>
                    <td className="py-2 text-xs text-slate-600">{s.dceFileName ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 text-sm text-slate-700">
        <h3 className="font-semibold text-slate-900">Parcours recommandé</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Sélectionner <strong>Artiprix BeWork 2026</strong> (bibliothèque vide ou import Artiprix).</li>
          <li>Importer vos ouvrages Artiprix (collage structuré) avec codification dès l&apos;import.</li>
          <li>Extraire le DPGF/BPU du DCE ici et vérifier les rapprochements.</li>
          <li>Créer le devis / document dans <strong>Documents</strong> en s&apos;appuyant sur cette bibliothèque.</li>
        </ol>
      </section>
    </div>
  );
}
