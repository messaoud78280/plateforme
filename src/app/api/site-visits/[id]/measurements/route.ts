import { NextResponse } from "next/server";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import { decideApiAccess } from "@/lib/equipe-acces/dashboard-policy";
import {
  canAccessSiteVisits,
  resolveSiteVisitsOrgId,
} from "@/lib/site-visits/access";
import {
  deleteMeasurement,
  upsertMeasurement,
} from "@/lib/site-visits/service";
import type { MeasureType } from "@/lib/site-visits/measurements";

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
    "/api/site-visits",
    session.user.personType,
    session.user.permissionProfile,
  );
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  if (!canAccessSiteVisits(session.user)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const orgId = await resolveSiteVisitsOrgId(session.user);
  if (!orgId) {
    return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });
  }
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const visit = await upsertMeasurement({
      organizationId: orgId,
      visitId: id,
      measurementId: body.measurementId ?? null,
      data: {
        zone: body.zone ?? null,
        label: String(body.label ?? ""),
        measureType: body.measureType as MeasureType,
        lengthM: body.lengthM != null ? Number(body.lengthM) : null,
        widthM: body.widthM != null ? Number(body.widthM) : null,
        heightM: body.heightM != null ? Number(body.heightM) : null,
        quantityValue: body.quantityValue != null ? Number(body.quantityValue) : null,
        unit: body.unit ?? null,
        observation: body.observation ?? null,
        multiplier: body.multiplier != null ? Number(body.multiplier) : null,
        coefficient: body.coefficient != null ? Number(body.coefficient) : null,
        wastePercent: body.wastePercent != null ? Number(body.wastePercent) : null,
        deductions: Array.isArray(body.deductions) ? body.deductions : null,
        lot: body.lot ?? null,
        workItemId: body.workItemId ?? null,
      },
    });
    return NextResponse.json({ visit }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getCachedServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!canAccessSiteVisits(session.user)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const orgId = await resolveSiteVisitsOrgId(session.user);
  if (!orgId) {
    return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });
  }
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const measurementId = url.searchParams.get("measurementId");
  if (!measurementId) {
    return NextResponse.json({ error: "measurementId requis" }, { status: 400 });
  }
  try {
    const visit = await deleteMeasurement({
      organizationId: orgId,
      visitId: id,
      measurementId,
    });
    return NextResponse.json({ visit });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
