import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { MessageForm } from "@/components/MessageForm";
import { ProjectAssignAgent } from "@/components/projects/ProjectAssignAgent";
import { ProjectPpspsSection } from "@/components/projects/ProjectPpspsSection";
import { ProjectReportsSection } from "@/components/projects/ProjectReportsSection";
import { ChantierDossierSection } from "@/components/chantier/ChantierDossierSection";
import { canAccessBeWorkSkills } from "@/lib/be-work-skills-access";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
import { ensureChantierFolders } from "@/lib/chantier-dossier/folders";
import {
  CHANTIER_STATUS_COLORS,
  CHANTIER_STATUS_LABELS,
  CHANTIER_MISSING_STATUSES,
} from "@/lib/chantier-dossier/constants";

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

  const access = await canAccessChantierProject(session.user, id);
  if (!access.ok) notFound();

  await ensureChantierFolders(id);

  const [chantierFolders, missingCount] = await Promise.all([
    prisma.chantierFolder.findMany({
      where: { projectId: id },
      orderBy: { sortOrder: "asc" },
      include: {
        files: {
          orderBy: { createdAt: "desc" },
          include: { addedBy: { select: { name: true } } },
        },
      },
    }),
    prisma.chantierFile.count({
      where: { projectId: id, status: { in: CHANTIER_MISSING_STATUSES } },
    }),
  ]);

  const dossierFolders = chantierFolders.map((folder) => ({
    id: folder.id,
    code: folder.code,
    label: folder.label,
    files: folder.files.map((f) => ({
      id: f.id,
      name: f.name,
      fileUrl: f.fileUrl,
      mimeType: f.mimeType,
      documentType: f.documentType,
      status: f.status,
      comment: f.comment,
      createdAt: f.createdAt.toISOString(),
      addedBy: f.addedBy,
    })),
  }));

  const projectActionsUsed = actionsConsumed._sum.actionsUsed ?? 0;
  const clientTotal = project?.client && "monthlyActionsTotal" in project.client ? (project.client as { monthlyActionsTotal: number }).monthlyActionsTotal : 0;
  const clientUsed = project?.client && "monthlyActionsUsed" in project.client ? (project.client as { monthlyActionsUsed: number }).monthlyActionsUsed : 0;
  const clientRemaining = Math.max(0, clientTotal - clientUsed);

  const isAgence = session.user.role === "AGENCE" || session.user.role === "MANAGER";
  const canEditDossier =
    isAgence ||
    session.user.role === "AGENT" ||
    project.clientId === session.user.id;

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
      <BackLink href="/dashboard/projets">Retour aux chantiers</BackLink>

      <div className="flex flex-wrap gap-3">
        <a href="#dossier-chantier" className="rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e40af]">
          Ouvrir le dossier
        </a>
        {missingCount > 0 ? (
          <Link
            href={`/dashboard/projets/manquants?chantier=${encodeURIComponent(id)}`}
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100"
          >
            {missingCount} pièce{missingCount > 1 ? "s" : ""} à récupérer
          </Link>
        ) : null}
      </div>

      <div className="rounded-xl surface-metallic-light p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{project.title}</h1>
            {project.description && (
              <p className="mt-2 text-slate-600">{project.description}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span>Client : {project.client.name}</span>
              {project.siteCity ? <span>{project.siteCity}</span> : null}
              {project.internalManager ? (
                <span>Responsable : {project.internalManager}</span>
              ) : null}
              {project.assignedTo && (
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-medium text-blue-800">
                  {isAgence ? "Agent : " : "Référent : "}{project.assignedTo.name}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${CHANTIER_STATUS_COLORS[project.chantierStatus] ?? "bg-slate-100 text-slate-800"}`}
            >
              {CHANTIER_STATUS_LABELS[project.chantierStatus] ?? project.chantierStatus}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${urgencyColors[project.urgency] ?? "bg-slate-100 text-slate-800"}`}
            >
              Urgence : {urgencyLabels[project.urgency] ?? project.urgency}
            </span>
          </div>
        </div>

        {isAgence ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <span className="rounded-full bg-[#1d4ed8]/10 px-3 py-1 font-medium text-[#1d4ed8]">
              Actions consommées (BeWork) : {projectActionsUsed}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
              Client : {clientUsed}/{clientTotal} actions (mois)
            </span>
            <span className="rounded-full bg-green-100 px-3 py-1 font-medium text-green-800">
              Restant : {clientRemaining}
            </span>
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-3">
          {project.siteAddress ? (
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Adresse chantier</p>
              <p className="text-slate-800">{project.siteAddress}</p>
            </div>
          ) : null}
          {project.plannedStartDate ? (
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Démarrage prévu</p>
              <p className="text-slate-800">{new Date(project.plannedStartDate).toLocaleDateString("fr-FR")}</p>
            </div>
          ) : project.dateSouhaitee ? (
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Date souhaitée (début)</p>
              <p className="text-slate-800">{new Date(project.dateSouhaitee).toLocaleDateString("fr-FR")}</p>
            </div>
          ) : null}
          {project.plannedEndDate ? (
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Fin prévue</p>
              <p className="text-slate-800">{new Date(project.plannedEndDate).toLocaleDateString("fr-FR")}</p>
            </div>
          ) : project.deadline ? (
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Deadline</p>
              <p className="text-slate-800">{new Date(project.deadline).toLocaleDateString("fr-FR")}</p>
            </div>
          ) : null}
          {project.signedQuoteAmount != null ? (
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Devis signé</p>
              <p className="font-semibold text-slate-800">
                {Number(project.signedQuoteAmount).toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                  maximumFractionDigits: 0,
                })}{" "}
                HT
              </p>
            </div>
          ) : null}
        </div>

        {project.notes && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-xs font-medium uppercase text-slate-500">Instructions / détails importants</p>
            <p className="mt-1 whitespace-pre-wrap text-slate-700">{project.notes}</p>
          </div>
        )}
      </div>

      <ChantierDossierSection projectId={id} folders={dossierFolders} canEdit={canEditDossier} />

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

      {canAccessBeWorkSkills(session.user.role) ? (
        <ProjectPpspsSection projectId={project.id} projectTitle={project.title} />
      ) : null}

      {project.documents.length > 0 && (
        <div className="rounded-xl surface-metallic-light p-6">
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

      <div className="rounded-xl surface-metallic-light p-6">
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
          client={project.client ? { id: project.client.id, name: project.client.name } : undefined}
          isAgence={isAgence}
          sessionUserId={session.user.id}
        />
      </div>
    </div>
  );
}
