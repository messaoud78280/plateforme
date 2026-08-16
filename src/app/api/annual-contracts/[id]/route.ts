import { NextResponse } from "next/server";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import {
  canAccessAnnualContracts,
  canViewAnnualContractFinancials,
  resolveAnnualContractsOrgId,
} from "@/lib/annual-contracts/access";
import { prisma } from "@/lib/prisma";
import { ANNUAL_CONTRACT_STATUS_LABELS } from "@/lib/annual-contracts/types";
import { decideApiAccess } from "@/lib/equipe-acces/dashboard-policy";

export const dynamic = "force-dynamic";

export async function PATCH(
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
  const body = (await req.json()) as Record<string, unknown>;
  const canFinance = canViewAnnualContractFinancials(session.user);

  const existing = await prisma.annualServiceContract.findFirst({
    where: { id, organizationId: orgId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Contrat introuvable" }, { status: 404 });
  }

  const data: {
    clientName?: string;
    siteName?: string | null;
    siteAddress?: string;
    comment?: string | null;
    plannedCrewCount?: number | null;
    plannedDuration?: string | null;
    status?: "ACTIVE" | "TERMINATING" | "TERMINATED";
    amountHt?: number;
    nextPlannedDate?: Date | null;
  } = {};

  if (typeof body.clientName === "string" && body.clientName.trim()) {
    data.clientName = body.clientName.trim();
  }
  if (typeof body.siteAddress === "string" && body.siteAddress.trim()) {
    data.siteAddress = body.siteAddress.trim();
  }
  if (body.siteName === null || typeof body.siteName === "string") {
    data.siteName = body.siteName === null ? null : String(body.siteName).trim() || null;
  }
  if (body.comment === null || typeof body.comment === "string") {
    data.comment = body.comment === null ? null : String(body.comment);
  }
  if (body.plannedCrewCount === null || typeof body.plannedCrewCount === "number") {
    data.plannedCrewCount =
      body.plannedCrewCount === null ? null : Math.max(0, Math.round(body.plannedCrewCount));
  }
  if (body.plannedDuration === null || typeof body.plannedDuration === "string") {
    data.plannedDuration =
      body.plannedDuration === null ? null : String(body.plannedDuration);
  }
  if (
    body.status === "ACTIVE" ||
    body.status === "TERMINATING" ||
    body.status === "TERMINATED"
  ) {
    data.status = body.status;
  }
  if (canFinance && typeof body.amountHt === "number" && Number.isFinite(body.amountHt)) {
    data.amountHt = body.amountHt;
  }
  if (typeof body.nextPlannedDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.nextPlannedDate)) {
    data.nextPlannedDate = new Date(`${body.nextPlannedDate}T00:00:00.000Z`);
  }
  if (body.nextPlannedDate === null) {
    data.nextPlannedDate = null;
  }

  const updated = await prisma.annualServiceContract.update({
    where: { id },
    data,
  });

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    statusLabel: ANNUAL_CONTRACT_STATUS_LABELS[updated.status],
  });
}
