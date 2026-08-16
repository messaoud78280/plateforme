import Link from "next/link";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import { COMMERCIAL_QUOTE_STATUS_LABELS, roundMoney } from "@/lib/commercial/money";
import { quoteNextActionLabel } from "@/lib/commercial/dashboard-kpis";

export const dynamic = "force-dynamic";

export default async function DevisARelancerPage() {
  const session = await requireCommercialSession(
    "/dashboard/devis-facturation/suivi/devis-a-relancer",
  );
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) return null;

  const now = new Date();
  const rows = await prisma.commercialQuote.findMany({
    where: {
      organizationId: orgId,
      status: { in: ["SENT", "VIEWED"] },
    },
    orderBy: [{ sentAt: "asc" }, { updatedAt: "asc" }],
    take: 100,
    select: {
      id: true,
      number: true,
      status: true,
      totalSellHt: true,
      sentAt: true,
      updatedAt: true,
      validityDate: true,
      projectId: true,
      clientExternalOrg: { select: { name: true, tradeName: true } },
    },
  });

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-slate-500">
        Devis envoyés ou consultés, en attente de réponse client.
      </p>
      <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {rows.map((q) => {
          const since = q.sentAt ?? q.updatedAt;
          const days = Math.max(
            0,
            Math.floor((now.getTime() - since.getTime()) / 86400000),
          );
          return (
            <li key={q.id}>
              <Link
                href={`/dashboard/devis-facturation/devis/${q.id}`}
                className="block px-4 py-3 hover:bg-slate-50/80"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#1e3a5f]">{q.number}</p>
                    <p className="text-[12px] text-slate-600">
                      {q.clientExternalOrg?.tradeName ||
                        q.clientExternalOrg?.name ||
                        "—"}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {COMMERCIAL_QUOTE_STATUS_LABELS[q.status]} · depuis {days} j
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium tabular-nums">
                      {roundMoney(d(q.totalSellHt), 0).toLocaleString("fr-FR")} € HT
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {quoteNextActionLabel({
                        status: q.status,
                        projectId: q.projectId,
                        validityDate: q.validityDate,
                      })}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
        {rows.length === 0 ? (
          <li className="px-4 py-10 text-center text-sm text-slate-500">
            Aucun devis à relancer.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
