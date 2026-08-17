import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ContextBackButton } from "@/components/ui/ContextBackButton";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  CreatePurchaseOrderForm,
  type PrefillPurchaseOrderLine,
} from "@/components/purchase-orders/CreatePurchaseOrderForm";
import {
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import { projectWhereForClientUser } from "@/lib/organization/access";
import { sanitizeInternalReturnTo } from "@/lib/navigation/safe-return-to";
import { loadMaterialRequirementsForProject } from "@/lib/materiaux/load-for-project";

export const dynamic = "force-dynamic";

export default async function NouvelleCommandePage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; returnTo?: string; req?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion?callbackUrl=/dashboard/commandes/nouvelle");
  if (!isInternalPurchaseOrderActor(session.user)) redirect("/dashboard/commandes");

  const {
    projectId: projectIdParam,
    returnTo: returnToRaw,
    req: reqRaw,
  } = await searchParams;
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

  let prefillLines: PrefillPurchaseOrderLine[] | null = null;
  let earliestNeededAt: string | null = null;

  const reqIds = (reqRaw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (reqIds.length > 0 && projectIdParam) {
    const rows = await loadMaterialRequirementsForProject({
      organizationId: orgId,
      projectId: projectIdParam,
    });
    const byId = new Map(rows.map((r) => [r.id, r]));
    const lines: PrefillPurchaseOrderLine[] = [];
    for (const id of reqIds) {
      const r = byId.get(id);
      if (!r || r.status === "CANCELLED") continue;
      const qty = r.progress.remainingToOrder;
      if (qty <= 0) continue;
      lines.push({
        designation: r.label,
        quantity: qty,
        unit: r.unit,
        materialRequirementId: r.id,
        neededAt: r.neededAt,
      });
      if (r.neededAt) {
        if (!earliestNeededAt || r.neededAt < earliestNeededAt) {
          earliestNeededAt = r.neededAt;
        }
      }
    }
    if (lines.length > 0) prefillLines = lines;
  }

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
        description={
          prefillLines
            ? "Lignes préremplies depuis les besoins matériaux du chantier — fournisseur, livraison et catégorie budgétaire."
            : "Fournisseur, chantier, lignes, livraison et catégorie budgétaire — engagement suivi jusqu’à la réception."
        }
      />
      <CreatePurchaseOrderForm
        projects={projects}
        team={team}
        defaultProjectId={projectIdParam ?? null}
        prefillLines={prefillLines}
        earliestNeededAt={earliestNeededAt}
      />
    </div>
  );
}
