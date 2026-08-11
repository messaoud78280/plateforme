import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { loadCommercialDashboardKpis } from "@/lib/commercial/dashboard-kpis";
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";

export async function GET() {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const orgId = auth.orgId;

  const [kpis, recentQuotes] = await Promise.all([
    loadCommercialDashboardKpis(orgId),
    prisma.commercialQuote.findMany({
      where: { organizationId: orgId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        number: true,
        subject: true,
        status: true,
        totalTtc: true,
        updatedAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    kpis: {
      quoteCount: kpis.quoteCount,
      enPreparation: kpis.enPreparation,
      envoyes: kpis.envoyes,
      acceptes: kpis.acceptes,
      refuses: kpis.refuses,
      expires: kpis.expires,
      pipelineDevisHt: kpis.pipelineDevisHt,
      contratAccepteHt: kpis.contratAccepteHt,
      aEncaisserTtc: kpis.aEncaisserTtc,
      /** aliases legacy */
      quotesDraft: kpis.enPreparation,
      quotesSent: kpis.envoyes,
      quotesAccepted: kpis.acceptes,
    },
    recentQuotes: recentQuotes.map((q) => ({
      ...q,
      totalTtc: d(q.totalTtc),
    })),
  });
}
