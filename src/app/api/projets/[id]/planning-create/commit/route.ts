/**
 * Commit CREATE planning — atomique via commitPlanningCreateFromBundle.
 * Pas de cascade automatique. Multi-tenant + PREVIEW_STALE.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
import { prisma } from "@/lib/prisma";
import { commitPlanningCreateFromBundle } from "@/lib/bework-context/adapt-planning-create";
import { PrepError } from "@/lib/preparation/service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { id: projectId } = await ctx.params;
  const access = await canAccessChantierProject(session.user, projectId);
  if (!access.ok) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  if (session.user.role === "CLIENT") {
    return NextResponse.json({ error: "Modification non autorisée" }, { status: 403 });
  }
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true },
  });
  if (!project?.organizationId) {
    return NextResponse.json({ error: "Chantier introuvable" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    raw?: string;
    sourcesFingerprint?: string;
    studyId?: string;
    allowDuplicate?: boolean;
  };
  const raw = typeof body.raw === "string" ? body.raw : "";
  const expectedFp =
    typeof body.sourcesFingerprint === "string" ? body.sourcesFingerprint.trim() : "";
  if (!raw.trim()) {
    return NextResponse.json({ error: "JSON manquant" }, { status: 422 });
  }
  if (!expectedFp) {
    return NextResponse.json(
      { error: "Empreinte sources manquante — relancez la prévisualisation." },
      { status: 422 },
    );
  }

  try {
    const result = await commitPlanningCreateFromBundle({
      orgId: project.organizationId,
      projectId,
      userId: session.user.id,
      raw,
      sourcesFingerprint: expectedFp,
      studyId: typeof body.studyId === "string" ? body.studyId : null,
      allowDuplicate: body.allowDuplicate === true,
    });
    return NextResponse.json({
      ...result,
      nextActions: {
        open: result.href,
        modify: "Modifier avec ChatGPT depuis le Gantt",
      },
    });
  } catch (e) {
    if (e instanceof PrepError) {
      return NextResponse.json(
        { ok: false, error: e.message, code: "PREP_ERROR" },
        { status: e.status },
      );
    }
    const err = e as {
      message?: string;
      status?: number;
      code?: string;
      sourcesFingerprint?: string;
      planId?: string;
      errors?: string[];
    };
    return NextResponse.json(
      {
        ok: false,
        error: err.message ?? "Création impossible",
        code: err.code,
        sourcesFingerprint: err.sourcesFingerprint,
        planId: err.planId,
        errors: err.errors,
      },
      { status: err.status ?? 500 },
    );
  }
}
