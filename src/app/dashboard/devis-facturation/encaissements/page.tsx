import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { listPayments } from "@/lib/commercial/invoices";
import { roundMoney } from "@/lib/commercial/money";

export const dynamic = "force-dynamic";

export default async function EncaissementsPage() {
  const session = await requireCommercialSession(
    "/dashboard/devis-facturation/encaissements",
  );
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) return null;
  const payments = await listPayments(orgId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Devis & Facturation"
        title="Encaissements"
        description="Paiements reçus sur les factures commerciales — pas de confusion avec « à facturer »."
      />
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {payments.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            Aucun encaissement enregistré. Ouvrez une facture émise pour en ajouter un.
          </p>
        ) : (
          <>
            <div className="hidden md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Facture</th>
                    <th className="px-4 py-2">Montant</th>
                    <th className="px-4 py-2">Mode</th>
                    <th className="px-4 py-2">Par</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-2.5">
                        {new Date(p.paidAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/dashboard/devis-facturation/factures/${p.invoice.id}`}
                          className="font-semibold text-[#1d4ed8]"
                        >
                          {p.invoice.number}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 tabular-nums font-semibold">
                        {roundMoney(p.amount, 2).toLocaleString("fr-FR")} €
                      </td>
                      <td className="px-4 py-2.5">{p.method}</td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {p.recordedBy?.name ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-slate-100 md:hidden">
              {payments.map((p) => (
                <li key={p.id} className="px-4 py-3">
                  <Link
                    href={`/dashboard/devis-facturation/factures/${p.invoice.id}`}
                    className="block"
                  >
                    <div className="flex justify-between gap-2">
                      <span className="font-semibold">{p.invoice.number}</span>
                      <span className="tabular-nums font-bold">
                        {roundMoney(p.amount, 2).toLocaleString("fr-FR")} €
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(p.paidAt).toLocaleDateString("fr-FR")} · {p.method}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
