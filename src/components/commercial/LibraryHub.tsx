"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

const LOW_MARGIN = 15;

export function LibraryHub({
  initialItems,
  stats,
  materialsPreview,
  laborPreview,
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
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("ouvrages");
  const [chip, setChip] = useState<Chip>("all");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [items, setItems] = useState(initialItems);
  const [toast, setToast] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<
    null | { mode: "create" } | { mode: "edit"; id: string }
  >(null);
  const [materialDrawerId, setMaterialDrawerId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

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
  }, [items, tab, chip, debouncedQ]);

  const refresh = useCallback(() => router.refresh(), [router]);

  const families = useMemo(() => {
    const set = new Set<string>();
    for (const i of items) {
      if (i.family) set.add(i.family);
    }
    for (const m of materialsPreview) {
      if (m.family) set.add(m.family);
    }
    return Array.from(set);
  }, [items, materialsPreview]);

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

  const tabs: { id: Tab; label: string }[] = [
    { id: "ouvrages", label: "Ouvrages" },
    { id: "materiaux", label: "Matériaux" },
    { id: "maindoeuvre", label: "Main-d’œuvre" },
    { id: "favoris", label: "Favoris" },
  ];

  const chips: { id: Chip; label: string }[] = [
    { id: "all", label: "Tous" },
    { id: "simple", label: "Prix direct" },
    { id: "compose", label: "Prix calculé" },
    { id: "verify", label: "À vérifier" },
    { id: "archived", label: "Archivés" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-[#1e3a5f] sm:text-3xl">
            Bibliothèque
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
            Vos ouvrages, matériaux et prix de référence pour chiffrer rapidement
            et protéger vos marges.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            <span>
              <strong className="font-semibold text-slate-700">
                {stats.ouvrages}
              </strong>{" "}
              ouvrages
            </span>
            <span>
              <strong className="font-semibold text-slate-700">
                {stats.materiaux}
              </strong>{" "}
              matériaux
            </span>
            <span>
              <strong className="font-semibold text-slate-700">
                {stats.mainOeuvre}
              </strong>{" "}
              main-d’œuvre
            </span>
            {stats.needsRecalc > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setTab("ouvrages");
                  setChip("verify");
                }}
                className="font-semibold text-amber-700 hover:underline"
              >
                ⚠ {stats.needsRecalc} prix à vérifier
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <HeaderDropdown
            align="right"
            width={220}
            zIndex={50}
            panelClassName="rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
            trigger={({ onClick, expanded, triggerRef }) => (
              <button
                ref={triggerRef}
                type="button"
                onClick={onClick}
                aria-expanded={expanded}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                •••
              </button>
            )}
          >
            <a
              href="/api/commercial/library/work-items?format=csv"
              className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              role="menuitem"
            >
              Exporter CSV
            </a>
            <Link
              href="/dashboard/devis-facturation/prix"
              className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              role="menuitem"
            >
              Gérer les prix / familles
            </Link>
            <Link
              href="/dashboard/devis-facturation/parametres"
              className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              role="menuitem"
            >
              Paramètres
            </Link>
            <p className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-400">
              Import CSV — prochainement
            </p>
          </HeaderDropdown>
          <button
            type="button"
            onClick={() => setDrawer({ mode: "create" })}
            className="rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#152a45]"
          >
            + Nouvel ouvrage
          </button>
        </div>
      </div>

      <div className="relative">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un ouvrage, référence, famille…"
          className="w-full rounded-2xl border border-slate-200/90 bg-white px-4 py-3.5 text-[15px] text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-[#1e3a5f]/40 focus:shadow-md"
        />
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 pb-px">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2 text-sm font-semibold transition",
              tab === t.id
                ? "border-[#1e3a5f] text-[#1e3a5f]"
                : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(tab === "ouvrages" || tab === "favoris") && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setChip(c.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition",
                chip === c.id
                  ? "bg-[#1e3a5f] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

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
      ) : filtered.length === 0 && items.filter((i) => i.isActive).length === 0 && chip === "all" && !debouncedQ ? (
        <EmptyLibrary onCreate={() => setDrawer({ mode: "create" })} />
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
          Aucun résultat.
        </p>
      ) : (
        <>
          {!debouncedQ && chip === "all" && tab === "ouvrages" ? (
            <RecentStrip
              items={items.filter((i) => i.isActive).slice(0, 5)}
              onOpen={(id) => setDrawer({ mode: "edit", id })}
            />
          ) : null}
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          {filtered.map((item) => {
            const missingPrice = !(item.unitSellHt > 0);
            const marge = marqueOf(item);
            const low = !missingPrice && marge > 0 && marge < LOW_MARGIN;
            return (
              <li key={item.id}>
                <div className="group flex flex-col gap-3 px-4 py-3.5 transition hover:bg-slate-50/80 sm:flex-row sm:items-center sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setDrawer({ mode: "edit", id: item.id })}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-[15px] font-semibold text-slate-900">
                        {item.name}
                      </p>
                      {missingPrice ? (
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                          Prix à renseigner
                        </span>
                      ) : null}
                      {item.needsPriceRecalc ? (
                        <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                          À vérifier
                        </span>
                      ) : null}
                      {low ? (
                        <span className="text-[11px] font-medium text-amber-700">
                          Marge {fmt(marge)} %
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {[
                        item.family,
                        item.saleUnit,
                        item.kind === "COMPOSITE" ? "Prix calculé" : "Prix direct",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                      {item.reference ? ` · ${item.reference}` : ""}
                    </p>
                  </button>

                  <div className="flex shrink-0 items-end gap-4 sm:gap-6">
                    <div className="text-right">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        Coût
                      </p>
                      <p className="tabular-nums text-sm font-medium text-slate-700">
                        {missingPrice && item.kind === "SIMPLE" ? "—" : `${fmt(item.unitCostHt)} €`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        Vente HT
                      </p>
                      <p className="tabular-nums text-sm font-semibold text-slate-900">
                        {missingPrice ? "—" : `${fmt(item.unitSellHt)} €`}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        Marge
                      </p>
                      <p
                        className={cn(
                          "tabular-nums text-sm font-semibold",
                          missingPrice
                            ? "text-slate-400"
                            : low
                              ? "text-amber-700"
                              : "text-slate-700",
                        )}
                      >
                        {missingPrice ? "—" : `${fmt(marge)} %`}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => void toggleFavorite(item)}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center text-lg leading-none",
                        item.isFavorite ? "text-amber-500" : "text-slate-300 hover:text-amber-400",
                      )}
                      aria-label={item.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                    >
                      ★
                    </button>
                    <RowMenu
                      item={item}
                      busy={busyId === item.id}
                      onEdit={() => setDrawer({ mode: "edit", id: item.id })}
                      onDuplicate={() => void duplicate(item)}
                      onFavorite={() => void toggleFavorite(item)}
                      onArchive={() => void archive(item)}
                      onRestore={() => void restore(item)}
                      onDelete={() => void remove(item)}
                    />
                  </div>
                </div>
              </li>
            );
          })}
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

function EmptyLibrary({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
      <h2 className="text-lg font-semibold text-slate-900">
        Votre bibliothèque est vide
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        Ajoutez votre premier ouvrage pour commencer à chiffrer.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-6 rounded-xl bg-[#1e3a5f] px-5 py-2.5 text-sm font-bold text-white"
      >
        Créer un ouvrage
      </button>
      <p className="mt-4 text-xs text-slate-400">
        Importer une bibliothèque — bientôt dans le menu •••
      </p>
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
    <div className="mb-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        Récemment mis à jour
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map((i) => (
          <button
            key={i.id}
            type="button"
            onClick={() => onOpen(i.id)}
            className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left shadow-sm transition hover:border-[#1e3a5f]/25"
          >
            <p className="max-w-[160px] truncate text-xs font-semibold text-slate-800">
              {i.name}
            </p>
            <p className="tabular-nums text-[11px] text-slate-500">
              {i.unitSellHt > 0 ? `${fmt(i.unitSellHt)} € HT` : "Prix à renseigner"}
            </p>
          </button>
        ))}
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
      <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
        Aucun matériau. Gérez-les depuis{" "}
        <Link href="/dashboard/devis-facturation/prix" className="font-semibold text-[#1d4ed8]">
          Prix
        </Link>
        .
      </p>
    );
  }
  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {rows.map((m) => {
        const supplier = m.preferredSupplierName || m.supplierName;
        const refDate = m.referencePriceUpdatedAt || m.updatedAt;
        return (
          <li key={m.id}>
            <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50/80">
              <button
                type="button"
                onClick={() => onOpen(m.id)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">{m.name}</p>
                  {m.needsPriceReview ? (
                    <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                      À vérifier
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {[m.family, m.unit].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {supplier ?? "Fournisseur non défini"} ·{" "}
                  {relativeUpdated(refDate)}
                  {m.variationPercent != null && Math.abs(m.variationPercent) >= 0.5 ? (
                    <span
                      className={
                        m.variationPercent > 0
                          ? " text-amber-700"
                          : " text-emerald-700"
                      }
                    >
                      {" "}
                      · {m.variationPercent > 0 ? "+" : ""}
                      {fmt(m.variationPercent)} %
                    </span>
                  ) : null}
                </p>
              </button>
              <p className="shrink-0 tabular-nums text-sm font-semibold text-slate-800">
                {fmt(m.currentPriceHt)} €/{m.unit}
              </p>
              <HeaderDropdown
                align="right"
                width={220}
                zIndex={50}
                panelClassName="rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                trigger={({ onClick, expanded, triggerRef }) => (
                  <button
                    ref={triggerRef}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick();
                    }}
                    aria-expanded={expanded}
                    className="rounded-lg px-2 py-1.5 text-sm font-bold text-slate-500 hover:bg-slate-100"
                  >
                    •••
                  </button>
                )}
              >
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                  onClick={() => onOpen(m.id)}
                >
                  Modifier
                </button>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                  onClick={() => onOpen(m.id)}
                >
                  Ajouter un prix fournisseur
                </button>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                  onClick={() => onOpen(m.id)}
                >
                  Voir historique
                </button>
              </HeaderDropdown>
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
      <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
        Aucune ressource main-d’œuvre. Voir{" "}
        <Link href="/dashboard/devis-facturation/prix" className="font-semibold text-[#1d4ed8]">
          Prix
        </Link>
        .
      </p>
    );
  }
  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {rows.map((l) => (
        <li
          key={l.id}
          className="flex items-center justify-between gap-3 px-4 py-3.5"
        >
          <p className="font-semibold text-slate-900">{l.name}</p>
          <p className="tabular-nums text-sm font-semibold">
            {fmt(l.loadedCostHt ?? l.hourlyCostHt)} € / h
          </p>
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
      panelClassName="rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
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
          className="flex h-10 min-w-10 items-center justify-center rounded-lg px-2 text-sm font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-50"
        >
          •••
        </button>
      )}
    >
      <button type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={onEdit}>
        Modifier
      </button>
      <button type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={onDuplicate}>
        Dupliquer
      </button>
      <button type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={onFavorite}>
        {item.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
      </button>
      {item.isActive ? (
        <button type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={onArchive}>
          Archiver
        </button>
      ) : (
        <button type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={onRestore}>
          Restaurer
        </button>
      )}
      <button
        type="button"
        className="block w-full border-t border-slate-100 px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
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
    state?.mode === "edit" ? `edit-${state.id}` : state?.mode === "create" ? "create" : "closed";

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
