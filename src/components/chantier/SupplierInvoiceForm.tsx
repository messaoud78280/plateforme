"use client";

import { useEffect, useState } from "react";
import {
  SUPPLIER_INVOICE_CATEGORIES,
  SUPPLIER_INVOICE_CATEGORY_LABELS,
  type SupplierCostCategory,
  type SupplierInvoiceDto,
} from "@/lib/chantier/supplier-invoices";

type Props = {
  projectId: string;
  purchaseOrderId?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  defaultAmountHt?: number | null;
  defaultCategory?: SupplierCostCategory;
  onCreated?: (invoice: SupplierInvoiceDto) => void;
};

export function SupplierInvoiceForm({
  projectId,
  purchaseOrderId,
  supplierId: supplierIdProp,
  supplierName,
  defaultAmountHt,
  defaultCategory = "UNCLASSIFIED",
  onCreated,
}: Props) {
  const [supplierId, setSupplierId] = useState(supplierIdProp ?? "");
  const [suppliers, setSuppliers] = useState<
    Array<{ id: string; name: string; tradeName: string | null }>
  >([]);
  const [supplierNumber, setSupplierNumber] = useState("");
  const [kind, setKind] = useState<"STANDARD" | "CREDIT">("STANDARD");
  const [category, setCategory] = useState<SupplierCostCategory>(defaultCategory);
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [amountHt, setAmountHt] = useState(
    defaultAmountHt != null ? String(defaultAmountHt) : "",
  );
  const [amountVat, setAmountVat] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    if (supplierIdProp) return;
    void (async () => {
      const res = await fetch("/api/suppliers?types=SUPPLIER,SUBCONTRACTOR");
      const data = await res.json().catch(() => null);
      if (res.ok && Array.isArray(data?.suppliers)) {
        setSuppliers(data.suppliers);
      }
    })();
  }, [supplierIdProp]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch("/api/supplier-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          purchaseOrderId: purchaseOrderId || null,
          externalOrganizationId: supplierId,
          supplierNumber,
          kind,
          category,
          invoiceDate,
          amountHt: Number(amountHt),
          amountVat: amountVat === "" ? 0 : Number(amountVat),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setOk("Facture enregistrée — elle alimente le réel du chantier.");
      setSupplierNumber("");
      onCreated?.(data.invoice);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-3">
      <p className="text-xs text-slate-500">
        Dépense réelle constatée. Ne pas recompter avec la réception du même BC.
        {supplierName ? ` Fournisseur : ${supplierName}.` : ""}
      </p>
      {!supplierIdProp ? (
        <label className="block text-xs font-semibold text-slate-600">
          Fournisseur
          <select
            required
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Choisir…</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.tradeName || s.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-600">
          N° facture fournisseur
          <input
            required
            value={supplierNumber}
            onChange={(e) => setSupplierNumber(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="FA-2026-…"
          />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Date
          <input
            type="date"
            required
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Type
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as "STANDARD" | "CREDIT")}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="STANDARD">Facture</option>
            <option value="CREDIT">Avoir</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Poste
          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as SupplierCostCategory)
            }
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            {SUPPLIER_INVOICE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {SUPPLIER_INVOICE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">
          HT €
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={amountHt}
            onChange={(e) => setAmountHt(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm tabular-nums"
          />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          TVA €
          <input
            type="number"
            min="0"
            step="0.01"
            value={amountVat}
            onChange={(e) => setAmountVat(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm tabular-nums"
          />
        </label>
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {ok ? <p className="text-sm text-emerald-700">{ok}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
      >
        {busy ? "…" : "Enregistrer la dépense"}
      </button>
    </form>
  );
}
