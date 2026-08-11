import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { listQuotes } from "@/lib/commercial/quotes";
import { COMMERCIAL_QUOTE_STATUS_LABELS, roundMoney } from "@/lib/commercial/money";

export const dynamic = "force-dynamic";

export default async function DevisListPage() {
  const session = await requireCommercialSession("/dashboard/devis-facturation/devis");
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) return null;
  const quotes = await listQuotes(orgId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader eyebrow="Devis & Facturation" title="Devis" description="Tous vos devis commerciaux." />
        <Link
          href="/dashboard/devis-facturation/devis/nouveau"
          className="rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-bold text-white"
        >
          + Nouveau devis
        </Link>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {quotes.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Aucun devis.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">N°</th>
                <th className="px-4 py-2">Client</th>
                <th className="px-4 py-2">Objet</th>
                <th className="px-4 py-2">HT</th>
                <th className="px-4 py-2">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotes.map((q) => (
                <tr key={q.id}>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/dashboard/devis-facturation/devis/${q.id}`}
                      className="font-semibold text-[#1d4ed8]"
                    >
                      {q.number}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    {q.clientExternalOrg?.tradeName || q.clientExternalOrg?.name || "—"}
                  </td>
                  <td className="px-4 py-2.5">{q.subject}</td>
                  <td className="px-4 py-2.5 tabular-nums">
                    {roundMoney(q.totalSellHt, 2).toLocaleString("fr-FR")} €
                  </td>
                  <td className="px-4 py-2.5">
                    {COMMERCIAL_QUOTE_STATUS_LABELS[q.status] ?? q.status}
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
