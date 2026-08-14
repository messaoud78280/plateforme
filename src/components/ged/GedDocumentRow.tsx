"use client";

import { cn } from "@/lib/cn";
import type { HubDocumentItem } from "@/lib/ged/document-hub-ui";
import { documentResultLines } from "@/lib/ged/document-hub-ui";

export function GedDocumentRow({
  it,
  onOpenDetails,
  onOpenFile,
  onFavorite,
  favBusy,
  hideProject,
}: {
  it: HubDocumentItem;
  onOpenDetails: () => void;
  onOpenFile: () => void;
  onFavorite?: () => void;
  favBusy?: boolean;
  hideProject?: boolean;
}) {
  const missing = Boolean(it.isExpectedMissing);
  const lines = documentResultLines(it, { hideProject });
  const showStar = Boolean(onFavorite) && Boolean(it.chantierFileId) && !missing;

  return (
    <li>
      <div className="group flex flex-col gap-1.5 py-2.5 hover:bg-slate-50/80 sm:flex-row sm:items-center sm:gap-4">
        <button type="button" onClick={onOpenDetails} className="min-w-0 flex-1 text-left">
          <p className="truncate text-[14px] font-medium text-slate-900">{it.title}</p>
          <p className="mt-0.5 truncate text-[12px] text-slate-500">
            {lines.typeLine}
            {lines.placeLine ? ` · ${lines.placeLine}` : ""}
          </p>
          {lines.sourceLine ? (
            <p className="mt-0.5 truncate text-[12px] text-slate-400">{lines.sourceLine}</p>
          ) : null}
        </button>
        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
          {showStar ? (
            <button
              type="button"
              onClick={onFavorite}
              disabled={favBusy}
              className={cn(
                "rounded-md px-1.5 py-1 text-[15px] leading-none",
                it.isFavorite ? "text-amber-500" : "text-slate-300 hover:text-amber-400",
              )}
              aria-label={it.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              aria-pressed={it.isFavorite}
            >
              ★
            </button>
          ) : null}
          <button
            type="button"
            onClick={onOpenFile}
            className="rounded-full px-2.5 py-1 text-[13px] font-medium text-[#1e3a5f] hover:bg-[#1e3a5f]/5"
          >
            {missing ? "Ajouter le document" : "Ouvrir"}
          </button>
        </div>
      </div>
    </li>
  );
}
