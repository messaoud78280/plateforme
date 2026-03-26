import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isAgenceOrManager } from "@/types";
import { SimulationController } from "@/components/simulation/SimulationController";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";

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
    <div className="space-y-8">
      <BackLink href="/dashboard">Dashboard</BackLink>
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Simulation BelleVie</h1>
        <p className="mt-1 text-slate-600">
          Testez les workflows de la plateforme avec le scénario BelleVie Cosmétiques.
        </p>
      </div>

      {!project ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="font-semibold text-amber-800">Données manquantes</h2>
          <p className="mt-2 text-sm text-amber-900">
            Exécutez le script SQL <code className="rounded bg-amber-100 px-1">prisma/supabase-simulation-tables.sql</code> dans
            Supabase, puis lancez :
          </p>
          <pre className="mt-3 rounded-lg bg-slate-800 p-4 text-sm text-slate-100">
            npm run db:seed:simulation
          </pre>
          <p className="mt-2 text-sm text-amber-800">
            Cela crée Sophie Mercier (client), Laure Olivie (gérante), Amina Benali (agent) et le projet BelleVie.
          </p>
        </div>
      ) : (
        <>
          <SimulationController projectId={project.id} />

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl surface-metallic-light p-6">
              <h2 className="mb-4 font-semibold text-slate-800">Projet BelleVie</h2>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-slate-500">Client</dt>
                  <dd className="font-medium text-slate-800">
                    {project.client.name} — {project.client.company}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Agent assigné</dt>
                  <dd className="font-medium text-slate-800">{project.assignedTo?.name ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Statistiques</dt>
                  <dd className="text-slate-700">
                    {project._count.tasks} tâches · {project._count.messages} messages ·{" "}
                    {project._count.documents} documents
                  </dd>
                </div>
              </dl>
              <Link
                href={`/dashboard/projets/${project.id}`}
                className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
              >
                Voir le projet →
              </Link>
            </div>

            <div className="rounded-xl surface-metallic-light p-6">
              <h2 className="mb-4 font-semibold text-slate-800">Activités récentes</h2>
              {recentActivities.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Aucune activité. Lancez un jour de simulation pour générer des événements.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {recentActivities.map((a) => (
                    <li key={a.id} className="flex gap-2 border-b border-slate-100 pb-2 last:border-0">
                      <span className="text-slate-500">
                        {new Date(a.createdAt).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="text-slate-800">{a.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
