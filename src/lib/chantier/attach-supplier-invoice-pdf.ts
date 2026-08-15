/**
 * ECO-2 — PDF facture fournisseur via GED existante (PurchaseOrderDocument FACTURE).
 * Un seul upload physique. Pas de nouveau modèle. Pas de FK facture (migration évitée).
 */
import { prisma } from "@/lib/prisma";
import { linkPurchaseOrderDocumentToChantier } from "@/lib/ged/link-po-bl-to-chantier";

export async function attachSupplierInvoicePdfToPurchaseOrder(opts: {
  orderId: string;
  addedById: string;
  fileUrl: string;
  fileName: string;
  invoiceNumber?: string | null;
}): Promise<{ documentId: string; linked: boolean }> {
  const name =
    opts.fileName.trim() ||
    (opts.invoiceNumber ? `Facture ${opts.invoiceNumber}` : "Facture fournisseur");
  const doc = await prisma.purchaseOrderDocument.create({
    data: {
      orderId: opts.orderId,
      kind: "FACTURE",
      name,
      fileUrl: opts.fileUrl,
    },
    select: { id: true, fileUrl: true, name: true },
  });
  let linked = false;
  if (doc.fileUrl) {
    try {
      const result = await linkPurchaseOrderDocumentToChantier({
        orderId: opts.orderId,
        purchaseOrderDocumentId: doc.id,
        fileUrl: doc.fileUrl,
        fileName: doc.name,
        addedById: opts.addedById,
        kind: "FACTURE",
      });
      linked = result.linked;
    } catch {
      /* l’enregistrement facture reste valable sans index GED */
    }
  }
  return { documentId: doc.id, linked };
}
