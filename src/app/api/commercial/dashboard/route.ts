import { NextRequest, NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { canShowCommercialPurchases } from "@/lib/commercial/workspace-nav";
import { resolveDashboardPeriod } from "@/lib/commercial/dashboard-periods";
import { getCommercialDashboardMetrics } from "@/lib/commercial/dashboard-metrics";

export async function GET(req: NextRequest) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = req.nextUrl;
  const period = resolveDashboardPeriod({
    preset: url.searchParams.get("period"),
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
  });
  const clientId = url.searchParams.get("clientId");
  const projectId = url.searchParams.get("projectId");

  const metrics = await getCommercialDashboardMetrics({
    orgId: auth.orgId,
    period,
    clientId,
    projectId,
    canSeePurchases: canShowCommercialPurchases({
      personType: auth.session.user.personType,
      permissionProfile: auth.session.user.permissionProfile,
    }),
  });

  return NextResponse.json({
    metrics,
    kpis: {
      quoteCount: metrics.summary.pipelineCount,
      pipelineDevisHt: metrics.summary.pipelineHt,
      aEncaisserTtc: metrics.summary.outstandingTtc,
      enRetardTtc: metrics.summary.overdueTtc,
      contratAccepteHt: metrics.quotePipeline.stages.find((s) => s.key === "accepted")
        ?.amountHt,
    },
  });
}
