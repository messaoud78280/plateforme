import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TaskDetailClient } from "@/components/tasks/TaskDetailClient";
import { BackLink } from "@/components/ui/BackLink";
import { parseClientDeliveryJson, filterDocumentsForClient } from "@/lib/tasks/client-delivery";
import { parseSuppliersJson } from "@/lib/demo-environment/bon-commande";
import { isDemoEmail } from "@/lib/demo-environment/constants";

export default async function TacheDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard");
  }

  let task: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    clientId: string;
    assignedToId: string | null;
    agencyNotes: string | null;
    correctionNote: string | null;
    validatedAt: Date | null;
    timeSpentMinutes: number | null;
    actionsUsed: number | null;
    assignedTo: { id: string; name: string; email: string } | null;
    client: { id: string; name: string };
    project: { id: string; title: string } | null;
    documents: { id: string; name: string; fileUrl: string; fileSize: number; mimeType: string | null; createdAt: Date }[];
  } | null = null;

  let agents: { id: string; name: string; email: string }[] = [];

  try {
    task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, name: true } },
        project: { select: { id: true, title: true } },
        documents: { orderBy: { createdAt: "asc" }, select: { id: true, name: true, fileUrl: true, fileSize: true, mimeType: true, createdAt: true } },
      },
    });
    // Ensure métier fields for BC workflow
    if (task) {
      const extra = await prisma.task.findUnique({
        where: { id },
        select: {
          category: true,
          priority: true,
          desiredDate: true,
          estimatedActions: true,
          missionType: true,
          suppliersJson: true,
          clientReport: true,
          clientReportSentAt: true,
          clientDecision: true,
          creditsDeductedAt: true,
          clientDeliveryJson: true,
          organizationId: true,
        },
      });
      if (extra) Object.assign(task, extra);
    }
    if (session.user.role === "AGENCE" || session.user.role === "MANAGER") {
      agents = await prisma.user.findMany({
        where: { role: { in: ["AGENCE", "AGENT"] } },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      });
    }
  } catch {
    // DB error
  }

  if (!task) notFound();

  const isAgence = session.user.role === "AGENCE" || session.user.role === "MANAGER";
  const isAgent = session.user.role === "AGENT";
  let canAccess = isAgence || isAgent || task.clientId === session.user.id;
  if (!canAccess && session.user.role === "CLIENT") {
    const { getUserOrganizationIds, canClientAccessProject } = await import(
      "@/lib/organization/access"
    );
    const orgIds = await getUserOrganizationIds(session.user.id);
    const taskOrg = (task as { organizationId?: string | null }).organizationId;
    if (taskOrg && orgIds.includes(taskOrg)) {
      canAccess = true;
    } else if (task.project) {
      const project = await prisma.project.findUnique({
        where: { id: task.project.id },
        select: { clientId: true, organizationId: true },
      });
      if (project) canAccess = await canClientAccessProject(session.user.id, project);
    }
  }
  if (!canAccess) notFound();

  const isClientUser = task.clientId === session.user.id;
  const clientReportSentAt = (task as { clientReportSentAt?: Date | null }).clientReportSentAt ?? null;
  const clientDeliveryJson = (task as { clientDeliveryJson?: unknown }).clientDeliveryJson;
  const delivery = parseClientDeliveryJson(clientDeliveryJson);

  let documentsForView = task.documents ?? [];
  if (isClientUser) {
    documentsForView = filterDocumentsForClient(documentsForView, clientReportSentAt, delivery);
  }

  const docIds = documentsForView.map((d) => d.id);
  const chantierLinks =
    docIds.length > 0
      ? await prisma.chantierFile.findMany({
          where: { sourceDocumentId: { in: docIds }, deletedAt: null },
          select: {
            id: true,
            sourceDocumentId: true,
            projectId: true,
          },
        })
      : [];
  const linkByDocId = new Map(
    chantierLinks
      .filter((l): l is typeof l & { sourceDocumentId: string } => Boolean(l.sourceDocumentId))
      .map((l) => [l.sourceDocumentId, l]),
  );
  const documentsWithGed = documentsForView.map((d) => {
    const link = linkByDocId.get(d.id);
    return {
      ...d,
      chantierFileId: link?.id ?? null,
      chantierProjectId: link?.projectId ?? task.project?.id ?? null,
    };
  });

  let clientProjects: { id: string; title: string }[] = [];
  if (!task.project && (isAgence || isAgent)) {
    clientProjects = await prisma.project.findMany({
      where: { clientId: task.clientId },
      select: { id: true, title: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
  }

  const canEdit = isAgence || isAgent || task.clientId === session.user.id;

  return (
    <div className="space-y-6">
      <BackLink href="/dashboard/taches">Retour aux missions</BackLink>

      <TaskDetailClient
        sessionUserId={session.user.id}
        task={{
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status as "NOUVEAU" | "EN_ATTENTE" | "ASSIGNEE" | "EN_ANALYSE" | "EN_COURS" | "EN_ATTENTE_INFO" | "A_VALIDER" | "COMPLETE",
          completedAt: task.completedAt,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          assignedToId: task.assignedToId ?? null,
          agencyNotes: task.agencyNotes ?? null,
          correctionNote: task.correctionNote ?? null,
          validatedAt: task.validatedAt ?? null,
          timeSpentMinutes: task.timeSpentMinutes ?? null,
          actionsUsed: task.actionsUsed ?? null,
          creditsDeductedAt: (task as { creditsDeductedAt?: Date | null }).creditsDeductedAt ?? null,
          clientReport: (task as { clientReport?: string | null }).clientReport ?? null,
          clientReportSentAt: clientReportSentAt ?? null,
          clientDecision: (task as { clientDecision?: string | null }).clientDecision ?? null,
          category: (task as { category?: string | null }).category ?? null,
          priority: (task as { priority?: string | null }).priority ?? null,
          desiredDate: (task as { desiredDate?: Date | null }).desiredDate ?? null,
          estimatedActions: (task as { estimatedActions?: number | null }).estimatedActions ?? null,
          missionType: (task as { missionType?: string | null }).missionType ?? null,
          suppliersJson: parseSuppliersJson((task as { suppliersJson?: unknown }).suppliersJson),
          assignedTo: task.assignedTo ?? null,
          client: task.client,
          project: task.project ?? null,
          documents: documentsWithGed,
        }}
        canEdit={canEdit}
        isAgence={isAgence}
        isAgent={isAgent}
        agents={agents}
        clientProjects={clientProjects}
        isDemo={Boolean(session.user.isDemo || isDemoEmail(session.user.email))}
      />
    </div>
  );
}
