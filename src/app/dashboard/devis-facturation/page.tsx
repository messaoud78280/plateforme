import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import { COMMERCIAL_QUOTE_STATUS_LABELS, roundMoney } from "@/lib/commercial/money";
import {
  loadCommercialDashboardKpis,
  quoteNextActionLabel,
} from "@/lib/commercial/dashboard-kpis";

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

  const [kpis, quotes] = await Promise.all([
    loadCommercialDashboardKpis(orgId),
    prisma.commercialQuote.findMany({
      where: { organizationId: orgId },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        number: true,
        subject: true,
        status: true,
        totalSellHt: true,
        projectId: true,
        validityDate: true,
        clientExternalOrg: { select: { name: true, tradeName: true } },
        project: { select: { title: true } },
      },
    }),
  ]);

  if (kpis.quoteCount === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Devis & Facturation"
          title="Devis & Facturation"
          description="Devis clients, acceptation, factures et encaissements — une seule chaîne commerciale."
        />
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <p className="text-lg font-extrabold text-slate-900">Créez votre premier devis</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Puis suivez-le jusqu’à l’encaissement, sans ressaisie.
          </p>
          <Link
            href="/dashboard/devis-facturation/devis/nouveau"
            className="mt-6 inline-flex rounded-xl bg-[#1e3a5f] px-5 py-3 text-sm font-bold text-white hover:bg-[#152a45]"
          >
            + Nouveau devis
          </Link>
          <p className="mt-4 text-xs text-slate-400">
            Distinct de « Analyses devis » (bibliothèque interne). Référentiel commercial dans
            l’onglet Référentiel.
          </p>
        </div>
      </div>
    );
  }

  const cards = [
    { label: "Devis en préparation", value: String(kpis.enPreparation) },
    { label: "Devis acceptés", value: String(kpis.acceptes) },
    { label: "Contrat accepté HT", value: `${money(kpis.contratAccepteHt)} €` },
    { label: "À encaisser", value: `${money(kpis.aEncaisserTtc)} €` },
    { label: "En retard", value: `${money(kpis.enRetardTtc)} €` },
    { label: "Encaissé ce mois", value: `${money(kpis.encaisseMoisTtc)} €` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          eyebrow="Devis & Facturation"
          title="Vue d’ensemble"
          description="Ce qui bouge, ce qui est contractualisé, ce qui reste à facturer et à encaisser."
        />
        <Link
          href="/dashboard/devis-facturation/devis/nouveau"
          className="rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#152a45]"
        >
          + Nouveau devis
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((k) => (
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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Réf.</th>
                <th className="px-4 py-2">Client</th>
                <th className="hidden px-4 py-2 sm:table-cell">Chantier</th>
                <th className="px-4 py-2">HT</th>
                <th className="px-4 py-2">Statut</th>
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
                  <td className="px-4 py-2.5 text-slate-700">
                    {q.clientExternalOrg?.tradeName ||
                      q.clientExternalOrg?.name ||
                      "—"}
                  </td>
                  <td className="hidden px-4 py-2.5 text-slate-600 sm:table-cell">
                    {q.project?.title ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums">
                    {money(d(q.totalSellHt))} €
                  </td>
                  <td className="px-4 py-2.5">
                    {COMMERCIAL_QUOTE_STATUS_LABELS[q.status] ?? q.status}
                  </td>
                  <td className="px-4 py-2.5 text-xs font-medium text-slate-700">
                    {quoteNextActionLabel({
                      status: q.status,
                      projectId: q.projectId,
                      validityDate: q.validityDate,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
