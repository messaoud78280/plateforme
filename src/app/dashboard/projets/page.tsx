import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { ProjectStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CreateProjectForm } from "@/components/CreateProjectForm";
import { BackLink } from "@/components/ui/BackLink";

const PROJECT_STATUSES: ProjectStatus[] = ["NOUVEAU", "EN_COURS", "EN_ATTENTE", "TERMINE"];

const STATUS_LABELS: Record<string, string> = {
  NOUVEAU: "Nouveau",
  EN_COURS: "En cours",
  EN_ATTENTE: "En attente",
  TERMINE: "Terminé",
};

const URGENCY_LABELS: Record<string, string> = {
  BASSE: "Basse",
  MOYENNE: "Moyenne",
  HAUTE: "Haute",
  URGENTE: "Urgente",
};

export default async function ProjetsPage({
  searchParams,
}: {
  searchParams: Promise<{ recherche?: string; statut?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard");
  }

  const isAgence = session.user.role === "AGENCE" || session.user.role === "MANAGER";
  const params = await searchParams;
  const search = (params.recherche ?? "").trim().toLowerCase();
  const statusFilter = params.statut;
  const validStatus: ProjectStatus | undefined =
    statusFilter && PROJECT_STATUSES.includes(statusFilter as ProjectStatus)
      ? (statusFilter as ProjectStatus)
      : undefined;

  const where = {
    ...(isAgence ? {} : { clientId: session.user.id }),
    ...(validStatus ? { status: validStatus } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [projects, counts] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        client: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    isAgence
      ? prisma.project.groupBy({
          by: ["status"],
          _count: true,
          where: {},
        })
      : prisma.project.groupBy({
          by: ["status"],
          _count: true,
          where: { clientId: session.user.id },
        }),
  ]);

  const total = counts.reduce((acc, c) => acc + c._count, 0);
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count]));

  return (
    <div className="space-y-8">
      <BackLink href="/dashboard">Dashboard</BackLink>
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Projets</h1>
        <p className="mt-1 text-slate-600">
          {isAgence
            ? "Liste de tous les projets clients. Recherchez et filtrez par statut."
            : "Vos projets en cours. Créez un projet pour échanger avec l’agence."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-slate-800">{total}</p>
          <p className="text-sm text-slate-500">Total</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-blue-600">{byStatus.EN_COURS ?? 0}</p>
          <p className="text-sm text-slate-500">En cours</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-amber-600">{byStatus.EN_ATTENTE ?? 0}</p>
          <p className="text-sm text-slate-500">En attente</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-green-600">{byStatus.TERMINE ?? 0}</p>
          <p className="text-sm text-slate-500">Terminés</p>
        </div>
      </div>

      {!isAgence && <CreateProjectForm />}

      {/* Recherche + Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <form method="get" className="flex min-w-0 flex-1 gap-2 sm:min-w-[200px]">
          <input
            type="search"
            name="recherche"
            defaultValue={params.recherche ?? ""}
            placeholder="Rechercher par nom ou description..."
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {params.statut && <input type="hidden" name="statut" value={params.statut} />}
          <button
            type="submit"
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Rechercher
          </button>
        </form>
        <div className="flex flex-wrap gap-1">
          <Link
            href={params.recherche ? `/dashboard/projets?recherche=${encodeURIComponent(params.recherche)}` : "/dashboard/projets"}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              !validStatus ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Tous
          </Link>
          {(["EN_COURS", "EN_ATTENTE", "TERMINE", "NOUVEAU"] as const).map((s) => (
            <Link
              key={s}
              href={`/dashboard/projets?statut=${s}${params.recherche ? `&recherche=${encodeURIComponent(params.recherche)}` : ""}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                validStatus === s ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {STATUS_LABELS[s]}
            </Link>
          ))}
        </div>
      </div>

      {/* Liste */}
      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-slate-600">
            {search || validStatus ? "Aucun projet ne correspond aux critères." : "Aucun projet pour le moment."}
          </p>
          {(search || validStatus) && (
            <Link href="/dashboard/projets" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
              Voir tous les projets
            </Link>
          )}
          {!isAgence && !search && !validStatus && (
            <p className="mt-2 text-sm text-slate-500">Créez votre premier projet ci-dessus.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projets/${project.id}`}
              className="block rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-slate-800">{project.title}</h2>
                  {project.description && (
                    <p className="mt-1 text-sm text-slate-600 line-clamp-2">{project.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span>Modifié le {new Date(project.updatedAt).toLocaleDateString("fr-FR")}</span>
                    <span>{project._count.messages} message{project._count.messages !== 1 ? "s" : ""}</span>
                    {"deadline" in project && project.deadline && (
                      <span>Deadline : {new Date(project.deadline).toLocaleDateString("fr-FR")}</span>
                    )}
                    {isAgence && <span>Client : {project.client.name}</span>}
                    {!isAgence && project.assignedTo && (
                      <span className="font-medium text-slate-700">Référent : {project.assignedTo.name}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {"urgency" in project && project.urgency && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        project.urgency === "URGENTE"
                          ? "bg-red-100 text-red-800"
                          : project.urgency === "HAUTE"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {URGENCY_LABELS[project.urgency] ?? project.urgency}
                    </span>
                  )}
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      project.status === "TERMINE"
                        ? "bg-green-100 text-green-800"
                        : project.status === "EN_COURS"
                          ? "bg-blue-100 text-blue-800"
                          : project.status === "EN_ATTENTE"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {STATUS_LABELS[project.status] ?? project.status}
                  </span>
                  <span className="text-slate-400">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
