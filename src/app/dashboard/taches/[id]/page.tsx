import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { TaskDetailClient } from "@/components/tasks/TaskDetailClient";
import { BackLink } from "@/components/ui/BackLink";

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
  const canAccess = isAgence || isAgent || task.clientId === session.user.id;
  if (!canAccess) notFound();

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
          clientReportSentAt: (task as { clientReportSentAt?: Date | null }).clientReportSentAt ?? null,
          category: (task as { category?: string | null }).category ?? null,
          priority: (task as { priority?: string | null }).priority ?? null,
          desiredDate: (task as { desiredDate?: Date | null }).desiredDate ?? null,
          estimatedActions: (task as { estimatedActions?: number | null }).estimatedActions ?? null,
          missionType: (task as { missionType?: string | null }).missionType ?? null,
          assignedTo: task.assignedTo ?? null,
          client: task.client,
          project: task.project ?? null,
          documents: task.documents ?? [],
        }}
        canEdit={canEdit}
        isAgence={isAgence}
        isAgent={isAgent}
        agents={agents}
      />
    </div>
  );
}
