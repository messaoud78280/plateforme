import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { getInvoiceDetail } from "@/lib/commercial/invoices";
import {
  COMMERCIAL_INVOICE_STATUS_LABELS,
  COMMERCIAL_INVOICE_TYPE_LABELS,
  roundMoney,
} from "@/lib/commercial/money";
import { RecordPaymentForm } from "@/components/commercial/RecordPaymentForm";

export const dynamic = "force-dynamic";

export default async function FactureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireCommercialSession();
  const orgId = await resolveCommercialOrgId(session.user);
  const { id } = await params;
  if (!orgId) notFound();
  const inv = await getInvoiceDetail(orgId, id);
  if (!inv) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Gestion commerciale"
        title={inv.number}
        description={inv.subject ?? undefined}
      />
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2 text-sm">
        <p>
          <span className="text-slate-500">Type · </span>
          {COMMERCIAL_INVOICE_TYPE_LABELS[inv.type] ?? inv.type}
        </p>
        <p>
          <span className="text-slate-500">Statut · </span>
          {COMMERCIAL_INVOICE_STATUS_LABELS[inv.status] ?? inv.status}
        </p>
        <p>
          <span className="text-slate-500">TTC · </span>
          {roundMoney(inv.totalTtc, 2).toLocaleString("fr-FR")} €
        </p>
        <p>
          <span className="text-slate-500">Encaissé · </span>
          {roundMoney(inv.amountPaid, 2).toLocaleString("fr-FR")} €
        </p>
        <p className="font-bold">
          Reste · {roundMoney(inv.amountDue, 2).toLocaleString("fr-FR")} €
        </p>
      </div>
      <ul className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
        {inv.lines.map((l) => (
          <li key={l.id} className="flex justify-between px-4 py-3 text-sm">
            <span>
              {l.designation}{" "}
              <span className="text-slate-400">
                {l.quantity} {l.unit}
              </span>
            </span>
            <span className="tabular-nums font-semibold">
              {roundMoney(l.lineSellHt, 2).toLocaleString("fr-FR")} €
            </span>
          </li>
        ))}
      </ul>
      {inv.amountDue > 0 && inv.status !== "DRAFT" && inv.status !== "CANCELLED" ? (
        <RecordPaymentForm invoiceId={inv.id} maxAmount={inv.amountDue} />
      ) : null}
      {inv.payments.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-bold">Encaissements</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {inv.payments.map((p) => (
              <li key={p.id}>
                {new Date(p.paidAt).toLocaleDateString("fr-FR")} ·{" "}
                {roundMoney(p.amount, 2).toLocaleString("fr-FR")} € · {p.method}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
