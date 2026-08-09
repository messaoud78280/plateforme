import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { ChantierStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CreateChantierForm } from "@/components/chantier/CreateChantierForm";
import { ChantierProjectsList } from "@/components/chantier/ChantierProjectsList";
import { BackLink } from "@/components/ui/BackLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiTile } from "@/components/ui/KpiTile";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterBar, FilterChip } from "@/components/ui/FilterBar";
import { canDeleteChantierProject, isChantierStaff } from "@/lib/chantier-dossier/access";
import { CHANTIER_STATUS_LABELS } from "@/lib/chantier-dossier/constants";
import { projectWhereForClientUser } from "@/lib/organization/access";
import { assertDashboardHrefAllowed } from "@/lib/equipe-acces/assert-dashboard-access";

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

  assertDashboardHrefAllowed({
    href: "/dashboard/projets",
    personType: session.user.personType,
    permissionProfile: session.user.permissionProfile,
  });

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
    : await projectWhereForClientUser(session.user.id);

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
    <div className="space-y-6">
      <BackLink href="/dashboard">Tableau de bord</BackLink>
      <PageHeader
        eyebrow="Classeur numérique"
        title="Dossiers chantier"
        description={
          staff
            ? "Classeur numérique par chantier : devis, contrats, planning, DOE…"
            : "Vos chantiers et documents classés par rubrique."
        }
        actions={
          <Link
            href="/dashboard/projets/manquants"
            className={
              missingTotal > 0
                ? "btn-cc-danger"
                : "btn-cc-secondary"
            }
          >
            Pièces manquantes ({missingTotal})
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiTile label="Chantiers" value={total} href="/dashboard/projets" />
        {(["EN_COURS", "ETUDE", "EN_ATTENTE", "RECEPTION"] as const).map((s) => (
          <KpiTile
            key={s}
            label={CHANTIER_STATUS_LABELS[s]}
            value={byStatus[s] ?? 0}
            href={`/dashboard/projets?statut=${s}`}
            tone={s === "EN_ATTENTE" ? "watch" : "neutral"}
          />
        ))}
      </div>

      <CreateChantierForm clients={clients} showClientPicker={staff && session.user.role !== "AGENT"} />

      <FilterBar>
        <label className="min-w-0 flex-1 text-xs">
          <span className="mb-1 block font-semibold text-bework-muted">Recherche</span>
          <input
            type="search"
            name="recherche"
            defaultValue={params.recherche ?? ""}
            placeholder="Chantier, ville, adresse…"
            className="w-full rounded-[var(--cc-radius)] border border-[color:var(--cc-chrome-border)] bg-white px-3 py-2 text-sm focus:border-bework-navy focus:outline-none focus:ring-2 focus:ring-bework-navy/20"
          />
        </label>
        {params.statut ? <input type="hidden" name="statut" value={params.statut} /> : null}
        <button type="submit" className="btn-cc-primary">
          Rechercher
        </button>
        <div className="flex w-full flex-wrap gap-1.5 sm:w-auto">
          <FilterChip
            href={params.recherche ? `/dashboard/projets?recherche=${encodeURIComponent(params.recherche)}` : "/dashboard/projets"}
            active={!validChantierStatus}
          >
            Tous
          </FilterChip>
          {CHANTIER_STATUSES.map((s) => (
            <FilterChip
              key={s}
              href={`/dashboard/projets?statut=${s}${params.recherche ? `&recherche=${encodeURIComponent(params.recherche)}` : ""}`}
              active={validChantierStatus === s}
            >
              {CHANTIER_STATUS_LABELS[s]}
            </FilterChip>
          ))}
        </div>
      </FilterBar>

      {projects.length === 0 ? (
        <EmptyState
          title={search || validChantierStatus ? "Aucun chantier trouvé" : "Aucun chantier pour le moment"}
          description={
            search || validChantierStatus
              ? "Aucun chantier ne correspond aux critères. Modifiez la recherche ou le statut."
              : "Créez un dossier chantier pour classer devis, contrats, plans et DOE."
          }
        />
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
