import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { MessageForm } from "@/components/MessageForm";
import { ProjectAssignAgent } from "@/components/projects/ProjectAssignAgent";
import { ProjectReportsSection } from "@/components/projects/ProjectReportsSection";

export default async function ProjetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard");
  }

  const [project, actionsConsumed] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        messages: {
          include: { sender: true, receiver: true },
          orderBy: { createdAt: "asc" },
        },
        documents: { orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.task.aggregate({
      where: { projectId: id, actionsUsed: { not: null } },
      _sum: { actionsUsed: true },
    }),
  ]);

  if (!project) notFound();

  const projectActionsUsed = actionsConsumed._sum.actionsUsed ?? 0;

  const isAgence = session.user.role === "AGENCE" || session.user.role === "MANAGER";
  const canAccess =
    isAgence || project.clientId === session.user.id;

  if (!canAccess) notFound();

  let agents: { id: string; name: string; email: string }[] = [];
  if (isAgence) {
    agents = await prisma.user.findMany({
      where: { role: "AGENCE" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
  }

  const urgencyLabels: Record<string, string> = {
    BASSE: "Basse",
    MOYENNE: "Moyenne",
    HAUTE: "Haute",
    URGENTE: "Urgente",
  };
  const urgencyColors: Record<string, string> = {
    BASSE: "bg-slate-100 text-slate-800",
    MOYENNE: "bg-blue-100 text-blue-800",
    HAUTE: "bg-amber-100 text-amber-800",
    URGENTE: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/projets"
        className="text-sm text-blue-600 hover:underline"
      >
        ← Retour aux projets
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{project.title}</h1>
            {project.description && (
              <p className="mt-2 text-slate-600">{project.description}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span>Client : {project.client.name}</span>
              {project.assignedTo && (
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-medium text-blue-800">
                  {isAgence ? "Agent : " : "Référent : "}{project.assignedTo.name}
                </span>
              )}
            </div>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${urgencyColors[project.urgency] ?? "bg-slate-100 text-slate-800"}`}
          >
            Urgence : {urgencyLabels[project.urgency] ?? project.urgency}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          <span className="rounded-full bg-[#1d4ed8]/10 px-3 py-1 font-medium text-[#1d4ed8]">
            Actions consommées par ce projet : {projectActionsUsed}
          </span>
        </div>

        <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
          {project.dateSouhaitee && (
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Date souhaitée (début)</p>
              <p className="text-slate-800">{new Date(project.dateSouhaitee).toLocaleDateString("fr-FR")}</p>
            </div>
          )}
          {project.deadline && (
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Deadline d’exécution</p>
              <p className="text-slate-800">{new Date(project.deadline).toLocaleDateString("fr-FR")}</p>
            </div>
          )}
        </div>

        {project.notes && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-xs font-medium uppercase text-slate-500">Instructions / détails importants</p>
            <p className="mt-1 whitespace-pre-wrap text-slate-700">{project.notes}</p>
          </div>
        )}
      </div>

      {/* Référent (client) ou gestion agent (agence) */}
      <ProjectAssignAgent
          projectId={project.id}
          assignedToId={project.assignedToId ?? null}
          assignedTo={project.assignedTo ?? null}
          agents={agents}
          isAgence={isAgence}
        />

      {/* Reporting hebdomadaire / journalier */}
      <ProjectReportsSection projectId={project.id} isAgence={isAgence} />

      {project.documents.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Pièces jointes ({project.documents.length})</h2>
          <ul className="space-y-2">
            {project.documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <span className="truncate text-sm text-slate-800">{doc.name}</span>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  Télécharger
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Messages</h2>

        <div className="space-y-4">
          {project.messages.length === 0 ? (
            <p className="text-slate-500">Aucun message pour le moment.</p>
          ) : (
            project.messages.map((msg) => {
              const isFromMe = msg.senderId === session.user?.id;
              return (
                <div
                  key={msg.id}
                  className={`rounded-lg p-4 ${
                    isFromMe ? "ml-8 bg-blue-50" : "mr-8 bg-slate-100"
                  }`}
                >
                  <p className="text-sm font-medium text-slate-700">
                    {msg.sender.name} → {msg.receiver.name}
                  </p>
                  <p className="mt-1 text-slate-800">{msg.content}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {new Date(msg.createdAt).toLocaleString("fr-FR")}
                  </p>
                </div>
              );
            })
          )}
        </div>

        <MessageForm
          projectId={project.id}
          clientId={project.clientId}
          isAgence={isAgence}
          sessionUserId={session.user.id}
        />
      </div>
    </div>
  );
}
