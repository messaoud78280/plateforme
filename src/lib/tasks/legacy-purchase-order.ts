/**
 * TACHES-V2A — Tasks legacy liées à une PurchaseOrder.
 * Conservées en base (historique / sync) mais masquées de la liste Tâches moderne.
 */
import type { Prisma } from "@prisma/client";

/** Exclusion Prisma : pont PO + catégorie seed « Bon de commande ». */
export const excludeLegacyPurchaseOrderTasksWhere: Prisma.TaskWhereInput = {
  NOT: {
    OR: [
      { purchaseOrderAsLegacy: { isNot: null } },
      { category: "Bon de commande" },
    ],
  },
};

export function isLegacyPurchaseOrderTask(task: {
  category?: string | null;
  title?: string | null;
  purchaseOrderAsLegacy?: { id: string } | null;
}): boolean {
  if (task.purchaseOrderAsLegacy) return true;
  if (task.category === "Bon de commande") return true;
  const title = (task.title ?? "").trim();
  if (/^BC-\d{4}-\d+/i.test(title)) return true;
  return false;
}
