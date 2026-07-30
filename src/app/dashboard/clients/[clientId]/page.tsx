import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { AssignAgentProject } from "@/components/clients/AssignAgentProject";
import { AssignAgentTask } from "@/components/clients/AssignAgentTask";
import { DeleteClientButton } from "@/components/clients/DeleteClientButton";
import { ClientCreditsBadge } from "@/components/clients/ClientCreditsBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { KpiTile } from "@/components/ui/KpiTile";
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableRow,
  DataTableTd,
  DataTableTh,
} from "@/components/ui/DataTable";
import {
  chantierStatusBadgeTone,
  chantierStatusLabel,
} from "@/lib/chantier-lifecycle";

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

  let client: {
    id: string;
    name: string;
    email: string;
    company: string | null;
    phone: string | null;
    formeJuridique: string | null;
    secteurActivite: string | null;
  } | null = null;
  let projects: {
    id: string;
    title: string;
    status: string;
    chantierStatus: string;
    assignedToId: string | null;
    assignedTo: { id: string; name: string; email: string } | null;
  }[] = [];
  let tasks: {
    id: string;
    title: string;
    status: string;
    assignedToId: string | null;
    project: { id: string; title: string } | null;
    assignedTo: { id: string; name: string; email: string } | null;
  }[] = [];
  let agents: { id: string; name: string; email: string }[] = [];

  try {
    const clientUser = await prisma.user.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        phone: true,
        formeJuridique: true,
        secteurActivite: true,
        role: true,
      },
    });
    if (!clientUser) {
      notFound();
    }
    client = {
      id: clientUser.id,
      name: clientUser.name,
      email: clientUser.email,
      company: clientUser.company,
      phone: clientUser.phone,
      formeJuridique: clientUser.formeJuridique,
      secteurActivite: clientUser.secteurActivite,
    };

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

  const openTasks = tasks.filter((t) => t.status !== "COMPLETE").length;

  return (
    <div className="space-y-6">
      <BackLink href="/dashboard/clients">Retour aux clients</BackLink>

      <PageHeader
        eyebrow="Portefeuille client"
        title={client.company ?? client.name}
        description={[
          client.name !== client.company ? client.name : null,
          client.email,
          client.phone ? `Tél. ${client.phone}` : null,
          client.formeJuridique,
          client.secteurActivite,
        ]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <>
            <Link href={`/dashboard/taches?clientId=${client.id}&creerMission=1`} className="btn-cc-primary">
              + Créer une mission
            </Link>
            <DeleteClientButton
              clientId={client.id}
              clientName={client.name}
              projectsCount={projects.length}
              tasksCount={tasks.length}
              label="Supprimer ce client"
              className="px-3 py-1.5 text-sm"
            />
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiTile label="Chantiers" value={projects.length} href={`/dashboard/projets`} />
        <KpiTile label="Missions ouvertes" value={openTasks} tone={openTasks > 0 ? "watch" : "ok"} />
        <KpiTile label="Missions totales" value={tasks.length} />
      </div>

      <Card hover={false}>
        <CardHeader title="Crédits & consommation" />
        <div className="max-w-md">
          <ClientCreditsBadge clientId={client.id} />
        </div>
      </Card>

      <Card hover={false} className="!p-0 overflow-hidden">
        <div className="border-b border-[color:var(--cc-chrome-border)] px-5 py-4">
          <h2 className="font-heading text-lg font-bold text-bework-ink">Chantiers ({projects.length})</h2>
        </div>
        {projects.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Aucun chantier" description="Aucun projet pour ce client." />
          </div>
        ) : (
          <DataTable minWidth="560px" className="!rounded-none !border-0 !shadow-none">
            <DataTableHead>
              <DataTableTh>Projet</DataTableTh>
              <DataTableTh>Statut</DataTableTh>
              <DataTableTh>Agent assigné</DataTableTh>
              <DataTableTh align="right">Accès</DataTableTh>
            </DataTableHead>
            <DataTableBody>
              {projects.map((project) => (
                <DataTableRow key={project.id}>
                  <DataTableTd>
                    <Link
                      href={`/dashboard/projets/${project.id}`}
                      className="font-semibold text-bework-navy hover:underline"
                    >
                      {project.title}
                    </Link>
                  </DataTableTd>
                  <DataTableTd>
                    <Badge tone={chantierStatusBadgeTone(project.chantierStatus)}>
                      {chantierStatusLabel(project.chantierStatus)}
                    </Badge>
                  </DataTableTd>
                  <DataTableTd>
                    <AssignAgentProject
                      projectId={project.id}
                      projectTitle={project.title}
                      assignedToId={project.assignedToId ?? null}
                      assignedToName={project.assignedTo?.name ?? null}
                      agents={agents}
                    />
                  </DataTableTd>
                  <DataTableTd align="right">
                    <Link
                      href={`/dashboard/projets/${project.id}`}
                      className="text-xs font-semibold text-bework-navy hover:underline"
                    >
                      Ouvrir
                    </Link>
                  </DataTableTd>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        )}
      </Card>

      <Card hover={false} className="!p-0 overflow-hidden">
        <div className="border-b border-[color:var(--cc-chrome-border)] px-5 py-4">
          <h2 className="font-heading text-lg font-bold text-bework-ink">Missions ({tasks.length})</h2>
        </div>
        {tasks.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Aucune mission" description="Aucune tâche pour ce client." />
          </div>
        ) : (
          <DataTable minWidth="640px" className="!rounded-none !border-0 !shadow-none">
            <DataTableHead>
              <DataTableTh>Mission</DataTableTh>
              <DataTableTh>Chantier</DataTableTh>
              <DataTableTh>Statut</DataTableTh>
              <DataTableTh>Agent assigné</DataTableTh>
              <DataTableTh align="right">Accès</DataTableTh>
            </DataTableHead>
            <DataTableBody>
              {tasks.map((task) => (
                <DataTableRow key={task.id}>
                  <DataTableTd>
                    <Link
                      href={`/dashboard/taches/${task.id}`}
                      className="font-semibold text-bework-navy hover:underline"
                    >
                      {task.title}
                    </Link>
                  </DataTableTd>
                  <DataTableTd>
                    {task.project ? (
                      <Link
                        href={`/dashboard/projets/${task.project.id}`}
                        className="text-bework-navy hover:underline"
                      >
                        {task.project.title}
                      </Link>
                    ) : (
                      <span className="text-bework-muted">—</span>
                    )}
                  </DataTableTd>
                  <DataTableTd>
                    <Badge tone={task.status === "COMPLETE" ? "ok" : "neutral"}>
                      {TASK_STATUS_LABELS[task.status] ?? task.status}
                    </Badge>
                  </DataTableTd>
                  <DataTableTd>
                    <AssignAgentTask
                      taskId={task.id}
                      taskTitle={task.title}
                      assignedToId={task.assignedToId ?? null}
                      assignedToName={task.assignedTo?.name ?? null}
                      agents={agents}
                    />
                  </DataTableTd>
                  <DataTableTd align="right">
                    <Link
                      href={`/dashboard/taches/${task.id}`}
                      className="text-xs font-semibold text-bework-navy hover:underline"
                    >
                      Ouvrir
                    </Link>
                  </DataTableTd>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        )}
      </Card>
    </div>
  );
}
