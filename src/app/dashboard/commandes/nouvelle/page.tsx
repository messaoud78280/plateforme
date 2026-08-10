import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ContextBackButton } from "@/components/ui/ContextBackButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { CreatePurchaseOrderForm } from "@/components/purchase-orders/CreatePurchaseOrderForm";
import {
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import { projectWhereForClientUser } from "@/lib/organization/access";
import { sanitizeInternalReturnTo } from "@/lib/navigation/safe-return-to";

export const dynamic = "force-dynamic";

export default async function NouvelleCommandePage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; returnTo?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion?callbackUrl=/dashboard/commandes/nouvelle");
  if (!isInternalPurchaseOrderActor(session.user)) redirect("/dashboard/commandes");

  const { projectId: projectIdParam, returnTo: returnToRaw } = await searchParams;
  const returnTo = sanitizeInternalReturnTo(returnToRaw, "/dashboard/commandes");

  const orgId = await resolvePurchaseOrderOrgId(session.user);
  if (!orgId) redirect("/dashboard/commandes");

  const projectWhere = await projectWhereForClientUser(
    session.user.demoRootUserId ?? session.user.id,
  );

  const [projects, members] = await Promise.all([
    prisma.project.findMany({
      where: { OR: [projectWhere, { organizationId: orgId }] },
      select: { id: true, title: true, siteAddress: true, siteCity: true },
      orderBy: { updatedAt: "desc" },
      take: 40,
    }),
    prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      select: {
        user: { select: { id: true, name: true, personType: true } },
      },
    }),
  ]);

  const team = members
    .map((m) => m.user)
    .filter((u) => !u.personType || u.personType === "INTERNAL")
    .map((u) => ({ id: u.id, name: u.name }));

  return (
    <div className="space-y-6">
      <ContextBackButton
        label="Retour aux commandes"
        fallbackHref="/dashboard/commandes"
        returnTo={returnTo}
      />
      <PageHeader
        eyebrow="Commandes"
        title="Nouvelle commande"
        description="Préparez une demande fournisseur en quelques champs — le reste peut attendre."
      />
      <CreatePurchaseOrderForm
        projects={projects}
        team={team}
        defaultProjectId={projectIdParam ?? null}
      />
    </div>
  );
}
