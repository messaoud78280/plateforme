/**
 * Contexte CREATE métré — lecture seule.
 * POST { visitId? } → { text, context, sourcesFingerprint }
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
import { prisma } from "@/lib/prisma";
import { buildTakeoffCreateContext } from "@/lib/bework-context/adapt-takeoff-create";

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
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true },
  });
  if (!project?.organizationId) {
    return NextResponse.json({ error: "Chantier introuvable" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as { visitId?: string };
  try {
    const context = await buildTakeoffCreateContext({
      orgId: project.organizationId,
      projectId,
      visitId: typeof body.visitId === "string" ? body.visitId : null,
    });
    const text = JSON.stringify(context, null, 2);
    return NextResponse.json({
      ok: true,
      text,
      context,
      sourcesFingerprint: context.sources_fingerprint,
    });
  } catch (e) {
    const err = e as { message?: string; code?: string; status?: number; studyId?: string };
    return NextResponse.json(
      {
        ok: false,
        error: err.message ?? "Contexte indisponible",
        code: err.code ?? "CONTEXT_ERROR",
        studyId: err.studyId,
      },
      { status: err.status ?? 500 },
    );
  }
}
