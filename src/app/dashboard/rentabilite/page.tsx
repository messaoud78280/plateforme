import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { loadPortfolioProfitability } from "@/lib/chantier/project-profitability";
import { PortfolioRentabiliteClient } from "@/components/chantier/PortfolioRentabiliteClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RentabilitePage() {
  const session = await requireCommercialSession("/dashboard/rentabilite");
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) redirect("/dashboard");

  const portfolio = await loadPortfolioProfitability(orgId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#1e3a5f]">
          Rentabilité
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Vue économique des chantiers — prévu, engagé, facturé, encaissé.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
          <span>
            <strong>{portfolio.counts.total}</strong> actifs
          </span>
          <span>
            <strong>{portfolio.counts.stable}</strong> stables
          </span>
          <span>
            <strong>{portfolio.counts.watch}</strong> à surveiller
          </span>
          <span>
            <strong className="text-red-700">{portfolio.counts.critical}</strong>{" "}
            critiques
          </span>
        </div>
      </div>

      <PortfolioRentabiliteClient
        rows={portfolio.rows.map((r) => ({
          projectId: r.projectId,
          projectTitle: r.projectTitle,
          clientName: r.clientName,
          marketSellHt: r.commercial.marketSellHt,
          plannedMarginPercent: r.budget?.plannedMarginPercent ?? null,
          estimatedMarginPercent: r.budget
            ? r.estimatedMarginPercent
            : null,
          invoicedPercent: r.commercial.invoicedPercentOfMarket,
          collectedTtc: r.commercial.collectedTtc,
          health: r.health,
          healthLabel: r.healthLabel,
          hasBudget: Boolean(r.budget),
        }))}
      />
    </div>
  );
}
