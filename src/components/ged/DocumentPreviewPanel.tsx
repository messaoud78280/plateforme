"use client";

import Link from "next/link";
import type { HubDocumentItem } from "@/lib/ged/document-hub-ui";
import {
  fileKindFromItem,
  formatFileSize,
  formatGedShortDate,
  hubCategoryLabel,
  originToneClass,
  sourceLineForDocument,
  typeToneClass,
} from "@/lib/ged/document-hub-ui";
import { cn } from "@/lib/cn";

function Info({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">{label}</dt>
      <dd className="mt-0.5 break-words text-[13px] text-slate-800" title={value}>
        {value}
      </dd>
    </div>
  );
}

export function DocumentPreviewPanel({
  item,
  hideProject,
  onOpen,
  onFavorite,
  onRetrieve,
  onCategorize,
  categorizeOptions,
  catBusy,
  variant = "side",
  onClose,
  extraActions,
}: {
  item: HubDocumentItem;
  hideProject?: boolean;
  onOpen: () => void;
  onFavorite?: () => void;
  onRetrieve?: () => void;
  onCategorize?: (next: string) => void;
  categorizeOptions?: { id: string; label: string }[];
  catBusy?: boolean;
  variant?: "side" | "drawer";
  onClose?: () => void;
  extraActions?: React.ReactNode;
}) {
  const missing = Boolean(item.isExpectedMissing);
  const kind = fileKindFromItem(item);
  const canPreview =
    Boolean(item.chantierFileId) && !missing && (kind === "pdf" || kind === "image");
  const source = sourceLineForDocument(item);
  const provenances = item.provenances?.filter((p) => p.label) ?? [];
  const versions = item.versions ?? [];

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col bg-white",
        variant === "side" &&
          "rounded-2xl border border-bework-navy/10 shadow-[var(--cc-shadow)]",
        variant === "drawer" && "shadow-[-8px_0_32px_rgba(15,23,42,0.12)]",
      )}
      aria-label={`Aperçu ${item.title}`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-bework-ink" title={item.title}>
            {item.title}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {missing ? (
              <span className="badge-cc badge-cc-watch">À récupérer</span>
            ) : (
              <span className={typeToneClass(item.typeLabel)}>{item.typeLabel}</span>
            )}
            {source ? <span className={originToneClass(item.origin)}>{source}</span> : null}
          </div>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-[18px] leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fermer"
          >
            ×
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {canPreview && item.chantierFileId ? (
          <div className="border-b border-slate-100 bg-slate-50">
            {kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/chantier/files/${item.chantierFileId}/preview`}
                alt=""
                className="max-h-64 w-full object-contain"
              />
            ) : (
              <iframe
                title={`Aperçu ${item.title}`}
                src={`/api/chantier/files/${item.chantierFileId}/preview`}
                className="h-64 w-full border-0"
              />
            )}
          </div>
        ) : missing ? (
          <div className="mx-5 mt-4 rounded-xl border border-bework-watch/25 bg-amber-50/70 px-3 py-3 text-[13px] text-amber-900">
            Ce document a été détecté mais n’est pas encore dans BeWork.
          </div>
        ) : (
          <div className="px-5 pt-4">
            <p className="rounded-xl bg-slate-50 px-3 py-3 text-[13px] text-slate-500">
              Aperçu indisponible pour ce type de fichier.
            </p>
          </div>
        )}

        <dl className="space-y-3 px-5 py-4">
          <Info label="Nom" value={item.title} />
          <Info label="Type" value={item.typeLabel} />
          <Info label="Catégorie" value={hubCategoryLabel(item.group)} />
          {hideProject ? null : <Info label="Chantier" value={item.projectTitle} />}
          <Info label="Client / fournisseur" value={item.companyLabel} />
          <Info label="Source" value={source || item.originLabel} />
          <Info label="Date du document" value={formatGedShortDate(item.createdAt)} />
          {item.addedAt ? (
            <Info label="Date d’ajout" value={formatGedShortDate(item.addedAt)} />
          ) : null}
          <Info label="Taille" value={formatFileSize(item.fileSize)} />
        </dl>

        {provenances.length > 0 ? (
          <div className="px-5 pb-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
              Présent dans
            </p>
            <ul className="mt-1.5 space-y-1">
              {provenances.map((p) => (
                <li key={p.key}>
                  {p.href ? (
                    <Link
                      href={p.href}
                      className="text-[13px] font-medium text-bework-navy hover:underline"
                    >
                      {p.label}
                    </Link>
                  ) : (
                    <span className="text-[13px] text-slate-700">{p.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : item.originHref || item.projectId ? (
          <div className="px-5 pb-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
              Présent dans
            </p>
            <div className="mt-1.5 space-y-1">
              {item.originHref ? (
                <Link
                  href={item.originHref}
                  className="block text-[13px] font-medium text-bework-navy hover:underline"
                >
                  {item.originActionLabel || "Voir la source"}
                </Link>
              ) : null}
              {!hideProject && item.projectId ? (
                <Link
                  href={`/dashboard/projets/${item.projectId}`}
                  className="block text-[13px] font-medium text-bework-navy hover:underline"
                >
                  Voir le chantier
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}

        {versions.length > 1 ? (
          <div className="px-5 pb-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
              Versions
            </p>
            <ul className="mt-1.5 space-y-1">
              {versions.map((v) => (
                <li key={v.id} className="text-[13px] text-slate-700">
                  {v.label} — {formatGedShortDate(v.date)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {onCategorize && categorizeOptions && item.chantierFileId && !missing ? (
          <div className="px-5 pb-4">
            <label className="block text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
              Catégoriser
              <select
                disabled={catBusy}
                defaultValue={item.group === "all" ? "autres" : item.group}
                onChange={(e) => onCategorize(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800"
              >
                {categorizeOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-3">
        {missing ? (
          <button
            type="button"
            onClick={onRetrieve}
            className="rounded-full bg-bework-watch px-4 py-2 text-[13px] font-medium text-white"
          >
            Récupérer
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpen}
            className="rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white"
          >
            Ouvrir
          </button>
        )}
        {item.chantierFileId && !missing ? (
          <a
            href={`/api/chantier/files/${item.chantierFileId}/preview?download=original`}
            className="rounded-full border border-slate-200 px-4 py-2 text-[13px] font-medium text-slate-700"
          >
            Télécharger
          </a>
        ) : null}
        {onFavorite && item.chantierFileId && !missing ? (
          <button
            type="button"
            onClick={onFavorite}
            className="rounded-full border border-slate-200 px-4 py-2 text-[13px] font-medium text-slate-700"
          >
            {item.isFavorite ? "Retirer des favoris" : "Favori"}
          </button>
        ) : null}
        {extraActions}
      </div>
    </aside>
  );
}
