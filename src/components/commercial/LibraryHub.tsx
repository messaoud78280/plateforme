"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, Search, Sparkles, Star, Wrench } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { HeaderDropdown } from "@/components/ui/HeaderDropdown";
import { WorkItemForm, type WorkItemFormRow } from "@/components/commercial/WorkItemForm";
import { MaterialDetailDrawer } from "@/components/commercial/MaterialDetailDrawer";
import { marginPercentFromCostSell, roundMoney } from "@/lib/commercial/money";
import { cn } from "@/lib/cn";

export type LibraryHubRow = {
  id: string;
  name: string;
  reference: string | null;
  family: string | null;
  subFamily: string | null;
  saleUnit: string;
  unitCostHt: number;
  unitSellHt: number;
  marginPercent: number;
  kind: string;
  isActive: boolean;
  isFavorite: boolean;
  needsPriceRecalc: boolean;
  quoteLineCount: number;
  updatedAt: string | Date;
  description?: string | null;
};

export type LibraryHubStats = {
  ouvrages: number;
  materiaux: number;
  mainOeuvre: number;
  needsRecalc: number;
  favorites: number;
};

type Tab = "ouvrages" | "materiaux" | "maindoeuvre" | "favoris";
type Chip = "all" | "simple" | "compose" | "verify" | "archived";
type MarginFilter = "all" | "below_min" | "above_target";

function fmt(n: number) {
  return roundMoney(n, 2).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function relativeUpdated(d: string | Date) {
  const t = new Date(d).getTime();
  if (Number.isNaN(t)) return "";
  const days = Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
  if (days === 0) return "Mis à jour aujourd’hui";
  if (days === 1) return "Mis à jour hier";
  if (days < 30) return `Mis à jour il y a ${days} jours`;
  return `Mis à jour le ${new Date(d).toLocaleDateString("fr-FR")}`;
}

function marqueOf(w: LibraryHubRow) {
  return (
    w.marginPercent ||
    marginPercentFromCostSell(w.unitCostHt, w.unitSellHt)
  );
}

function formatSaleUnit(unit: string) {
  const u = unit.trim().toLowerCase();
  if (u === "ens" || u === "ens.") return "Ensemble";
  return unit;
}

function updatedAtMs(d: string | Date) {
  const t = new Date(d).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function marginBadgeClass(
  marge: number,
  missingPrice: boolean,
  minMarginPercent: number | null | undefined,
  targetMarginPercent: number | null | undefined,
) {
  if (missingPrice) return "badge-cc badge-cc-neutral";
  const hasMin = minMarginPercent != null;
  const hasTarget = targetMarginPercent != null;
  if (!hasMin && !hasTarget) return "badge-cc badge-cc-neutral";
  if (hasMin && marge < minMarginPercent!) return "badge-cc badge-cc-critical";
  if (hasTarget && marge < targetMarginPercent!) return "badge-cc badge-cc-watch";
  if (hasTarget && marge >= targetMarginPercent!) return "badge-cc badge-cc-ok";
  return "badge-cc badge-cc-neutral";
}

export function LibraryHub({
  initialItems,
  stats,
  materialsPreview,
  laborPreview,
  minMarginPercent = null,
  targetMarginPercent = null,
}: {
  initialItems: LibraryHubRow[];
  stats: LibraryHubStats;
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
  minMarginPercent?: number | null;
  targetMarginPercent?: number | null;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("ouvrages");
  const [chip, setChip] = useState<Chip>("all");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [familyFilter, setFamilyFilter] = useState("");
  const [marginFilter, setMarginFilter] = useState<MarginFilter>("all");
  const [items, setItems] = useState(initialItems);
  const [toast, setToast] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<
    null | { mode: "create" } | { mode: "edit"; id: string }
  >(null);
  const [materialDrawerId, setMaterialDrawerId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const hasMarginSettings =
    minMarginPercent != null || targetMarginPercent != null;

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 220);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const families = useMemo(() => {
    const set = new Set<string>();
    for (const i of items) {
      if (i.family) set.add(i.family);
    }
    for (const m of materialsPreview) {
      if (m.family) set.add(m.family);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [items, materialsPreview]);

  const filtered = useMemo(() => {
    let list = items;
    if (tab === "favoris") list = list.filter((i) => i.isFavorite && i.isActive);
    if (chip === "simple") list = list.filter((i) => i.kind === "SIMPLE");
    if (chip === "compose") list = list.filter((i) => i.kind === "COMPOSITE");
    if (chip === "verify") list = list.filter((i) => i.needsPriceRecalc);
    if (chip === "archived") list = list.filter((i) => !i.isActive);
    if (chip !== "archived" && tab !== "favoris") {
      list = list.filter((i) => i.isActive);
    }
    if (familyFilter) {
      list = list.filter((i) => i.family === familyFilter);
    }
    if (hasMarginSettings && marginFilter !== "all") {
      list = list.filter((i) => {
        if (!(i.unitSellHt > 0)) return false;
        const marge = marqueOf(i);
        if (marginFilter === "below_min" && minMarginPercent != null) {
          return marge < minMarginPercent;
        }
        if (marginFilter === "above_target" && targetMarginPercent != null) {
          return marge >= targetMarginPercent;
        }
        return true;
      });
    }
    if (debouncedQ) {
      const qq = debouncedQ.toLowerCase();
      list = list.filter((i) =>
        [i.name, i.reference, i.family, i.subFamily, i.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(qq),
      );
    }
    return list;
  }, [
    items,
    tab,
    chip,
    debouncedQ,
    familyFilter,
    marginFilter,
    hasMarginSettings,
    minMarginPercent,
    targetMarginPercent,
  ]);

  const recentItems = useMemo(() => {
    return items
      .filter((i) => i.isActive)
      .sort((a, b) => updatedAtMs(b.updatedAt) - updatedAtMs(a.updatedAt))
      .slice(0, 4);
  }, [items]);

  const refresh = useCallback(() => router.refresh(), [router]);

  function upsertItem(row: WorkItemFormRow) {
    setItems((prev) => {
      const existing = prev.find((x) => x.id === row.id);
      const merged: LibraryHubRow = {
        ...(existing ?? {
          isActive: true,
          isFavorite: false,
          needsPriceRecalc: false,
          quoteLineCount: 0,
          updatedAt: new Date().toISOString(),
        }),
        ...row,
        quoteLineCount: existing?.quoteLineCount ?? row.quoteLineCount ?? 0,
        isFavorite: existing?.isFavorite ?? row.isFavorite,
      };
      return [merged, ...prev.filter((x) => x.id !== row.id)];
    });
  }

  async function toggleFavorite(item: LibraryHubRow) {
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/commercial/library/work-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "favorite",
          isFavorite: !item.isFavorite,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setItems((prev) =>
        prev.map((x) =>
          x.id === item.id ? { ...x, isFavorite: !item.isFavorite } : x,
        ),
      );
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusyId(null);
    }
  }

  async function duplicate(item: LibraryHubRow) {
    setBusyId(item.id);
    try {
      const res = await fetch("/api/commercial/library/work-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate", sourceId: item.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setToast("Copie créée");
      if (data.workItem?.id) {
        upsertItem({
          ...item,
          id: String(data.workItem.id),
          name: String(data.workItem.name ?? `${item.name} (copie)`),
          reference: data.workItem.reference ?? null,
          isFavorite: false,
          quoteLineCount: 0,
          updatedAt: new Date().toISOString(),
        });
        setDrawer({ mode: "edit", id: String(data.workItem.id) });
      }
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusyId(null);
    }
  }

  async function archive(item: LibraryHubRow) {
    if (!confirm(`Archiver « ${item.name} » ?\nVous le retrouverez dans le filtre Archivés.`)) return;
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/commercial/library/work-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "archive" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setItems((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, isActive: false } : x)),
      );
      setToast("Archivé — retrouvez-le dans Archivés");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusyId(null);
    }
  }

  async function restore(item: LibraryHubRow) {
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/commercial/library/work-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setItems((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, isActive: true } : x)),
      );
      setToast("Restauré — l’ouvrage est de nouveau dans la liste");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(item: LibraryHubRow) {
    if (item.quoteLineCount > 0) {
      alert(
        "Cet ouvrage est utilisé dans un devis. Archivez-le plutôt que de le supprimer.",
      );
      return;
    }
    if (!confirm(`Supprimer définitivement « ${item.name} » ?`)) return;
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/commercial/library/work-items/${item.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.code === "WORK_ITEM_IN_USE") {
          alert("Cet ouvrage est utilisé dans un devis. Archivez-le plutôt que de le supprimer.");
          return;
        }
        throw new Error(data.error || "Erreur");
      }
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      setToast("Ouvrage supprimé");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusyId(null);
    }
  }

  const tabs: { id: Tab; label: string; count: number; activeClass: string }[] = [
    {
      id: "ouvrages",
      label: "Ouvrages",
      count: stats.ouvrages,
      activeClass: "border-bework-accent text-bework-accent",
    },
    {
      id: "materiaux",
      label: "Matériaux",
      count: stats.materiaux,
      activeClass: "border-bework-cyan text-[#0e7490]",
    },
    {
      id: "maindoeuvre",
      label: "Main-d’œuvre",
      count: stats.mainOeuvre,
      activeClass: "border-bework-ok text-[#047857]",
    },
    {
      id: "favoris",
      label: "Favoris",
      count: stats.favorites,
      activeClass: "border-bework-watch text-[#b45309]",
    },
  ];

  const chips: { id: Chip; label: string; idleClass: string }[] = [
    { id: "all", label: "Tous", idleClass: "bw-chip-idle" },
    { id: "simple", label: "Prix direct", idleClass: "bw-chip-accent" },
    { id: "compose", label: "Prix calculé", idleClass: "bw-chip-violet" },
    { id: "verify", label: "À vérifier", idleClass: "bw-chip-watch" },
    { id: "archived", label: "Archivés", idleClass: "bw-chip-idle" },
  ];

  const searchPlaceholder =
    families.length > 0
      ? "Rechercher un ouvrage, référence, famille…"
      : "Rechercher un ouvrage, référence…";

  const showOuvrageFilters = tab === "ouvrages" || tab === "favoris";
  const showExtraFilters =
    showOuvrageFilters &&
    (families.length > 0 || hasMarginSettings);

  return (
    <div className="mx-auto w-full max-w-[1320px] space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-bework-navy sm:text-3xl">
            Bibliothèque
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-bework-muted">
            Ouvrages, matériaux catalogue et ressources MO pour chiffrer vite et
            protéger vos marges.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="badge-cc badge-cc-info">
              {stats.ouvrages} ouvrages
            </span>
            <span className="badge-cc badge-cc-cyan">
              {stats.materiaux} matériaux catalogue
            </span>
            <span className="badge-cc badge-cc-ok">
              {stats.mainOeuvre} ressources MO
            </span>
            {stats.needsRecalc > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setTab("ouvrages");
                  setChip("verify");
                }}
                className="badge-cc badge-cc-watch cursor-pointer transition hover:opacity-90"
              >
                {stats.needsRecalc} à vérifier
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <HeaderDropdown
            align="right"
            width={220}
            zIndex={50}
            panelClassName="rounded-xl border border-bework-navy/12 bg-white py-1 shadow-lg"
            trigger={({ onClick, expanded, triggerRef }) => (
              <button
                ref={triggerRef}
                type="button"
                onClick={onClick}
                aria-expanded={expanded}
                className="btn-cc-ghost !min-h-10 !px-3"
              >
                •••
              </button>
            )}
          >
            <a
              href="/api/commercial/library/work-items?format=csv"
              className="block px-3 py-2 text-sm text-bework-ink hover:bg-bework-soft-navy"
              role="menuitem"
            >
              Exporter CSV
            </a>
            <Link
              href="/dashboard/devis-facturation/prix"
              className="block px-3 py-2 text-sm text-bework-ink hover:bg-bework-soft-navy"
              role="menuitem"
            >
              Prix / familles
            </Link>
            <Link
              href="/dashboard/devis-facturation/parametres"
              className="block px-3 py-2 text-sm text-bework-ink hover:bg-bework-soft-navy"
              role="menuitem"
            >
              Paramètres
            </Link>
          </HeaderDropdown>
          <button
            type="button"
            onClick={() => setDrawer({ mode: "create" })}
            className="btn-cc-primary"
          >
            + Nouvel ouvrage
          </button>
        </div>
      </header>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-bework-muted"
          aria-hidden
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-12 w-full rounded-2xl border border-bework-navy/15 bg-[linear-gradient(180deg,#ffffff_0%,#f5f8fc_100%)] pl-10 pr-4 text-[15px] text-bework-ink shadow-sm outline-none placeholder:text-bework-muted/70 focus:border-bework-accent/40 focus:shadow-[var(--cc-focus-ring)]"
        />
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-bework-navy/10 pb-px">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold transition",
              tab === t.id
                ? t.activeClass
                : "border-transparent text-bework-muted hover:text-bework-navy",
            )}
          >
            {t.label}{" "}
            <span className="tabular-nums opacity-80">{t.count}</span>
          </button>
        ))}
      </div>

      {showOuvrageFilters ? (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setChip(c.id)}
              className={cn(
                "bw-chip",
                chip === c.id ? "bw-chip-active" : c.idleClass,
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      ) : null}

      {showExtraFilters ? (
        <div className="flex flex-wrap gap-2">
          {families.length > 0 ? (
            <select
              value={familyFilter}
              onChange={(e) => setFamilyFilter(e.target.value)}
              className="h-10 rounded-xl border border-bework-navy/15 bg-white px-3 text-sm text-bework-ink shadow-sm outline-none focus:border-bework-accent/40 focus:shadow-[var(--cc-focus-ring)]"
              aria-label="Filtrer par famille"
            >
              <option value="">Toutes les familles</option>
              {families.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          ) : null}
          {hasMarginSettings ? (
            <select
              value={marginFilter}
              onChange={(e) => setMarginFilter(e.target.value as MarginFilter)}
              className="h-10 rounded-xl border border-bework-navy/15 bg-white px-3 text-sm text-bework-ink shadow-sm outline-none focus:border-bework-accent/40 focus:shadow-[var(--cc-focus-ring)]"
              aria-label="Filtrer par marge"
            >
              <option value="all">Toutes les marges</option>
              {minMarginPercent != null ? (
                <option value="below_min">
                  &lt; {fmt(minMarginPercent)} %
                </option>
              ) : null}
              {targetMarginPercent != null ? (
                <option value="above_target">
                  ≥ {fmt(targetMarginPercent)} %
                </option>
              ) : null}
            </select>
          ) : null}
        </div>
      ) : null}

      {toast ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {toast}
        </p>
      ) : null}

      {tab === "materiaux" ? (
        <MaterialsPanel
          rows={materialsPreview}
          onOpen={(id) => setMaterialDrawerId(id)}
        />
      ) : tab === "maindoeuvre" ? (
        <LaborPanel rows={laborPreview} />
      ) : filtered.length === 0 &&
        items.filter((i) => i.isActive).length === 0 &&
        chip === "all" &&
        !debouncedQ &&
        !familyFilter &&
        marginFilter === "all" ? (
        <EmptyLibrary onCreate={() => setDrawer({ mode: "create" })} />
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-bework-navy/15 bg-bework-soft-navy/40 px-6 py-12 text-center text-sm text-bework-muted">
          Aucun résultat.
        </p>
      ) : (
        <>
          {!debouncedQ &&
          chip === "all" &&
          tab === "ouvrages" &&
          !familyFilter &&
          marginFilter === "all" ? (
            <RecentStrip
              items={recentItems}
              onOpen={(id) => setDrawer({ mode: "edit", id })}
            />
          ) : null}

          {/* Desktop list */}
          <ul className="hidden divide-y divide-bework-navy/8 overflow-hidden rounded-2xl border border-bework-navy/12 bg-[linear-gradient(180deg,#ffffff_0%,#f5f8fc_100%)] shadow-[var(--cc-shadow)] sm:block">
            {filtered.map((item) => (
              <WorkItemRow
                key={item.id}
                item={item}
                busy={busyId === item.id}
                minMarginPercent={minMarginPercent}
                targetMarginPercent={targetMarginPercent}
                onEdit={() => setDrawer({ mode: "edit", id: item.id })}
                onFavorite={() => void toggleFavorite(item)}
                onDuplicate={() => void duplicate(item)}
                onArchive={() => void archive(item)}
                onRestore={() => void restore(item)}
                onDelete={() => void remove(item)}
              />
            ))}
          </ul>

          {/* Mobile cards */}
          <ul className="grid gap-3 sm:hidden">
            {filtered.map((item) => (
              <WorkItemCard
                key={item.id}
                item={item}
                busy={busyId === item.id}
                minMarginPercent={minMarginPercent}
                targetMarginPercent={targetMarginPercent}
                onEdit={() => setDrawer({ mode: "edit", id: item.id })}
                onFavorite={() => void toggleFavorite(item)}
                onDuplicate={() => void duplicate(item)}
                onArchive={() => void archive(item)}
                onRestore={() => void restore(item)}
                onDelete={() => void remove(item)}
              />
            ))}
          </ul>
        </>
      )}

      <WorkItemCreateEditDrawer
        state={drawer}
        families={families}
        onClose={() => setDrawer(null)}
        onCreated={(row) => {
          upsertItem(row);
          setToast("Ouvrage créé");
          setDrawer(null);
        }}
        onSaved={(row) => {
          upsertItem(row);
          setToast("Ouvrage enregistré");
        }}
      />

      <MaterialDetailDrawer
        materialId={materialDrawerId}
        open={Boolean(materialDrawerId)}
        onClose={() => setMaterialDrawerId(null)}
        onChanged={refresh}
      />
    </div>
  );
}

function WorkItemRow({
  item,
  busy,
  minMarginPercent,
  targetMarginPercent,
  onEdit,
  onFavorite,
  onDuplicate,
  onArchive,
  onRestore,
  onDelete,
}: {
  item: LibraryHubRow;
  busy: boolean;
  minMarginPercent?: number | null;
  targetMarginPercent?: number | null;
  onEdit: () => void;
  onFavorite: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const missingPrice = !(item.unitSellHt > 0);
  const marge = marqueOf(item);
  const isComposite = item.kind === "COMPOSITE";

  return (
    <li>
      <div className="group flex items-stretch gap-0 transition hover:bg-bework-soft-accent/40">
        <div
          className={cn(
            "w-1 shrink-0 self-stretch",
            isComposite ? "bg-[var(--cc-intel)]" : "bg-bework-accent",
          )}
          aria-hidden
        />
        <div className="flex min-w-0 flex-1 items-center gap-4 px-4 py-3.5">
          <button
            type="button"
            onClick={onEdit}
            className="min-w-0 flex-1 text-left"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-[15px] font-semibold text-bework-ink">
                {item.name}
              </p>
              <span
                className={cn(
                  "badge-cc",
                  isComposite ? "badge-cc-intel" : "badge-cc-info",
                )}
              >
                {isComposite ? "Prix calculé" : "Prix direct"}
              </span>
              {missingPrice ? (
                <span className="badge-cc badge-cc-neutral">Prix à renseigner</span>
              ) : null}
              {item.needsPriceRecalc ? (
                <span className="badge-cc badge-cc-watch">À vérifier</span>
              ) : null}
              {!item.isActive ? (
                <span className="badge-cc badge-cc-cyan">Archivé</span>
              ) : null}
            </div>
            <p className="mt-0.5 text-xs text-bework-muted">
              {[
                item.family,
                formatSaleUnit(item.saleUnit),
                item.reference,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </button>

          <div className="flex shrink-0 items-center gap-5">
            <div className="text-right">
              <p className="text-[10px] font-medium uppercase tracking-wide text-bework-muted/80">
                Coût
              </p>
              <p className="tabular-nums text-sm text-bework-muted">
                {missingPrice && item.kind === "SIMPLE"
                  ? "—"
                  : `${fmt(item.unitCostHt)} €`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-medium uppercase tracking-wide text-bework-muted/80">
                Vente HT
              </p>
              <p className="tabular-nums text-sm font-semibold text-bework-ink">
                {missingPrice ? "—" : `${fmt(item.unitSellHt)} €`}
              </p>
            </div>
            <div className="min-w-[4.5rem] text-right">
              {missingPrice ? (
                <span className="badge-cc badge-cc-neutral">—</span>
              ) : (
                <span
                  className={marginBadgeClass(
                    marge,
                    missingPrice,
                    minMarginPercent,
                    targetMarginPercent,
                  )}
                >
                  {fmt(marge)} %
                </span>
              )}
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={onFavorite}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg transition",
                item.isFavorite
                  ? "text-bework-watch"
                  : "text-slate-300 hover:text-bework-watch",
              )}
              aria-label={
                item.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"
              }
            >
              <Star
                className={cn("h-4 w-4", item.isFavorite && "fill-current")}
              />
            </button>
            <RowMenu
              item={item}
              busy={busy}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onFavorite={onFavorite}
              onArchive={onArchive}
              onRestore={onRestore}
              onDelete={onDelete}
            />
          </div>
        </div>
      </div>
    </li>
  );
}

function WorkItemCard({
  item,
  busy,
  minMarginPercent,
  targetMarginPercent,
  onEdit,
  onFavorite,
  onDuplicate,
  onArchive,
  onRestore,
  onDelete,
}: {
  item: LibraryHubRow;
  busy: boolean;
  minMarginPercent?: number | null;
  targetMarginPercent?: number | null;
  onEdit: () => void;
  onFavorite: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const missingPrice = !(item.unitSellHt > 0);
  const marge = marqueOf(item);
  const isComposite = item.kind === "COMPOSITE";

  return (
    <li
      className={cn(
        "overflow-hidden rounded-2xl border border-bework-navy/12 bg-white shadow-[var(--cc-shadow)]",
        isComposite ? "bw-surface-tinted-violet" : "bw-surface-tinted-accent",
      )}
    >
      <div className="flex">
        <div
          className={cn(
            "w-1 shrink-0 self-stretch",
            isComposite ? "bg-[var(--cc-intel)]" : "bg-bework-accent",
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1 p-4">
          <div className="flex items-start justify-between gap-2">
            <button type="button" onClick={onEdit} className="min-w-0 text-left">
              <p className="font-semibold text-bework-ink">{item.name}</p>
              <p className="mt-0.5 text-xs text-bework-muted">
                {[
                  item.family,
                  formatSaleUnit(item.saleUnit),
                  item.reference,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </button>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                disabled={busy}
                onClick={onFavorite}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  item.isFavorite ? "text-bework-watch" : "text-slate-300",
                )}
                aria-label={
                  item.isFavorite
                    ? "Retirer des favoris"
                    : "Ajouter aux favoris"
                }
              >
                <Star
                  className={cn("h-4 w-4", item.isFavorite && "fill-current")}
                />
              </button>
              <RowMenu
                item={item}
                busy={busy}
                onEdit={onEdit}
                onDuplicate={onDuplicate}
                onFavorite={onFavorite}
                onArchive={onArchive}
                onRestore={onRestore}
                onDelete={onDelete}
              />
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <span
              className={cn(
                "badge-cc",
                isComposite ? "badge-cc-intel" : "badge-cc-info",
              )}
            >
              {isComposite ? "Prix calculé" : "Prix direct"}
            </span>
            {missingPrice ? (
              <span className="badge-cc badge-cc-neutral">Prix à renseigner</span>
            ) : null}
            {item.needsPriceRecalc ? (
              <span className="badge-cc badge-cc-watch">À vérifier</span>
            ) : null}
            {!item.isActive ? (
              <span className="badge-cc badge-cc-cyan">Archivé</span>
            ) : null}
          </div>

          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-bework-muted">
                Coût · Vente
              </p>
              <p className="tabular-nums text-sm text-bework-ink">
                <span className="text-bework-muted">
                  {missingPrice && item.kind === "SIMPLE"
                    ? "—"
                    : `${fmt(item.unitCostHt)} €`}
                </span>
                {" · "}
                <span className="font-semibold">
                  {missingPrice ? "—" : `${fmt(item.unitSellHt)} €`}
                </span>
              </p>
            </div>
            {missingPrice ? (
              <span className="badge-cc badge-cc-neutral">—</span>
            ) : (
              <span
                className={marginBadgeClass(
                  marge,
                  missingPrice,
                  minMarginPercent,
                  targetMarginPercent,
                )}
              >
                {fmt(marge)} %
              </span>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function EmptyLibrary({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-bework-navy/15 bw-surface-tinted-navy px-6 py-16 text-center">
      <Sparkles className="mx-auto h-8 w-8 text-bework-accent" aria-hidden />
      <h2 className="mt-3 text-lg font-semibold text-bework-navy">
        Votre bibliothèque est vide
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-bework-muted">
        Ajoutez votre premier ouvrage pour chiffrer plus vite et suivre vos
        marges.
      </p>
      <button type="button" onClick={onCreate} className="btn-cc-primary mt-6">
        Créer un ouvrage
      </button>
    </div>
  );
}

function RecentStrip({
  items,
  onOpen,
}: {
  items: LibraryHubRow[];
  onOpen: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-bework-muted">
        Récemment mis à jour
      </p>
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {items.map((i) => {
          const isComposite = i.kind === "COMPOSITE";
          return (
            <button
              key={i.id}
              type="button"
              onClick={() => onOpen(i.id)}
              className={cn(
                "shrink-0 overflow-hidden rounded-xl border text-left shadow-sm transition hover:shadow-md",
                isComposite
                  ? "bw-surface-tinted-violet border-bework-navy/10"
                  : "bw-surface-tinted-accent border-bework-navy/10",
              )}
            >
              <div className="flex min-w-[180px] max-w-[220px]">
                <div
                  className={cn(
                    "w-1 shrink-0 self-stretch",
                    isComposite ? "bg-[var(--cc-intel)]" : "bg-bework-accent",
                  )}
                  aria-hidden
                />
                <div className="px-3 py-2.5">
                  <p className="truncate text-xs font-semibold text-bework-ink">
                    {i.name}
                  </p>
                  <p className="mt-0.5 text-[10px] font-medium text-bework-muted">
                    {isComposite ? "Prix calculé" : "Prix direct"}
                  </p>
                  <p className="mt-0.5 tabular-nums text-[11px] text-bework-ink">
                    {i.unitSellHt > 0
                      ? `${fmt(i.unitSellHt)} € HT`
                      : "Prix à renseigner"}
                  </p>
                  <p className="mt-0.5 text-[10px] text-bework-muted/80">
                    {relativeUpdated(i.updatedAt)}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MaterialsPanel({
  rows,
  onOpen,
}: {
  rows: Array<{
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
  onOpen: (id: string) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-bework-navy/15 bw-surface-tinted-cyan px-6 py-14 text-center">
        <Package className="mx-auto h-8 w-8 text-[#0e7490]" aria-hidden />
        <h2 className="mt-3 text-base font-semibold text-bework-navy">
          Aucun matériau catalogue
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-bework-muted">
          Les matériaux se créent et se mettent à jour dans Prix. Un catalogue
          vide est normal au démarrage.
        </p>
        <Link
          href="/dashboard/devis-facturation/prix"
          className="btn-cc-secondary mt-5 inline-flex"
        >
          Ouvrir Prix
        </Link>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-bework-navy/8 overflow-hidden rounded-2xl border border-bework-navy/12 bg-[linear-gradient(180deg,#ffffff_0%,#f5f8fc_100%)] shadow-[var(--cc-shadow)]">
      {rows.map((m) => {
        const supplier = m.preferredSupplierName || m.supplierName;
        const refDate = m.referencePriceUpdatedAt || m.updatedAt;
        return (
          <li key={m.id}>
            <div className="flex items-stretch gap-0 transition hover:bg-bework-soft-cyan/40">
              <div className="w-1 shrink-0 self-stretch bg-bework-cyan" aria-hidden />
              <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5">
                <button
                  type="button"
                  onClick={() => onOpen(m.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-bework-ink">{m.name}</p>
                    {m.needsPriceReview ? (
                      <span className="badge-cc badge-cc-watch">À vérifier</span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-bework-muted">
                    {[m.family, formatSaleUnit(m.unit)].filter(Boolean).join(" · ")}
                  </p>
                  <p className="mt-1 text-[11px] text-bework-muted/80">
                    {supplier ?? "Fournisseur non défini"} ·{" "}
                    {relativeUpdated(refDate)}
                    {m.variationPercent != null &&
                    Math.abs(m.variationPercent) >= 0.5 ? (
                      <span
                        className={
                          m.variationPercent > 0
                            ? " text-bework-watch"
                            : " text-[#047857]"
                        }
                      >
                        {" "}
                        · {m.variationPercent > 0 ? "+" : ""}
                        {fmt(m.variationPercent)} %
                      </span>
                    ) : null}
                  </p>
                </button>
                <p className="shrink-0 tabular-nums text-sm font-semibold text-bework-ink">
                  {fmt(m.currentPriceHt)} €/{formatSaleUnit(m.unit)}
                </p>
                <HeaderDropdown
                  align="right"
                  width={220}
                  zIndex={50}
                  panelClassName="rounded-xl border border-bework-navy/12 bg-white py-1 shadow-lg"
                  trigger={({ onClick, expanded, triggerRef }) => (
                    <button
                      ref={triggerRef}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClick();
                      }}
                      aria-expanded={expanded}
                      className="rounded-lg px-2 py-1.5 text-sm font-bold text-bework-muted hover:bg-bework-soft-navy"
                    >
                      •••
                    </button>
                  )}
                >
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-bework-soft-navy"
                    onClick={() => onOpen(m.id)}
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-bework-soft-navy"
                    onClick={() => onOpen(m.id)}
                  >
                    Ajouter un prix fournisseur
                  </button>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-bework-soft-navy"
                    onClick={() => onOpen(m.id)}
                  >
                    Voir historique
                  </button>
                </HeaderDropdown>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function LaborPanel({
  rows,
}: {
  rows: Array<{
    id: string;
    name: string;
    hourlyCostHt: number;
    loadedCostHt: number | null;
  }>;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-bework-navy/15 bw-surface-tinted-ok px-6 py-14 text-center">
        <Wrench className="mx-auto h-8 w-8 text-[#047857]" aria-hidden />
        <h2 className="mt-3 text-base font-semibold text-bework-navy">
          Aucune ressource MO
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-bework-muted">
          Les ressources main-d’œuvre se gèrent dans Prix. Un catalogue vide est
          normal au démarrage.
        </p>
        <Link
          href="/dashboard/devis-facturation/prix"
          className="btn-cc-secondary mt-5 inline-flex"
        >
          Ouvrir Prix
        </Link>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-bework-navy/8 overflow-hidden rounded-2xl border border-bework-navy/12 bg-[linear-gradient(180deg,#ffffff_0%,#f5f8fc_100%)] shadow-[var(--cc-shadow)]">
      {rows.map((l) => (
        <li key={l.id}>
          <div className="flex items-stretch gap-0">
            <div className="w-1 shrink-0 self-stretch bg-bework-ok" aria-hidden />
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3.5">
              <p className="font-semibold text-bework-ink">{l.name}</p>
              <p className="tabular-nums text-sm font-semibold text-bework-ink">
                {fmt(l.loadedCostHt ?? l.hourlyCostHt)} € / h
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function RowMenu({
  item,
  busy,
  onEdit,
  onDuplicate,
  onFavorite,
  onArchive,
  onRestore,
  onDelete,
}: {
  item: LibraryHubRow;
  busy: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onFavorite: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  return (
    <HeaderDropdown
      align="right"
      width={200}
      zIndex={50}
      panelClassName="rounded-xl border border-bework-navy/12 bg-white py-1 shadow-lg"
      trigger={({ onClick, expanded, triggerRef }) => (
        <button
          ref={triggerRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          disabled={busy}
          aria-expanded={expanded}
          aria-label={`Actions de l’ouvrage ${item.name}`}
          className="flex h-10 min-w-10 items-center justify-center rounded-lg px-2 text-sm font-bold text-bework-muted hover:bg-bework-soft-navy disabled:opacity-50"
        >
          •••
        </button>
      )}
    >
      <button
        type="button"
        className="block w-full px-3 py-2 text-left text-sm hover:bg-bework-soft-navy"
        onClick={onEdit}
      >
        Modifier
      </button>
      <button
        type="button"
        className="block w-full px-3 py-2 text-left text-sm hover:bg-bework-soft-navy"
        onClick={onDuplicate}
      >
        Dupliquer
      </button>
      <button
        type="button"
        className="block w-full px-3 py-2 text-left text-sm hover:bg-bework-soft-navy"
        onClick={onFavorite}
      >
        {item.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
      </button>
      {item.isActive ? (
        <button
          type="button"
          className="block w-full px-3 py-2 text-left text-sm hover:bg-bework-soft-navy"
          onClick={onArchive}
        >
          Archiver
        </button>
      ) : (
        <button
          type="button"
          className="block w-full px-3 py-2 text-left text-sm hover:bg-bework-soft-navy"
          onClick={onRestore}
        >
          Restaurer
        </button>
      )}
      <button
        type="button"
        className="block w-full border-t border-bework-navy/10 px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
        onClick={onDelete}
      >
        Supprimer
      </button>
    </HeaderDropdown>
  );
}

function WorkItemCreateEditDrawer({
  state,
  families,
  onClose,
  onCreated,
  onSaved,
}: {
  state: null | { mode: "create" } | { mode: "edit"; id: string };
  families: string[];
  onClose: () => void;
  onCreated: (row: WorkItemFormRow) => void;
  onSaved: (row: WorkItemFormRow) => void;
}) {
  const open = Boolean(state);
  const formKey =
    state?.mode === "edit"
      ? `edit-${state.id}`
      : state?.mode === "create"
        ? "create"
        : "closed";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={state?.mode === "edit" ? "Modifier l’ouvrage" : "Nouvel ouvrage"}
      description={
        state?.mode === "edit"
          ? "Les devis déjà établis ne sont pas modifiés."
          : "Créez votre ouvrage en quelques secondes."
      }
      widthClass="max-w-lg"
      scrollBody={false}
    >
      {state ? (
        <WorkItemForm
          key={formKey}
          mode={state.mode === "edit" ? "edit" : "create"}
          workItemId={state.mode === "edit" ? state.id : undefined}
          families={families}
          layout="drawer"
          onCreated={onCreated}
          onSaved={onSaved}
          onCancel={onClose}
        />
      ) : null}
    </Drawer>
  );
}
