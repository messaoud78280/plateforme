/**
 * DF-5 — Situations de travaux (CRUD, validation, facture période).
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import { roundMoney, calculateLine } from "@/lib/commercial/money";
import { nextInvoiceNumber } from "@/lib/commercial/settings";
import {
  computeProgressLine,
  computeProgressTotals,
  PROGRESS_STATEMENT_STATUS_LABELS,
} from "@/lib/commercial/progress-calc";
import { computeRetentionForPeriod } from "@/lib/commercial/retention-calc";

export { PROGRESS_STATEMENT_STATUS_LABELS };

export type ContractSnapshotLine = {
  sourceQuoteLineId: string | null;
  sortOrder: number;
  reference: string | null;
  designation: string;
  description: string | null;
  unit: string;
  contractQuantity: number;
  unitSellHt: number;
  vatRate: number;
  contractSellHt: number;
};

function mapLine(l: {
  id: string;
  sourceQuoteLineId: string | null;
  sortOrder: number;
  reference: string | null;
  designation: string;
  description: string | null;
  unit: string;
  contractQuantity: unknown;
  unitSellHt: unknown;
  vatRate: unknown;
  contractSellHt: unknown;
  previousPercent: unknown;
  previousQuantity: unknown;
  previousSellHt: unknown;
  periodPercent: unknown;
  periodQuantity: unknown;
  periodSellHt: unknown;
  cumulativePercent: unknown;
  cumulativeQuantity: unknown;
  cumulativeSellHt: unknown;
  remainingSellHt: unknown;
}) {
  return {
    ...l,
    contractQuantity: d(l.contractQuantity),
    unitSellHt: d(l.unitSellHt),
    vatRate: d(l.vatRate),
    contractSellHt: d(l.contractSellHt),
    previousPercent: d(l.previousPercent),
    previousQuantity: d(l.previousQuantity),
    previousSellHt: d(l.previousSellHt),
    periodPercent: d(l.periodPercent),
    periodQuantity: d(l.periodQuantity),
    periodSellHt: d(l.periodSellHt),
    cumulativePercent: d(l.cumulativePercent),
    cumulativeQuantity: d(l.cumulativeQuantity),
    cumulativeSellHt: d(l.cumulativeSellHt),
    remainingSellHt: d(l.remainingSellHt),
  };
}

function mapStatement<T extends Record<string, unknown>>(s: T) {
  const moneyKeys = [
    "marketSellHt",
    "marketVat",
    "marketTtc",
    "previousSellHt",
    "previousVat",
    "previousTtc",
    "periodSellHt",
    "periodVat",
    "periodTtc",
    "cumulativeSellHt",
    "cumulativeVat",
    "cumulativeTtc",
    "remainingSellHt",
    "remainingVat",
    "remainingTtc",
    "retentionRateSnapshot",
    "retentionCapHt",
    "retentionPreviousHt",
    "retentionPeriodHt",
    "retentionCumulativeHt",
    "netPeriodSellHt",
    "netPeriodVat",
    "netPeriodTtc",
  ] as const;
  const out: Record<string, unknown> = { ...s };
  for (const k of moneyKeys) {
    if (k in s) out[k] = d((s as Record<string, unknown>)[k]);
  }
  return out;
}

async function loadAcceptedBillableLines(orgId: string, quoteId: string) {
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: quoteId, organizationId: orgId },
    select: {
      id: true,
      status: true,
      number: true,
      subject: true,
      projectId: true,
      clientExternalOrgId: true,
      clientSnapshotJson: true,
      issuerSnapshotJson: true,
      acceptedVersionId: true,
      currentVersionId: true,
      retentionGuaranteePercent: true,
      retentionReleaseDueDate: true,
      defaultVatRate: true,
    },
  });
  if (!quote) throw new Error("Devis introuvable");
  if (quote.status !== "ACCEPTED") {
    throw new Error("Situations réservées aux devis acceptés");
  }

  const versionId = quote.acceptedVersionId ?? quote.currentVersionId;
  if (!versionId) throw new Error("Aucune version acceptée pour ce devis");

  const version = await prisma.commercialQuoteVersion.findFirst({
    where: { id: versionId, organizationId: orgId, quoteId },
    include: {
      lines: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!version) throw new Error("Version de devis introuvable");

  const billable = version.lines.filter(
    (l) => l.kind === "WORK" && !l.isOptional,
  );
  if (billable.length === 0) {
    throw new Error("Aucune ligne d’ouvrage facturable sur le marché accepté");
  }

  const snapshot: ContractSnapshotLine[] = billable.map((l, i) => ({
    sourceQuoteLineId: l.id,
    sortOrder: i,
    reference: l.reference,
    designation: l.designation,
    description: l.description,
    unit: l.unit,
    contractQuantity: d(l.quantity),
    unitSellHt: d(l.unitSellHt),
    vatRate: d(l.vatRate),
    contractSellHt: d(l.lineSellHt),
  }));

  return { quote, snapshot };
}

export async function listProgressStatements(orgId: string, quoteId: string) {
  const rows = await prisma.commercialProgressStatement.findMany({
    where: { organizationId: orgId, quoteId },
    orderBy: { number: "asc" },
    include: {
      invoice: { select: { id: true, number: true, status: true } },
    },
  });
  return rows.map((r) => mapStatement(r as unknown as Record<string, unknown>));
}

export async function getProgressStatementDetail(orgId: string, id: string) {
  const row = await prisma.commercialProgressStatement.findFirst({
    where: { id, organizationId: orgId },
    include: {
      lines: { orderBy: { sortOrder: "asc" } },
      quote: {
        select: {
          id: true,
          number: true,
          subject: true,
          status: true,
        },
      },
      project: { select: { id: true, title: true } },
      invoice: {
        select: { id: true, number: true, status: true, totalSellHt: true },
      },
      createdBy: { select: { id: true, name: true } },
      validatedBy: { select: { id: true, name: true } },
    },
  });
  if (!row) return null;
  return {
    ...mapStatement(row as unknown as Record<string, unknown>),
    lines: row.lines.map(mapLine),
    quote: row.quote,
    project: row.project,
    invoice: row.invoice
      ? {
          ...row.invoice,
          totalSellHt: d(row.invoice.totalSellHt),
        }
      : null,
    createdBy: row.createdBy,
    validatedBy: row.validatedBy,
  };
}

export async function createProgressStatement(input: {
  orgId: string;
  userId: string;
  quoteId: string;
}) {
  const draftExists = await prisma.commercialProgressStatement.findFirst({
    where: {
      organizationId: input.orgId,
      quoteId: input.quoteId,
      status: "DRAFT",
    },
    select: { id: true, number: true },
  });
  if (draftExists) {
    throw new Error(
      `Une situation brouillon existe déjà (n°${draftExists.number}). Validez-la ou ouvrez-la.`,
    );
  }

  const { quote, snapshot } = await loadAcceptedBillableLines(
    input.orgId,
    input.quoteId,
  );

  const lastClosed = await prisma.commercialProgressStatement.findFirst({
    where: {
      organizationId: input.orgId,
      quoteId: input.quoteId,
      status: { in: ["VALIDATED", "INVOICED"] },
    },
    orderBy: { number: "desc" },
    include: { lines: { orderBy: { sortOrder: "asc" } } },
  });

  const nextNumber = (lastClosed?.number ?? 0) + 1;
  const label = `Situation n°${nextNumber}`;

  // Base contractuelle : toujours le snapshot figé de la 1ʳᵉ situation si elle existe
  let contractLines: ContractSnapshotLine[] = snapshot;
  if (lastClosed) {
    const first = await prisma.commercialProgressStatement.findFirst({
      where: {
        organizationId: input.orgId,
        quoteId: input.quoteId,
        number: 1,
      },
      include: { lines: { orderBy: { sortOrder: "asc" } } },
    });
    if (first?.lines.length) {
      contractLines = first.lines.map((l, i) => ({
        sourceQuoteLineId: l.sourceQuoteLineId,
        sortOrder: i,
        reference: l.reference,
        designation: l.designation,
        description: l.description,
        unit: l.unit,
        contractQuantity: d(l.contractQuantity),
        unitSellHt: d(l.unitSellHt),
        vatRate: d(l.vatRate),
        contractSellHt: d(l.contractSellHt),
      }));
    }
  }

  const previousBySource = new Map<
    string,
    { percent: number; quantity: number; sellHt: number }
  >();
  if (lastClosed) {
    for (const l of lastClosed.lines) {
      const key = l.sourceQuoteLineId ?? `${l.sortOrder}:${l.designation}`;
      previousBySource.set(key, {
        percent: d(l.cumulativePercent),
        quantity: d(l.cumulativeQuantity),
        sellHt: d(l.cumulativeSellHt),
      });
    }
  }

  const prepared = contractLines.map((c) => {
    const key = c.sourceQuoteLineId ?? `${c.sortOrder}:${c.designation}`;
    const prev = previousBySource.get(key) ?? {
      percent: 0,
      quantity: 0,
      sellHt: 0,
    };
    const computed = computeProgressLine({
      contractQuantity: c.contractQuantity,
      unitSellHt: c.unitSellHt,
      vatRate: c.vatRate,
      contractSellHt: c.contractSellHt,
      previousPercent: prev.percent,
      previousQuantity: prev.quantity,
      previousSellHt: prev.sellHt,
      periodPercent: 0,
      inputMode: "percent",
    });
    return { contract: c, computed };
  });

  const totals = computeProgressTotals(
    prepared.map(({ contract, computed }) => ({
      contractSellHt: contract.contractSellHt,
      vatRate: contract.vatRate,
      previousSellHt: computed.previousSellHt,
      periodSellHt: computed.periodSellHt,
      cumulativeSellHt: computed.cumulativeSellHt,
      remainingSellHt: computed.remainingSellHt,
    })),
  );

  const previousRetentionHt = lastClosed
    ? d(lastClosed.retentionCumulativeHt)
    : 0;
  const rateSnapshot = d(quote.retentionGuaranteePercent);
  const retention = computeRetentionForPeriod({
    periodSellHt: totals.periodSellHt,
    periodVat: totals.periodVat,
    periodTtc: totals.periodTtc,
    ratePercent: rateSnapshot,
    marketSellHt: totals.marketSellHt,
    previousRetentionHt,
  });

  try {
    return await prisma.$transaction(async (tx) => {
      const statement = await tx.commercialProgressStatement.create({
        data: {
          organizationId: input.orgId,
          quoteId: quote.id,
          projectId: quote.projectId,
          clientExternalOrgId: quote.clientExternalOrgId,
          number: nextNumber,
          label,
          status: "DRAFT",
          contractSnapshotJson: contractLines as unknown as Prisma.InputJsonValue,
          marketSellHt: totals.marketSellHt,
          marketVat: totals.marketVat,
          marketTtc: totals.marketTtc,
          previousSellHt: totals.previousSellHt,
          previousVat: totals.previousVat,
          previousTtc: totals.previousTtc,
          periodSellHt: totals.periodSellHt,
          periodVat: totals.periodVat,
          periodTtc: totals.periodTtc,
          cumulativeSellHt: totals.cumulativeSellHt,
          cumulativeVat: totals.cumulativeVat,
          cumulativeTtc: totals.cumulativeTtc,
          remainingSellHt: totals.remainingSellHt,
          remainingVat: totals.remainingVat,
          remainingTtc: totals.remainingTtc,
          retentionRateSnapshot: retention.ratePercent,
          retentionCapHt: retention.retentionCapHt,
          retentionPreviousHt: retention.retentionPreviousHt,
          retentionPeriodHt: retention.retentionPeriodHt,
          retentionCumulativeHt: retention.retentionCumulativeHt,
          netPeriodSellHt: retention.netPeriodSellHt,
          netPeriodVat: retention.netPeriodVat,
          netPeriodTtc: retention.netPeriodTtc,
          createdById: input.userId,
        },
      });

      for (const { contract, computed } of prepared) {
        await tx.commercialProgressStatementLine.create({
          data: {
            organizationId: input.orgId,
            statementId: statement.id,
            sourceQuoteLineId: contract.sourceQuoteLineId,
            sortOrder: contract.sortOrder,
            reference: contract.reference,
            designation: contract.designation,
            description: contract.description,
            unit: contract.unit,
            contractQuantity: contract.contractQuantity,
            unitSellHt: contract.unitSellHt,
            vatRate: contract.vatRate,
            contractSellHt: contract.contractSellHt,
            previousPercent: computed.previousPercent,
            previousQuantity: computed.previousQuantity,
            previousSellHt: computed.previousSellHt,
            periodPercent: computed.periodPercent,
            periodQuantity: computed.periodQuantity,
            periodSellHt: computed.periodSellHt,
            cumulativePercent: computed.cumulativePercent,
            cumulativeQuantity: computed.cumulativeQuantity,
            cumulativeSellHt: computed.cumulativeSellHt,
            remainingSellHt: computed.remainingSellHt,
          },
        });
      }

      await tx.commercialStatusEvent.create({
        data: {
          organizationId: input.orgId,
          entityType: "PROGRESS_STATEMENT",
          entityId: statement.id,
          fromStatus: null,
          toStatus: "DRAFT",
          label: `Création ${label}`,
          actorUserId: input.userId,
        },
      });

      return statement;
    });
  } catch (e) {
    if (
      e &&
      typeof e === "object" &&
      "code" in e &&
      (e as { code: string }).code === "P2002"
    ) {
      throw new Error("Numéro de situation déjà utilisé — réessayez");
    }
    throw e;
  }
}

export async function updateProgressStatementLines(input: {
  orgId: string;
  statementId: string;
  lines: Array<{
    id: string;
    periodPercent?: number;
    periodQuantity?: number;
    inputMode?: "percent" | "quantity";
  }>;
  periodStart?: Date | null;
  periodEnd?: Date | null;
}) {
  const statement = await prisma.commercialProgressStatement.findFirst({
    where: { id: input.statementId, organizationId: input.orgId },
    include: { lines: true },
  });
  if (!statement) throw new Error("Situation introuvable");
  if (statement.status !== "DRAFT") {
    throw new Error("Seule une situation brouillon est modifiable");
  }

  const byId = new Map(statement.lines.map((l) => [l.id, l]));
  const updates: Array<{ id: string; computed: ReturnType<typeof computeProgressLine> }> =
    [];

  for (const patch of input.lines) {
    const line = byId.get(patch.id);
    if (!line) throw new Error("Ligne introuvable dans cette situation");
    const computed = computeProgressLine({
      contractQuantity: d(line.contractQuantity),
      unitSellHt: d(line.unitSellHt),
      vatRate: d(line.vatRate),
      contractSellHt: d(line.contractSellHt),
      previousPercent: d(line.previousPercent),
      previousQuantity: d(line.previousQuantity),
      previousSellHt: d(line.previousSellHt),
      periodPercent: patch.periodPercent,
      periodQuantity: patch.periodQuantity,
      inputMode: patch.inputMode,
    });
    updates.push({ id: line.id, computed });
  }

  // Lignes non patchées : recalcul à 0 période (conserver)
  const patchedIds = new Set(input.lines.map((l) => l.id));
  for (const line of statement.lines) {
    if (patchedIds.has(line.id)) continue;
    const computed = computeProgressLine({
      contractQuantity: d(line.contractQuantity),
      unitSellHt: d(line.unitSellHt),
      vatRate: d(line.vatRate),
      contractSellHt: d(line.contractSellHt),
      previousPercent: d(line.previousPercent),
      previousQuantity: d(line.previousQuantity),
      previousSellHt: d(line.previousSellHt),
      periodPercent: d(line.periodPercent),
      periodQuantity: d(line.periodQuantity),
      inputMode: "percent",
    });
    updates.push({ id: line.id, computed });
  }

  const totals = computeProgressTotals(
    statement.lines.map((line) => {
      const u = updates.find((x) => x.id === line.id)!;
      return {
        contractSellHt: d(line.contractSellHt),
        vatRate: d(line.vatRate),
        previousSellHt: u.computed.previousSellHt,
        periodSellHt: u.computed.periodSellHt,
        cumulativeSellHt: u.computed.cumulativeSellHt,
        remainingSellHt: u.computed.remainingSellHt,
      };
    }),
  );

  const retention = computeRetentionForPeriod({
    periodSellHt: totals.periodSellHt,
    periodVat: totals.periodVat,
    periodTtc: totals.periodTtc,
    ratePercent: d(statement.retentionRateSnapshot),
    marketSellHt: totals.marketSellHt,
    previousRetentionHt: d(statement.retentionPreviousHt),
  });

  await prisma.$transaction(async (tx) => {
    for (const u of updates) {
      await tx.commercialProgressStatementLine.update({
        where: { id: u.id },
        data: {
          periodPercent: u.computed.periodPercent,
          periodQuantity: u.computed.periodQuantity,
          periodSellHt: u.computed.periodSellHt,
          cumulativePercent: u.computed.cumulativePercent,
          cumulativeQuantity: u.computed.cumulativeQuantity,
          cumulativeSellHt: u.computed.cumulativeSellHt,
          remainingSellHt: u.computed.remainingSellHt,
        },
      });
    }
    await tx.commercialProgressStatement.update({
      where: { id: statement.id },
      data: {
        ...(input.periodStart !== undefined
          ? { periodStart: input.periodStart }
          : {}),
        ...(input.periodEnd !== undefined ? { periodEnd: input.periodEnd } : {}),
        periodSellHt: totals.periodSellHt,
        periodVat: totals.periodVat,
        periodTtc: totals.periodTtc,
        cumulativeSellHt: totals.cumulativeSellHt,
        cumulativeVat: totals.cumulativeVat,
        cumulativeTtc: totals.cumulativeTtc,
        remainingSellHt: totals.remainingSellHt,
        remainingVat: totals.remainingVat,
        remainingTtc: totals.remainingTtc,
        previousSellHt: totals.previousSellHt,
        previousVat: totals.previousVat,
        previousTtc: totals.previousTtc,
        marketSellHt: totals.marketSellHt,
        marketVat: totals.marketVat,
        marketTtc: totals.marketTtc,
        retentionCapHt: retention.retentionCapHt,
        retentionPeriodHt: retention.retentionPeriodHt,
        retentionCumulativeHt: retention.retentionCumulativeHt,
        netPeriodSellHt: retention.netPeriodSellHt,
        netPeriodVat: retention.netPeriodVat,
        netPeriodTtc: retention.netPeriodTtc,
      },
    });
  });

  return getProgressStatementDetail(input.orgId, statement.id);
}

export async function validateProgressStatement(input: {
  orgId: string;
  userId: string;
  statementId: string;
}) {
  const statement = await prisma.commercialProgressStatement.findFirst({
    where: { id: input.statementId, organizationId: input.orgId },
    include: { lines: true, quote: { select: { id: true, status: true } } },
  });
  if (!statement) throw new Error("Situation introuvable");
  if (statement.status !== "DRAFT") {
    throw new Error("Situation déjà validée ou facturée");
  }
  if (statement.quote.status !== "ACCEPTED") {
    throw new Error("Le devis source n’est plus accepté");
  }

  const later = await prisma.commercialProgressStatement.findFirst({
    where: {
      organizationId: input.orgId,
      quoteId: statement.quoteId,
      number: { gt: statement.number },
    },
    select: { id: true, number: true },
  });
  if (later) {
    throw new Error(
      `Situation n°${later.number} existe déjà — impossible de valider hors séquence`,
    );
  }

  // Recalcul strict serveur
  let periodTotal = 0;
  for (const line of statement.lines) {
    const computed = computeProgressLine({
      contractQuantity: d(line.contractQuantity),
      unitSellHt: d(line.unitSellHt),
      vatRate: d(line.vatRate),
      contractSellHt: d(line.contractSellHt),
      previousPercent: d(line.previousPercent),
      previousQuantity: d(line.previousQuantity),
      previousSellHt: d(line.previousSellHt),
      periodPercent: d(line.periodPercent),
      periodQuantity: d(line.periodQuantity),
      inputMode: "percent",
    });
    periodTotal += computed.periodSellHt;
  }
  periodTotal = roundMoney(periodTotal, 2);
  if (periodTotal <= 0) {
    throw new Error("Impossible de valider une situation à 0 € HT de période");
  }

  // Réappliquer le recalcul complet via update
  await updateProgressStatementLines({
    orgId: input.orgId,
    statementId: statement.id,
    lines: statement.lines.map((l) => ({
      id: l.id,
      periodPercent: d(l.periodPercent),
      inputMode: "percent" as const,
    })),
  });

  await prisma.$transaction(async (tx) => {
    await tx.commercialProgressStatement.update({
      where: { id: statement.id },
      data: {
        status: "VALIDATED",
        validatedAt: new Date(),
        validatedById: input.userId,
      },
    });
    await tx.commercialStatusEvent.create({
      data: {
        organizationId: input.orgId,
        entityType: "PROGRESS_STATEMENT",
        entityId: statement.id,
        fromStatus: "DRAFT",
        toStatus: "VALIDATED",
        label: `Validation ${statement.label}`,
        actorUserId: input.userId,
      },
    });
  });

  return getProgressStatementDetail(input.orgId, statement.id);
}

/**
 * Génère une facture = montant période uniquement. Idempotent.
 */
export async function generateInvoiceFromProgressStatement(input: {
  orgId: string;
  userId: string;
  statementId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const statement = await tx.commercialProgressStatement.findFirst({
      where: { id: input.statementId, organizationId: input.orgId },
      include: {
        lines: { orderBy: { sortOrder: "asc" } },
        invoice: true,
        quote: {
          select: {
            id: true,
            number: true,
            subject: true,
            projectId: true,
            clientExternalOrgId: true,
            clientSnapshotJson: true,
            issuerSnapshotJson: true,
            retentionReleaseDueDate: true,
            defaultVatRate: true,
          },
        },
      },
    });
    if (!statement) throw new Error("Situation introuvable");

    // Idempotence
    if (statement.invoice) {
      return statement.invoice;
    }
    const existingInv = await tx.commercialInvoice.findFirst({
      where: {
        organizationId: input.orgId,
        progressStatementId: statement.id,
      },
    });
    if (existingInv) {
      if (statement.status !== "INVOICED") {
        await tx.commercialProgressStatement.update({
          where: { id: statement.id },
          data: { status: "INVOICED" },
        });
      }
      return existingInv;
    }

    if (statement.status !== "VALIDATED") {
      throw new Error("Seule une situation validée peut générer une facture");
    }

    const periodLines = statement.lines.filter((l) => d(l.periodSellHt) > 0.004);
    if (periodLines.length === 0) {
      throw new Error("Aucun montant de période à facturer");
    }

    let worksHt = 0;
    let worksVat = 0;
    let worksTtc = 0;
    const prepared = periodLines.map((l, i) => {
      const ht = d(l.periodSellHt);
      const vatRate = d(l.vatRate);
      const calc = calculateLine({
        kind: "WORK",
        quantity: 1,
        unitSellHt: ht,
        vatRate,
      });
      worksHt += calc.lineSellHt;
      worksVat += calc.lineVat;
      worksTtc += calc.lineTtc;
      return {
        designation: `${l.designation} — ${statement.label}`,
        description: [
          l.reference ? `Réf. ${l.reference}` : null,
          `Avancement période ${d(l.periodPercent)} %`,
          `Marché ${statement.quote.number}`,
        ]
          .filter(Boolean)
          .join(" · "),
        quantity: 1,
        unit: "U",
        unitSellHt: ht,
        vatRate,
        lineSellHt: calc.lineSellHt,
        lineVat: calc.lineVat,
        lineTtc: calc.lineTtc,
        sortOrder: i,
      };
    });

    worksHt = roundMoney(worksHt, 2);
    worksVat = roundMoney(worksVat, 2);
    worksTtc = roundMoney(worksTtc, 2);

    const expectedPeriod = d(statement.periodSellHt);
    if (Math.abs(worksHt - expectedPeriod) > 0.05) {
      throw new Error(
        `Incohérence totaux période (lignes ${worksHt} € vs situation ${expectedPeriod} €)`,
      );
    }

    const retentionHt = d(statement.retentionPeriodHt);
    const retentionRate = d(statement.retentionRateSnapshot);
    const netHt = d(statement.netPeriodSellHt);
    const netVat = d(statement.netPeriodVat);
    const netTtc = d(statement.netPeriodTtc);

    // Ligne RG négative pour lisibilité facture (si RG > 0)
    if (retentionHt > 0.004) {
      const avgRate =
        worksHt > 0 ? roundMoney((worksVat / worksHt) * 100, 4) : 20;
      const retVat = roundMoney(worksVat - netVat, 2);
      prepared.push({
        designation: `Retenue de garantie ${retentionRate} %`,
        description: `${statement.label} — créance différée (non exigible immédiatement)`,
        quantity: 1,
        unit: "U",
        unitSellHt: -retentionHt,
        vatRate: avgRate,
        lineSellHt: -retentionHt,
        lineVat: -retVat,
        lineTtc: -roundMoney(retentionHt + retVat, 2),
        sortOrder: prepared.length,
      });
    }

    const number = await nextInvoiceNumber(input.orgId, tx);
    const periodLabel =
      statement.periodStart || statement.periodEnd
        ? [
            statement.periodStart
              ? new Date(statement.periodStart).toLocaleDateString("fr-FR")
              : "…",
            statement.periodEnd
              ? new Date(statement.periodEnd).toLocaleDateString("fr-FR")
              : "…",
          ].join(" → ")
        : null;

    const invoice = await tx.commercialInvoice.create({
      data: {
        organizationId: input.orgId,
        number,
        type: "PROGRESS",
        status: "DRAFT",
        quoteId: statement.quoteId,
        progressStatementId: statement.id,
        projectId: statement.projectId ?? statement.quote.projectId,
        clientExternalOrgId:
          statement.clientExternalOrgId ?? statement.quote.clientExternalOrgId,
        clientSnapshotJson: statement.quote.clientSnapshotJson ?? undefined,
        issuerSnapshotJson: statement.quote.issuerSnapshotJson ?? undefined,
        issueDate: new Date(),
        subject: `${statement.label} — ${statement.quote.number}`,
        clientNotes: [
          statement.label,
          `Référence devis / marché : ${statement.quote.number}`,
          periodLabel ? `Période : ${periodLabel}` : null,
          retentionHt > 0
            ? `Travaux ${worksHt.toFixed(2)} € HT — RG ${retentionRate} % : −${retentionHt.toFixed(2)} € HT — Net exigible ${netHt.toFixed(2)} € HT`
            : null,
        ]
          .filter(Boolean)
          .join("\n"),
        worksSellHt: worksHt,
        worksVat,
        worksTtc,
        retentionAmountHt: retentionHt,
        retentionRate: retentionHt > 0 ? retentionRate : null,
        totalSellHt: netHt,
        totalVat: netVat,
        totalTtc: netTtc,
        amountPaid: 0,
        amountDue: netTtc,
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

    if (retentionHt > 0.004) {
      const retVat = roundMoney(worksVat - netVat, 2);
      await tx.commercialRetentionGuarantee.create({
        data: {
          organizationId: input.orgId,
          quoteId: statement.quoteId,
          progressStatementId: statement.id,
          situationInvoiceId: invoice.id,
          amountHt: retentionHt,
          amountVat: retVat,
          amountTtc: roundMoney(retentionHt + retVat, 2),
          ratePercent: retentionRate,
          status: "HELD",
          plannedReleaseDate: statement.quote.retentionReleaseDueDate ?? null,
        },
      });
    }

    await tx.commercialProgressStatement.update({
      where: { id: statement.id },
      data: { status: "INVOICED" },
    });

    await tx.commercialStatusEvent.create({
      data: {
        organizationId: input.orgId,
        entityType: "PROGRESS_STATEMENT",
        entityId: statement.id,
        fromStatus: "VALIDATED",
        toStatus: "INVOICED",
        label: `Facture ${number} générée`,
        actorUserId: input.userId,
      },
    });

    await tx.commercialStatusEvent.create({
      data: {
        organizationId: input.orgId,
        entityType: "INVOICE",
        entityId: invoice.id,
        fromStatus: null,
        toStatus: "DRAFT",
        label: `Création depuis ${statement.label}`,
        actorUserId: input.userId,
      },
    });

    return invoice;
  });
}

export async function getQuoteProgressSummary(orgId: string, quoteId: string) {
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: quoteId, organizationId: orgId },
    select: { id: true, totalSellHt: true, status: true },
  });
  if (!quote) return null;

  const statements = await listProgressStatements(orgId, quoteId);
  const first = await prisma.commercialProgressStatement.findFirst({
    where: { organizationId: orgId, quoteId, number: 1 },
    select: { marketSellHt: true },
  });
  const marketHt = first ? d(first.marketSellHt) : d(quote.totalSellHt);

  const invoicedFromSituations = statements
    .filter((s) => (s as { status: string }).status === "INVOICED")
    .reduce((acc, s) => acc + d((s as { periodSellHt: unknown }).periodSellHt), 0);

  const lastClosed = [...statements]
    .reverse()
    .find((s) =>
      ["VALIDATED", "INVOICED"].includes((s as { status: string }).status),
    );

  return {
    marketSellHt: marketHt,
    invoicedFromSituationsHt: roundMoney(invoicedFromSituations, 2),
    remainingFromSituationsHt: roundMoney(
      Math.max(
        0,
        marketHt -
          (lastClosed
            ? d((lastClosed as { cumulativeSellHt: unknown }).cumulativeSellHt)
            : 0),
      ),
      2,
    ),
    statements,
  };
}
