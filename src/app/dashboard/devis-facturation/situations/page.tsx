import Link from "next/link";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import { roundMoney } from "@/lib/commercial/money";

export const dynamic = "force-dynamic";

export default async function SituationsListPage() {
  const session = await requireCommercialSession(
    "/dashboard/devis-facturation/situations",
  );
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) return null;

  const rows = await prisma.commercialProgressStatement.findMany({
    where: { organizationId: orgId },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      number: true,
      label: true,
      status: true,
      periodSellHt: true,
      cumulativeSellHt: true,
      periodStart: true,
      periodEnd: true,
      invoice: { select: { id: true, number: true } },
      quote: {
        select: {
          id: true,
          number: true,
          project: { select: { title: true } },
          clientExternalOrg: { select: { name: true, tradeName: true } },
        },
      },
    },
  });

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-slate-500">
        Situations de travaux — créées depuis un devis accepté.
      </p>
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500">
          Aucune situation pour l’instant.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {rows.map((s) => (
            <li key={s.id}>
              <Link
                href={`/dashboard/devis-facturation/situations/${s.id}`}
                className="block px-4 py-3 hover:bg-slate-50/80"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[14px] font-semibold text-slate-900">
                      {s.label || `Situation n°${s.number}`}
                    </p>
                    <p className="mt-0.5 text-[12px] text-slate-500">
                      {s.quote.project?.title ||
                        s.quote.clientExternalOrg?.tradeName ||
                        s.quote.clientExternalOrg?.name ||
                        "—"}{" "}
                      · Devis {s.quote.number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-medium tabular-nums text-[#1e3a5f]">
                      {roundMoney(d(s.periodSellHt), 0).toLocaleString("fr-FR")} € HT
                    </p>
                    <p className="text-[11px] text-slate-500">{s.status}</p>
                    {s.invoice ? (
                      <p className="text-[11px] text-emerald-700">
                        Facture {s.invoice.number}
                      </p>
                    ) : null}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
