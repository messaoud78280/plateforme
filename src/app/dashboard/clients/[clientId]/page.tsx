import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { AssignAgentProject } from "@/components/clients/AssignAgentProject";
import { AssignAgentTask } from "@/components/clients/AssignAgentTask";

const STATUS_LABELS: Record<string, string> = {
  NOUVEAU: "Nouveau",
  EN_COURS: "En cours",
  EN_ATTENTE: "En attente",
  TERMINE: "Terminé",
};

const TASK_STATUS_LABELS: Record<string, string> = {
  EN_COURS: "En cours",
  COMPLETE: "Terminée",
  EN_ATTENTE: "En attente",
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { clientId } = await params;

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard");
  }

  const isManager = session.user.role === "MANAGER";
  if (!isManager) {
    redirect("/dashboard");
  }

  let client: { id: string; name: string; email: string; company: string | null; phone: string | null } | null = null;
  let projects: { id: string; title: string; status: string; assignedToId: string | null; assignedTo: { id: string; name: string; email: string } | null }[] = [];
  let tasks: { id: string; title: string; status: string; assignedToId: string | null; project: { id: string; title: string } | null; assignedTo: { id: string; name: string; email: string } | null }[] = [];
  let agents: { id: string; name: string; email: string }[] = [];

  try {
    const clientUser = await prisma.user.findUnique({
      where: { id: clientId },
      select: { id: true, name: true, email: true, company: true, phone: true, role: true },
    });
    if (!clientUser) {
      notFound();
    }
    client = { id: clientUser.id, name: clientUser.name, email: clientUser.email, company: clientUser.company, phone: clientUser.phone };

    const [projectsRes, tasksRes, agentsRes] = await Promise.all([
      prisma.project.findMany({
        where: { clientId },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.task.findMany({
        where: { clientId },
        select: {
          id: true,
          title: true,
          status: true,
          assignedToId: true,
          project: { select: { id: true, title: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.user.findMany({
        where: { role: { in: ["AGENCE", "AGENT"] } },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      }),
    ]);
    projects = projectsRes;
    tasks = tasksRes;
    agents = agentsRes;
  } catch (e) {
    console.error("[ClientDetailPage] Erreur chargement client:", e);
    throw e;
  }

  if (!client) notFound();

  return (
    <div className="space-y-8">
      <BackLink href="/dashboard/clients">Retour aux clients</BackLink>

      <div className="rounded-xl surface-metallic-light p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-black">{client.name}</h1>
        <p className="mt-1 text-black">{client.email}</p>
        {client.company && (
          <p className="mt-1 text-sm text-black">Société : {client.company}</p>
        )}
        {client.phone && (
          <p className="mt-1 text-sm text-black">Tél. : {client.phone}</p>
        )}
      </div>

      {/* Projets du client */}
      <div className="rounded-xl surface-metallic-light shadow-sm">
        <h2 className="border-b border-[#e0e4ea] px-6 py-4 text-lg font-semibold text-black">
          Projets ({projects.length})
        </h2>
        {projects.length === 0 ? (
          <p className="px-6 py-8 text-sm text-black">Aucun projet pour ce client.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b border-[#e0e4ea] bg-[#f8f9fb] text-black">
                  <th className="px-6 py-3 text-left font-medium">Projet</th>
                  <th className="px-6 py-3 text-left font-medium">Statut</th>
                  <th className="px-6 py-3 text-left font-medium">Agent assigné</th>
                  <th className="px-6 py-3 text-right font-medium">Accès</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="border-b border-[#e0e4ea] hover:bg-[#f8f9fb]">
                    <td className="px-6 py-3">
                      <Link
                        href={`/dashboard/projets/${project.id}`}
                        className="font-medium text-[#1d4ed8] hover:underline"
                      >
                        {project.title}
                      </Link>
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          project.status === "TERMINE"
                            ? "bg-green-100 text-green-800"
                            : project.status === "EN_COURS"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {STATUS_LABELS[project.status] ?? project.status}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <AssignAgentProject
                        projectId={project.id}
                        projectTitle={project.title}
                        assignedToId={project.assignedToId ?? null}
                        assignedToName={project.assignedTo?.name ?? null}
                        agents={agents}
                      />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Link
                        href={`/dashboard/projets/${project.id}`}
                        className="text-[#1d4ed8] hover:underline"
                      >
                        Ouvrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tâches du client */}
      <div className="rounded-xl surface-metallic-light shadow-sm">
        <h2 className="border-b border-[#e0e4ea] px-6 py-4 text-lg font-semibold text-black">
          Tâches ({tasks.length})
        </h2>
        {tasks.length === 0 ? (
          <p className="px-6 py-8 text-sm text-black">Aucune tâche pour ce client.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b border-[#e0e4ea] bg-[#f8f9fb] text-black">
                  <th className="px-6 py-3 text-left font-medium">Tâche</th>
                  <th className="px-6 py-3 text-left font-medium">Projet</th>
                  <th className="px-6 py-3 text-left font-medium">Statut</th>
                  <th className="px-6 py-3 text-left font-medium">Agent assigné</th>
                  <th className="px-6 py-3 text-right font-medium">Accès</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="border-b border-[#e0e4ea] hover:bg-[#f8f9fb]">
                    <td className="px-6 py-3">
                      <Link
                        href={`/dashboard/taches/${task.id}`}
                        className="font-medium text-[#1d4ed8] hover:underline"
                      >
                        {task.title}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-black">
                      {task.project ? (
                        <Link
                          href={`/dashboard/projets/${task.project.id}`}
                          className="text-[#1d4ed8] hover:underline"
                        >
                          {task.project.title}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          task.status === "COMPLETE"
                            ? "bg-green-100 text-green-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {TASK_STATUS_LABELS[task.status] ?? task.status}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <AssignAgentTask
                        taskId={task.id}
                        taskTitle={task.title}
                        assignedToId={task.assignedToId ?? null}
                        assignedToName={task.assignedTo?.name ?? null}
                        agents={agents}
                      />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Link
                        href={`/dashboard/taches/${task.id}`}
                        className="text-[#1d4ed8] hover:underline"
                      >
                        Ouvrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
