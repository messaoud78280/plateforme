"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Archive,
  Building2,
  Calculator,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Package,
  Receipt,
  Search,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { HubCategoryId, HubCategoryStat, HubView } from "@/lib/ged/document-hub-ui";
import { toneSurface, type BwTone } from "@/lib/design-system/semantic-colors";

/** Conteneur largeur GED — aligné vue Catégories. */
export const GED_SHELL_CLASS =
  "mx-auto w-full max-w-[1440px] space-y-5 px-4 pb-16 pt-6 sm:px-6 lg:px-8";

const GED_CATEGORY_TONE: Record<HubCategoryId, BwTone> = {
  devis_avenants: "accent",
  factures_situations: "ok",
  plans_techniques: "navy",
  fiches_techniques: "cyan",
  commandes_bl: "watch",
  fournisseurs: "violet",
  comptes_rendus: "navy",
  photos: "violet",
  doe: "navy",
  marche_dce: "accent",
  securite_methodes: "critical",
  qualite_controles: "cyan",
  autres: "neutral",
};

export const CATEGORY_ICONS: Record<HubCategoryId, LucideIcon> = {
  devis_avenants: Calculator,
  factures_situations: Receipt,
  plans_techniques: FileSpreadsheet,
  fiches_techniques: FileText,
  commandes_bl: Package,
  fournisseurs: Building2,
  comptes_rendus: ClipboardList,
  photos: Camera,
  doe: Archive,
  marche_dce: FolderOpen,
  securite_methodes: Shield,
  qualite_controles: CheckCircle2,
  autres: FileText,
};

export function GedBackLink({
  href,
  label,
  onClick,
}: {
  href?: string;
  label: string;
  onClick?: () => void;
}) {
  const className =
    "inline-flex items-center gap-1 text-[13px] font-medium text-slate-500 transition-colors duration-150 hover:text-[#1e3a5f]";
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        <span aria-hidden>←</span> {label}
      </button>
    );
  }
  return (
    <Link href={href || "/dashboard/documents"} className={className}>
      <span aria-hidden>←</span> {label}
    </Link>
  );
}

export function GedBreadcrumb({
  items,
}: {
  items: { label: string; href?: string; onClick?: () => void }[];
}) {
  if (items.length === 0) return null;
  return (
    <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]" aria-label="Fil d’Ariane">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={`${item.label}-${i}`} className="inline-flex items-center gap-2">
            {i > 0 ? (
              <span className="text-slate-300" aria-hidden>
                /
              </span>
            ) : null}
            {last ? (
              <span className="font-semibold text-slate-900">{item.label}</span>
            ) : item.onClick ? (
              <button
                type="button"
                onClick={item.onClick}
                className="font-medium text-slate-500 transition-colors hover:text-[#1e3a5f]"
              >
                {item.label}
              </button>
            ) : item.href ? (
              <Link
                href={item.href}
                className="font-medium text-slate-500 transition-colors hover:text-[#1e3a5f]"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-slate-500">{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function GedPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 space-y-2">
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-[#1e3a5f] sm:text-[2rem]">
          {title}
        </h1>
        {subtitle ? (
          <p className="max-w-2xl text-[15px] leading-relaxed text-slate-500">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function GedSearchField({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder,
  inputRef,
  pending,
  recentOpen,
  recentQs,
  onFocusRecent,
  onPickRecent,
  onBlurRecent,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
  placeholder: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  pending?: boolean;
  recentOpen?: boolean;
  recentQs?: string[];
  onFocusRecent?: () => void;
  onPickRecent?: (s: string) => void;
  onBlurRecent?: () => void;
}) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
        aria-hidden
      />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocusRecent}
        onBlur={onBlurRecent}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmit?.();
          }
        }}
        placeholder={placeholder}
        className="h-14 w-full rounded-2xl border border-bework-navy/15 bg-[linear-gradient(180deg,#ffffff_0%,#f5f8fc_100%)] pl-12 pr-16 text-[15px] text-slate-900 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400 focus:border-bework-accent/40 focus:ring-4 focus:ring-bework-accent/15"
        aria-label="Rechercher un document"
        autoComplete="off"
      />
      {!value && !pending ? (
        <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-400 sm:inline">
          /
        </kbd>
      ) : value ? (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 transition-colors hover:text-slate-700"
          aria-label="Effacer la recherche"
        >
          ×
        </button>
      ) : pending ? (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">…</span>
      ) : null}
      {recentOpen && recentQs && recentQs.length > 0 && !value ? (
        <div className="absolute z-20 mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 shadow-lg">
          <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Recherches récentes
          </p>
          <ul>
            {recentQs.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onPickRecent?.(s)}
                  className="w-full rounded-lg px-2 py-1.5 text-left text-[14px] text-slate-700 transition-colors hover:bg-slate-50"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function GedViewTabs({
  views,
  active,
  classifyCount = 0,
  onChange,
}: {
  views: { id: HubView; label: string; count?: number }[];
  active: HubView;
  classifyCount?: number;
  onChange: (id: HubView) => void;
}) {
  return (
    <nav
      className="inline-flex max-w-full gap-0.5 overflow-x-auto rounded-xl border border-bework-navy/12 bg-bework-soft-navy/60 p-1"
      aria-label="Vues documents"
    >
      {views.map((v) => {
        const isActive = active === v.id;
        const isClassify = v.id === "classify";
        const tabLabel = isClassify ? "À classer" : v.label.replace(/\s·\s\d+$/, "");
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onChange(v.id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150",
              isActive
                ? "border border-slate-200/90 bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                : "border border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            {tabLabel}
            {isClassify && classifyCount > 0 ? (
              <span
                className={cn(
                  "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                  isActive
                    ? "bg-amber-50 text-amber-800/80"
                    : "bg-slate-200/70 text-slate-600",
                )}
              >
                {classifyCount}
              </span>
            ) : v.count && v.count > 0 ? (
              <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-bework-watch/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-[#b45309]">
                {v.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

export function GedEmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="py-14 text-center sm:py-16">
      <p className="text-lg font-medium text-slate-800">{title}</p>
      {body ? (
        <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-slate-500">{body}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function GedCategoryGrid({
  stats,
  onOpen,
  empty,
}: {
  stats: HubCategoryStat[];
  onOpen: (id: HubCategoryId) => void;
  empty?: React.ReactNode;
}) {
  if (stats.length === 0) {
    return empty ?? (
      <GedEmptyState title="Aucune catégorie" body="Les documents classés apparaîtront ici." />
    );
  }
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
      {stats.map((cat) => {
        const Icon = CATEGORY_ICONS[cat.id] ?? FileText;
        const totalCat = cat.availableCount + cat.missingCount;
        const previews = cat.previewTitles.slice(0, 3);
        const extra = Math.max(0, totalCat - previews.length);
        const availableLabel =
          cat.availableCount === 0
            ? null
            : `${cat.availableCount} document${cat.availableCount > 1 ? "s" : ""}`;
        const tone = toneSurface(GED_CATEGORY_TONE[cat.id] ?? "neutral");
        return (
          <li key={cat.id} className="h-full">
            <button
              type="button"
              onClick={() => onOpen(cat.id)}
              className={cn(
                "group flex h-full w-full flex-col rounded-2xl p-5 text-left transition-[filter,box-shadow,transform] duration-200 hover:brightness-[0.985] sm:p-6",
                tone.surface,
              )}
            >
              <div className="flex items-start gap-3">
                <span className={cn(tone.iconPill)} aria-hidden>
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-semibold leading-snug tracking-tight text-slate-900">
                    {cat.label}
                  </p>
                  {availableLabel ? (
                    <p className="mt-1.5 text-[14px] font-medium text-slate-700">{availableLabel}</p>
                  ) : (
                    <p className="mt-1.5 text-[14px] font-medium text-slate-500">
                      Aucun fichier disponible
                    </p>
                  )}
                  {cat.missingCount > 0 ? (
                    <span className="badge-cc badge-cc-watch mt-2">
                      {cat.missingCount} à récupérer
                    </span>
                  ) : null}
                </div>
              </div>
              {previews.length > 0 ? (
                <ul className="mt-5 min-h-[4.5rem] space-y-1.5 border-t border-black/5 pt-4">
                  {previews.map((titlePreview, idx) => (
                    <li
                      key={`${cat.id}-${idx}`}
                      className={cn(
                        "truncate text-[13px] text-slate-500",
                        idx === 2 && "hidden sm:block",
                      )}
                    >
                      {titlePreview}
                    </li>
                  ))}
                  {extra > 0 ? (
                    <li className="text-[12px] font-medium text-slate-400">
                      + {extra} autre{extra > 1 ? "s" : ""}
                    </li>
                  ) : previews.length === 3 ? (
                    <li className="text-[12px] font-medium text-slate-400 sm:hidden">+ 1 autre</li>
                  ) : null}
                </ul>
              ) : (
                <div className="mt-5 min-h-[4.5rem] border-t border-black/5 pt-4" />
              )}
              <div className={cn("mt-auto flex items-center gap-1 pt-5 text-[13px] font-medium", tone.text)}>
                <span>Voir les documents</span>
                <ChevronRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function GedPrimaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-full bg-[#1e3a5f] px-3.5 py-1.5 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-[#16304f] disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function GedSecondaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[13px] font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
