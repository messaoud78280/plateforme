import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TaskListView } from "@/components/tasks/TaskListView";
import { DepotTacheForm } from "@/components/tasks/DepotTacheForm";
import { NouvelleDemandeTrigger } from "@/components/demands/NouvelleDemandeTrigger";

export default async function TachesPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; nouvelle?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard");
  }

  const isAgence = session.user.role === "AGENCE" || session.user.role === "MANAGER";
  const isAgent = session.user.role === "AGENT";
  const params = await searchParams;
  const statusFilter = params.statut as "EN_ATTENTE" | "EN_COURS" | "COMPLETE" | undefined;
  const validStatus = statusFilter && ["EN_ATTENTE", "EN_COURS", "COMPLETE"].includes(statusFilter)
    ? statusFilter
    : undefined;
  const openNouvelleDemande = params.nouvelle === "1";

  let tasks: Awaited<ReturnType<typeof prisma.task.findMany>> = [];
  let projects: { id: string; title: string }[] = [];
  try {
    if (prisma.task) {
      const taskWhere = isAgence
        ? {}
        : isAgent
          ? { assignedToId: session.user.id }
          : { clientId: session.user.id };
      tasks = await prisma.task.findMany({
        where: {
          ...taskWhere,
          ...(validStatus ? { status: validStatus } : {}),
        },
        include: {
          project: { select: { id: true, title: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
        },
        orderBy: { updatedAt: "desc" },
      });
    }
    if (!isAgence && prisma.project) {
      projects = await prisma.project.findMany({
        where: { clientId: session.user.id },
        select: { id: true, title: true },
        orderBy: { title: "asc" },
      });
    }
  } catch {
    // Table absente ou client Prisma non régénéré
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mes tâches</h1>
          <p className="mt-1 text-slate-600">
            {isAgence
              ? "Tâches déposées par les clients. Cliquez sur une tâche pour la prendre en charge ou la marquer comme terminée."
              : isAgent
                ? "Tâches qui vous sont assignées. Indiquez le temps passé lors de la clôture pour déduire les actions du client."
                : "Déposez vos demandes et suivez leur avancement."}
          </p>
        </div>
        {session.user.role === "CLIENT" && (
          <NouvelleDemandeTrigger initialOpen={openNouvelleDemande} variant="primary" />
        )}
      </div>

      {session.user.role === "CLIENT" && <DepotTacheForm projects={projects} />}

      {(isAgence || isAgent) && (
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
          {isAgence ? (validStatus ? `Tâches ${validStatus === "EN_ATTENTE" ? "en attente" : validStatus === "EN_COURS" ? "en cours" : "terminées"}` : "Toutes les tâches") : "Vos tâches"}
        </h2>
        <TaskListView tasks={tasks} />
      </section>
    </div>
  );
}
