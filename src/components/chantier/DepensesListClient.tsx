"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { roundMoney } from "@/lib/commercial/money";
import type { SupplierInvoiceDto } from "@/lib/chantier/supplier-invoices";
import { cn } from "@/lib/cn";

function fmt(n: number) {
  return roundMoney(n, 2).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function DepensesListClient({
  initial,
}: {
  initial: SupplierInvoiceDto[];
}) {
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return rows;
    return rows.filter((r) =>
      [r.supplierNumber, r.supplierName, r.projectTitle, r.purchaseOrderNumber]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(qq),
    );
  }, [rows, q]);

  async function cancel(id: string) {
    if (!window.confirm("Annuler cette facture fournisseur ? Elle sortira du réel.")) {
      return;
    }
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/supplier-invoices/${id}/cancel`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setRows((prev) =>
        prev.map((r) => (r.id === id && data.invoice ? data.invoice : r)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Chantier, fournisseur, n°…"
        className="w-full max-w-sm rounded-xl border border-slate-200 px-3 py-2 text-sm"
      />
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
          Aucune dépense enregistrée.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {filtered.map((r) => (
            <li
              key={r.id}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-slate-900">
                  {r.supplierNumber}
                  <span
                    className={cn(
                      "ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold",
                      r.status === "CANCELLED"
                        ? "bg-slate-100 text-slate-500"
                        : r.kind === "CREDIT"
                          ? "bg-amber-50 text-amber-800"
                          : "bg-emerald-50 text-emerald-800",
                    )}
                  >
                    {r.statusLabel}
                    {r.kind === "CREDIT" ? " · Avoir" : ""}
                  </span>
                </p>
                <p className="text-xs text-slate-500">
                  {r.supplierName ?? "Fournisseur"} · {r.categoryLabel}
                  {r.projectTitle ? ` · ${r.projectTitle}` : ""}
                  {r.purchaseOrderNumber ? ` · ${r.purchaseOrderNumber}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="tabular-nums font-semibold">
                  {fmt(r.signedHt)} €
                </p>
                {r.projectId ? (
                  <Link
                    href={`/dashboard/projets/${r.projectId}#tab-rentabilite`}
                    className="text-xs font-semibold text-[#1d4ed8]"
                  >
                    Rentabilité
                  </Link>
                ) : null}
                {r.status === "RECORDED" ? (
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => void cancel(r.id)}
                    className="text-xs font-semibold text-red-700 disabled:opacity-50"
                  >
                    Annuler
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
