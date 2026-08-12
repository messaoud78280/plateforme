import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { listPayments } from "@/lib/commercial/invoices";
import { listRetentionGuarantees } from "@/lib/commercial/retention";
import {
  loadCollectionsKpis,
  listCollectionsInvoices,
  refreshCommercialOverdueStatuses,
  type CollectionsFilter,
} from "@/lib/commercial/collections";
import { roundMoney } from "@/lib/commercial/money";
import { RetentionReleaseButton } from "@/components/commercial/RetentionReleaseButton";
import { EncaissementsHub } from "@/components/commercial/EncaissementsHub";

export const dynamic = "force-dynamic";

type Search = { filter?: string; q?: string };

export default async function EncaissementsPage({
  searchParams,
}: {
  searchParams?: Promise<Search>;
}) {
  const session = await requireCommercialSession(
    "/dashboard/devis-facturation/encaissements",
  );
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) return null;

  const sp = (await searchParams) ?? {};
  const filter = (
    ["all", "upcoming", "overdue", "partial", "paid"].includes(String(sp.filter))
      ? sp.filter
      : "all"
  ) as CollectionsFilter;
  const q = typeof sp.q === "string" ? sp.q : "";

  await refreshCommercialOverdueStatuses({ orgId, notify: false });

  const [kpis, rows, payments, retentions] = await Promise.all([
    loadCollectionsKpis(orgId),
    listCollectionsInvoices(orgId, { filter: "all", q: "" }),
    listPayments(orgId),
    listRetentionGuarantees(orgId),
  ]);

  const openRetentions = retentions.filter(
    (r) =>
      r.effectiveStatus === "HELD" ||
      r.effectiveStatus === "DUE" ||
      r.effectiveStatus === "RELEASED",
  );

  const serialRows = rows.map((r) => ({
    ...r,
    issueDate: r.issueDate,
    dueDate: r.dueDate,
    lastReminderAt: r.lastReminderAt,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Devis & Facturation"
        title="Encaissements"
        description="Qui doit payer, combien, quand — et qui est en retard."
      />

      <EncaissementsHub
        initialRows={serialRows}
        kpis={kpis}
        initialFilter={filter}
        initialQ={q}
      />

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-[#1e3a5f]">Retenues de garantie</h2>
        <p className="text-xs text-slate-500">
          Créances différées — ne sont pas des factures en retard.
        </p>
        <div className="overflow-hidden rounded-xl border border-amber-200 bg-white">
          {openRetentions.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">Aucune retenue en cours.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-amber-50 text-[10px] font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Client</th>
                    <th className="px-4 py-2">Affaire</th>
                    <th className="px-4 py-2 text-right">Montant</th>
                    <th className="px-4 py-2">Statut</th>
                    <th className="px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {openRetentions.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-2.5">{r.clientName ?? "—"}</td>
                      <td className="px-4 py-2.5">
                        {r.projectTitle ?? r.quote?.number ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-semibold">
                        {roundMoney(r.amountHt, 2).toLocaleString("fr-FR")} € HT
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                          {r.statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {r.effectiveStatus === "HELD" ||
                        r.effectiveStatus === "DUE" ? (
                          <RetentionReleaseButton retentionId={r.id} />
                        ) : r.settlementInvoice ? (
                          <Link
                            href={`/dashboard/devis-facturation/factures/${r.settlementInvoice.id}`}
                            className="text-xs font-semibold text-[#1d4ed8]"
                          >
                            {r.settlementInvoice.number}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-[#1e3a5f]">
          Paiements récents
        </h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {payments.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">Aucun encaissement enregistré.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {payments.slice(0, 15).map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
                >
                  <Link
                    href={`/dashboard/devis-facturation/factures/${p.invoice.id}`}
                    className="font-semibold text-[#1d4ed8]"
                  >
                    {p.invoice.number}
                  </Link>
                  <span className="text-xs text-slate-500">
                    {new Date(p.paidAt).toLocaleDateString("fr-FR")} · {p.method}
                  </span>
                  <span className="tabular-nums font-bold">
                    {roundMoney(p.amount, 2).toLocaleString("fr-FR")} €
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
