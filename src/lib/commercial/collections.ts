/**
 * DF-4 — Hub encaissements + entretien OVERDUE.
 */
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import { roundMoney } from "@/lib/commercial/money";
import {
  agingBucket,
  daysOverdue,
  evaluateCommercialInvoiceStatus,
  isCollectibleInvoiceType,
  isDueDatePast,
  type AgingBucket,
} from "@/lib/commercial/invoice-status";
import { createNotification } from "@/lib/notifications";

export type CollectionsFilter =
  | "all"
  | "upcoming"
  | "overdue"
  | "partial"
  | "paid";

export type CollectionsKpis = {
  aEncaisserTtc: number;
  enRetardTtc: number;
  encaisseMoisTtc: number;
  echeances7jTtc: number;
  echeances30jTtc: number;
};

export type CollectionsRow = {
  id: string;
  number: string;
  type: string;
  status: string;
  issueDate: Date;
  dueDate: Date | null;
  totalTtc: number;
  amountPaid: number;
  amountDue: number;
  daysLate: number;
  aging: AgingBucket;
  lastReminderAt: Date | null;
  reminderCount: number;
  clientName: string | null;
  projectTitle: string | null;
  quoteNumber: string | null;
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

export async function loadCollectionsKpis(orgId: string): Promise<CollectionsKpis> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const in7 = new Date(today);
  in7.setDate(in7.getDate() + 7);
  const in30 = new Date(today);
  in30.setDate(in30.getDate() + 30);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [openInvoices, paymentsMonth] = await Promise.all([
    prisma.commercialInvoice.findMany({
      where: {
        organizationId: orgId,
        status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] },
        type: { not: "CREDIT" },
        amountDue: { gt: 0 },
      },
      select: { amountDue: true, dueDate: true, status: true },
    }),
    prisma.commercialPayment.aggregate({
      where: {
        organizationId: orgId,
        cancelledAt: null,
        paidAt: { gte: monthStart },
      },
      _sum: { amount: true },
    }),
  ]);

  let aEncaisserTtc = 0;
  let enRetardTtc = 0;
  let echeances7jTtc = 0;
  let echeances30jTtc = 0;

  for (const inv of openInvoices) {
    const due = d(inv.amountDue);
    const overdue =
      inv.status === "OVERDUE" || isDueDatePast(inv.dueDate, now);
    if (overdue) {
      enRetardTtc += due;
    } else {
      aEncaisserTtc += due;
      if (inv.dueDate) {
        const dd = new Date(inv.dueDate);
        if (dd >= today && dd <= in7) echeances7jTtc += due;
        if (dd >= today && dd <= in30) echeances30jTtc += due;
      }
    }
  }

  return {
    aEncaisserTtc: roundMoney(aEncaisserTtc, 2),
    enRetardTtc: roundMoney(enRetardTtc, 2),
    encaisseMoisTtc: roundMoney(d(paymentsMonth._sum.amount), 2),
    echeances7jTtc: roundMoney(echeances7jTtc, 2),
    echeances30jTtc: roundMoney(echeances30jTtc, 2),
  };
}

export async function listCollectionsInvoices(
  orgId: string,
  opts?: { filter?: CollectionsFilter; q?: string },
): Promise<CollectionsRow[]> {
  const filter = opts?.filter ?? "all";
  const q = opts?.q?.trim().toLowerCase() || "";
  const now = new Date();

  const baseWhere: {
    organizationId: string;
    type: { not: "CREDIT" };
    status?:
      | { in: Array<"ISSUED" | "PARTIALLY_PAID" | "OVERDUE" | "PAID"> }
      | "OVERDUE"
      | "PAID"
      | "PARTIALLY_PAID";
  } = {
    organizationId: orgId,
    type: { not: "CREDIT" },
  };

  if (filter === "upcoming") {
    baseWhere.status = { in: ["ISSUED", "PARTIALLY_PAID"] };
  } else if (filter === "overdue") {
    baseWhere.status = "OVERDUE";
  } else if (filter === "partial") {
    baseWhere.status = { in: ["PARTIALLY_PAID", "OVERDUE"] };
  } else if (filter === "paid") {
    baseWhere.status = "PAID";
  } else {
    baseWhere.status = { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE", "PAID"] };
  }

  const rows = await prisma.commercialInvoice.findMany({
    where: baseWhere,
    orderBy: [{ dueDate: "asc" }, { issueDate: "desc" }],
    take: 200,
    include: {
      clientExternalOrg: { select: { name: true, tradeName: true } },
      project: { select: { title: true } },
      quote: { select: { number: true } },
    },
  });

  const mapped: CollectionsRow[] = [];
  for (const inv of rows) {
    if (!isCollectibleInvoiceType(inv.type)) continue;
    const amountDue = d(inv.amountDue);
    const amountPaid = d(inv.amountPaid);
    const totalTtc = d(inv.totalTtc);

    if (filter === "upcoming" && isDueDatePast(inv.dueDate, now)) continue;
    if (filter === "upcoming" && amountDue <= 0.004) continue;
    if (filter === "partial" && !(amountPaid > 0.004 && amountDue > 0.004)) {
      continue;
    }

    const clientName = clientLabel(inv);
    const projectTitle = inv.project?.title ?? null;
    const quoteNumber = inv.quote?.number ?? null;

    if (q) {
      const hay = [
        inv.number,
        clientName,
        projectTitle,
        quoteNumber,
        inv.subject,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) continue;
    }

    mapped.push({
      id: inv.id,
      number: inv.number,
      type: inv.type,
      status: inv.status,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      totalTtc,
      amountPaid,
      amountDue,
      daysLate: daysOverdue(inv.dueDate, now),
      aging: agingBucket(inv.dueDate, amountDue, now),
      lastReminderAt: inv.lastReminderAt,
      reminderCount: inv.reminderCount,
      clientName,
      projectTitle,
      quoteNumber,
    });
  }

  return mapped;
}

/**
 * Passe en OVERDUE les factures émises échues non soldées.
 * Idempotent — pour cron + accès hub.
 */
export async function refreshCommercialOverdueStatuses(opts?: {
  orgId?: string;
  now?: Date;
  notify?: boolean;
}): Promise<{ updated: number; notified: number }> {
  const now = opts?.now ?? new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const candidates = await prisma.commercialInvoice.findMany({
    where: {
      ...(opts?.orgId ? { organizationId: opts.orgId } : {}),
      status: { in: ["ISSUED", "PARTIALLY_PAID"] },
      type: { not: "CREDIT" },
      amountDue: { gt: 0 },
      dueDate: { lt: today },
    },
    select: {
      id: true,
      organizationId: true,
      number: true,
      status: true,
      type: true,
      totalTtc: true,
      amountPaid: true,
      amountDue: true,
      dueDate: true,
      createdById: true,
    },
    take: 500,
  });

  let updated = 0;
  let notified = 0;

  for (const inv of candidates) {
    const next = evaluateCommercialInvoiceStatus({
      status: inv.status,
      type: inv.type,
      totalTtc: d(inv.totalTtc),
      amountPaid: d(inv.amountPaid),
      amountDue: d(inv.amountDue),
      dueDate: inv.dueDate,
      now,
    });
    if (next !== "OVERDUE") continue;

    await prisma.$transaction(async (tx) => {
      await tx.commercialInvoice.update({
        where: { id: inv.id },
        data: { status: "OVERDUE" },
      });
      await tx.commercialStatusEvent.create({
        data: {
          organizationId: inv.organizationId,
          entityType: "INVOICE",
          entityId: inv.id,
          fromStatus: inv.status,
          toStatus: "OVERDUE",
          label: "Passage en retard (échéance dépassée)",
        },
      });
    });
    updated += 1;

    if (opts?.notify !== false) {
      const level = daysOverdue(inv.dueDate, now) >= 15 ? "URGENT" : "IMPORTANT";
      const title =
        level === "URGENT"
          ? `Facture en retard — ${inv.number}`
          : `Échéance dépassée — ${inv.number}`;
      const message = `Reste dû ${d(inv.amountDue).toFixed(2)} € — échéance dépassée.`;
      const actionUrl = `/dashboard/devis-facturation/factures/${inv.id}`;

      const recipientIds = new Set<string>();
      if (inv.createdById) recipientIds.add(inv.createdById);
      else {
        const members = await prisma.organizationMember.findMany({
          where: { organizationId: inv.organizationId },
          select: { userId: true },
          take: 30,
        });
        for (const m of members) recipientIds.add(m.userId);
      }

      for (const userId of recipientIds) {
        const dedupeKey = `COMMERCIAL_OVERDUE:${userId}:${inv.id}:${level}`;
        await createNotification({
          userId,
          type: "COMMERCIAL_INVOICE_OVERDUE",
          title,
          message,
          actionUrl,
          dedupeKey,
        });
        notified += 1;
      }
    }
  }

  return { updated, notified };
}
