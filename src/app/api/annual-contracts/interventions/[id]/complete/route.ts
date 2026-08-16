import { NextResponse } from "next/server";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import {
  canAccessAnnualContracts,
  resolveAnnualContractsOrgId,
} from "@/lib/annual-contracts/access";
import { completeAnnualIntervention } from "@/lib/annual-contracts/complete-intervention";
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

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const result = await completeAnnualIntervention({
      interventionId: id,
      organizationId: orgId,
      actorUserId: session.user.id,
      completedAt:
        typeof body.completedAt === "string"
          ? new Date(body.completedAt)
          : undefined,
      actualCrewCount:
        typeof body.actualCrewCount === "number" ? body.actualCrewCount : undefined,
      comment: typeof body.comment === "string" ? body.comment : undefined,
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur réalisation";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
