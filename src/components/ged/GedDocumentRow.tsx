"use client";

import {
  Download,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Star,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { HubDocumentItem } from "@/lib/ged/document-hub-ui";
import {
  documentResultLines,
  originToneClass,
  sourceLineForDocument,
  typeToneClass,
} from "@/lib/ged/document-hub-ui";

function FileGlyph({
  it,
  compact,
}: {
  it: HubDocumentItem;
  compact?: boolean;
}) {
  const mime = (it.mimeHint ?? "").toLowerCase();
  const name = it.title.toLowerCase();
  const kind =
    mime.includes("pdf") || name.endsWith(".pdf")
      ? "pdf"
      : mime.startsWith("image/") || /\.(png|jpe?g|webp|gif|heic)$/i.test(name)
        ? "image"
        : mime.includes("excel") || mime.includes("spreadsheet") || /\.xlsx?$/.test(name)
          ? "excel"
          : mime.includes("word") || /\.docx?$/.test(name)
            ? "word"
            : "other";
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
        "flex shrink-0 items-center justify-center rounded-lg",
        compact ? "h-7 w-7" : "h-8 w-8 rounded-xl",
        cls,
      )}
      aria-hidden
    >
      <Icon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={1.75} />
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
  density = "comfort",
  retrieveEmphasis = false,
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
  density?: "comfort" | "compact";
  retrieveEmphasis?: boolean;
}) {
  const missing = Boolean(it.isExpectedMissing);
  const lines = documentResultLines(it, { hideProject });
  const showStar = Boolean(onFavorite) && Boolean(it.chantierFileId) && !missing;
  const source = sourceLineForDocument(it);
  const compact = density === "compact";
  const sources = it.sourceCount && it.sourceCount > 1 ? it.sourceCount : 0;
  const versions = it.versionCount && it.versionCount > 1 ? it.versionCount : 0;

  const metaBadges = (
    <>
      {missing ? (
        <span className="badge-cc badge-cc-watch">À récupérer</span>
      ) : (
        <span className={typeToneClass(it.typeLabel)}>{it.typeLabel}</span>
      )}
      {source ? (
        <span className={originToneClass(it.origin)} title={source}>
          {source}
        </span>
      ) : null}
      {sources > 0 ? (
        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
          {sources} sources
        </span>
      ) : null}
      {versions > 0 ? (
        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
          {versions} versions
        </span>
      ) : null}
    </>
  );

  if (layout === "cards") {
    return (
      <li>
        <div
          className={cn(
            "flex h-full flex-col gap-2.5 rounded-2xl border border-bework-navy/10 bg-white p-3.5 shadow-[var(--cc-shadow)] transition hover:-translate-y-0.5",
            compact && "gap-2 p-3",
            missing && "border-bework-watch/30 bg-amber-50/40",
            selected && "ring-2 ring-bework-accent/30",
          )}
        >
          <div className="flex min-w-0 items-start gap-2.5">
            {onToggleSelect ? (
              <input
                type="checkbox"
                checked={Boolean(selected)}
                onChange={onToggleSelect}
                className="mt-1.5 h-4 w-4 rounded border-slate-300"
                aria-label={`Sélectionner ${it.title}`}
              />
            ) : null}
            <button type="button" className="min-w-0 flex-1 text-left" onClick={onSelectRow ?? onOpenDetails}>
              <div className="flex min-w-0 items-start gap-2.5">
                <FileGlyph it={it} compact={compact} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-bework-ink" title={it.title}>
                    {it.title}
                  </p>
                  <p className="mt-0.5 truncate text-[12px] text-bework-muted" title={lines.placeLine}>
                    {lines.placeLine || (missing ? "Pièce attendue" : it.typeLabel)}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">{metaBadges}</div>
                </div>
              </div>
            </button>
          </div>
          <div className="flex items-center justify-end gap-1">
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
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium",
                missing
                  ? retrieveEmphasis
                    ? "bg-bework-watch text-white"
                    : "border border-bework-watch/40 bg-white text-[#b45309] hover:bg-bework-watch hover:text-white"
                  : "text-bework-navy hover:bg-bework-soft-navy",
              )}
            >
              {missing ? (
                <>
                  <Download className="h-3 w-3" strokeWidth={2} />
                  Récupérer
                </>
              ) : (
                "Ouvrir"
              )}
            </button>
            <button
              type="button"
              onClick={onOpenDetails}
              className="rounded-lg px-2 py-1 text-[13px] font-medium text-slate-400 hover:bg-slate-100"
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
          "group flex flex-col gap-1.5 rounded-xl px-2.5 transition-colors sm:flex-row sm:items-center sm:gap-3",
          compact ? "py-1.5" : "py-2",
          "hover:bg-bework-soft-navy/50",
          missing && "bg-amber-50/40",
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
          <div className="flex min-w-0 items-center gap-2.5">
            {onToggleSelect ? (
              <input
                type="checkbox"
                checked={Boolean(selected)}
                onChange={onToggleSelect}
                onClick={(e) => e.stopPropagation()}
                className="h-4 w-4 rounded border-slate-300"
                aria-label={`Sélectionner ${it.title}`}
              />
            ) : null}
            <FileGlyph it={it} compact={compact} />
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <p
                  className={cn(
                    "min-w-0 max-w-full truncate font-semibold text-bework-ink",
                    compact ? "text-[13px]" : "text-[14px]",
                  )}
                  title={it.title}
                >
                  {it.title}
                </p>
                {metaBadges}
              </div>
              <p
                className="mt-0.5 truncate text-[12px] text-bework-muted"
                title={[lines.placeLine, lines.sourceLine].filter(Boolean).join(" · ")}
              >
                {[lines.placeLine, lines.sourceLine.replace(`${source} · `, "")].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
        </button>
        <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-1.5">
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
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors",
              missing
                ? retrieveEmphasis
                  ? "bg-bework-watch text-white hover:opacity-90"
                  : "border border-bework-watch/35 bg-transparent text-[#b45309] hover:bg-bework-watch hover:text-white"
                : "text-bework-navy hover:bg-bework-soft-navy",
            )}
          >
            {missing ? (
              <>
                <Download className="h-3 w-3" strokeWidth={2} />
                Récupérer
              </>
            ) : (
              "Ouvrir"
            )}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails();
            }}
            className="rounded-lg px-1.5 py-1 text-[13px] font-medium text-slate-400 opacity-100 hover:bg-slate-100 hover:text-slate-700 sm:opacity-0 sm:group-hover:opacity-100"
            aria-label="Plus d’actions"
          >
            ⋯
          </button>
        </div>
      </div>
    </li>
  );
}
