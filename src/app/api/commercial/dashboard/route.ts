import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { d } from "@/lib/commercial/decimal";

export async function GET() {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const orgId = auth.orgId;

  const [
    quotesDraft,
    quotesSent,
    quotesAccepted,
    invoicesDraft,
    invoicesIssued,
    invoicesPartial,
    invoicesPaid,
    amendmentsOpen,
    recentQuotes,
    overdueInvoices,
  ] = await Promise.all([
    prisma.commercialQuote.count({ where: { organizationId: orgId, status: "DRAFT" } }),
    prisma.commercialQuote.count({
      where: { organizationId: orgId, status: { in: ["SENT", "VIEWED"] } },
    }),
    prisma.commercialQuote.count({
      where: { organizationId: orgId, status: "ACCEPTED" },
    }),
    prisma.commercialInvoice.count({
      where: { organizationId: orgId, status: "DRAFT" },
    }),
    prisma.commercialInvoice.count({
      where: { organizationId: orgId, status: "ISSUED" },
    }),
    prisma.commercialInvoice.count({
      where: { organizationId: orgId, status: "PARTIALLY_PAID" },
    }),
    prisma.commercialInvoice.count({
      where: { organizationId: orgId, status: "PAID" },
    }),
    prisma.commercialAmendment.count({
      where: { organizationId: orgId, status: { in: ["DRAFT", "SENT"] } },
    }),
    prisma.commercialQuote.findMany({
      where: { organizationId: orgId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        number: true,
        subject: true,
        status: true,
        totalTtc: true,
        updatedAt: true,
      },
    }),
    prisma.commercialInvoice.findMany({
      where: {
        organizationId: orgId,
        status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] },
        dueDate: { lt: new Date() },
      },
      select: { id: true, amountDue: true },
    }),
  ]);

  const amountDueOverdue = overdueInvoices.reduce((s, i) => s + d(i.amountDue), 0);

  return NextResponse.json({
    kpis: {
      quotesDraft,
      quotesSent,
      quotesAccepted,
      invoicesDraft,
      invoicesIssued,
      invoicesPartial,
      invoicesPaid,
      amendmentsOpen,
      overdueCount: overdueInvoices.length,
      amountDueOverdue,
    },
    recentQuotes: recentQuotes.map((q) => ({
      ...q,
      totalTtc: d(q.totalTtc),
    })),
  });
}
