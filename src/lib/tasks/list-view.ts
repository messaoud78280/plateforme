/**
 * TACHES-V2A — Projection liste tâches opérationnelles (interne).
 * Pas de N+1 documents/messages — détail au clic.
 */
import type { TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { displayUserRoleLabel } from "@/lib/equipe-acces/display-role";
import { coerceTaskPriority, priorityRank, type TaskPriority } from "@/lib/tasks/priority";
import { excludeLegacyPurchaseOrderTasksWhere } from "@/lib/tasks/legacy-purchase-order";
import { resolvePurchaseOrderOrgId } from "@/lib/purchase-orders/access";
import { taskWhereForClientUser } from "@/lib/organization/access";

export type TaskListStatusBucket = "a_faire" | "en_cours" | "a_valider" | "terminee";

export type TaskListRow = {
  id: string;
  title: string;
  status: TaskStatus;
  statusLabel: string;
  statusBucket: TaskListStatusBucket;
  priority: TaskPriority;
  priorityLabel: string;
  projectId: string | null;
  projectTitle: string | null;
  projectTitleShort: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeRoleLabel: string | null;
  desiredDate: string | null;
  dueLabel: string;
  overdueDays: number | null;
  isOverdue: boolean;
  sourceLabel: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskListSummary = {
  /** Tâches ouvertes (hors terminées) — total distinct des dimensions. */
  totalOpen: number;
  aFaire: number;
  enCours: number;
  enRetard: number;
  aValider: number;
};

export type TaskListAssigneeOption = { id: string; name: string; roleLabel: string };
export type TaskListProjectOption = { id: string; title: string };

const STATUS_LABELS: Record<string, string> = {
  NOUVEAU: "À faire",
  EN_ATTENTE: "À faire",
  ASSIGNEE: "À faire",
  EN_ANALYSE: "En cours",
  EN_COURS: "En cours",
  EN_ATTENTE_INFO: "À faire",
  A_VALIDER: "À valider",
  COMPLETE: "Terminée",
};

function statusBucket(status: TaskStatus): TaskListStatusBucket {
  if (status === "COMPLETE") return "terminee";
  if (status === "A_VALIDER") return "a_valider";
  if (["EN_ANALYSE", "EN_COURS"].includes(status)) return "en_cours";
  return "a_faire";
}

function shortProjectTitle(title: string | null): string | null {
  if (!title) return null;
  return title.replace(/^Résidence\s+/i, "").trim() || title;
}

function dueInfo(
  desiredDate: Date | null,
  status: TaskStatus,
): { label: string; overdueDays: number | null; isOverdue: boolean } {
  if (!desiredDate) return { label: "Sans échéance", overdueDays: null, isOverdue: false };
  if (status === "COMPLETE") {
    return {
      label: desiredDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      overdueDays: null,
      isOverdue: false,
    };
  }
  const end = new Date(desiredDate);
  end.setHours(23, 59, 59, 999);
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const startTomorrow = new Date(startToday);
  startTomorrow.setDate(startTomorrow.getDate() + 1);
  const startDayAfter = new Date(startTomorrow);
  startDayAfter.setDate(startDayAfter.getDate() + 1);

  if (end.getTime() < startToday.getTime()) {
    const days = Math.max(
      1,
      Math.ceil((startToday.getTime() - end.getTime()) / (24 * 60 * 60 * 1000)),
    );
    return {
      label: `En retard de ${days} jour${days > 1 ? "s" : ""}`,
      overdueDays: days,
      isOverdue: true,
    };
  }
  if (desiredDate >= startToday && desiredDate < startTomorrow) {
    return { label: "Aujourd'hui", overdueDays: null, isOverdue: false };
  }
  if (desiredDate >= startTomorrow && desiredDate < startDayAfter) {
    return { label: "Demain", overdueDays: null, isOverdue: false };
  }
  return {
    label: desiredDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
    overdueDays: null,
    isOverdue: false,
  };
}

function sourceLabel(kind: string | null): string | null {
  if (!kind) return null;
  if (kind === "TASK" || kind === "DIRECT" || kind === "PROJECT") return "Messagerie";
  return null;
}

function defaultSort(a: TaskListRow, b: TaskListRow): number {
  if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
  const pr = priorityRank(a.priority) - priorityRank(b.priority);
  if (pr !== 0) return pr;
  const da = a.desiredDate ? new Date(a.desiredDate).getTime() : Number.POSITIVE_INFINITY;
  const db = b.desiredDate ? new Date(b.desiredDate).getTime() : Number.POSITIVE_INFINITY;
  if (da !== db) return da - db;
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

export type LoadTasksListViewOpts = {
  userId: string;
  personType?: string | null;
  permissionProfile?: string | null;
  isDemo?: boolean;
  demoRootUserId?: string | null;
  role?: string | null;
  /** true = uniquement mes tâches assignées */
  mineOnly?: boolean;
};

export async function loadTasksListView(opts: LoadTasksListViewOpts): Promise<{
  rows: TaskListRow[];
  summary: TaskListSummary;
  projects: TaskListProjectOption[];
  assignees: TaskListAssigneeOption[];
  canViewTeam: boolean;
}> {
  const canViewTeam =
    opts.personType === "INTERNAL" ||
    opts.personType == null ||
    opts.permissionProfile === "DIRECTION" ||
    opts.permissionProfile === "ADMINISTRATIF" ||
    opts.permissionProfile === "CONDUCTEUR" ||
    opts.permissionProfile === "CHEF_CHANTIER";

  const orgId = await resolvePurchaseOrderOrgId({
    id: opts.userId,
    role: opts.role,
    personType: opts.personType,
    permissionProfile: opts.permissionProfile,
    isDemo: opts.isDemo,
    demoRootUserId: opts.demoRootUserId,
  });

  const baseWhere = orgId
    ? { organizationId: orgId }
    : await taskWhereForClientUser(opts.userId);

  /** Si pas de vue équipe : uniquement mes assignations. Sinon charge complète (filtre UI). */
  const forceMine = !canViewTeam || opts.mineOnly === true;
  const where = {
    AND: [
      baseWhere,
      excludeLegacyPurchaseOrderTasksWhere,
      forceMine ? { assignedToId: opts.userId } : {},
    ],
  };

  const tasks = await prisma.task.findMany({
    where,
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      desiredDate: true,
      sourceMessageKind: true,
      createdAt: true,
      updatedAt: true,
      project: { select: { id: true, title: true } },
      assignedTo: {
        select: {
          id: true,
          name: true,
          role: true,
          personType: true,
          permissionProfile: true,
          jobTitle: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  const rows: TaskListRow[] = tasks.map((t) => {
    const prio = coerceTaskPriority(t.priority);
    const due = dueInfo(t.desiredDate, t.status);
    const roleLabel = t.assignedTo
      ? displayUserRoleLabel({
          role: t.assignedTo.role,
          personType: t.assignedTo.personType,
          permissionProfile: t.assignedTo.permissionProfile,
          jobTitle: t.assignedTo.jobTitle,
        })
      : null;
    return {
      id: t.id,
      title: t.title,
      status: t.status,
      statusLabel: STATUS_LABELS[t.status] ?? t.status,
      statusBucket: statusBucket(t.status),
      priority: prio,
      priorityLabel:
        prio === "URGENT"
          ? "Priorité haute"
          : prio === "PRIORITAIRE"
            ? "Prioritaire"
            : "Normale",
      projectId: t.project?.id ?? null,
      projectTitle: t.project?.title ?? null,
      projectTitleShort: shortProjectTitle(t.project?.title ?? null),
      assigneeId: t.assignedTo?.id ?? null,
      assigneeName: t.assignedTo?.name ?? null,
      assigneeRoleLabel: roleLabel,
      desiredDate: t.desiredDate?.toISOString() ?? null,
      dueLabel: due.label,
      overdueDays: due.overdueDays,
      isOverdue: due.isOverdue,
      sourceLabel: sourceLabel(t.sourceMessageKind),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  });

  rows.sort(defaultSort);

  const open = rows.filter((r) => r.statusBucket !== "terminee");
  const summary: TaskListSummary = {
    totalOpen: open.length,
    aFaire: open.filter((r) => r.statusBucket === "a_faire").length,
    enCours: open.filter((r) => r.statusBucket === "en_cours").length,
    enRetard: open.filter((r) => r.isOverdue).length,
    aValider: open.filter((r) => r.statusBucket === "a_valider").length,
  };

  const projectMap = new Map<string, string>();
  const assigneeMap = new Map<string, TaskListAssigneeOption>();
  for (const r of rows) {
    if (r.projectId && r.projectTitle) projectMap.set(r.projectId, r.projectTitle);
    if (r.assigneeId && r.assigneeName) {
      assigneeMap.set(r.assigneeId, {
        id: r.assigneeId,
        name: r.assigneeName,
        roleLabel: r.assigneeRoleLabel ?? "",
      });
    }
  }

  // Chantiers / responsables pour création — org membres internes
  let projects: TaskListProjectOption[] = [...projectMap.entries()].map(([id, title]) => ({
    id,
    title,
  }));
  let assignees: TaskListAssigneeOption[] = [...assigneeMap.values()];

  if (orgId) {
    const [moreProjects, members] = await Promise.all([
      prisma.project.findMany({
        where: { organizationId: orgId },
        select: { id: true, title: true },
        orderBy: { title: "asc" },
        take: 80,
      }),
      prisma.organizationMember.findMany({
        where: {
          organizationId: orgId,
          user: { personType: "INTERNAL" },
        },
        select: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
              personType: true,
              permissionProfile: true,
              jobTitle: true,
            },
          },
        },
        take: 40,
      }),
    ]);
    projects = moreProjects.map((p) => ({ id: p.id, title: p.title }));
    const fromMembers = members
      .map((m) => m.user)
      .filter(Boolean)
      .map((u) => ({
        id: u.id,
        name: u.name,
        roleLabel: displayUserRoleLabel({
          role: u.role,
          personType: u.personType,
          permissionProfile: u.permissionProfile,
          jobTitle: u.jobTitle,
        }),
      }));
    if (fromMembers.length > 0) assignees = fromMembers;
  }

  return { rows, summary, projects, assignees, canViewTeam };
}
