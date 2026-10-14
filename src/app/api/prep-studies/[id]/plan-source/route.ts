import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePrepApiContext } from "@/lib/preparation/access";
import {
  attachPrepStudyPlanSource,
  detachPrepStudyPlanSource,
  listProjectPlanCandidateFiles,
} from "@/lib/preparation/plan-source";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const guard = await requirePrepApiContext();
  if (!guard.ok) return guard.response;
  const { id: studyId } = await ctx.params;

  const study = await prisma.prepStudy.findFirst({
    where: {
      id: studyId,
      organizationId: guard.ctx.orgId,
      archivedAt: null,
    },
    select: { id: true, organizationId: true, projectId: true },
  });
  if (!study) return NextResponse.json({ error: "Étude introuvable" }, { status: 404 });

  const candidates = await listProjectPlanCandidateFiles({
    projectId: study.projectId,
  });
  return NextResponse.json({ candidates });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const guard = await requirePrepApiContext();
  if (!guard.ok) return guard.response;
  const { id: studyId } = await ctx.params;
  const body = (await req.json().catch(() => null)) as {
    chantierFileId?: string;
    sourceId?: string;
    planNumber?: string;
    revision?: string;
    title?: string;
  } | null;

  const chantierFileId = body?.chantierFileId?.trim();
  if (!chantierFileId) {
    return NextResponse.json({ error: "chantierFileId requis" }, { status: 400 });
  }

  const study = await prisma.prepStudy.findFirst({
    where: {
      id: studyId,
      organizationId: guard.ctx.orgId,
      archivedAt: null,
    },
    select: { id: true, organizationId: true },
  });
  if (!study) return NextResponse.json({ error: "Étude introuvable" }, { status: 404 });

  const result = await attachPrepStudyPlanSource({
    orgId: study.organizationId,
    studyId: study.id,
    chantierFileId,
    sourceId: body?.sourceId ?? null,
    actorUserId: guard.ctx.userId,
    planNumber: body?.planNumber ?? null,
    revision: body?.revision ?? null,
    title: body?.title ?? null,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, source: result.source });
}

/** Détache un document source du métré (conserve le fichier GED). */
export async function DELETE(req: Request, ctx: Ctx) {
  const guard = await requirePrepApiContext();
  if (!guard.ok) return guard.response;
  const { id: studyId } = await ctx.params;
  const body = (await req.json().catch(() => null)) as {
    sourceId?: string;
  } | null;
  const sourceId = body?.sourceId?.trim();
  if (!sourceId) {
    return NextResponse.json({ error: "sourceId requis" }, { status: 400 });
  }

  const study = await prisma.prepStudy.findFirst({
    where: {
      id: studyId,
      organizationId: guard.ctx.orgId,
      archivedAt: null,
    },
    select: { id: true, organizationId: true },
  });
  if (!study) return NextResponse.json({ error: "Étude introuvable" }, { status: 404 });

  const result = await detachPrepStudyPlanSource({
    orgId: study.organizationId,
    studyId: study.id,
    sourceId,
    actorUserId: guard.ctx.userId,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
