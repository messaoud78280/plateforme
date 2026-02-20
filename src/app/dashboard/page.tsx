import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { DashboardKPIs } from "@/components/dashboard/DashboardKPIs";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { AlertsSection } from "@/components/dashboard/AlertsSection";
import { TasksChart } from "@/components/dashboard/TasksChart";
import { ClientsSection } from "@/components/dashboard/ClientsSection";
import { MessagesSection } from "@/components/dashboard/MessagesSection";
import { ScrollToMessages } from "@/components/ScrollToMessages";
import { AppointmentCalendar } from "@/components/appointments/AppointmentCalendar";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard");
  }

  const isAgence = session.user.role === "AGENCE" || session.user.role === "MANAGER";
  const clientId = session.user.id;

  let tasksEnCours = 0;
  let tasksCompleteesCeMois = 0;
  let documentsEnAttente = 0;
  let activities: Awaited<ReturnType<typeof prisma.activity.findMany>> = [];
  let alerts: Awaited<ReturnType<typeof prisma.alert.findMany>> = [];
  let tasksPourChart: { createdAt: Date; completedAt: Date | null; status: string }[] = [];
  let tempsMoyenJours = 0;
  let clients: { id: string; name: string; email: string; projectsCount: number; tasksCount: number }[] = [];
  let contactRequestsClient: { id: string; structure: string; rdvDate: Date | null; rdvTime: string | null; status: string; createdAt: Date }[] = [];

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
          _count: { select: { projects: true, tasks: true } },
        },
        orderBy: { name: "asc" },
      });
      clients = clientUsers.map((u: { id: string; name: string; email: string; _count: { projects: number; tasks: number } }) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        projectsCount: u._count.projects,
        tasksCount: u._count.tasks,
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

  return (
    <div className="space-y-8">
      <ScrollToMessages />
      {/* Carte de bienvenue */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800">
          Bienvenue, {session.user?.name}
        </h1>
        <p className="mt-1 text-slate-600">
          {isAgence
            ? session.user?.role === "MANAGER"
              ? "Vous recevez les projets des clients. Consultez la section Clients pour attribuer un agent à un projet, une tâche ou un client."
              : "Tableau de bord agence — vue d'ensemble des clients et tâches"
            : "Suivez vos documents, tâches et échanges avec l’agence."}
        </p>
      </div>

      {/* Section Messages */}
      <section
        id="messages"
        className="scroll-mt-24 space-y-8"
        aria-label="Messages"
      >
        <MessagesSection
          isAgence={isAgence}
          sessionUserId={session.user.id}
        />

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
          href="/dashboard/messages"
          className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow"
        >
          Messages
        </Link>
      </div>
    </div>
  );
}
