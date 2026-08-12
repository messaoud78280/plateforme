"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  COMMERCIAL_INVOICE_STATUS_LABELS,
  COMMERCIAL_INVOICE_TYPE_LABELS,
  roundMoney,
} from "@/lib/commercial/money";
import { RecordPaymentForm } from "@/components/commercial/RecordPaymentForm";

type Snapshot = {
  name?: string | null;
  tradeName?: string | null;
  siret?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  zipCode?: string | null;
  postalCode?: string | null;
  logoPath?: string | null;
};

type InvoiceDoc = {
  id: string;
  number: string;
  subject: string | null;
  status: string;
  type: string;
  issueDate: string | Date;
  dueDate: string | Date | null;
  totalSellHt: number;
  totalVat: number;
  totalTtc: number;
  amountPaid: number;
  amountDue: number;
  depositPercent: number | null;
  clientNotes: string | null;
  issuerSnapshotJson: Snapshot | null;
  clientSnapshotJson: Snapshot | null;
  quote: { id: string; number: string; subject: string } | null;
  project: { id: string; title: string } | null;
  lines: Array<{
    id: string;
    designation: string;
    description: string | null;
    quantity: number;
    unit: string;
    unitSellHt: number;
    vatRate: number;
    lineSellHt: number;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    paidAt: string | Date;
    method: string;
    reference: string | null;
  }>;
};

function fmt(n: number) {
  return roundMoney(n, 2).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR");
}

function partyLines(s: Snapshot | null): string[] {
  if (!s) return ["—"];
  const out: string[] = [];
  const name = s.tradeName || s.name;
  if (name) out.push(name);
  if (s.siret) out.push(`SIRET ${s.siret}`);
  if (s.addressLine1 || s.address) out.push(String(s.addressLine1 || s.address));
  const city = [s.postalCode || s.zipCode, s.city].filter(Boolean).join(" ");
  if (city) out.push(city);
  if (s.email) out.push(s.email);
  if (s.phone) out.push(s.phone);
  return out.length ? out : ["—"];
}

export function InvoiceDocument({ invoice }: { invoice: InvoiceDoc }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const issuer = invoice.issuerSnapshotJson;
  const client = invoice.clientSnapshotJson;
  const canIssue = invoice.status === "DRAFT";
  const canPay =
    invoice.amountDue > 0 &&
    invoice.status !== "DRAFT" &&
    invoice.status !== "CANCELLED";

  async function issue() {
    if (!confirm("Émettre cette facture ? Elle ne pourra plus être modifiée comme brouillon.")) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/commercial/invoices/${invoice.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "issue" }),
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
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="sticky top-0 z-20 -mx-1 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/95 px-1 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/devis-facturation/factures"
            className="text-xs font-semibold text-slate-600 hover:text-[#1e3a5f]"
          >
            ← Factures
          </Link>
          <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-700">
            {COMMERCIAL_INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}
          </span>
          <span className="text-xs text-slate-500">
            {COMMERCIAL_INVOICE_TYPE_LABELS[invoice.type] ?? invoice.type}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/commercial/invoices/${invoice.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
          >
            Aperçu PDF
          </a>
          {canIssue ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void issue()}
              className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {busy ? "…" : "Émettre la facture"}
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-[10rem] space-y-1">
            {issuer?.logoPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={issuer.logoPath}
                alt=""
                className="mb-2 h-10 w-auto object-contain"
              />
            ) : null}
            {partyLines(issuer).map((l) => (
              <p
                key={l}
                className={
                  l === (issuer?.tradeName || issuer?.name)
                    ? "text-sm font-bold text-[#1e3a5f]"
                    : "text-xs text-slate-600"
                }
              >
                {l}
              </p>
            ))}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tracking-tight text-[#1e3a5f]">FACTURE</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{invoice.number}</p>
            <p className="text-xs text-slate-500">Date · {fmtDate(invoice.issueDate)}</p>
            {invoice.dueDate ? (
              <p className="text-xs text-slate-500">Échéance · {fmtDate(invoice.dueDate)}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Client
            </p>
            {partyLines(client).map((l) => (
              <p key={l} className="text-sm text-slate-800">
                {l}
              </p>
            ))}
          </div>
          <div>
            {invoice.project ? (
              <>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Chantier
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  {invoice.project.title}
                </p>
              </>
            ) : null}
            {invoice.quote ? (
              <p className="mt-2 text-xs text-slate-500">
                Devis{" "}
                <Link
                  href={`/dashboard/devis-facturation/devis/${invoice.quote.id}`}
                  className="font-semibold text-[#1d4ed8]"
                >
                  {invoice.quote.number}
                </Link>
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Objet
          </p>
          <p className="text-base font-semibold text-slate-900">
            {invoice.subject ?? "—"}
          </p>
          {invoice.depositPercent != null && invoice.type === "DEPOSIT" ? (
            <p className="mt-1 text-xs text-slate-500">
              Acompte {fmt(invoice.depositPercent)} % du marché
            </p>
          ) : null}
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                <th className="pb-2 pr-2">Désignation</th>
                <th className="pb-2 pr-2 text-right">Qté</th>
                <th className="pb-2 pr-2 text-right">P.U. HT</th>
                <th className="pb-2 text-right">Total HT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.lines.map((l) => (
                <tr key={l.id}>
                  <td className="py-3 pr-2">
                    <p className="font-medium text-slate-900">{l.designation}</p>
                    {l.description ? (
                      <p className="text-xs text-slate-500">{l.description}</p>
                    ) : null}
                  </td>
                  <td className="py-3 pr-2 text-right tabular-nums text-slate-700">
                    {l.quantity} {l.unit}
                  </td>
                  <td className="py-3 pr-2 text-right tabular-nums text-slate-700">
                    {fmt(l.unitSellHt)} €
                  </td>
                  <td className="py-3 text-right tabular-nums font-semibold text-slate-900">
                    {fmt(l.lineSellHt)} €
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end">
          <dl className="w-full max-w-xs space-y-1.5 rounded-xl border border-slate-200 p-4 text-sm">
            <div className="flex justify-between text-slate-600">
              <dt>Total HT</dt>
              <dd className="tabular-nums font-medium">{fmt(invoice.totalSellHt)} €</dd>
            </div>
            <div className="flex justify-between text-slate-600">
              <dt>TVA</dt>
              <dd className="tabular-nums font-medium">{fmt(invoice.totalVat)} €</dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-[#1e3a5f]">
              <dt>Total TTC</dt>
              <dd className="tabular-nums">{fmt(invoice.totalTtc)} €</dd>
            </div>
            {invoice.amountPaid > 0 || invoice.status !== "DRAFT" ? (
              <>
                <div className="flex justify-between text-slate-600">
                  <dt>Encaissé</dt>
                  <dd className="tabular-nums">{fmt(invoice.amountPaid)} €</dd>
                </div>
                <div className="flex justify-between font-semibold text-slate-900">
                  <dt>Reste dû</dt>
                  <dd className="tabular-nums">{fmt(invoice.amountDue)} €</dd>
                </div>
              </>
            ) : null}
          </dl>
        </div>

        {invoice.clientNotes ? (
          <div className="mt-6">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Observations
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
              {invoice.clientNotes}
            </p>
          </div>
        ) : null}
      </article>

      {canPay ? (
        <RecordPaymentForm invoiceId={invoice.id} maxAmount={invoice.amountDue} />
      ) : null}

      {invoice.payments.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-bold text-slate-900">Encaissements</h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {invoice.payments.map((p) => (
              <li key={p.id}>
                {fmtDate(p.paidAt)} · {fmt(p.amount)} € · {p.method}
                {p.reference ? ` · ${p.reference}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
