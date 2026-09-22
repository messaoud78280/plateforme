"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutGrid,
  List,
  Plus,
  Search,
  Star,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  FolderTree,
} from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { WorkItemForm, type WorkItemFormRow } from "@/components/commercial/WorkItemForm";
import { MaterialDetailDrawer } from "@/components/commercial/MaterialDetailDrawer";
import { LibraryFamiliesManager } from "@/components/commercial/library/LibraryFamiliesManager";
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableRow,
  DataTableTd,
  DataTableTh,
} from "@/components/ui/DataTable";
import { displayMarquePercent, roundMoney } from "@/lib/commercial/money";
import { cn } from "@/lib/cn";
import type { LibraryHubRow, LibraryHubStats } from "@/components/commercial/LibraryHub";

const VIEW_KEY = "bework.library.viewMode";
const PAGE_SIZE = 50;

type Tab = "tous" | "ouvrages" | "materiaux" | "maindoeuvre" | "materiel" | "favoris";
type ViewMode = "table" | "cards";
type SortKey = "name" | "reference" | "price" | "updatedAt" | "family";

type FamilyNode = {
  family: string;
  count: number;
  subFamilies: Array<{ name: string; count: number }>;
};

function fmt(n: number) {
  return roundMoney(n, 2).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function detailHref(id: string, returnTo: string) {
  const q = new URLSearchParams({ from: returnTo });
  return `/dashboard/devis-facturation/bibliotheque/${id}?${q.toString()}`;
}

export function LibraryWorkspace({
  initialItems,
  initialTotal,
  stats,
  families: initialFamilies,
  materialsPreview,
  laborPreview,
  equipmentPreview = [],
  minMarginPercent = null,
  targetMarginPercent = null,
  initialCreateOpen = false,
}: {
  initialItems: LibraryHubRow[];
  initialTotal: number;
  stats: LibraryHubStats & {
    materiel?: number;
    families?: number;
    total?: number;
  };
  families: FamilyNode[];
  materialsPreview: Array<{
    id: string;
    name: string;
    unit: string;
    family: string | null;
    currentPriceHt: number;
    supplierName: string | null;
    preferredSupplierName: string | null;
    variationPercent: number | null;
    needsPriceReview: boolean;
    updatedAt: string | Date;
    referencePriceUpdatedAt: string | Date | null;
  }>;
  laborPreview: Array<{
    id: string;
    name: string;
    hourlyCostHt: number;
    loadedCostHt: number | null;
  }>;
  equipmentPreview?: Array<{
    id: string;
    name: string;
    unit: string;
    kind: string;
    hourlyCostHt: number | null;
    dailyCostHt: number | null;
  }>;
  minMarginPercent?: number | null;
  targetMarginPercent?: number | null;
  initialCreateOpen?: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("tous");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [family, setFamily] = useState("");
  const [subFamily, setSubFamily] = useState("");
  const [chip, setChip] = useState<"all" | "simple" | "compose" | "verify" | "archived">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [sort, setSort] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [families] = useState(initialFamilies);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<null | { mode: "create" }>(
    initialCreateOpen ? { mode: "create" } : null,
  );
  const [materialDrawerId, setMaterialDrawerId] = useState<string | null>(null);
  const [familiesOpen, setFamiliesOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY);
      if (saved === "table" || saved === "cards") setViewMode(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 280);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const returnTo = useMemo(() => {
    const p = new URLSearchParams();
    p.set("universe", "ouvrages");
    if (debouncedQ) p.set("q", debouncedQ);
    if (family) p.set("family", family);
    if (subFamily) p.set("subFamily", subFamily);
    if (chip !== "all") p.set("chip", chip);
    if (tab !== "tous") p.set("tab", tab);
    return `/dashboard/documents?${p.toString()}`;
  }, [debouncedQ, family, subFamily, chip, tab]);

  const fetchItems = useCallback(async () => {
    if (tab === "materiaux" || tab === "maindoeuvre" || tab === "materiel") return;
    setBusy(true);
    try {
      const p = new URLSearchParams();
      if (debouncedQ) p.set("q", debouncedQ);
      if (family) p.set("family", family);
      if (subFamily) p.set("subFamily", subFamily);
      if (tab === "favoris") p.set("favorite", "1");
      if (chip === "simple") p.set("kind", "SIMPLE");
      if (chip === "compose") p.set("kind", "COMPOSITE");
      if (chip === "verify") p.set("needsPriceRecalc", "1");
      if (chip === "archived") p.set("view", "archived");
      p.set("sort", sort);
      p.set("sortDir", sortDir);
      p.set("page", String(page));
      p.set("pageSize", String(PAGE_SIZE));
      const res = await fetch(`/api/commercial/library/work-items?${p.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de recherche");
      setItems(
        (data.workItems as LibraryHubRow[]).map((w) => ({
          ...w,
          unitCostHt: Number(w.unitCostHt),
          unitSellHt: Number(w.unitSellHt),
          marginPercent: Number(w.marginPercent),
        })),
      );
      setTotal(Number(data.total) || 0);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }, [tab, debouncedQ, family, subFamily, chip, sort, sortDir, page]);

  useEffect(() => {
    startTransition(() => {
      void fetchItems();
    });
  }, [fetchItems]);

  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [debouncedQ, family, subFamily, chip, tab, sort, sortDir]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function setView(mode: ViewMode) {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_KEY, mode);
    } catch {
      /* ignore */
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === items.length) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(items.map((i) => i.id)));
  }

  async function bulk(action: Record<string, unknown>, label: string) {
    if (selected.size === 0) return;
    setBusy(true);
    try {
      const res = await fetch("/api/commercial/library/work-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk", ids: Array.from(selected), ...action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setToast(`${data.updated ?? selected.size} référence(s) — ${label}`);
      setSelected(new Set());
      await fetchItems();
      router.refresh();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function toggleFavorite(item: LibraryHubRow) {
    try {
      const res = await fetch(`/api/commercial/library/work-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "favorite", isFavorite: !item.isFavorite }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setItems((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, isFavorite: !item.isFavorite } : x)),
      );
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Erreur");
    }
  }

  const activeFilters: Array<{ key: string; label: string; clear: () => void }> = [];
  if (family) {
    activeFilters.push({
      key: "family",
      label: family,
      clear: () => {
        setFamily("");
        setSubFamily("");
      },
    });
  }
  if (subFamily) {
    activeFilters.push({
      key: "sub",
      label: subFamily,
      clear: () => setSubFamily(""),
    });
  }
  if (chip !== "all") {
    activeFilters.push({
      key: "chip",
      label:
        chip === "simple"
          ? "Prix direct"
          : chip === "compose"
            ? "Prix calculé"
            : chip === "verify"
              ? "À vérifier"
              : "Archivés",
      clear: () => setChip("all"),
    });
  }
  if (debouncedQ) {
    activeFilters.push({
      key: "q",
      label: `« ${debouncedQ} »`,
      clear: () => setQ(""),
    });
  }

  const showOuvrages = tab === "tous" || tab === "ouvrages" || tab === "favoris";
  const materielCount = stats.materiel ?? equipmentPreview.length;

  return (
    <div className="space-y-5">
      {/* Indicateurs */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Références", value: stats.total ?? stats.ouvrages + stats.materiaux + stats.mainOeuvre + materielCount },
          { label: "Familles", value: stats.families ?? families.length },
          { label: "Ouvrages", value: stats.ouvrages, onClick: () => setTab("ouvrages") },
          { label: "Matériaux", value: stats.materiaux, onClick: () => setTab("materiaux") },
          { label: "Matériel", value: materielCount, onClick: () => setTab("materiel") },
          {
            label: "À vérifier",
            value: stats.needsRecalc,
            onClick: () => {
              setTab("ouvrages");
              setChip("verify");
            },
            warn: stats.needsRecalc > 0,
          },
        ].map((k) => (
          <button
            key={k.label}
            type="button"
            onClick={k.onClick}
            disabled={!k.onClick}
            className={cn(
              "rounded-2xl border border-[#1e3a5f]/10 bg-gradient-to-b from-white to-[#f7f9fc] px-3 py-2.5 text-left shadow-[0_1px_2px_rgba(30,58,95,0.04)] transition",
              k.onClick && "hover:-translate-y-px hover:border-[#1e3a5f]/20",
              k.warn && "border-amber-200/80 from-amber-50/40",
            )}
          >
            <p className="text-[1.25rem] font-semibold tabular-nums leading-none text-[#1e3a5f]">
              {k.value}
            </p>
            <p className="mt-1.5 text-[11px] font-medium text-slate-500">{k.label}</p>
          </button>
        ))}
      </div>

      {/* Barre d’actions */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un ouvrage, une référence, un matériau…"
            className="h-12 w-full rounded-2xl border border-[#1e3a5f]/12 bg-white pl-11 pr-4 text-sm text-[#1e3a5f] shadow-[0_1px_2px_rgba(30,58,95,0.05)] outline-none ring-[#1e3a5f]/15 placeholder:text-slate-400 focus:border-[#1e3a5f]/30 focus:ring-2"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className={cn(
              "inline-flex h-11 items-center gap-2 rounded-xl border border-[#1e3a5f]/12 bg-white px-3.5 text-sm font-medium text-[#1e3a5f] transition hover:bg-[#f7f9fc]",
              filtersOpen && "border-[#1e3a5f]/30 bg-[#1e3a5f]/5",
            )}
          >
            <Filter className="h-4 w-4" />
            Filtres
          </button>
          <button
            type="button"
            onClick={() => setFamiliesOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#1e3a5f]/12 bg-white px-3.5 text-sm font-medium text-[#1e3a5f] transition hover:bg-[#f7f9fc]"
          >
            <FolderTree className="h-4 w-4" />
            Familles
          </button>
          <a
            href="/api/commercial/library/work-items?format=csv"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#1e3a5f]/12 bg-white px-3.5 text-sm font-medium text-[#1e3a5f] transition hover:bg-[#f7f9fc]"
          >
            <Download className="h-4 w-4" />
            Exporter
          </a>
          <button
            type="button"
            onClick={() => setDrawer({ mode: "create" })}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1e3a5f] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#274866]"
          >
            <Plus className="h-4 w-4" />
            Créer
          </button>
        </div>
      </div>

      {/* Tabs type */}
      <div className="flex flex-wrap gap-1 border-b border-[#1e3a5f]/10 pb-px">
        {(
          [
            ["tous", "Tous", stats.ouvrages],
            ["ouvrages", "Ouvrages", stats.ouvrages],
            ["materiaux", "Matériaux", stats.materiaux],
            ["maindoeuvre", "Main-d’œuvre", stats.mainOeuvre],
            ["materiel", "Matériel", materielCount],
            ["favoris", "Favoris", stats.favorites],
          ] as const
        ).map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition",
              tab === id
                ? "border-[#1e3a5f] text-[#1e3a5f]"
                : "border-transparent text-slate-500 hover:text-[#1e3a5f]",
            )}
          >
            {label}
            <span className="ml-1.5 tabular-nums text-slate-400">{count}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Familles */}
        <aside className="hidden lg:block">
          <div className="sticky top-4 rounded-2xl border border-[#1e3a5f]/10 bg-white p-3 shadow-[0_1px_2px_rgba(30,58,95,0.04)]">
            <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Familles
            </p>
            <button
              type="button"
              onClick={() => {
                setFamily("");
                setSubFamily("");
              }}
              className={cn(
                "mt-2 flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-sm transition",
                !family ? "bg-[#1e3a5f]/8 font-semibold text-[#1e3a5f]" : "text-slate-600 hover:bg-slate-50",
              )}
            >
              Toutes
              <span className="tabular-nums text-xs text-slate-400">{stats.ouvrages}</span>
            </button>
            <div className="mt-1 max-h-[60vh] space-y-0.5 overflow-y-auto">
              {families.map((f) => (
                <div key={f.family}>
                  <button
                    type="button"
                    onClick={() => {
                      setFamily(f.family === "Sans famille" ? "" : f.family);
                      setSubFamily("");
                      setTab("ouvrages");
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-sm transition",
                      family === f.family
                        ? "bg-[#1e3a5f]/8 font-semibold text-[#1e3a5f]"
                        : "text-slate-700 hover:bg-slate-50",
                    )}
                  >
                    <span className="truncate pr-2">{f.family}</span>
                    <span className="tabular-nums text-xs text-slate-400">{f.count}</span>
                  </button>
                  {family === f.family && f.subFamilies.length > 0 ? (
                    <div className="mb-1 ml-2 space-y-0.5 border-l border-[#1e3a5f]/10 pl-2">
                      {f.subFamilies.map((s) => (
                        <button
                          key={s.name}
                          type="button"
                          onClick={() => setSubFamily(s.name)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[13px] transition",
                            subFamily === s.name
                              ? "bg-[#1e3a5f]/10 font-medium text-[#1e3a5f]"
                              : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
                          )}
                        >
                          <span className="truncate pr-2">{s.name}</span>
                          <span className="tabular-nums text-[11px] text-slate-400">{s.count}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-3">
          {filtersOpen || activeFilters.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {showOuvrages
                ? (
                    [
                      ["all", "Tous"],
                      ["simple", "Prix direct"],
                      ["compose", "Prix calculé"],
                      ["verify", "À vérifier"],
                      ["archived", "Archivés"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setChip(id)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition",
                        chip === id
                          ? "border-[#1e3a5f] bg-[#1e3a5f] text-white"
                          : "border-[#1e3a5f]/12 bg-white text-slate-600 hover:border-[#1e3a5f]/25",
                      )}
                    >
                      {label}
                    </button>
                  ))
                : null}
              {activeFilters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={f.clear}
                  className="inline-flex items-center gap-1 rounded-full border border-[#1e3a5f]/15 bg-[#1e3a5f]/5 px-2.5 py-1 text-xs font-medium text-[#1e3a5f]"
                >
                  {f.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
              {activeFilters.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setQ("");
                    setFamily("");
                    setSubFamily("");
                    setChip("all");
                  }}
                  className="text-xs font-medium text-slate-500 underline-offset-2 hover:underline"
                >
                  Réinitialiser
                </button>
              ) : null}
            </div>
          ) : null}

          {showOuvrages ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-slate-500">
                  <span className="font-semibold tabular-nums text-[#1e3a5f]">{total}</span>{" "}
                  référence{total > 1 ? "s" : ""}
                  {(busy || pending) && (
                    <span className="ml-2 text-slate-400">· recherche…</span>
                  )}
                </p>
                <div className="flex items-center gap-1 rounded-xl border border-[#1e3a5f]/10 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setView("table")}
                    className={cn(
                      "rounded-lg p-2 transition",
                      viewMode === "table" ? "bg-[#1e3a5f] text-white" : "text-slate-500 hover:bg-slate-50",
                    )}
                    aria-label="Mode tableau"
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("cards")}
                    className={cn(
                      "rounded-lg p-2 transition",
                      viewMode === "cards" ? "bg-[#1e3a5f] text-white" : "text-slate-500 hover:bg-slate-50",
                    )}
                    aria-label="Mode cartes"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {selected.size > 0 ? (
                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#1e3a5f]/15 bg-[#1e3a5f]/5 px-3 py-2.5">
                  <span className="text-sm font-semibold text-[#1e3a5f]">
                    {selected.size} sélectionnée{selected.size > 1 ? "s" : ""}
                  </span>
                  <button
                    type="button"
                    className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-[#1e3a5f] shadow-sm"
                    onClick={() => {
                      const next = window.prompt("Nouvelle famille :", family || "");
                      if (next == null) return;
                      void bulk({ family: next.trim() || null }, "famille mise à jour");
                    }}
                  >
                    Changer famille
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-[#1e3a5f] shadow-sm"
                    onClick={() => void bulk({ isFavorite: true }, "ajoutées aux favoris")}
                  >
                    Favoris
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-amber-800 shadow-sm"
                    onClick={() => {
                      if (!confirm(`Archiver ${selected.size} référence(s) ?`)) return;
                      void bulk({ isActive: false }, "archivées");
                    }}
                  >
                    Archiver
                  </button>
                  <button
                    type="button"
                    className="ml-auto text-xs text-slate-500"
                    onClick={() => setSelected(new Set())}
                  >
                    Annuler
                  </button>
                </div>
              ) : null}

              {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#1e3a5f]/15 bg-white px-6 py-16 text-center">
                  <p className="text-base font-semibold text-[#1e3a5f]">Aucun ouvrage trouvé</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Modifiez la recherche ou créez une nouvelle référence.
                  </p>
                  <button
                    type="button"
                    onClick={() => setDrawer({ mode: "create" })}
                    className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#1e3a5f] px-4 text-sm font-semibold text-white"
                  >
                    <Plus className="h-4 w-4" />
                    Créer un ouvrage
                  </button>
                </div>
              ) : viewMode === "table" ? (
                <DataTable minWidth="920px">
                  <DataTableHead>
                    <DataTableTh className="w-10">
                      <input
                        type="checkbox"
                        checked={selected.size > 0 && selected.size === items.length}
                        onChange={toggleSelectAll}
                        aria-label="Tout sélectionner"
                      />
                    </DataTableTh>
                    <DataTableTh>
                      <SortBtn
                        label="Référence"
                        active={sort === "reference"}
                        dir={sortDir}
                        onClick={() => {
                          setSort("reference");
                          setSortDir(sort === "reference" && sortDir === "asc" ? "desc" : "asc");
                        }}
                      />
                    </DataTableTh>
                    <DataTableTh>
                      <SortBtn
                        label="Désignation"
                        active={sort === "name"}
                        dir={sortDir}
                        onClick={() => {
                          setSort("name");
                          setSortDir(sort === "name" && sortDir === "asc" ? "desc" : "asc");
                        }}
                      />
                    </DataTableTh>
                    <DataTableTh>
                      <SortBtn
                        label="Famille"
                        active={sort === "family"}
                        dir={sortDir}
                        onClick={() => {
                          setSort("family");
                          setSortDir(sort === "family" && sortDir === "asc" ? "desc" : "asc");
                        }}
                      />
                    </DataTableTh>
                    <DataTableTh>Unité</DataTableTh>
                    <DataTableTh align="right">
                      <SortBtn
                        label="PV HT"
                        active={sort === "price"}
                        dir={sortDir}
                        onClick={() => {
                          setSort("price");
                          setSortDir(sort === "price" && sortDir === "asc" ? "desc" : "asc");
                        }}
                      />
                    </DataTableTh>
                    <DataTableTh>Type</DataTableTh>
                    <DataTableTh>Statut</DataTableTh>
                    <DataTableTh className="w-10">{""}</DataTableTh>
                  </DataTableHead>
                  <DataTableBody>
                    {items.map((item) => {
                      const marque = displayMarquePercent({
                        unitCostHt: item.unitCostHt,
                        unitSellHt: item.unitSellHt,
                        marginPercent: item.marginPercent,
                        componentCount: 0,
                      });
                      return (
                        <DataTableRow key={item.id} className="group">
                          <DataTableTd>
                            <input
                              type="checkbox"
                              checked={selected.has(item.id)}
                              onChange={() => toggleSelect(item.id)}
                              aria-label={`Sélectionner ${item.name}`}
                            />
                          </DataTableTd>
                          <DataTableTd>
                            <Link
                              href={detailHref(item.id, returnTo)}
                              className="font-mono text-[12px] text-slate-500 hover:text-[#1e3a5f]"
                            >
                              {item.reference || "—"}
                            </Link>
                          </DataTableTd>
                          <DataTableTd>
                            <Link
                              href={detailHref(item.id, returnTo)}
                              className="font-medium text-[#1e3a5f] hover:underline"
                            >
                              {item.name}
                            </Link>
                          </DataTableTd>
                          <DataTableTd>
                            <span className="text-slate-600">{item.family || "—"}</span>
                            {item.subFamily ? (
                              <span className="block text-[11px] text-slate-400">{item.subFamily}</span>
                            ) : null}
                          </DataTableTd>
                          <DataTableTd>{item.saleUnit}</DataTableTd>
                          <DataTableTd align="right" className="tabular-nums font-medium text-[#1e3a5f]">
                            {item.unitSellHt > 0 ? `${fmt(item.unitSellHt)} €` : "—"}
                          </DataTableTd>
                          <DataTableTd>
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                              {item.kind === "COMPOSITE" ? "Calculé" : "Direct"}
                            </span>
                          </DataTableTd>
                          <DataTableTd>
                            {!item.isActive ? (
                              <span className="text-[11px] font-medium text-slate-400">Archivé</span>
                            ) : item.needsPriceRecalc ? (
                              <span className="text-[11px] font-medium text-amber-700">À vérifier</span>
                            ) : marque == null ? (
                              <span className="text-[11px] text-slate-400">Coût n/r</span>
                            ) : (
                              <span className="text-[11px] tabular-nums text-slate-500">
                                {fmt(marque)} %
                              </span>
                            )}
                          </DataTableTd>
                          <DataTableTd>
                            <button
                              type="button"
                              onClick={() => void toggleFavorite(item)}
                              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-amber-50 hover:text-amber-600"
                              aria-label="Favori"
                            >
                              <Star
                                className={cn(
                                  "h-4 w-4",
                                  item.isFavorite && "fill-amber-400 text-amber-500",
                                )}
                              />
                            </button>
                          </DataTableTd>
                        </DataTableRow>
                      );
                    })}
                  </DataTableBody>
                </DataTable>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((item) => (
                    <Link
                      key={item.id}
                      href={detailHref(item.id, returnTo)}
                      className="group rounded-2xl border border-[#1e3a5f]/10 bg-white p-4 shadow-[0_1px_2px_rgba(30,58,95,0.04)] transition hover:-translate-y-0.5 hover:border-[#1e3a5f]/20 hover:shadow-md"
                    >
                      <div className="mb-3 flex h-28 items-center justify-center rounded-xl bg-gradient-to-br from-[#eef2f7] to-[#f8fafc]">
                        <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                          Sans photo
                        </span>
                      </div>
                      <p className="line-clamp-2 text-sm font-semibold text-[#1e3a5f]">{item.name}</p>
                      <p className="mt-1 font-mono text-[11px] text-slate-400">
                        {item.reference || "Sans réf."}
                      </p>
                      <div className="mt-3 flex items-end justify-between gap-2">
                        <span className="text-[11px] text-slate-500">{item.family || "—"}</span>
                        <span className="text-sm font-semibold tabular-nums text-[#1e3a5f]">
                          {item.unitSellHt > 0 ? `${fmt(item.unitSellHt)} €` : "—"}
                          <span className="ml-1 text-[11px] font-normal text-slate-400">
                            / {item.saleUnit}
                          </span>
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {pageCount > 1 ? (
                <div className="flex items-center justify-between gap-3 pt-1">
                  <p className="text-xs text-slate-500">
                    Page {page} / {pageCount}
                  </p>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#1e3a5f]/12 bg-white disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={page >= pageCount}
                      onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#1e3a5f]/12 bg-white disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          ) : tab === "materiaux" ? (
            <ResourceList
              title="Matériaux"
              empty="Aucun matériau catalogue."
              rows={materialsPreview.map((m) => ({
                id: m.id,
                title: m.name,
                meta: m.family || m.unit,
                value: `${fmt(m.currentPriceHt)} € / ${m.unit}`,
                onClick: () => setMaterialDrawerId(m.id),
              }))}
            />
          ) : tab === "maindoeuvre" ? (
            <ResourceList
              title="Main-d’œuvre"
              empty="Aucune ressource MO."
              rows={laborPreview.map((l) => ({
                id: l.id,
                title: l.name,
                meta: "Horaire",
                value: `${fmt(l.loadedCostHt ?? l.hourlyCostHt)} € / h`,
              }))}
            />
          ) : (
            <ResourceList
              title="Matériel"
              empty="Aucun matériel."
              rows={equipmentPreview.map((e) => ({
                id: e.id,
                title: e.name,
                meta: e.kind,
                value:
                  e.dailyCostHt != null
                    ? `${fmt(e.dailyCostHt)} € / j`
                    : e.hourlyCostHt != null
                      ? `${fmt(e.hourlyCostHt)} € / h`
                      : "—",
              }))}
            />
          )}
        </div>
      </div>

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      {drawer?.mode === "create" ? (
        <Drawer open onClose={() => setDrawer(null)} title="Nouvel ouvrage" widthClass="max-w-2xl">
          <WorkItemForm
            mode="create"
            layout="drawer"
            onSaved={(row) => {
              setDrawer(null);
              if (row?.id) {
                router.push(detailHref(row.id, returnTo));
              } else {
                void fetchItems();
                router.refresh();
              }
            }}
            onCancel={() => setDrawer(null)}
          />
        </Drawer>
      ) : null}

      <MaterialDetailDrawer
        materialId={materialDrawerId}
        open={Boolean(materialDrawerId)}
        onClose={() => setMaterialDrawerId(null)}
        onChanged={() => router.refresh()}
      />

      <LibraryFamiliesManager
        open={familiesOpen}
        onClose={() => setFamiliesOpen(false)}
        onChanged={() => {
          void fetchItems();
          router.refresh();
        }}
      />
    </div>
  );
}

function SortBtn({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 hover:text-[#1e3a5f]">
      {label}
      {active ? <span className="text-[10px]">{dir === "asc" ? "↑" : "↓"}</span> : null}
    </button>
  );
}

function ResourceList({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: Array<{ id: string; title: string; meta: string; value: string; onClick?: () => void }>;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#1e3a5f]/15 bg-white px-6 py-12 text-center text-sm text-slate-500">
        {empty}
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-[#1e3a5f]/10 bg-white">
      <div className="border-b border-[#1e3a5f]/8 px-4 py-3 text-sm font-semibold text-[#1e3a5f]">
        {title}
      </div>
      <ul className="divide-y divide-[#1e3a5f]/6">
        {rows.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={r.onClick}
              disabled={!r.onClick}
              className={cn(
                "flex w-full items-center justify-between gap-3 px-4 py-3 text-left",
                r.onClick && "hover:bg-slate-50",
              )}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[#1e3a5f]">{r.title}</p>
                <p className="text-[11px] text-slate-400">{r.meta}</p>
              </div>
              <span className="shrink-0 text-sm tabular-nums text-slate-600">{r.value}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
