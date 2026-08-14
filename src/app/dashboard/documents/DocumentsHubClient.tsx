"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DocumentPreviewModal, type DocumentPreviewItem } from "@/components/documents/DocumentPreviewModal";
import { GedDocumentRow } from "@/components/ged/GedDocumentRow";
import type { HubDocumentItem, HubGroup, HubSort, HubView } from "@/lib/ged/document-hub-ui";
import {
  HUB_DATE_FILTERS,
  HUB_DOC_TYPES,
  HUB_ORIGIN_FILTERS,
  formatGedShortDate,
  hubEmptyCopy,
  recentDayLabel,
  visibleHubViews,
} from "@/lib/ged/document-hub-ui";
import { cn } from "@/lib/cn";

const SORT_OPTIONS: { id: HubSort; label: string }[] = [
  { id: "recent", label: "Plus récents" },
  { id: "oldest", label: "Plus anciens" },
  { id: "name", label: "Nom A-Z" },
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
  const searchRef = useRef<HTMLInputElement>(null);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const isSupplier =
    personType === "SUPPLIER" || permissionProfile === "FOURNISSEUR";
  const isClient =
    personType === "CLIENT_EXT" || permissionProfile === "CLIENT";
  const external = isSupplier || isClient;
  const hideProject = Boolean(hideProjectFilter);

  const hasFilters = Boolean(projectId || origin || docType || company || since || (group !== "all"));
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

  const chips = useMemo(() => {
    const out: { key: string; label: string; clear: Record<string, string> }[] = [];
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
  }, [projectId, origin, docType, company, since, projects, hideProject]);

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
    <div className="mx-auto w-full max-w-[1040px] space-y-6 px-4 pb-16 pt-6 sm:px-6">
      <DocumentPreviewModal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        item={preview}
      />

      <header className="space-y-2">
        <h1 className="text-[2rem] font-semibold tracking-tight text-[#1e3a5f] sm:text-[2.25rem]">
          {title}
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-slate-500">{subtitle}</p>
      </header>

      <div className="relative">
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
          className="h-14 w-full rounded-2xl border border-slate-200/80 bg-white px-5 pr-12 text-[15px] text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-[#1e3a5f]/30 focus:ring-4 focus:ring-[#1e3a5f]/8"
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

      <nav className="flex gap-1 overflow-x-auto border-b border-slate-100 pb-px" aria-label="Vues documents">
        {shownViews.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() =>
              go({
                view: v.id,
                page: "1",
                ...(v.id === "recent" ? { sort: "recent" } : {}),
              })
            }
            className={cn(
              "shrink-0 border-b-2 px-3 py-2.5 text-[13px] font-medium transition",
              view === v.id
                ? "border-[#1e3a5f] text-[#1e3a5f]"
                : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            {v.label}
          </button>
        ))}
      </nav>

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
              <Info label="Référence" value={drawer.contextLabel} />
              {drawer.indice || drawer.versionLabel ? (
                <Info
                  label="Version"
                  value={[drawer.indice, drawer.isCurrentVersion ? "Actuelle" : drawer.versionLabel]
                    .filter(Boolean)
                    .join(" — ")}
                />
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
