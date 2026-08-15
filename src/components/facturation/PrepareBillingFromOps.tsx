"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { PrepareBillingContext } from "@/lib/facturation/prepare-billing";
import { PrepareInvoiceForm } from "@/components/commercial/PrepareInvoiceForm";

export function PrepareBillingFromOps({
  context,
  invoiceQuotes,
}: {
  context: PrepareBillingContext;
  invoiceQuotes: Array<{
    id: string;
    number: string;
    subject: string;
    clientExternalOrgId: string | null;
    remainingToInvoiceHt: number;
    contratAccepteHt: number;
    invoicedHt: number;
  }>;
}) {
  const router = useRouter();
  const [quoteId, setQuoteId] = useState(context.selectedQuoteId ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDirect, setShowDirect] = useState(false);

  const selected = context.quotes.find((q) => q.id === quoteId) ?? null;

  async function startSituation() {
    if (!selected) {
      setError("Choisissez le marché à facturer.");
      return;
    }
    if (selected.draftStatementId) {
      router.push(`/dashboard/devis-facturation/situations/${selected.draftStatementId}`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/commercial/quotes/${selected.id}/progress-statements`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) {
        const msg = String(data.error || "Erreur");
        const existing = context.quotes.find((q) => q.id === selected.id)?.draftStatementId;
        if (existing) {
          router.push(`/dashboard/devis-facturation/situations/${existing}`);
          return;
        }
        throw new Error(msg);
      }
      const id = data.statement?.id;
      if (!id) throw new Error("Situation introuvable");
      router.push(`/dashboard/devis-facturation/situations/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <dl className="grid gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[10px] font-bold uppercase text-slate-500">Chantier</dt>
          <dd className="font-medium text-slate-900">{context.project?.title ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase text-slate-500">Client</dt>
          <dd className="font-medium text-slate-900">{context.clientName ?? "—"}</dd>
        </div>
        {context.sheet ? (
          <div className="sm:col-span-2">
            <dt className="text-[10px] font-bold uppercase text-slate-500">Depuis la fiche</dt>
            <dd className="font-medium text-slate-900">
              <Link
                href={`/dashboard/fiches-suivi/${context.sheet.id}`}
                className="text-[#1d4ed8] hover:underline"
              >
                {context.sheet.title}
              </Link>
              <span className="ml-2 text-xs text-slate-500">Signal à facturer — pas une facture.</span>
            </dd>
          </div>
        ) : null}
      </dl>

      <p className="text-sm text-slate-600">{context.why}</p>

      {context.decision === "BLOCK_NO_PROJECT" || context.decision === "BLOCK_NO_MARKET" ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {context.why}
        </p>
      ) : (
        <>
          {context.quotes.length > 1 ? (
            <ul className="space-y-1">
              {context.quotes.map((q) => (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => setQuoteId(q.id)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm ${
                      quoteId === q.id ? "border-[#1e3a5f] bg-white" : "border-slate-200 bg-white"
                    }`}
                  >
                    <span>
                      {q.number} · {q.subject}
                    </span>
                    <span className="text-xs text-slate-500">
                      {q.draftStatementId
                        ? "Situation en cours"
                        : q.hasProgressHistory
                          ? "Situations existantes"
                          : "Marché"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : selected ? (
            <p className="text-sm text-slate-700">
              Marché {selected.number} · {selected.subject}
            </p>
          ) : null}

          <button
            type="button"
            disabled={busy || !selected}
            onClick={() => void startSituation()}
            className="rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy
              ? "…"
              : selected?.draftStatementId
                ? "Continuer la situation en cours"
                : "Préparer une situation"}
          </button>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          {context.canPrepareDirectInvoice && context.project ? (
            <div>
              <button
                type="button"
                onClick={() => setShowDirect((v) => !v)}
                className="text-xs font-semibold text-[#1d4ed8]"
              >
                {showDirect ? "Masquer la facture directe" : "Plus d’options — facture directe"}
              </button>
              {showDirect ? (
                <div className="mt-3">
                  <PrepareInvoiceForm
                    projectId={context.project.id}
                    projectTitle={context.project.title}
                    quotes={invoiceQuotes}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
