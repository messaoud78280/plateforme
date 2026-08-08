import { prisma } from "@/lib/prisma";

/**
 * Génère une référence BC-YYYY-NNNN unique dans l’organisation (serveur uniquement).
 */
export async function generatePurchaseOrderNumber(organizationId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `BC-${year}-`;

  const last = await prisma.purchaseOrder.findFirst({
    where: {
      organizationId,
      number: { startsWith: prefix },
    },
    orderBy: { number: "desc" },
    select: { number: true },
  });

  let seq = 1;
  if (last?.number) {
    const raw = last.number.slice(prefix.length);
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 1) seq = n + 1;
  }

  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export function isValidPurchaseOrderNumber(value: string): boolean {
  // BC-2026-0043 (nouveau) ou BC-2026-043 (démo / historique)
  return /^BC-\d{4}-\d{3,}$/.test(value.trim());
}
