"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { QuoteLineDraft } from "@/app/dashboard/devis/quote-actions";
import { saveQuoteDocumentLines, searchWorkItemsForQuoteAction } from "@/app/dashboard/devis/quote-actions";
import type { QuotePickerWorkItem } from "@/lib/be-work-devis-quote-picker";
import { WORK_ITEM_UNITS } from "@/lib/be-work-devis-units";
import {
  applyLineKind,
  fmtEur,
  isBillableKind,
  lineKindFromDraft,
  lineMoney,
  newLineDraft,
  parseNum,
  QUOTE_LINE_KIND_LABELS,
  QUOTE_LINE_KIND_META,
  type QuoteLineKind,
} from "@/lib/quote-line-editor";

export type QuoteLineEditorErpProps = {
  documentId: string;
  initialLines: QuoteLineDraft[];
  defaultVatRate: string;
};

function newTmpId() {
  return `tmp-${crypto.randomUUID()}`;
}

function draftFromWorkItem(w: QuotePickerWorkItem, sortOrder: number, defaultVat: string): QuoteLineDraft {
  const kind: QuoteLineKind =
    w.family?.toLowerCase().includes("service") || w.lot.toLowerCase().includes("main") ? "service" : "produit";
  const base: QuoteLineDraft = {
    id: newTmpId(),
    workItemId: w.id,
    lot: w.lot,
    family: w.family,
    code: w.code,
    title: w.title,
    description: w.fullDescription,
    unit: w.unit,
    quantity: "1",
    unitPriceHT: w.avgHt != null ? String(w.avgHt) : "0",
    vatRate: defaultVat,
    includedItems: w.includedItems,
    excludedItems: w.excludedItems,
    vigilancePoints: w.vigilancePoints,
    sortOrder,
  };
  return applyLineKind(base, kind);
}

const FAMILLE_OPTIONS = ["Produit", "Service"] as const;

export function QuoteLineEditorErp({ documentId, initialLines, defaultVatRate }: QuoteLineEditorErpProps) {
  const router = useRouter();
  const [lines, setLines] = useState<QuoteLineDraft[]>(initialLines);
  const [discounts, setDiscounts] = useState<Record<string, number>>({});
  const [multiLineIds, setMultiLineIds] = useState<Set<string>>(() => new Set());
  const [showImages, setShowImages] = useState(false);
  const [entryTtc, setEntryTtc] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [globalResults, setGlobalResults] = useState<QuotePickerWorkItem[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [activeSearchRowId, setActiveSearchRowId] = useState<string | null>(null);
  const [rowSearchQ, setRowSearchQ] = useState("");
  const [rowResults, setRowResults] = useState<QuotePickerWorkItem[]>([]);
  const [rowLoading, setRowLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const addMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLines(initialLines);
  }, [initialLines]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setAddMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const sortedLines = useMemo(() => [...lines].sort((a, b) => a.sortOrder - b.sortOrder), [lines]);

  const totals = useMemo(() => {
    let subHt = 0;
    let subTtc = 0;
    let produits = 0;
    let services = 0;
    for (const row of sortedLines) {
      const kind = lineKindFromDraft(row);
      if (!isBillableKind(kind)) continue;
      const disc = discounts[row.id] ?? 0;
      const { ht, ttc } = lineMoney(row.quantity, row.unitPriceHT, row.vatRate, disc);
      subHt += ht;
      subTtc += ttc;
      if (kind === "service") services += ht;
      else produits += ht;
    }
    return { subHt, subTtc, produits, services };
  }, [sortedLines, discounts]);

  const runSearch = useCallback(async (q: string, target: "global" | "row") => {
    const t = q.trim();
    if (t.length < 2) {
      if (target === "global") setGlobalResults([]);
      else setRowResults([]);
      return;
    }
    if (target === "global") setGlobalLoading(true);
    else setRowLoading(true);
    try {
      const rows = await searchWorkItemsForQuoteAction(t);
      if (target === "global") setGlobalResults(rows);
      else setRowResults(rows);
    } finally {
      if (target === "global") setGlobalLoading(false);
      else setRowLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (globalSearch.trim().length >= 2) void runSearch(globalSearch, "global");
      else setGlobalResults([]);
    }, 280);
    return () => clearTimeout(t);
  }, [globalSearch, runSearch]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (activeSearchRowId && rowSearchQ.trim().length >= 2) void runSearch(rowSearchQ, "row");
      else setRowResults([]);
    }, 280);
    return () => clearTimeout(t);
  }, [rowSearchQ, activeSearchRowId, runSearch]);

  function updateRow(id: string, patch: Partial<QuoteLineDraft>) {
    setLines((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRow(id: string) {
    setLines((prev) => prev.filter((r) => r.id !== id));
    setDiscounts((d) => {
      const next = { ...d };
      delete next[id];
      return next;
    });
  }

  function insertLine(kind: QuoteLineKind, afterId?: string) {
    const sorted = [...lines].sort((a, b) => a.sortOrder - b.sortOrder);
    let insertAt = sorted.length;
    if (afterId) {
      const idx = sorted.findIndex((r) => r.id === afterId);
      if (idx >= 0) insertAt = idx + 1;
    }
    const nextOrder = sorted.reduce((m, r) => Math.max(m, r.sortOrder), 0) + 1;
    const row = newLineDraft(kind, nextOrder, defaultVatRate);
    const next = [...sorted];
    next.splice(insertAt, 0, row);
    setLines(next.map((r, i) => ({ ...r, sortOrder: i })));
    setAddMenuOpen(false);
    if (kind === "produit" || kind === "service") {
      setActiveSearchRowId(row.id);
      setRowSearchQ("");
    }
  }

  function applyWorkItem(rowId: string | null, w: QuotePickerWorkItem) {
    const sorted = [...lines].sort((a, b) => a.sortOrder - b.sortOrder);
    if (rowId) {
      const draft = draftFromWorkItem(w, 0, defaultVatRate);
      updateRow(rowId, {
        ...draft,
        id: rowId,
        sortOrder: lines.find((l) => l.id === rowId)?.sortOrder ?? 0,
      });
    } else {
      const nextOrder = sorted.reduce((m, r) => Math.max(m, r.sortOrder), 0) + 1;
      setLines((prev) => [...prev, draftFromWorkItem(w, nextOrder, defaultVatRate)]);
    }
    setActiveSearchRowId(null);
    setRowSearchQ("");
    setRowResults([]);
    setGlobalSearch("");
    setGlobalResults([]);
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
  const isEmpty = sortedLines.length === 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#eef1f5] shadow-sm">
      {/* Barre APERÇU */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-white px-4 py-3">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Aperçu</span>
        <div className="flex flex-wrap items-center gap-6 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          <label className="flex cursor-pointer items-center gap-2">
            <Toggle checked={showImages} onChange={setShowImages} />
            Afficher les images
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <Toggle checked={entryTtc} onChange={setEntryTtc} />
            Saisie TTC
          </label>
        </div>
      </header>

      {message ? (
        <p className="mx-4 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="status">
          {message}
        </p>
      ) : null}

      <div className="flex min-h-[520px] flex-col lg:flex-row">
        {/* Sidebar gauche */}
        <aside className="flex w-full shrink-0 flex-col gap-4 border-b border-slate-200/80 bg-[#eef1f5] p-4 lg:w-56 lg:border-b-0 lg:border-r">
          <button
            type="button"
            onClick={() => {
              setGlobalSearch("");
              setGlobalResults([]);
              document.getElementById("erp-global-search")?.focus();
            }}
            className="flex flex-col items-center gap-2 rounded-xl bg-sky-100 px-3 py-4 text-center text-[11px] font-bold uppercase tracking-wide text-[#1e3a5f] shadow-sm transition hover:bg-sky-200"
          >
            <SearchIcon className="h-6 w-6" />
            Rechercher un article
          </button>

          <div ref={addMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setAddMenuOpen((o) => !o)}
              className="flex w-full flex-col items-center gap-2 rounded-xl bg-[#1e3a5f] px-3 py-4 text-center text-[11px] font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-[#152a45]"
            >
              <PlusIcon className="h-6 w-6" />
              Ajouter une ligne
            </button>
            {addMenuOpen ? (
              <ul className="absolute left-0 top-full z-30 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl lg:left-full lg:top-0 lg:ml-2 lg:mt-0">
                {(Object.keys(QUOTE_LINE_KIND_LABELS) as QuoteLineKind[]).map((kind) => {
                  const meta = QUOTE_LINE_KIND_META[kind];
                  return (
                    <li key={kind}>
                      <button
                        type="button"
                        onClick={() => insertLine(kind)}
                        className="flex w-full gap-3 px-3 py-2.5 text-left text-sm hover:bg-slate-50"
                      >
                        <span className={`mt-1 h-8 w-1 shrink-0 rounded ${meta.accent}`} />
                        <span>
                          <span className="font-semibold text-slate-900">{QUOTE_LINE_KIND_LABELS[kind]}</span>
                          <span className="mt-0.5 block text-xs text-slate-500">{meta.description}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>

          <div className="mt-auto space-y-2 border-t border-slate-200/80 pt-4 text-sm">
            <TotalRow label="Total HT" value={fmtEur(totals.subHt)} />
            <TotalRow label="Total TTC" value={fmtEur(totals.subTtc)} />
            <TotalRow label="Produits" value={fmtEur(totals.produits)} className="text-sky-700" />
            <TotalRow label="Services" value={fmtEur(totals.services)} className="text-amber-700" />
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={() => saveLines()}
              disabled={pending}
              className="rounded-xl bg-[#1e3a5f] px-3 py-2.5 text-sm font-semibold text-white hover:bg-[#152a45] disabled:opacity-50"
            >
              Enregistrer les lignes
            </button>
            <a
              href={pdfHref}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              PDF
            </a>
          </div>
        </aside>

        {/* Zone centrale */}
        <div className="min-w-0 flex-1 p-4">
          {/* Recherche globale */}
          <div className="mb-4">
            <input
              id="erp-global-search"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm"
              placeholder="Rechercher un article (code, titre, lot…) — min. 2 caractères"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
            {globalSearch.trim().length >= 2 ? (
              <SearchResults
                loading={globalLoading}
                results={globalResults}
                onPick={(w) => applyWorkItem(null, w)}
              />
            ) : null}
          </div>

          {isEmpty ? (
            <EmptyState
              onSearch={() => document.getElementById("erp-global-search")?.focus()}
              onAddLine={() => setAddMenuOpen(true)}
            />
          ) : (
            <ul className="space-y-3">
              {sortedLines.map((row) => (
                <LineCard
                  key={row.id}
                  row={row}
                  defaultVatRate={defaultVatRate}
                  discount={discounts[row.id] ?? 0}
                  multiLine={multiLineIds.has(row.id)}
                  entryTtc={entryTtc}
                  activeSearch={activeSearchRowId === row.id}
                  rowSearchQ={activeSearchRowId === row.id ? rowSearchQ : row.title}
                  rowResults={activeSearchRowId === row.id ? rowResults : []}
                  rowLoading={activeSearchRowId === row.id && rowLoading}
                  onDiscountChange={(v) => setDiscounts((d) => ({ ...d, [row.id]: v }))}
                  onToggleMultiLine={() =>
                    setMultiLineIds((s) => {
                      const n = new Set(s);
                      if (n.has(row.id)) n.delete(row.id);
                      else n.add(row.id);
                      return n;
                    })
                  }
                  onUpdate={(patch) => updateRow(row.id, patch)}
                  onRemove={() => removeRow(row.id)}
                  onInsertAfter={() => insertLine("service", row.id)}
                  onFocusDesignation={() => {
                    setActiveSearchRowId(row.id);
                    setRowSearchQ(row.title);
                  }}
                  onDesignationChange={(v) => {
                    setActiveSearchRowId(row.id);
                    setRowSearchQ(v);
                    updateRow(row.id, { title: v });
                  }}
                  onPickWorkItem={(w) => applyWorkItem(row.id, w)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition ${checked ? "bg-[#1e3a5f]" : "bg-slate-300"}`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${checked ? "left-4" : "left-0.5"}`}
      />
    </button>
  );
}

function TotalRow({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-xs font-semibold uppercase text-slate-500">{label}</span>
      <span className={`font-semibold text-slate-900 ${className}`}>{value}</span>
    </div>
  );
}

function EmptyState({ onSearch, onAddLine }: { onSearch: () => void; onAddLine: () => void }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
      <h3 className="text-xl font-semibold text-slate-700">Votre document est vide</h3>
      <p className="mt-2 text-sm text-slate-500">
        Insérez des articles ou des lignes de mise en forme en cliquant sur les boutons ci-dessous et laissez-vous guider ;)
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onSearch}
          className="flex flex-1 flex-col items-center gap-2 rounded-xl bg-sky-100 px-4 py-6 text-[11px] font-bold uppercase tracking-wide text-[#1e3a5f] hover:bg-sky-200 sm:max-w-[200px]"
        >
          <SearchIcon className="h-8 w-8" />
          Rechercher un article
        </button>
        <button
          type="button"
          onClick={onAddLine}
          className="flex flex-1 flex-col items-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-6 text-[11px] font-bold uppercase tracking-wide text-white hover:bg-[#152a45] sm:max-w-[200px]"
        >
          <PlusIcon className="h-8 w-8" />
          Ajouter une ligne
        </button>
      </div>
    </div>
  );
}

function SearchResults({
  loading,
  results,
  onPick,
}: {
  loading: boolean;
  results: QuotePickerWorkItem[];
  onPick: (w: QuotePickerWorkItem) => void;
}) {
  return (
    <ul className="mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
      {loading ? (
        <li className="px-4 py-3 text-sm text-slate-500">Recherche…</li>
      ) : results.length === 0 ? (
        <li className="px-4 py-3 text-sm text-slate-500">Aucun résultat.</li>
      ) : (
        results.map((w) => (
          <li key={w.id}>
            <button
              type="button"
              onClick={() => onPick(w)}
              className="w-full border-b border-slate-50 px-4 py-3 text-left hover:bg-sky-50"
            >
              <p className="text-sm font-semibold text-slate-900">{w.title}</p>
              <p className="text-xs text-slate-500">
                {QUOTE_LINE_KIND_LABELS[lineKindFromPicker(w)]} : {w.code} · {w.lot}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-slate-600">{w.fullDescription}</p>
            </button>
          </li>
        ))
      )}
    </ul>
  );
}

function lineKindFromPicker(w: QuotePickerWorkItem): QuoteLineKind {
  return w.family?.toLowerCase().includes("service") ? "service" : "produit";
}

type LineCardProps = {
  row: QuoteLineDraft;
  defaultVatRate: string;
  discount: number;
  multiLine: boolean;
  entryTtc: boolean;
  activeSearch: boolean;
  rowSearchQ: string;
  rowResults: QuotePickerWorkItem[];
  rowLoading: boolean;
  onDiscountChange: (v: number) => void;
  onToggleMultiLine: () => void;
  onUpdate: (patch: Partial<QuoteLineDraft>) => void;
  onRemove: () => void;
  onInsertAfter: () => void;
  onFocusDesignation: () => void;
  onDesignationChange: (v: string) => void;
  onPickWorkItem: (w: QuotePickerWorkItem) => void;
};

function LineCard({
  row,
  discount,
  multiLine,
  entryTtc,
  activeSearch,
  rowSearchQ,
  rowResults,
  rowLoading,
  onDiscountChange,
  onToggleMultiLine,
  onUpdate,
  onRemove,
  onInsertAfter,
  onFocusDesignation,
  onDesignationChange,
  onPickWorkItem,
}: LineCardProps) {
  const kind = lineKindFromDraft(row);
  const billable = isBillableKind(kind);

  if (kind === "interligne") {
    return <li className="h-6" aria-hidden />;
  }
  if (kind === "trait") {
    return (
      <li className="py-2">
        <hr className="border-slate-300" />
      </li>
    );
  }

  const { ht } = lineMoney(row.quantity, row.unitPriceHT, row.vatRate, discount);
  const famille = row.family === "Service" ? "Service" : row.family === "Produit" ? "Produit" : row.family ?? "Produit";

  return (
    <li className="relative rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <button
        type="button"
        onClick={onInsertAfter}
        className="absolute -bottom-2 left-1/2 z-10 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-xs text-slate-500 hover:bg-slate-50"
        title="Insérer une ligne après"
      >
        +
      </button>

      {!billable ? (
        <div className="flex items-start gap-3">
          <span className={`mt-1 h-8 w-1 shrink-0 rounded ${QUOTE_LINE_KIND_META[kind].accent}`} />
          {kind === "texte_libre" ? (
            <textarea
              className="min-h-[80px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={row.description}
              placeholder="Mentions, explications…"
              onChange={(e) => onUpdate({ description: e.target.value, title: e.target.value.slice(0, 80) || "Texte" })}
            />
          ) : (
            <p className="flex-1 py-2 text-sm font-semibold text-slate-800">{QUOTE_LINE_KIND_LABELS[kind]}</p>
          )}
          <button type="button" onClick={onRemove} className="text-red-600 hover:text-red-800" aria-label="Supprimer">
            <TrashIcon />
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-end gap-2 lg:flex-nowrap lg:gap-3">
          <Field label="Désignation" className="min-w-[200px] flex-[2]">
            <div className="relative">
              {multiLine ? (
                <textarea
                  className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  rows={3}
                  value={row.description || row.title}
                  onChange={(e) => onUpdate({ description: e.target.value, title: e.target.value.split("\n")[0] ?? "" })}
                />
              ) : (
                <input
                  className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-medium"
                  value={row.title}
                  onFocus={onFocusDesignation}
                  onChange={(e) => onDesignationChange(e.target.value)}
                />
              )}
              {activeSearch && rowSearchQ.trim().length >= 2 ? (
                <SearchResults loading={rowLoading} results={rowResults} onPick={onPickWorkItem} />
              ) : null}
            </div>
            <label className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
              <input type="checkbox" checked={multiLine} onChange={onToggleMultiLine} className="rounded" />
              Mode multi-lignes
            </label>
          </Field>

          <Field label="Quantité" className="w-20">
            <input
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-right"
              value={row.quantity}
              onChange={(e) => onUpdate({ quantity: e.target.value })}
            />
          </Field>

          <Field label="Unité" className="w-24">
            <select
              className="w-full rounded-lg border border-slate-200 px-1 py-1.5 text-sm"
              value={row.unit}
              onChange={(e) => onUpdate({ unit: e.target.value })}
            >
              <option value={row.unit}>{row.unit}</option>
              {WORK_ITEM_UNITS.filter((u) => u !== row.unit).map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Référence" className="w-24">
            <input
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
              value={row.code ?? ""}
              onChange={(e) => onUpdate({ code: e.target.value || null })}
            />
          </Field>

          <Field label="Famille" className="w-28">
            <select
              className="w-full rounded-lg border border-slate-200 px-1 py-1.5 text-sm"
              value={famille}
              onChange={(e) => {
                const v = e.target.value;
                const k: QuoteLineKind = v === "Service" ? "service" : "produit";
                onUpdate(applyLineKind(row, k));
              }}
            >
              {FAMILLE_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Remise %" className="w-20">
            <input
              type="number"
              min={0}
              max={100}
              step={0.01}
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-right"
              value={discount}
              onChange={(e) => onDiscountChange(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
            />
          </Field>

          <Field label="TVA" className="w-20">
            <input
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-right"
              value={row.vatRate}
              onChange={(e) => onUpdate({ vatRate: e.target.value })}
            />
          </Field>

          <Field label={entryTtc ? "Montant TTC" : "Montant HT"} className="w-28">
            {entryTtc ? (
              <input
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-right font-semibold"
                readOnly
                value={fmtEur(lineMoney(row.quantity, row.unitPriceHT, row.vatRate, discount).ttc)}
              />
            ) : (
              <input
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-right font-semibold"
                readOnly
                value={fmtEur(ht)}
              />
            )}
          </Field>

          <Field label="PU" className="w-24">
            <input
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-right"
              value={row.unitPriceHT}
              onChange={(e) => onUpdate({ unitPriceHT: e.target.value })}
            />
          </Field>

          <button type="button" onClick={onRemove} className="mb-1 shrink-0 text-red-600 hover:text-red-800" aria-label="Supprimer">
            <TrashIcon />
          </button>
        </div>
      )}
    </li>
  );
}

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
      {children}
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}
