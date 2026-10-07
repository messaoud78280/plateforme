/**
 * Preview Planning V2 — bework_schedule_ai_v1/v2 → SchedulePlan.
 * Aucune écriture. N’utilise PAS l’ancien parseBeworkScheduleBundle.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
import { prisma } from "@/lib/prisma";
import { previewScheduleV2 } from "@/lib/schedule-domain/repository";
import {
  isPlanningV2ServerEnabled,
  planningV2DisabledResponse,
} from "@/lib/schedule-domain/server-flags";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  if (!isPlanningV2ServerEnabled()) return planningV2DisabledResponse();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { id: projectId } = await ctx.params;
  const access = await canAccessChantierProject(session.user, projectId);
  if (!access.ok) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true },
  });
  if (!project?.organizationId) {
    return NextResponse.json({ error: "Chantier introuvable" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    raw?: unknown;
    studyId?: string;
    sourcesFingerprint?: string;
  };

  try {
    const result = await previewScheduleV2({
      orgId: project.organizationId,
      projectId,
      studyId: typeof body.studyId === "string" ? body.studyId : null,
      raw: body.raw ?? "",
      expectedSourceFingerprint:
        typeof body.sourcesFingerprint === "string"
          ? body.sourcesFingerprint
          : null,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.issues[0]?.message ?? "Prévisualisation impossible",
          code: ("code" in result && result.code) || result.issues[0]?.code,
          issues: result.issues,
          stats: result.stats,
          studyId: result.studyId,
        },
        { status: ("status" in result && result.status) || 422 },
      );
    }

    const takeoffRows = result.studyId
      ? await prisma.prepTakeoffLine.findMany({
          where: { studyId: result.studyId },
          select: { code: true, designation: true },
        })
      : [];
    const takeoffDirectory = Object.fromEntries(
      takeoffRows.map((r) => [r.code, r.designation]),
    );

    return NextResponse.json({
      ok: true,
      draftHash: result.draftHash,
      sourceFingerprint: result.sourceFingerprint,
      studyId: result.studyId,
      plan: result.plan,
      calculated: result.calculated,
      stats: result.stats,
      warnings: result.warnings,
      takeoffDirectory,
    });
  } catch (e) {
    const err = e as { message?: string; code?: string; status?: number };
    return NextResponse.json(
      {
        ok: false,
        error: err.message ?? "Prévisualisation impossible",
        code: err.code,
      },
      { status: err.status ?? 500 },
    );
  }
}
