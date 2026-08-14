/**
 * GED V2.0.1 — tout document commande (BC, BL, devis, FT, facture…) → classeur.
 * Même fileUrl, pas de copie. PurchaseOrderDocument reste la source métier.
 */
import { prisma } from "@/lib/prisma";
import { indexSourceDocument } from "@/lib/ged/index-source-document";
import { poKindToGedMeta } from "@/lib/ged/source-identity";
import { withPerfLog } from "@/lib/perf/server-timing";

export async function linkPurchaseOrderDocumentToChantier(opts: {
  orderId: string;
  purchaseOrderDocumentId: string;
  fileUrl: string;
  fileName: string;
  addedById: string;
  kind?: string;
  receiptId?: string | null;
  createdAt?: Date;
  dryRun?: boolean;
}): Promise<{ chantierFileId: string | null; linked: boolean; reason?: string }> {
  return withPerfLog("linkPurchaseOrderDocumentToChantier", async () => {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: opts.orderId },
      select: {
        id: true,
        number: true,
        projectId: true,
        externalOrganizationId: true,
        project: { select: { id: true, title: true, clientId: true } },
        externalOrganization: { select: { id: true, name: true, tradeName: true } },
      },
    });

    if (!order?.projectId || !order.project) {
      return { chantierFileId: null, linked: false, reason: "no_project" };
    }

    const kind = (opts.kind || "AUTRE").toUpperCase();
    const meta = poKindToGedMeta(kind);
    const supplierName =
      order.externalOrganization.tradeName || order.externalOrganization.name;
    const name = opts.fileName.trim() || `${kind} ${order.number}`;

    const extra: { entityType: string; entityId: string; entityLabel?: string | null }[] = [
      {
        entityType: "purchase_order",
        entityId: order.id,
        entityLabel: order.number,
      },
      {
        entityType: "supplier",
        entityId: order.externalOrganizationId,
        entityLabel: supplierName,
      },
    ];
    if (opts.receiptId) {
      extra.push({
        entityType: "purchase_order_receipt",
        entityId: opts.receiptId,
        entityLabel: "Réception",
      });
    }

    const result = await indexSourceDocument({
      projectId: order.projectId,
      clientId: order.project.clientId,
      addedById: opts.addedById,
      name,
      fileUrl: opts.fileUrl,
      documentType: meta.documentType,
      category: meta.category,
      subcategory: meta.subcategory,
      folderCode: meta.folderCode,
      classificationStatus: meta.classificationStatus,
      emitterName: supplierName,
      createdAt: opts.createdAt,
      dryRun: opts.dryRun,
      primary: {
        entityType: "purchase_order_document",
        entityId: opts.purchaseOrderDocumentId,
        entityLabel: kind,
      },
      extraLinks: extra,
    });

    return {
      chantierFileId: result.chantierFileId,
      linked: result.created,
      reason: result.reason,
    };
  });
}

/** Compat GED V2 — BL réception. */
export async function linkPurchaseOrderBlToChantier(opts: {
  orderId: string;
  receiptId: string;
  purchaseOrderDocumentId: string;
  fileUrl: string;
  fileName: string;
  addedById: string;
}): Promise<{ chantierFileId: string | null; linked: boolean; reason?: string }> {
  return linkPurchaseOrderDocumentToChantier({
    ...opts,
    kind: "BL",
  });
}
