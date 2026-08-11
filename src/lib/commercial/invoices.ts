import type { CommercialInvoiceStatus, CommercialInvoiceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  calculateLine,
  calculateDocumentTotals,
  depositAmountFromPercent,
  roundMoney,
} from "@/lib/commercial/money";
import { d } from "@/lib/commercial/decimal";
import { nextInvoiceNumber } from "@/lib/commercial/settings";

function invoicePaymentStatus(totalTtc: number, amountPaid: number): CommercialInvoiceStatus {
  const paid = roundMoney(amountPaid, 2);
  const total = roundMoney(totalTtc, 2);
  if (paid <= 0) return "ISSUED";
  if (paid >= total) return "PAID";
  return "PARTIALLY_PAID";
}

export async function listInvoices(orgId: string) {
  const rows = await prisma.commercialInvoice.findMany({
    where: { organizationId: orgId },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      quote: { select: { id: true, number: true, subject: true } },
      clientExternalOrg: { select: { id: true, name: true, tradeName: true } },
    },
  });
  return rows.map((inv) => ({
    ...inv,
    totalSellHt: d(inv.totalSellHt),
    totalVat: d(inv.totalVat),
    totalTtc: d(inv.totalTtc),
    amountPaid: d(inv.amountPaid),
    amountDue: d(inv.amountDue),
    depositPercent: inv.depositPercent != null ? d(inv.depositPercent) : null,
  }));
}

export async function getInvoiceDetail(orgId: string, id: string) {
  const inv = await prisma.commercialInvoice.findFirst({
    where: { id, organizationId: orgId },
    include: {
      lines: { orderBy: { sortOrder: "asc" } },
      payments: { orderBy: { paidAt: "desc" } },
      quote: { select: { id: true, number: true, subject: true } },
      clientExternalOrg: { select: { id: true, name: true, tradeName: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
  if (!inv) return null;
  return {
    ...inv,
    totalSellHt: d(inv.totalSellHt),
    totalVat: d(inv.totalVat),
    totalTtc: d(inv.totalTtc),
    amountPaid: d(inv.amountPaid),
    amountDue: d(inv.amountDue),
    depositPercent: inv.depositPercent != null ? d(inv.depositPercent) : null,
    lines: inv.lines.map((l) => ({
      ...l,
      quantity: d(l.quantity),
      unitSellHt: d(l.unitSellHt),
      vatRate: d(l.vatRate),
      lineSellHt: d(l.lineSellHt),
      lineVat: d(l.lineVat),
      lineTtc: d(l.lineTtc),
    })),
    payments: inv.payments.map((p) => ({
      ...p,
      amount: d(p.amount),
    })),
  };
}

export async function createDepositInvoice(input: {
  orgId: string;
  userId: string;
  quoteId: string;
  percent?: number;
  amountHt?: number;
  dueDate?: Date | null;
}) {
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: input.quoteId, organizationId: input.orgId },
    select: {
      id: true,
      status: true,
      number: true,
      subject: true,
      totalSellHt: true,
      defaultVatRate: true,
      projectId: true,
      clientExternalOrgId: true,
      clientSnapshotJson: true,
      issuerSnapshotJson: true,
      depositPercent: true,
    },
  });
  if (!quote) throw new Error("Devis introuvable");
  if (quote.status !== "ACCEPTED") {
    throw new Error("Acompte réservé aux devis acceptés");
  }

  const marketHt = d(quote.totalSellHt);
  const percent =
    input.percent ??
    (quote.depositPercent != null ? d(quote.depositPercent) : undefined) ??
    30;
  const amountHt =
    input.amountHt != null
      ? roundMoney(input.amountHt, 2)
      : depositAmountFromPercent(marketHt, percent);
  const vatRate = d(quote.defaultVatRate);
  const calc = calculateLine({
    kind: "WORK",
    quantity: 1,
    unitSellHt: amountHt,
    vatRate,
  });

  return prisma.$transaction(async (tx) => {
    const number = await nextInvoiceNumber(input.orgId, tx);
    const invoice = await tx.commercialInvoice.create({
      data: {
        organizationId: input.orgId,
        number,
        type: "DEPOSIT",
        status: "DRAFT",
        quoteId: quote.id,
        projectId: quote.projectId,
        clientExternalOrgId: quote.clientExternalOrgId,
        clientSnapshotJson: quote.clientSnapshotJson ?? undefined,
        issuerSnapshotJson: quote.issuerSnapshotJson ?? undefined,
        issueDate: new Date(),
        dueDate: input.dueDate ?? null,
        subject: `Acompte ${percent}% — ${quote.number}`,
        totalSellHt: calc.lineSellHt,
        totalVat: calc.lineVat,
        totalTtc: calc.lineTtc,
        amountPaid: 0,
        amountDue: calc.lineTtc,
        depositPercent: percent,
        createdById: input.userId,
      },
    });

    await tx.commercialInvoiceLine.create({
      data: {
        organizationId: input.orgId,
        invoiceId: invoice.id,
        designation: `Acompte de ${percent} % sur devis ${quote.number} — ${quote.subject}`,
        quantity: 1,
        unit: "U",
        unitSellHt: amountHt,
        vatRate,
        lineSellHt: calc.lineSellHt,
        lineVat: calc.lineVat,
        lineTtc: calc.lineTtc,
        sortOrder: 0,
      },
    });

    await tx.commercialStatusEvent.create({
      data: {
        organizationId: input.orgId,
        entityType: "INVOICE",
        entityId: invoice.id,
        fromStatus: null,
        toStatus: "DRAFT",
        label: "Création facture d’acompte",
        actorUserId: input.userId,
      },
    });

    return invoice;
  });
}

export async function createStandardInvoice(input: {
  orgId: string;
  userId: string;
  quoteId?: string | null;
  subject: string;
  clientExternalOrgId?: string | null;
  projectId?: string | null;
  dueDate?: Date | null;
  lines: Array<{
    designation: string;
    quantity?: number;
    unit?: string;
    unitSellHt: number;
    vatRate?: number;
    description?: string | null;
  }>;
}) {
  const subject = input.subject.trim();
  if (!subject) throw new Error("Objet facture requis");
  if (!input.lines.length) throw new Error("Au moins une ligne requise");

  let quoteSnapshots: {
    clientSnapshotJson: unknown;
    issuerSnapshotJson: unknown;
    clientExternalOrgId: string | null;
    projectId: string | null;
  } | null = null;

  if (input.quoteId) {
    const quote = await prisma.commercialQuote.findFirst({
      where: { id: input.quoteId, organizationId: input.orgId },
      select: {
        clientSnapshotJson: true,
        issuerSnapshotJson: true,
        clientExternalOrgId: true,
        projectId: true,
      },
    });
    if (!quote) throw new Error("Devis introuvable");
    quoteSnapshots = quote;
  }

  const prepared = input.lines.map((l, i) => {
    const quantity = l.quantity ?? 1;
    const vatRate = l.vatRate ?? 20;
    const calc = calculateLine({
      kind: "WORK",
      quantity,
      unitSellHt: l.unitSellHt,
      vatRate,
    });
    return {
      designation: l.designation.trim(),
      description: l.description ?? null,
      quantity,
      unit: l.unit ?? "U",
      unitSellHt: l.unitSellHt,
      vatRate,
      lineSellHt: calc.lineSellHt,
      lineVat: calc.lineVat,
      lineTtc: calc.lineTtc,
      sortOrder: i,
      calc,
    };
  });

  const totals = calculateDocumentTotals(
    prepared.map((p) => ({ ...p.calc, includedInTotals: true })),
  );

  return prisma.$transaction(async (tx) => {
    const number = await nextInvoiceNumber(input.orgId, tx);
    const invoice = await tx.commercialInvoice.create({
      data: {
        organizationId: input.orgId,
        number,
        type: "STANDARD" satisfies CommercialInvoiceType,
        status: "DRAFT",
        quoteId: input.quoteId ?? null,
        projectId: input.projectId ?? quoteSnapshots?.projectId ?? null,
        clientExternalOrgId:
          input.clientExternalOrgId ?? quoteSnapshots?.clientExternalOrgId ?? null,
        clientSnapshotJson: quoteSnapshots?.clientSnapshotJson ?? undefined,
        issuerSnapshotJson: quoteSnapshots?.issuerSnapshotJson ?? undefined,
        issueDate: new Date(),
        dueDate: input.dueDate ?? null,
        subject,
        totalSellHt: totals.totalSellHt,
        totalVat: totals.totalVat,
        totalTtc: totals.totalTtc,
        amountPaid: 0,
        amountDue: totals.totalTtc,
        createdById: input.userId,
      },
    });

    for (const line of prepared) {
      await tx.commercialInvoiceLine.create({
        data: {
          organizationId: input.orgId,
          invoiceId: invoice.id,
          designation: line.designation,
          description: line.description,
          quantity: line.quantity,
          unit: line.unit,
          unitSellHt: line.unitSellHt,
          vatRate: line.vatRate,
          lineSellHt: line.lineSellHt,
          lineVat: line.lineVat,
          lineTtc: line.lineTtc,
          sortOrder: line.sortOrder,
        },
      });
    }

    await tx.commercialStatusEvent.create({
      data: {
        organizationId: input.orgId,
        entityType: "INVOICE",
        entityId: invoice.id,
        fromStatus: null,
        toStatus: "DRAFT",
        label: "Création facture",
        actorUserId: input.userId,
      },
    });

    return invoice;
  });
}

export async function issueInvoice(orgId: string, invoiceId: string, actorUserId: string) {
  const invoice = await prisma.commercialInvoice.findFirst({
    where: { id: invoiceId, organizationId: orgId },
    select: { id: true, status: true },
  });
  if (!invoice) throw new Error("Facture introuvable");
  if (invoice.status !== "DRAFT") throw new Error("Facture déjà émise ou annulée");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.commercialInvoice.update({
      where: { id: invoiceId },
      data: { status: "ISSUED", issuedAt: new Date() },
    });
    await tx.commercialStatusEvent.create({
      data: {
        organizationId: orgId,
        entityType: "INVOICE",
        entityId: invoiceId,
        fromStatus: "DRAFT",
        toStatus: "ISSUED",
        label: "Facture émise",
        actorUserId,
      },
    });
    return updated;
  });
}

/** Enregistre un règlement client BTP — n’utilise PAS prisma.payment (SaaS). */
export async function recordPayment(input: {
  orgId: string;
  invoiceId: string;
  userId: string;
  amount: number;
  paidAt?: Date;
  method?: string;
  reference?: string | null;
  comment?: string | null;
}) {
  const amount = roundMoney(input.amount, 2);
  if (amount <= 0) throw new Error("Montant invalide");

  const invoice = await prisma.commercialInvoice.findFirst({
    where: { id: input.invoiceId, organizationId: input.orgId },
    select: {
      id: true,
      status: true,
      totalTtc: true,
      amountPaid: true,
    },
  });
  if (!invoice) throw new Error("Facture introuvable");
  if (invoice.status === "CANCELLED" || invoice.status === "DRAFT") {
    throw new Error("Facture non éligible au règlement");
  }

  const previousPaid = d(invoice.amountPaid);
  const totalTtc = d(invoice.totalTtc);
  const remaining = roundMoney(Math.max(0, totalTtc - previousPaid), 2);
  if (amount > remaining + 1e-9) {
    throw new Error(
      `Montant supérieur au reste dû (${remaining.toFixed(2)} €). Réduisez le règlement.`,
    );
  }
  const newPaid = roundMoney(previousPaid + amount, 2);
  const amountDue = roundMoney(Math.max(0, totalTtc - newPaid), 2);
  const status = invoicePaymentStatus(totalTtc, newPaid);

  return prisma.$transaction(async (tx) => {
    const payment = await tx.commercialPayment.create({
      data: {
        organizationId: input.orgId,
        invoiceId: input.invoiceId,
        amount,
        paidAt: input.paidAt ?? new Date(),
        method: input.method ?? "VIREMENT",
        reference: input.reference ?? null,
        comment: input.comment ?? null,
        recordedById: input.userId,
      },
    });

    await tx.commercialInvoice.update({
      where: { id: input.invoiceId },
      data: { amountPaid: newPaid, amountDue, status },
    });

    await tx.commercialStatusEvent.create({
      data: {
        organizationId: input.orgId,
        entityType: "INVOICE",
        entityId: input.invoiceId,
        fromStatus: invoice.status,
        toStatus: status,
        label: `Règlement ${amount.toFixed(2)} €`,
        actorUserId: input.userId,
      },
    });

    return payment;
  });
}

export async function listPayments(orgId: string) {
  const rows = await prisma.commercialPayment.findMany({
    where: { organizationId: orgId },
    orderBy: { paidAt: "desc" },
    take: 100,
    include: {
      invoice: { select: { id: true, number: true, subject: true } },
      recordedBy: { select: { id: true, name: true } },
    },
  });
  return rows.map((p) => ({ ...p, amount: d(p.amount) }));
}
