import { redirect } from "next/navigation";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import {
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import { listSupplierInvoices } from "@/lib/chantier/supplier-invoices";
import { DepensesListClient } from "@/components/chantier/DepensesListClient";

export const dynamic = "force-dynamic";

export default async function DepensesPage() {
  const session = await getCachedServerSession();
  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard/depenses");
  }
  if (!isInternalPurchaseOrderActor(session.user)) {
    redirect("/dashboard");
  }
  const orgId = await resolvePurchaseOrderOrgId(session.user);
  if (!orgId) redirect("/dashboard");

  const invoices = await listSupplierInvoices({ orgId });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#1e3a5f]">
          Dépenses
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Factures fournisseurs enregistrées — réel chantier, sans double
          comptage avec les réceptions.
        </p>
      </div>
      <DepensesListClient initial={invoices} />
    </div>
  );
}
