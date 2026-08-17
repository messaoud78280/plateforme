"use client";

import { HUB_CATEGORY_DEFS } from "@/lib/ged/document-hub-ui";

export function DocumentSelectionBar({
  count,
  totalOnPage,
  missingView,
  canCategorize,
  onSelectAll,
  onClear,
  onFavorite,
  onCategorize,
  onDownload,
  onRetrieve,
  retrieveDisabled,
}: {
  count: number;
  totalOnPage: number;
  missingView?: boolean;
  canCategorize?: boolean;
  onSelectAll: () => void;
  onClear: () => void;
  onFavorite?: () => void;
  onCategorize?: (categoryId: string) => void;
  onDownload?: () => void;
  onRetrieve?: () => void;
  retrieveDisabled?: boolean;
}) {
  if (count === 0 && !missingView) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-bework-navy/12 bg-bework-soft-navy/50 px-3 py-2">
      <span className="text-[13px] font-medium text-bework-navy">
        {count} sélectionné{count > 1 ? "s" : ""}
      </span>
      <button
        type="button"
        onClick={onSelectAll}
        className="text-[12px] font-medium text-slate-600 hover:underline"
      >
        {count === totalOnPage ? "Tout désélectionner" : "Tout sélectionner"}
      </button>
      {count > 0 ? (
        <button type="button" onClick={onClear} className="text-[12px] font-medium text-slate-500 hover:underline">
          Annuler
        </button>
      ) : null}
      <span className="mx-1 hidden h-4 w-px bg-slate-200 sm:inline" />
      {onFavorite && count > 0 ? (
        <button
          type="button"
          onClick={onFavorite}
          className="rounded-full bg-white px-3 py-1 text-[12px] font-medium text-slate-700 shadow-sm"
        >
          Favoris
        </button>
      ) : null}
      {canCategorize && onCategorize && count > 0 ? (
        <label className="inline-flex items-center gap-1 text-[12px] text-slate-500">
          Catégoriser
          <select
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value;
              if (v) onCategorize(v);
              e.target.value = "";
            }}
            className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[12px] text-slate-700"
          >
            <option value="">Type…</option>
            {HUB_CATEGORY_DEFS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {onDownload && count > 0 ? (
        <button
          type="button"
          onClick={onDownload}
          className="rounded-full bg-white px-3 py-1 text-[12px] font-medium text-slate-700 shadow-sm"
        >
          Télécharger
        </button>
      ) : null}
      {onRetrieve ? (
        <button
          type="button"
          onClick={onRetrieve}
          disabled={retrieveDisabled || count === 0}
          className="rounded-full bg-bework-watch px-3 py-1 text-[12px] font-medium text-white disabled:opacity-40"
        >
          Récupérer la sélection
        </button>
      ) : null}
    </div>
  );
}
