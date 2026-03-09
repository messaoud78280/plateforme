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
import { BackLink } from "@/components/ui/BackLink";

export default async function TachesPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; nouvelle?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard");
  }

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
  let managerBoard: {
    nouvelles: ManagerBoardTask[];
    aAssigner: ManagerBoardTask[];
    enCours: ManagerBoardTask[];
    aValider: ManagerBoardTask[];
    terminees: ManagerBoardTask[];
  } = { nouvelles: [], aAssigner: [], enCours: [], aValider: [], terminees: [] };
  try {
    if (prisma.task) {
      if (isManager) {
        const [nouvelles, aAssigner, enCours, aValider, terminees] = await Promise.all([
          prisma.task.findMany({
            where: { status: "NOUVEAU" },
            include: { client: { select: { id: true, name: true } }, assignedTo: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" },
          }),
          prisma.task.findMany({
            where: { status: "EN_ATTENTE", assignedToId: null },
            include: { client: { select: { id: true, name: true } }, assignedTo: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" },
          }),
          prisma.task.findMany({
            where: { status: { in: ["ASSIGNEE", "EN_ANALYSE", "EN_COURS", "EN_ATTENTE_INFO"] } },
            include: { client: { select: { id: true, name: true } }, assignedTo: { select: { id: true, name: true } } },
            orderBy: { updatedAt: "desc" },
          }),
          prisma.task.findMany({
            where: { status: "A_VALIDER" },
            include: { client: { select: { id: true, name: true } }, assignedTo: { select: { id: true, name: true } } },
            orderBy: { updatedAt: "desc" },
          }),
          prisma.task.findMany({
            where: { status: "COMPLETE" },
            include: { client: { select: { id: true, name: true } }, assignedTo: { select: { id: true, name: true } } },
            orderBy: { completedAt: "desc" },
          }),
        ]);
        const toBoard = (t: { id: string; title: string; status: string; priority: string | null; createdAt: Date; updatedAt: Date; estimatedActions: string | null; client: { id: string; name: string }; assignedTo: { id: string; name: string } | null }) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          estimatedActions: t.estimatedActions ?? null,
          client: t.client,
          assignedTo: t.assignedTo,
        });
        managerBoard = {
          nouvelles: nouvelles.map(toBoard),
          aAssigner: aAssigner.map(toBoard),
          enCours: enCours.map(toBoard),
          aValider: aValider.map(toBoard),
          terminees: terminees.map(toBoard),
        };
        tasks = [...nouvelles, ...aAssigner, ...enCours, ...aValider, ...terminees];
      } else {
        const taskWhere = isAgent ? { assignedToId: session.user.id } : { clientId: session.user.id };
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
              priority: { in: ["URGENT", "PRIORITAIRE"] },
              status: { notIn: ["COMPLETE"] },
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
        where: { clientId: session.user.id },
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
        createdAt: t.createdAt,
        actionsUsed: t.actionsUsed,
        estimatedActions: t.estimatedActions,
        correctionNote: t.correctionNote ?? null,
        project: t.project ?? null,
        assignedTo: t.assignedTo ? { id: t.assignedTo.id, name: t.assignedTo.name } : null,
      }))
    : [];

  if (isClient) {
    return (
      <div className="space-y-8">
        <BackLink href="/dashboard">Dashboard</BackLink>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Mes missions</h1>
            <p className="mt-1 text-slate-600">
              Suivez l&apos;avancement de vos missions et échangez avec votre assistant.
            </p>
          </div>
          <Link
            href="/dashboard/nouvelle-demande"
            className="rounded-lg bg-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1e40af]"
          >
            + Nouvelle mission
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <Link
            href="/dashboard/taches"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              !validStatus ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Toutes
          </Link>
          <Link
            href="/dashboard/taches?statut=EN_ATTENTE"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              validStatus === "EN_ATTENTE" ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            En attente
          </Link>
          <Link
            href="/dashboard/taches?statut=EN_COURS"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              validStatus === "EN_COURS" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            En cours
          </Link>
          <Link
            href="/dashboard/taches?statut=COMPLETE"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              validStatus === "COMPLETE" ? "bg-green-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Terminées
          </Link>
        </div>
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
      <div className="space-y-8">
        <BackLink href="/dashboard">Dashboard</BackLink>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Missions</h1>
          <p className="mt-1 text-slate-600">
            Tableau de gestion des missions. Assignez les agents, suivez l&apos;avancement et validez les livrables.
          </p>
        </div>
        <ManagerMissionsBoard
          nouvelles={boardForFilter.nouvelles}
          aAssigner={boardForFilter.aAssigner}
          enCours={boardForFilter.enCours}
          aValider={boardForFilter.aValider}
          terminees={boardForFilter.terminees}
          sessionUserId={session.user.id}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <BackLink href="/dashboard">Dashboard</BackLink>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{isAgent ? "Mes missions assignées" : "Mes tâches"}</h1>
          <p className="mt-1 text-slate-600">
            Tâches qui vous sont assignées. Indiquez le temps passé lors de la clôture pour déduire les actions du client.
          </p>
        </div>
      </div>

      {isAgent && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-slate-800">{agentSummary.missionsAujourdhui}</p>
            <p className="mt-1 text-sm text-slate-600">Missions aujourd&apos;hui</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-red-600">{agentSummary.missionsUrgentes}</p>
            <p className="mt-1 text-sm text-slate-600">Missions urgentes</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-blue-600">{agentSummary.missionsEnCours}</p>
            <p className="mt-1 text-sm text-slate-600">Missions en cours</p>
          </div>
        </div>
      )}

      {isManager && <DepotTacheForm projects={projects} />}

      {(isManager || isAgent) && (
        <div className="flex flex-wrap gap-2">
          <a
            href="/dashboard/taches"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              !validStatus ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Toutes
          </a>
          <a
            href="/dashboard/taches?statut=EN_ATTENTE"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              validStatus === "EN_ATTENTE" ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            En attente
          </a>
          <a
            href="/dashboard/taches?statut=EN_COURS"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              validStatus === "EN_COURS" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            En cours
          </a>
          <a
            href="/dashboard/taches?statut=COMPLETE"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              validStatus === "COMPLETE" ? "bg-green-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Terminées
          </a>
        </div>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-800">
          {isAgent
            ? "Mes missions assignées"
            : "Vos tâches"}
        </h2>
        {isAgent ? (
          <AgentMissionsList
            missions={(tasks as unknown as { id: string; title: string; status: string; priority: string | null; createdAt: Date; client: { id: string; name: string } }[]).map((t) => ({
              id: t.id,
              title: t.title,
              status: t.status,
              priority: t.priority,
              createdAt: t.createdAt,
              client: t.client,
            }))}
          />
        ) : (
          <TaskListView tasks={tasks} />
        )}
      </section>
    </div>
  );
}
