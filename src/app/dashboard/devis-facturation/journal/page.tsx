import Link from "next/link";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { listInvoices } from "@/lib/commercial/invoices";
import { COMMERCIAL_INVOICE_STATUS_LABELS } from "@/lib/commercial/money";
import { JournalSalesClient } from "@/components/commercial/JournalSalesClient";

export const dynamic = "force-dynamic";

export default async function JournalVentesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const session = await requireCommercialSession(
    "/dashboard/devis-facturation/journal",
  );
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) return null;
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();
  const status = (params.status ?? "").trim();

  const all = await listInvoices(orgId);
  const rows = all
    .filter((inv) => inv.type !== "CREDIT")
    .filter((inv) => !status || inv.status === status)
    .filter((inv) => {
      if (!q) return true;
      const client =
        inv.clientExternalOrg?.tradeName || inv.clientExternalOrg?.name || "";
      return (
        inv.number.toLowerCase().includes(q) ||
        client.toLowerCase().includes(q)
      );
    })
    .map((inv) => ({
      id: inv.id,
      number: inv.number,
      status: inv.status,
      statusLabel: COMMERCIAL_INVOICE_STATUS_LABELS[inv.status] ?? inv.status,
      client:
        inv.clientExternalOrg?.tradeName ||
        inv.clientExternalOrg?.name ||
        "—",
      issueDate: inv.issueDate?.toISOString() ?? null,
      totalHt: inv.totalSellHt,
      totalVat: inv.totalVat,
      totalTtc: inv.totalTtc,
      amountPaid: inv.amountPaid,
      amountDue: inv.amountDue,
    }));

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-slate-500">
        Journal des ventes — factures clients (hors avoirs). Montants HT / TVA / TTC.
      </p>
      <JournalSalesClient
        initialRows={rows}
        initialQ={params.q ?? ""}
        initialStatus={params.status ?? ""}
      />
      <p className="text-[12px]">
        <Link
          href="/dashboard/devis-facturation/factures"
          className="font-medium text-[#1e3a5f] hover:underline"
        >
          Voir toutes les factures →
        </Link>
      </p>
    </div>
  );
}
