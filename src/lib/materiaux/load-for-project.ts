/**
 * MATERIAUX-V1B — chargement batch besoins + couverture pour un chantier.
 */
import { prisma } from "@/lib/prisma";
import {
  calculateMaterialRequirementProgress,
  coverageStateLabel,
  formatQty,
  type MaterialCoverageState,
  type MaterialRequirementProgress,
} from "@/lib/materiaux/progress";

const CANCELLED_ORDER = new Set(["ANNULEE", "REFUSEE"]);

function n(v: unknown): number {
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : 0;
}

function conformingQty(received: number, damaged: number, refused: number): number {
  return Math.max(0, received - damaged - refused);
}

export type MaterialRequirementRow = {
  id: string;
  label: string;
  unit: string;
  quantityRequired: number;
  lossFactor: number | null;
  neededAt: string | null;
  status: string;
  sourceType: string;
  sourceLabel: string | null;
  siteResourceId: string | null;
  siteResourceName: string | null;
  createdByName: string;
  createdAt: string;
  validatedAt: string | null;
  progress: MaterialRequirementProgress;
  coverageLabel: string;
  overOrdered: boolean;
  linkedOrders: Array<{
    orderId: string;
    orderNumber: string;
    supplierName: string;
    lineId: string;
    allocated: number;
    received: number;
    orderStatus: string;
  }>;
  /** Approvisionnements Phase 1/2 */
  category: string;
  procurementMode: string;
  description: string | null;
  sourceQuantity: number | null;
  sourceUnit: string | null;
  calculatedQuantity: number | null;
  validatedOrderQuantity: number;
  packaging: string | null;
  packagingSize: number | null;
  packagingUnit: string | null;
  takeoffCodes: string[];
  scheduleTaskIds: string[];
  sourceFingerprint: string | null;
  sourceDrift: string;
  orderDeadlineAt: string | null;
  supplierLeadTimeDays: number | null;
  notes: string | null;
  hasOrderLinks: boolean;
  /** Phase 3 — offre retenue */
  selectedOfferId: string | null;
  offerCount: number;
  hasPricedOffer: boolean;
};

export async function loadMaterialRequirementsForProject(opts: {
  organizationId: string;
  projectId: string;
}): Promise<MaterialRequirementRow[]> {
  const requirements = await prisma.materialRequirement.findMany({
    where: {
      organizationId: opts.organizationId,
      projectId: opts.projectId,
    },
    select: {
      id: true,
      label: true,
      unit: true,
      quantityRequired: true,
      lossFactor: true,
      neededAt: true,
      status: true,
      sourceType: true,
      sourceLabel: true,
      siteResourceId: true,
      createdAt: true,
      validatedAt: true,
      category: true,
      procurementMode: true,
      description: true,
      sourceQuantity: true,
      sourceUnit: true,
      calculatedQuantity: true,
      validatedOrderQuantity: true,
      packaging: true,
      packagingSize: true,
      packagingUnit: true,
      takeoffCodes: true,
      scheduleTaskIds: true,
      sourceFingerprint: true,
      sourceDrift: true,
      orderDeadlineAt: true,
      supplierLeadTimeDays: true,
      notes: true,
      selectedOfferId: true,
      siteResource: { select: { id: true, shortName: true } },
      createdBy: { select: { name: true } },
      offers: {
        where: { archivedAt: null },
        select: { id: true, unitPrice: true },
      },
      orderLinks: {
        select: {
          id: true,
          quantityAllocated: true,
          purchaseOrderLine: {
            select: {
              id: true,
              quantity: true,
              unit: true,
              order: {
                select: {
                  id: true,
                  number: true,
                  status: true,
                  externalOrganization: {
                    select: { name: true, tradeName: true },
                  },
                },
              },
              receiptLines: {
                select: {
                  receivedQty: true,
                  damagedQty: true,
                  refusedQty: true,
                  receipt: { select: { cancelledAt: true } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ status: "asc" }, { neededAt: "asc" }, { label: "asc" }],
  });

  return requirements.map((r) => {
    const linkedOrders: MaterialRequirementRow["linkedOrders"] = [];
    const allocations: Array<{
      quantityAllocated: number;
      lineUnit: string;
      orderStatus: string;
      receivedConforming: number;
    }> = [];

    for (const link of r.orderLinks) {
      const line = link.purchaseOrderLine;
      const order = line.order;
      const allocated = n(link.quantityAllocated);
      const lineQty = n(line.quantity);
      let lineReceived = 0;
      for (const rl of line.receiptLines) {
        if (rl.receipt.cancelledAt) continue;
        lineReceived += conformingQty(n(rl.receivedQty), n(rl.damagedQty), n(rl.refusedQty));
      }
      // Proportionner le reçu de la ligne à l'allocation (multi-liens sur même ligne rare)
      const share = lineQty > 0 ? Math.min(1, allocated / lineQty) : 1;
      const receivedForAlloc = lineReceived * share;

      allocations.push({
        quantityAllocated: allocated,
        lineUnit: line.unit,
        orderStatus: order.status,
        receivedConforming: receivedForAlloc,
      });

      if (!CANCELLED_ORDER.has(order.status)) {
        linkedOrders.push({
          orderId: order.id,
          orderNumber: order.number,
          supplierName: order.externalOrganization.tradeName || order.externalOrganization.name,
          lineId: line.id,
          allocated,
          received: receivedForAlloc,
          orderStatus: order.status,
        });
      }
    }

    const progress = calculateMaterialRequirementProgress({
      status: r.status,
      quantityRequired: n(r.quantityRequired),
      unit: r.unit,
      allocations,
    });

    const takeoffCodes = Array.isArray(r.takeoffCodes)
      ? r.takeoffCodes.filter((x): x is string => typeof x === "string")
      : [];
    const scheduleTaskIds = Array.isArray(r.scheduleTaskIds)
      ? r.scheduleTaskIds.filter((x): x is string => typeof x === "string")
      : [];
    const validatedOrder =
      r.validatedOrderQuantity != null
        ? n(r.validatedOrderQuantity)
        : n(r.quantityRequired);

    return {
      id: r.id,
      label: r.label,
      unit: r.unit,
      quantityRequired: n(r.quantityRequired),
      lossFactor: r.lossFactor != null ? n(r.lossFactor) : null,
      neededAt: r.neededAt ? r.neededAt.toISOString() : null,
      status: r.status,
      sourceType: r.sourceType,
      sourceLabel: r.sourceLabel,
      siteResourceId: r.siteResourceId,
      siteResourceName: r.siteResource?.shortName ?? null,
      createdByName: r.createdBy.name,
      createdAt: r.createdAt.toISOString(),
      validatedAt: r.validatedAt ? r.validatedAt.toISOString() : null,
      progress,
      coverageLabel: coverageStateLabel(progress.coverageState as MaterialCoverageState),
      overOrdered: progress.ordered > progress.need + 1e-9,
      linkedOrders,
      category: r.category ?? "MATERIAL",
      procurementMode: r.procurementMode ?? "ACHAT",
      description: r.description ?? null,
      sourceQuantity: r.sourceQuantity != null ? n(r.sourceQuantity) : null,
      sourceUnit: r.sourceUnit ?? null,
      calculatedQuantity:
        r.calculatedQuantity != null ? n(r.calculatedQuantity) : null,
      validatedOrderQuantity: validatedOrder,
      packaging: r.packaging ?? null,
      packagingSize: r.packagingSize != null ? n(r.packagingSize) : null,
      packagingUnit: r.packagingUnit ?? null,
      takeoffCodes,
      scheduleTaskIds,
      sourceFingerprint: r.sourceFingerprint ?? null,
      sourceDrift: r.sourceDrift ?? "NONE",
      orderDeadlineAt: r.orderDeadlineAt
        ? r.orderDeadlineAt.toISOString()
        : null,
      supplierLeadTimeDays:
        r.supplierLeadTimeDays != null ? n(r.supplierLeadTimeDays) : null,
      notes: r.notes ?? null,
      hasOrderLinks: r.orderLinks.length > 0,
      selectedOfferId: r.selectedOfferId ?? null,
      offerCount: r.offers.length,
      hasPricedOffer: r.offers.some((o) => o.unitPrice != null),
    };
  });
}

export { formatQty };
