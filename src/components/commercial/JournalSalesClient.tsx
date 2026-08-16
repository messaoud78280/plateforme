"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Row = {
  id: string;
  number: string;
  status: string;
  statusLabel: string;
  client: string;
  issueDate: string | null;
  totalHt: number;
  totalVat: number;
  totalTtc: number;
  amountPaid: number;
  amountDue: number;
};

function money(n: number) {
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function JournalSalesClient({
  initialRows,
  initialQ,
  initialStatus,
}: {
  initialRows: Row[];
  initialQ: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [status, setStatus] = useState(initialStatus);

  function apply() {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (status) p.set("status", status);
    const qs = p.toString();
    router.replace(
      qs
        ? `/dashboard/devis-facturation/journal?${qs}`
        : "/dashboard/devis-facturation/journal",
    );
  }

  function exportCsv() {
    const header = [
      "Date",
      "Numéro",
      "Client",
      "HT",
      "TVA",
      "TTC",
      "Statut",
      "Payé",
      "Reste dû",
    ];
    const lines = initialRows.map((r) =>
      [
        r.issueDate ? new Date(r.issueDate).toLocaleDateString("fr-FR") : "",
        r.number,
        r.client,
        money(r.totalHt),
        money(r.totalVat),
        money(r.totalTtc),
        r.statusLabel,
        money(r.amountPaid),
        money(r.amountDue),
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(";"),
    );
    const blob = new Blob([[header.join(";"), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `journal-ventes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="Client, numéro…"
          className="min-w-[12rem] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">Tous statuts</option>
          <option value="DRAFT">Brouillon</option>
          <option value="ISSUED">Émise</option>
          <option value="PARTIALLY_PAID">Partiellement payée</option>
          <option value="PAID">Payée</option>
          <option value="OVERDUE">En retard</option>
          <option value="CANCELLED">Annulée</option>
        </select>
        <button
          type="button"
          onClick={apply}
          className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
        >
          Filtrer
        </button>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">N°</th>
              <th className="px-3 py-2">Client</th>
              <th className="px-3 py-2">HT</th>
              <th className="px-3 py-2">TVA</th>
              <th className="px-3 py-2">TTC</th>
              <th className="px-3 py-2">Statut</th>
              <th className="px-3 py-2">Payé</th>
              <th className="px-3 py-2">Reste</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {initialRows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/80">
                <td className="px-3 py-2 text-slate-600">
                  {r.issueDate
                    ? new Date(r.issueDate).toLocaleDateString("fr-FR")
                    : "—"}
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={`/dashboard/devis-facturation/factures/${r.id}`}
                    className="font-semibold text-[#1e3a5f]"
                  >
                    {r.number}
                  </Link>
                </td>
                <td className="px-3 py-2 text-slate-700">{r.client}</td>
                <td className="px-3 py-2 tabular-nums">{money(r.totalHt)}</td>
                <td className="px-3 py-2 tabular-nums">{money(r.totalVat)}</td>
                <td className="px-3 py-2 tabular-nums font-medium">
                  {money(r.totalTtc)}
                </td>
                <td className="px-3 py-2 text-xs">{r.statusLabel}</td>
                <td className="px-3 py-2 tabular-nums">{money(r.amountPaid)}</td>
                <td className="px-3 py-2 tabular-nums">{money(r.amountDue)}</td>
              </tr>
            ))}
            {initialRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-slate-500">
                  Aucune facture.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
