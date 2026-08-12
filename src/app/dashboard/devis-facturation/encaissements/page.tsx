import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { listPayments } from "@/lib/commercial/invoices";
import { listRetentionGuarantees } from "@/lib/commercial/retention";
import { roundMoney } from "@/lib/commercial/money";
import { RetentionReleaseButton } from "@/components/commercial/RetentionReleaseButton";

export const dynamic = "force-dynamic";

export default async function EncaissementsPage() {
  const session = await requireCommercialSession(
    "/dashboard/devis-facturation/encaissements",
  );
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) return null;
  const [payments, retentions] = await Promise.all([
    listPayments(orgId),
    listRetentionGuarantees(orgId),
  ]);

  const openRetentions = retentions.filter(
    (r) =>
      r.effectiveStatus === "HELD" ||
      r.effectiveStatus === "DUE" ||
      r.effectiveStatus === "RELEASED",
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Devis & Facturation"
        title="Encaissements"
        description="Paiements reçus et retenues de garantie — hors abonnement SaaS."
      />

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-[#1e3a5f]">Retenues de garantie</h2>
        <div className="overflow-hidden rounded-xl border border-amber-200 bg-white">
          {openRetentions.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">
              Aucune retenue en cours. Les RG ne sont pas des impayés.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-amber-50 text-[10px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Client</th>
                  <th className="px-4 py-2">Chantier / Affaire</th>
                  <th className="px-4 py-2">Situation / Facture</th>
                  <th className="px-4 py-2 text-right">Montant</th>
                  <th className="px-4 py-2">Statut</th>
                  <th className="px-4 py-2">Libération</th>
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
                    <td className="px-4 py-2.5">
                      <div className="text-xs">
                        {r.progressStatement?.label ?? "—"}
                        {r.situationInvoice ? (
                          <>
                            <br />
                            <Link
                              href={`/dashboard/devis-facturation/factures/${r.situationInvoice.id}`}
                              className="font-semibold text-[#1d4ed8]"
                            >
                              {r.situationInvoice.number}
                            </Link>
                          </>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold">
                      {roundMoney(r.amountHt, 2).toLocaleString("fr-FR")} € HT
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                        {r.statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">
                      {r.plannedReleaseDate
                        ? new Date(r.plannedReleaseDate).toLocaleDateString("fr-FR")
                        : "—"}
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
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-[#1e3a5f]">Historique des encaissements</h2>
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
      </section>
    </div>
  );
}
