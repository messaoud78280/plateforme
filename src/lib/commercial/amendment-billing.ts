/**
 * GESTION-COMMERCIALE-V1C-B — progression facturation avenants (batch, org-scoped).
 */
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import {
  calculateAmendmentBillingProgress,
  type AmendmentBillingProgress,
} from "@/lib/commercial/money";

export async function loadAmendmentBillingProgressBatch(
  orgId: string,
  amendmentIds: string[],
): Promise<Map<string, AmendmentBillingProgress & { amendmentId: string }>> {
  const result = new Map<string, AmendmentBillingProgress & { amendmentId: string }>();
  if (amendmentIds.length === 0) return result;

  const [amendments, invoices] = await Promise.all([
    prisma.commercialAmendment.findMany({
      where: { organizationId: orgId, id: { in: amendmentIds } },
      select: { id: true, status: true, totalSellHt: true },
    }),
    prisma.commercialInvoice.findMany({
      where: {
        organizationId: orgId,
        amendmentId: { in: amendmentIds },
        status: { notIn: ["CANCELLED", "DRAFT"] },
      },
      select: {
        amendmentId: true,
        type: true,
        status: true,
        totalSellHt: true,
      },
    }),
  ]);

  const byAmendment = new Map<string, typeof invoices>();
  for (const inv of invoices) {
    if (!inv.amendmentId) continue;
    const list = byAmendment.get(inv.amendmentId) ?? [];
    list.push(inv);
    byAmendment.set(inv.amendmentId, list);
  }

  for (const a of amendments) {
    const progress = calculateAmendmentBillingProgress({
      amendmentStatus: a.status,
      acceptedAmountHt: d(a.totalSellHt),
      invoices: (byAmendment.get(a.id) ?? []).map((i) => ({
        type: i.type,
        status: i.status,
        totalSellHt: d(i.totalSellHt),
      })),
    });
    result.set(a.id, { amendmentId: a.id, ...progress });
  }

  return result;
}

export async function loadAmendmentDetail(orgId: string, amendmentId: string) {
  const amendment = await prisma.commercialAmendment.findFirst({
    where: { id: amendmentId, organizationId: orgId },
    include: {
      lines: { orderBy: { sortOrder: "asc" } },
      quote: {
        select: {
          id: true,
          number: true,
          subject: true,
          status: true,
          projectId: true,
          clientExternalOrgId: true,
          project: { select: { id: true, title: true } },
          clientExternalOrg: { select: { id: true, name: true, tradeName: true } },
        },
      },
    },
  });
  if (!amendment) return null;

  const invoices = await prisma.commercialInvoice.findMany({
    where: {
      organizationId: orgId,
      amendmentId,
      status: { notIn: ["CANCELLED"] },
    },
    orderBy: { issueDate: "desc" },
    select: {
      id: true,
      number: true,
      type: true,
      status: true,
      totalSellHt: true,
      totalTtc: true,
      amountDue: true,
      issueDate: true,
    },
  });

  const progress = calculateAmendmentBillingProgress({
    amendmentStatus: amendment.status,
    acceptedAmountHt: d(amendment.totalSellHt),
    invoices: invoices
      .filter((i) => i.status !== "DRAFT")
      .map((i) => ({
        type: i.type,
        status: i.status,
        totalSellHt: d(i.totalSellHt),
      })),
  });

  return {
    ...amendment,
    totalSellHt: d(amendment.totalSellHt),
    totalVat: d(amendment.totalVat),
    totalTtc: d(amendment.totalTtc),
    lines: amendment.lines.map((l) => ({
      ...l,
      quantity: d(l.quantity),
      unitSellHt: d(l.unitSellHt),
      vatRate: d(l.vatRate),
      lineSellHt: d(l.lineSellHt),
      lineVat: d(l.lineVat),
      lineTtc: d(l.lineTtc),
    })),
    invoices: invoices.map((i) => ({
      ...i,
      totalSellHt: d(i.totalSellHt),
      totalTtc: d(i.totalTtc),
      amountDue: d(i.amountDue),
    })),
    billing: progress,
  };
}
