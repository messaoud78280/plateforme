"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { roundMoney } from "@/lib/commercial/money";

function fmt(n: number) {
  return roundMoney(n, 2).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type DepositRow = {
  id: string;
  number: string;
  status: string;
  totalSellHt: number;
  depositPercent: number | null;
};

export function QuoteDepositPanel({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoicedHt, setInvoicedHt] = useState(0);
  const [deductedHt, setDeductedHt] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [deposits, setDeposits] = useState<DepositRow[]>([]);

  async function load() {
    const res = await fetch(`/api/commercial/quotes/${quoteId}/deposits`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erreur");
    setInvoicedHt(Number(data.invoicedHt) || 0);
    setDeductedHt(Number(data.deductedHt) || 0);
    setRemaining(Number(data.remainingToDeductHt) || 0);
    setDeposits(data.deposits ?? []);
  }

  useEffect(() => {
    void load().catch((e) =>
      setError(e instanceof Error ? e.message : "Erreur"),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteId]);

  async function createDeposit() {
    if (
      !confirm(
        "Créer un brouillon de facture d’acompte depuis l’échéancier (ou %) ?",
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/commercial/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "DEPOSIT", quoteId, issue: false }),
      });
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
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-[#1e3a5f]">Acomptes / avances</p>
          <p className="mt-1 text-xs text-slate-500">
            Les acomptes émis sont déduits automatiquement sur les situations
            suivantes (après RG).
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void createDeposit()}
          className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          Facturer l’acompte
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-3 text-xs">
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-slate-500">Acomptes émis</p>
          <p className="font-bold tabular-nums">{fmt(invoicedHt)} € HT</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-slate-500">Déjà déduits</p>
          <p className="font-bold tabular-nums">{fmt(deductedHt)} € HT</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-slate-500">Reste à déduire</p>
          <p className="font-bold tabular-nums">{fmt(remaining)} € HT</p>
        </div>
      </div>

      {deposits.length > 0 ? (
        <ul className="divide-y divide-slate-100 text-sm">
          {deposits.map((d) => (
            <li key={d.id} className="flex justify-between py-2">
              <Link
                href={`/dashboard/devis-facturation/factures/${d.id}`}
                className="font-semibold text-[#1d4ed8]"
              >
                {d.number}
                {d.depositPercent != null ? ` · ${d.depositPercent} %` : ""}
              </Link>
              <span className="tabular-nums">{fmt(d.totalSellHt)} € HT</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-500">
          Aucun acompte émis. Créez puis émettez la facture d’acompte pour
          qu’elle soit déduite des situations.
        </p>
      )}

      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
