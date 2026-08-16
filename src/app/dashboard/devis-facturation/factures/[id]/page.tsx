import { notFound } from "next/navigation";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { getInvoiceDetail } from "@/lib/commercial/invoices";
import { InvoiceDocument } from "@/components/commercial/InvoiceDocument";
import { sanitizeInternalReturnTo } from "@/lib/navigation/safe-return-to";

export const dynamic = "force-dynamic";

export default async function FactureDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const session = await requireCommercialSession();
  const orgId = await resolveCommercialOrgId(session.user);
  const { id } = await params;
  const sp = await searchParams;
  if (!orgId) notFound();
  const inv = await getInvoiceDetail(orgId, id);
  if (!inv) notFound();

  const returnTo = sp.returnTo
    ? sanitizeInternalReturnTo(sp.returnTo, "/dashboard/devis-facturation/factures")
    : null;

  return (
    <InvoiceDocument
      returnTo={returnTo}
      invoice={{
        id: inv.id,
        number: inv.number,
        subject: inv.subject,
        status: inv.status,
        type: inv.type,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        totalSellHt: inv.totalSellHt,
        totalVat: inv.totalVat,
        totalTtc: inv.totalTtc,
        amountPaid: inv.amountPaid,
        amountDue: inv.amountDue,
        depositPercent: inv.depositPercent,
        worksSellHt: inv.worksSellHt,
        worksVat: inv.worksVat,
        worksTtc: inv.worksTtc,
        retentionAmountHt: inv.retentionAmountHt,
        retentionRate: inv.retentionRate,
        depositDeductedHt: inv.depositDeductedHt,
        prorataAmountHt: inv.prorataAmountHt,
        prorataRate: inv.prorataRate,
        clientNotes: inv.clientNotes,
        issuerSnapshotJson:
          (inv.issuerSnapshotJson as Record<string, string | null> | null) ?? null,
        clientSnapshotJson:
          (inv.clientSnapshotJson as Record<string, string | null> | null) ?? null,
        quote: inv.quote,
        project: inv.project,
        annualContractOrigin: inv.annualContractOrigin,
        lines: inv.lines.map((l) => ({
          id: l.id,
          designation: l.designation,
          description: l.description,
          quantity: l.quantity,
          unit: l.unit,
          unitSellHt: l.unitSellHt,
          vatRate: l.vatRate,
          lineSellHt: l.lineSellHt,
        })),
        payments: inv.payments.map((p) => ({
          id: p.id,
          amount: p.amount,
          paidAt: p.paidAt,
          method: p.method,
          reference: p.reference,
          cancelledAt: (p as { cancelledAt?: Date | null }).cancelledAt ?? null,
        })),
      }}
    />
  );
}
