import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import { COMMERCIAL_QUOTE_STATUS_LABELS, roundMoney } from "@/lib/commercial/money";

export const dynamic = "force-dynamic";

function money(n: number) {
  return roundMoney(n, 2).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default async function DevisFacturationDashboardPage() {
  const session = await requireCommercialSession();
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) return null;

  const quotes = await prisma.commercialQuote.findMany({
    where: { organizationId: orgId },
    orderBy: { updatedAt: "desc" },
    take: 8,
    include: {
      clientExternalOrg: { select: { name: true, tradeName: true } },
      project: { select: { title: true } },
      responsible: { select: { name: true } },
    },
  });

  const counts = {
    draft: quotes.filter((q) => q.status === "DRAFT").length,
    sent: 0,
    accepted: 0,
    refused: 0,
    expired: 0,
  };

  const all = await prisma.commercialQuote.groupBy({
    by: ["status"],
    where: { organizationId: orgId },
    _count: true,
    _sum: { totalSellHt: true },
  });

  for (const row of all) {
    if (row.status === "DRAFT" || row.status === "TO_VALIDATE" || row.status === "VALIDATED")
      counts.draft = row._count;
    if (row.status === "SENT" || row.status === "VIEWED") counts.sent += row._count;
    if (row.status === "ACCEPTED") counts.accepted = row._count;
    if (row.status === "REFUSED") counts.refused = row._count;
    if (row.status === "EXPIRED") counts.expired = row._count;
  }

  const pendingHt = all
    .filter((r) => ["SENT", "VIEWED", "DRAFT", "TO_VALIDATE", "VALIDATED"].includes(r.status))
    .reduce((s, r) => s + d(r._sum.totalSellHt), 0);
  const acceptedHt = all
    .filter((r) => r.status === "ACCEPTED")
    .reduce((s, r) => s + d(r._sum.totalSellHt), 0);

  const invoices = await prisma.commercialInvoice.findMany({
    where: {
      organizationId: orgId,
      status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] },
    },
    select: { amountDue: true },
  });
  const dueTtc = invoices.reduce((s, i) => s + d(i.amountDue), 0);

  const kpis = [
    { label: "En préparation", value: counts.draft },
    { label: "Envoyés", value: counts.sent },
    { label: "Acceptés", value: counts.accepted },
    { label: "Refusés", value: counts.refused },
    { label: "Expirés", value: counts.expired },
    { label: "En attente HT", value: `${money(pendingHt)} €` },
    { label: "CA accepté HT", value: `${money(acceptedHt)} €` },
    { label: "À encaisser", value: `${money(dueTtc)} €` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          eyebrow="Devis & Facturation"
          title="Vue d’ensemble"
          description="Chiffrer, faire accepter, facturer et suivre l’encaissement — sans complexité inutile."
        />
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/devis-facturation/devis/nouveau"
            className="rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#152a45]"
          >
            + Nouveau devis
          </Link>
          <Link
            href="/dashboard/devis-facturation/bibliotheque"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            + Nouvel ouvrage
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,0.04)]"
          >
            <p className="text-2xl font-extrabold tabular-nums text-slate-900">{k.value}</p>
            <p className="mt-1 text-sm text-slate-600">{k.label}</p>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-bold text-slate-900">Derniers devis</h2>
          <Link
            href="/dashboard/devis-facturation/devis"
            className="text-xs font-semibold text-[#1d4ed8]"
          >
            Tout voir
          </Link>
        </div>
        {quotes.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            Aucun devis. Commencez par créer votre premier devis.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Numéro</th>
                  <th className="px-4 py-2">Client</th>
                  <th className="px-4 py-2">Objet</th>
                  <th className="px-4 py-2">HT</th>
                  <th className="px-4 py-2">Statut</th>
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
                    <td className="px-4 py-2.5 text-slate-700">
                      {q.clientExternalOrg?.tradeName ||
                        q.clientExternalOrg?.name ||
                        "—"}
                    </td>
                    <td className="px-4 py-2.5 text-slate-800">{q.subject}</td>
                    <td className="px-4 py-2.5 tabular-nums">
                      {money(d(q.totalSellHt))} €
                    </td>
                    <td className="px-4 py-2.5">
                      {COMMERCIAL_QUOTE_STATUS_LABELS[q.status] ?? q.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
