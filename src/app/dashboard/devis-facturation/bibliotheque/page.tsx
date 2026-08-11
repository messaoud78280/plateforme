import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { listWorkItems } from "@/lib/commercial/library";
import { marginPercentFromCostSell, roundMoney } from "@/lib/commercial/money";
import { CreateWorkItemButton } from "@/components/commercial/CreateWorkItemButton";

export const dynamic = "force-dynamic";

export default async function BibliothequePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireCommercialSession(
    "/dashboard/devis-facturation/bibliotheque",
  );
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) return null;

  const { q } = await searchParams;
  const query = q?.trim() || undefined;
  const items = await listWorkItems(orgId, { q: query, take: 200 });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          eyebrow="Devis & Facturation · Référentiel"
          title="Bibliothèque"
          description="Ouvrages prêts à chiffrer — accélèrent le devis, jamais obligatoires."
        />
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/commercial/library/work-items?format=csv"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Export CSV
          </a>
          <CreateWorkItemButton />
        </div>
      </div>

      <form method="get" className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={query ?? ""}
          placeholder="Rechercher (nom, réf., famille…)"
          className="min-w-[14rem] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-bold text-white"
        >
          Rechercher
        </button>
        {query ? (
          <Link
            href="/dashboard/devis-facturation/bibliotheque"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"
          >
            Effacer
          </Link>
        ) : null}
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {items.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            {query
              ? "Aucun ouvrage pour cette recherche."
              : "Aucun ouvrage. Vous pouvez créer un devis sans bibliothèque."}
          </p>
        ) : (
          <>
            {/* Mobile 390 px — cartes compactes */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {items.map((w) => {
                const marque =
                  w.marginPercent ||
                  marginPercentFromCostSell(w.unitCostHt, w.unitSellHt);
                return (
                  <li key={w.id} className="px-4 py-3">
                    <Link
                      href={`/dashboard/devis-facturation/bibliotheque/${w.id}`}
                      className="block"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[#1e3a5f]">{w.name}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {[w.reference, w.saleUnit].filter(Boolean).join(" · ") || "—"}
                            {" · "}
                            {w.kind === "COMPOSITE" ? "Composé" : "Simple"}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="tabular-nums text-sm font-bold text-slate-900">
                            {roundMoney(w.unitSellHt, 2).toLocaleString("fr-FR")} €
                          </p>
                          <p className="text-[10px] text-slate-500">
                            marque {roundMoney(marque, 1).toLocaleString("fr-FR")} %
                          </p>
                        </div>
                      </div>
                      {w.needsPriceRecalc ? (
                        <span className="mt-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                          À recalculer
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Desktop — tableau */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Ouvrage</th>
                    <th className="px-4 py-2">Réf.</th>
                    <th className="px-4 py-2">Unité</th>
                    <th className="px-4 py-2">Coût</th>
                    <th className="px-4 py-2">Vente</th>
                    <th className="px-4 py-2">Taux de marque</th>
                    <th className="px-4 py-2">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((w) => {
                    const marque =
                      w.marginPercent ||
                      marginPercentFromCostSell(w.unitCostHt, w.unitSellHt);
                    return (
                      <tr key={w.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-2.5">
                          <Link
                            href={`/dashboard/devis-facturation/bibliotheque/${w.id}`}
                            className="font-semibold text-[#1e3a5f] hover:underline"
                          >
                            {w.name}
                          </Link>
                          {w.needsPriceRecalc ? (
                            <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                              À recalculer
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">{w.reference || "—"}</td>
                        <td className="px-4 py-2.5 text-slate-600">{w.saleUnit}</td>
                        <td className="px-4 py-2.5 tabular-nums">
                          {roundMoney(w.unitCostHt, 2).toLocaleString("fr-FR")} €
                        </td>
                        <td className="px-4 py-2.5 tabular-nums font-semibold">
                          {roundMoney(w.unitSellHt, 2).toLocaleString("fr-FR")} €
                        </td>
                        <td className="px-4 py-2.5 tabular-nums text-slate-600">
                          {roundMoney(marque, 1).toLocaleString("fr-FR")} %
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={
                              w.kind === "COMPOSITE"
                                ? "rounded-full bg-[#1e3a5f]/10 px-2 py-0.5 text-[10px] font-bold text-[#1e3a5f]"
                                : "rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600"
                            }
                          >
                            {w.kind === "COMPOSITE" ? "Composé" : "Simple"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
