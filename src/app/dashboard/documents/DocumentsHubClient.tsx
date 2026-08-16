"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DocumentPreviewModal, type DocumentPreviewItem } from "@/components/documents/DocumentPreviewModal";
import { GedDocumentRow } from "@/components/ged/GedDocumentRow";
import type {
  HubCategoryStat,
  HubDocumentItem,
  HubGroup,
  HubSort,
  HubView,
} from "@/lib/ged/document-hub-ui";
import {
  HUB_CATEGORY_DEFS,
  HUB_DATE_FILTERS,
  HUB_DOC_TYPES,
  HUB_ORIGIN_FILTERS,
  formatGedShortDate,
  hubCategoryLabel,
  hubEmptyCopy,
  recentDayLabel,
  visibleHubViews,
} from "@/lib/ged/document-hub-ui";
import {
  CATEGORY_TO_DOCUMENT_TYPE,
  type HubCategoryId,
} from "@/lib/ged/hub-categories";
import { cn } from "@/lib/cn";
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

const SORT_OPTIONS: { id: HubSort; label: string }[] = [
  { id: "recent", label: "Plus récents" },
  { id: "oldest", label: "Plus anciens" },
  { id: "name", label: "Nom A-Z" },
];

const CATEGORY_ICONS: Record<HubCategoryId, LucideIcon> = {
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

const RECENT_Q_KEY = "bework.ged.recentSearches";

function loadRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_Q_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string").slice(0, 6) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(q: string) {
  const t = q.trim();
  if (t.length < 2) return;
  try {
    const prev = loadRecentSearches().filter((s) => s.toLowerCase() !== t.toLowerCase());
    localStorage.setItem(RECENT_Q_KEY, JSON.stringify([t, ...prev].slice(0, 6)));
  } catch {
    /* ignore */
  }
}

export function DocumentsHubClient({
  items,
  total,
  page,
  pageSize,
  group,
  view,
  search,
  sort,
  projectId,
  origin,
  docType,
  company,
  since,
  views,
  projects,
  companies,
  classifyCount,
  categoryStats,
  canUploadChantier,
  personType,
  permissionProfile,
  hostCompany,
  hideProjectFilter,
  lockedProjectTitle,
}: {
  items: HubDocumentItem[];
  total: number;
  page: number;
  pageSize: number;
  group: HubGroup;
  view: HubView;
  search: string;
  sort: HubSort;
  projectId: string;
  origin: string;
  docType: string;
  company: string;
  since: string;
  views: { id: HubView; label: string }[];
  groups?: { id: HubGroup; label: string }[];
  projects: { id: string; title: string }[];
  companies: string[];
  classifyCount: number;
  categoryStats?: HubCategoryStat[];
  canUploadChantier: boolean;
  personType?: string | null;
  permissionProfile?: string | null;
  hostCompany?: string | null;
  hideProjectFilter?: boolean;
  lockedProjectTitle?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(search);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);
  const [recentQs, setRecentQs] = useState<string[]>([]);
  const [drawer, setDrawer] = useState<HubDocumentItem | null>(null);
  const [preview, setPreview] = useState<DocumentPreviewItem | null>(null);
  const [favBusy, setFavBusy] = useState<string | null>(null);
  const [catBusy, setCatBusy] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const isSupplier =
    personType === "SUPPLIER" || permissionProfile === "FOURNISSEUR";
  const isClient =
    personType === "CLIENT_EXT" || permissionProfile === "CLIENT";
  const external = isSupplier || isClient;
  const hideProject = Boolean(hideProjectFilter);

  const showCategoryCards =
    view === "categories" && group === "all" && !search.trim() && (categoryStats?.length ?? 0) >= 0;
  const inCategory = view === "categories" && group !== "all";

  const hasFilters = Boolean(
    projectId || origin || docType || company || since || (group !== "all" && view !== "categories"),
  );
  const empty = hubEmptyCopy({
    group,
    view,
    personType,
    permissionProfile,
    hostCompany,
    search,
    hasFilters,
  });
  const shownViews = visibleHubViews(views, classifyCount);

  useEffect(() => {
    if (document.activeElement === searchRef.current) return;
    setQ(search);
  }, [search]);

  useEffect(() => {
    if (q === search) return;
    const t = window.setTimeout(() => {
      go({ q, page: "1" });
      saveRecentSearch(q);
    }, 280);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (preview) {
        setPreview(null);
        return;
      }
      if (drawer) {
        setDrawer(null);
        return;
      }
      if (recentOpen) setRecentOpen(false);
      if (addOpen) setAddOpen(false);
      if (filtersOpen) setFiltersOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer, preview, recentOpen, addOpen, filtersOpen]);

  function go(updates: Record<string, string>) {
    const p = new URLSearchParams();
    const nextView = updates.view ?? view;
    const nextGroup = updates.group ?? group;
    const nextQ = updates.q !== undefined ? updates.q : search;
    const nextSort = updates.sort ?? sort;
    const nextPage = updates.page ?? "1";
    const nextProject = hideProject
      ? projectId
      : updates.projectId !== undefined
        ? updates.projectId
        : projectId;
    const nextOrigin = updates.origin !== undefined ? updates.origin : origin;
    const nextType = updates.docType !== undefined ? updates.docType : docType;
    const nextCompany = updates.company !== undefined ? updates.company : company;
    const nextSince = updates.since !== undefined ? updates.since : since;
    if (nextView && nextView !== "all") p.set("view", nextView);
    if (nextGroup && nextGroup !== "all") p.set("group", nextGroup);
    if (nextQ) p.set("q", nextQ);
    if (nextSort && nextSort !== "recent") p.set("sort", nextSort);
    if (nextProject) p.set("projectId", nextProject);
    if (nextOrigin) p.set("origin", nextOrigin);
    if (nextType) p.set("docType", nextType);
    if (nextCompany) p.set("company", nextCompany);
    if (nextSince) p.set("since", nextSince);
    if (nextPage !== "1") p.set("page", nextPage);
    const qs = p.toString();
    startTransition(() => {
      router.replace(qs ? `/dashboard/documents?${qs}` : "/dashboard/documents");
    });
  }

  async function changeCategory(it: HubDocumentItem, next: HubCategoryId) {
    if (!it.chantierFileId) return;
    setCatBusy(true);
    try {
      const res = await fetch(`/api/chantier/files/${it.chantierFileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: CATEGORY_TO_DOCUMENT_TYPE[next] }),
      });
      if (res.ok) {
        setDrawer(null);
        router.refresh();
      }
    } finally {
      setCatBusy(false);
    }
  }

  const chips = useMemo(() => {
    const out: { key: string; label: string; clear: Record<string, string> }[] = [];
    if (inCategory) {
      out.push({
        key: "group",
        label: hubCategoryLabel(group),
        clear: { view: "categories", group: "all", page: "1" },
      });
    }
    if (projectId && !hideProject) {
      const t = projects.find((p) => p.id === projectId)?.title ?? "Chantier";
      out.push({ key: "project", label: `Chantier : ${t}`, clear: { projectId: "", page: "1" } });
    }
    if (origin) {
      const ol = HUB_ORIGIN_FILTERS.find((o) => o.id === origin)?.label ?? origin;
      out.push({ key: "origin", label: `Source : ${ol}`, clear: { origin: "", page: "1" } });
    }
    if (docType) {
      const tl = HUB_DOC_TYPES.find((t) => t.id === docType)?.label ?? docType;
      out.push({ key: "docType", label: `Type : ${tl}`, clear: { docType: "", page: "1" } });
    }
    if (company) {
      out.push({ key: "company", label: `Entreprise : ${company}`, clear: { company: "", page: "1" } });
    }
    if (since) {
      const dl = HUB_DATE_FILTERS.find((d) => d.id === since)?.label ?? since;
      out.push({ key: "since", label: `Date : ${dl}`, clear: { since: "", page: "1" } });
    }
    return out;
  }, [projectId, origin, docType, company, since, projects, hideProject, inCategory, group]);

  const groupedRecent = useMemo(() => {
    if (view !== "recent") return null;
    const map = new Map<string, HubDocumentItem[]>();
    for (const it of items) {
      const label = recentDayLabel(it.createdAt);
      const arr = map.get(label) ?? [];
      arr.push(it);
      map.set(label, arr);
    }
    return [...map.entries()];
  }, [items, view]);

  async function toggleFavorite(it: HubDocumentItem) {
    if (!it.chantierFileId || it.isExpectedMissing) return;
    setFavBusy(it.id);
    try {
      const res = await fetch(`/api/chantier/files/${it.chantierFileId}/favorite`, {
        method: "POST",
      });
      if (res.ok) router.refresh();
    } finally {
      setFavBusy(null);
    }
  }

  function openFile(it: HubDocumentItem) {
    if (it.isExpectedMissing) {
      window.location.href = it.href;
      return;
    }
    if (it.chantierFileId) {
      setPreview({
        name: it.title,
        url: it.href.startsWith("/api/") ? it.href : null,
        chantierFileId: it.chantierFileId,
        mimeType: it.mimeHint,
        createdAtLabel: formatGedShortDate(it.createdAt),
      });
      return;
    }
    window.open(it.href, "_blank", "noopener,noreferrer");
  }

  const addTarget = projectId || projects[0]?.id;
  const title = external ? "Documents partagés" : "Documents";
  const subtitle = external
    ? isSupplier
      ? `Documents échangés avec ${hostCompany?.trim() || "votre client"}.`
      : `Documents que ${hostCompany?.trim() || "votre entreprise"} partage avec vous.`
    : "Retrouvez tous les documents de votre entreprise, où qu’ils aient été ajoutés.";
  const searchPlaceholder = lockedProjectTitle
    ? `Rechercher dans ${lockedProjectTitle}…`
    : "Rechercher un document, chantier, fournisseur, référence…";

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-8 px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <DocumentPreviewModal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        item={preview}
      />

      <header className="space-y-2.5">
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-[#1e3a5f] sm:text-[2rem]">
          {title}
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-slate-500">{subtitle}</p>
      </header>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          ref={searchRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => {
            const rec = loadRecentSearches();
            setRecentQs(rec);
            if (!q && rec.length > 0) setRecentOpen(true);
          }}
          onBlur={() => window.setTimeout(() => setRecentOpen(false), 160)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              go({ q, page: "1" });
              saveRecentSearch(q);
              setRecentOpen(false);
            }
          }}
          placeholder={searchPlaceholder}
          className="h-14 w-full rounded-2xl border border-slate-200/90 bg-white pl-12 pr-12 text-[15px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#1e3a5f]/25 focus:ring-4 focus:ring-[#1e3a5f]/10"
          aria-label="Rechercher un document"
          autoComplete="off"
        />
        {q ? (
          <button
            type="button"
            onClick={() => {
              setQ("");
              go({ q: "", page: "1" });
              searchRef.current?.focus();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 hover:text-slate-700"
            aria-label="Effacer la recherche"
          >
            ×
          </button>
        ) : pending ? (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">…</span>
        ) : null}
        {recentOpen && recentQs.length > 0 && !q ? (
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
                    onClick={() => {
                      setQ(s);
                      go({ q: s, page: "1" });
                      setRecentOpen(false);
                    }}
                    className="w-full rounded-lg px-2 py-1.5 text-left text-[14px] text-slate-700 hover:bg-slate-50"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <nav
        className="inline-flex max-w-full gap-0.5 overflow-x-auto rounded-xl border border-slate-200/80 bg-slate-50/80 p-1"
        aria-label="Vues documents"
      >
        {shownViews.map((v) => {
          const active = view === v.id;
          const isClassify = v.id === "classify";
          const tabLabel = isClassify ? "À classer" : v.label;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() =>
                go({
                  view: v.id,
                  page: "1",
                  group: "all",
                  ...(v.id === "recent" ? { sort: "recent" } : {}),
                })
              }
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150",
                active
                  ? "border border-slate-200/90 bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                  : "border border-transparent text-slate-500 hover:text-slate-800",
              )}
            >
              {tabLabel}
              {isClassify && classifyCount > 0 ? (
                <span
                  className={cn(
                    "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                    active
                      ? "bg-amber-50 text-amber-800/80"
                      : "bg-slate-200/70 text-slate-600",
                  )}
                >
                  {classifyCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {inCategory ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 pt-1 text-[13px]">
          <button
            type="button"
            onClick={() => go({ view: "all", group: "all", page: "1" })}
            className="font-medium text-slate-400 transition-colors hover:text-[#1e3a5f]"
          >
            Documents
          </button>
          <span className="text-slate-300" aria-hidden>
            /
          </span>
          <button
            type="button"
            onClick={() => go({ view: "categories", group: "all", page: "1" })}
            className="font-medium text-slate-500 transition-colors hover:text-[#1e3a5f]"
          >
            Catégories
          </button>
          <span className="text-slate-300" aria-hidden>
            /
          </span>
          <span className="font-semibold text-slate-900">{hubCategoryLabel(group)}</span>
          <button
            type="button"
            onClick={() => go({ view: "categories", group: "all", page: "1" })}
            className="ml-auto text-[12px] font-medium text-[#1e3a5f] hover:underline"
          >
            Toutes les catégories
          </button>
        </div>
      ) : null}

      {showCategoryCards ? null : (
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
          aria-expanded={filtersOpen}
        >
          Filtres
        </button>
        <label className="ml-auto inline-flex items-center gap-2 text-[13px] text-slate-500">
          <span className="sr-only">Trier</span>
          <select
            value={sort}
            onChange={(e) => go({ sort: e.target.value, page: "1" })}
            className="rounded-full border border-transparent bg-transparent py-1 pr-1 text-[13px] font-medium text-slate-600 outline-none"
            aria-label="Trier les documents"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        {canUploadChantier && addTarget ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setAddOpen((o) => !o)}
              className="rounded-full bg-[#1e3a5f] px-3.5 py-1.5 text-[13px] font-medium text-white hover:bg-[#16304f]"
              aria-haspopup="menu"
              aria-expanded={addOpen}
            >
              Ajouter
            </button>
            {addOpen ? (
              <div
                role="menu"
                className="absolute right-0 z-20 mt-1.5 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
              >
                <Link
                  href={`/dashboard/projets/${addTarget}#tab-documents`}
                  role="menuitem"
                  className="block px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50"
                  onClick={() => setAddOpen(false)}
                >
                  Ajouter un document
                </Link>
                <Link
                  href={`/dashboard/projets/${addTarget}#tab-documents`}
                  role="menuitem"
                  className="block px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50"
                  onClick={() => setAddOpen(false)}
                >
                  Ajouter une pièce à récupérer
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      )}

      {showCategoryCards ? (
        <div className="pt-1" aria-busy={pending}>
          {(categoryStats ?? []).length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-lg font-medium text-slate-800">{empty.title}</p>
              <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-slate-500">
                {empty.body}
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
              {(categoryStats ?? []).map((cat) => {
                const Icon = CATEGORY_ICONS[cat.id] ?? FileText;
                const totalCat = cat.availableCount + cat.missingCount;
                const previews = cat.previewTitles.slice(0, 3);
                const extra = Math.max(0, totalCat - previews.length);
                const availableLabel =
                  cat.availableCount === 0
                    ? null
                    : `${cat.availableCount} document${cat.availableCount > 1 ? "s" : ""}`;
                return (
                  <li key={cat.id} className="h-full">
                    <button
                      type="button"
                      onClick={() =>
                        go({ view: "categories", group: cat.id, page: "1" })
                      }
                      className="group flex h-full w-full flex-col rounded-2xl border border-slate-200/90 bg-white p-5 text-left transition-[border-color,background-color] duration-200 hover:border-slate-300 hover:bg-slate-50/60 sm:p-6"
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-slate-100">
                          <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[16px] font-semibold leading-snug tracking-tight text-slate-900">
                            {cat.label}
                          </p>
                          {availableLabel ? (
                            <p className="mt-1.5 text-[14px] font-medium text-slate-700">
                              {availableLabel}
                            </p>
                          ) : (
                            <p className="mt-1.5 text-[14px] font-medium text-slate-500">
                              Aucun fichier disponible
                            </p>
                          )}
                          {cat.missingCount > 0 ? (
                            <span className="mt-2 inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[12px] font-medium text-amber-800/85 ring-1 ring-amber-100/80">
                              {cat.missingCount} à récupérer
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {previews.length > 0 ? (
                        <ul className="mt-5 min-h-[4.5rem] space-y-1.5 border-t border-slate-100 pt-4">
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
                            <li className="text-[12px] font-medium text-slate-400 sm:hidden">
                              + 1 autre
                            </li>
                          ) : null}
                        </ul>
                      ) : (
                        <div className="mt-5 min-h-[4.5rem] border-t border-slate-100 pt-4" />
                      )}

                      <div className="mt-auto flex items-center gap-1 pt-5 text-[13px] font-medium text-[#1e3a5f]">
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
          )}
        </div>
      ) : (
        <>
      {filtersOpen ? (
        <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {hideProject ? null : (
            <label className="block text-[12px] font-medium text-slate-500">
              Chantier
              <select
                value={projectId}
                onChange={(e) => go({ projectId: e.target.value, page: "1" })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
              >
                <option value="">Tous</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block text-[12px] font-medium text-slate-500">
            Type
            <select
              value={docType}
              onChange={(e) => go({ docType: e.target.value, page: "1" })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
            >
              {HUB_DOC_TYPES.map((t) => (
                <option key={t.id || "all"} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[12px] font-medium text-slate-500">
            Source
            <select
              value={origin}
              onChange={(e) => go({ origin: e.target.value, page: "1" })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
            >
              <option value="">Toutes</option>
              {HUB_ORIGIN_FILTERS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {companies.length > 0 ? (
            <label className="block text-[12px] font-medium text-slate-500">
              Entreprise
              <select
                value={company}
                onChange={(e) => go({ company: e.target.value, page: "1" })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
              >
                <option value="">Toutes</option>
                {companies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="block text-[12px] font-medium text-slate-500">
            Date
            <select
              value={since}
              onChange={(e) => go({ since: e.target.value, page: "1" })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
            >
              {HUB_DATE_FILTERS.map((d) => (
                <option key={d.id || "all"} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {chips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => go(c.clear)}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[12px] font-medium text-slate-700 hover:bg-slate-200"
            >
              {c.label}
              <span aria-hidden className="text-slate-400">
                ×
              </span>
            </button>
          ))}
          {chips.length > 1 ? (
            <button
              type="button"
              onClick={() =>
                go({
                  projectId: hideProject ? projectId : "",
                  origin: "",
                  docType: "",
                  company: "",
                  since: "",
                  group: "all",
                  page: "1",
                })
              }
              className="px-2 py-1 text-[12px] font-medium text-[#1e3a5f] hover:underline"
            >
              Effacer tout
            </button>
          ) : null}
        </div>
      ) : null}

      <div aria-busy={pending} className={cn(pending ? "opacity-70" : "")}>
        {items.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-lg font-medium text-slate-800">{empty.title}</p>
            <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-slate-500">
              {empty.body}
            </p>
            {empty.action === "clear-search" ? (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  go({ q: "", page: "1" });
                }}
                className="mt-6 text-[13px] font-medium text-[#1e3a5f] hover:underline"
              >
                Effacer la recherche
              </button>
            ) : empty.action === "clear-filters" ? (
              <button
                type="button"
                onClick={() =>
                  go({
                    projectId: hideProject ? projectId : "",
                    origin: "",
                    docType: "",
                    company: "",
                    since: "",
                    group: "all",
                    page: "1",
                  })
                }
                className="mt-6 text-[13px] font-medium text-[#1e3a5f] hover:underline"
              >
                Effacer les filtres
              </button>
            ) : empty.action === "add" && canUploadChantier && addTarget ? (
              <Link
                href={`/dashboard/projets/${addTarget}#tab-documents`}
                className="mt-6 inline-flex rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white"
              >
                Ajouter
              </Link>
            ) : null}
          </div>
        ) : groupedRecent ? (
          <div className="space-y-7">
            {groupedRecent.map(([day, docs]) => (
              <section key={day}>
                <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {day}
                </h2>
                <ul className="divide-y divide-slate-100">
                  {docs.map((it) => (
                    <GedDocumentRow
                      key={it.id}
                      it={it}
                      hideProject={hideProject}
                      onOpenDetails={() => setDrawer(it)}
                      onOpenFile={() => openFile(it)}
                      onFavorite={() => void toggleFavorite(it)}
                      favBusy={favBusy === it.id}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((it) => (
              <GedDocumentRow
                key={it.id}
                it={it}
                hideProject={hideProject}
                onOpenDetails={() => setDrawer(it)}
                onOpenFile={() => openFile(it)}
                onFavorite={() => void toggleFavorite(it)}
                favBusy={favBusy === it.id}
              />
            ))}
          </ul>
        )}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3 pt-2 text-[13px] text-slate-500">
          <button type="button" disabled={page <= 1} onClick={() => go({ page: String(page - 1) })} className="disabled:opacity-30">
            Précédent
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => go({ page: String(page + 1) })}
            className="disabled:opacity-30"
          >
            Suivant
          </button>
        </div>
      ) : null}
        </>
      )}

      {drawer ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/20"
          onClick={() => setDrawer(null)}
        >
          <aside
            className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={drawer.title}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold leading-snug text-slate-900">{drawer.title}</h2>
                <p className="mt-1 text-[13px] text-slate-500">{drawer.typeLabel}</p>
              </div>
              <button type="button" onClick={() => setDrawer(null)} className="text-slate-400 hover:text-slate-700" aria-label="Fermer">
                ×
              </button>
            </div>
            <dl className="flex-1 space-y-4 overflow-y-auto px-6 py-5 text-[14px]">
              {hideProject ? null : <Info label="Chantier" value={drawer.projectTitle} />}
              <Info label="Entreprise" value={drawer.companyLabel} />
              <Info label="Date" value={formatGedShortDate(drawer.createdAt)} />
              <Info label="Source" value={drawer.originLabel} />
              <Info label="Catégorie" value={hubCategoryLabel(drawer.group)} />
              <Info label="État" value={drawer.isExpectedMissing ? "À récupérer" : "Disponible"} />
              <Info label="Référence" value={drawer.contextLabel} />
              {drawer.indice || drawer.versionLabel ? (
                <Info
                  label="Version"
                  value={[drawer.indice, drawer.isCurrentVersion ? "Actuelle" : drawer.versionLabel]
                    .filter(Boolean)
                    .join(" — ")}
                />
              ) : null}
              {drawer.chantierFileId && !external ? (
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-400">
                    Changer de catégorie
                  </dt>
                  <dd className="mt-1.5">
                    <select
                      disabled={catBusy}
                      defaultValue={drawer.group === "all" ? "autres" : drawer.group}
                      onChange={(e) => {
                        const next = e.target.value as HubCategoryId;
                        void changeCategory(drawer, next);
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                      aria-label="Changer de catégorie"
                    >
                      {HUB_CATEGORY_DEFS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Modifie uniquement le classement — le fichier n’est pas déplacé.
                    </p>
                  </dd>
                </div>
              ) : null}
            </dl>
            <div className="flex flex-wrap gap-2 border-t border-slate-100 px-6 py-4">
              {drawer.isExpectedMissing ? (
                <Link
                  href={drawer.href}
                  className="rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white"
                >
                  Ajouter le document
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => openFile(drawer)}
                  className="rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white"
                >
                  Ouvrir
                </button>
              )}
              {drawer.originHref && drawer.originActionLabel ? (
                <Link
                  href={drawer.originHref}
                  className="rounded-full border border-slate-200 px-4 py-2 text-[13px] font-medium text-slate-700"
                >
                  {drawer.originActionLabel}
                </Link>
              ) : null}
              {drawer.chantierFileId && !drawer.isExpectedMissing ? (
                <button
                  type="button"
                  onClick={() => void toggleFavorite(drawer)}
                  className="rounded-full border border-slate-200 px-4 py-2 text-[13px] font-medium text-slate-700"
                >
                  {drawer.isFavorite ? "Retirer des favoris" : "Favori"}
                </button>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-slate-800">{value}</dd>
    </div>
  );
}
