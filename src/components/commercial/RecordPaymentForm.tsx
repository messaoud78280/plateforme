"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RecordPaymentForm({
  invoiceId,
  maxAmount,
}: {
  invoiceId: string;
  maxAmount: number;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(maxAmount));
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState("VIREMENT");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/commercial/invoices/${invoiceId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          paidAt,
          method,
          reference: reference.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <h3 className="text-sm font-bold text-slate-900">Enregistrer un encaissement</h3>
      <label className="block text-xs text-slate-500">
        Montant
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </label>
      <label className="block text-xs text-slate-500">
        Date
        <input
          type="date"
          value={paidAt}
          onChange={(e) => setPaidAt(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </label>
      <label className="block text-xs text-slate-500">
        Mode
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="VIREMENT">Virement</option>
          <option value="CHEQUE">Chèque</option>
          <option value="CB">Carte</option>
          <option value="ESPECES">Espèces</option>
          <option value="AUTRE">Autre</option>
        </select>
      </label>
      <label className="block text-xs text-slate-500">
        Référence (optionnel)
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void submit()}
        className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-xs font-bold text-white"
      >
        {busy ? "…" : "Enregistrer l’encaissement"}
      </button>
    </div>
  );
}
