import { NextResponse } from "next/server";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import {
  canAccessAnnualContracts,
  resolveAnnualContractsOrgId,
} from "@/lib/annual-contracts/access";
import {
  canPrepareAnnualInvoice,
  prepareAnnualInterventionInvoice,
} from "@/lib/annual-contracts/prepare-invoice";
import { decideApiAccess } from "@/lib/equipe-acces/dashboard-policy";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
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
  if (!canPrepareAnnualInvoice(session.user)) {
    return NextResponse.json(
      { error: "Permission financière requise (SEC-1)" },
      { status: 403 },
    );
  }

  const orgId = await resolveAnnualContractsOrgId(session.user);
  if (!orgId) {
    return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });
  }

  const { id } = await ctx.params;
  try {
    const result = await prepareAnnualInterventionInvoice({
      organizationId: orgId,
      interventionId: id,
      actorUserId: session.user.id,
    });
    return NextResponse.json(result, {
      status: result.action === "created" ? 201 : 200,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur préparation facture";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
