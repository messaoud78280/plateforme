"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { roundMoney } from "@/lib/commercial/money";
import { PROGRESS_STATEMENT_STATUS_LABELS } from "@/lib/commercial/progress-calc";

type StatementRow = {
  id: string;
  number: number;
  label: string;
  status: string;
  createdAt: string;
  periodSellHt: number;
  cumulativeSellHt: number;
  invoice?: { id: string; number: string } | null;
};

function fmt(n: number) {
  return roundMoney(n, 2).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function ProgressStatementsPanel({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marketHt, setMarketHt] = useState(0);
  const [invoicedHt, setInvoicedHt] = useState(0);
  const [remainingHt, setRemainingHt] = useState(0);
  const [statements, setStatements] = useState<StatementRow[]>([]);

  async function load() {
    try {
      const res = await fetch(
        `/api/commercial/quotes/${quoteId}/progress-statements`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setMarketHt(Number(data.marketSellHt) || 0);
      setInvoicedHt(Number(data.invoicedFromSituationsHt) || 0);
      setRemainingHt(Number(data.remainingFromSituationsHt) || 0);
      setStatements(
        (data.statements ?? []).map((s: StatementRow) => ({
          ...s,
          periodSellHt: Number(s.periodSellHt) || 0,
          cumulativeSellHt: Number(s.cumulativeSellHt) || 0,
        })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteId]);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/commercial/quotes/${quoteId}/progress-statements`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      router.push(
        `/dashboard/devis-facturation/situations/${data.statement.id}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function generateInvoice(statementId: string) {
    if (!confirm("Générer la facture pour le montant de cette période ?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/commercial/progress-statements/${statementId}/invoice`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      router.push(`/dashboard/devis-facturation/factures/${data.invoice.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#1e3a5f]">Situations</p>
          <p className="mt-1 text-xs text-slate-500">
            Avancement ligne à ligne du marché accepté.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void create()}
          className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          {busy ? "…" : "Créer une situation"}
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-3 text-xs">
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-slate-500">Marché</p>
          <p className="font-bold tabular-nums text-slate-900">
            {fmt(marketHt)} € HT
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-slate-500">Déjà facturé (situations)</p>
          <p className="font-bold tabular-nums text-slate-900">
            {fmt(invoicedHt)} € HT
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-slate-500">Reste à facturer</p>
          <p className="font-bold tabular-nums text-slate-900">
            {fmt(remainingHt)} € HT
          </p>
        </div>
      </div>

      {statements.length === 0 ? (
        <p className="text-sm text-slate-500">Aucune situation pour l’instant.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                <th className="pb-2 pr-2">Situation</th>
                <th className="pb-2 pr-2">Date</th>
                <th className="pb-2 pr-2 text-right">Montant période</th>
                <th className="pb-2 pr-2 text-right">Cumul</th>
                <th className="pb-2 pr-2">Statut</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {statements.map((s) => (
                <tr key={s.id}>
                  <td className="py-2.5 pr-2 font-semibold text-slate-900">
                    {s.label}
                  </td>
                  <td className="py-2.5 pr-2 text-slate-600">
                    {new Date(s.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="py-2.5 pr-2 text-right tabular-nums">
                    {fmt(s.periodSellHt)} €
                  </td>
                  <td className="py-2.5 pr-2 text-right tabular-nums">
                    {fmt(s.cumulativeSellHt)} €
                  </td>
                  <td className="py-2.5 pr-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                      {PROGRESS_STATEMENT_STATUS_LABELS[s.status] ?? s.status}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/dashboard/devis-facturation/situations/${s.id}`}
                        className="text-xs font-semibold text-[#1d4ed8]"
                      >
                        {s.status === "DRAFT" ? "Modifier" : "Voir"}
                      </Link>
                      {s.status === "VALIDATED" ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void generateInvoice(s.id)}
                          className="text-xs font-semibold text-[#1e3a5f]"
                        >
                          Générer facture
                        </button>
                      ) : null}
                      {s.invoice ? (
                        <Link
                          href={`/dashboard/devis-facturation/factures/${s.invoice.id}`}
                          className="text-xs font-semibold text-slate-600"
                        >
                          {s.invoice.number}
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
