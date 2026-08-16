"use client";

import { Star } from "lucide-react";
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
  classifySlot,
}: {
  it: HubDocumentItem;
  onOpenDetails: () => void;
  onOpenFile: () => void;
  onFavorite?: () => void;
  favBusy?: boolean;
  hideProject?: boolean;
  /** Menu Classer (vue À classer) — réel uniquement. */
  classifySlot?: React.ReactNode;
}) {
  const missing = Boolean(it.isExpectedMissing);
  const lines = documentResultLines(it, { hideProject });
  const showStar = Boolean(onFavorite) && Boolean(it.chantierFileId) && !missing;

  return (
    <li>
      <div
        className={cn(
          "group flex flex-col gap-2 rounded-xl px-3 py-3 transition-colors duration-150 sm:flex-row sm:items-center sm:gap-4",
          "hover:bg-slate-50/90",
          missing && "bg-amber-50/30",
        )}
      >
        <button
          type="button"
          onClick={missing ? onOpenFile : onOpenFile}
          onContextMenu={(e) => {
            e.preventDefault();
            onOpenDetails();
          }}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[14px] font-semibold text-slate-900 sm:text-[15px]">
              {it.title}
            </p>
            {missing ? (
              <span className="inline-flex shrink-0 items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800/90 ring-1 ring-amber-100/80">
                À récupérer
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-[12px] text-slate-500 sm:text-[13px]">
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
              onClick={(e) => {
                e.stopPropagation();
                onFavorite?.();
              }}
              disabled={favBusy}
              className={cn(
                "rounded-lg p-1.5 transition-colors duration-150",
                it.isFavorite
                  ? "text-[#1e3a5f]"
                  : "text-slate-300 hover:text-slate-500",
              )}
              aria-label={it.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              aria-pressed={it.isFavorite}
            >
              <Star
                className="h-4 w-4"
                strokeWidth={1.75}
                fill={it.isFavorite ? "currentColor" : "none"}
                aria-hidden
              />
            </button>
          ) : null}
          {classifySlot ? (
            <div onClick={(e) => e.stopPropagation()}>{classifySlot}</div>
          ) : null}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenFile();
            }}
            className={cn(
              "rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors duration-150",
              missing
                ? "bg-[#1e3a5f] text-white hover:bg-[#16304f]"
                : "text-[#1e3a5f] hover:bg-[#1e3a5f]/5",
            )}
          >
            {missing ? "Ajouter le document" : "Ouvrir"}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails();
            }}
            className="rounded-lg px-2 py-1.5 text-[13px] font-medium text-slate-400 opacity-0 transition-opacity duration-150 hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100 focus:opacity-100"
            aria-label="Détails"
          >
            …
          </button>
        </div>
      </div>
    </li>
  );
}
