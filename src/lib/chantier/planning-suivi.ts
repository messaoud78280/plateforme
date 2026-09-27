/**
 * Suivi chantier = mêmes tâches que le PrepSchedulePlan global.
 * Pas de deuxième jeu de tâches : on enrichit PrepScheduleTask.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureOrganizationForOwner } from "@/lib/organization/access";
import { ensureDefaultWorkflow } from "@/lib/workflow/service";
import { colorKeyForStatus } from "@/lib/follow-up/types";

export const EXECUTION_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "DONE",
  "BLOCKED",
] as const;
export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];

export type SuiviTaskRow = {
  id: string;
  stepCode: string;
  title: string;
  phase: string | null;
  executionStatus: ExecutionStatus;
  progressPercent: number;
  plannedStart: string | null;
  plannedEnd: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  executionNotes: string | null;
  blockingReason: string | null;
  photos: Array<{ url?: string; caption?: string; at?: string }>;
  reserves: Array<{ label?: string; status?: string; at?: string }>;
};

function asIso(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

function parseJsonArr(raw: unknown): Array<Record<string, string>> {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x) => x && typeof x === "object") as Array<Record<string, string>>;
}

export async function resolveGlobalPlanForProject(orgId: string, projectId: string) {
  return prisma.prepSchedulePlan.findFirst({
    where: {
      organizationId: orgId,
      projectId,
      scopeId: null,
      status: { not: "ARCHIVED" },
    },
    orderBy: [{ status: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      studyId: true,
      title: true,
      status: true,
      _count: { select: { tasks: true } },
    },
  });
}

export async function listPlanningSuiviTasks(
  orgId: string,
  planId: string,
): Promise<SuiviTaskRow[]> {
  const tasks = await prisma.prepScheduleTask.findMany({
    where: { organizationId: orgId, planId },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      stepCode: true,
      name: true,
      lot: true,
      executionStatus: true,
      progressPercent: true,
      startDate: true,
      endDate: true,
      actualStartDate: true,
      actualEndDate: true,
      executionNotes: true,
      blockingReason: true,
      executionPhotosJson: true,
      executionReservesJson: true,
    },
  });

  return tasks.map((t) => ({
    id: t.id,
    stepCode: t.stepCode,
    title: t.name,
    phase: t.lot,
    executionStatus: (EXECUTION_STATUSES.includes(t.executionStatus as ExecutionStatus)
      ? t.executionStatus
      : "NOT_STARTED") as ExecutionStatus,
    progressPercent: t.progressPercent ?? 0,
    plannedStart: asIso(t.startDate),
    plannedEnd: asIso(t.endDate),
    actualStartDate: asIso(t.actualStartDate),
    actualEndDate: asIso(t.actualEndDate),
    executionNotes: t.executionNotes,
    blockingReason: t.blockingReason,
    photos: parseJsonArr(t.executionPhotosJson),
    reserves: parseJsonArr(t.executionReservesJson),
  }));
}

/**
 * Crée / rattache une fiche de suivi au planning global.
 * Les tâches restent celles du PrepSchedulePlan.
 */
export async function ensurePlanningSuivi(input: {
  orgId: string;
  projectId: string;
  userId: string;
  planId?: string | null;
}): Promise<{
  sheetId: string;
  planId: string;
  studyId: string;
  taskCount: number;
  created: boolean;
  href: string;
}> {
  const plan = input.planId
    ? await prisma.prepSchedulePlan.findFirst({
        where: {
          id: input.planId,
          organizationId: input.orgId,
          projectId: input.projectId,
        },
        select: { id: true, studyId: true, title: true, _count: { select: { tasks: true } } },
      })
    : await resolveGlobalPlanForProject(input.orgId, input.projectId);

  if (!plan) {
    throw new Error("Aucun planning global sur ce chantier — générez-le d’abord.");
  }

  const existing = await prisma.followUpSheet.findFirst({
    where: {
      projectId: input.projectId,
      prepSchedulePlanId: plan.id,
      status: { not: "ARCHIVE" },
    },
    select: { id: true },
  });
  if (existing) {
    return {
      sheetId: existing.id,
      planId: plan.id,
      studyId: plan.studyId,
      taskCount: plan._count.tasks,
      created: false,
      href: `/dashboard/projets/${input.projectId}/suivi-planning?planId=${plan.id}`,
    };
  }

  const project = await prisma.project.findFirst({
    where: { id: input.projectId, organizationId: input.orgId },
    select: {
      title: true,
      siteAddress: true,
      siteCity: true,
      assignedToId: true,
      client: { select: { name: true, company: true } },
    },
  });
  if (!project) throw new Error("Chantier introuvable");

  const orgId = (await ensureOrganizationForOwner(input.userId)) ?? input.orgId;
  let firstStatus = "EN_COURS" as const;
  try {
    const workflow = await ensureDefaultWorkflow(orgId);
    const step = workflow.steps
      .filter((s) => s.statusKey !== "ARCHIVE")
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .find((s) => s.statusKey === "EN_COURS" || s.statusKey === "INTERVENTION_PREVUE");
    if (step) firstStatus = step.statusKey as typeof firstStatus;
  } catch {
    /* workflow optionnel */
  }

  const sheet = await prisma.followUpSheet.create({
    data: {
      organizationId: orgId,
      ownerUserId: input.userId,
      createdById: input.userId,
      assigneeId: project.assignedToId ?? input.userId,
      projectId: input.projectId,
      prepSchedulePlanId: plan.id,
      title: `Suivi — ${project.title}`.slice(0, 180),
      clientName:
        (project.client.company || project.client.name || "").trim() || project.title,
      siteAddress: [project.siteAddress, project.siteCity].filter(Boolean).join(", ") || null,
      workObject: plan.title,
      status: firstStatus,
      colorKey: colorKeyForStatus(firstStatus as never),
      nextAction: "Mettre à jour l’avancement des tâches du planning",
      notes: `Suivi lié au planning global ${plan.id} — ${plan._count.tasks} tâche(s).`,
    },
    select: { id: true },
  });

  // Les tâches du planning sont déjà la source de vérité du suivi.
  return {
    sheetId: sheet.id,
    planId: plan.id,
    studyId: plan.studyId,
    taskCount: plan._count.tasks,
    created: true,
    href: `/dashboard/projets/${input.projectId}/suivi-planning?planId=${plan.id}`,
  };
}

export async function updatePlanningSuiviTask(input: {
  orgId: string;
  projectId: string;
  taskId: string;
  executionStatus?: ExecutionStatus;
  progressPercent?: number;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  executionNotes?: string | null;
  blockingReason?: string | null;
  photos?: Array<{ url?: string; caption?: string; at?: string }>;
  reserves?: Array<{ label?: string; status?: string; at?: string }>;
}): Promise<SuiviTaskRow> {
  const task = await prisma.prepScheduleTask.findFirst({
    where: { id: input.taskId, organizationId: input.orgId },
    include: { plan: { select: { projectId: true } } },
  });
  if (!task || task.plan.projectId !== input.projectId) {
    throw new Error("Tâche introuvable sur ce chantier");
  }

  let status = input.executionStatus ?? (task.executionStatus as ExecutionStatus);
  if (!EXECUTION_STATUSES.includes(status)) status = "NOT_STARTED";

  let progress = input.progressPercent ?? task.progressPercent ?? 0;
  progress = Math.max(0, Math.min(100, Math.round(progress)));
  if (status === "DONE") progress = 100;
  if (status === "NOT_STARTED" && input.progressPercent == null) progress = 0;

  const updated = await prisma.prepScheduleTask.update({
    where: { id: task.id },
    data: {
      executionStatus: status,
      progressPercent: progress,
      ...(input.actualStartDate !== undefined
        ? {
            actualStartDate: input.actualStartDate
              ? new Date(input.actualStartDate)
              : null,
          }
        : {}),
      ...(input.actualEndDate !== undefined
        ? {
            actualEndDate: input.actualEndDate ? new Date(input.actualEndDate) : null,
          }
        : {}),
      ...(input.executionNotes !== undefined
        ? { executionNotes: input.executionNotes }
        : {}),
      ...(input.blockingReason !== undefined
        ? { blockingReason: input.blockingReason }
        : {}),
      ...(input.photos !== undefined
        ? { executionPhotosJson: input.photos as Prisma.InputJsonValue }
        : {}),
      ...(input.reserves !== undefined
        ? { executionReservesJson: input.reserves as Prisma.InputJsonValue }
        : {}),
    },
  });

  const rows = await listPlanningSuiviTasks(input.orgId, updated.planId);
  const row = rows.find((r) => r.id === updated.id);
  if (!row) throw new Error("Tâche mise à jour introuvable");
  return row;
}
