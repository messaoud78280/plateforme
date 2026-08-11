import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { listAmendments } from "@/lib/commercial/amendments";
import {
  COMMERCIAL_AMENDMENT_STATUS_LABELS,
  roundMoney,
} from "@/lib/commercial/money";

export const dynamic = "force-dynamic";

/** Accès secondaire — pas dans la nav principale. */
export default async function AvenantsIndexPage() {
  const session = await requireCommercialSession(
    "/dashboard/devis-facturation/avenants",
  );
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) return null;
  const amendments = await listAmendments(orgId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gestion commerciale"
        title="Avenants"
        description="Consultation — création depuis le détail d’un devis accepté."
      />
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {amendments.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            Aucun avenant.{" "}
            <Link
              href="/dashboard/devis-facturation/devis"
              className="font-semibold text-[#1d4ed8]"
            >
              Ouvrir un devis accepté
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {amendments.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/dashboard/devis-facturation/avenants/${a.id}`}
                  className="block px-4 py-3 hover:bg-slate-50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {a.number} ·{" "}
                        {COMMERCIAL_AMENDMENT_STATUS_LABELS[a.status] ?? a.status}
                      </p>
                      <p className="text-sm text-slate-600">{a.subject}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {a.quote.number}
                        {a.quote.project?.title ? ` · ${a.quote.project.title}` : ""}
                      </p>
                    </div>
                    <p className="tabular-nums text-sm font-bold">
                      {roundMoney(a.totalSellHt, 2).toLocaleString("fr-FR")} € HT
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
