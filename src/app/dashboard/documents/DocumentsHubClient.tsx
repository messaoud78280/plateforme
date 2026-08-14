"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { HubDocumentItem, HubGroup, HubSort, HubView } from "@/lib/ged/document-hub-ui";
import { hubEmptyCopy, provenanceSummary, recentDayLabel } from "@/lib/ged/document-hub-ui";
import { GED_ORIGIN_LABELS, type GedOrigin } from "@/lib/ged/origin";
import { cn } from "@/lib/cn";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const SORT_OPTIONS: { id: HubSort; label: string }[] = [
  { id: "recent", label: "Plus récents" },
  { id: "oldest", label: "Plus anciens" },
  { id: "name", label: "Nom" },
];

const ORIGIN_FILTERS = Object.entries(GED_ORIGIN_LABELS) as [GedOrigin, string][];

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
  views,
  groups,
  projects,
  canUploadChantier,
  personType,
  permissionProfile,
  hostCompany,
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
  views: { id: HubView; label: string }[];
  groups: { id: HubGroup; label: string }[];
  projects: { id: string; title: string }[];
  canUploadChantier: boolean;
  personType?: string | null;
  permissionProfile?: string | null;
  hostCompany?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(search);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [drawer, setDrawer] = useState<HubDocumentItem | null>(null);
  const [favBusy, setFavBusy] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const isSupplier =
    personType === "SUPPLIER" || permissionProfile === "FOURNISSEUR";
  const isClient =
    personType === "CLIENT_EXT" || permissionProfile === "CLIENT";
  const external = isSupplier || isClient;

  const empty = hubEmptyCopy({
    group,
    view,
    personType,
    permissionProfile,
    hostCompany,
  });

  useEffect(() => {
    setQ(search);
  }, [search]);

  useEffect(() => {
    if (q === search) return;
    const t = window.setTimeout(() => {
      go({ q, page: "1" });
    }, 320);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function go(updates: Record<string, string>) {
    const p = new URLSearchParams();
    const nextView = updates.view ?? view;
    const nextGroup = updates.group ?? group;
    const nextQ = updates.q !== undefined ? updates.q : search;
    const nextSort = updates.sort ?? sort;
    const nextPage = updates.page ?? "1";
    const nextProject = updates.projectId !== undefined ? updates.projectId : projectId;
    const nextOrigin = updates.origin !== undefined ? updates.origin : origin;
    if (nextView && nextView !== "all") p.set("view", nextView);
    if (nextGroup && nextGroup !== "all") p.set("group", nextGroup);
    if (nextQ) p.set("q", nextQ);
    if (nextSort && nextSort !== "recent") p.set("sort", nextSort);
    if (nextProject) p.set("projectId", nextProject);
    if (nextOrigin) p.set("origin", nextOrigin);
    if (nextPage !== "1") p.set("page", nextPage);
    const qs = p.toString();
    startTransition(() => {
      router.push(qs ? `/dashboard/documents?${qs}` : "/dashboard/documents");
    });
  }

  const chips = useMemo(() => {
    const out: { key: string; label: string; clear: Record<string, string> }[] = [];
    if (projectId) {
      const t = projects.find((p) => p.id === projectId)?.title ?? "Chantier";
      out.push({ key: "project", label: `Chantier : ${t}`, clear: { projectId: "", page: "1" } });
    }
    if (origin) {
      out.push({
        key: "origin",
        label: `Source : ${GED_ORIGIN_LABELS[origin as GedOrigin] ?? origin}`,
        clear: { origin: "", page: "1" },
      });
    }
    if (group !== "all") {
      const gl = groups.find((g) => g.id === group)?.label ?? group;
      out.push({ key: "group", label: `Type : ${gl}`, clear: { group: "all", page: "1" } });
    }
    return out;
  }, [projectId, origin, group, projects, groups]);

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
    if (!it.chantierFileId) return;
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

  const title = external ? "Documents partagés" : "Documents";
  const subtitle = external
    ? isSupplier
      ? `Documents échangés avec ${hostCompany?.trim() || "votre client"}.`
      : `Documents que ${hostCompany?.trim() || "votre entreprise"} partage avec vous.`
    : "Retrouvez tous les documents de votre entreprise, où qu’ils aient été ajoutés.";

  return (
    <div className="mx-auto w-full max-w-[920px] space-y-8 px-4 pb-16 pt-6 sm:px-6">
      <header className="space-y-2">
        <h1 className="text-[2rem] font-semibold tracking-tight text-[#1e3a5f] sm:text-[2.25rem]">
          {title}
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-slate-500">{subtitle}</p>
      </header>

      <div className="relative">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              go({ q, page: "1" });
            }
          }}
          placeholder="Rechercher un document, chantier, fournisseur, référence…"
          className="h-14 w-full rounded-2xl border border-slate-200/80 bg-white px-5 text-[15px] text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-[#1e3a5f]/30 focus:ring-4 focus:ring-[#1e3a5f]/8"
          aria-label="Rechercher un document"
          autoComplete="off"
        />
        {pending ? (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">…</span>
        ) : null}
      </div>

      <nav className="flex gap-1 overflow-x-auto border-b border-slate-100 pb-px" aria-label="Vues documents">
        {views.map((v) => (
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
        {canUploadChantier && projects[0] ? (
          <Link
            href={`/dashboard/projets/${projectId || projects[0].id}#tab-documents`}
            className="rounded-full bg-[#1e3a5f] px-3.5 py-1.5 text-[13px] font-medium text-white hover:bg-[#16304f]"
          >
            Ajouter
          </Link>
        ) : null}
      </div>

      {filtersOpen ? (
        <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-3">
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
          <label className="block text-[12px] font-medium text-slate-500">
            Source
            <select
              value={origin}
              onChange={(e) => go({ origin: e.target.value, page: "1" })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
            >
              <option value="">Toutes</option>
              {ORIGIN_FILTERS.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[12px] font-medium text-slate-500">
            Type
            <select
              value={group}
              onChange={(e) => go({ group: e.target.value, page: "1" })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
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
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-lg font-medium text-slate-800">{empty.title}</p>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-slate-500">
            {empty.body}
          </p>
          {canUploadChantier && projects[0] ? (
            <Link
              href={`/dashboard/projets/${projects[0].id}#tab-documents`}
              className="mt-6 inline-flex rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white"
            >
              Ajouter un document
            </Link>
          ) : null}
        </div>
      ) : groupedRecent ? (
        <div className="space-y-8">
          {groupedRecent.map(([day, docs]) => (
            <section key={day}>
              <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                {day}
              </h2>
              <ul className="divide-y divide-slate-100">
                {docs.map((it) => (
                  <DocRow
                    key={it.id}
                    it={it}
                    onOpen={() => setDrawer(it)}
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
            <DocRow
              key={it.id}
              it={it}
              onOpen={() => setDrawer(it)}
              onFavorite={() => void toggleFavorite(it)}
              favBusy={favBusy === it.id}
            />
          ))}
        </ul>
      )}

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
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20" onClick={() => setDrawer(null)}>
          <aside
            className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={drawer.title}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
              <h2 className="text-lg font-semibold leading-snug text-slate-900">{drawer.title}</h2>
              <button type="button" onClick={() => setDrawer(null)} className="text-slate-400 hover:text-slate-700" aria-label="Fermer">
                ×
              </button>
            </div>
            <dl className="flex-1 space-y-4 overflow-y-auto px-6 py-5 text-[14px]">
              <Info label="Type" value={drawer.typeLabel} />
              <Info label="Chantier" value={drawer.projectTitle} />
              <Info label="Entreprise" value={drawer.companyLabel} />
              <Info label="Date" value={fmtDate(drawer.createdAt)} />
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
              <Info label="Visibilité" value={drawer.visibility} />
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
                <Link
                  href={drawer.href}
                  className="rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white"
                >
                  Ouvrir
                </Link>
              )}
              {drawer.originHref && drawer.originActionLabel ? (
                <Link
                  href={drawer.originHref}
                  className="rounded-full border border-slate-200 px-4 py-2 text-[13px] font-medium text-slate-700"
                >
                  {drawer.originActionLabel}
                </Link>
              ) : null}
              {drawer.chantierFileId ? (
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

function DocRow({
  it,
  onOpen,
  onFavorite,
  favBusy,
}: {
  it: HubDocumentItem;
  onOpen: () => void;
  onFavorite: () => void;
  favBusy: boolean;
}) {
  const missing = Boolean(it.isExpectedMissing);
  return (
    <li>
      <div className="flex items-start gap-3 py-3.5">
        <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
          <p className="truncate text-[15px] font-medium text-slate-900">{it.title}</p>
          <p className="mt-0.5 text-[12px] font-medium uppercase tracking-[0.08em] text-slate-400">
            {missing ? "À récupérer" : it.typeLabel}
          </p>
          <p className="mt-1 text-[13px] text-slate-600">{provenanceSummary(it)}</p>
          <p className="mt-0.5 text-[12px] text-slate-400">{fmtDate(it.createdAt)}</p>
        </button>
        <div className="flex shrink-0 flex-col items-end gap-2 pt-0.5">
          {it.chantierFileId ? (
            <button
              type="button"
              onClick={onFavorite}
              disabled={favBusy}
              className={cn(
                "text-[15px] leading-none",
                it.isFavorite ? "text-amber-500" : "text-slate-300 hover:text-amber-400",
              )}
              aria-label={it.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              ★
            </button>
          ) : null}
          <button type="button" onClick={onOpen} className="text-[13px] font-medium text-[#1e3a5f]">
            {missing ? "Ajouter le document" : "Ouvrir"}
          </button>
        </div>
      </div>
    </li>
  );
}
