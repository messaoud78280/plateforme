"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, LayoutList, Menu, Plus, BookmarkPlus } from "lucide-react";
import { DocumentPreviewModal, type DocumentPreviewItem } from "@/components/documents/DocumentPreviewModal";
import { DocumentCenterKpis } from "@/components/ged/DocumentCenterKpis";
import { DocumentCenterNav } from "@/components/ged/DocumentCenterNav";
import { DocumentPreviewPanel } from "@/components/ged/DocumentPreviewPanel";
import { DocumentSelectionBar } from "@/components/ged/DocumentSelectionBar";
import { DocumentUploadDropzone } from "@/components/ged/DocumentUploadDropzone";
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
} from "@/components/ged/GedUi";
import type {
  HubCategoryStat,
  HubDocumentItem,
  HubGroup,
  HubGroupBy,
  HubSort,
  HubView,
} from "@/lib/ged/document-hub-ui";
import {
  HUB_CATEGORY_DEFS,
  HUB_DATE_FILTERS,
  HUB_DOC_TYPES,
  HUB_GROUP_BY_OPTIONS,
  HUB_ORIGIN_FILTERS,
  HUB_SORT_OPTIONS,
  groupHubDocuments,
  hubCategoryLabel,
  hubEmptyCopy,
  recentDayLabel,
} from "@/lib/ged/document-hub-ui";
import {
  CATEGORY_TO_DOCUMENT_TYPE,
  type HubCategoryId,
} from "@/lib/ged/hub-categories";
import { cn } from "@/lib/cn";

const LAYOUT_KEY = "bework.ged.layout";
const GROUP_KEY = "bework.ged.groupBy";
const SORT_KEY = "bework.ged.sort";
const DENSITY_KEY = "bework.ged.density";
const SAVED_VIEWS_KEY = "bework.ged.savedViews";
const RECENT_Q_KEY = "bework.ged.recentSearches";
const MAX_BULK_RETRIEVE = 20;
const MAX_BULK_DOWNLOAD = 10;

type DensityPref = "comfort" | "compact";

type SavedHubView = {
  id: string;
  name: string;
  view: HubView;
  group: string;
  q: string;
  sort: HubSort;
  groupBy: HubGroupBy;
  projectId: string;
  origin: string;
  docType: string;
  company: string;
  since: string;
};

function loadSavedViews(): SavedHubView[] {
  try {
    const raw = localStorage.getItem(SAVED_VIEWS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v) => v && typeof v === "object" && typeof (v as SavedHubView).id === "string" && typeof (v as SavedHubView).name === "string") as SavedHubView[];
  } catch {
    return [];
  }
}

function persistSavedViews(views: SavedHubView[]) {
  try {
    localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(views.slice(0, 12)));
  } catch {
    /* ignore */
  }
}

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

function readPref<T extends string>(key: string, allowed: T[], fallback: T): T {
  try {
    const v = sessionStorage.getItem(key);
    if (v && (allowed as string[]).includes(v)) return v as T;
  } catch {
    /* ignore */
  }
  return fallback;
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
  missingCount = 0,
  weekCount = 0,
  totalAll = 0,
  projectStats = [],
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
  missingCount?: number;
  weekCount?: number;
  totalAll?: number;
  projectStats?: Array<{
    id: string;
    title: string;
    count: number;
    missingCount: number;
  }>;
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
  const [navOpen, setNavOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);
  const [recentQs, setRecentQs] = useState<string[]>([]);
  const [drawer, setDrawer] = useState<HubDocumentItem | null>(null);
  const [preview, setPreview] = useState<DocumentPreviewItem | null>(null);
  const [favBusy, setFavBusy] = useState<string | null>(null);
  const [catBusy, setCatBusy] = useState(false);
  const [layout, setLayout] = useState<"list" | "cards">("list");
  const [density, setDensity] = useState<DensityPref>("comfort");
  const [groupBy, setGroupBy] = useState<HubGroupBy>("none");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedHubView[]>([]);
  const [activeSavedViewId, setActiveSavedViewId] = useState<string | null>(null);
  const [saveViewOpen, setSaveViewOpen] = useState(false);
  const [saveViewName, setSaveViewName] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const isSupplier =
    personType === "SUPPLIER" || permissionProfile === "FOURNISSEUR";
  const isClient =
    personType === "CLIENT_EXT" || permissionProfile === "CLIENT";
  const external = isSupplier || isClient;
  const hideProject = Boolean(hideProjectFilter);
  const showChecks = selectMode || view === "missing" || picked.size > 0;

  const showCategoryCards =
    view === "categories" && group === "all" && !search.trim();
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

  useEffect(() => {
    setLayout(readPref<"list" | "cards">(LAYOUT_KEY, ["list", "cards"], "list"));
    setDensity(readPref<DensityPref>(DENSITY_KEY, ["comfort", "compact"], "comfort"));
    setGroupBy(
      readPref<HubGroupBy>(
        GROUP_KEY,
        HUB_GROUP_BY_OPTIONS.map((o) => o.id),
        "none",
      ),
    );
    setSavedViews(loadSavedViews());
  }, []);

  useEffect(() => {
    setPicked(new Set());
    setDrawer(null);
  }, [view, group, projectId, origin, docType, company, since, search, page]);

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
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (e.key !== "Escape") return;
      if (preview) {
        setPreview(null);
        return;
      }
      if (drawer) {
        setDrawer(null);
        return;
      }
      if (addOpen) setAddOpen(false);
      if (navOpen) setNavOpen(false);
      if (filtersOpen) setFiltersOpen(false);
      if (recentOpen) setRecentOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer, preview, recentOpen, addOpen, filtersOpen, navOpen]);

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
    try {
      sessionStorage.setItem(SORT_KEY, nextSort);
    } catch {
      /* ignore */
    }
    const qs = p.toString();
    startTransition(() => {
      router.replace(qs ? `/dashboard/documents?${qs}` : "/dashboard/documents");
    });
    setNavOpen(false);
    if (!updates._keepSavedView) setActiveSavedViewId(null);
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
      const t = projects.find((p) => p.id === projectId)?.title
        ?? projectStats.find((p) => p.id === projectId)?.title
        ?? "Chantier";
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
    if (view === "favorites") {
      out.push({ key: "fav", label: "Favoris", clear: { view: "all", page: "1" } });
    }
    if (view === "missing") {
      out.push({ key: "missing", label: "À récupérer", clear: { view: "all", page: "1" } });
    }
    if (view === "classify") {
      out.push({ key: "classify", label: "À classer", clear: { view: "all", page: "1" } });
    }
    return out;
  }, [projectId, origin, docType, company, since, projects, projectStats, hideProject, inCategory, group, view]);

  const groupedRecent = useMemo(() => {
    if (view !== "recent" || groupBy !== "none") return null;
    const map = new Map<string, HubDocumentItem[]>();
    for (const it of items) {
      const label = recentDayLabel(it.createdAt);
      const arr = map.get(label) ?? [];
      arr.push(it);
      map.set(label, arr);
    }
    return [...map.entries()];
  }, [items, view, groupBy]);

  const grouped = useMemo(() => groupHubDocuments(items, groupBy), [items, groupBy]);

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
      window.location.href = it.projectId
        ? `/dashboard/projets/${it.projectId}#dossier-chantier`
        : it.href;
      return;
    }
    if (it.chantierFileId) {
      setPreview({
        name: it.title,
        url: it.href.startsWith("/api/") ? it.href : null,
        chantierFileId: it.chantierFileId,
        mimeType: it.mimeHint,
        createdAtLabel: it.createdAt,
      });
      return;
    }
    window.open(it.href, "_blank", "noopener,noreferrer");
  }

  function selectRow(it: HubDocumentItem) {
    setDrawer(it);
  }

  const selectedItems = items.filter((it) => picked.has(it.id));

  async function bulkFavorite() {
    const ids = selectedItems.filter((it) => it.chantierFileId && !it.isExpectedMissing);
    await Promise.all(
      ids.map((it) =>
        fetch(`/api/chantier/files/${it.chantierFileId}/favorite`, { method: "POST" }),
      ),
    );
    setPicked(new Set());
    router.refresh();
  }

  async function bulkCategorize(categoryId: string) {
    const next = categoryId as HubCategoryId;
    const type = CATEGORY_TO_DOCUMENT_TYPE[next];
    if (!type) return;
    setCatBusy(true);
    try {
      await Promise.all(
        selectedItems
          .filter((it) => it.chantierFileId && !it.isExpectedMissing)
          .map((it) =>
            fetch(`/api/chantier/files/${it.chantierFileId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ documentType: type }),
            }),
          ),
      );
      setPicked(new Set());
      router.refresh();
    } finally {
      setCatBusy(false);
    }
  }

  function bulkDownload() {
    const files = selectedItems
      .filter((it) => it.chantierFileId && !it.isExpectedMissing)
      .slice(0, MAX_BULK_DOWNLOAD);
    files.forEach((it, i) => {
      window.setTimeout(() => {
        const a = document.createElement("a");
        a.href = `/api/chantier/files/${it.chantierFileId}/preview?download=original`;
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }, i * 250);
    });
  }

  function bulkRetrieve() {
    const miss = (picked.size ? selectedItems : items).filter((it) => it.isExpectedMissing);
    const limited = miss.slice(0, MAX_BULK_RETRIEVE);
    const projectIds = [...new Set(limited.map((it) => it.projectId).filter(Boolean))];
    if (projectIds.length === 0) return;
    window.location.href = `/dashboard/projets/${projectIds[0]}#dossier-chantier`;
  }

  function persistLayout(next: "list" | "cards") {
    setLayout(next);
    try {
      sessionStorage.setItem(LAYOUT_KEY, next);
    } catch {
      /* ignore */
    }
  }

  function persistGroupBy(next: HubGroupBy) {
    setGroupBy(next);
    setCollapsed(new Set());
    try {
      sessionStorage.setItem(GROUP_KEY, next);
    } catch {
      /* ignore */
    }
  }

  function persistDensity(next: DensityPref) {
    setDensity(next);
    try {
      sessionStorage.setItem(DENSITY_KEY, next);
    } catch {
      /* ignore */
    }
  }

  function applySavedView(sv: SavedHubView) {
    setActiveSavedViewId(sv.id);
    persistGroupBy(sv.groupBy);
    go({
      view: sv.view,
      group: sv.group,
      q: sv.q,
      sort: sv.sort,
      projectId: hideProject ? projectId : sv.projectId,
      origin: sv.origin,
      docType: sv.docType,
      company: sv.company,
      since: sv.since,
      page: "1",
      _keepSavedView: "1",
    });
    setActiveSavedViewId(sv.id);
  }

  function saveCurrentView() {
    const name = saveViewName.trim();
    if (name.length < 2) return;
    const sv: SavedHubView = {
      id: `${Date.now()}`,
      name,
      view,
      group,
      q: search,
      sort,
      groupBy,
      projectId: hideProject ? "" : projectId,
      origin,
      docType,
      company,
      since,
    };
    const next = [sv, ...savedViews.filter((v) => v.name.toLowerCase() !== name.toLowerCase())];
    setSavedViews(next);
    persistSavedViews(next);
    setActiveSavedViewId(sv.id);
    setSaveViewOpen(false);
    setSaveViewName("");
  }

  function deleteSavedView(id: string) {
    const next = savedViews.filter((v) => v.id !== id);
    setSavedViews(next);
    persistSavedViews(next);
    if (activeSavedViewId === id) setActiveSavedViewId(null);
  }

  const addTarget = projectId || projects[0]?.id;
  const projectTitle =
    lockedProjectTitle ||
    (projectId
      ? projects.find((p) => p.id === projectId)?.title
        ?? projectStats.find((p) => p.id === projectId)?.title
        ?? null
      : null);

  const pageTitle = (() => {
    if (external) return "Documents partagés";
    if (inCategory) return hubCategoryLabel(group);
    if (view === "missing") return "À récupérer";
    if (view === "classify") return "À classer";
    if (view === "favorites") return "Favoris";
    if (view === "recent") return "Récents";
    return "Bibliothèque";
  })();

  const pageSubtitle = (() => {
    if (external) {
      return isSupplier
        ? `Documents échangés avec ${hostCompany?.trim() || "votre client"}.`
        : `Documents que ${hostCompany?.trim() || "votre entreprise"} partage avec vous.`;
    }
    if (inCategory) return `${total} document${total !== 1 ? "s" : ""} dans cette catégorie.`;
    if (view === "missing") {
      return `${missingCount} document${missingCount !== 1 ? "s" : ""} détecté${missingCount !== 1 ? "s" : ""} dans BeWork`;
    }
    if (view === "classify") return "Classez en une ou deux actions — BeWork propose déjà le type, le chantier et l’entreprise.";
    if (hideProject && lockedProjectTitle) return `Tous les documents de ${lockedProjectTitle}`;
    if (projectTitle && !hideProject) return `Documents filtrés sur ${projectTitle}.`;
    return "Ce qui est rangé, ce qui attend une action, et où retrouver chaque pièce.";
  })();

  const searchPlaceholder = lockedProjectTitle
    ? `Rechercher dans ${lockedProjectTitle}…`
    : "Rechercher un document, chantier, client, fournisseur, référence…";

  const nav = (
    <DocumentCenterNav
      view={view}
      group={group}
      projectId={projectId}
      origin={origin}
      since={since}
      classifyCount={classifyCount}
      missingCount={missingCount}
      categoryStats={categoryStats}
      projectStats={projectStats}
      projects={projects}
      hideProject={hideProject}
      allowedViews={views.map((v) => v.id)}
      savedViews={savedViews}
      activeSavedViewId={activeSavedViewId}
      onOpenSavedView={(id) => {
        const sv = savedViews.find((v) => v.id === id);
        if (sv) applySavedView(sv);
      }}
      onDeleteSavedView={deleteSavedView}
      onGo={go}
    />
  );

  function renderRow(it: HubDocumentItem) {
    return (
      <GedDocumentRow
        key={it.id}
        it={it}
        hideProject={hideProject}
        layout={layout}
        density={density}
        retrieveEmphasis={view === "missing"}
        selected={picked.has(it.id)}
        onToggleSelect={
          showChecks
            ? () =>
                setPicked((prev) => {
                  const next = new Set(prev);
                  if (next.has(it.id)) next.delete(it.id);
                  else next.add(it.id);
                  return next;
                })
            : undefined
        }
        onSelectRow={() => selectRow(it)}
        onOpenDetails={() => {
          setDrawer(it);
        }}
        onOpenFile={() => openFile(it)}
        onFavorite={() => void toggleFavorite(it)}
        favBusy={favBusy === it.id}
        classifySlot={
          view === "classify" && it.chantierFileId ? (
            <ClassifyInbox
              it={it}
              busy={catBusy}
              onValidate={(cat) => void changeCategory(it, cat)}
            />
          ) : null
        }
      />
    );
  }

  function renderList() {
    if (items.length === 0) {
      return (
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
                    view: "all",
                    page: "1",
                  })
                }
                className="text-[13px] font-medium text-[#1e3a5f] hover:underline"
              >
                Effacer les filtres
              </button>
            ) : empty.action === "add" && canUploadChantier && addTarget ? (
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="inline-flex rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white"
              >
                Ajouter
              </button>
            ) : null
          }
        />
      );
    }

    const listClass =
      layout === "cards"
        ? "grid grid-cols-1 gap-3 sm:grid-cols-2"
        : "divide-y divide-slate-100 overflow-hidden rounded-2xl border border-bework-navy/10 bg-white px-1 shadow-[var(--cc-shadow)] sm:px-2";

    if (groupedRecent) {
      return (
        <div className="space-y-7">
          {groupedRecent.map(([day, docs]) => (
            <section key={day}>
              <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                {day}
              </h2>
              <ul className={listClass}>{docs.map(renderRow)}</ul>
            </section>
          ))}
        </div>
      );
    }

    if (groupBy !== "none") {
      return (
        <div className="space-y-3">
          {grouped.map((g) => {
            const closed = collapsed.has(g.key);
            const n = g.items.length;
            return (
              <section key={g.key} className="border-b border-slate-200/80 pb-3 last:border-b-0">
                <button
                  type="button"
                  onClick={() =>
                    setCollapsed((prev) => {
                      const next = new Set(prev);
                      if (next.has(g.key)) next.delete(g.key);
                      else next.add(g.key);
                      return next;
                    })
                  }
                  className="flex w-full items-baseline justify-between gap-3 py-2 text-left"
                >
                  <h2 className="min-w-0 truncate text-[15px] font-semibold text-bework-navy" title={g.label}>
                    {closed ? `${g.label} · ${n} document${n > 1 ? "s" : ""}` : g.label}
                  </h2>
                  {closed ? null : (
                    <span className="shrink-0 text-[12px] font-medium text-slate-400">
                      {n} document{n > 1 ? "s" : ""}
                    </span>
                  )}
                </button>
                {closed ? null : (
                  <ul
                    className={cn(
                      layout === "cards"
                        ? "grid grid-cols-1 gap-3 sm:grid-cols-2"
                        : "divide-y divide-slate-100 overflow-hidden rounded-2xl border border-bework-navy/8 bg-white px-1 sm:px-2",
                    )}
                  >
                    {g.items.map(renderRow)}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      );
    }

    return <ul className={listClass}>{items.map(renderRow)}</ul>;
  }

  const addButton = canUploadChantier && addTarget ? (
    <GedPrimaryButton onClick={() => setAddOpen(true)} className="inline-flex items-center gap-1.5">
      <Plus className="h-4 w-4" strokeWidth={2} />
      Ajouter
    </GedPrimaryButton>
  ) : null;

  return (
    <div className={GED_SHELL_CLASS}>
      <DocumentPreviewModal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        item={preview}
      />
      <DocumentUploadDropzone
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          router.refresh();
        }}
        projects={projects}
        defaultProjectId={addTarget}
        canUpload={canUploadChantier}
        onUploaded={() => router.refresh()}
      />

      <div className="space-y-3">
        {hideProject && lockedProjectTitle ? (
          <GedBackLink href={`/dashboard/projets/${projectId}`} label={lockedProjectTitle} />
        ) : null}
        {inCategory ? (
          <GedBackLink
            label="Toutes les catégories"
            onClick={() => go({ view: "categories", group: "all", page: "1" })}
          />
        ) : null}
        {!inCategory && !hideProject && projectId && projectTitle ? (
          <GedBackLink href={`/dashboard/projets/${projectId}`} label={projectTitle} />
        ) : null}
        {inCategory ? (
          <GedBreadcrumb
            items={[
              { label: "Documents", onClick: () => go({ view: "all", group: "all", page: "1" }) },
              { label: "Catégories", onClick: () => go({ view: "categories", group: "all", page: "1" }) },
              { label: hubCategoryLabel(group) },
            ]}
          />
        ) : null}
        <GedPageHeader title={pageTitle} subtitle={pageSubtitle} action={addButton} />
      </div>

      {external ? null : (
        <DocumentCenterKpis
          items={[
            {
              id: "all",
              value: totalAll,
              label: "Disponibles",
              tone: "ok",
              active: view === "all" && !since && !origin,
              onClick: () =>
                go({
                  view: "all",
                  group: "all",
                  since: "",
                  origin: "",
                  projectId: hideProject ? projectId : "",
                  page: "1",
                }),
            },
            {
              id: "week",
              value: weekCount,
              label: "Ajoutés cette semaine",
              tone: "accent",
              active: since === "7",
              onClick: () => go({ view: "all", since: "7", page: "1" }),
            },
            {
              id: "missing",
              value: missingCount,
              label: "À récupérer",
              tone: "watch",
              active: view === "missing",
              onClick: () => go({ view: "missing", group: "all", page: "1" }),
            },
            {
              id: "classify",
              value: classifyCount,
              label: "À classer",
              tone: "amber",
              active: view === "classify",
              onClick: () => go({ view: "classify", group: "all", page: "1" }),
            },
          ]}
        />
      )}

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
      {search.trim() ? (
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-slate-600">
          <p>
            <span className="font-semibold tabular-nums text-bework-navy">{total}</span>
            {` résultat${total !== 1 ? "s" : ""} pour « ${search.trim()} »`}
          </p>
          <button
            type="button"
            onClick={() => {
              setQ("");
              go({ q: "", page: "1" });
            }}
            className="font-medium text-bework-navy hover:underline"
          >
            Retirer la recherche
          </button>
        </div>
      ) : null}

      <div className="flex gap-5 xl:gap-6">
        <aside className="hidden w-[272px] shrink-0 lg:block">
          <div className="sticky top-14 max-h-[calc(100vh-5.5rem)] overflow-y-auto rounded-2xl border border-bework-navy/10 bg-[linear-gradient(180deg,#f7f9fc_0%,#ffffff_48%)] p-3">
            {nav}
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="sticky top-14 z-20 -mx-1 space-y-2 bg-[linear-gradient(180deg,#f8fafc_70%,rgba(248,250,252,0.85)_100%)] px-1 py-2 backdrop-blur-[2px]">
          <div className="flex flex-wrap items-center gap-2">
            <GedSecondaryButton
              className="lg:hidden"
              onClick={() => setNavOpen(true)}
              aria-expanded={navOpen}
            >
              <span className="inline-flex items-center gap-1.5">
                <Menu className="h-3.5 w-3.5" />
                Parcourir
              </span>
            </GedSecondaryButton>
            {showCategoryCards ? null : (
              <>
                <GedSecondaryButton onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen}>
                  Filtres
                </GedSecondaryButton>
                <label className="inline-flex items-center gap-2 text-[13px] text-slate-500">
                  <span className="sr-only">Trier</span>
                  <select
                    value={sort}
                    onChange={(e) => go({ sort: e.target.value, page: "1" })}
                    className="rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-600 outline-none focus:border-[#1e3a5f]/25"
                    aria-label="Trier les documents"
                  >
                    {HUB_SORT_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="inline-flex items-center gap-2 text-[13px] text-slate-500">
                  <span className="hidden sm:inline">Regrouper</span>
                  <select
                    value={groupBy}
                    onChange={(e) => persistGroupBy(e.target.value as HubGroupBy)}
                    className="rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-600 outline-none focus:border-[#1e3a5f]/25"
                    aria-label="Regrouper par"
                  >
                    {HUB_GROUP_BY_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="ml-auto flex items-center gap-1 rounded-full border border-slate-200 bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => persistLayout("list")}
                    className={cn(
                      "rounded-full p-1.5",
                      layout === "list" ? "bg-bework-soft-navy text-bework-navy" : "text-slate-400",
                    )}
                    aria-label="Vue liste"
                    aria-pressed={layout === "list"}
                  >
                    <LayoutList className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => persistLayout("cards")}
                    className={cn(
                      "rounded-full p-1.5",
                      layout === "cards" ? "bg-bework-soft-navy text-bework-navy" : "text-slate-400",
                    )}
                    aria-label="Vue cartes"
                    aria-pressed={layout === "cards"}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => persistDensity("comfort")}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-medium",
                      density === "comfort" ? "bg-bework-soft-navy text-bework-navy" : "text-slate-400",
                    )}
                    aria-pressed={density === "comfort"}
                  >
                    Confort
                  </button>
                  <button
                    type="button"
                    onClick={() => persistDensity("compact")}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-medium",
                      density === "compact" ? "bg-bework-soft-navy text-bework-navy" : "text-slate-400",
                    )}
                    aria-pressed={density === "compact"}
                  >
                    Compact
                  </button>
                </div>
                <GedSecondaryButton
                  onClick={() => {
                    setSelectMode((v) => !v);
                    if (selectMode) setPicked(new Set());
                  }}
                >
                  {selectMode || picked.size > 0 ? "OK" : "Sélectionner"}
                </GedSecondaryButton>
                <GedSecondaryButton
                  onClick={() => {
                    setSaveViewOpen((o) => !o);
                    if (!saveViewName) {
                      setSaveViewName(
                        [docType && HUB_DOC_TYPES.find((t) => t.id === docType)?.label, company, projectTitle]
                          .filter(Boolean)
                          .join(" ") || "Ma vue",
                      );
                    }
                  }}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <BookmarkPlus className="h-3.5 w-3.5" />
                    Enregistrer
                  </span>
                </GedSecondaryButton>
              </>
            )}
          </div>

          {saveViewOpen ? (
            <form
              className="flex flex-wrap items-center gap-2 rounded-2xl border border-bework-navy/10 bg-white px-3 py-2"
              onSubmit={(e) => {
                e.preventDefault();
                saveCurrentView();
              }}
            >
              <input
                value={saveViewName}
                onChange={(e) => setSaveViewName(e.target.value)}
                placeholder="Ex. Factures Point.P"
                className="min-w-[12rem] flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-[13px] outline-none focus:border-bework-accent/40"
                aria-label="Nom de la vue"
              />
              <GedPrimaryButton type="submit">Enregistrer la vue</GedPrimaryButton>
              <button type="button" onClick={() => setSaveViewOpen(false)} className="text-[12px] text-slate-500">
                Annuler
              </button>
            </form>
          ) : null}

          {filtersOpen && !showCategoryCards ? (
            <div className="grid gap-3 rounded-2xl border border-bework-navy/10 bg-bework-soft-navy/40 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {hideProject ? null : (
                <label className="block text-[12px] font-medium text-slate-600">
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
              <label className="block text-[12px] font-medium text-slate-600">
                Type de document
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
              <label className="block text-[12px] font-medium text-slate-600">
                Catégorie
                <select
                  value={inCategory ? group : ""}
                  onChange={(e) =>
                    go({
                      view: e.target.value ? "categories" : "all",
                      group: e.target.value || "all",
                      page: "1",
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                >
                  <option value="">Toutes</option>
                  {HUB_CATEGORY_DEFS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[12px] font-medium text-slate-600">
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
                <label className="block text-[12px] font-medium text-slate-600">
                  Client / fournisseur
                  <select
                    value={company}
                    onChange={(e) => go({ company: e.target.value, page: "1" })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                  >
                    <option value="">Tous</option>
                    {companies.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className="block text-[12px] font-medium text-slate-600">
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
              <label className="block text-[12px] font-medium text-slate-600">
                Statut
                <select
                  value={view === "missing" || view === "classify" || view === "favorites" ? view : ""}
                  onChange={(e) =>
                    go({ view: (e.target.value || "all") as HubView, page: "1" })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                >
                  <option value="">Tous</option>
                  <option value="missing">À récupérer</option>
                  <option value="classify">À classer</option>
                  <option value="favorites">Favoris</option>
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
                  className="inline-flex items-center gap-1.5 rounded-full bg-bework-soft-navy px-2.5 py-1 text-[12px] font-medium text-slate-700 hover:bg-slate-200"
                >
                  {c.label}
                  <span aria-hidden className="text-slate-400">×</span>
                </button>
              ))}
              {chips.length > 0 ? (
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
                      view: "all",
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
          </div>

          {view === "missing" && items.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-bework-watch/20 bg-amber-50/40 px-3 py-2">
              <button
                type="button"
                onClick={() =>
                  setPicked(
                    picked.size === items.length ? new Set() : new Set(items.map((it) => it.id)),
                  )
                }
                className="rounded-full bg-white px-3 py-1 text-[12px] font-medium text-slate-700 shadow-sm"
              >
                {picked.size === items.length ? "Tout désélectionner" : "Tout sélectionner"}
              </button>
              <button
                type="button"
                onClick={bulkRetrieve}
                disabled={picked.size === 0}
                className="rounded-full bg-bework-watch px-3 py-1 text-[12px] font-medium text-white disabled:opacity-40"
              >
                Récupérer la sélection
              </button>
              {[...new Map(items.filter((it) => it.projectId).map((it) => [it.projectId, it.projectTitle || "Chantier"]))].map(
                ([id, title]) => (
                  <button
                    key={id}
                    type="button"
                    title={title}
                    onClick={() =>
                      setPicked(
                        new Set(items.filter((it) => it.projectId === id).map((it) => it.id)),
                      )
                    }
                    className="max-w-[14rem] truncate rounded-full border border-bework-watch/25 bg-white px-3 py-1 text-[12px] font-medium text-[#b45309]"
                  >
                    Tout sélectionner pour {title}
                  </button>
                ),
              )}
              <label className="inline-flex items-center gap-1 text-[12px] text-slate-600">
                Source
                <select
                  value={origin}
                  onChange={(e) => go({ origin: e.target.value, page: "1" })}
                  className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[12px]"
                >
                  <option value="">Toutes</option>
                  {HUB_ORIGIN_FILTERS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="inline-flex items-center gap-1 text-[12px] text-slate-600">
                Type
                <select
                  value={docType}
                  onChange={(e) => go({ docType: e.target.value, page: "1" })}
                  className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[12px]"
                >
                  {HUB_DOC_TYPES.map((t) => (
                    <option key={t.id || "all"} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}

          {showCategoryCards ? null : (
            <DocumentSelectionBar
              count={picked.size}
              totalOnPage={items.length}
              missingView={view === "missing"}
              canCategorize={!external}
              onSelectAll={() =>
                setPicked(
                  picked.size === items.length ? new Set() : new Set(items.map((it) => it.id)),
                )
              }
              onClear={() => setPicked(new Set())}
              onFavorite={external ? undefined : () => void bulkFavorite()}
              onCategorize={external ? undefined : (id) => void bulkCategorize(id)}
              onDownload={() => bulkDownload()}
              onRetrieve={view === "missing" ? bulkRetrieve : undefined}
              retrieveDisabled={picked.size === 0}
            />
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
            <div aria-busy={pending} className={cn(pending ? "opacity-70" : "")}>
              {renderList()}
            </div>
          )}

          {totalPages > 1 && !showCategoryCards ? (
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
        </div>
      </div>

      {navOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-900/25 lg:hidden" onClick={() => setNavOpen(false)}>
          <aside
            className="h-full w-[min(100%,20rem)] overflow-y-auto bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[15px] font-semibold text-bework-navy">Parcourir</p>
              <button type="button" onClick={() => setNavOpen(false)} aria-label="Fermer">
                ×
              </button>
            </div>
            {nav}
          </aside>
        </div>
      ) : null}

      {drawer ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/20"
          onClick={() => {
            setDrawer(null);
          }}
        >
          <div className="h-full w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <DocumentPreviewPanel
              variant="drawer"
              item={drawer}
              hideProject={hideProject}
              onOpen={() => openFile(drawer)}
              onFavorite={() => void toggleFavorite(drawer)}
              onRetrieve={() => openFile(drawer)}
              onCategorize={
                external || !drawer.chantierFileId
                  ? undefined
                  : (next) => void changeCategory(drawer, next as HubCategoryId)
              }
              categorizeOptions={HUB_CATEGORY_DEFS}
              catBusy={catBusy}
              onClose={() => setDrawer(null)}
              extraActions={
                <>
                  {drawer.chantierFileId && !drawer.isExpectedMissing && !external ? (
                    <button
                      type="button"
                      onClick={() => {
                        const next = window.prompt("Nouveau nom", drawer.title);
                        if (!next?.trim() || next.trim() === drawer.title) return;
                        void fetch(`/api/chantier/files/${drawer.chantierFileId}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ name: next.trim() }),
                        }).then((res) => {
                          if (res.ok) {
                            setDrawer(null);
                            router.refresh();
                          }
                        });
                      }}
                      className="rounded-full border border-slate-200 px-4 py-2 text-[13px] font-medium text-slate-700"
                    >
                      Renommer
                    </button>
                  ) : null}
                </>
              }
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ClassifyInbox({
  it,
  busy,
  onValidate,
}: {
  it: HubDocumentItem;
  busy: boolean;
  onValidate: (cat: HubCategoryId) => void;
}) {
  const [cat, setCat] = useState<HubCategoryId | "">(it.group === "all" || it.group === "autres" ? "" : it.group);
  const [edit, setEdit] = useState(false);
  const suggested = cat || (it.group !== "all" && it.group !== "autres" ? it.group : "");
  return (
    <div className="min-w-[12rem] rounded-xl border border-slate-200/80 bg-white px-2.5 py-2">
      <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[11px]">
        <dt className="text-slate-400">Type</dt>
        <dd className="truncate font-medium text-slate-700" title={it.typeLabel}>
          {edit ? (
            <select
              disabled={busy}
              value={cat}
              onChange={(e) => setCat(e.target.value as HubCategoryId)}
              className="w-full rounded-md border border-slate-200 bg-white px-1 py-0.5 text-[11px]"
              aria-label="Type"
            >
              <option value="">Choisir…</option>
              {HUB_CATEGORY_DEFS.filter((c) => c.id !== "autres").map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          ) : (
            it.typeLabel
          )}
        </dd>
        {it.projectTitle ? (
          <>
            <dt className="text-slate-400">Chantier</dt>
            <dd className="truncate text-slate-700" title={it.projectTitle}>
              {it.projectTitle}
            </dd>
          </>
        ) : null}
        {it.companyLabel ? (
          <>
            <dt className="text-slate-400">Entreprise</dt>
            <dd className="truncate text-slate-700" title={it.companyLabel}>
              {it.companyLabel}
            </dd>
          </>
        ) : null}
      </dl>
      <div className="mt-1.5 flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={() => setEdit((v) => !v)}
          className="rounded-full px-2 py-0.5 text-[11px] font-medium text-slate-500 hover:bg-slate-100"
        >
          {edit ? "OK" : "Modifier"}
        </button>
        <button
          type="button"
          disabled={busy || !suggested}
          onClick={() => suggested && onValidate(suggested as HubCategoryId)}
          className="rounded-full bg-[#1e3a5f] px-2.5 py-0.5 text-[11px] font-medium text-white disabled:opacity-40"
        >
          Valider
        </button>
      </div>
    </div>
  );
}
