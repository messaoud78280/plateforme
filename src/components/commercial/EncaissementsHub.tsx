"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  COMMERCIAL_INVOICE_STATUS_LABELS,
  COMMERCIAL_INVOICE_TYPE_LABELS,
  roundMoney,
} from "@/lib/commercial/money";
import { AGING_BUCKET_LABELS, type AgingBucket } from "@/lib/commercial/invoice-status";
import type { CollectionsFilter, CollectionsKpis, CollectionsRow } from "@/lib/commercial/collections";

function fmt(n: number) {
  return roundMoney(n, 2).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const FILTERS: { id: CollectionsFilter; label: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "upcoming", label: "À venir" },
  { id: "overdue", label: "En retard" },
  { id: "partial", label: "Partiellement payées" },
  { id: "paid", label: "Payées" },
];

export function EncaissementsHub({
  initialRows,
  kpis,
  initialFilter,
  initialQ,
}: {
  initialRows: CollectionsRow[];
  kpis: CollectionsKpis;
  initialFilter: CollectionsFilter;
  initialQ: string;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<CollectionsFilter>(initialFilter);
  const [q, setQ] = useState(initialQ);
  const [busyId, setBusyId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return initialRows.filter((r) => {
      if (filter === "upcoming") {
        if (r.status === "OVERDUE" || r.status === "PAID") return false;
        if (r.amountDue <= 0.004) return false;
        if (r.daysLate > 0) return false;
      } else if (filter === "overdue") {
        if (r.status !== "OVERDUE" && r.daysLate <= 0) return false;
        if (r.amountDue <= 0.004) return false;
      } else if (filter === "partial") {
        if (!(r.amountPaid > 0.004 && r.amountDue > 0.004)) return false;
      } else if (filter === "paid") {
        if (r.status !== "PAID") return false;
      }
      if (!qq) return true;
      const hay = [r.number, r.clientName, r.projectTitle, r.quoteNumber]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(qq);
    });
  }, [initialRows, filter, q]);

  function pushQuery(nextFilter: CollectionsFilter, nextQ: string) {
    const params = new URLSearchParams();
    if (nextFilter !== "all") params.set("filter", nextFilter);
    if (nextQ.trim()) params.set("q", nextQ.trim());
    const qs = params.toString();
    router.push(
      qs
        ? `/dashboard/devis-facturation/encaissements?${qs}`
        : "/dashboard/devis-facturation/encaissements",
    );
  }

  async function remind(id: string) {
    if (!confirm("Marquer cette facture comme relancée ?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/commercial/invoices/${id}/remind`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "MANUEL" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusyId(null);
    }
  }

  const kpiCards = [
    { label: "À encaisser", value: kpis.aEncaisserTtc, tone: "slate" },
    { label: "En retard", value: kpis.enRetardTtc, tone: "red" },
    { label: "Encaissé ce mois", value: kpis.encaisseMoisTtc, tone: "emerald" },
    { label: "Échéances 7 jours", value: kpis.echeances7jTtc, tone: "sky" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p
              className={`text-2xl font-extrabold tabular-nums ${
                k.tone === "red"
                  ? "text-red-700"
                  : k.tone === "emerald"
                    ? "text-emerald-700"
                    : k.tone === "sky"
                      ? "text-sky-800"
                      : "text-slate-900"
              }`}
            >
              {fmt(k.value)} €
            </p>
            <p className="mt-1 text-sm text-slate-600">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              setFilter(f.id);
              pushQuery(f.id, q);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              filter === f.id
                ? "bg-[#1e3a5f] text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") pushQuery(filter, q);
          }}
          placeholder="Facture, client, chantier…"
          className="ml-auto min-w-[12rem] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm sm:max-w-xs"
        />
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Facture</th>
              <th className="px-3 py-2">Client / Chantier</th>
              <th className="px-3 py-2">Échéance</th>
              <th className="px-3 py-2 text-right">TTC</th>
              <th className="px-3 py-2 text-right">Payé</th>
              <th className="px-3 py-2 text-right">Reste dû</th>
              <th className="px-3 py-2">Statut</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  Aucune facture dans ce filtre.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/dashboard/devis-facturation/factures/${r.id}`}
                      className="font-semibold text-[#1d4ed8]"
                    >
                      {r.number}
                    </Link>
                    <p className="text-[11px] text-slate-500">
                      {COMMERCIAL_INVOICE_TYPE_LABELS[r.type] ?? r.type}
                    </p>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-slate-800">
                      {r.clientName ?? "—"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {r.projectTitle ?? r.quoteNumber ?? "—"}
                    </p>
                  </td>
                  <td className="px-3 py-2.5 text-xs">
                    {r.dueDate
                      ? new Date(r.dueDate).toLocaleDateString("fr-FR")
                      : "—"}
                    {r.daysLate > 0 ? (
                      <p className="font-semibold text-red-700">
                        {r.daysLate} jour{r.daysLate > 1 ? "s" : ""} de retard
                      </p>
                    ) : null}
                    <p className="text-slate-400">
                      {AGING_BUCKET_LABELS[r.aging as AgingBucket]}
                    </p>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {fmt(r.totalTtc)} €
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {fmt(r.amountPaid)} €
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold">
                    {fmt(r.amountDue)} €
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                      {COMMERCIAL_INVOICE_STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 space-y-1">
                    <Link
                      href={`/dashboard/devis-facturation/factures/${r.id}`}
                      className="block text-xs font-semibold text-[#1d4ed8]"
                    >
                      Voir / payer
                    </Link>
                    {r.amountDue > 0.004 && r.daysLate > 0 ? (
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => void remind(r.id)}
                        className="block text-xs font-semibold text-amber-800 disabled:opacity-50"
                      >
                        Relancer
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {rows.length === 0 ? (
          <li className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
            Aucune facture dans ce filtre.
          </li>
        ) : (
          rows.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-[#1e3a5f]">{r.number}</p>
                  <p className="text-sm text-slate-700">{r.clientName ?? "—"}</p>
                  <p className="text-xs text-slate-500">
                    {r.projectTitle ?? r.quoteNumber ?? "—"}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                  {COMMERCIAL_INVOICE_STATUS_LABELS[r.status] ?? r.status}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-slate-500">TTC</p>
                  <p className="font-semibold tabular-nums">{fmt(r.totalTtc)} €</p>
                </div>
                <div>
                  <p className="text-slate-500">Payé</p>
                  <p className="font-semibold tabular-nums">{fmt(r.amountPaid)} €</p>
                </div>
                <div>
                  <p className="text-slate-500">Reste</p>
                  <p className="font-bold tabular-nums">{fmt(r.amountDue)} €</p>
                </div>
              </div>
              {r.daysLate > 0 ? (
                <p className="mt-2 text-sm font-semibold text-red-700">
                  {r.daysLate} jour{r.daysLate > 1 ? "s" : ""} de retard
                </p>
              ) : r.dueDate ? (
                <p className="mt-2 text-xs text-slate-500">
                  Échéance {new Date(r.dueDate).toLocaleDateString("fr-FR")}
                </p>
              ) : null}
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/dashboard/devis-facturation/factures/${r.id}`}
                  className="flex-1 rounded-lg bg-[#1e3a5f] px-3 py-2 text-center text-xs font-bold text-white"
                >
                  Enregistrer paiement
                </Link>
                {r.amountDue > 0.004 && r.daysLate > 0 ? (
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => void remind(r.id)}
                    className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 disabled:opacity-50"
                  >
                    Relancer
                  </button>
                ) : null}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
