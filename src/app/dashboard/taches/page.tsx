import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TaskListView } from "@/components/tasks/TaskListView";
import { DepotTacheForm } from "@/components/tasks/DepotTacheForm";
import { MesDemandesList } from "@/components/tasks/MesDemandesList";
import { AgentMissionsList } from "@/components/tasks/AgentMissionsList";
import { ManagerMissionsBoard, type ManagerBoardTask } from "@/components/tasks/ManagerMissionsBoard";
import { CreateMissionForm } from "@/components/tasks/CreateMissionForm";
import { BackLink } from "@/components/ui/BackLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiTile } from "@/components/ui/KpiTile";
import { FilterBar, FilterChip } from "@/components/ui/FilterBar";
import { projectWhereForClientUser, taskWhereForClientUser } from "@/lib/organization/access";
import { assertDashboardHrefAllowed } from "@/lib/equipe-acces/assert-dashboard-access";

export default async function TachesPage({
  searchParams,
}: {
  searchParams: Promise<{
    statut?: string;
    nouvelle?: string;
    clientId?: string;
    projectId?: string;
    creerMission?: string;
  }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard");
  }

  assertDashboardHrefAllowed({
    href: "/dashboard/taches",
    personType: session.user.personType,
    permissionProfile: session.user.permissionProfile,
  });

  const isManager = session.user.role === "MANAGER";
  const isAgent = session.user.role === "AGENT" || session.user.role === "AGENCE";
  const isClient = session.user.role === "CLIENT";
  const params = await searchParams;
  const allTaskStatuses = ["NOUVEAU", "EN_ATTENTE", "ASSIGNEE", "EN_ANALYSE", "EN_COURS", "EN_ATTENTE_INFO", "A_VALIDER", "COMPLETE"] as const;
  const statusFilter = params.statut as string | undefined;
  const statusInProgress: (typeof allTaskStatuses)[number][] = ["ASSIGNEE", "EN_ANALYSE", "EN_COURS", "EN_ATTENTE_INFO", "A_VALIDER"];
  const validStatus = statusFilter && allTaskStatuses.includes(statusFilter as (typeof allTaskStatuses)[number])
    ? (statusFilter as (typeof allTaskStatuses)[number])
    : undefined;
  const statusWhere = validStatus
    ? validStatus === "EN_COURS"
      ? { status: { in: statusInProgress } }
      : { status: validStatus }
    : {};

  let tasks: Awaited<ReturnType<typeof prisma.task.findMany>> = [];
  let projects: { id: string; title: string }[] = [];
  let agentSummary = { missionsAujourdhui: 0, missionsUrgentes: 0, missionsEnCours: 0 };
  let managerClients: { id: string; name: string; company: string | null }[] = [];
  let managerProjects: { id: string; title: string; clientId: string }[] = [];
  let managerAgents: { id: string; name: string }[] = [];
  let managerBoard: {
    nouvelles: ManagerBoardTask[];
    aAssigner: ManagerBoardTask[];
    enCours: ManagerBoardTask[];
    aValider: ManagerBoardTask[];
    terminees: ManagerBoardTask[];
  } = { nouvelles: [], aAssigner: [], enCours: [], aValider: [], terminees: [] };
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
  type BoardRow = {
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
  };
  const toBoard = (t: BoardRow): ManagerBoardTask => ({
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

  try {
    if (prisma.task) {
      if (isManager) {
        const [nouvelles, aAssigner, enCours, aValider, terminees, clientsRes, agentsRes, projectsRes] = await Promise.all([
          prisma.task.findMany({
            where: { status: "NOUVEAU" },
            select: boardSelect,
            orderBy: { createdAt: "desc" },
          }),
          prisma.task.findMany({
            where: { status: "EN_ATTENTE", assignedToId: null },
            select: boardSelect,
            orderBy: { createdAt: "desc" },
          }),
          prisma.task.findMany({
            where: { status: { in: ["ASSIGNEE", "EN_ANALYSE", "EN_COURS", "EN_ATTENTE_INFO"] } },
            select: boardSelect,
            orderBy: { updatedAt: "desc" },
          }),
          prisma.task.findMany({
            where: { status: "A_VALIDER" },
            select: boardSelect,
            orderBy: { updatedAt: "desc" },
          }),
          prisma.task.findMany({
            where: { status: "COMPLETE" },
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
        managerClients = clientsRes;
        managerAgents = agentsRes;
        managerProjects = projectsRes;
        managerBoard = {
          nouvelles: (nouvelles as BoardRow[]).map(toBoard),
          aAssigner: (aAssigner as BoardRow[]).map(toBoard),
          enCours: (enCours as BoardRow[]).map(toBoard),
          aValider: (aValider as BoardRow[]).map(toBoard),
          terminees: (terminees as BoardRow[]).map(toBoard),
        };
        tasks = [...nouvelles, ...aAssigner, ...enCours, ...aValider, ...terminees] as unknown as Awaited<ReturnType<typeof prisma.task.findMany>>;
      } else {
        const taskWhere = isAgent
          ? { assignedToId: session.user.id }
          : await taskWhereForClientUser(session.user.id);
        tasks = await prisma.task.findMany({
          where: { ...taskWhere, ...statusWhere },
          include: {
            project: { select: { id: true, title: true } },
            assignedTo: { select: { id: true, name: true, email: true } },
            client: { select: { id: true, name: true } },
          },
          orderBy: { updatedAt: "desc" },
        });
      }
      if (isAgent) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const [aAuj, aUrg, aCours] = await Promise.all([
          prisma.task.count({
            where: {
              assignedToId: session.user.id,
              status: { notIn: ["COMPLETE"] },
              OR: [
                { desiredDate: { gte: today, lt: tomorrow } },
                { createdAt: { gte: today } },
              ],
            },
          }),
          prisma.task.count({
            where: {
              assignedToId: session.user.id,
              status: { notIn: ["COMPLETE"] },
              priority: "URGENT",
            },
          }),
          prisma.task.count({
            where: {
              assignedToId: session.user.id,
              status: { in: ["ASSIGNEE", "EN_ANALYSE", "EN_COURS", "EN_ATTENTE_INFO", "A_VALIDER"] },
            },
          }),
        ]);
        agentSummary = { missionsAujourdhui: aAuj, missionsUrgentes: aUrg, missionsEnCours: aCours };
      }
    }
    if (isClient && prisma.project) {
      projects = await prisma.project.findMany({
        where: await projectWhereForClientUser(session.user.id),
        select: { id: true, title: true },
        orderBy: { title: "asc" },
      });
    }
  } catch {
    // Table absente ou client Prisma non régénéré
  }

  type TaskWithRelations = (typeof tasks)[number] & {
    project?: { id: string; title: string } | null;
    assignedTo?: { id: string; name: string; email: string } | null;
    correctionNote?: string | null;
  };
  const clientTasksForList = isClient
    ? (tasks as TaskWithRelations[]).map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: (t as { priority?: string | null }).priority ?? null,
        missionType: (t as { missionType?: string | null }).missionType ?? null,
        desiredDate: (t as { desiredDate?: Date | null }).desiredDate ?? null,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        actionsUsed: t.actionsUsed,
        estimatedActions: (t as { estimatedActions?: number | string | null }).estimatedActions ?? null,
        correctionNote: t.correctionNote ?? null,
        project: t.project ?? null,
        assignedTo: t.assignedTo ? { id: t.assignedTo.id, name: t.assignedTo.name } : null,
      }))
    : [];

  if (isClient) {
    return (
      <div className="space-y-6">
        <BackLink href="/dashboard">Tableau de bord</BackLink>
        <PageHeader
          eyebrow="Espace client"
          title="Mes missions"
          description="V2 missions : priorité en 1 clic, vues Liste / Chantiers / Tableau, alertes échéance. Ouvrez Message pour écrire à l’équipe."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/dashboard/messagerie"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Messagerie
              </Link>
              <Link href="/dashboard/nouvelle-demande" className="btn-cc-primary">
                + Nouvelle mission
              </Link>
            </div>
          }
        />
        <MesDemandesList tasks={clientTasksForList} />
      </div>
    );
  }
  if (isManager) {
    const boardForFilter = (() => {
      switch (statusFilter) {
        case "NOUVEAU":
          return { ...managerBoard, aAssigner: [], enCours: [], aValider: [], terminees: [] };
        case "EN_ATTENTE":
          return { ...managerBoard, nouvelles: [], enCours: [], aValider: [], terminees: [] };
        case "EN_COURS":
          return { ...managerBoard, nouvelles: [], aAssigner: [], aValider: [], terminees: [] };
        case "A_VALIDER":
          return { ...managerBoard, nouvelles: [], aAssigner: [], enCours: [], terminees: [] };
        case "COMPLETE":
          return { ...managerBoard, nouvelles: [], aAssigner: [], enCours: [], aValider: [] };
        default:
          return managerBoard;
      }
    })();
    return (
      <div className="space-y-6">
        <BackLink href="/dashboard">Tableau de bord</BackLink>
        <PageHeader
          eyebrow="Pilotage missions"
          title="Missions"
          description="Créez, assignez les agents, suivez l'avancement et validez les livrables."
          actions={
            <CreateMissionForm
              clients={managerClients}
              agents={managerAgents}
              defaultClientId={params.clientId ?? ""}
              defaultProjectId={params.projectId ?? ""}
              defaultOpen={params.creerMission === "1"}
            />
          }
        />
        <ManagerMissionsBoard
          nouvelles={boardForFilter.nouvelles}
          aAssigner={boardForFilter.aAssigner}
          enCours={boardForFilter.enCours}
          aValider={boardForFilter.aValider}
          terminees={boardForFilter.terminees}
          sessionUserId={session.user.id}
          projects={managerProjects}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink href="/dashboard">Tableau de bord</BackLink>
      <PageHeader
        eyebrow={isAgent ? "Espace agent" : "Missions"}
        title={isAgent ? "Mes missions assignées" : "Mes tâches"}
        description="Tâches assignées. Indiquez le temps passé à la clôture pour déduire les crédits du client."
      />

      {isAgent && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <KpiTile label="Missions aujourd'hui" value={agentSummary.missionsAujourdhui} />
          <KpiTile
            label="Missions urgentes"
            value={agentSummary.missionsUrgentes}
            tone={agentSummary.missionsUrgentes > 0 ? "critical" : "ok"}
          />
          <KpiTile
            label="Missions en cours"
            value={agentSummary.missionsEnCours}
            tone={agentSummary.missionsEnCours > 0 ? "watch" : "neutral"}
          />
        </div>
      )}

      {isManager && <DepotTacheForm projects={projects} />}

      {isManager && (
        <FilterBar as="div">
          <FilterChip href="/dashboard/taches" active={!validStatus}>
            Toutes
          </FilterChip>
          <FilterChip href="/dashboard/taches?statut=EN_ATTENTE" active={validStatus === "EN_ATTENTE"}>
            En attente
          </FilterChip>
          <FilterChip href="/dashboard/taches?statut=EN_COURS" active={validStatus === "EN_COURS"}>
            En cours
          </FilterChip>
          <FilterChip href="/dashboard/taches?statut=COMPLETE" active={validStatus === "COMPLETE"}>
            Terminées
          </FilterChip>
        </FilterBar>
      )}

      <section>
        <h2 className="mb-3 font-heading text-lg font-bold text-bework-ink">
          {isAgent ? "Mes missions assignées" : "Vos tâches"}
        </h2>
        {isAgent ? (
          <AgentMissionsList
            missions={(
              tasks as unknown as {
                id: string;
                title: string;
                status: string;
                priority: string | null;
                missionType: string | null;
                desiredDate: Date | null;
                createdAt: Date;
                updatedAt: Date;
                client: { id: string; name: string };
                project: { id: string; title: string } | null;
              }[]
            ).map((t) => ({
              id: t.id,
              title: t.title,
              status: t.status,
              priority: t.priority,
              missionType: t.missionType,
              desiredDate: t.desiredDate,
              createdAt: t.createdAt,
              updatedAt: t.updatedAt,
              client: t.client,
              project: t.project ?? null,
            }))}
          />
        ) : (
          <TaskListView tasks={tasks} />
        )}
      </section>
    </div>
  );
}
