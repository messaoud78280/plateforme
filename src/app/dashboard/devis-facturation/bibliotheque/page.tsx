import { PageHeader } from "@/components/ui/PageHeader";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { listWorkItems } from "@/lib/commercial/library";
import { roundMoney } from "@/lib/commercial/money";
import { CreateWorkItemButton } from "@/components/commercial/CreateWorkItemButton";

export const dynamic = "force-dynamic";

export default async function BibliothequePage() {
  const session = await requireCommercialSession(
    "/dashboard/devis-facturation/bibliotheque",
  );
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) return null;
  const items = await listWorkItems(orgId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          eyebrow="Gestion commerciale · Référentiel"
          title="Bibliothèque"
          description="Ouvrages commerciaux — accélèrent le devis, jamais obligatoires."
        />
        <CreateWorkItemButton />
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {items.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            Aucun ouvrage. Vous pouvez créer un devis sans bibliothèque.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-slate-900">{w.name}</p>
                  <p className="text-xs text-slate-500">
                    {[w.family, w.subFamily].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <p className="tabular-nums font-semibold">
                  {roundMoney(w.unitSellHt, 2).toLocaleString("fr-FR")} € HT
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
