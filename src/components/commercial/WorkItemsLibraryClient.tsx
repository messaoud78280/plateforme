"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { marginPercentFromCostSell, roundMoney } from "@/lib/commercial/money";

export type LibraryWorkItemRow = {
  id: string;
  name: string;
  reference: string | null;
  saleUnit: string;
  unitCostHt: number;
  unitSellHt: number;
  marginPercent: number;
  kind: string;
  isActive: boolean;
  needsPriceRecalc: boolean;
  quoteLineCount: number;
};

function fmtMoney(n: number) {
  return roundMoney(n, 2).toLocaleString("fr-FR");
}

function marqueOf(w: LibraryWorkItemRow) {
  return w.marginPercent || marginPercentFromCostSell(w.unitCostHt, w.unitSellHt);
}

function RowActionsMenu({
  item,
  view,
  onToast,
  onRemoved,
  onRestored,
}: {
  item: LibraryWorkItemRow;
  view: "active" | "archived";
  onToast: (msg: string) => void;
  onRemoved: (id: string) => void;
  onRestored: (id: string) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<"delete" | "archive" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function updateMenuPos() {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const menuWidth = 176;
    const left = Math.min(
      Math.max(8, r.right - menuWidth),
      window.innerWidth - menuWidth - 8,
    );
    const below = r.bottom + 6;
    const estimatedHeight = 160;
    const top =
      below + estimatedHeight > window.innerHeight - 8
        ? Math.max(8, r.top - estimatedHeight - 6)
        : below;
    setMenuPos({ top, left });
  }

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null);
      return;
    }
    updateMenuPos();
    const onScroll = () => updateMenuPos();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  useEffect(() => {
    if (!open && !confirm) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setConfirm(null);
      }
    };
    // click (pas mousedown) : évite de fermer dans le même geste d’ouverture
    document.addEventListener("click", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, confirm]);

  async function duplicate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/commercial/library/work-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate", sourceId: item.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setOpen(false);
      onToast("Ouvrage dupliqué.");
      router.refresh();
      if (data.workItem?.id) {
        router.push(`/dashboard/devis-facturation/bibliotheque/${data.workItem.id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function archive() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/commercial/library/work-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "archive" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setConfirm(null);
      setOpen(false);
      onToast("Ouvrage archivé.");
      onRemoved(item.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function restore() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/commercial/library/work-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setOpen(false);
      onToast("Ouvrage restauré.");
      onRestored(item.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function hardDelete() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/commercial/library/work-items/${item.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setConfirm(null);
      setOpen(false);
      onToast("Ouvrage supprimé.");
      onRemoved(item.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  const used = (item.quoteLineCount ?? 0) > 0;

  const menu =
    open && menuPos && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ top: menuPos.top, left: menuPos.left }}
            className="fixed z-[100] min-w-[11rem] rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {view === "active" ? (
              <>
                <Link
                  role="menuitem"
                  href={`/dashboard/devis-facturation/bibliotheque/${item.id}`}
                  className="block px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
                  onClick={() => setOpen(false)}
                >
                  Modifier
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  disabled={busy}
                  className="block w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                  onClick={() => void duplicate()}
                >
                  Dupliquer
                </button>
                <button
                  type="button"
                  role="menuitem"
                  disabled={busy}
                  className="block w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                  onClick={() => {
                    setOpen(false);
                    setConfirm(used ? "archive" : "delete");
                  }}
                >
                  {used ? "Archiver" : "Supprimer"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  role="menuitem"
                  disabled={busy}
                  className="block w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                  onClick={() => void restore()}
                >
                  Restaurer
                </button>
                <Link
                  role="menuitem"
                  href={`/dashboard/devis-facturation/bibliotheque/${item.id}`}
                  className="block px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
                  onClick={() => setOpen(false)}
                >
                  Consulter
                </Link>
              </>
            )}
            {error ? (
              <p className="border-t border-slate-100 px-3 py-2 text-xs text-red-700">{error}</p>
            ) : null}
          </div>,
          document.body,
        )
      : null;

  const dialog =
    confirm && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-900/40 p-4 sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`confirm-${item.id}`}
            onClick={() => !busy && setConfirm(null)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id={`confirm-${item.id}`} className="text-base font-bold text-slate-900">
                {confirm === "archive" ? "Archiver cet ouvrage ?" : "Supprimer cet ouvrage ?"}
              </h3>
              <p className="mt-1 font-semibold text-[#1e3a5f]">« {item.name} »</p>
              <p className="mt-2 text-sm text-slate-600">
                {confirm === "archive"
                  ? "Il ne sera plus proposé dans les nouveaux devis. Les devis existants resteront inchangés."
                  : "Cet ouvrage sera supprimé de la bibliothèque."}
              </p>
              {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirm(null)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void (confirm === "archive" ? archive() : hardDelete())}
                  className={
                    confirm === "archive"
                      ? "rounded-lg bg-[#1e3a5f] px-3 py-2 text-sm font-bold text-white disabled:opacity-60"
                      : "rounded-lg bg-red-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-60"
                  }
                >
                  {busy ? "…" : confirm === "archive" ? "Archiver" : "Supprimer"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="relative shrink-0">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions pour ${item.name}`}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
          setError(null);
        }}
        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-bold leading-none text-slate-600 hover:bg-slate-50"
      >
        •••
      </button>
      {menu}
      {dialog}
    </div>
  );
}

export function WorkItemsLibraryClient({
  initialItems,
  view,
  query,
}: {
  initialItems: LibraryWorkItemRow[];
  view: "active" | "archived";
  query?: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(t);
  }, [toast]);

  function removeLocal(id: string) {
    setItems((prev) => prev.filter((w) => w.id !== id));
  }

  const activeHref = `/dashboard/devis-facturation/bibliotheque${
    query ? `?q=${encodeURIComponent(query)}` : ""
  }`;
  const archivedHref = `/dashboard/devis-facturation/bibliotheque?view=archived${
    query ? `&q=${encodeURIComponent(query)}` : ""
  }`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Link
          href={activeHref}
          className={
            view === "active"
              ? "rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-bold text-white"
              : "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"
          }
        >
          Actifs
        </Link>
        <Link
          href={archivedHref}
          className={
            view === "archived"
              ? "rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-bold text-white"
              : "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"
          }
        >
          Archivés
        </Link>
      </div>

      {toast ? (
        <p
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900"
        >
          {toast}
        </p>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white">
        {items.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            {query
              ? "Aucun ouvrage pour cette recherche."
              : view === "archived"
                ? "Aucun ouvrage archivé."
                : "Aucun ouvrage. Vous pouvez créer un devis sans bibliothèque."}
          </p>
        ) : (
          <>
            <ul className="divide-y divide-slate-100 md:hidden">
              {items.map((w) => {
                const marque = marqueOf(w);
                return (
                  <li key={w.id} className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <Link
                        href={`/dashboard/devis-facturation/bibliotheque/${w.id}`}
                        className="min-w-0 flex-1"
                      >
                        <p className="truncate font-semibold text-[#1e3a5f]">{w.name}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {[w.reference, w.saleUnit].filter(Boolean).join(" · ") || "—"}
                          {" · "}
                          {w.kind === "COMPOSITE" ? "Composé" : "Simple"}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-slate-600">
                          <span>Coût {fmtMoney(w.unitCostHt)} €</span>
                          <span className="font-semibold text-slate-900">
                            Vente {fmtMoney(w.unitSellHt)} €
                          </span>
                          <span>marque {roundMoney(marque, 1).toLocaleString("fr-FR")} %</span>
                        </div>
                        {w.needsPriceRecalc ? (
                          <span className="mt-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                            À recalculer
                          </span>
                        ) : null}
                      </Link>
                      <RowActionsMenu
                        item={w}
                        view={view}
                        onToast={setToast}
                        onRemoved={removeLocal}
                        onRestored={removeLocal}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-2">Ouvrage</th>
                      <th className="px-4 py-2">Réf.</th>
                      <th className="px-4 py-2">Unité</th>
                      <th className="px-4 py-2">Coût</th>
                      <th className="px-4 py-2">Vente</th>
                      <th className="px-4 py-2">Taux de marque</th>
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2 text-right">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((w) => {
                      const marque = marqueOf(w);
                      const href = `/dashboard/devis-facturation/bibliotheque/${w.id}`;
                      return (
                        <tr key={w.id} className="group hover:bg-slate-50/80">
                          <td className="px-4 py-2.5">
                            <button
                              type="button"
                              className="text-left font-semibold text-[#1e3a5f] hover:underline"
                              onClick={() => router.push(href)}
                            >
                              {w.name}
                            </button>
                            {w.needsPriceRecalc ? (
                              <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                                À recalculer
                              </span>
                            ) : null}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600">{w.reference || "—"}</td>
                          <td className="px-4 py-2.5 text-slate-600">{w.saleUnit}</td>
                          <td className="px-4 py-2.5 tabular-nums">{fmtMoney(w.unitCostHt)} €</td>
                          <td className="px-4 py-2.5 tabular-nums font-semibold">
                            {fmtMoney(w.unitSellHt)} €
                          </td>
                          <td className="px-4 py-2.5 tabular-nums text-slate-600">
                            {roundMoney(marque, 1).toLocaleString("fr-FR")} %
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={
                                w.kind === "COMPOSITE"
                                  ? "rounded-full bg-[#1e3a5f]/10 px-2 py-0.5 text-[10px] font-bold text-[#1e3a5f]"
                                  : "rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600"
                              }
                            >
                              {w.kind === "COMPOSITE" ? "Composé" : "Simple"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="inline-flex justify-end">
                              <RowActionsMenu
                                item={w}
                                view={view}
                                onToast={setToast}
                                onRemoved={removeLocal}
                                onRestored={removeLocal}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
