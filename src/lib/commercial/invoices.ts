import type { CommercialInvoiceType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  calculateLine,
  calculateDocumentTotals,
  depositAmountFromPercent,
  roundMoney,
} from "@/lib/commercial/money";
import { d } from "@/lib/commercial/decimal";
import { nextInvoiceNumber, ensureCommercialOrgSettings } from "@/lib/commercial/settings";
import {
  firstScheduleLineOfType,
  type PaymentScheduleLineType,
} from "@/lib/commercial/payment-schedule";
import { loadDealFinancialSummary } from "@/lib/commercial/deal-summary";
import {
  generateCommercialInvoicePdf,
  type InvoicePdfInput,
} from "@/lib/commercial/pdf-invoice";
import type { QuotePdfSnapshot } from "@/lib/commercial/pdf-quote";
import {
  assertPaymentWithinRemaining,
  defaultDueDateFromIssue,
  evaluateCommercialInvoiceStatus,
} from "@/lib/commercial/invoice-status";

async function sumValidPayments(
  tx: Prisma.TransactionClient,
  orgId: string,
  invoiceId: string,
): Promise<number> {
  const agg = await tx.commercialPayment.aggregate({
    where: {
      organizationId: orgId,
      invoiceId,
      cancelledAt: null,
    },
    _sum: { amount: true },
  });
  return roundMoney(d(agg._sum.amount), 2);
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
      quote: {
        select: {
          id: true,
          number: true,
          subject: true,
          siteAddressSnapshot: true,
        },
      },
      project: { select: { id: true, title: true } },
      clientExternalOrg: { select: { id: true, name: true, tradeName: true } },
      createdBy: { select: { id: true, name: true } },
      annualServiceIntervention: {
        select: {
          contractId: true,
          contract: { select: { clientName: true } },
        },
      },
    },
  });
  if (!inv) return null;
  return {
    ...inv,
    annualContractOrigin: inv.annualServiceIntervention
      ? {
          contractId: inv.annualServiceIntervention.contractId,
          clientName: inv.annualServiceIntervention.contract.clientName,
          href: `/dashboard/contrats-annuels?view=piloter&contract=${encodeURIComponent(inv.annualServiceIntervention.contractId)}`,
        }
      : null,
    totalSellHt: d(inv.totalSellHt),
    totalVat: d(inv.totalVat),
    totalTtc: d(inv.totalTtc),
    amountPaid: d(inv.amountPaid),
    amountDue: d(inv.amountDue),
    depositPercent: inv.depositPercent != null ? d(inv.depositPercent) : null,
    worksSellHt: inv.worksSellHt != null ? d(inv.worksSellHt) : null,
    worksVat: inv.worksVat != null ? d(inv.worksVat) : null,
    worksTtc: inv.worksTtc != null ? d(inv.worksTtc) : null,
    retentionAmountHt: d(inv.retentionAmountHt ?? 0),
    retentionRate: inv.retentionRate != null ? d(inv.retentionRate) : null,
    depositDeductedHt: d(inv.depositDeductedHt ?? 0),
    prorataAmountHt: d(inv.prorataAmountHt ?? 0),
    prorataRate: inv.prorataRate != null ? d(inv.prorataRate) : null,
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

function asSnapshot(raw: unknown): QuotePdfSnapshot | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as QuotePdfSnapshot;
}

/** Résout % + libellé acompte : échéancier DEPOSIT → depositPercent → 30. */
export function resolveDepositTerms(quote: {
  paymentScheduleJson?: unknown;
  depositPercent?: number | null;
}): { percent: number; label: string; source: "schedule" | "depositPercent" | "default" } {
  const depositLine = firstScheduleLineOfType(quote.paymentScheduleJson, "DEPOSIT");
  if (depositLine) {
    return {
      percent: depositLine.percent,
      label: depositLine.label,
      source: "schedule",
    };
  }
  if (quote.depositPercent != null && Number(quote.depositPercent) > 0) {
    return {
      percent: roundMoney(Number(quote.depositPercent), 4),
      label: `Acompte de ${roundMoney(Number(quote.depositPercent), 2)} %`,
      source: "depositPercent",
    };
  }
  return { percent: 30, label: "Acompte à la commande", source: "default" };
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
      paymentScheduleJson: true,
    },
  });
  if (!quote) throw new Error("Devis introuvable");
  if (quote.status !== "ACCEPTED") {
    throw new Error("Acompte réservé aux devis acceptés");
  }

  const summary = await loadDealFinancialSummary(input.orgId, quote.id);
  const remaining = summary?.remainingToInvoiceHt ?? d(quote.totalSellHt);
  if (remaining <= 0.01) {
    throw new Error("Rien à facturer — marché déjà facturé");
  }

  const terms = resolveDepositTerms({
    paymentScheduleJson: quote.paymentScheduleJson,
    depositPercent:
      quote.depositPercent != null ? d(quote.depositPercent) : null,
  });
  const percent = input.percent ?? terms.percent;
  const marketHt = d(quote.totalSellHt);
  let amountHt =
    input.amountHt != null
      ? roundMoney(input.amountHt, 2)
      : depositAmountFromPercent(marketHt, percent);
  amountHt = roundMoney(Math.min(amountHt, remaining), 2);
  if (amountHt <= 0) throw new Error("Montant d’acompte invalide");

  const vatRate = d(quote.defaultVatRate);
  const calc = calculateLine({
    kind: "WORK",
    quantity: 1,
    unitSellHt: amountHt,
    vatRate,
  });
  const designation =
    terms.source === "schedule"
      ? `${terms.label} (${percent} %) — devis ${quote.number}`
      : `Acompte de ${percent} % sur devis ${quote.number} — ${quote.subject}`;

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
        designation,
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

/**
 * Situation ou solde depuis un devis accepté (montant HT marché, pas ligne à ligne).
 * - FINAL / useRemaining → reste à facturer
 * - PROGRESS + échéancier → % PROGRESS du marché, plafonné au reste
 */
export async function createQuoteProgressInvoice(input: {
  orgId: string;
  userId: string;
  quoteId: string;
  type: "PROGRESS" | "FINAL" | "STANDARD";
  amountHt?: number;
  useRemaining?: boolean;
  useSchedule?: boolean;
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
      paymentScheduleJson: true,
    },
  });
  if (!quote) throw new Error("Devis introuvable");
  if (quote.status !== "ACCEPTED") {
    throw new Error("Facturation réservée aux devis acceptés");
  }

  const summary = await loadDealFinancialSummary(input.orgId, quote.id);
  const remaining = summary?.remainingToInvoiceHt ?? 0;
  if (remaining <= 0.01) {
    throw new Error("Rien à facturer — marché déjà facturé");
  }

  const marketHt = d(quote.totalSellHt);
  const vatRate = d(quote.defaultVatRate);
  let amountHt: number;
  let designation: string;
  let subject: string;

  if (input.type === "FINAL" || input.useRemaining) {
    amountHt = roundMoney(remaining, 2);
    designation = `Solde — devis ${quote.number} — ${quote.subject}`;
    subject = `Solde — ${quote.number}`;
  } else if (input.useSchedule) {
    const scheduleType: PaymentScheduleLineType =
      input.type === "PROGRESS" ? "PROGRESS" : "FINAL";
    const line = firstScheduleLineOfType(quote.paymentScheduleJson, scheduleType);
    if (!line) {
      throw new Error(
        `Aucune échéance ${scheduleType} dans l’échéancier — indiquez un montant`,
      );
    }
    amountHt = roundMoney(
      Math.min(depositAmountFromPercent(marketHt, line.percent), remaining),
      2,
    );
    designation = `${line.label} (${line.percent} %) — devis ${quote.number}`;
    subject = `${line.label} — ${quote.number}`;
  } else if (input.amountHt != null) {
    amountHt = roundMoney(input.amountHt, 2);
    if (amountHt > remaining + 0.01) {
      throw new Error(
        `Montant supérieur au reste à facturer (${remaining.toFixed(2)} € HT)`,
      );
    }
    designation =
      input.type === "PROGRESS"
        ? `Situation — devis ${quote.number} — ${quote.subject}`
        : `Facture — devis ${quote.number} — ${quote.subject}`;
    subject =
      input.type === "PROGRESS"
        ? `Situation — ${quote.number}`
        : `Facture — ${quote.number}`;
  } else {
    throw new Error("Montant HT requis");
  }

  if (amountHt <= 0) throw new Error("Montant invalide");

  return createStandardInvoice({
    orgId: input.orgId,
    userId: input.userId,
    quoteId: quote.id,
    subject,
    clientExternalOrgId: quote.clientExternalOrgId,
    projectId: quote.projectId,
    dueDate: input.dueDate ?? null,
    type: input.type === "FINAL" || input.useRemaining ? "FINAL" : input.type,
    lines: [
      {
        designation,
        quantity: 1,
        unit: "U",
        unitSellHt: amountHt,
        vatRate,
      },
    ],
  });
}

export async function generateInvoicePdfPreview(
  orgId: string,
  invoiceId: string,
): Promise<{ buffer: Buffer; filename: string } | null> {
  const inv = await getInvoiceDetail(orgId, invoiceId);
  if (!inv) return null;
  const settings = await ensureCommercialOrgSettings(orgId);

  const pdfInput: InvoicePdfInput = {
    number: inv.number,
    subject: inv.subject ?? inv.number,
    status: inv.status,
    type: inv.type,
    issueDate: inv.issueDate,
    dueDate: inv.dueDate,
    issuedAt: inv.issuedAt,
    clientNotes: inv.clientNotes,
    projectTitle: inv.project?.title ?? null,
    siteAddressSnapshot: inv.quote?.siteAddressSnapshot ?? null,
    quoteNumber: inv.quote?.number ?? null,
    issuer: asSnapshot(inv.issuerSnapshotJson),
    client: asSnapshot(inv.clientSnapshotJson),
    currency: inv.currency,
    invoiceMentions: settings.invoiceMentions,
    legalMentions: settings.legalMentions,
    bankIban: settings.bankIban,
    bankBic: settings.bankBic,
    bankName: settings.bankName,
    depositPercent: inv.depositPercent,
    worksSellHt: inv.worksSellHt,
    worksVat: inv.worksVat,
    worksTtc: inv.worksTtc,
    retentionAmountHt: inv.retentionAmountHt,
    retentionRate: inv.retentionRate,
    depositDeductedHt: inv.depositDeductedHt,
    prorataAmountHt: inv.prorataAmountHt,
    prorataRate: inv.prorataRate,
    totals: {
      totalSellHt: inv.totalSellHt,
      totalVat: inv.totalVat,
      totalTtc: inv.totalTtc,
      amountPaid: inv.amountPaid,
      amountDue: inv.amountDue,
    },
    lines: inv.lines.map((l) => ({
      designation: l.designation,
      description: l.description,
      quantity: l.quantity,
      unit: l.unit,
      unitSellHt: l.unitSellHt,
      vatRate: l.vatRate,
      lineSellHt: l.lineSellHt,
    })),
  };

  const buffer = generateCommercialInvoicePdf(pdfInput);
  const safe = inv.number.replace(/[^\w.-]+/g, "_");
  return { buffer, filename: `facture-${safe}.pdf` };
}

export async function createStandardInvoice(input: {
  orgId: string;
  userId: string;
  quoteId?: string | null;
  amendmentId?: string | null;
  subject: string;
  clientExternalOrgId?: string | null;
  projectId?: string | null;
  dueDate?: Date | null;
  type?: CommercialInvoiceType;
  /** Snapshots libres (ex. contrat annuel sans devis). */
  clientSnapshotJson?: Prisma.InputJsonValue | null;
  issuerSnapshotJson?: Prisma.InputJsonValue | null;
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

  let resolvedQuoteId = input.quoteId ?? null;
  let resolvedAmendmentId = input.amendmentId ?? null;

  if (resolvedAmendmentId) {
    const amendment = await prisma.commercialAmendment.findFirst({
      where: { id: resolvedAmendmentId, organizationId: input.orgId },
      select: {
        id: true,
        status: true,
        quoteId: true,
        number: true,
        totalSellHt: true,
        quote: {
          select: {
            projectId: true,
            clientExternalOrgId: true,
            clientSnapshotJson: true,
            issuerSnapshotJson: true,
            organizationId: true,
          },
        },
      },
    });
    if (!amendment) throw new Error("Avenant introuvable ou hors organisation");
    if (amendment.status !== "ACCEPTED") {
      throw new Error("Seuls les avenants acceptés peuvent être facturés");
    }
    if (resolvedQuoteId && resolvedQuoteId !== amendment.quoteId) {
      throw new Error("L’avenant n’appartient pas à ce devis");
    }
    resolvedQuoteId = amendment.quoteId;
    quoteSnapshots = {
      clientSnapshotJson: amendment.quote.clientSnapshotJson,
      issuerSnapshotJson: amendment.quote.issuerSnapshotJson,
      clientExternalOrgId: amendment.quote.clientExternalOrgId,
      projectId: amendment.quote.projectId,
    };
  } else if (input.quoteId) {
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

  if (input.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: input.projectId, organizationId: input.orgId },
      select: { id: true },
    });
    if (!project) throw new Error("Chantier introuvable ou hors organisation");
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

  if (resolvedAmendmentId) {
    const { loadAmendmentBillingProgressBatch } = await import(
      "@/lib/commercial/amendment-billing"
    );
    const map = await loadAmendmentBillingProgressBatch(input.orgId, [
      resolvedAmendmentId,
    ]);
    const progress = map.get(resolvedAmendmentId);
    if (!progress?.isBillable) {
      throw new Error("Cet avenant n’a plus de reste à facturer");
    }
    if (totals.totalSellHt > progress.remainingToInvoiceHt + 0.01) {
      throw new Error(
        `Montant supérieur au reste à facturer de l’avenant (${progress.remainingToInvoiceHt.toFixed(2)} € HT)`,
      );
    }
  }

  return prisma.$transaction(async (tx) => {
    const number = await nextInvoiceNumber(input.orgId, tx);
    const invoice = await tx.commercialInvoice.create({
      data: {
        organizationId: input.orgId,
        number,
        type: (input.type && input.type !== "DEPOSIT"
          ? input.type
          : "STANDARD") satisfies CommercialInvoiceType,
        status: "DRAFT",
        quoteId: resolvedQuoteId,
        amendmentId: resolvedAmendmentId,
        projectId: input.projectId ?? quoteSnapshots?.projectId ?? null,
        clientExternalOrgId:
          input.clientExternalOrgId ?? quoteSnapshots?.clientExternalOrgId ?? null,
        clientSnapshotJson:
          input.clientSnapshotJson ??
          (quoteSnapshots?.clientSnapshotJson as Prisma.InputJsonValue | undefined) ??
          undefined,
        issuerSnapshotJson:
          input.issuerSnapshotJson ??
          (quoteSnapshots?.issuerSnapshotJson as Prisma.InputJsonValue | undefined) ??
          undefined,
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
    select: { id: true, status: true, dueDate: true, issueDate: true },
  });
  if (!invoice) throw new Error("Facture introuvable");
  if (invoice.status !== "DRAFT") throw new Error("Facture déjà émise ou annulée");

  const dueDate = invoice.dueDate ?? defaultDueDateFromIssue(invoice.issueDate ?? new Date());

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.commercialInvoice.update({
      where: { id: invoiceId },
      data: {
        status: "ISSUED",
        issuedAt: new Date(),
        dueDate,
      },
    });
    await tx.commercialStatusEvent.create({
      data: {
        organizationId: orgId,
        entityType: "INVOICE",
        entityId: invoiceId,
        fromStatus: "DRAFT",
        toStatus: "ISSUED",
        label: `Facture émise — échéance ${dueDate.toLocaleDateString("fr-FR")}`,
        actorUserId,
      },
    });
    return next;
  });

  void import("@/lib/ged/ingest-commercial-document")
    .then(({ ingestCommercialInvoiceToGed }) =>
      ingestCommercialInvoiceToGed({ invoiceId, addedById: actorUserId }),
    )
    .catch((e) => console.error("GED ingest facture:", e));

  void import("@/lib/annual-contracts/sync-invoice-status")
    .then(({ onAnnualInvoiceIssued }) =>
      onAnnualInvoiceIssued({ orgId, invoiceId, actorUserId }),
    )
    .catch((e) => console.error("Contrats annuels sync émission:", e));

  return updated;
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
      type: true,
      totalTtc: true,
      amountPaid: true,
      amountDue: true,
      dueDate: true,
    },
  });
  if (!invoice) throw new Error("Facture introuvable");
  if (invoice.status === "CANCELLED" || invoice.status === "DRAFT") {
    throw new Error("Facture non éligible au règlement");
  }

  const previousPaid = d(invoice.amountPaid);
  const totalTtc = d(invoice.totalTtc);
  const remaining = roundMoney(Math.max(0, totalTtc - previousPaid), 2);
  assertPaymentWithinRemaining(remaining, amount);
  const newPaid = roundMoney(previousPaid + amount, 2);
  const amountDue = roundMoney(Math.max(0, totalTtc - newPaid), 2);
  const status = evaluateCommercialInvoiceStatus({
    status: invoice.status,
    type: invoice.type,
    totalTtc,
    amountPaid: newPaid,
    amountDue,
    dueDate: invoice.dueDate,
  });

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
  }).then(async (payment) => {
    if (status === "PAID") {
      const { settleRetentionIfInvoicePaid } = await import(
        "@/lib/commercial/retention"
      );
      await settleRetentionIfInvoicePaid(
        input.orgId,
        input.invoiceId,
        input.userId,
      );
    }
    return payment;
  });
}

/** Annulation traçable d’un paiement + recalcul facture. */
export async function cancelPayment(input: {
  orgId: string;
  paymentId: string;
  userId: string;
}) {
  const payment = await prisma.commercialPayment.findFirst({
    where: { id: input.paymentId, organizationId: input.orgId },
    select: {
      id: true,
      invoiceId: true,
      amount: true,
      cancelledAt: true,
      invoice: {
        select: {
          id: true,
          status: true,
          type: true,
          totalTtc: true,
          dueDate: true,
        },
      },
    },
  });
  if (!payment) throw new Error("Paiement introuvable");
  if (payment.cancelledAt) throw new Error("Paiement déjà annulé");
  if (
    payment.invoice.status === "DRAFT" ||
    payment.invoice.status === "CANCELLED"
  ) {
    throw new Error("Facture non éligible");
  }

  return prisma.$transaction(async (tx) => {
    await tx.commercialPayment.update({
      where: { id: payment.id },
      data: {
        cancelledAt: new Date(),
        cancelledById: input.userId,
      },
    });

    const newPaid = await sumValidPayments(tx, input.orgId, payment.invoiceId);
    const totalTtc = d(payment.invoice.totalTtc);
    const amountDue = roundMoney(Math.max(0, totalTtc - newPaid), 2);
    const fromStatus = payment.invoice.status;
    const status = evaluateCommercialInvoiceStatus({
      status: fromStatus === "PAID" ? "ISSUED" : fromStatus,
      type: payment.invoice.type,
      totalTtc,
      amountPaid: newPaid,
      amountDue,
      dueDate: payment.invoice.dueDate,
    });

    await tx.commercialInvoice.update({
      where: { id: payment.invoiceId },
      data: { amountPaid: newPaid, amountDue, status },
    });

    await tx.commercialStatusEvent.create({
      data: {
        organizationId: input.orgId,
        entityType: "INVOICE",
        entityId: payment.invoiceId,
        fromStatus,
        toStatus: status,
        label: `Annulation règlement ${d(payment.amount).toFixed(2)} €`,
        actorUserId: input.userId,
      },
    });

    return { invoiceId: payment.invoiceId, status, amountPaid: newPaid, amountDue };
  });
}

export async function updateInvoiceDueDate(input: {
  orgId: string;
  invoiceId: string;
  userId: string;
  dueDate: Date | null;
}) {
  const invoice = await prisma.commercialInvoice.findFirst({
    where: { id: input.invoiceId, organizationId: input.orgId },
    select: {
      id: true,
      status: true,
      type: true,
      totalTtc: true,
      amountPaid: true,
      amountDue: true,
      dueDate: true,
    },
  });
  if (!invoice) throw new Error("Facture introuvable");
  if (invoice.status === "CANCELLED") {
    throw new Error("Facture annulée");
  }

  const status =
    invoice.status === "DRAFT"
      ? "DRAFT"
      : evaluateCommercialInvoiceStatus({
          status: invoice.status,
          type: invoice.type,
          totalTtc: d(invoice.totalTtc),
          amountPaid: d(invoice.amountPaid),
          amountDue: d(invoice.amountDue),
          dueDate: input.dueDate,
        });

  return prisma.$transaction(async (tx) => {
    const updated = await tx.commercialInvoice.update({
      where: { id: invoice.id },
      data: {
        dueDate: input.dueDate,
        ...(invoice.status !== "DRAFT" ? { status } : {}),
      },
    });
    await tx.commercialStatusEvent.create({
      data: {
        organizationId: input.orgId,
        entityType: "INVOICE",
        entityId: invoice.id,
        fromStatus: invoice.status,
        toStatus: status,
        label: input.dueDate
          ? `Échéance fixée au ${input.dueDate.toLocaleDateString("fr-FR")}`
          : "Échéance effacée",
        actorUserId: input.userId,
      },
    });
    return updated;
  });
}

export async function markInvoiceReminded(input: {
  orgId: string;
  invoiceId: string;
  userId: string;
  comment?: string | null;
  channel?: string | null;
}) {
  const invoice = await prisma.commercialInvoice.findFirst({
    where: { id: input.invoiceId, organizationId: input.orgId },
    select: { id: true, status: true, amountDue: true, reminderCount: true },
  });
  if (!invoice) throw new Error("Facture introuvable");
  if (invoice.status === "DRAFT" || invoice.status === "CANCELLED") {
    throw new Error("Facture non éligible à la relance");
  }
  if (d(invoice.amountDue) <= 0.004) {
    throw new Error("Facture déjà soldée");
  }

  const channel = input.channel?.trim() || "MANUEL";
  const detail = [
    channel !== "MANUEL" ? `Canal : ${channel}` : null,
    input.comment?.trim() || null,
  ]
    .filter(Boolean)
    .join(" — ");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.commercialInvoice.update({
      where: { id: invoice.id },
      data: {
        lastReminderAt: new Date(),
        reminderCount: (invoice.reminderCount ?? 0) + 1,
      },
    });
    await tx.commercialStatusEvent.create({
      data: {
        organizationId: input.orgId,
        entityType: "INVOICE",
        entityId: invoice.id,
        fromStatus: invoice.status,
        toStatus: invoice.status,
        label: "Relance client",
        detail: detail || null,
        actorUserId: input.userId,
      },
    });
    return updated;
  });
}

export async function listPayments(orgId: string, opts?: { includeCancelled?: boolean }) {
  const rows = await prisma.commercialPayment.findMany({
    where: {
      organizationId: orgId,
      ...(opts?.includeCancelled ? {} : { cancelledAt: null }),
    },
    orderBy: { paidAt: "desc" },
    take: 100,
    include: {
      invoice: { select: { id: true, number: true, subject: true } },
      recordedBy: { select: { id: true, name: true } },
    },
  });
  return rows.map((p) => ({ ...p, amount: d(p.amount) }));
}
