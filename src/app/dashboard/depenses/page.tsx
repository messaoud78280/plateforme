import { redirect } from "next/navigation";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import {
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import { loadExpensesWorkspace } from "@/lib/chantier/expenses-workspace";
import type {
  ExpensesPeriod,
  ExpensesSort,
  ExpensesView,
} from "@/lib/chantier/expenses-workspace";
import { ExpensesWorkspace } from "@/components/chantier/ExpensesWorkspace";
import { assertDashboardHrefAllowed } from "@/lib/equipe-acces/assert-dashboard-access";
import { canAccessDashboardHref } from "@/lib/equipe-acces/dashboard-policy";

export const dynamic = "force-dynamic";

const VIEWS: ExpensesView[] = [
  "all",
  "to_control",
  "with_po",
  "without_po",
  "with_variance",
];
const SORTS: ExpensesSort[] = [
  "recent",
  "oldest",
  "amount_desc",
  "amount_asc",
  "supplier",
  "project",
  "variance",
  "created",
];
const PERIODS: ExpensesPeriod[] = [
  "month",
  "this_month",
  "prev_month",
  "quarter",
  "year",
  "all",
];

export default async function DepensesPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    q?: string;
    sort?: string;
    period?: string;
    projectId?: string;
    supplierId?: string;
    purchaseOrderId?: string;
    category?: string;
  }>;
}) {
  const session = await getCachedServerSession();
  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard/depenses");
  }
  if (!isInternalPurchaseOrderActor(session.user)) {
    redirect("/dashboard");
  }
  assertDashboardHrefAllowed({
    href: "/dashboard/depenses",
    personType: session.user.personType,
    permissionProfile: session.user.permissionProfile,
  });
  const orgId = await resolvePurchaseOrderOrgId(session.user);
  if (!orgId) redirect("/dashboard");

  const sp = await searchParams;
  // Ancien onglet « Ce mois » → période globale
  const viewRaw = sp.view === "this_month" ? "all" : sp.view;
  const view = (VIEWS.includes(viewRaw as ExpensesView) ? viewRaw : "all") as ExpensesView;
  const sort = (SORTS.includes(sp.sort as ExpensesSort) ? sp.sort : "recent") as ExpensesSort;
  const periodRaw =
    sp.view === "this_month" && !sp.period
      ? "month"
      : PERIODS.includes(sp.period as ExpensesPeriod)
        ? (sp.period as ExpensesPeriod)
        : "month";
  const period = (periodRaw === "this_month" ? "month" : periodRaw) as ExpensesPeriod;

  const { rows, summary } = await loadExpensesWorkspace({
    organizationId: orgId,
    period,
    projectId: sp.projectId?.trim() || null,
    supplierId: sp.supplierId?.trim() || null,
    purchaseOrderId: sp.purchaseOrderId?.trim() || null,
  });

  return (
    <ExpensesWorkspace
      rows={rows}
      summary={summary}
      canOpenSupplier={canAccessDashboardHref(
        "/dashboard/fournisseurs",
        session.user.personType,
        session.user.permissionProfile,
      )}
      initialView={view}
      initialQ={typeof sp.q === "string" ? sp.q : ""}
      initialSort={sort}
      initialPeriod={period === "this_month" ? "month" : period}
      initialProjectId={sp.projectId?.trim() || ""}
      initialSupplierId={sp.supplierId?.trim() || ""}
      initialPurchaseOrderId={sp.purchaseOrderId?.trim() || ""}
      initialCategory={sp.category?.trim() || ""}
    />
  );
}
