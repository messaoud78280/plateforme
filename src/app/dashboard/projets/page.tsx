import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { ChantierStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CreateChantierForm } from "@/components/chantier/CreateChantierForm";
import { ChantierProjectsList } from "@/components/chantier/ChantierProjectsList";
import { BackLink } from "@/components/ui/BackLink";
import { canDeleteChantierProject, isChantierStaff } from "@/lib/chantier-dossier/access";
import { CHANTIER_STATUS_LABELS } from "@/lib/chantier-dossier/constants";

const CHANTIER_STATUSES: ChantierStatus[] = ["ETUDE", "EN_COURS", "EN_ATTENTE", "RECEPTION", "TERMINE"];

export default async function ProjetsPage({
  searchParams,
}: {
  searchParams: Promise<{ recherche?: string; statut?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard");
  }

  const staff = isChantierStaff(session.user.role);
  const params = await searchParams;
  const search = (params.recherche ?? "").trim().toLowerCase();
  const statusFilter = params.statut;
  const validChantierStatus: ChantierStatus | undefined =
    statusFilter && CHANTIER_STATUSES.includes(statusFilter as ChantierStatus)
      ? (statusFilter as ChantierStatus)
      : undefined;

  const whereProject = staff
    ? session.user.role === "AGENT"
      ? { assignedToId: session.user.id }
      : {}
    : { clientId: session.user.id };

  const where = {
    ...whereProject,
    ...(validChantierStatus ? { chantierStatus: validChantierStatus } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
            { siteCity: { contains: search, mode: "insensitive" as const } },
            { siteAddress: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [projects, counts, clients, missingTotal] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        client: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        _count: { select: { chantierFiles: true, messages: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.project.groupBy({
      by: ["chantierStatus"],
      _count: true,
      where: whereProject,
    }),
    staff
      ? prisma.user.findMany({
          where: { role: "CLIENT" },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
          take: 200,
        })
      : Promise.resolve([]),
    prisma.chantierFile.count({
      where: {
        status: { in: ["MANQUANT", "A_RELANCER"] },
        project: whereProject,
      },
    }),
  ]);

  const total = counts.reduce((acc, c) => acc + c._count, 0);
  const byStatus = Object.fromEntries(counts.map((c) => [c.chantierStatus, c._count]));

  return (
    <div className="space-y-8">
      <BackLink href="/dashboard">Tableau de bord</BackLink>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dossiers chantier</h1>
          <p className="mt-1 text-slate-600">
            {staff
              ? "Classeur numérique par chantier : devis, contrats, planning, DOE…"
              : "Vos chantiers et documents classés par rubrique."}
          </p>
        </div>
        <Link
          href="/dashboard/projets/manquants"
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            missingTotal > 0
              ? "border border-red-200 bg-red-50 text-red-800"
              : "border border-slate-200 bg-white text-slate-700"
          }`}
        >
          Pièces manquantes ({missingTotal})
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl surface-metallic-light p-4">
          <p className="text-2xl font-bold text-slate-800">{total}</p>
          <p className="text-sm text-slate-500">Chantiers</p>
        </div>
        {(["EN_COURS", "ETUDE", "EN_ATTENTE", "RECEPTION"] as const).map((s) => (
          <div key={s} className="rounded-xl surface-metallic-light p-4">
            <p className="text-2xl font-bold text-slate-800">{byStatus[s] ?? 0}</p>
            <p className="text-sm text-slate-500">{CHANTIER_STATUS_LABELS[s]}</p>
          </div>
        ))}
      </div>

      <CreateChantierForm clients={clients} showClientPicker={staff && session.user.role !== "AGENT"} />

      <div className="flex flex-wrap items-center gap-3">
        <form method="get" className="flex min-w-0 flex-1 gap-2 sm:min-w-[200px]">
          <input
            type="search"
            name="recherche"
            defaultValue={params.recherche ?? ""}
            placeholder="Rechercher chantier, ville, adresse…"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {params.statut ? <input type="hidden" name="statut" value={params.statut} /> : null}
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
              !validChantierStatus ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Tous
          </Link>
          {CHANTIER_STATUSES.map((s) => (
            <Link
              key={s}
              href={`/dashboard/projets?statut=${s}${params.recherche ? `&recherche=${encodeURIComponent(params.recherche)}` : ""}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                validChantierStatus === s ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {CHANTIER_STATUS_LABELS[s]}
            </Link>
          ))}
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-slate-600">
            {search || validChantierStatus ? "Aucun chantier ne correspond aux critères." : "Aucun chantier pour le moment."}
          </p>
        </div>
      ) : (
        <ChantierProjectsList
          projects={projects.map((project) => ({
            id: project.id,
            title: project.title,
            siteAddress: project.siteAddress,
            siteCity: project.siteCity,
            internalManager: project.internalManager,
            chantierStatus: project.chantierStatus,
            updatedAt: project.updatedAt.toISOString(),
            chantierFilesCount: project._count.chantierFiles,
            clientName: staff ? project.client.name : undefined,
            canDelete: canDeleteChantierProject(session.user, project),
          }))}
        />
      )}
    </div>
  );
}
