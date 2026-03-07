import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { shouldResetActions, getMonthStart } from "@/lib/actions";
import { DashboardKPIs } from "@/components/dashboard/DashboardKPIs";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { AlertsSection } from "@/components/dashboard/AlertsSection";
import { TasksChart } from "@/components/dashboard/TasksChart";
import { ClientsSection } from "@/components/dashboard/ClientsSection";
import { ScrollToMessages } from "@/components/ScrollToMessages";
import { AppointmentCalendar } from "@/components/appointments/AppointmentCalendar";
import { ActionsWidget } from "@/components/dashboard/ActionsWidget";
import { NouvelleDemandeTrigger } from "@/components/demands/NouvelleDemandeTrigger";
import { ClientDashboardContent } from "@/components/dashboard/ClientDashboardContent";
import { BackLink } from "@/components/ui/BackLink";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;
  const openDemande = params?.open === "demande";

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard");
  }

  const isAgence = session.user.role === "AGENCE" || session.user.role === "MANAGER";
  const isClient = session.user.role === "CLIENT";
  const clientId = session.user.id;

  let contractStatus: "PENDING" | "SIGNED" | null = null;
  let actionsData: {
    subscriptionPlan: string | null;
    monthlyActionsTotal: number;
    monthlyActionsUsed: number;
    renewsAt: Date | null;
  } | null = null;
  if (!isAgence && isClient) {
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
      if (shouldResetActions(u.actionsResetAt ?? null)) {
        await prisma.user.update({
          where: { id: clientId },
          data: { monthlyActionsUsed: 0, actionsResetAt: getMonthStart() },
        });
      }
      const after = await prisma.user.findUnique({
        where: { id: clientId },
        select: { monthlyActionsTotal: true, monthlyActionsUsed: true, subscriptionPlan: true },
      });
      if (after) {
        actionsData = {
          subscriptionPlan: after.subscriptionPlan ?? null,
          monthlyActionsTotal: after.monthlyActionsTotal ?? 120,
          monthlyActionsUsed: after.monthlyActionsUsed ?? 0,
          renewsAt,
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
    category: string | null;
    status: string;
    createdAt: Date;
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
    category: string;
    task: { id: string; title: string } | null;
    fileUrl: string;
  }[] = [];

  try {
    const [tEnCours, tCompletees, docAttente, act, al, tasksChart] = await Promise.all([
      prisma.task.count({
        where: { clientId, status: "EN_COURS" },
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
            category: true,
            status: true,
            createdAt: true,
            actionsUsed: true,
            estimatedActions: true,
            assignedTo: { select: { id: true, name: true } },
          },
          orderBy: { updatedAt: "desc" },
          take: 15,
        }),
        prisma.message.findMany({
          where: {
            OR: [{ receiverId: clientId }, { senderId: clientId }],
          },
          include: {
            project: { select: { id: true, title: true } },
            sender: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        prisma.document.findMany({
          where: { clientId },
          include: {
            task: { select: { id: true, title: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ]);
      clientTasks = tasksList;
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
        category: d.category,
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

  if (isAgence) {
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

  if (!isAgence && session.user?.email) {
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

  if (isClient) {
    return (
      <div className="space-y-8">
        <BackLink href="/">Retour à l&apos;accueil</BackLink>
        <ClientDashboardContent
          userName={session.user?.name ?? null}
          openDemande={openDemande}
          contractStatus={contractStatus}
          actionsData={
            actionsData ?? {
              subscriptionPlan: null,
              monthlyActionsTotal: 120,
              monthlyActionsUsed: 0,
              renewsAt: null,
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

  return (
    <div className="space-y-8">
      <BackLink href="/">Retour à l&apos;accueil</BackLink>
      <ScrollToMessages />
      {/* Carte de bienvenue + CTA Nouvelle demande (client) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Bienvenue, {session.user?.name}
        </h1>
        <p className="mt-1 text-slate-600">
          {isAgence
            ? session.user?.role === "MANAGER"
              ? "Vous recevez les projets des clients. Consultez la section Clients pour attribuer un agent à un projet, une tâche ou un client."
              : "Tableau de bord agence — vue d'ensemble des clients et tâches"
            : session.user?.role === "AGENT"
              ? "Tâches qui vous sont assignées. Indiquez le temps passé à la clôture pour déduire les actions du client."
              : "Suivez vos documents, tâches et échanges avec l’agence."}
        </p>
          </div>
          {isClient && (
            <NouvelleDemandeTrigger initialOpen={openDemande} variant="primary" />
          )}
        </div>
      </div>

      {/* Section Contrat — visible pour les clients, accès à la page contrat */}
      {!isAgence && (
        <section aria-label="Contrat" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Contrat d&apos;abonnement</h2>
          {contractStatus === "SIGNED" ? (
            <p className="mt-2 text-sm text-slate-600">
              Votre contrat a été accepté. Vous pouvez le consulter à tout moment.
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-600">
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

      {/* Actions du mois — clients */}
      {!isAgence && actionsData && (
        <ActionsWidget
          subscriptionPlan={actionsData.subscriptionPlan}
          monthlyActionsTotal={actionsData.monthlyActionsTotal}
          monthlyActionsUsed={actionsData.monthlyActionsUsed}
          renewsAt={actionsData.renewsAt}
        />
      )}

      {/* Section RDV */}
      <section
        id="messages"
        className="scroll-mt-24 space-y-8"
        aria-label="RDV"
      >
        {/* Demandes de RDV — clients : leurs demandes ; agence : lien vers page complète */}
        {isAgence ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <Link
              href="/dashboard/messages"
              className="flex items-center justify-between text-slate-700 hover:text-blue-600"
            >
              <span className="font-medium">Demandes de contact et RDV</span>
              <span className="text-sm text-blue-600">Voir tout →</span>
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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

        {/* Calendrier de prise de RDV — visible par tous */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">Prise de rendez-vous en ligne</h3>
          <p className="mt-1 text-sm text-slate-600">
            Réservez un créneau, ajoutez des pièces jointes et des notes. Les RDV apparaissent dans les alertes.
          </p>
          <div className="mt-4">
            <AppointmentCalendar />
          </div>
        </div>
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

      {/* Liste des clients (agence uniquement) */}
      {isAgence && <ClientsSection clients={clients} />}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Activité récente */}
        <ActivityTimeline activities={activities} />

        {/* Alertes importantes */}
        <AlertsSection alerts={alerts} />
      </div>

      {/* Liens rapides (agence ou client) */}
      <div className="flex flex-wrap gap-4">
        {isAgence && (
          <Link
            href="/dashboard/clients"
            className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow"
          >
            Clients
          </Link>
        )}
        <Link
          href="/dashboard/documents"
          className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow"
        >
          Mes documents
        </Link>
        <Link
          href="/dashboard/projets"
          className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow"
        >
          Projets
        </Link>
        <Link
          href="/dashboard/messagerie"
          className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow"
        >
          Messagerie
        </Link>
        <Link
          href="/dashboard/messages"
          className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow"
        >
          RDV
        </Link>
        {!isAgence && (
          <Link
            href="/contract"
            className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow"
          >
            Contrat
          </Link>
        )}
      </div>
    </div>
  );
}
