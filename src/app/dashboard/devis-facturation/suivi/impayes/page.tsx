import Link from "next/link";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { listCollectionsInvoices } from "@/lib/commercial/collections";
import { roundMoney } from "@/lib/commercial/money";

export const dynamic = "force-dynamic";

export default async function ImpayesPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const session = await requireCommercialSession(
    "/dashboard/devis-facturation/suivi/impayes",
  );
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) return null;
  const params = await searchParams;
  const filter = params.mode === "upcoming" ? "upcoming" : "overdue";
  const rows = await listCollectionsInvoices(orgId, { filter });
  const sorted = [...rows].sort((a, b) => b.daysLate - a.daysLate);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Link
          href="/dashboard/devis-facturation/suivi/impayes"
          className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${
            filter === "overdue" ? "bg-[#1e3a5f] text-white" : "bg-slate-100 text-slate-700"
          }`}
        >
          En retard
        </Link>
        <Link
          href="/dashboard/devis-facturation/suivi/echeances"
          className="rounded-full bg-slate-100 px-3 py-1.5 text-[12px] font-semibold text-slate-700"
        >
          Échéances
        </Link>
      </div>
      <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {sorted.map((r) => (
          <li key={r.id}>
            <Link
              href={`/dashboard/devis-facturation/factures/${r.id}`}
              className="block px-4 py-3 hover:bg-slate-50/80"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[#1e3a5f]">{r.number}</p>
                  <p className="text-[12px] text-slate-600">{r.clientName || "—"}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Échéance{" "}
                    {r.dueDate
                      ? r.dueDate.toLocaleDateString("fr-FR")
                      : "—"}
                    {r.daysLate > 0 ? ` · ${r.daysLate} j de retard` : ""}
                  </p>
                </div>
                <div className="text-right text-[12px]">
                  <p className="font-medium tabular-nums">
                    {roundMoney(r.totalTtc, 0).toLocaleString("fr-FR")} € TTC
                  </p>
                  <p className="text-slate-500">
                    Payé {roundMoney(r.amountPaid, 0).toLocaleString("fr-FR")} €
                  </p>
                  <p className="font-semibold text-amber-800">
                    Reste {roundMoney(r.amountDue, 0).toLocaleString("fr-FR")} €
                  </p>
                </div>
              </div>
            </Link>
          </li>
        ))}
        {sorted.length === 0 ? (
          <li className="px-4 py-10 text-center text-sm text-slate-500">
            Aucune facture dans ce filtre.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
