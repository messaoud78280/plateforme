import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { listQuotes } from "@/lib/commercial/quotes";
import { COMMERCIAL_QUOTE_STATUS_LABELS, roundMoney } from "@/lib/commercial/money";
import { quoteNextActionLabel } from "@/lib/commercial/dashboard-kpis";

export const dynamic = "force-dynamic";

export default async function DevisListPage() {
  const session = await requireCommercialSession("/dashboard/devis-facturation/devis");
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) return null;
  const quotes = await listQuotes(orgId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          eyebrow="Devis & Facturation"
          title="Devis"
          description="Devis commerciaux — source de vérité financière."
        />
        <Link
          href="/dashboard/devis-facturation/devis/nouveau"
          className="rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-bold text-white"
        >
          + Nouveau devis
        </Link>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {quotes.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-semibold text-slate-900">Aucun devis pour le moment.</p>
            <Link
              href="/dashboard/devis-facturation/devis/nouveau"
              className="mt-4 inline-flex rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-bold text-white"
            >
              + Nouveau devis
            </Link>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Réf.</th>
                    <th className="px-4 py-2">Client</th>
                    <th className="px-4 py-2">Chantier</th>
                    <th className="px-4 py-2">HT</th>
                    <th className="px-4 py-2">Statut</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Prochaine action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quotes.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/dashboard/devis-facturation/devis/${q.id}`}
                          className="font-semibold text-[#1d4ed8]"
                        >
                          {q.number}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">
                        {q.clientExternalOrg?.tradeName ||
                          q.clientExternalOrg?.name ||
                          "—"}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {q.project?.title ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">
                        {roundMoney(q.totalSellHt, 2).toLocaleString("fr-FR")} €
                      </td>
                      <td className="px-4 py-2.5">
                        {COMMERCIAL_QUOTE_STATUS_LABELS[q.status] ?? q.status}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {q.updatedAt
                          ? new Date(q.updatedAt).toLocaleDateString("fr-FR")
                          : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-xs font-medium text-slate-700">
                        {quoteNextActionLabel({
                          status: q.status,
                          projectId: q.project?.id,
                          validityDate: q.validityDate,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-slate-100 md:hidden">
              {quotes.map((q) => (
                <li key={q.id}>
                  <Link
                    href={`/dashboard/devis-facturation/devis/${q.id}`}
                    className="block px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-900">{q.number}</p>
                      <p className="tabular-nums text-sm font-semibold">
                        {roundMoney(q.totalSellHt, 2).toLocaleString("fr-FR")} €
                      </p>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {q.clientExternalOrg?.tradeName ||
                        q.clientExternalOrg?.name ||
                        "—"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {COMMERCIAL_QUOTE_STATUS_LABELS[q.status] ?? q.status}
                      {" · "}
                      {quoteNextActionLabel({
                        status: q.status,
                        projectId: q.project?.id,
                        validityDate: q.validityDate,
                      })}
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
