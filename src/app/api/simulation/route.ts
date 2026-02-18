import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAgenceOrManager } from "@/types";
import { getSimulationContext, executeDayEvents } from "@/lib/simulation/engine";
import { SIMULATION_TIMELINE } from "@/lib/simulation/timeline";

/** GET /api/simulation – État et contexte */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!isAgenceOrManager(session.user.role)) {
    return NextResponse.json(
      { error: "Seule l'agence peut accéder à la simulation." },
      { status: 403 }
    );
  }

  const ctx = await getSimulationContext();
  if (!ctx) {
    return NextResponse.json(
      {
        ready: false,
        error: "Données simulation absentes. Exécutez: npm run db:seed:simulation",
      },
      { status: 200 }
    );
  }

  return NextResponse.json({
    ready: true,
    projectId: ctx.projectId,
    timeline: SIMULATION_TIMELINE.map((d) => ({
      day: d.day,
      label: d.label,
      eventCount: d.events.length,
    })),
  });
}

/** POST /api/simulation – Exécuter un jour de simulation */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!isAgenceOrManager(session.user.role)) {
    return NextResponse.json(
      { error: "Seule l'agence peut exécuter la simulation." },
      { status: 403 }
    );
  }

  const ctx = await getSimulationContext();
  if (!ctx) {
    return NextResponse.json(
      { error: "Données simulation absentes. Exécutez: npm run db:seed:simulation" },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const day = typeof body.day === "number" ? body.day : 0;

  const { executed, errors } = await executeDayEvents(day, ctx);

  return NextResponse.json({
    success: true,
    day,
    executed,
    errors: errors.length > 0 ? errors : undefined,
  });
}
