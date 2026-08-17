import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { refreshCommercialOverdueStatuses } from "@/lib/commercial/collections";
import {
  listInvoicesWorkspace,
  loadInvoicesWorkspaceKpis,
  type InvoicesSort,
  type InvoicesViewFilter,
} from "@/lib/commercial/invoices-workspace";
import { InvoicesWorkspace } from "@/components/commercial/InvoicesWorkspace";
import type { CommercialInvoiceType } from "@prisma/client";

export const dynamic = "force-dynamic";

const VIEWS: InvoicesViewFilter[] = [
  "all",
  "drafts",
  "to_issue",
  "issued",
  "partial",
  "paid",
  "overdue",
  "open",
];

const SORTS: InvoicesSort[] = [
  "recent",
  "oldest",
  "due_asc",
  "amount_desc",
  "amount_asc",
  "due_amount_desc",
  "client_az",
];

export default async function FacturesPage({
  searchParams,
}: {
  searchParams: Promise<{
    quoteId?: string;
    projectId?: string;
    clientId?: string;
    view?: string;
    q?: string;
    sort?: string;
    payment?: string;
    type?: string;
  }>;
}) {
  const session = await requireCommercialSession("/dashboard/devis-facturation/factures");
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) return null;

  const sp = await searchParams;
  const view = (VIEWS.includes(sp.view as InvoicesViewFilter) ? sp.view : "all") as InvoicesViewFilter;
  const sort = (SORTS.includes(sp.sort as InvoicesSort) ? sp.sort : "recent") as InvoicesSort;
  const q = typeof sp.q === "string" ? sp.q : "";
  const quoteId = sp.quoteId?.trim() || "";
  const projectId = sp.projectId?.trim() || "";
  const clientId = sp.clientId?.trim() || "";
  const payment = sp.payment?.trim() || "";
  const type = sp.type?.trim() || "";

  await refreshCommercialOverdueStatuses({ orgId, notify: false });

  const [invoices, kpis] = await Promise.all([
    listInvoicesWorkspace(orgId, {
      view,
      q,
      sort,
      quoteId: quoteId || null,
      projectId: projectId || null,
      clientId: clientId || null,
      payment:
        payment === "unpaid" ||
        payment === "partial" ||
        payment === "paid" ||
        payment === "open"
          ? payment
          : null,
      type: type
        ? (type as CommercialInvoiceType)
        : null,
    }),
    loadInvoicesWorkspaceKpis(orgId),
  ]);

  return (
    <InvoicesWorkspace
      initialInvoices={invoices}
      kpis={kpis}
      initialView={view}
      initialQ={q}
      initialSort={sort}
      initialQuoteId={quoteId}
      initialProjectId={projectId}
      initialClientId={clientId}
      initialPayment={payment}
    />
  );
}
