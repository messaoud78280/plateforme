"use client";

import { useEffect, useMemo, useState } from "react";
import {
  SUPPLIER_INVOICE_CATEGORIES,
  SUPPLIER_INVOICE_CATEGORY_LABELS,
  type SupplierCostCategory,
  type SupplierInvoiceDto,
} from "@/lib/chantier/supplier-invoices";
import {
  computeInvoiceVariance,
  type SupplierInvoicePrefill,
} from "@/lib/chantier/prepare-supplier-invoice";

type Props = {
  projectId: string;
  purchaseOrderId?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  defaultAmountHt?: number | null;
  defaultCategory?: SupplierCostCategory;
  hideCategory?: boolean;
  context?: SupplierInvoicePrefill | null;
  onCreated?: (invoice: SupplierInvoiceDto) => void;
};

function money(n: number) {
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function SupplierInvoiceForm({
  projectId,
  purchaseOrderId,
  supplierId: supplierIdProp,
  supplierName,
  defaultAmountHt,
  defaultCategory = "UNCLASSIFIED",
  hideCategory = false,
  context = null,
  onCreated,
}: Props) {
  const fromPo = Boolean(context || purchaseOrderId);
  const [supplierId, setSupplierId] = useState(supplierIdProp ?? context?.supplierId ?? "");
  const [suppliers, setSuppliers] = useState<
    Array<{ id: string; name: string; tradeName: string | null }>
  >([]);
  const [supplierNumber, setSupplierNumber] = useState("");
  const [kind, setKind] = useState<"STANDARD" | "CREDIT">("STANDARD");
  const [category, setCategory] = useState<SupplierCostCategory>(
    context?.category && context.categoryKnown ? context.category : defaultCategory,
  );
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [amountHt, setAmountHt] = useState(
    fromPo ? "" : defaultAmountHt != null ? String(defaultAmountHt) : "",
  );
  const [amountVat, setAmountVat] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    setCategory(
      context?.category && context.categoryKnown ? context.category : defaultCategory,
    );
  }, [defaultCategory, context?.category, context?.categoryKnown]);

  useEffect(() => {
    if (supplierIdProp || context?.supplierId) return;
    void (async () => {
      const res = await fetch("/api/suppliers?types=SUPPLIER,SUBCONTRACTOR");
      const data = await res.json().catch(() => null);
      if (res.ok && Array.isArray(data?.suppliers)) {
        setSuppliers(data.suppliers);
      }
    })();
  }, [supplierIdProp, context?.supplierId]);

  const typedHt = Number(amountHt);
  const variance = useMemo(() => {
    if (!fromPo || !Number.isFinite(typedHt) || amountHt === "") return null;
    return computeInvoiceVariance(context?.orderAmountHt ?? defaultAmountHt ?? null, typedHt);
  }, [fromPo, typedHt, amountHt, context?.orderAmountHt, defaultAmountHt]);

  const hideCat = hideCategory || Boolean(context?.categoryKnown);
  const categoryLabel =
    context?.categoryLabel || SUPPLIER_INVOICE_CATEGORY_LABELS[category];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const payload = {
        projectId: context?.projectId || projectId,
        purchaseOrderId: context?.purchaseOrderId || purchaseOrderId || null,
        externalOrganizationId: supplierId || context?.supplierId || "",
        supplierNumber,
        kind,
        category,
        invoiceDate,
        amountHt: Number(amountHt),
        amountVat: amountVat === "" ? 0 : Number(amountVat),
      };
      let res: Response;
      if (pdfFile && payload.purchaseOrderId) {
        const form = new FormData();
        for (const [k, v] of Object.entries(payload)) {
          if (v != null) form.set(k, String(v));
        }
        form.set("pdfFile", pdfFile);
        res = await fetch("/api/supplier-invoices", { method: "POST", body: form });
      } else {
        res = await fetch("/api/supplier-invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setOk("Facture enregistrée — elle alimente le réel du chantier.");
      setSupplierNumber("");
      setAmountHt("");
      setAmountVat("");
      setPdfFile(null);
      onCreated?.(data.invoice);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-3">
      {context ? (
        <dl className="grid gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-bold uppercase text-slate-500">Fournisseur</dt>
            <dd className="font-medium text-slate-900">{context.supplierName || "—"}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase text-slate-500">Commande</dt>
            <dd className="font-medium text-slate-900">{context.purchaseOrderNumber}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase text-slate-500">Chantier</dt>
            <dd className="font-medium text-slate-900">{context.projectTitle || "—"}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase text-slate-500">Type</dt>
            <dd className="font-medium text-slate-900">
              {context.categoryKnown ? context.categoryLabel : "À préciser"}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase text-slate-500">Montant commande</dt>
            <dd className="tabular-nums font-medium text-slate-900">
              {context.orderAmountHt != null ? `${money(context.orderAmountHt)} € HT` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase text-slate-500">Réceptionné</dt>
            <dd className="tabular-nums font-medium text-slate-900">
              {context.hasReceipt
                ? `${money(context.receivedAmountHt ?? 0)} € HT · ${context.receivedQty} / ${context.orderedQty}`
                : "Aucune réception enregistrée"}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="text-xs text-slate-500">
          Dépense réelle constatée. Ne pas recompter avec la réception du même BC.
          {supplierName ? ` Fournisseur : ${supplierName}.` : ""}
        </p>
      )}
      {context?.mixedCategories ? (
        <p className="text-xs text-slate-500">
          Commande mixte — préciser le poste de cette facture. Pas de ventilation
          automatique multi-catégorie.
        </p>
      ) : null}

      {!supplierIdProp && !context?.supplierId ? (
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
        {hideCat ? (
          <p className="text-xs text-slate-500 sm:col-span-2">
            Poste repris de la commande :{" "}
            <strong className="text-slate-800">{categoryLabel}</strong>
          </p>
        ) : (
          <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
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
                  {c === "EQUIPMENT"
                    ? "Matériel / location"
                    : SUPPLIER_INVOICE_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="text-xs font-semibold text-slate-600">
          Montant facture HT
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={amountHt}
            onChange={(e) => setAmountHt(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm tabular-nums"
            placeholder="Montant réel du fournisseur"
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

      {variance?.varianceHt != null ? (
        <p className="text-sm text-slate-700">
          Commande {money(variance.orderHt ?? 0)} € · Facture {money(variance.invoiceHt)} € ·{" "}
          <span className="font-semibold">
            Écart {variance.varianceHt > 0 ? "+" : ""}
            {money(variance.varianceHt)} €
          </span>
          {variance.overOrder ? (
            <span className="ml-2 text-amber-800">Montant supérieur à la commande.</span>
          ) : null}
        </p>
      ) : null}

      {fromPo ? (
        <label className="block text-xs font-semibold text-slate-600">
          Ajouter le PDF
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm"
          />
          <span className="mt-1 block text-[11px] font-normal text-slate-400">
            Optionnel. Même fichier dans la commande, le chantier et Documents.
          </span>
        </label>
      ) : null}

      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        className="text-xs font-semibold text-[#1d4ed8]"
      >
        {showMore ? "Moins d’options" : "Plus d’options"}
      </button>
      {showMore ? (
        <label className="block text-xs font-semibold text-slate-600">
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
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {ok ? <p className="text-sm text-emerald-700">{ok}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
      >
        {busy ? "…" : "Enregistrer la facture"}
      </button>
    </form>
  );
}
