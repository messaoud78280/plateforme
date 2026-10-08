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
  let defaultSupplierId: string | null = null;
  let defaultSupplierLabel: string | null = null;

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

    const selectedIds = rows
      .filter((r) => reqIds.includes(r.id) && r.selectedOfferId)
      .map((r) => r.selectedOfferId!)
      .filter(Boolean);
    const selectedOffers =
      selectedIds.length > 0
        ? await prisma.supplyOffer.findMany({
            where: {
              id: { in: selectedIds },
              organizationId: orgId,
              archivedAt: null,
            },
            select: {
              id: true,
              requirementId: true,
              supplierExternalOrgId: true,
              productLabel: true,
              productRef: true,
              unitPrice: true,
              priceTaxMode: true,
              priceUnit: true,
              supplier: {
                select: { id: true, name: true, tradeName: true },
              },
            },
          })
        : [];
    const offerByReq = new Map(
      selectedOffers.map((o) => [o.requirementId, o]),
    );

    const lines: PrefillPurchaseOrderLine[] = [];
    const supplierVotes = new Map<string, { label: string; n: number }>();

    for (const id of reqIds) {
      const r = byId.get(id);
      if (!r || r.status === "CANCELLED") continue;
      const qty = r.progress.remainingToOrder;
      if (qty <= 0) continue;
      const offer = offerByReq.get(r.id);
      const unitPrice =
        offer?.unitPrice != null && offer.priceTaxMode === "HT"
          ? Number(offer.unitPrice)
          : null;
      lines.push({
        designation: offer?.productLabel || r.label,
        quantity: qty,
        unit: offer?.priceUnit && offer.priceUnit === r.unit ? r.unit : r.unit,
        materialRequirementId: r.id,
        neededAt: r.neededAt,
        unitPriceHt: unitPrice,
        productRef: offer?.productRef ?? null,
      });
      if (offer) {
        const sid = offer.supplierExternalOrgId;
        const label =
          offer.supplier.tradeName || offer.supplier.name;
        const prev = supplierVotes.get(sid);
        supplierVotes.set(sid, {
          label,
          n: (prev?.n ?? 0) + 1,
        });
      }
      if (r.neededAt) {
        if (!earliestNeededAt || r.neededAt < earliestNeededAt) {
          earliestNeededAt = r.neededAt;
        }
      }
    }
    if (lines.length > 0) prefillLines = lines;

    // Un seul fournisseur dominant parmi les offres retenues → préremplir
    if (supplierVotes.size === 1) {
      const [[sid, meta]] = [...supplierVotes.entries()];
      defaultSupplierId = sid;
      defaultSupplierLabel = meta.label;
    }
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
            ? "Lignes préremplies depuis les besoins — offre retenue utilisée si présente (préparation, pas d’engagement auto)."
            : "Fournisseur, chantier, lignes, livraison et catégorie budgétaire — engagement suivi jusqu’à la réception."
        }
      />
      <CreatePurchaseOrderForm
        projects={projects}
        team={team}
        defaultProjectId={projectIdParam ?? null}
        prefillLines={prefillLines}
        earliestNeededAt={earliestNeededAt}
        defaultSupplierId={defaultSupplierId}
        defaultSupplierLabel={defaultSupplierLabel}
      />
    </div>
  );
}
