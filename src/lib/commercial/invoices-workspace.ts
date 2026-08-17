/**
 * Centre Factures — liste filtrée + KPI (réutilise CommercialInvoice / paiements).
 */
import type { CommercialInvoiceStatus, CommercialInvoiceType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import { roundMoney } from "@/lib/commercial/money";
import {
  daysOverdue,
  isDueDatePast,
} from "@/lib/commercial/invoice-status";

export type InvoicesViewFilter =
  | "all"
  | "drafts"
  | "to_issue"
  | "issued"
  | "partial"
  | "paid"
  | "overdue"
  | "open";

export type InvoicesSort =
  | "recent"
  | "oldest"
  | "due_asc"
  | "amount_desc"
  | "amount_asc"
  | "due_amount_desc"
  | "client_az";

export type InvoicesWorkspaceKpis = {
  billedMonthHt: number;
  collectedMonthTtc: number;
  outstandingTtc: number;
  overdueTtc: number;
  openCount: number;
  draftCount: number;
  overdueCount: number;
  partialCount: number;
  dueSoonCount: number;
  toFinalizeCount: number;
};

export type InvoiceListItem = {
  id: string;
  number: string;
  type: string;
  status: string;
  subject: string | null;
  issueDate: string;
  dueDate: string | null;
  totalHt: number;
  totalVat: number;
  totalTtc: number;
  amountPaid: number;
  amountDue: number;
  paidPercent: number;
  daysLate: number;
  daysUntilDue: number | null;
  lastReminderAt: string | null;
  reminderCount: number;
  clientId: string | null;
  clientName: string | null;
  projectId: string | null;
  projectTitle: string | null;
  quoteId: string | null;
  quoteNumber: string | null;
  progressStatementId: string | null;
  progressNumber: number | null;
  progressLabel: string | null;
  marketCumulativePercent: number | null;
  lastPaymentAt: string | null;
  lastPaymentAmount: number | null;
  lastPaymentMethod: string | null;
  originLabel: string;
  documentsHref: string;
};

export type ListInvoicesWorkspaceOpts = {
  q?: string | null;
  view?: InvoicesViewFilter | null;
  status?: CommercialInvoiceStatus | null;
  type?: CommercialInvoiceType | null;
  payment?: "unpaid" | "partial" | "paid" | "open" | null;
  quoteId?: string | null;
  projectId?: string | null;
  clientId?: string | null;
  sort?: InvoicesSort | null;
  take?: number;
};

function clientLabel(inv: {
  clientExternalOrg?: { name: string | null; tradeName: string | null } | null;
  clientSnapshotJson?: unknown;
}): string | null {
  const snap = inv.clientSnapshotJson as {
    name?: string | null;
    tradeName?: string | null;
  } | null;
  return (
    inv.clientExternalOrg?.tradeName ||
    inv.clientExternalOrg?.name ||
    snap?.tradeName ||
    snap?.name ||
    null
  );
}

export function daysUntilDue(
  dueDate: Date | string | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!dueDate || isDueDatePast(dueDate, now)) return null;
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return null;
  const d0 = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
  const n0 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((d0 - n0) / 86_400_000));
}

function originLabel(inv: {
  type: string;
  progressStatement?: { number: number; label: string } | null;
}): string {
  if (inv.progressStatement) {
    return `Situation n°${inv.progressStatement.number}`;
  }
  if (inv.type === "DEPOSIT") return "Acompte";
  if (inv.type === "FINAL") return "Solde";
  if (inv.type === "CREDIT") return "Avoir";
  if (inv.type === "PROGRESS") return "Situation";
  return "Facture directe";
}

export async function loadInvoicesWorkspaceKpis(
  orgId: string,
): Promise<InvoicesWorkspaceKpis> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const in7 = new Date(today);
  in7.setDate(in7.getDate() + 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [issuedMonth, openInvoices, paymentsMonth, draftCount, partialCount] =
    await Promise.all([
      prisma.commercialInvoice.findMany({
        where: {
          organizationId: orgId,
          type: { not: "CREDIT" },
          status: { in: ["ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE"] },
          OR: [
            { issuedAt: { gte: monthStart, lt: nextMonth } },
            { issuedAt: null, issueDate: { gte: monthStart, lt: nextMonth } },
          ],
        },
        select: { totalSellHt: true, type: true },
      }),
      prisma.commercialInvoice.findMany({
        where: {
          organizationId: orgId,
          type: { not: "CREDIT" },
          status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] },
          amountDue: { gt: 0 },
        },
        select: {
          amountDue: true,
          dueDate: true,
          status: true,
        },
      }),
      prisma.commercialPayment.aggregate({
        where: {
          organizationId: orgId,
          cancelledAt: null,
          paidAt: { gte: monthStart },
        },
        _sum: { amount: true },
      }),
      prisma.commercialInvoice.count({
        where: { organizationId: orgId, status: "DRAFT" },
      }),
      prisma.commercialInvoice.count({
        where: {
          organizationId: orgId,
          status: "PARTIALLY_PAID",
          amountDue: { gt: 0 },
        },
      }),
    ]);

  let billedMonthHt = 0;
  for (const inv of issuedMonth) {
    const ht = d(inv.totalSellHt);
    billedMonthHt += inv.type === "CREDIT" ? -ht : ht;
  }

  let outstandingTtc = 0;
  let overdueTtc = 0;
  let overdueCount = 0;
  let dueSoonCount = 0;
  for (const inv of openInvoices) {
    const due = d(inv.amountDue);
    outstandingTtc += due;
    const overdue = inv.status === "OVERDUE" || isDueDatePast(inv.dueDate, now);
    if (overdue) {
      overdueTtc += due;
      overdueCount += 1;
    } else if (inv.dueDate) {
      const dd = new Date(inv.dueDate);
      if (dd >= today && dd <= in7) dueSoonCount += 1;
    }
  }

  return {
    billedMonthHt: roundMoney(billedMonthHt, 2),
    collectedMonthTtc: roundMoney(d(paymentsMonth._sum.amount), 2),
    outstandingTtc: roundMoney(outstandingTtc, 2),
    overdueTtc: roundMoney(overdueTtc, 2),
    openCount: openInvoices.length,
    draftCount,
    overdueCount,
    partialCount,
    dueSoonCount,
    toFinalizeCount: draftCount,
  };
}

export async function listInvoicesWorkspace(
  orgId: string,
  opts: ListInvoicesWorkspaceOpts = {},
): Promise<InvoiceListItem[]> {
  const now = new Date();
  const q = opts.q?.trim().toLowerCase() || "";
  const view = opts.view ?? "all";
  const sort = opts.sort ?? "recent";
  const take = Math.min(Math.max(opts.take ?? 150, 1), 300);

  const where: Prisma.CommercialInvoiceWhereInput = {
    organizationId: orgId,
  };

  if (opts.quoteId) where.quoteId = opts.quoteId;
  if (opts.projectId) where.projectId = opts.projectId;
  if (opts.clientId) where.clientExternalOrgId = opts.clientId;
  if (opts.type) where.type = opts.type;
  if (opts.status) where.status = opts.status;

  if (!opts.status) {
    if (view === "drafts" || view === "to_issue") where.status = "DRAFT";
    else if (view === "issued") where.status = "ISSUED";
    else if (view === "partial") where.status = "PARTIALLY_PAID";
    else if (view === "paid") where.status = "PAID";
    else if (view === "overdue") where.status = "OVERDUE";
    else if (view === "open") {
      where.status = { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] };
      where.amountDue = { gt: 0 };
    }
  }

  if (opts.payment === "unpaid") {
    where.amountPaid = { lte: 0 };
    where.amountDue = { gt: 0 };
    where.status = { in: ["ISSUED", "OVERDUE", "PARTIALLY_PAID"] };
  } else if (opts.payment === "partial") {
    where.status = "PARTIALLY_PAID";
    where.amountDue = { gt: 0 };
  } else if (opts.payment === "paid") {
    where.status = "PAID";
  } else if (opts.payment === "open") {
    where.status = { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] };
    where.amountDue = { gt: 0 };
  }

  let orderBy: Prisma.CommercialInvoiceOrderByWithRelationInput[] = [
    { updatedAt: "desc" },
  ];
  if (sort === "oldest") orderBy = [{ issueDate: "asc" }, { createdAt: "asc" }];
  else if (sort === "due_asc") orderBy = [{ dueDate: "asc" }, { issueDate: "desc" }];
  else if (sort === "amount_desc") orderBy = [{ totalTtc: "desc" }];
  else if (sort === "amount_asc") orderBy = [{ totalTtc: "asc" }];
  else if (sort === "due_amount_desc") orderBy = [{ amountDue: "desc" }];
  else if (sort === "client_az") {
    orderBy = [{ clientExternalOrg: { name: "asc" } }, { issueDate: "desc" }];
  }

  const rows = await prisma.commercialInvoice.findMany({
    where,
    orderBy,
    take,
    include: {
      clientExternalOrg: { select: { id: true, name: true, tradeName: true } },
      project: { select: { id: true, title: true } },
      quote: { select: { id: true, number: true, subject: true } },
      progressStatement: {
        select: {
          id: true,
          number: true,
          label: true,
          marketSellHt: true,
          cumulativeSellHt: true,
        },
      },
      payments: {
        where: { cancelledAt: null },
        orderBy: { paidAt: "desc" },
        take: 1,
        select: { paidAt: true, amount: true, method: true },
      },
    },
  });

  const mapped: InvoiceListItem[] = [];
  for (const inv of rows) {
    const amountDue = d(inv.amountDue);
    const amountPaid = d(inv.amountPaid);
    const totalTtc = d(inv.totalTtc);
    const totalHt = d(inv.totalSellHt);
    const totalVat = d(inv.totalVat);
    const clientName = clientLabel(inv);
    const projectTitle = inv.project?.title ?? null;
    const quoteNumber = inv.quote?.number ?? null;
    const progressNumber = inv.progressStatement?.number ?? null;
    const progressLabel = inv.progressStatement?.label ?? null;

    if (q) {
      const hay = [
        inv.number,
        clientName,
        projectTitle,
        quoteNumber,
        inv.subject,
        progressLabel,
        progressNumber != null ? `situation ${progressNumber}` : null,
        originLabel(inv),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) continue;
    }

    // Vue overdue : aussi les ISSUED avec échéance dépassée (statut pas encore rafraîchi)
    if (view === "overdue") {
      const late =
        inv.status === "OVERDUE" ||
        (amountDue > 0.004 && isDueDatePast(inv.dueDate, now));
      if (!late) continue;
    }

    const marketHt = inv.progressStatement
      ? d(inv.progressStatement.marketSellHt)
      : 0;
    const cumHt = inv.progressStatement
      ? d(inv.progressStatement.cumulativeSellHt)
      : 0;
    const marketCumulativePercent =
      marketHt > 0.01
        ? roundMoney((cumHt / marketHt) * 100, 0)
        : null;

    const lastPay = inv.payments[0] ?? null;
    const paidPercent =
      totalTtc > 0.004
        ? Math.min(100, Math.round((amountPaid / totalTtc) * 100))
        : inv.status === "PAID"
          ? 100
          : 0;

    mapped.push({
      id: inv.id,
      number: inv.number,
      type: inv.type,
      status: inv.status,
      subject: inv.subject,
      issueDate: inv.issueDate.toISOString(),
      dueDate: inv.dueDate?.toISOString() ?? null,
      totalHt: roundMoney(totalHt, 2),
      totalVat: roundMoney(totalVat, 2),
      totalTtc: roundMoney(totalTtc, 2),
      amountPaid: roundMoney(amountPaid, 2),
      amountDue: roundMoney(amountDue, 2),
      paidPercent,
      daysLate: daysOverdue(inv.dueDate, now),
      daysUntilDue: daysUntilDue(inv.dueDate, now),
      lastReminderAt: inv.lastReminderAt?.toISOString() ?? null,
      reminderCount: inv.reminderCount,
      clientId: inv.clientExternalOrgId,
      clientName,
      projectId: inv.projectId,
      projectTitle,
      quoteId: inv.quoteId,
      quoteNumber,
      progressStatementId: inv.progressStatementId,
      progressNumber,
      progressLabel,
      marketCumulativePercent,
      lastPaymentAt: lastPay?.paidAt?.toISOString() ?? null,
      lastPaymentAmount: lastPay ? roundMoney(d(lastPay.amount), 2) : null,
      lastPaymentMethod: lastPay?.method ?? null,
      originLabel: originLabel(inv),
      documentsHref: `/dashboard/documents?q=${encodeURIComponent(inv.number)}`,
    });
  }

  if (sort === "client_az") {
    mapped.sort((a, b) =>
      (a.clientName || "zzz").localeCompare(b.clientName || "zzz", "fr"),
    );
  }

  return mapped;
}
