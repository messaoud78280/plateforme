"use client";

import {
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Star,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { HubDocumentItem } from "@/lib/ged/document-hub-ui";
import {
  documentResultLines,
  fileKindFromItem,
  originToneClass,
  sourceLineForDocument,
} from "@/lib/ged/document-hub-ui";

function FileGlyph({ it }: { it: HubDocumentItem }) {
  const kind = fileKindFromItem(it);
  const cls =
    kind === "pdf"
      ? "bg-bework-critical/10 text-bework-critical"
      : kind === "image"
        ? "bg-bework-intel/10 text-bework-intel"
        : kind === "excel"
          ? "bg-bework-ok/12 text-bework-ok"
          : kind === "word"
            ? "bg-bework-accent/12 text-bework-accent"
            : "bg-bework-navy/8 text-bework-navy";
  const Icon = kind === "image" ? ImageIcon : kind === "excel" ? FileSpreadsheet : FileText;
  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
        cls,
      )}
      aria-hidden
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} />
    </span>
  );
}

export function GedDocumentRow({
  it,
  onOpenDetails,
  onOpenFile,
  onFavorite,
  favBusy,
  hideProject,
  classifySlot,
  selected,
  onToggleSelect,
  layout = "list",
  onSelectRow,
}: {
  it: HubDocumentItem;
  onOpenDetails: () => void;
  onOpenFile: () => void;
  onFavorite?: () => void;
  favBusy?: boolean;
  hideProject?: boolean;
  classifySlot?: React.ReactNode;
  selected?: boolean;
  onToggleSelect?: () => void;
  layout?: "list" | "cards";
  onSelectRow?: () => void;
}) {
  const missing = Boolean(it.isExpectedMissing);
  const lines = documentResultLines(it, { hideProject });
  const showStar = Boolean(onFavorite) && Boolean(it.chantierFileId) && !missing;
  const source = sourceLineForDocument(it);

  if (layout === "cards") {
    return (
      <li>
        <div
          className={cn(
            "flex h-full flex-col gap-3 rounded-2xl border border-bework-navy/10 bg-white p-4 shadow-[var(--cc-shadow)] transition hover:-translate-y-0.5",
            missing && "border-bework-watch/30 bg-amber-50/40",
            selected && "ring-2 ring-bework-accent/30",
          )}
        >
          <div className="flex min-w-0 items-start gap-3">
            {onToggleSelect ? (
              <input
                type="checkbox"
                checked={Boolean(selected)}
                onChange={onToggleSelect}
                className="mt-2 h-4 w-4 rounded border-slate-300"
                aria-label={`Sélectionner ${it.title}`}
              />
            ) : null}
            <button type="button" className="min-w-0 flex-1 text-left" onClick={onSelectRow ?? onOpenDetails}>
              <div className="flex min-w-0 items-start gap-3">
                <FileGlyph it={it} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-bework-ink">{it.title}</p>
                  <p className="mt-0.5 truncate text-[12px] text-bework-muted sm:text-[13px]">
                    {missing ? "À récupérer" : it.typeLabel}
                    {lines.placeLine ? ` · ${lines.placeLine}` : ""}
                  </p>
                  {source ? (
                    <span className={cn("mt-1.5 inline-flex", originToneClass(it.origin))}>{source}</span>
                  ) : null}
                </div>
              </div>
            </button>
          </div>
          <div className="flex items-center justify-end gap-1.5">
            {showStar ? (
              <button
                type="button"
                onClick={onFavorite}
                disabled={favBusy}
                className={cn(
                  "rounded-lg p-1.5",
                  it.isFavorite ? "text-amber-500" : "text-slate-300 hover:text-amber-400",
                )}
                aria-label={it.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              >
                <Star className="h-4 w-4" fill={it.isFavorite ? "currentColor" : "none"} />
              </button>
            ) : null}
            <button
              type="button"
              onClick={onOpenFile}
              className={cn(
                "rounded-full px-3 py-1.5 text-[13px] font-medium",
                missing ? "bg-bework-watch text-white" : "text-bework-navy hover:bg-bework-soft-navy",
              )}
            >
              {missing ? "Récupérer" : "Ouvrir"}
            </button>
            <button
              type="button"
              onClick={onOpenDetails}
              className="rounded-lg px-2 py-1.5 text-[13px] font-medium text-slate-400 hover:bg-slate-100"
              aria-label="Plus d’actions"
            >
              ⋯
            </button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li>
      <div
        className={cn(
          "group flex flex-col gap-2 rounded-xl px-3 py-3 transition-colors sm:flex-row sm:items-center sm:gap-4",
          "hover:bg-bework-soft-navy/50",
          missing && "bg-amber-50/50",
          selected && "bg-bework-soft-accent/60",
        )}
      >
        <button
          type="button"
          onClick={onSelectRow ?? onOpenFile}
          onContextMenu={(e) => {
            e.preventDefault();
            onOpenDetails();
          }}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex min-w-0 items-start gap-3">
            {onToggleSelect ? (
              <input
                type="checkbox"
                checked={Boolean(selected)}
                onChange={onToggleSelect}
                onClick={(e) => e.stopPropagation()}
                className="mt-2 h-4 w-4 rounded border-slate-300"
                aria-label={`Sélectionner ${it.title}`}
              />
            ) : (
              <FileGlyph it={it} />
            )}
            {onToggleSelect ? <FileGlyph it={it} /> : null}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-[15px] font-semibold text-bework-ink">{it.title}</p>
                {missing ? (
                  <span className="badge-cc badge-cc-watch">À récupérer</span>
                ) : (
                  <span className="badge-cc badge-cc-info">{it.typeLabel}</span>
                )}
                {source ? (
                  <span className={originToneClass(it.origin)}>{source}</span>
                ) : null}
              </div>
              <p className="mt-0.5 truncate text-[12px] text-bework-muted sm:text-[13px]">
                {lines.placeLine || (missing ? "Pièce attendue" : it.typeLabel)}
              </p>
              <p className="mt-0.5 truncate text-[12px] text-slate-500">
                {source ? `${source} · ` : ""}
                {lines.sourceLine.replace(`${source} · `, "")}
              </p>
            </div>
          </div>
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
                "rounded-lg p-1.5 transition-colors",
                it.isFavorite ? "text-amber-500" : "text-slate-300 hover:text-amber-400",
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
          {classifySlot ? <div onClick={(e) => e.stopPropagation()}>{classifySlot}</div> : null}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenFile();
            }}
            className={cn(
              "rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
              missing
                ? "bg-bework-watch text-white hover:opacity-90"
                : "text-bework-navy hover:bg-bework-soft-navy",
            )}
          >
            {missing ? "Récupérer" : "Ouvrir"}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails();
            }}
            className="rounded-lg px-2 py-1.5 text-[13px] font-medium text-slate-400 opacity-100 hover:bg-slate-100 hover:text-slate-700 sm:opacity-0 sm:group-hover:opacity-100"
            aria-label="Plus d’actions"
          >
            ⋯
          </button>
        </div>
      </div>
    </li>
  );
}
