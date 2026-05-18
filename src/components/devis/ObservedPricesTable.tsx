"use client";

import { useCallback, useEffect, useState } from "react";
import { SOURCE_TYPE_LABELS } from "@/lib/be-work-devis-labels";
import { formatDateFr, formatEurFr } from "@/lib/be-work-devis-format";
import {
  getObservedPriceTableLabel,
  resolvePriceEntryDetail,
  type ObservedPriceRowSerialized,
  type PriceEntryDetailView,
  type WorkItemContextSerialized,
} from "@/lib/be-work-devis-price-entry-detail";

type Props = {
  workItemId: string;
  workItem: WorkItemContextSerialized;
  entries: ObservedPriceRowSerialized[];
  deletePriceEntry: (formData: FormData) => Promise<void>;
};

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (value == null || value === "") return null;
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-900">{value}</dd>
    </div>
  );
}

function PriceEntryDetailPanel({
  detail,
  onClose,
  onDelete,
}: {
  detail: PriceEntryDetailView;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyDesignation = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(detail.variantDesignation);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [detail.variantDesignation]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <button
        type="button"
        aria-label="Fermer"
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
        role="dialog"
        aria-labelledby="price-detail-title"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-[#1e3a5f]">Prix observé</p>
            <h3 id="price-detail-title" className="mt-1 font-heading text-lg font-bold leading-snug text-slate-900">
              Détail de la variante
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Fermer
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <section className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Désignation complète</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-900">{detail.variantDesignation}</p>
          </section>

          <dl className="mt-5 space-y-4">
            <DetailRow label="Code source" value={detail.codeSource} />
            <DetailRow label="Famille" value={detail.famille} />
            <DetailRow label="Sous-famille" value={detail.sousFamille} />
            <DetailRow label="Fiche mère rattachée" value={detail.ficheMere} />
            <DetailRow label="Unité" value={detail.unite} />
            <DetailRow label="Largeur" value={detail.largeur ? `${detail.largeur} m` : null} />
            <DetailRow label="Profondeur" value={detail.profondeur ? `${detail.profondeur} m` : null} />
            <DetailRow label="Classe de terre" value={detail.classeTerre} />
            <DetailRow label="Quantité de référence" value={detail.quantiteReference} />
            <DetailRow label="Prix HT (PU)" value={formatEurFr(detail.unitPriceHT)} />
            <DetailRow label="TVA" value={`${detail.vatRate} %`} />
            <DetailRow label="Prix TTC (PU)" value={formatEurFr(detail.unitPriceTTC)} />
            {detail.totalHT != null ? <DetailRow label="Total HT" value={formatEurFr(detail.totalHT)} /> : null}
            {detail.totalTTC != null ? <DetailRow label="Total TTC" value={formatEurFr(detail.totalTTC)} /> : null}
            <DetailRow label="Date d'import" value={formatDateFr(detail.dateImport)} />
            {detail.dateObserved ? (
              <DetailRow label="Date observée" value={formatDateFr(detail.dateObserved)} />
            ) : null}
            <DetailRow label="Type de source" value={detail.sourceTypeLabel} />
            <DetailRow label="Fiabilité" value={`${detail.reliabilityScore} / 5`} />
            {detail.priceSourceName ? (
              <DetailRow label="Source liée" value={detail.priceSourceName} />
            ) : null}
            {detail.commentaire ? <DetailRow label="Commentaire" value={detail.commentaire} /> : null}
            {detail.tags.length > 0 ? (
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Tags</dt>
                <dd className="mt-2 flex flex-wrap gap-1.5">
                  {detail.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-800"
                    >
                      {tag}
                    </span>
                  ))}
                </dd>
              </div>
            ) : null}
            {detail.notes ? <DetailRow label="Notes techniques" value={detail.notes} /> : null}
          </dl>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={() => void copyDesignation()}
            className="rounded-lg border border-[#1e3a5f]/40 bg-white px-4 py-2 text-sm font-semibold text-[#1e3a5f] hover:bg-slate-50"
          >
            {copied ? "Copié !" : "Copier la désignation"}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100"
          >
            Supprimer
          </button>
        </div>
      </aside>
    </>
  );
}

export function ObservedPricesTable({ workItemId, workItem, entries, deletePriceEntry }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedEntry = entries.find((e) => e.id === selectedId) ?? null;
  const detail = selectedEntry ? resolvePriceEntryDetail(selectedEntry, workItem) : null;

  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    const fd = new FormData();
    fd.set("id", selectedId);
    fd.set("workItemId", workItemId);
    void deletePriceEntry(fd);
    setSelectedId(null);
  }, [selectedId, workItemId, deletePriceEntry]);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-[920px] w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-600">
            <tr>
              <th className="px-3 py-2">Source / variante</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Qté</th>
              <th className="px-3 py-2">PU HT</th>
              <th className="px-3 py-2">Total HT</th>
              <th className="px-3 py-2">TVA %</th>
              <th className="px-3 py-2">TTC</th>
              <th className="px-3 py-2">Total TTC</th>
              <th className="px-3 py-2">Dept.</th>
              <th className="px-3 py-2">Fiab.</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-3 py-8 text-center text-slate-500">
                  Aucun prix enregistré pour cet ouvrage.
                </td>
              </tr>
            ) : (
              entries.map((pe) => {
                const label = getObservedPriceTableLabel(pe);
                const isSelected = selectedId === pe.id;
                return (
                  <tr
                    key={pe.id}
                    className={`cursor-pointer transition-colors hover:bg-[#1e3a5f]/5 ${isSelected ? "bg-[#1e3a5f]/8" : ""}`}
                    onClick={() => setSelectedId(pe.id)}
                    title={label}
                  >
                    <td className="max-w-[220px] px-3 py-2">
                      <span className="block truncate font-medium text-slate-900">{label}</span>
                      {pe.priceSourceName ? (
                        <span className="mt-0.5 block truncate text-xs font-normal text-slate-500">
                          Lié : {pe.priceSourceName}
                        </span>
                      ) : null}
                      {pe.variantDesignation && pe.sourceName !== label ? (
                        <span className="mt-0.5 block truncate font-mono text-[10px] text-slate-400">
                          Réf. {pe.sourceName}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">{SOURCE_TYPE_LABELS[pe.sourceType]}</td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">
                      {pe.quantity != null ? String(pe.quantity) : "—"}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{formatEurFr(pe.unitPriceHT)}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {pe.totalHT != null ? formatEurFr(pe.totalHT) : "—"}
                    </td>
                    <td className="px-3 py-2">{pe.vatRate} %</td>
                    <td className="px-3 py-2 font-mono text-xs">{formatEurFr(pe.unitPriceTTC)}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {pe.totalTTC != null ? formatEurFr(pe.totalTTC) : "—"}
                    </td>
                    <td className="px-3 py-2">{pe.department ?? "—"}</td>
                    <td className="px-3 py-2">{pe.reliabilityScore}</td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {formatDateFr(pe.dateObserved ?? pe.createdAt)}
                    </td>
                    <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <form action={deletePriceEntry} className="inline">
                        <input type="hidden" name="id" value={pe.id} />
                        <input type="hidden" name="workItemId" value={workItemId} />
                        <button
                          type="submit"
                          className="text-xs font-semibold text-red-700 hover:underline"
                          title="Supprimer ce prix"
                        >
                          Supprimer
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">Cliquez sur une ligne pour ouvrir le détail complet de la variante.</p>

      {detail ? (
        <PriceEntryDetailPanel detail={detail} onClose={() => setSelectedId(null)} onDelete={handleDelete} />
      ) : null}
    </>
  );
}
