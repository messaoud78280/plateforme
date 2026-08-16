"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DocumentPreviewModal, type DocumentPreviewItem } from "@/components/documents/DocumentPreviewModal";
import { GedDocumentRow } from "@/components/ged/GedDocumentRow";
import {
  GED_SHELL_CLASS,
  GedBackLink,
  GedBreadcrumb,
  GedCategoryGrid,
  GedEmptyState,
  GedPageHeader,
  GedPrimaryButton,
  GedSearchField,
  GedSecondaryButton,
  GedViewTabs,
} from "@/components/ged/GedUi";
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

const SORT_OPTIONS: { id: HubSort; label: string }[] = [
  { id: "recent", label: "Plus récents" },
  { id: "oldest", label: "Plus anciens" },
  { id: "name", label: "Nom A–Z" },
];

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
      out.push({ key: "project", label: t, clear: { projectId: "", page: "1" } });
    }
    if (origin) {
      const ol = HUB_ORIGIN_FILTERS.find((o) => o.id === origin)?.label ?? origin;
      out.push({ key: "origin", label: ol, clear: { origin: "", page: "1" } });
    }
    if (docType) {
      const tl = HUB_DOC_TYPES.find((t) => t.id === docType)?.label ?? docType;
      out.push({ key: "docType", label: tl, clear: { docType: "", page: "1" } });
    }
    if (company) {
      out.push({ key: "company", label: company, clear: { company: "", page: "1" } });
    }
    if (since) {
      const dl = HUB_DATE_FILTERS.find((d) => d.id === since)?.label ?? since;
      out.push({ key: "since", label: dl, clear: { since: "", page: "1" } });
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
  const projectTitle =
    lockedProjectTitle ||
    (projectId ? projects.find((p) => p.id === projectId)?.title ?? null : null);

  const pageTitle = (() => {
    if (external) return "Documents partagés";
    if (inCategory) return hubCategoryLabel(group);
    if (view === "missing") return "Documents à récupérer";
    if (view === "classify") return "Documents à classer";
    if (view === "favorites") return "Favoris";
    if (view === "recent") return "Récents";
    if (hideProject && lockedProjectTitle) return "Documents";
    return "Documents";
  })();

  const pageSubtitle = (() => {
    if (external) {
      return isSupplier
        ? `Documents échangés avec ${hostCompany?.trim() || "votre client"}.`
        : `Documents que ${hostCompany?.trim() || "votre entreprise"} partage avec vous.`;
    }
    if (inCategory) {
      const avail = items.filter((i) => !i.isExpectedMissing).length;
      const miss = items.filter((i) => i.isExpectedMissing).length;
      const parts = [
        `${total} document${total !== 1 ? "s" : ""}`,
        miss > 0 ? `${miss} à récupérer` : null,
      ].filter(Boolean);
      return parts.join(" · ");
    }
    if (view === "missing") {
      return "Les pièces attendues qui n’ont pas encore été ajoutées.";
    }
    if (view === "classify") {
      return "Ces documents ont besoin d’une catégorie.";
    }
    if (hideProject && lockedProjectTitle) {
      return `Tous les documents de ${lockedProjectTitle}`;
    }
    if (projectTitle && !hideProject) {
      return `Documents filtrés sur ${projectTitle}.`;
    }
    return "Retrouvez tous les documents de votre entreprise.";
  })();

  const searchPlaceholder = lockedProjectTitle
    ? `Rechercher dans ${lockedProjectTitle}…`
    : "Rechercher un document, chantier, fournisseur, référence…";

  const addMenu =
    canUploadChantier && addTarget ? (
      <div className="relative">
        <GedPrimaryButton
          onClick={() => setAddOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={addOpen}
        >
          Ajouter
        </GedPrimaryButton>
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
    ) : null;

  return (
    <div className={GED_SHELL_CLASS}>
      <DocumentPreviewModal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        item={preview}
      />

      <div className="space-y-3">
        {hideProject && lockedProjectTitle ? (
          <GedBackLink
            href={`/dashboard/projets/${projectId}`}
            label={lockedProjectTitle}
          />
        ) : null}
        {inCategory ? (
          <GedBackLink
            label="Toutes les catégories"
            onClick={() => go({ view: "categories", group: "all", page: "1" })}
          />
        ) : null}
        {!inCategory && !hideProject && projectId && projectTitle ? (
          <GedBackLink
            href={`/dashboard/projets/${projectId}`}
            label={projectTitle}
          />
        ) : null}
        {inCategory ? (
          <GedBreadcrumb
            items={[
              {
                label: "Documents",
                onClick: () => go({ view: "all", group: "all", page: "1" }),
              },
              {
                label: "Catégories",
                onClick: () => go({ view: "categories", group: "all", page: "1" }),
              },
              { label: hubCategoryLabel(group) },
            ]}
          />
        ) : null}
        <GedPageHeader title={pageTitle} subtitle={pageSubtitle} action={addMenu} />
      </div>

      <GedSearchField
        value={q}
        onChange={setQ}
        onSubmit={() => {
          go({ q, page: "1" });
          saveRecentSearch(q);
          setRecentOpen(false);
        }}
        onClear={() => {
          setQ("");
          go({ q: "", page: "1" });
          searchRef.current?.focus();
        }}
        placeholder={searchPlaceholder}
        inputRef={searchRef}
        pending={pending}
        recentOpen={recentOpen}
        recentQs={recentQs}
        onFocusRecent={() => {
          const rec = loadRecentSearches();
          setRecentQs(rec);
          if (!q && rec.length > 0) setRecentOpen(true);
        }}
        onBlurRecent={() => window.setTimeout(() => setRecentOpen(false), 160)}
        onPickRecent={(s) => {
          setQ(s);
          go({ q: s, page: "1" });
          setRecentOpen(false);
        }}
      />

      <GedViewTabs
        views={shownViews}
        active={view}
        classifyCount={classifyCount}
        onChange={(id) =>
          go({
            view: id,
            page: "1",
            group: "all",
            ...(id === "recent" ? { sort: "recent" } : {}),
          })
        }
      />

      {showCategoryCards ? null : (
      <div className="flex flex-wrap items-center gap-2">
        <GedSecondaryButton
          onClick={() => setFiltersOpen((o) => !o)}
          aria-expanded={filtersOpen}
        >
          Filtres
        </GedSecondaryButton>
        <label className="ml-auto inline-flex items-center gap-2 text-[13px] text-slate-500">
          <span className="sr-only">Trier</span>
          <select
            value={sort}
            onChange={(e) => go({ sort: e.target.value, page: "1" })}
            className="rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-600 outline-none transition-colors focus:border-[#1e3a5f]/25"
            aria-label="Trier les documents"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      )}

      {showCategoryCards ? (
        <div className="pt-1" aria-busy={pending}>
          <GedCategoryGrid
            stats={categoryStats ?? []}
            onOpen={(id) => go({ view: "categories", group: id, page: "1" })}
            empty={<GedEmptyState title={empty.title} body={empty.body} />}
          />
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
              Effacer les filtres
            </button>
          ) : null}
        </div>
      ) : null}

      <div aria-busy={pending} className={cn(pending ? "opacity-70" : "")}>
        {items.length === 0 ? (
          <GedEmptyState
            title={empty.title}
            body={empty.body}
            action={
              empty.action === "clear-search" ? (
                <button
                  type="button"
                  onClick={() => {
                    setQ("");
                    go({ q: "", page: "1" });
                  }}
                  className="text-[13px] font-medium text-[#1e3a5f] hover:underline"
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
                  className="text-[13px] font-medium text-[#1e3a5f] hover:underline"
                >
                  Effacer les filtres
                </button>
              ) : empty.action === "add" && canUploadChantier && addTarget ? (
                <Link
                  href={`/dashboard/projets/${addTarget}#tab-documents`}
                  className="inline-flex rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white"
                >
                  Ajouter
                </Link>
              ) : null
            }
          />
        ) : groupedRecent ? (
          <div className="space-y-7">
            {groupedRecent.map(([day, docs]) => (
              <section key={day}>
                <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {day}
                </h2>
                <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/90 bg-white px-1 sm:px-2">
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
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/90 bg-white px-1 sm:px-2">
            {items.map((it) => (
              <GedDocumentRow
                key={it.id}
                it={it}
                hideProject={hideProject}
                onOpenDetails={() => setDrawer(it)}
                onOpenFile={() => openFile(it)}
                onFavorite={() => void toggleFavorite(it)}
                favBusy={favBusy === it.id}
                classifySlot={
                  view === "classify" && it.chantierFileId ? (
                    <select
                      disabled={catBusy}
                      defaultValue=""
                      onChange={(e) => {
                        const next = e.target.value as HubCategoryId;
                        if (next) void changeCategory(it, next);
                      }}
                      className="max-w-[9rem] rounded-full border border-slate-200 bg-white px-2 py-1 text-[12px] text-slate-700"
                      aria-label="Classer"
                    >
                      <option value="">Classer</option>
                      {HUB_CATEGORY_DEFS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  ) : null
                }
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
