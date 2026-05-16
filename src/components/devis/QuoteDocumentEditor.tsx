"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { QuoteLineDraft } from "@/app/dashboard/devis/quote-actions";
import { addQuoteLinesFromWorkItems, saveQuoteDocumentLines, searchWorkItemsForQuoteAction } from "@/app/dashboard/devis/quote-actions";
import type { QuotePickerWorkItem } from "@/lib/be-work-devis-quote-picker";

function parseNum(raw: string): number {
  const t = raw.trim().replace(/\s/g, "").replace(",", ".");
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}

function lineMoney(qty: string, puHt: string, vatPct: string) {
  const ht = parseNum(qty) * parseNum(puHt);
  const vat = ht * (parseNum(vatPct) / 100);
  return { ht, vat, ttc: ht + vat };
}

function fmtEur(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function newTmpId() {
  return `tmp-${crypto.randomUUID()}`;
}

export type QuoteDocumentEditorProps = {
  documentId: string;
  initialLines: QuoteLineDraft[];
  /** TVA % par défaut pour les nouvelles lignes libres (alignée sur le document). */
  defaultVatRate: string;
};

export function QuoteDocumentEditor({ documentId, initialLines, defaultVatRate }: QuoteDocumentEditorProps) {
  const router = useRouter();
  const [lines, setLines] = useState<QuoteLineDraft[]>(initialLines);

  useEffect(() => {
    setLines(initialLines);
  }, [initialLines]);
  const [pending, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQ, setPickerQ] = useState("");
  const [pickerResults, setPickerResults] = useState<QuotePickerWorkItem[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerSelected, setPickerSelected] = useState<Set<string>>(() => new Set());
  const [message, setMessage] = useState<string | null>(null);

  const sortedLines = useMemo(() => [...lines].sort((a, b) => a.sortOrder - b.sortOrder), [lines]);

  const { subHt, subVat, subTtc, byLot } = useMemo(() => {
    let subHt = 0;
    let subVat = 0;
    let subTtc = 0;
    const map = new Map<string, { ht: number; ttc: number }>();
    for (const row of sortedLines) {
      const { ht, vat, ttc } = lineMoney(row.quantity, row.unitPriceHT, row.vatRate);
      subHt += ht;
      subVat += vat;
      subTtc += ttc;
      const lot = row.lot.trim() || "—";
      const cur = map.get(lot) ?? { ht: 0, ttc: 0 };
      cur.ht += ht;
      cur.ttc += ttc;
      map.set(lot, cur);
    }
    return { subHt, subVat, subTtc, byLot: map };
  }, [sortedLines]);

  function updateRow(id: string, patch: Partial<QuoteLineDraft>) {
    setLines((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRow(id: string) {
    setLines((prev) => prev.filter((r) => r.id !== id));
  }

  function addFreeLine() {
    const nextOrder = lines.reduce((m, r) => Math.max(m, r.sortOrder), 0) + 1;
    setLines((prev) => [
      ...prev,
      {
        id: newTmpId(),
        workItemId: null,
        lot: "Divers",
        family: null,
        code: null,
        title: "Nouvelle ligne",
        description: "—",
        unit: "forfait",
        quantity: "1",
        unitPriceHT: "0",
        vatRate: defaultVatRate,
        includedItems: null,
        excludedItems: null,
        vigilancePoints: null,
        sortOrder: nextOrder,
      },
    ]);
  }

  function runPickerSearch() {
    setPickerLoading(true);
    setMessage(null);
    startTransition(async () => {
      try {
        const rows = await searchWorkItemsForQuoteAction(pickerQ);
        setPickerResults(rows);
      } finally {
        setPickerLoading(false);
      }
    });
  }

  function togglePicker(id: string) {
    setPickerSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function addPickerSelection() {
    const ids = [...pickerSelected];
    if (!ids.length) {
      setMessage("Sélectionnez au moins un ouvrage.");
      return;
    }
    startTransition(async () => {
      setMessage(null);
      const res = await addQuoteLinesFromWorkItems(documentId, ids);
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      setPickerOpen(false);
      setPickerSelected(new Set());
      router.refresh();
    });
  }

  function saveLines() {
    const normalized = sortedLines.map((row, idx) => ({ ...row, sortOrder: idx }));
    startTransition(async () => {
      setMessage(null);
      const res = await saveQuoteDocumentLines(documentId, normalized);
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      router.refresh();
    });
  }

  const pdfHref = `/dashboard/devis/documents/${documentId}/pdf`;

  return (
    <div className="space-y-4">
      {message ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="status">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setPickerOpen(true);
            setPickerQ("");
            setPickerResults([]);
            setPickerSelected(new Set());
          }}
          className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
        >
          Ajouter depuis la bibliothèque
        </button>
        <button
          type="button"
          onClick={() => addFreeLine()}
          className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
        >
          Ajouter une ligne libre
        </button>
        <button
          type="button"
          onClick={() => saveLines()}
          disabled={pending}
          className="inline-flex items-center rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#152a45] disabled:opacity-50"
        >
          Enregistrer les lignes
        </button>
        <a
          href={pdfHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
        >
          Prévisualiser / télécharger PDF
        </a>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[1100px] w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="border-b border-slate-200 px-3 py-2">Lot</th>
              <th className="border-b border-slate-200 px-3 py-2">Code</th>
              <th className="border-b border-slate-200 px-3 py-2">Désignation</th>
              <th className="border-b border-slate-200 px-3 py-2">U</th>
              <th className="border-b border-slate-200 px-3 py-2">Qté</th>
              <th className="border-b border-slate-200 px-3 py-2">PU HT</th>
              <th className="border-b border-slate-200 px-3 py-2">TVA %</th>
              <th className="border-b border-slate-200 px-3 py-2">Total HT</th>
              <th className="border-b border-slate-200 px-3 py-2">Total TTC</th>
              <th className="border-b border-slate-200 px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedLines.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                  Aucune ligne. Ajoutez des ouvrages depuis la bibliothèque ou une ligne libre.
                </td>
              </tr>
            ) : (
              sortedLines.map((row) => {
                const { ht, ttc } = lineMoney(row.quantity, row.unitPriceHT, row.vatRate);
                return (
                  <tr key={row.id} className="border-b border-slate-100 align-top hover:bg-slate-50/60">
                    <td className="px-2 py-2">
                      <input
                        className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-xs"
                        value={row.lot}
                        onChange={(e) => updateRow(row.id, { lot: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-xs"
                        value={row.code ?? ""}
                        onChange={(e) => updateRow(row.id, { code: e.target.value || null })}
                      />
                    </td>
                    <td className="px-2 py-2 min-w-[240px]">
                      <input
                        className="mb-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold"
                        value={row.title}
                        onChange={(e) => updateRow(row.id, { title: e.target.value })}
                      />
                      <textarea
                        className="w-full rounded-lg border border-slate-200 px-2 py-1 text-[11px] leading-snug text-slate-600"
                        rows={2}
                        value={row.description}
                        onChange={(e) => updateRow(row.id, { description: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-xs"
                        value={row.unit}
                        onChange={(e) => updateRow(row.id, { unit: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-xs"
                        value={row.quantity}
                        onChange={(e) => updateRow(row.id, { quantity: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-xs"
                        value={row.unitPriceHT}
                        onChange={(e) => updateRow(row.id, { unitPriceHT: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-xs"
                        value={row.vatRate}
                        onChange={(e) => updateRow(row.id, { vatRate: e.target.value })}
                      />
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-xs font-medium text-slate-800">{fmtEur(ht)}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-xs font-medium text-slate-800">{fmtEur(ttc)}</td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        className="rounded-lg px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:grid-cols-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Sous-totaux par lot (aperçu)</h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {[...byLot.entries()]
              .sort(([a], [b]) => a.localeCompare(b, "fr"))
              .map(([lot, v]) => (
                <li key={lot} className="flex justify-between gap-4">
                  <span className="font-medium text-slate-900">{lot}</span>
                  <span>
                    HT {fmtEur(v.ht)} · TTC {fmtEur(v.ttc)}
                  </span>
                </li>
              ))}
          </ul>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Totaux document (aperçu)</h3>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt>Total HT</dt>
              <dd className="font-semibold">{fmtEur(subHt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Total TVA</dt>
              <dd className="font-semibold">{fmtEur(subVat)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2 text-base">
              <dt className="font-bold text-slate-900">Total TTC</dt>
              <dd className="font-bold text-[#1e3a5f]">{fmtEur(subTtc)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-[11px] text-slate-500">
            Les montants définitifs sont recalculés côté serveur à l&apos;enregistrement.
          </p>
        </div>
      </div>

      {pickerOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Bibliothèque ouvrages"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-bold text-slate-900">Ajouter depuis la bibliothèque</h2>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Fermer
              </button>
            </div>
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
              <input
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Code, lot, titre, désignation…"
                value={pickerQ}
                onChange={(e) => setPickerQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    runPickerSearch();
                  }
                }}
              />
              <button
                type="button"
                onClick={() => runPickerSearch()}
                disabled={pickerLoading || pending}
                className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#152a45] disabled:opacity-50"
              >
                Rechercher
              </button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto">
              {pickerResults.length === 0 ? (
                <p className="p-6 text-center text-sm text-slate-500">Lancez une recherche pour afficher des ouvrages.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {pickerResults.map((w) => {
                    const on = pickerSelected.has(w.id);
                    return (
                      <li key={w.id}>
                        <button
                          type="button"
                          onClick={() => togglePicker(w.id)}
                          className={`flex w-full flex-col gap-1 px-4 py-3 text-left text-sm transition ${
                            on ? "bg-[#1e3a5f]/10" : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className="font-semibold text-slate-900">
                              {w.code} · {w.title}
                            </span>
                            <span className="text-xs text-slate-500">Lot {w.lot}</span>
                          </div>
                          <span className="line-clamp-2 text-xs text-slate-600">{w.fullDescription}</span>
                          <span className="text-xs text-slate-500">
                            Unité {w.unit}
                            {w.avgHt != null ? ` · Prix moyen HT observé : ${fmtEur(w.avgHt)}` : ""}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 p-4">
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => addPickerSelection()}
                disabled={pending || pickerSelected.size === 0}
                className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#152a45] disabled:opacity-50"
              >
                Ajouter la sélection ({pickerSelected.size})
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
