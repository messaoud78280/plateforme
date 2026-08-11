import { prisma } from "@/lib/prisma";
import { calculateDealFinancialSummary } from "@/lib/commercial/money";
import { d } from "@/lib/commercial/decimal";
import { loadAmendmentBillingProgressBatch } from "@/lib/commercial/amendment-billing";

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
      projectId: true,
      project: { select: { id: true, title: true } },
    },
  });
  if (!quote) return null;

  const [acceptedAmendments, pendingAmendments, refusedAmendments, invoices] =
    await Promise.all([
      prisma.commercialAmendment.findMany({
        where: { organizationId: orgId, quoteId, status: "ACCEPTED" },
        select: {
          id: true,
          number: true,
          subject: true,
          totalSellHt: true,
          status: true,
          acceptedAt: true,
        },
        orderBy: { number: "asc" },
      }),
      prisma.commercialAmendment.findMany({
        where: {
          organizationId: orgId,
          quoteId,
          status: { in: ["DRAFT", "SENT"] },
        },
        select: {
          id: true,
          number: true,
          subject: true,
          totalSellHt: true,
          status: true,
          acceptedAt: true,
        },
        orderBy: { number: "asc" },
      }),
      prisma.commercialAmendment.findMany({
        where: {
          organizationId: orgId,
          quoteId,
          status: { in: ["REFUSED", "CANCELLED"] },
        },
        select: {
          id: true,
          number: true,
          subject: true,
          totalSellHt: true,
          status: true,
          acceptedAt: true,
        },
        orderBy: { number: "asc" },
        take: 20,
      }),
      prisma.commercialInvoice.findMany({
        where: {
          organizationId: orgId,
          quoteId,
          status: { notIn: ["CANCELLED", "DRAFT"] },
        },
        select: {
          totalSellHt: true,
          totalTtc: true,
          amountPaid: true,
          amountDue: true,
          type: true,
        },
      }),
    ]);

  const billingMap = await loadAmendmentBillingProgressBatch(
    orgId,
    acceptedAmendments.map((a) => a.id),
  );

  const acceptedAmendmentsHt = acceptedAmendments.reduce((s, a) => s + d(a.totalSellHt), 0);
  const pendingAmendmentsHt = pendingAmendments.reduce((s, a) => s + d(a.totalSellHt), 0);

  const invoicedHt = invoices.reduce((s, i) => {
    const ht = d(i.totalSellHt);
    return s + (i.type === "CREDIT" ? -Math.abs(ht) : ht);
  }, 0);
  const invoicedTtc = invoices.reduce((s, i) => {
    const ttc = d(i.totalTtc);
    return s + (i.type === "CREDIT" ? -Math.abs(ttc) : ttc);
  }, 0);
  const paidTtc = invoices.reduce((s, i) => s + d(i.amountPaid), 0);
  const remainingToCollectTtcFromDue = invoices.reduce((s, i) => s + d(i.amountDue), 0);

  const summary = calculateDealFinancialSummary({
    initialMarketHt: d(quote.totalSellHt),
    acceptedAmendmentsHt,
    invoicedHt,
    paidTtc,
    invoicedTtc,
  });

  const mapAmendment = (
    a: (typeof acceptedAmendments)[number],
    withBilling: boolean,
  ) => {
    const billing = withBilling ? billingMap.get(a.id) : undefined;
    return {
      id: a.id,
      number: a.number,
      subject: a.subject,
      totalSellHt: d(a.totalSellHt),
      status: a.status,
      acceptedAt: a.acceptedAt,
      invoicedAmountHt: billing?.invoicedAmountHt ?? 0,
      remainingToInvoiceHt: billing?.remainingToInvoiceHt ?? 0,
      isBillable: billing?.isBillable ?? false,
      isFullyInvoiced: billing?.isFullyInvoiced ?? false,
    };
  };

  return {
    quote: {
      id: quote.id,
      number: quote.number,
      subject: quote.subject,
      status: quote.status,
      acceptedAt: quote.acceptedAt,
      projectId: quote.projectId,
      projectTitle: quote.project?.title ?? null,
    },
    ...summary,
    remainingToCollectTtc: remainingToCollectTtcFromDue || summary.remainingToCollectTtc,
    pendingAmendmentsHt,
    amendmentsAccepted: acceptedAmendments.map((a) => mapAmendment(a, true)),
    amendmentsPending: pendingAmendments.map((a) => mapAmendment(a, false)),
    amendmentsClosed: refusedAmendments.map((a) => mapAmendment(a, false)),
  };
}
