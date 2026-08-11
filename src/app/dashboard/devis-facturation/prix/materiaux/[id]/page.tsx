import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { UpdateMaterialPriceForm } from "@/components/commercial/UpdateMaterialPriceForm";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { getMaterial } from "@/lib/commercial/library";
import { roundMoney } from "@/lib/commercial/money";

export const dynamic = "force-dynamic";

function fmt(n: number) {
  return roundMoney(n, 2).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default async function MaterialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireCommercialSession("/dashboard/devis-facturation/prix");
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) return null;

  const { id } = await params;
  const material = await getMaterial(orgId, id);
  if (!material) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/devis-facturation/prix"
          className="text-xs font-semibold text-slate-500 hover:text-[#1e3a5f]"
        >
          ← Prix
        </Link>
        <PageHeader
          className="mt-2"
          eyebrow="Devis & Facturation · Prix"
          title={material.name}
          description={`${material.unit} · utilisé par ${material.usedByWorkItemCount} ouvrage(s)`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase text-slate-500">Prix actuel</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-[#1e3a5f]">
            {fmt(material.currentPriceHt)} €
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase text-slate-500">Précédent</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-slate-800">
            {material.previousPriceHt != null
              ? `${fmt(material.previousPriceHt)} €`
              : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase text-slate-500">Variation €</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {material.variationHt != null
              ? `${material.variationHt > 0 ? "+" : ""}${fmt(material.variationHt)} €`
              : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase text-slate-500">Variation %</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {material.variationPercent != null
              ? `${material.variationPercent > 0 ? "+" : ""}${fmt(material.variationPercent)} %`
              : "—"}
          </p>
        </div>
      </div>

      <UpdateMaterialPriceForm materialId={id} />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-bold text-[#1e3a5f]">Historique</h2>
        </div>
        {material.prices.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Aucun historique de prix.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Fournisseur</th>
                <th className="px-4 py-2">Prix</th>
                <th className="px-4 py-2">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {material.prices.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-2.5 text-slate-600">
                    {new Date(p.notedAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-2.5">{p.supplierName || "—"}</td>
                  <td className="px-4 py-2.5 tabular-nums font-semibold">
                    {fmt(p.priceHt)} €
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{p.source || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
