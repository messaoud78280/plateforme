import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
import {
  ensurePlanningSuivi,
  listPlanningSuiviTasks,
  resolveGlobalPlanForProject,
  updatePlanningSuiviTask,
  EXECUTION_STATUSES,
  type ExecutionStatus,
} from "@/lib/chantier/planning-suivi";

type Ctx = { params: Promise<{ id: string }> };

async function resolve(projectId: string, user: { id: string; role: string }) {
  const access = await canAccessChantierProject(user, projectId);
  if (!access.ok) return null;
  return prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, organizationId: true },
  });
}

/** GET — tâches de suivi (= tâches du planning global). */
export async function GET(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { id: projectId } = await ctx.params;
  const project = await resolve(projectId, session.user);
  if (!project?.organizationId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const planIdParam = new URL(req.url).searchParams.get("planId")?.trim();
  const plan = planIdParam
    ? await prisma.prepSchedulePlan.findFirst({
        where: {
          id: planIdParam,
          organizationId: project.organizationId,
          projectId,
        },
        select: { id: true, studyId: true, title: true },
      })
    : await resolveGlobalPlanForProject(project.organizationId, projectId);

  if (!plan) {
    return NextResponse.json(
      { error: "Aucun planning global — générez-le d’abord." },
      { status: 404 },
    );
  }

  const tasks = await listPlanningSuiviTasks(project.organizationId, plan.id);
  const sheet = await prisma.followUpSheet.findFirst({
    where: {
      projectId,
      prepSchedulePlanId: plan.id,
      status: { not: "ARCHIVE" },
    },
    select: { id: true, title: true, status: true },
  });

  return NextResponse.json({
    plan: { id: plan.id, studyId: plan.studyId, title: plan.title },
    sheet,
    tasks,
  });
}

/** POST — crée / ouvre le suivi lié au planning (sans dupliquer les tâches). */
export async function POST(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { id: projectId } = await ctx.params;
  const project = await resolve(projectId, session.user);
  if (!project?.organizationId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as { planId?: string } | null;

  try {
    const result = await ensurePlanningSuivi({
      orgId: project.organizationId,
      projectId,
      userId: session.user.id,
      planId: body?.planId?.trim() || null,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Création impossible" },
      { status: 400 },
    );
  }
}

/** PATCH — met à jour l’exécution d’une tâche planning (source unique). */
export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { id: projectId } = await ctx.params;
  const project = await resolve(projectId, session.user);
  if (!project?.organizationId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as {
    taskId?: string;
    executionStatus?: string;
    progressPercent?: number;
    actualStartDate?: string | null;
    actualEndDate?: string | null;
    executionNotes?: string | null;
    blockingReason?: string | null;
    photos?: Array<{
      url?: string;
      caption?: string;
      at?: string;
      siteVisitMediaId?: string;
      chantierFileId?: string;
      photoCode?: string;
      origin?: string;
    }>;
    reserves?: Array<{ label?: string; status?: string; at?: string }>;
  } | null;

  if (!body?.taskId?.trim()) {
    return NextResponse.json({ error: "taskId requis" }, { status: 400 });
  }
  if (
    body.executionStatus &&
    !EXECUTION_STATUSES.includes(body.executionStatus as ExecutionStatus)
  ) {
    return NextResponse.json({ error: "Statut d’exécution invalide" }, { status: 400 });
  }

  try {
    const task = await updatePlanningSuiviTask({
      orgId: project.organizationId,
      projectId,
      taskId: body.taskId.trim(),
      executionStatus: body.executionStatus as ExecutionStatus | undefined,
      progressPercent: body.progressPercent,
      actualStartDate: body.actualStartDate,
      actualEndDate: body.actualEndDate,
      executionNotes: body.executionNotes,
      blockingReason: body.blockingReason,
      photos: body.photos,
      reserves: body.reserves,
    });
    return NextResponse.json({ ok: true, task });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Mise à jour impossible" },
      { status: 400 },
    );
  }
}
