import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MesDemandesList } from "@/components/tasks/MesDemandesList";
import { TasksOperationalList } from "@/components/tasks/TasksOperationalList";
import { PageHeader } from "@/components/ui/PageHeader";
import { taskWhereForClientUser } from "@/lib/organization/access";
import { assertDashboardHrefAllowed } from "@/lib/equipe-acces/assert-dashboard-access";
import { loadTasksListView } from "@/lib/tasks/list-view";
import { excludeLegacyPurchaseOrderTasksWhere } from "@/lib/tasks/legacy-purchase-order";
import { ManagerMissionsBoard, type ManagerBoardTask } from "@/components/tasks/ManagerMissionsBoard";
import { CreateMissionForm } from "@/components/tasks/CreateMissionForm";

export const dynamic = "force-dynamic";

function isOperationalInternalUser(user: {
  personType?: string | null;
  permissionProfile?: string | null;
}): boolean {
  if (user.personType === "CLIENT_EXT") return false;
  if (user.personType === "SUPPLIER") return false;
  if (user.permissionProfile === "CLIENT" || user.permissionProfile === "FOURNISSEUR") {
    return false;
  }
  if (user.personType === "INTERNAL" || user.personType == null) return true;
  if (user.personType === "SUBCONTRACTOR") return true;
  return (
    user.permissionProfile === "DIRECTION" ||
    user.permissionProfile === "ADMINISTRATIF" ||
    user.permissionProfile === "CONDUCTEUR" ||
    user.permissionProfile === "CHEF_CHANTIER"
  );
}

export default async function TachesPage({
  searchParams,
}: {
  searchParams: Promise<{
    statut?: string;
    nouvelle?: string;
    clientId?: string;
    projectId?: string;
    creerMission?: string;
    scope?: string;
  }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard/taches");
  }

  assertDashboardHrefAllowed({
    href: "/dashboard/taches",
    personType: session.user.personType,
    permissionProfile: session.user.permissionProfile,
  });

  const params = await searchParams;
  const isManager = session.user.role === "MANAGER";
  const isClientExt =
    session.user.personType === "CLIENT_EXT" || session.user.permissionProfile === "CLIENT";
  const operational = isOperationalInternalUser(session.user);

  // —— Vue interne opérationnelle (Denis / Karim / Julie…) ——
  if (operational && !isManager) {
    const preferMine =
      session.user.permissionProfile === "CONDUCTEUR" ||
      session.user.permissionProfile === "CHEF_CHANTIER" ||
      session.user.personType === "SUBCONTRACTOR";
    const scopeParam = params.scope === "mine" || params.scope === "team" ? params.scope : null;
    const initialScope = scopeParam ?? (preferMine ? "mine" : "team");

    const { rows, summary, projects, assignees, canViewTeam } = await loadTasksListView({
      userId: session.user.id,
      personType: session.user.personType,
      permissionProfile: session.user.permissionProfile,
      isDemo: session.user.isDemo,
      demoRootUserId: session.user.demoRootUserId,
      role: session.user.role,
      // Charge complète si vue équipe possible — filtre « Mes tâches » côté UI
      mineOnly: false,
    });

    return (
      <TasksOperationalList
        rows={rows}
        summary={summary}
        projects={projects}
        assignees={assignees}
        canViewTeam={canViewTeam}
        currentUserId={session.user.id}
        initialScope={initialScope}
        canCreate={true}
      />
    );
  }

  // —— Client externe : demandes (pas le pilotage tâches interne) ——
  if (isClientExt) {
    const statusFilter = params.statut;
    const allTaskStatuses = [
      "NOUVEAU",
      "EN_ATTENTE",
      "ASSIGNEE",
      "EN_ANALYSE",
      "EN_COURS",
      "EN_ATTENTE_INFO",
      "A_VALIDER",
      "COMPLETE",
    ] as const;
    const statusInProgress: (typeof allTaskStatuses)[number][] = [
      "ASSIGNEE",
      "EN_ANALYSE",
      "EN_COURS",
      "EN_ATTENTE_INFO",
      "A_VALIDER",
    ];
    const validStatus =
      statusFilter && allTaskStatuses.includes(statusFilter as (typeof allTaskStatuses)[number])
        ? (statusFilter as (typeof allTaskStatuses)[number])
        : undefined;
    const statusWhere = validStatus
      ? validStatus === "EN_COURS"
        ? { status: { in: statusInProgress } }
        : { status: validStatus }
      : {};

    const taskWhere = await taskWhereForClientUser(session.user.id);
    const tasks = await prisma.task.findMany({
      where: {
        AND: [taskWhere, statusWhere, excludeLegacyPurchaseOrderTasksWhere],
      },
      include: {
        project: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    const clientTasksForList = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority ?? null,
      missionType: t.missionType ?? null,
      desiredDate: t.desiredDate ?? null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      actionsUsed: t.actionsUsed,
      estimatedActions: t.estimatedActions ?? null,
      correctionNote: t.correctionNote ?? null,
      project: t.project ?? null,
      assignedTo: t.assignedTo ? { id: t.assignedTo.id, name: t.assignedTo.name } : null,
    }));

    return (
      <div className="mx-auto w-full max-w-[1400px] space-y-4 px-1 sm:px-2 xl:max-w-[1520px]">
        <PageHeader
          title="Mes demandes"
          description="Suivi des demandes transmises à l’équipe BeWork."
          actions={
            <Link href="/dashboard/nouvelle-demande" className="btn-cc-primary">
              + Nouvelle demande
            </Link>
          }
        />
        <MesDemandesList tasks={clientTasksForList} />
      </div>
    );
  }

  // —— Manager BeWork (agence) : board legacy conservé, libellés tâches ——
  if (isManager) {
    const boardSelect = {
      id: true,
      title: true,
      status: true,
      priority: true,
      missionType: true,
      desiredDate: true,
      estimatedActions: true,
      createdAt: true,
      updatedAt: true,
      client: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
      project: { select: { id: true, title: true } },
    } as const;

    const toBoard = (t: {
      id: string;
      title: string;
      status: string;
      priority: string | null;
      missionType: string | null;
      desiredDate: Date | null;
      estimatedActions: number | null;
      createdAt: Date;
      updatedAt: Date;
      client: { id: string; name: string };
      assignedTo: { id: string; name: string } | null;
      project: { id: string; title: string } | null;
    }): ManagerBoardTask => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      missionType: t.missionType,
      desiredDate: t.desiredDate,
      estimatedActions: t.estimatedActions,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      client: t.client,
      assignedTo: t.assignedTo,
      project: t.project,
    });

    const [nouvelles, aAssigner, enCours, aValider, terminees, clientsRes, agentsRes, projectsRes] =
      await Promise.all([
        prisma.task.findMany({
          where: { AND: [{ status: "NOUVEAU" }, excludeLegacyPurchaseOrderTasksWhere] },
          select: boardSelect,
          orderBy: { createdAt: "desc" },
        }),
        prisma.task.findMany({
          where: {
            AND: [
              { status: "EN_ATTENTE", assignedToId: null },
              excludeLegacyPurchaseOrderTasksWhere,
            ],
          },
          select: boardSelect,
          orderBy: { createdAt: "desc" },
        }),
        prisma.task.findMany({
          where: {
            AND: [
              { status: { in: ["ASSIGNEE", "EN_ANALYSE", "EN_COURS", "EN_ATTENTE_INFO"] } },
              excludeLegacyPurchaseOrderTasksWhere,
            ],
          },
          select: boardSelect,
          orderBy: { updatedAt: "desc" },
        }),
        prisma.task.findMany({
          where: { AND: [{ status: "A_VALIDER" }, excludeLegacyPurchaseOrderTasksWhere] },
          select: boardSelect,
          orderBy: { updatedAt: "desc" },
        }),
        prisma.task.findMany({
          where: { AND: [{ status: "COMPLETE" }, excludeLegacyPurchaseOrderTasksWhere] },
          select: boardSelect,
          orderBy: { completedAt: "desc" },
        }),
        prisma.user.findMany({
          where: { role: "CLIENT" },
          select: { id: true, name: true, company: true },
          orderBy: { name: "asc" },
        }),
        prisma.user.findMany({
          where: { role: { in: ["AGENT", "AGENCE"] } },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
        prisma.project.findMany({
          select: { id: true, title: true, clientId: true },
          orderBy: { title: "asc" },
        }),
      ]);

    return (
      <div className="mx-auto w-full max-w-[1400px] space-y-4 px-1 sm:px-2 xl:max-w-[1520px]">
        <PageHeader
          title="Tâches"
          description="Créez, assignez et suivez le travail de l’équipe."
          actions={
            <CreateMissionForm
              clients={clientsRes}
              agents={agentsRes}
              defaultClientId={params.clientId ?? ""}
              defaultProjectId={params.projectId ?? ""}
              defaultOpen={params.creerMission === "1"}
            />
          }
        />
        <ManagerMissionsBoard
          nouvelles={nouvelles.map(toBoard)}
          aAssigner={aAssigner.map(toBoard)}
          enCours={enCours.map(toBoard)}
          aValider={aValider.map(toBoard)}
          terminees={terminees.map(toBoard)}
          sessionUserId={session.user.id}
          projects={projectsRes}
        />
      </div>
    );
  }

  // Fallback agent legacy
  redirect("/dashboard");
}
