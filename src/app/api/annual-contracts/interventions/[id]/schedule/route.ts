import { NextResponse } from "next/server";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import {
  canAccessAnnualContracts,
  resolveAnnualContractsOrgId,
} from "@/lib/annual-contracts/access";
import { scheduleAnnualIntervention } from "@/lib/annual-contracts/schedule-intervention";
import { decideApiAccess } from "@/lib/equipe-acces/dashboard-policy";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getCachedServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const gate = decideApiAccess(
    "/api/annual-contracts",
    session.user.personType,
    session.user.permissionProfile,
  );
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  if (!canAccessAnnualContracts(session.user)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const orgId = await resolveAnnualContractsOrgId(session.user);
  if (!orgId) {
    return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });
  }

  const { id: interventionId } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const result = await scheduleAnnualIntervention({
      interventionId,
      organizationId: orgId,
      actorUserId: session.user.id,
      plannedDate:
        typeof body.plannedDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.plannedDate)
          ? new Date(`${body.plannedDate}T00:00:00.000Z`)
          : undefined,
      plannedCrewCount:
        typeof body.plannedCrewCount === "number" ? body.plannedCrewCount : undefined,
      plannedDuration:
        typeof body.plannedDuration === "string" ? body.plannedDuration : undefined,
      comment: typeof body.comment === "string" ? body.comment : undefined,
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur programmation";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
