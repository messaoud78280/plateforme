import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isAgenceOrManager } from "@/types";
import { SimulationController } from "@/components/simulation/SimulationController";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function SimulationPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard/simulation");
  }
  if (!isAgenceOrManager(session.user.role)) {
    redirect("/dashboard");
  }

  const project = await prisma.project.findFirst({
    where: { title: { contains: "BelleVie" } },
    include: {
      client: { select: { name: true, company: true } },
      assignedTo: { select: { name: true } },
      _count: { select: { tasks: true, messages: true, documents: true } },
    },
  });

  const recentActivities = await prisma.activity.findMany({
    where: { projectId: project?.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="space-y-6">
      <BackLink href="/dashboard">Tableau de bord</BackLink>
      <PageHeader
        eyebrow="Bac à sable"
        title="Simulation BelleVie"
        description="Testez les workflows de la plateforme avec le scénario BelleVie Cosmétiques."
      />

      {!project ? (
        <Alert tone="watch" title="Données manquantes">
          <p>
            Exécutez le script SQL{" "}
            <code className="rounded bg-amber-100/80 px-1">prisma/supabase-simulation-tables.sql</code> dans Supabase,
            puis lancez :
          </p>
          <pre className="mt-3 overflow-x-auto rounded-[var(--cc-radius)] bg-bework-ink p-4 text-sm text-white">
            npm run db:seed:simulation
          </pre>
          <p className="mt-2">
            Cela crée Sophie Mercier (client), Laure Olivie (gérante), Amina Benali (agent) et le projet BelleVie.
          </p>
        </Alert>
      ) : (
        <>
          <SimulationController projectId={project.id} />

          <div className="grid gap-4 lg:grid-cols-2">
            <Card hover={false}>
              <CardHeader title="Projet BelleVie" />
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-bework-muted">Client</dt>
                  <dd className="font-medium text-bework-ink">
                    {project.client.name} — {project.client.company}
                  </dd>
                </div>
                <div>
                  <dt className="text-bework-muted">Agent assigné</dt>
                  <dd className="font-medium text-bework-ink">{project.assignedTo?.name ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-bework-muted">Statistiques</dt>
                  <dd className="text-bework-ink/80">
                    {project._count.tasks} tâches · {project._count.messages} messages · {project._count.documents}{" "}
                    documents
                  </dd>
                </div>
              </dl>
              <Link
                href={`/dashboard/projets/${project.id}`}
                className="mt-4 inline-block text-sm font-semibold text-bework-navy hover:underline"
              >
                Voir le projet →
              </Link>
            </Card>

            <Card hover={false}>
              <CardHeader title="Activités récentes" />
              {recentActivities.length === 0 ? (
                <EmptyState
                  title="Aucune activité"
                  description="Lancez un jour de simulation pour générer des événements."
                />
              ) : (
                <ul className="space-y-2 text-sm">
                  {recentActivities.map((a) => (
                    <li
                      key={a.id}
                      className="flex gap-2 border-b border-[color:var(--cc-chrome-border)] pb-2 last:border-0"
                    >
                      <span className="shrink-0 text-bework-muted">
                        {new Date(a.createdAt).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="text-bework-ink">{a.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
