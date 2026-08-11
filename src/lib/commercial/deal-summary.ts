import { prisma } from "@/lib/prisma";
import { calculateDealFinancialSummary } from "@/lib/commercial/money";
import { d } from "@/lib/commercial/decimal";

export async function loadDealFinancialSummary(orgId: string, quoteId: string) {
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: quoteId, organizationId: orgId },
    select: {
      id: true,
      number: true,
      subject: true,
      status: true,
      totalSellHt: true,
      totalTtc: true,
      acceptedAt: true,
    },
  });
  if (!quote) return null;

  const [acceptedAmendments, pendingAmendments, invoices] = await Promise.all([
    prisma.commercialAmendment.findMany({
      where: { organizationId: orgId, quoteId, status: "ACCEPTED" },
      select: { id: true, number: true, subject: true, totalSellHt: true, status: true },
    }),
    prisma.commercialAmendment.findMany({
      where: {
        organizationId: orgId,
        quoteId,
        status: { in: ["DRAFT", "SENT"] },
      },
      select: { id: true, number: true, subject: true, totalSellHt: true, status: true },
    }),
    prisma.commercialInvoice.findMany({
      where: {
        organizationId: orgId,
        quoteId,
        status: { notIn: ["CANCELLED", "DRAFT"] },
      },
      select: { totalSellHt: true, totalTtc: true, amountPaid: true, amountDue: true },
    }),
  ]);

  const acceptedAmendmentsHt = acceptedAmendments.reduce((s, a) => s + d(a.totalSellHt), 0);
  const pendingAmendmentsHt = pendingAmendments.reduce((s, a) => s + d(a.totalSellHt), 0);
  const invoicedHt = invoices.reduce((s, i) => s + d(i.totalSellHt), 0);
  const invoicedTtc = invoices.reduce((s, i) => s + d(i.totalTtc), 0);
  const paidTtc = invoices.reduce((s, i) => s + d(i.amountPaid), 0);
  const remainingToCollectTtcFromDue = invoices.reduce((s, i) => s + d(i.amountDue), 0);

  const summary = calculateDealFinancialSummary({
    initialMarketHt: d(quote.totalSellHt),
    acceptedAmendmentsHt,
    invoicedHt,
    paidTtc,
    invoicedTtc,
  });

  return {
    quote: {
      id: quote.id,
      number: quote.number,
      subject: quote.subject,
      status: quote.status,
      acceptedAt: quote.acceptedAt,
    },
    ...summary,
    /** Préférence amountDue factures si disponible (aligné encaissement réel). */
    remainingToCollectTtc: remainingToCollectTtcFromDue || summary.remainingToCollectTtc,
    pendingAmendmentsHt,
    amendmentsAccepted: acceptedAmendments.map((a) => ({
      id: a.id,
      number: a.number,
      subject: a.subject,
      totalSellHt: d(a.totalSellHt),
      status: a.status,
    })),
    amendmentsPending: pendingAmendments.map((a) => ({
      id: a.id,
      number: a.number,
      subject: a.subject,
      totalSellHt: d(a.totalSellHt),
      status: a.status,
    })),
  };
}
