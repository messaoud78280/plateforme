/**
 * Contexte CREATE Planning V2 — lecture seule.
 * expected_output = bework_schedule_ai_v1 (contrat dérivé du code).
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
import { prisma } from "@/lib/prisma";
import { buildPlanningV2Context } from "@/lib/schedule-domain/build-context";
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

  const body = (await req.json().catch(() => ({}))) as { studyId?: string };
  try {
    const built = await buildPlanningV2Context({
      orgId: project.organizationId,
      projectId,
      studyId: typeof body.studyId === "string" ? body.studyId : null,
    });
    return NextResponse.json({
      ok: true,
      text: built.text,
      context: built.context,
      sourcesFingerprint: built.sourcesFingerprint,
      studyId: built.studyId,
    });
  } catch (e) {
    const err = e as {
      message?: string;
      code?: string;
      status?: number;
      planId?: string;
    };
    return NextResponse.json(
      {
        ok: false,
        error: err.message ?? "Contexte indisponible",
        code: err.code ?? "CONTEXT_ERROR",
        planId: err.planId,
      },
      { status: err.status ?? 500 },
    );
  }
}
