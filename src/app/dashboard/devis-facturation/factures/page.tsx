import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { listInvoices } from "@/lib/commercial/invoices";
import {
  COMMERCIAL_INVOICE_STATUS_LABELS,
  COMMERCIAL_INVOICE_TYPE_LABELS,
  roundMoney,
} from "@/lib/commercial/money";

export const dynamic = "force-dynamic";

export default async function FacturesPage() {
  const session = await requireCommercialSession("/dashboard/devis-facturation/factures");
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) return null;
  const invoices = await listInvoices(orgId);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Gestion commerciale" title="Factures" description="Factures clients BTP — source CommercialInvoice." />
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {invoices.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Aucune facture.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">N°</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Client</th>
                <th className="px-4 py-2">TTC</th>
                <th className="px-4 py-2">Reste</th>
                <th className="px-4 py-2">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/dashboard/devis-facturation/factures/${inv.id}`}
                      className="font-semibold text-[#1d4ed8]"
                    >
                      {inv.number}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    {COMMERCIAL_INVOICE_TYPE_LABELS[inv.type] ?? inv.type}
                  </td>
                  <td className="px-4 py-2.5">
                    {inv.clientExternalOrg?.tradeName ||
                      inv.clientExternalOrg?.name ||
                      "—"}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums">
                    {roundMoney(inv.totalTtc, 2).toLocaleString("fr-FR")} €
                  </td>
                  <td className="px-4 py-2.5 tabular-nums">
                    {roundMoney(inv.amountDue, 2).toLocaleString("fr-FR")} €
                  </td>
                  <td className="px-4 py-2.5">
                    {COMMERCIAL_INVOICE_STATUS_LABELS[inv.status] ?? inv.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
