"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { roundMoney } from "@/lib/commercial/money";

export function PrepareAmendmentInvoiceForm({
  amendmentId,
  amendmentNumber,
  subject,
  quoteId,
  projectId,
  clientExternalOrgId,
  remainingToInvoiceHt,
}: {
  amendmentId: string;
  amendmentNumber: string;
  subject: string;
  quoteId: string;
  projectId: string | null;
  clientExternalOrgId: string | null;
  remainingToInvoiceHt: number;
}) {
  const router = useRouter();
  const [type, setType] = useState<"STANDARD" | "PROGRESS" | "FINAL">("STANDARD");
  const [amountHt, setAmountHt] = useState(String(remainingToInvoiceHt));
  const [vatRate, setVatRate] = useState("20");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const ht = Number(amountHt);
    if (!Number.isFinite(ht) || ht <= 0) {
      setError("Indiquez un montant HT valide.");
      return;
    }
    if (ht > remainingToInvoiceHt + 0.01) {
      setError(
        `Montant supérieur au reste (${roundMoney(remainingToInvoiceHt, 2)} € HT).`,
      );
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/commercial/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          quoteId,
          amendmentId,
          projectId,
          clientExternalOrgId,
          subject: `Facture — ${amendmentNumber} — ${subject}`,
          lines: [
            {
              designation: `Avenant ${amendmentNumber} — ${subject}`,
              quantity: 1,
              unit: "U",
              unitSellHt: ht,
              vatRate: Number(vatRate) || 20,
            },
          ],
        }),
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

  if (remainingToInvoiceHt <= 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        Cet avenant est entièrement facturé — aucune nouvelle facture proposée.
        <div className="mt-3">
          <Link
            href={`/dashboard/devis-facturation/avenants/${amendmentId}`}
            className="font-semibold text-[#1d4ed8]"
          >
            Retour à l’avenant
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-700">
        {amendmentNumber} · Reste à facturer{" "}
        <span className="font-bold">
          {roundMoney(remainingToInvoiceHt, 2).toLocaleString("fr-FR")} € HT
        </span>
      </p>
      <label className="block text-xs text-slate-500">
        Type
        <select
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="STANDARD">Standard</option>
          <option value="PROGRESS">Progressive</option>
          <option value="FINAL">Solde</option>
        </select>
      </label>
      <label className="block text-xs text-slate-500">
        Montant HT
        <input
          value={amountHt}
          onChange={(e) => setAmountHt(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums"
        />
      </label>
      <label className="block text-xs text-slate-500">
        TVA %
        <input
          value={vatRate}
          onChange={(e) => setVatRate(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void submit()}
        className="rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        {busy ? "…" : "Créer le brouillon de facture"}
      </button>
      <p className="text-[11px] text-slate-400">
        Aucune facture automatique — validation humaine obligatoire. Relation stable via
        amendmentId.
      </p>
    </div>
  );
}
