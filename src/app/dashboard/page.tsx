import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { syncUserCreditsExpiry } from "@/lib/actions";
import { DashboardKPIs } from "@/components/dashboard/DashboardKPIs";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { AlertsSection } from "@/components/dashboard/AlertsSection";
import { TasksChart } from "@/components/dashboard/TasksChart";
import { ClientsSection } from "@/components/dashboard/ClientsSection";
import { ScrollToMessages } from "@/components/ScrollToMessages";
import { ActionsWidget } from "@/components/dashboard/ActionsWidget";
import { NouvelleDemandeTrigger } from "@/components/demands/NouvelleDemandeTrigger";
import { ClientDashboardContent } from "@/components/dashboard/ClientDashboardContent";
import { ManagerDashboardContent, type ManagerTaskItem, type ManagerReportItem } from "@/components/dashboard/ManagerDashboardContent";
import { AgentDashboardContent } from "@/components/dashboard/AgentDashboardContent";
import { ATraiterHomeBanner } from "@/components/dashboard/ATraiterHomeBanner";
import { MessagesHomeBanner } from "@/components/dashboard/MessagesHomeBanner";
import { UpcomingRdvSection } from "@/components/dashboard/UpcomingRdvSection";
import { BackLink } from "@/components/ui/BackLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";
import { summarizeATraiter } from "@/lib/a-traiter/collect";
import { listUpcomingAppointments } from "@/lib/appointments/upcoming";
import { PersonaHomeDashboard } from "@/components/dashboard/PersonaHomeDashboard";
import {
  DemoClientHome,
  DemoFournisseurHome,
  resolveDemoPersonaKey,
} from "@/components/demo-environment/DemoPersonaHomes";
import { isExternalPortalUser } from "@/lib/equipe-acces/nav-by-persona";
import { projectWhereForClientUser } from "@/lib/organization/access";
import { loadAccueilOps } from "@/lib/accueil/load-accueil-ops";
import { AccueilOpsHome } from "@/components/dashboard/AccueilOpsHome";
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string; vue?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;
  const openDemande = params?.open === "demande";
  const vueParam = params?.vue;

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard");
  }

  const isManager = session.user.role === "MANAGER";
  const isAgent = session.user.role === "AGENT" || session.user.role === "AGENCE";
  const isClient = session.user.role === "CLIENT";
  const clientId = session.user.id;

  // ACCUEIL-V2A — tour de contrôle (hors démo / portail externe)
  if (!session.user.isDemo && (isClient || isManager || isAgent)) {
    const portalUser = await prisma.user.findUnique({
      where: { id: clientId },
      select: { personType: true, permissionProfile: true, name: true },
    });

    if (isClient && isExternalPortalUser(portalUser?.personType)) {
      const projectWhere = await projectWhereForClientUser(clientId);
      const sharedProjects = await prisma.project.findMany({
        where: projectWhere,
        select: {
          id: true,
          title: true,
          siteCity: true,
          chantierStatus: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 12,
      });
      return (
        <PersonaHomeDashboard
          userName={session.user?.name ?? null}
          personType={portalUser?.personType ?? null}
          permissionProfile={portalUser?.permissionProfile ?? null}
          projects={sharedProjects}
        />
      );
    }

    const scope =
      vueParam === "moi" ? "mine" : vueParam === "equipe" ? "team" : undefined;
    const ops = await loadAccueilOps({
      userId: session.user.id,
      role: session.user.role,
      personType: portalUser?.personType ?? session.user.personType ?? null,
      permissionProfile: portalUser?.permissionProfile ?? null,
      name: portalUser?.name ?? session.user.name ?? null,
      scope,
    });
    return (
      <div className="mx-auto w-full max-w-[1240px]">
        <AccueilOpsHome
          ops={ops}
          personType={portalUser?.personType ?? session.user.personType ?? null}
          permissionProfile={portalUser?.permissionProfile ?? null}
        />
      </div>
    );
  }

  let aTraiterSummary = {
    total: 0,
    hotCount: 0,
    attentionCounts: { CRITIQUE: 0, URGENT: 0, IMPORTANT: 0, A_SURVEILLER: 0 },
  };
  try {
    aTraiterSummary = await summarizeATraiter({
      id: session.user.id,
      role: session.user.role,
      personType: session.user.personType ?? null,
    });
  } catch {
    /* ignore */
  }
  const aTraiterTotal = aTraiterSummary.total;

  const upcomingRdvs = await listUpcomingAppointments(
    {
      id: session.user.id,
      role: session.user.role,
      email: session.user.email,
    },
    { take: 5 },
  );

  let contractStatus: "PENDING" | "SIGNED" | null = null;
  let actionsData: {
    subscriptionPlan: string | null;
    monthlyActionsTotal: number;
    monthlyActionsUsed: number;
    renewsAt: Date | null;
    creditsExpiresAt: Date | null;
  } | null = null;
  if (isClient) {
    const u = await prisma.user.findUnique({
      where: { id: clientId },
      select: {
        contractStatus: true,
        subscriptionPlan: true,
        monthlyActionsTotal: true,
        monthlyActionsUsed: true,
        actionsResetAt: true,
      },
    });
    contractStatus = u?.contractStatus ?? null;
    let renewsAt: Date | null = null;
    try {
      const sub = await prisma.subscription.findFirst({
        where: { userId: clientId, status: "ACTIVE" },
        orderBy: { renewsAt: "desc" },
        select: { renewsAt: true },
      });
      renewsAt = sub?.renewsAt ?? null;
    } catch {
      // Subscription table may not exist yet
    }
    if (u) {
      await syncUserCreditsExpiry(clientId);
      const after = await prisma.user.findUnique({
        where: { id: clientId },
        select: {
          monthlyActionsTotal: true,
          monthlyActionsUsed: true,
          subscriptionPlan: true,
          actionsResetAt: true,
        },
      });
      if (after) {
        actionsData = {
          subscriptionPlan: after.subscriptionPlan ?? null,
          monthlyActionsTotal: after.monthlyActionsTotal ?? SUBSCRIPTION_PLANS.STANDARD.actionsIncluded,
          monthlyActionsUsed: after.monthlyActionsUsed ?? 0,
          renewsAt,
          creditsExpiresAt: after.actionsResetAt ?? null,
        };
      }
    }
  }

  let tasksEnCours = 0;
  let tasksCompleteesCeMois = 0;
  let documentsEnAttente = 0;
  let activities: Awaited<ReturnType<typeof prisma.activity.findMany>> = [];
  let alerts: Awaited<ReturnType<typeof prisma.alert.findMany>> = [];
  let tasksPourChart: { createdAt: Date; completedAt: Date | null; status: string }[] = [];
  let tempsMoyenJours = 0;
  let clients: {
    id: string;
    name: string;
    email: string;
    projectsCount: number;
    tasksCount: number;
    subscriptionPlan: string | null;
    monthlyActionsTotal: number;
    monthlyActionsUsed: number;
  }[] = [];
  let contactRequestsClient: { id: string; structure: string; rdvDate: Date | null; rdvTime: string | null; status: string; createdAt: Date }[] = [];
  let clientTasks: {
    id: string;
    title: string;
    category?: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    actionsUsed: number | null;
    estimatedActions: string | null;
    assignedTo: { id: string; name: string } | null;
  }[] = [];
  let recentMessages: {
    id: string;
    content: string;
    createdAt: Date;
    project: { id: string; title: string };
    sender: { id: string; name: string };
    receiverId: string;
  }[] = [];
  let recentDocuments: {
    id: string;
    name: string;
    createdAt: Date;
    category?: string;
    task: { id: string; title: string } | null;
    fileUrl: string;
  }[] = [];

  try {
    const [tEnCours, tCompletees, docAttente, act, al, tasksChart] = await Promise.all([
      prisma.task.count({
        where: {
          clientId,
          status: { in: ["EN_COURS", "EN_ANALYSE", "ASSIGNEE", "EN_ATTENTE_INFO", "A_VALIDER"] },
        },
      }),
      prisma.task.count({
        where: {
          clientId,
          status: "COMPLETE",
          completedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.document.count({
        where: { clientId, status: "EN_ATTENTE" },
      }),
      prisma.activity.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.alert.findMany({
        where: { clientId, read: false },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.task.findMany({
        where: { clientId },
        select: { createdAt: true, completedAt: true, status: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    tasksEnCours = tEnCours;
    tasksCompleteesCeMois = tCompletees;
    documentsEnAttente = docAttente;
    activities = act;
    alerts = al;
    tasksPourChart = tasksChart;

    if (isClient) {
      const [tasksList, messagesList, docsList] = await Promise.all([
        prisma.task.findMany({
          where: { clientId },
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            actionsUsed: true,
            assignedTo: { select: { id: true, name: true } },
          },
          orderBy: { updatedAt: "desc" },
          take: 15,
        }),
        prisma.message.findMany({
          where: {
            OR: [{ receiverId: clientId }, { senderId: clientId }],
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
            receiverId: true,
            project: { select: { id: true, title: true } },
            sender: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 3,
        }),
        prisma.document.findMany({
          where: { clientId },
          select: {
            id: true,
            name: true,
            createdAt: true,
            category: true,
            fileUrl: true,
            task: { select: { id: true, title: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ]);
      clientTasks = tasksList.map((t) => ({
        ...t,
        estimatedActions: (t as { estimatedActions?: string | null }).estimatedActions ?? null,
      }));
      recentMessages = messagesList.map((m) => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt,
        project: m.project!,
        sender: m.sender,
        receiverId: m.receiverId,
      }));
      recentDocuments = docsList.map((d) => ({
        id: d.id,
        name: d.name,
        createdAt: d.createdAt,
        category: d.category ?? undefined,
        task: d.task,
        fileUrl: d.fileUrl,
      }));
    }

    const tasksCompletees = await prisma.task.findMany({
      where: { clientId, status: "COMPLETE", completedAt: { not: null } },
      select: { createdAt: true, completedAt: true },
    });
    if (tasksCompletees.length > 0) {
      tempsMoyenJours =
        tasksCompletees.reduce((acc: number, t: { createdAt: Date; completedAt: Date | null }) => {
          if (!t.completedAt) return acc;
          const jours = (t.completedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          return acc + jours;
        }, 0) / tasksCompletees.length;
    }
  } catch {
    // Tables Task/Document/Activity/Alert absentes : exécuter prisma/supabase-add-documents-tasks.sql puis npx prisma generate
  }

  let managerTasks: {
    nouvelles: Awaited<ReturnType<typeof prisma.task.findMany>>;
    aAssigner: Awaited<ReturnType<typeof prisma.task.findMany>>;
    enCours: Awaited<ReturnType<typeof prisma.task.findMany>>;
    aValider: Awaited<ReturnType<typeof prisma.task.findMany>>;
    terminees: Awaited<ReturnType<typeof prisma.task.findMany>>;
  } = {
    nouvelles: [],
    aAssigner: [],
    enCours: [],
    aValider: [],
    terminees: [],
  };

  if (isManager) {
    try {
      const [nouvelles, aAssigner, enCours, aValider, terminees] = await Promise.all([
        prisma.task.findMany({
          where: { status: "NOUVEAU" },
          include: { client: { select: { id: true, name: true } }, assignedTo: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
        prisma.task.findMany({
          where: { status: "EN_ATTENTE", assignedToId: null },
          include: { client: { select: { id: true, name: true } }, assignedTo: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
        prisma.task.findMany({
          where: { status: { in: ["ASSIGNEE", "EN_ANALYSE", "EN_COURS", "EN_ATTENTE_INFO"] } },
          include: { client: { select: { id: true, name: true } }, assignedTo: { select: { id: true, name: true } } },
          orderBy: { updatedAt: "desc" },
          take: 20,
        }),
        prisma.task.findMany({
          where: { status: "A_VALIDER" },
          include: { client: { select: { id: true, name: true } }, assignedTo: { select: { id: true, name: true } } },
          orderBy: { updatedAt: "desc" },
          take: 20,
        }),
        prisma.task.findMany({
          where: { status: "COMPLETE" },
          include: { client: { select: { id: true, name: true } }, assignedTo: { select: { id: true, name: true } } },
          orderBy: { completedAt: "desc" },
          take: 15,
        }),
      ]);
      managerTasks = { nouvelles, aAssigner, enCours, aValider, terminees };
    } catch {
      // ignore
    }
  }

  let managerKpis: {
    nouvellesCount: number;
    aAssignerCount: number;
    enCoursCount: number;
    aValiderCount: number;
    agentsActifsCount: number;
    actionsConsumees: number;
    activiteRecente: { id: string; title: string; detail: string | null; createdAt: Date; client?: { name: string } }[];
    comptesRendusRecents: ManagerReportItem[];
  } = {
    nouvellesCount: 0,
    aAssignerCount: 0,
    enCoursCount: 0,
    aValiderCount: 0,
    agentsActifsCount: 0,
    actionsConsumees: 0,
    activiteRecente: [],
    comptesRendusRecents: [],
  };

  if (isManager) {
    try {
      const [nouvCount, aAssignCount, enCoursCount, aValiderCount, agentsCount, clientsActions, recentActivities, recentReports] = await Promise.all([
        prisma.task.count({ where: { status: "NOUVEAU" } }),
        prisma.task.count({ where: { status: "EN_ATTENTE", assignedToId: null } }),
        prisma.task.count({ where: { status: { in: ["ASSIGNEE", "EN_ANALYSE", "EN_COURS", "EN_ATTENTE_INFO"] } } }),
        prisma.task.count({ where: { status: "A_VALIDER" } }),
        prisma.user.count({ where: { role: "AGENT" } }),
        prisma.user.findMany({ where: { role: "CLIENT" }, select: { monthlyActionsUsed: true } }),
        prisma.activity.findMany({
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { client: { select: { name: true } } },
        }),
        prisma.task.findMany({
          where: { clientReportSentAt: { not: null } },
          orderBy: { clientReportSentAt: "desc" },
          take: 10,
          select: {
            id: true,
            title: true,
            clientReportSentAt: true,
            actionsUsed: true,
            client: { select: { name: true } },
          },
        }),
      ]);
      const actionsConsumees = (clientsActions as { monthlyActionsUsed: number | null }[]).reduce(
        (s, u) => s + (u.monthlyActionsUsed ?? 0),
        0
      );
      managerKpis = {
        nouvellesCount: nouvCount,
        aAssignerCount: aAssignCount,
        enCoursCount,
        aValiderCount,
        agentsActifsCount: agentsCount,
        actionsConsumees,
        activiteRecente: recentActivities.map((a) => ({
          id: a.id,
          title: a.title,
          detail: a.detail,
          createdAt: a.createdAt,
          client: a.client ? { name: a.client.name } : undefined,
        })),
        comptesRendusRecents: recentReports
          .filter((r) => r.clientReportSentAt)
          .map((r) => ({
            id: r.id,
            title: r.title,
            clientReportSentAt: r.clientReportSentAt as Date,
            actionsUsed: r.actionsUsed,
            client: { name: r.client.name },
          })),
      };
    } catch {
      // ignore
    }
  }

  if (isManager) {
    try {
      const clientUsers = await prisma.user.findMany({
        where: { role: "CLIENT" },
        select: {
          id: true,
          name: true,
          email: true,
          subscriptionPlan: true,
          monthlyActionsTotal: true,
          monthlyActionsUsed: true,
          _count: { select: { projects: true, tasks: true } },
        },
        orderBy: { name: "asc" },
      });
      clients = clientUsers.map((u: {
        id: string;
        name: string;
        email: string;
        subscriptionPlan: string | null;
        monthlyActionsTotal: number | null;
        monthlyActionsUsed: number | null;
        _count: { projects: number; tasks: number };
      }) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        projectsCount: u._count.projects,
        tasksCount: u._count.tasks,
        subscriptionPlan: u.subscriptionPlan ?? null,
        monthlyActionsTotal: u.monthlyActionsTotal ?? 0,
        monthlyActionsUsed: u.monthlyActionsUsed ?? 0,
      }));
    } catch {
      // Table User ou relations absentes
    }
  }

  if (isClient && session.user?.email) {
    try {
      contactRequestsClient = await prisma.contactRequest.findMany({
        where: { email: session.user.email },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          structure: true,
          rdvDate: true,
          rdvTime: true,
          status: true,
          createdAt: true,
        },
      });
    } catch {
      // ignore
    }
  }

  const isAgentRole = session.user.role === "AGENT" || session.user.role === "AGENCE";
  let agentData: {
    missionsToday: number;
    missionsUrgentes: number;
    missionsEnCours: number;
    messagesNonLus: number;
    missions: { id: string; title: string; status: string; priority: string | null; desiredDate: Date | null; createdAt: Date; updatedAt: Date; client: { id: string; name: string } }[];
    missionsUrgentesList: { id: string; title: string; status: string; priority: string | null; desiredDate: Date | null; createdAt: Date; updatedAt: Date; client: { id: string; name: string } }[];
    messagesRecents: { id: string; content: string; createdAt: Date; read: boolean; sender: { id: string; name: string }; task: { id: string; title: string } }[];
  } = {
    missionsToday: 0,
    missionsUrgentes: 0,
    missionsEnCours: 0,
    messagesNonLus: 0,
    missions: [],
    missionsUrgentesList: [],
    messagesRecents: [],
  };

  if (isAgentRole) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const agentId = session.user.id;

      const [missionsAll, urgentTasks, messagesCount, messagesList] = await Promise.all([
        prisma.task.findMany({
          where: { assignedToId: agentId, status: { notIn: ["COMPLETE"] } },
          include: { client: { select: { id: true, name: true } } },
          orderBy: { updatedAt: "desc" },
          take: 20,
        }),
        prisma.task.findMany({
          where: { assignedToId: agentId, status: { notIn: ["COMPLETE"] } },
          include: { client: { select: { id: true, name: true } } },
          orderBy: { updatedAt: "desc" },
          take: 10,
        }),
        prisma.taskMessage.count({
          where: {
            task: { assignedToId: agentId },
            read: false,
            receiverId: agentId,
          },
        }),
        prisma.taskMessage.findMany({
          where: {
            OR: [{ senderId: agentId }, { receiverId: agentId }],
            task: { assignedToId: agentId },
          },
          include: {
            sender: { select: { id: true, name: true } },
            task: { select: { id: true, title: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);

      const missionsToday = await prisma.task.count({
        where: {
          assignedToId: agentId,
          status: { notIn: ["COMPLETE"] },
          OR: [
            { desiredDate: { gte: today, lt: tomorrow } },
            { createdAt: { gte: today } },
          ],
        },
      });

      agentData = {
        missionsToday,
        missionsUrgentes: urgentTasks.length,
        missionsEnCours: missionsAll.length,
        messagesNonLus: messagesCount,
        missions: missionsAll.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: (t as { priority?: string | null }).priority ?? null,
          desiredDate: t.desiredDate,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          client: t.client,
        })),
        missionsUrgentesList: urgentTasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: (t as { priority?: string | null }).priority ?? null,
          desiredDate: t.desiredDate,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          client: t.client,
        })),
        messagesRecents: messagesList.map((m) => ({
          id: m.id,
          content: m.content,
          createdAt: m.createdAt,
          read: m.read,
          sender: m.sender,
          task: m.task,
        })),
      };
    } catch {
      // ignore
    }
  }

  if (isClient && session.user.isDemo) {
    const portal = await prisma.user.findUnique({
      where: { id: clientId },
      select: { personType: true, permissionProfile: true, name: true },
    });
    const personaKey = resolveDemoPersonaKey(portal?.permissionProfile, portal?.personType);
    const hostName = session.user.demoCompanyName ?? "votre entreprise";
    const firstName = (portal?.name ?? session.user.name ?? "vous").split(" ")[0] ?? "vous";
    const projectWhere = await projectWhereForClientUser(clientId);

    // Conducteur (Karim) : même Accueil Ops V2A que Direction — scope Moi par défaut.
    // Portails Client / Fournisseur restent volontaires (branches ci-dessous).

    if (personaKey === "client") {
      const [projects, agenda, docs, pendingTasks] = await Promise.all([
        prisma.project.findMany({
          where: projectWhere,
          select: { id: true, title: true, chantierStatus: true, siteCity: true },
          take: 6,
        }),
        prisma.agendaEvent.findMany({
          where: { project: projectWhere, status: { not: "ANNULE" }, startAt: { gte: new Date() } },
          select: { id: true, title: true, startAt: true, location: true },
          orderBy: { startAt: "asc" },
          take: 5,
        }).catch(() => []),
        prisma.chantierFile.findMany({
          where: {
            project: projectWhere,
            visibility: { in: ["Intervenants autorisés", "BeWork et entreprise cliente", "Partage temporaire"] },
            deletedAt: null,
          },
          select: { id: true, name: true },
          take: 5,
          orderBy: { createdAt: "desc" },
        }),
        // Pas de tâches chantier internes (CR, etc.) — fuite portail client.
        Promise.resolve([] as { id: string; title: string; status: string; description: string | null }[]),
      ]);
      return (
        <DemoClientHome
          firstName={firstName}
          hostCompany={hostName}
          projects={projects}
          agenda={agenda}
          docs={docs}
          pendingTasks={pendingTasks}
        />
      );
    }

    if (personaKey === "fournisseur") {
      const supplierUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { externalOrganizationId: true },
      });
      const rootId = session.user.demoRootUserId ?? clientId;
      const hostOrg = await prisma.organization.findUnique({
        where: { ownerUserId: rootId },
        select: { id: true, name: true },
      });
      const purchaseOrders =
        supplierUser?.externalOrganizationId && hostOrg
          ? await prisma.purchaseOrder.findMany({
              where: {
                organizationId: hostOrg.id,
                externalOrganizationId: supplierUser.externalOrganizationId,
                sharedWithSupplier: true,
              },
              select: {
                id: true,
                number: true,
                subject: true,
                status: true,
                requestedDeliveryAt: true,
                project: { select: { title: true } },
                lines: {
                  take: 1,
                  orderBy: { sortOrder: "asc" },
                  select: { designation: true, quantity: true, unit: true },
                },
                organization: { select: { name: true } },
              },
              orderBy: { updatedAt: "desc" },
              take: 12,
            })
          : [];
      const orders = purchaseOrders.map((o) => {
        const line = o.lines[0];
        return {
          id: o.id,
          title: o.number,
          number: o.number,
          subject: o.subject,
          status: o.status,
          projectTitle: o.project?.title ?? null,
          hostCompany: o.organization.name,
          requestedDeliveryAt: o.requestedDeliveryAt,
          lineSummary: line
            ? `${Number(line.quantity)} ${line.unit} ${line.designation}`
            : o.subject,
        };
      });
      return (
        <DemoFournisseurHome
          firstName={firstName}
          hostCompany={hostName}
          orders={orders}
        />
      );
    }

    // Internes démo (Denis Direction, Karim Conducteur, Julie Administratif) :
    // AccueilOpsHome unique — scope Moi (conducteur) / Équipe (direction & administratif).
    // Portails Client / Fournisseur restent volontaires (branches ci-dessus).

    const defaultScope =
      personaKey === "conducteur" ||
      portal?.permissionProfile === "CONDUCTEUR" ||
      portal?.permissionProfile === "CHEF_CHANTIER"
        ? "mine"
        : "team";
    const homeOps = await loadAccueilOps({
      userId: clientId,
      role: session.user.role,
      personType: portal?.personType ?? null,
      permissionProfile: portal?.permissionProfile ?? "DIRECTION",
      name: portal?.name ?? session.user.name ?? null,
      scope:
        vueParam === "moi" ? "mine" : vueParam === "equipe" ? "team" : defaultScope,
    });
    return (
      <div className="mx-auto w-full max-w-[1240px]">
        <AccueilOpsHome
          ops={homeOps}
          personType={portal?.personType ?? null}
          permissionProfile={portal?.permissionProfile ?? null}
        />
      </div>
    );
  }

  if (isClient) {
    const portalUser = await prisma.user.findUnique({
      where: { id: clientId },
      select: { personType: true, permissionProfile: true },
    });
    if (isExternalPortalUser(portalUser?.personType)) {
      const projectWhere = await projectWhereForClientUser(clientId);
      const sharedProjects = await prisma.project.findMany({
        where: projectWhere,
        select: {
          id: true,
          title: true,
          siteCity: true,
          chantierStatus: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 12,
      });
      return (
        <PersonaHomeDashboard
          userName={session.user?.name ?? null}
          personType={portalUser?.personType ?? null}
          permissionProfile={portalUser?.permissionProfile ?? null}
          projects={sharedProjects}
        />
      );
    }

    return (
      <div className="space-y-8">
        <BackLink href="/">Retour à l&apos;accueil</BackLink>
        <ATraiterHomeBanner
          total={aTraiterTotal}
          critique={aTraiterSummary.attentionCounts.CRITIQUE}
          urgent={aTraiterSummary.attentionCounts.URGENT}
          important={aTraiterSummary.attentionCounts.IMPORTANT}
        />
        <MessagesHomeBanner />
        <UpcomingRdvSection appointments={upcomingRdvs} compact />
        <ClientDashboardContent
          userName={session.user?.name ?? null}
          openDemande={openDemande}
          contractStatus={contractStatus}
          actionsData={
            actionsData ?? {
              subscriptionPlan: null,
              monthlyActionsTotal: SUBSCRIPTION_PLANS.STANDARD.actionsIncluded,
              monthlyActionsUsed: 0,
              renewsAt: null,
              creditsExpiresAt: null,
            }
          }
          tasksEnCours={tasksEnCours}
          tasksCompleteesCeMois={tasksCompleteesCeMois}
          tempsMoyenJours={tempsMoyenJours}
          clientTasks={clientTasks}
          recentMessages={recentMessages}
          clientId={clientId}
          recentDocuments={recentDocuments}
          recentActivities={activities}
        />
      </div>
    );
  }

  if (isAgent) {
    return (
      <div className="space-y-8">
        <BackLink href="/">Retour à l&apos;accueil</BackLink>
        <ATraiterHomeBanner
          total={aTraiterTotal}
          critique={aTraiterSummary.attentionCounts.CRITIQUE}
          urgent={aTraiterSummary.attentionCounts.URGENT}
          important={aTraiterSummary.attentionCounts.IMPORTANT}
        />
        <MessagesHomeBanner />
        <UpcomingRdvSection appointments={upcomingRdvs} compact />
        <AgentDashboardContent
          userName={session.user?.name ?? null}
          missionsToday={agentData.missionsToday}
          missionsUrgentes={agentData.missionsUrgentes}
          missionsEnCours={agentData.missionsEnCours}
          messagesNonLus={agentData.messagesNonLus}
          missions={agentData.missions}
          missionsUrgentesList={agentData.missionsUrgentesList}
          messagesRecents={agentData.messagesRecents}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <BackLink href="/">Retour à l&apos;accueil</BackLink>
      <ATraiterHomeBanner
        total={aTraiterTotal}
        critique={aTraiterSummary.attentionCounts.CRITIQUE}
        urgent={aTraiterSummary.attentionCounts.URGENT}
        important={aTraiterSummary.attentionCounts.IMPORTANT}
      />
      <MessagesHomeBanner />
      <UpcomingRdvSection appointments={upcomingRdvs} />
      <ScrollToMessages />

      {/* Dashboard gérante — centre de pilotage */}
      {isManager && (
        <>
          <ManagerDashboardContent
            nouvellesDemandes={managerTasks.nouvelles as unknown as ManagerTaskItem[]}
            aAssigner={managerTasks.aAssigner as unknown as ManagerTaskItem[]}
            missionsEnCours={managerTasks.enCours as unknown as ManagerTaskItem[]}
            missionsAValider={managerTasks.aValider as unknown as ManagerTaskItem[]}
            missionsTerminees={managerTasks.terminees as unknown as ManagerTaskItem[]}
            nouvellesCount={managerKpis.nouvellesCount}
            aAssignerCount={managerKpis.aAssignerCount}
            enCoursCount={managerKpis.enCoursCount}
            aValiderCount={managerKpis.aValiderCount}
            agentsActifsCount={managerKpis.agentsActifsCount}
            actionsConsumees={managerKpis.actionsConsumees}
            activiteRecente={managerKpis.activiteRecente}
            comptesRendusRecents={managerKpis.comptesRendusRecents}
          />
          {clients.length > 0 && <ClientsSection clients={clients} />}
        </>
      )}

      {!isManager && (
      <>
      {/* Carte de bienvenue + CTA Nouvelle demande (client) */}
      <PageHeader
        eyebrow="BeWork Command Center"
        title={`Bienvenue, ${session.user?.name}`}
        description={
          isAgentRole
            ? "Tâches qui vous sont assignées. Indiquez le temps passé à la clôture pour déduire les crédits du client."
            : "Suivez vos documents, tâches et échanges avec l’agence."
        }
        actions={isClient ? <NouvelleDemandeTrigger initialOpen={openDemande} variant="primary" /> : undefined}
      />

      {/* Section Contrat — visible pour les clients, accès à la page contrat */}
      {isClient && (
        <section aria-label="Contrat" className="cc-card p-6">
          <h2 className="font-heading text-lg font-semibold text-bework-ink">Contrat d&apos;abonnement</h2>
          {contractStatus === "SIGNED" ? (
            <p className="mt-2 text-sm text-bework-muted">
              Votre contrat a été accepté. Vous pouvez le consulter à tout moment.
            </p>
          ) : (
            <p className="mt-2 text-sm text-bework-muted">
              Pour accéder à l&apos;ensemble des services, veuillez lire et accepter le contrat d&apos;abonnement.
            </p>
          )}
          <Link
            href="/contract"
            className={`mt-4 inline-block rounded-lg px-4 py-2 text-sm font-medium transition ${
              contractStatus === "SIGNED"
                ? "border border-slate-200 text-slate-700 hover:bg-slate-50"
                : "bg-[#1d4ed8] text-white hover:bg-[#1e40af]"
            }`}
          >
            {contractStatus === "SIGNED" ? "Voir le contrat" : "Accéder au contrat"}
          </Link>
        </section>
      )}

      {/* Crédits du mois — clients */}
      {isClient && actionsData && (
        <ActionsWidget
          subscriptionPlan={actionsData.subscriptionPlan}
          monthlyActionsTotal={actionsData.monthlyActionsTotal}
          monthlyActionsUsed={actionsData.monthlyActionsUsed}
          renewsAt={actionsData.renewsAt}
          creditsExpiresAt={actionsData.creditsExpiresAt ?? null}
        />
      )}

      {/* Section RDV */}
      <section
        id="messages"
        className="scroll-mt-24 space-y-8"
        aria-label="RDV"
      >
        {/* Demandes de RDV — clients/agents : leurs demandes ; gérante : lien vers page complète */}
        {isManager ? (
          <div className="rounded-2xl surface-metallic-light p-4">
            <Link
              href="/dashboard/messages"
              className="flex items-center justify-between text-slate-700 hover:text-blue-600"
            >
              <span className="font-medium">Demandes de contact et RDV</span>
              <span className="text-sm text-blue-600">Voir tout →</span>
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl surface-metallic-light p-6">
            <h3 className="text-lg font-semibold text-slate-800">Mes demandes de RDV</h3>
            <p className="mt-1 text-sm text-slate-600">Demandes envoyées depuis la page Contact.</p>
            {contactRequestsClient.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                Aucune demande. Vous pouvez en envoyer depuis la page{" "}
                <Link href="/contact" className="text-blue-600 hover:underline">Contact</Link>.
              </p>
            ) : (
              <>
                <ul className="mt-4 space-y-3">
                  {contactRequestsClient.slice(0, 5).map((r) => {
                    const rdvLabel =
                      r.rdvDate && r.rdvTime
                        ? `${new Date(r.rdvDate).toLocaleDateString("fr-FR")} à ${r.rdvTime.replace(":", "h")}`
                        : r.rdvDate
                          ? new Date(r.rdvDate).toLocaleDateString("fr-FR")
                          : "—";
                    return (
                      <li
                        key={r.id}
                        className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3"
                      >
                        <span className="font-medium text-slate-800">{r.structure}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-600">{rdvLabel}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              r.status === "CONFIRME"
                                ? "bg-green-100 text-green-800"
                                : r.status === "ANNULE"
                                  ? "bg-slate-100 text-slate-600"
                                  : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {r.status === "CONFIRME" ? "Confirmé" : r.status === "ANNULE" ? "Annulé" : "Nouvelle"}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <Link
                  href="/dashboard/messages"
                  className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
                >
                  Voir toutes mes demandes →
                </Link>
              </>
            )}
          </div>
        )}

      </section>

      {/* KPIs */}
      <DashboardKPIs
        tasksEnCours={tasksEnCours}
        tasksCompleteesCeMois={tasksCompleteesCeMois}
        documentsEnAttente={documentsEnAttente}
        tempsMoyenJours={tempsMoyenJours}
      />

      {/* Graphique évolution 7 jours */}
      <TasksChart tasks={tasksPourChart} />

      {/* Liste des clients (gérante uniquement) */}
      {isManager && <ClientsSection clients={clients} />}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Activité récente */}
        <ActivityTimeline activities={activities} />

        {/* Alertes importantes */}
        <AlertsSection alerts={alerts} />
      </div>

      {/* Liens rapides (gérante ou client) */}
      <div className="flex flex-wrap gap-4">
        {isManager && (
          <Link
            href="/dashboard/clients"
            className="rounded-xl surface-metallic-light px-6 py-3 text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow"
          >
            Clients
          </Link>
        )}
        <Link
          href="/dashboard/documents"
          className="rounded-xl surface-metallic-light px-6 py-3 text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow"
        >
          Mes documents
        </Link>
        <Link
          href="/dashboard/projets"
          className="rounded-xl surface-metallic-light px-6 py-3 text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow"
        >
          Projets
        </Link>
        <Link
          href="/dashboard/messagerie"
          className="rounded-xl surface-metallic-light px-6 py-3 text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow"
        >
          Messagerie
        </Link>
        <Link
          href="/dashboard/messages"
          className="rounded-xl surface-metallic-light px-6 py-3 text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow"
        >
          RDV
        </Link>
        {isClient && (
          <Link
            href="/contract"
            className="rounded-xl surface-metallic-light px-6 py-3 text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow"
          >
            Contrat
          </Link>
        )}
      </div>
      </>
      )}
    </div>
  );
}
