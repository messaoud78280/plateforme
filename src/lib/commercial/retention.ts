/**
 * DF-6A — Créances retenue de garantie (libération + encaissement).
 */
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import { calculateLine, roundMoney } from "@/lib/commercial/money";
import { nextInvoiceNumber } from "@/lib/commercial/settings";
import {
  effectiveRetentionStatus,
  RETENTION_STATUS_LABELS,
} from "@/lib/commercial/retention-calc";

export { RETENTION_STATUS_LABELS, effectiveRetentionStatus };

function mapRetention(r: {
  id: string;
  organizationId: string;
  quoteId: string;
  progressStatementId: string;
  situationInvoiceId: string | null;
  amountHt: unknown;
  amountVat: unknown;
  amountTtc: unknown;
  ratePercent: unknown;
  status: string;
  plannedReleaseDate: Date | null;
  releasedAt: Date | null;
  settledAt: Date | null;
  createdAt: Date;
  quote?: { id: string; number: string; subject: string } | null;
  progressStatement?: { id: string; label: string; number: number } | null;
  situationInvoice?: { id: string; number: string } | null;
  settlementInvoice?: { id: string; number: string; status: string; amountDue: unknown } | null;
  projectTitle?: string | null;
  clientName?: string | null;
}) {
  const effective = effectiveRetentionStatus(r.status, r.plannedReleaseDate);
  return {
    ...r,
    amountHt: d(r.amountHt),
    amountVat: d(r.amountVat),
    amountTtc: d(r.amountTtc),
    ratePercent: d(r.ratePercent),
    effectiveStatus: effective,
    statusLabel: RETENTION_STATUS_LABELS[effective] ?? effective,
  };
}

export async function listRetentionGuarantees(orgId: string) {
  const rows = await prisma.commercialRetentionGuarantee.findMany({
    where: { organizationId: orgId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      quote: {
        select: {
          id: true,
          number: true,
          subject: true,
          project: { select: { id: true, title: true } },
          clientExternalOrg: { select: { name: true, tradeName: true } },
        },
      },
      progressStatement: { select: { id: true, label: true, number: true } },
      situationInvoice: { select: { id: true, number: true } },
      settlementInvoice: {
        select: { id: true, number: true, status: true, amountDue: true },
      },
    },
  });

  return rows.map((r) =>
    mapRetention({
      ...r,
      projectTitle: r.quote.project?.title ?? null,
      clientName:
        r.quote.clientExternalOrg?.tradeName ||
        r.quote.clientExternalOrg?.name ||
        null,
    }),
  );
}

export async function getQuoteRetentionSummary(orgId: string, quoteId: string) {
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: quoteId, organizationId: orgId },
    select: {
      id: true,
      totalSellHt: true,
      retentionGuaranteePercent: true,
      retentionReleaseDueDate: true,
    },
  });
  if (!quote) return null;

  const first = await prisma.commercialProgressStatement.findFirst({
    where: { organizationId: orgId, quoteId, number: 1 },
    select: { marketSellHt: true },
  });
  const marketHt = first ? d(first.marketSellHt) : d(quote.totalSellHt);
  const rate = d(quote.retentionGuaranteePercent);
  const cap = roundMoney(marketHt * (rate / 100), 2);

  const retentions = await prisma.commercialRetentionGuarantee.findMany({
    where: { organizationId: orgId, quoteId },
  });

  let held = 0;
  let released = 0;
  let settled = 0;
  for (const r of retentions) {
    const amt = d(r.amountHt);
    const eff = effectiveRetentionStatus(r.status, r.plannedReleaseDate);
    if (eff === "SETTLED") settled += amt;
    else if (eff === "RELEASED") released += amt;
    else held += amt; // HELD or DUE
  }

  const locked = await prisma.commercialProgressStatement.findFirst({
    where: {
      organizationId: orgId,
      quoteId,
      status: { in: ["VALIDATED", "INVOICED"] },
      retentionPeriodHt: { gt: 0 },
    },
    select: { id: true },
  });

  return {
    ratePercent: rate,
    marketSellHt: marketHt,
    retentionCapHt: cap,
    retentionHeldHt: roundMoney(held, 2),
    retentionReleasedHt: roundMoney(released, 2),
    retentionSettledHt: roundMoney(settled, 2),
    retentionRemainingHt: roundMoney(Math.max(0, cap - held - released - settled), 2),
    releaseDueDate: quote.retentionReleaseDueDate,
    rateLocked: Boolean(locked),
  };
}

export async function updateQuoteRetentionSettings(input: {
  orgId: string;
  quoteId: string;
  retentionGuaranteePercent?: number;
  retentionReleaseDueDate?: Date | null;
}) {
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: input.quoteId, organizationId: input.orgId },
    select: { id: true, retentionGuaranteePercent: true },
  });
  if (!quote) throw new Error("Devis introuvable");

  if (input.retentionGuaranteePercent != null) {
    const next = roundMoney(input.retentionGuaranteePercent, 4);
    if (next < 0 || next > 100) throw new Error("Taux RG entre 0 et 100 %");
    const locked = await prisma.commercialProgressStatement.findFirst({
      where: {
        organizationId: input.orgId,
        quoteId: input.quoteId,
        status: { in: ["VALIDATED", "INVOICED"] },
        retentionPeriodHt: { gt: 0 },
      },
      select: { id: true },
    });
    if (locked && Math.abs(next - d(quote.retentionGuaranteePercent)) > 1e-6) {
      throw new Error(
        "Taux de RG figé : une situation avec RG a déjà été validée",
      );
    }
  }

  return prisma.commercialQuote.update({
    where: { id: quote.id },
    data: {
      ...(input.retentionGuaranteePercent != null
        ? { retentionGuaranteePercent: roundMoney(input.retentionGuaranteePercent, 4) }
        : {}),
      ...(input.retentionReleaseDueDate !== undefined
        ? { retentionReleaseDueDate: input.retentionReleaseDueDate }
        : {}),
    },
  });
}

/**
 * Libère la RG contractuellement + crée facture de libération (brouillon) pour encaissement.
 */
export async function releaseRetentionGuarantee(input: {
  orgId: string;
  userId: string;
  retentionId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const row = await tx.commercialRetentionGuarantee.findFirst({
      where: { id: input.retentionId, organizationId: input.orgId },
      include: {
        quote: {
          select: {
            id: true,
            number: true,
            projectId: true,
            clientExternalOrgId: true,
            clientSnapshotJson: true,
            issuerSnapshotJson: true,
            defaultVatRate: true,
          },
        },
        progressStatement: { select: { label: true } },
        settlementInvoice: true,
      },
    });
    if (!row) throw new Error("Retenue introuvable");
    if (row.status === "SETTLED") throw new Error("RG déjà encaissée");
    if (row.status === "RELEASED" && row.settlementInvoice) {
      return row;
    }

    const vatRate = d(row.quote.defaultVatRate);
    const amountHt = d(row.amountHt);
    const calc = calculateLine({
      kind: "WORK",
      quantity: 1,
      unitSellHt: amountHt,
      vatRate,
    });

    let settlementId = row.settlementInvoice?.id ?? null;
    if (!settlementId) {
      const number = await nextInvoiceNumber(input.orgId, tx);
      const invoice = await tx.commercialInvoice.create({
        data: {
          organizationId: input.orgId,
          number,
          type: "STANDARD",
          status: "DRAFT",
          quoteId: row.quoteId,
          projectId: row.quote.projectId,
          clientExternalOrgId: row.quote.clientExternalOrgId,
          clientSnapshotJson: row.quote.clientSnapshotJson ?? undefined,
          issuerSnapshotJson: row.quote.issuerSnapshotJson ?? undefined,
          issueDate: new Date(),
          subject: `Libération RG — ${row.progressStatement.label} — ${row.quote.number}`,
          clientNotes: `Libération de la retenue de garantie (${d(row.ratePercent)} %)`,
          worksSellHt: amountHt,
          worksVat: calc.lineVat,
          worksTtc: calc.lineTtc,
          retentionAmountHt: 0,
          totalSellHt: calc.lineSellHt,
          totalVat: calc.lineVat,
          totalTtc: calc.lineTtc,
          amountPaid: 0,
          amountDue: calc.lineTtc,
          createdById: input.userId,
        },
      });
      await tx.commercialInvoiceLine.create({
        data: {
          organizationId: input.orgId,
          invoiceId: invoice.id,
          designation: `Libération retenue de garantie — ${row.progressStatement.label}`,
          description: `Marché ${row.quote.number} · ${d(row.ratePercent)} %`,
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
      settlementId = invoice.id;
    }

    const updated = await tx.commercialRetentionGuarantee.update({
      where: { id: row.id },
      data: {
        status: "RELEASED",
        releasedAt: new Date(),
        releasedById: input.userId,
        settlementInvoiceId: settlementId,
      },
    });

    await tx.commercialStatusEvent.create({
      data: {
        organizationId: input.orgId,
        entityType: "RETENTION_GUARANTEE",
        entityId: row.id,
        fromStatus: row.status,
        toStatus: "RELEASED",
        label: "Libération retenue de garantie",
        actorUserId: input.userId,
      },
    });

    return updated;
  });
}

/** Marque SETTLED quand la facture de libération est entièrement payée. */
export async function settleRetentionIfInvoicePaid(
  orgId: string,
  invoiceId: string,
  userId: string,
) {
  const inv = await prisma.commercialInvoice.findFirst({
    where: { id: invoiceId, organizationId: orgId },
    select: {
      id: true,
      status: true,
      amountDue: true,
    },
  });
  if (!inv) return null;
  if (inv.status !== "PAID" && d(inv.amountDue) > 0.01) return null;

  const ret = await prisma.commercialRetentionGuarantee.findFirst({
    where: { settlementInvoiceId: invoiceId, organizationId: orgId },
  });
  if (!ret || ret.status === "SETTLED") return ret;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.commercialRetentionGuarantee.update({
      where: { id: ret.id },
      data: { status: "SETTLED", settledAt: new Date() },
    });
    await tx.commercialStatusEvent.create({
      data: {
        organizationId: orgId,
        entityType: "RETENTION_GUARANTEE",
        entityId: ret.id,
        fromStatus: ret.status,
        toStatus: "SETTLED",
        label: "RG encaissée",
        actorUserId: userId,
      },
    });
    return updated;
  });
}
