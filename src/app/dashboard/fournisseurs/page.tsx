import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import { assertDashboardHrefAllowed } from "@/lib/equipe-acces/assert-dashboard-access";
import { SuppliersWorkspace } from "@/components/suppliers/SuppliersWorkspace";
import {
  loadSuppliersWorkspace,
  type SuppliersPeriod,
  type SuppliersSort,
  type SuppliersView,
} from "@/lib/suppliers/suppliers-workspace";

export const dynamic = "force-dynamic";

const VIEWS: SuppliersView[] = [
  "all",
  "active",
  "with_orders",
  "with_deliveries",
  "awaiting_confirm",
  "incomplete",
];
const SORTS: SuppliersSort[] = [
  "name",
  "active",
  "last_order",
  "committed",
  "spent",
  "confirm",
  "deliveries",
  "activity",
];
const PERIODS: SuppliersPeriod[] = ["month", "quarter", "year", "last12", "all"];

export default async function FournisseursPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    q?: string;
    sort?: string;
    period?: string;
    display?: string;
    status?: string;
  }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion?callbackUrl=/dashboard/fournisseurs");
  if (!isInternalPurchaseOrderActor(session.user)) redirect("/dashboard");
  assertDashboardHrefAllowed({
    href: "/dashboard/fournisseurs",
    personType: session.user.personType,
    permissionProfile: session.user.permissionProfile,
  });

  const orgId = await resolvePurchaseOrderOrgId(session.user);
  if (!orgId) redirect("/dashboard");

  const sp = await searchParams;
  const view = (VIEWS.includes(sp.view as SuppliersView) ? sp.view : "all") as SuppliersView;
  const sort = (SORTS.includes(sp.sort as SuppliersSort) ? sp.sort : "name") as SuppliersSort;
  const period = (
    PERIODS.includes(sp.period as SuppliersPeriod) ? sp.period : "month"
  ) as SuppliersPeriod;
  const display = sp.display === "list" ? "list" : "cards";

  const { rows, summary } = await loadSuppliersWorkspace({
    organizationId: orgId,
    period,
  });

  return (
    <SuppliersWorkspace
      rows={rows}
      summary={summary}
      initialView={view}
      initialQ={typeof sp.q === "string" ? sp.q : ""}
      initialSort={sort}
      initialPeriod={period}
      initialDisplay={display}
    />
  );
}
