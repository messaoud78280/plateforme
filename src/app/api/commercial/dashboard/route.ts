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

  try {
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

    const safe = JSON.parse(JSON.stringify(metrics));

    return NextResponse.json({
      metrics: safe,
      kpis: {
        quoteCount: safe.summary.pipelineCount,
        pipelineDevisHt: safe.summary.pipelineHt,
        aEncaisserTtc: safe.summary.outstandingTtc,
        enRetardTtc: safe.summary.overdueTtc,
        contratAccepteHt: safe.quotePipeline.stages.find(
          (s: { key: string }) => s.key === "accepted",
        )?.amountHt,
      },
    });
  } catch (err) {
    console.error("[api/commercial/dashboard] failed", err);
    return NextResponse.json(
      { error: "Impossible de charger les indicateurs." },
      { status: 500 },
    );
  }
}
