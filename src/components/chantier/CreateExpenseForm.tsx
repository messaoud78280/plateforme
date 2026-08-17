"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SUPPLIER_INVOICE_CATEGORIES,
  SUPPLIER_INVOICE_CATEGORY_LABELS,
  type SupplierCostCategory,
} from "@/lib/chantier/supplier-invoices";
import { computeInvoiceVariance } from "@/lib/chantier/prepare-supplier-invoice";

type ProjectOpt = { id: string; title: string };
type SupplierOpt = { id: string; name: string; tradeName: string | null };
type PoOpt = {
  id: string;
  number: string;
  subject: string;
  amountHt: number | null;
  projectId: string | null;
  projectTitle: string | null;
  supplierId: string;
  supplierName: string;
  defaultCostCategory: string | null;
};

function money(n: number) {
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function CreateExpenseForm({
  projects,
  defaultProjectId,
  defaultSupplierId,
  defaultPurchaseOrderId,
  preferAssociate,
}: {
  projects: ProjectOpt[];
  defaultProjectId?: string | null;
  defaultSupplierId?: string | null;
  defaultPurchaseOrderId?: string | null;
  preferAssociate?: boolean;
}) {
  const router = useRouter();
  const [projectId, setProjectId] = useState(
    defaultProjectId && projects.some((p) => p.id === defaultProjectId)
      ? defaultProjectId
      : projects[0]?.id ?? "",
  );
  const [supplierId, setSupplierId] = useState(defaultSupplierId ?? "");
  const [suppliers, setSuppliers] = useState<SupplierOpt[]>([]);
  const [orders, setOrders] = useState<PoOpt[]>([]);
  const [purchaseOrderId, setPurchaseOrderId] = useState(defaultPurchaseOrderId ?? "");
  const [supplierNumber, setSupplierNumber] = useState("");
  const [kind, setKind] = useState<"STANDARD" | "CREDIT">("STANDARD");
  const [category, setCategory] = useState<SupplierCostCategory>("UNCLASSIFIED");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [amountHt, setAmountHt] = useState("");
  const [amountVat, setAmountVat] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/suppliers?types=SUPPLIER,SUBCONTRACTOR");
      const data = await res.json().catch(() => null);
      if (res.ok && Array.isArray(data?.suppliers)) {
        setSuppliers(data.suppliers);
      }
    })();
  }, []);

  useEffect(() => {
    if (!projectId && !supplierId) {
      setOrders([]);
      return;
    }
    void (async () => {
      const p = new URLSearchParams();
      if (projectId) p.set("projectId", projectId);
      if (supplierId) p.set("supplierId", supplierId);
      p.set("take", "40");
      const res = await fetch(`/api/purchase-orders?${p.toString()}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) return;
      const list = Array.isArray(data?.orders)
        ? data.orders
        : Array.isArray(data?.items)
          ? data.items
          : [];
      const mapped: PoOpt[] = list.map(
        (o: {
          id: string;
          number: string;
          subject?: string;
          amountHt?: unknown;
          projectId?: string | null;
          externalOrganizationId?: string;
          defaultCostCategory?: string | null;
          project?: { id?: string; title?: string } | null;
          externalOrganization?: {
            id?: string;
            name?: string;
            tradeName?: string | null;
          } | null;
        }) => ({
          id: o.id,
          number: o.number,
          subject: o.subject ?? "",
          amountHt: o.amountHt != null ? Number(o.amountHt) : null,
          projectId: o.projectId ?? o.project?.id ?? null,
          projectTitle: o.project?.title ?? null,
          supplierId: o.externalOrganizationId || o.externalOrganization?.id || "",
          supplierName:
            o.externalOrganization?.tradeName ||
            o.externalOrganization?.name ||
            "Fournisseur",
          defaultCostCategory: o.defaultCostCategory ?? null,
        }),
      );
      setOrders(mapped);
    })();
  }, [projectId, supplierId]);

  const selectedPo = useMemo(
    () => orders.find((o) => o.id === purchaseOrderId) ?? null,
    [orders, purchaseOrderId],
  );

  useEffect(() => {
    if (!selectedPo) return;
    if (selectedPo.projectId) setProjectId(selectedPo.projectId);
    if (selectedPo.supplierId) setSupplierId(selectedPo.supplierId);
    if (
      selectedPo.defaultCostCategory &&
      (SUPPLIER_INVOICE_CATEGORIES as string[]).includes(selectedPo.defaultCostCategory)
    ) {
      setCategory(selectedPo.defaultCostCategory as SupplierCostCategory);
    }
  }, [selectedPo]);

  const suggested = useMemo(() => {
    if (purchaseOrderId || !supplierId || !projectId) return null;
    return (
      orders.find((o) => o.supplierId === supplierId && o.projectId === projectId) ?? null
    );
  }, [orders, purchaseOrderId, supplierId, projectId]);

  const variance = useMemo(() => {
    const ht = Number(amountHt);
    if (!selectedPo || !Number.isFinite(ht) || amountHt === "") return null;
    return computeInvoiceVariance(selectedPo.amountHt, ht);
  }, [selectedPo, amountHt]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = {
        projectId,
        purchaseOrderId: purchaseOrderId || null,
        externalOrganizationId: supplierId,
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
      router.push("/dashboard/depenses");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="mx-auto max-w-2xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[#1e3a5f]">Fournisseur</h2>
        <label className="mt-3 block text-xs font-semibold text-slate-600">
          Sélection
          <select
            required
            value={supplierId}
            onChange={(e) => {
              setSupplierId(e.target.value);
              if (!preferAssociate) setPurchaseOrderId("");
            }}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          >
            <option value="">Choisir…</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.tradeName || s.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[#1e3a5f]">Chantier</h2>
        <label className="mt-3 block text-xs font-semibold text-slate-600">
          Sélection
          <select
            required
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[#1e3a5f]">Commande associée</h2>
        <p className="mt-1 text-xs text-slate-500">
          Optionnel. Reprend chantier, fournisseur et catégorie lorsque connus.
        </p>
        <label className="mt-3 block text-xs font-semibold text-slate-600">
          Bon de commande
          <select
            value={purchaseOrderId}
            onChange={(e) => setPurchaseOrderId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          >
            <option value="">Sans commande</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.number}
                {o.amountHt != null ? ` · ${money(o.amountHt)} €` : ""}
                {o.subject ? ` — ${o.subject.slice(0, 40)}` : ""}
              </option>
            ))}
          </select>
        </label>
        {suggested && !purchaseOrderId ? (
          <button
            type="button"
            onClick={() => setPurchaseOrderId(suggested.id)}
            className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left text-sm text-amber-950"
          >
            Commande possible : <strong>{suggested.number}</strong>
            {suggested.amountHt != null ? ` · ${money(suggested.amountHt)} € HT` : ""}
          </button>
        ) : null}
        {selectedPo?.defaultCostCategory ? (
          <p className="mt-2 text-xs text-slate-500">
            Catégorie reprise de la commande — pas de ressaisie inutile.
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[#1e3a5f]">Facture</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">
            N° facture fournisseur
            <input
              required
              value={supplierNumber}
              onChange={(e) => setSupplierNumber(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              placeholder="FAC-…"
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Date facture
            <input
              type="date"
              required
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
            Catégorie de coût
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as SupplierCostCategory)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            >
              {SUPPLIER_INVOICE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === "UNCLASSIFIED"
                    ? "À classer"
                    : c === "EQUIPMENT"
                      ? "Matériel"
                      : SUPPLIER_INVOICE_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Montant HT
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={amountHt}
              onChange={(e) => setAmountHt(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm tabular-nums"
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
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm tabular-nums"
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Type
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as "STANDARD" | "CREDIT")}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            >
              <option value="STANDARD">Facture</option>
              <option value="CREDIT">Avoir</option>
            </select>
          </label>
        </div>
        {variance?.varianceHt != null ? (
          <p className="mt-3 text-sm text-slate-700">
            Engagé {money(variance.orderHt ?? 0)} € · Réel {money(variance.invoiceHt)} € ·{" "}
            <strong>
              Écart {variance.varianceHt > 0 ? "+" : ""}
              {money(variance.varianceHt)} €
            </strong>
          </p>
        ) : null}
        {purchaseOrderId ? (
          <label className="mt-3 block text-xs font-semibold text-slate-600">
            Justificatif PDF
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm"
            />
            <span className="mt-1 block text-[11px] font-normal text-slate-400">
              Indexé dans Documents via la commande.
            </span>
          </label>
        ) : null}
      </section>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-[#1e3a5f] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto"
      >
        {busy ? "Enregistrement…" : "Enregistrer la dépense"}
      </button>
    </form>
  );
}
