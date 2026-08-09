/**
 * GED-V2A — Lien BL commande → classeur chantier (même fileUrl, pas de copie).
 * PurchaseOrderDocument reste la source pour DELIVERY_NOTE_MISSING.
 * ChantierFile + ChantierFileLink = projection multi-contexte.
 */
import { prisma } from "@/lib/prisma";
import { ensureChantierFolders } from "@/lib/chantier-dossier/folders";
import { withPerfLog } from "@/lib/perf/server-timing";

export async function linkPurchaseOrderBlToChantier(opts: {
  orderId: string;
  receiptId: string;
  purchaseOrderDocumentId: string;
  fileUrl: string;
  fileName: string;
  addedById: string;
}): Promise<{ chantierFileId: string | null; linked: boolean; reason?: string }> {
  return withPerfLog("linkPurchaseOrderBlToChantier", async () => {
    const existing = await prisma.chantierFileLink.findFirst({
      where: {
        entityType: "purchase_order_document",
        entityId: opts.purchaseOrderDocumentId,
      },
      select: { fileId: true },
    });
    if (existing) {
      return { chantierFileId: existing.fileId, linked: false, reason: "already_linked" };
    }

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
      return {
        chantierFileId: null,
        linked: false,
        reason: "no_project",
      };
    }

    await ensureChantierFolders(order.projectId);
    const folder =
      (await prisma.chantierFolder.findFirst({
        where: { projectId: order.projectId, code: "05" },
        select: { id: true },
      })) ??
      (await prisma.chantierFolder.findFirst({
        where: { projectId: order.projectId, code: "00" },
        select: { id: true },
      }));

    if (!folder) {
      return { chantierFileId: null, linked: false, reason: "no_folder" };
    }

    const supplierName =
      order.externalOrganization.tradeName || order.externalOrganization.name;
    const name = opts.fileName.trim() || `BL ${order.number}`;

    const file = await prisma.chantierFile.create({
      data: {
        projectId: order.projectId,
        folderId: folder.id,
        clientId: order.project.clientId,
        name,
        fileUrl: opts.fileUrl,
        status: "RECU",
        documentType: "BL",
        category: "Fournisseurs",
        subcategory: "Bon de livraison",
        visibility: "Interne entreprise cliente",
        classificationStatus: "CLASSE",
        isCurrentVersion: true,
        addedById: opts.addedById,
        emitterName: supplierName,
      },
      select: { id: true },
    });

    await prisma.chantierFileLink.createMany({
      data: [
        {
          fileId: file.id,
          entityType: "purchase_order",
          entityId: order.id,
          entityLabel: order.number,
          createdById: opts.addedById,
        },
        {
          fileId: file.id,
          entityType: "purchase_order_receipt",
          entityId: opts.receiptId,
          entityLabel: "Réception",
          createdById: opts.addedById,
        },
        {
          fileId: file.id,
          entityType: "purchase_order_document",
          entityId: opts.purchaseOrderDocumentId,
          entityLabel: "BL",
          createdById: opts.addedById,
        },
        {
          fileId: file.id,
          entityType: "supplier",
          entityId: order.externalOrganizationId,
          entityLabel: supplierName,
          createdById: opts.addedById,
        },
      ],
    });

    return { chantierFileId: file.id, linked: true };
  });
}
