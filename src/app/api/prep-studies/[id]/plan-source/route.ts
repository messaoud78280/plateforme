import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  attachPrepStudyPlanSource,
  listProjectPlanCandidateFiles,
} from "@/lib/preparation/plan-source";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { id: studyId } = await ctx.params;

  const study = await prisma.prepStudy.findFirst({
    where: { id: studyId, archivedAt: null },
    select: { id: true, organizationId: true, projectId: true },
  });
  if (!study) return NextResponse.json({ error: "Étude introuvable" }, { status: 404 });

  const candidates = await listProjectPlanCandidateFiles({
    projectId: study.projectId,
  });
  return NextResponse.json({ candidates });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { id: studyId } = await ctx.params;
  const body = (await req.json().catch(() => null)) as {
    chantierFileId?: string;
    sourceId?: string;
  } | null;

  const chantierFileId = body?.chantierFileId?.trim();
  if (!chantierFileId) {
    return NextResponse.json({ error: "chantierFileId requis" }, { status: 400 });
  }

  const study = await prisma.prepStudy.findFirst({
    where: { id: studyId, archivedAt: null },
    select: { id: true, organizationId: true },
  });
  if (!study) return NextResponse.json({ error: "Étude introuvable" }, { status: 404 });

  const result = await attachPrepStudyPlanSource({
    orgId: study.organizationId,
    studyId: study.id,
    chantierFileId,
    sourceId: body?.sourceId ?? null,
    actorUserId: session.user.id,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, source: result.source });
}
