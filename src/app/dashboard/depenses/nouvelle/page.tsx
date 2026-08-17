import { redirect } from "next/navigation";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import { prisma } from "@/lib/prisma";
import {
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import { assertDashboardHrefAllowed } from "@/lib/equipe-acces/assert-dashboard-access";
import { PageHeader } from "@/components/ui/PageHeader";
import { ContextBackButton } from "@/components/ui/ContextBackButton";
import { CreateExpenseForm } from "@/components/chantier/CreateExpenseForm";
import { sanitizeInternalReturnTo } from "@/lib/navigation/safe-return-to";

export const dynamic = "force-dynamic";

export default async function NouvelleDepensePage({
  searchParams,
}: {
  searchParams: Promise<{
    projectId?: string;
    supplierId?: string;
    purchaseOrderId?: string;
    associate?: string;
    returnTo?: string;
  }>;
}) {
  const session = await getCachedServerSession();
  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard/depenses/nouvelle");
  }
  if (!isInternalPurchaseOrderActor(session.user)) {
    redirect("/dashboard/depenses");
  }
  assertDashboardHrefAllowed({
    href: "/dashboard/depenses",
    personType: session.user.personType,
    permissionProfile: session.user.permissionProfile,
  });

  const orgId = await resolvePurchaseOrderOrgId(session.user);
  if (!orgId) redirect("/dashboard/depenses");

  const sp = await searchParams;
  const returnTo = sanitizeInternalReturnTo(sp.returnTo, "/dashboard/depenses");

  const projects = await prisma.project.findMany({
    where: { organizationId: orgId },
    select: { id: true, title: true },
    orderBy: { updatedAt: "desc" },
    take: 80,
  });

  let defaultProjectId = sp.projectId?.trim() || null;
  let defaultSupplierId = sp.supplierId?.trim() || null;
  const defaultPurchaseOrderId = sp.purchaseOrderId?.trim() || null;

  if (defaultPurchaseOrderId) {
    const po = await prisma.purchaseOrder.findFirst({
      where: { id: defaultPurchaseOrderId, organizationId: orgId },
      select: {
        projectId: true,
        externalOrganizationId: true,
      },
    });
    if (po) {
      defaultProjectId = po.projectId ?? defaultProjectId;
      defaultSupplierId = po.externalOrganizationId;
    }
  }

  return (
    <div className="space-y-6">
      <ContextBackButton
        label="Retour aux dépenses"
        fallbackHref="/dashboard/depenses"
        returnTo={returnTo}
      />
      <PageHeader
        eyebrow="Dépenses"
        title="Enregistrer une dépense"
        description="Facture fournisseur → coût réel chantier. La catégorie de la commande est reprise lorsqu’elle est connue."
      />
      <CreateExpenseForm
        projects={projects}
        defaultProjectId={defaultProjectId}
        defaultSupplierId={defaultSupplierId}
        defaultPurchaseOrderId={defaultPurchaseOrderId}
        preferAssociate={sp.associate === "1" || Boolean(defaultPurchaseOrderId)}
      />
    </div>
  );
}
