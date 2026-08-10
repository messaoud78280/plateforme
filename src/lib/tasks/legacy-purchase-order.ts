/**
 * TACHES-V2A — Tasks legacy liées à une PurchaseOrder.
 * Conservées en base (historique / sync) mais masquées de la liste Tâches moderne
 * et de Discussions lorsqu’un channel fournisseur moderne couvre le même contexte (V2C.7.1).
 */
import type { Prisma } from "@prisma/client";

/** Exclusion Prisma : pont PO + catégorie seed « Bon de commande » + titres POINT.P / BC-. */
export const excludeLegacyPurchaseOrderTasksWhere: Prisma.TaskWhereInput = {
  NOT: {
    OR: [
      { purchaseOrderAsLegacy: { isNot: null } },
      { category: "Bon de commande" },
      { title: { startsWith: "BC-" } },
      { title: { startsWith: "POINT.P" } },
      { title: { startsWith: "Point.P" } },
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
  // Fil fournisseur legacy « POINT.P — Résidence … (BC-…) »
  if (/^POINT\.P\b/i.test(title)) return true;
  return false;
}

/**
 * V2C.7.1 — Masquer une mission dans Discussions si un channel chantier
 * couvre déjà le même contexte fournisseur (même projectId + SUPPLIER).
 */
export function shouldHideTaskAgainstProjectChannels(
  task: {
    id: string;
    title?: string | null;
    category?: string | null;
    projectId?: string | null;
    purchaseOrderAsLegacy?: { id: string } | null;
  },
  channels: { projectId: string; type: string; title?: string }[],
): boolean {
  if (!isLegacyPurchaseOrderTask(task)) return false;
  if (!task.projectId) {
    // Sans projet : masquer quand même les BC legacy (deep-link → channel / commande)
    return true;
  }
  return channels.some(
    (c) => c.projectId === task.projectId && (c.type === "SUPPLIER" || c.type === "FOURNISSEUR"),
  );
}
