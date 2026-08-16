import { redirect } from "next/navigation";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import { assertDashboardHrefAllowed } from "@/lib/equipe-acces/assert-dashboard-access";
import {
  canAccessAnnualContracts,
  canViewAnnualContractFinancials,
  resolveAnnualContractsOrgId,
} from "@/lib/annual-contracts/access";
import { loadAnnualContractsBoard } from "@/lib/annual-contracts/load-board";
import { AnnualContractsWorkspace } from "@/components/annual-contracts/AnnualContractsWorkspace";

export const dynamic = "force-dynamic";

export default async function ContratsAnnuelsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; year?: string; contract?: string }>;
}) {
  const session = await getCachedServerSession();
  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard/contrats-annuels");
  }

  if (!canAccessAnnualContracts(session.user)) {
    redirect("/dashboard");
  }

  assertDashboardHrefAllowed({
    href: "/dashboard/contrats-annuels",
    personType: session.user.personType,
    permissionProfile: session.user.permissionProfile,
  });

  const orgId = await resolveAnnualContractsOrgId(session.user);
  if (!orgId) {
    redirect("/dashboard");
  }

  const sp = await searchParams;
  const viewRaw = sp.view ?? "piloter";
  const view =
    viewRaw === "planning" || viewRaw === "portefeuille" ? viewRaw : "piloter";
  const year = sp.year ? Number(sp.year) : undefined;

  const board = await loadAnnualContractsBoard({
    organizationId: orgId,
    includeFinancials: canViewAnnualContractFinancials(session.user),
    year: Number.isFinite(year) ? year : undefined,
  });

  return (
    <AnnualContractsWorkspace
      initialBoard={board}
      initialView={view}
      focusContractId={sp.contract ?? null}
    />
  );
}
