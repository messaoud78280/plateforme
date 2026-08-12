/**
 * DF-6B — Solde acomptes marché (facturés vs déduits sur situations).
 */
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import { roundMoney } from "@/lib/commercial/money";

const DEPOSIT_COUNTED_STATUSES = [
  "ISSUED",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
] as const;

/**
 * Acomptes facturés (émis+) − déjà déduits sur situations validées/facturées.
 * DRAFT d’acompte ignoré (pas encore contractuellement facturé).
 * `excludeStatementId` : recalcul d’une situation déjà VALIDATED (évite double comptage).
 */
export async function getQuoteDepositBalance(
  orgId: string,
  quoteId: string,
  options?: { excludeStatementId?: string },
) {
  const [deposits, statements] = await Promise.all([
    prisma.commercialInvoice.findMany({
      where: {
        organizationId: orgId,
        quoteId,
        type: "DEPOSIT",
        status: { in: [...DEPOSIT_COUNTED_STATUSES] },
      },
      select: {
        id: true,
        number: true,
        status: true,
        totalSellHt: true,
        totalTtc: true,
        amountPaid: true,
        amountDue: true,
        depositPercent: true,
      },
      orderBy: { issueDate: "asc" },
    }),
    prisma.commercialProgressStatement.findMany({
      where: {
        organizationId: orgId,
        quoteId,
        status: { in: ["VALIDATED", "INVOICED"] },
        ...(options?.excludeStatementId
          ? { id: { not: options.excludeStatementId } }
          : {}),
      },
      select: { id: true, number: true, depositDeductedHt: true, status: true },
    }),
  ]);

  const invoicedHt = roundMoney(
    deposits.reduce((s, i) => s + d(i.totalSellHt), 0),
    2,
  );
  const deductedHt = roundMoney(
    statements.reduce((s, st) => s + d(st.depositDeductedHt), 0),
    2,
  );
  const remainingToDeductHt = roundMoney(Math.max(0, invoicedHt - deductedHt), 2);
  const paidHtApprox = roundMoney(
    deposits.reduce((s, i) => {
      const ttc = d(i.totalTtc);
      const paid = d(i.amountPaid);
      if (ttc <= 0) return s;
      return s + d(i.totalSellHt) * (paid / ttc);
    }, 0),
    2,
  );

  return {
    deposits: deposits.map((i) => ({
      ...i,
      totalSellHt: d(i.totalSellHt),
      totalTtc: d(i.totalTtc),
      amountPaid: d(i.amountPaid),
      amountDue: d(i.amountDue),
      depositPercent: i.depositPercent != null ? d(i.depositPercent) : null,
    })),
    invoicedHt,
    deductedHt,
    remainingToDeductHt,
    paidHtApprox,
  };
}
