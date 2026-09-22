"use client";

import { useCallback, useEffect, useState } from "react";
import { marginPercentFromCostSell, roundMoney } from "@/lib/commercial/money";
import { ChevronDown, ChevronRight } from "lucide-react";

function fmt(n: number) {
  return roundMoney(n, 2).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type VariantResult = {
  id: string;
  name: string;
  reference: string | null;
  saleUnit: string;
  unitSellHt: number;
  unitCostHt: number;
  marginPercent: number;
  variantKind: string | null;
};

type WorkItemResult = {
  id: string;
  name: string;
  reference: string | null;
  saleUnit: string;
  unitSellHt: number;
  unitCostHt: number;
  marginPercent: number;
  variants?: VariantResult[];
};

export function LibraryPickerModal({
  quoteId,
  sectionId,
  open,
  onClose,
  onAdded,
}: {
  quoteId: string;
  sectionId?: string;
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [items, setItems] = useState<WorkItemResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qtyById, setQtyById] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => window.clearTimeout(t);
  }, [q]);

  const search = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/commercial/library/work-items", window.location.origin);
      if (query) url.searchParams.set("q", query);
      url.searchParams.set("withVariants", "1");
      url.searchParams.set("pageSize", "80");
      const res = await fetch(url.pathname + url.search);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setItems((data.workItems as WorkItemResult[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void search(debouncedQ);
  }, [open, debouncedQ, search]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function add(workItemId: string) {
    setBusyId(workItemId);
    setError(null);
    try {
      const quantity = Number(qtyById[workItemId] ?? "1") || 1;
      const res = await fetch(`/api/commercial/quotes/${quoteId}/lines/from-library`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workItemId,
          quantity,
          sectionId: sectionId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      onAdded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusyId(null);
    }
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center p-4 pt-[8vh]">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-bold text-[#1e3a5f]">Ajouter depuis la bibliothèque</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50"
          >
            Fermer
          </button>
        </div>

        <div className="border-b border-slate-100 px-4 py-3">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un ouvrage ou une variante…"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none"
          />
        </div>

        {error ? (
          <p className="mx-4 mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <p className="p-6 text-sm text-slate-500">Recherche…</p>
          ) : items.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">Aucun ouvrage trouvé.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((w) => {
                const marque =
                  w.marginPercent ||
                  marginPercentFromCostSell(w.unitCostHt, w.unitSellHt);
                const hasVariants = (w.variants?.length ?? 0) > 0;
                const isOpen = expanded.has(w.id);
                return (
                  <li key={w.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-start gap-2">
                        {hasVariants ? (
                          <button
                            type="button"
                            onClick={() => toggleExpand(w.id)}
                            className="mt-0.5 rounded p-0.5 text-slate-400 hover:bg-slate-50"
                            aria-label="Variantes"
                          >
                            {isOpen ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        ) : (
                          <span className="w-5" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {w.name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {[w.reference, w.saleUnit].filter(Boolean).join(" · ") || "—"}
                            {" · "}
                            vente {fmt(w.unitSellHt)} € · marque {fmt(marque)} %
                            {hasVariants ? ` · ${w.variants!.length} variante(s)` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-xs tabular-nums"
                          value={qtyById[w.id] ?? "1"}
                          onChange={(e) =>
                            setQtyById((m) => ({ ...m, [w.id]: e.target.value }))
                          }
                          aria-label="Quantité"
                        />
                        <button
                          type="button"
                          disabled={busyId === w.id}
                          onClick={() => void add(w.id)}
                          className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                        >
                          Ajouter
                        </button>
                      </div>
                    </div>
                    {hasVariants && isOpen ? (
                      <ul className="mt-2 ml-7 space-y-2 border-l border-slate-100 pl-3">
                        {w.variants!.map((v) => (
                          <li
                            key={v.id}
                            className="flex flex-wrap items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-slate-800">
                                {v.name}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {v.reference || "Sans réf."} · {fmt(v.unitSellHt)} € /{" "}
                                {v.saleUnit}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                className="w-14 rounded-lg border border-slate-200 px-2 py-1 text-[11px] tabular-nums"
                                value={qtyById[v.id] ?? "1"}
                                onChange={(e) =>
                                  setQtyById((m) => ({ ...m, [v.id]: e.target.value }))
                                }
                              />
                              <button
                                type="button"
                                disabled={busyId === v.id}
                                onClick={() => void add(v.id)}
                                className="rounded-lg border border-[#1e3a5f]/20 px-2.5 py-1 text-[11px] font-semibold text-[#1e3a5f] disabled:opacity-50"
                              >
                                Variante
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
