import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getReportStats } from "@/lib/reportStats";
import { getClientReportingSnapshot } from "@/lib/client-reporting-insights";
import { parseReportPeriodParam } from "@/lib/validation/reportParams";

/** GET /api/reports/stats?period=7d|30d|3m|6m|1y */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const period = parseReportPeriodParam(request.nextUrl.searchParams.get("period"));
  if (period === null) {
    return NextResponse.json({ error: "Période invalide" }, { status: 400 });
  }

  const role = session.user.role;
  const isAgence = role === "AGENCE" || role === "MANAGER";
  const isClient = role === "CLIENT";
  const isManager = role === "MANAGER";

  try {
    const [stats, clientSnapshot] = await Promise.all([
      getReportStats(session.user.id, isAgence, period),
      isClient
        ? getClientReportingSnapshot(session.user.id, "client")
        : isManager
          ? getClientReportingSnapshot(session.user.id, "ops")
          : Promise.resolve(null),
    ]);

    return NextResponse.json({
      ...stats,
      start: stats.start.toISOString(),
      end: stats.end.toISOString(),
      role: role ?? null,
      clientSnapshot,
    });
  } catch (e: unknown) {
    console.error("[reports/stats]", e);
    return NextResponse.json({ error: "Erreur lors du chargement des statistiques" }, { status: 500 });
  }
}
