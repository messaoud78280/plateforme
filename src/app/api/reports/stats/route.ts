import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getReportStats, type PeriodKey } from "@/lib/reportStats";

/** GET /api/reports/stats?period=7d|30d|3m|6m|1y */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const period = (request.nextUrl.searchParams.get("period") || "30d") as PeriodKey;
  if (!["7d", "30d", "3m", "6m", "1y"].includes(period)) {
    return NextResponse.json({ error: "Période invalide" }, { status: 400 });
  }

  try {
    const stats = await getReportStats(
      session.user.id,
      (session.user.role === "AGENCE" || session.user.role === "MANAGER"),
      period
    );
    return NextResponse.json({
      ...stats,
      start: stats.start.toISOString(),
      end: stats.end.toISOString(),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur lors du chargement des statistiques" }, { status: 500 });
  }
}
