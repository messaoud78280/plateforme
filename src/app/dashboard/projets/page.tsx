import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { ChantierStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CreateChantierForm } from "@/components/chantier/CreateChantierForm";
import { ChantiersPortfolioList } from "@/components/chantier/ChantiersPortfolioList";
import { PageHeader } from "@/components/ui/PageHeader";
import { isChantierStaff } from "@/lib/chantier-dossier/access";
import { projectWhereForClientUser } from "@/lib/organization/access";
import { assertDashboardHrefAllowed } from "@/lib/equipe-acces/assert-dashboard-access";
import { loadProjectsPortfolio } from "@/lib/chantier/portfolio";

const CHANTIER_STATUSES: ChantierStatus[] = [
  "ETUDE",
  "EN_COURS",
  "EN_ATTENTE",
  "RECEPTION",
  "TERMINE",
];

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
  const search = (params.recherche ?? "").trim();
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

  const [portfolio, clients] = await Promise.all([
    loadProjectsPortfolio({
      user: {
        id: session.user.id,
        role: session.user.role,
        personType: session.user.personType,
        permissionProfile: session.user.permissionProfile,
      },
      whereProject,
      search: search || undefined,
      statusFilter: validChantierStatus,
    }),
    staff
      ? prisma.user.findMany({
          where: { role: "CLIENT" },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
          take: 200,
        })
      : Promise.resolve([]),
  ]);

  const { rows, summary } = portfolio;

  const summaryParts = [
    `${summary.total} chantier${summary.total !== 1 ? "s" : ""}`,
    summary.enCours > 0 ? `${summary.enCours} en cours` : null,
    summary.etude > 0 ? `${summary.etude} étude${summary.etude > 1 ? "s" : ""}` : null,
    summary.enAttente > 0 ? `${summary.enAttente} en attente` : null,
  ].filter(Boolean);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Chantiers"
        description="Repérez immédiatement les chantiers qui demandent votre attention."
        actions={
          <CreateChantierForm
            clients={clients}
            showClientPicker={staff && session.user.role !== "AGENT"}
          />
        }
      />

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[13px] text-bework-muted">
        <p className="text-slate-500">{summaryParts.join(" · ")}</p>
        {summary.withAttention > 0 ? (
          <span className="font-semibold text-amber-900">
            {summary.withAttention} à surveiller
          </span>
        ) : null}
        {summary.missingPieces > 0 ? (
          <Link
            href="/dashboard/projets/manquants"
            className="font-semibold text-amber-800 hover:underline"
          >
            {summary.missingPieces} pièce{summary.missingPieces > 1 ? "s" : ""} manquante
            {summary.missingPieces > 1 ? "s" : ""}
          </Link>
        ) : null}
      </div>

      <ChantiersPortfolioList
        rows={rows}
        initialSearch={search}
        initialStatus={validChantierStatus ?? ""}
        canCreate={staff || session.user.role === "CLIENT"}
      />
    </div>
  );
}
