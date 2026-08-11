"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  COMMERCIAL_AMENDMENT_STATUS_LABELS,
  roundMoney,
} from "@/lib/commercial/money";

type AmendmentRow = {
  id: string;
  number: string;
  subject: string;
  totalSellHt: number;
  status: string;
  invoicedAmountHt?: number;
  remainingToInvoiceHt?: number;
  isBillable?: boolean;
  isFullyInvoiced?: boolean;
};

export function QuoteAmendmentsPanel({
  quoteId,
  quoteAccepted,
  accepted,
  pending,
  closed,
}: {
  quoteId: string;
  quoteAccepted: boolean;
  accepted: AmendmentRow[];
  pending: AmendmentRow[];
  closed?: AmendmentRow[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createAmendment() {
    const subject = prompt("Objet de l’avenant", "Travaux supplémentaires");
    if (!subject?.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/commercial/amendments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId, subject: subject.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      router.push(`/dashboard/devis-facturation/avenants/${data.amendment.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  const all = [...accepted, ...pending, ...(closed ?? [])];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-slate-900">Avenants</h2>
        {quoteAccepted ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void createAmendment()}
            className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            + Nouvel avenant
          </button>
        ) : null}
      </div>

      {all.length === 0 ? (
        <p className="text-sm text-slate-500">
          Aucun avenant. Seuls les avenants acceptés augmentent le contrat.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {all.map((a) => (
            <li key={a.id} className="py-3">
              <Link
                href={`/dashboard/devis-facturation/avenants/${a.id}`}
                className="block hover:opacity-90"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {a.number}{" "}
                      <span className="text-xs font-medium text-slate-500">
                        {COMMERCIAL_AMENDMENT_STATUS_LABELS[a.status] ?? a.status}
                      </span>
                    </p>
                    <p className="mt-0.5 text-sm text-slate-600">{a.subject}</p>
                    {a.status === "ACCEPTED" ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Facturé {roundMoney(a.invoicedAmountHt ?? 0, 2).toLocaleString("fr-FR")} €
                        {" · "}
                        Reste {roundMoney(a.remainingToInvoiceHt ?? 0, 2).toLocaleString("fr-FR")} €
                        {a.isFullyInvoiced ? " · Soldé" : ""}
                      </p>
                    ) : null}
                  </div>
                  <p
                    className={`tabular-nums text-sm font-bold ${
                      a.status === "ACCEPTED"
                        ? "text-emerald-800"
                        : a.status === "REFUSED" || a.status === "CANCELLED"
                          ? "text-slate-400"
                          : "text-amber-800"
                    }`}
                  >
                    +{roundMoney(a.totalSellHt, 2).toLocaleString("fr-FR")} € HT
                  </p>
                </div>
              </Link>
              {a.isBillable ? (
                <Link
                  href={`/dashboard/devis-facturation/factures/preparer?amendmentId=${a.id}`}
                  className="mt-2 inline-flex rounded-lg border border-[#1e3a5f]/30 bg-slate-50 px-3 py-1.5 text-xs font-bold text-[#1e3a5f]"
                >
                  Préparer la facture
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </section>
  );
}
