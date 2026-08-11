"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { roundMoney } from "@/lib/commercial/money";

type QuoteOption = {
  id: string;
  number: string;
  subject: string;
  clientExternalOrgId: string | null;
  remainingToInvoiceHt: number;
  contratAccepteHt: number;
  invoicedHt: number;
};

export function PrepareInvoiceForm({
  projectId,
  projectTitle,
  quotes,
}: {
  projectId: string;
  projectTitle: string;
  quotes: QuoteOption[];
}) {
  const router = useRouter();
  const [quoteId, setQuoteId] = useState(quotes.length === 1 ? quotes[0].id : "");
  const selected = useMemo(
    () => quotes.find((q) => q.id === quoteId) ?? null,
    [quotes, quoteId],
  );
  const [type, setType] = useState<"PROGRESS" | "DEPOSIT" | "FINAL" | "STANDARD">(
    "PROGRESS",
  );
  const [amountHt, setAmountHt] = useState(
    quotes.length === 1 ? String(quotes[0].remainingToInvoiceHt || "") : "",
  );
  const [vatRate, setVatRate] = useState("20");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSelectQuote(id: string) {
    setQuoteId(id);
    const q = quotes.find((x) => x.id === id);
    if (q) setAmountHt(String(q.remainingToInvoiceHt || ""));
  }

  async function submit() {
    if (!selected) {
      setError("Sélectionnez le devis contractuel.");
      return;
    }
    const ht = Number(amountHt);
    if (!Number.isFinite(ht) || ht <= 0) {
      setError("Indiquez un montant HT valide (ne pas inventer).");
      return;
    }
    if (ht > selected.remainingToInvoiceHt + 0.01) {
      setError(
        `Montant supérieur au reste à facturer (${roundMoney(selected.remainingToInvoiceHt, 2)} € HT).`,
      );
      return;
    }

    setBusy(true);
    setError(null);
    try {
      if (type === "DEPOSIT") {
        const res = await fetch("/api/commercial/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "DEPOSIT",
            quoteId: selected.id,
            amountHt: ht,
            issue: false,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur");
        router.push(`/dashboard/devis-facturation/factures/${data.invoice.id}`);
        return;
      }

      const res = await fetch("/api/commercial/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          quoteId: selected.id,
          projectId,
          clientExternalOrgId: selected.clientExternalOrgId,
          subject: `Facture — ${projectTitle} — ${selected.number}`,
          lines: [
            {
              designation: `Situation / facturation — ${selected.number}`,
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

  if (quotes.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        Aucun devis commercial accepté lié à ce chantier. Rattachez un devis accepté
        avant de préparer une facture financière.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      {quotes.length > 1 ? (
        <div>
          <p className="text-xs font-semibold text-slate-700">
            Plusieurs devis acceptés — choisissez lequel facturer
          </p>
          <ul className="mt-2 space-y-1">
            {quotes.map((q) => (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => onSelectQuote(q.id)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm ${
                    quoteId === q.id
                      ? "border-[#1e3a5f] bg-slate-50"
                      : "border-slate-200"
                  }`}
                >
                  <span>
                    {q.number} · {q.subject}
                  </span>
                  <span className="text-xs text-slate-500">
                    Reste {roundMoney(q.remainingToInvoiceHt, 2).toLocaleString("fr-FR")} € HT
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-slate-700">
          Devis {quotes[0].number} · Contrat{" "}
          {roundMoney(quotes[0].contratAccepteHt, 2).toLocaleString("fr-FR")} € HT · Déjà
          facturé {roundMoney(quotes[0].invoicedHt, 2).toLocaleString("fr-FR")} € HT
        </p>
      )}

      {selected ? (
        <>
          <label className="block text-xs text-slate-500">
            Type
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="PROGRESS">Situation / progressive</option>
              <option value="DEPOSIT">Acompte</option>
              <option value="FINAL">Solde</option>
              <option value="STANDARD">Standard</option>
            </select>
          </label>
          <label className="block text-xs text-slate-500">
            Montant HT à facturer
            <input
              value={amountHt}
              onChange={(e) => setAmountHt(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums"
            />
            <span className="mt-1 block text-[11px] text-slate-400">
              Reste à facturer :{" "}
              {roundMoney(selected.remainingToInvoiceHt, 2).toLocaleString("fr-FR")} € HT
              (vous validez le montant)
            </span>
          </label>
          {type !== "DEPOSIT" ? (
            <label className="block text-xs text-slate-500">
              TVA %
              <input
                value={vatRate}
                onChange={(e) => setVatRate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
          ) : null}
        </>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        type="button"
        disabled={busy || !selected}
        onClick={() => void submit()}
        className="rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        {busy ? "…" : "Créer le brouillon de facture"}
      </button>
      <p className="text-[11px] text-slate-400">
        Aucune facture n’est créée automatiquement depuis « À facturer ».
      </p>
    </div>
  );
}
