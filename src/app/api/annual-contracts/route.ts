import { NextResponse } from "next/server";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import {
  canAccessAnnualContracts,
  canViewAnnualContractFinancials,
  resolveAnnualContractsOrgId,
} from "@/lib/annual-contracts/access";
import { loadAnnualContractsBoard } from "@/lib/annual-contracts/load-board";
import { decideApiAccess } from "@/lib/equipe-acces/dashboard-policy";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
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

  const url = new URL(req.url);
  const yearRaw = url.searchParams.get("year");
  const year = yearRaw ? Number(yearRaw) : undefined;

  const board = await loadAnnualContractsBoard({
    organizationId: orgId,
    includeFinancials: canViewAnnualContractFinancials(session.user),
    year: Number.isFinite(year) ? year : undefined,
  });

  return NextResponse.json(board);
}
