import { prisma } from "@/lib/prisma";
import { calculateLine, calculateDocumentTotals } from "@/lib/commercial/money";
import { d } from "@/lib/commercial/decimal";
import { nextAmendmentNumber } from "@/lib/commercial/settings";

export async function listAmendments(orgId: string) {
  const rows = await prisma.commercialAmendment.findMany({
    where: { organizationId: orgId },
    orderBy: { updatedAt: "desc" },
    take: 80,
    include: {
      quote: { select: { id: true, number: true, subject: true } },
    },
  });
  return rows.map((a) => ({
    ...a,
    totalSellHt: d(a.totalSellHt),
    totalVat: d(a.totalVat),
    totalTtc: d(a.totalTtc),
  }));
}

export async function createAmendment(input: {
  orgId: string;
  quoteId: string;
  subject: string;
  userId?: string;
}) {
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: input.quoteId, organizationId: input.orgId },
    select: { id: true, status: true, defaultVatRate: true },
  });
  if (!quote) throw new Error("Devis introuvable");
  if (quote.status !== "ACCEPTED") {
    throw new Error("Avenant possible uniquement sur devis accepté");
  }

  const subject = input.subject.trim();
  if (!subject) throw new Error("Objet avenant requis");

  return prisma.$transaction(async (tx) => {
    const number = await nextAmendmentNumber(input.orgId, tx);
    const amendment = await tx.commercialAmendment.create({
      data: {
        organizationId: input.orgId,
        quoteId: input.quoteId,
        number,
        subject,
        status: "DRAFT",
        issueDate: new Date(),
      },
    });

    await tx.commercialStatusEvent.create({
      data: {
        organizationId: input.orgId,
        entityType: "AMENDMENT",
        entityId: amendment.id,
        fromStatus: null,
        toStatus: "DRAFT",
        label: "Création avenant",
        actorUserId: input.userId ?? null,
      },
    });

    return amendment;
  });
}

export async function addAmendmentLine(
  orgId: string,
  amendmentId: string,
  input: {
    designation: string;
    quantity?: number;
    unit?: string;
    unitSellHt?: number;
    vatRate?: number;
  },
) {
  const amendment = await prisma.commercialAmendment.findFirst({
    where: { id: amendmentId, organizationId: orgId },
    include: { quote: { select: { defaultVatRate: true } } },
  });
  if (!amendment) throw new Error("Avenant introuvable");
  if (amendment.status !== "DRAFT") throw new Error("Avenant non modifiable");

  const designation = input.designation.trim();
  if (!designation) throw new Error("Désignation requise");

  const quantity = input.quantity ?? 1;
  const unitSellHt = input.unitSellHt ?? 0;
  const vatRate = input.vatRate ?? d(amendment.quote.defaultVatRate);
  const calc = calculateLine({
    kind: "WORK",
    quantity,
    unitSellHt,
    vatRate,
  });

  const max = await prisma.commercialAmendmentLine.aggregate({
    where: { amendmentId },
    _max: { sortOrder: true },
  });

  await prisma.commercialAmendmentLine.create({
    data: {
      organizationId: orgId,
      amendmentId,
      designation,
      quantity,
      unit: input.unit ?? "U",
      unitSellHt,
      vatRate,
      lineSellHt: calc.lineSellHt,
      lineVat: calc.lineVat,
      lineTtc: calc.lineTtc,
      sortOrder: (max._max.sortOrder ?? -1) + 1,
    },
  });

  return recomputeAmendmentTotals(orgId, amendmentId);
}

export async function recomputeAmendmentTotals(orgId: string, amendmentId: string) {
  const amendment = await prisma.commercialAmendment.findFirst({
    where: { id: amendmentId, organizationId: orgId },
    include: { lines: true },
  });
  if (!amendment) throw new Error("Avenant introuvable");

  const lineResults = amendment.lines.map((l) =>
    calculateLine({
      kind: "WORK",
      quantity: d(l.quantity),
      unitSellHt: d(l.unitSellHt),
      vatRate: d(l.vatRate),
    }),
  );

  for (let i = 0; i < amendment.lines.length; i++) {
    const calc = lineResults[i];
    await prisma.commercialAmendmentLine.update({
      where: { id: amendment.lines[i].id },
      data: {
        lineSellHt: calc.lineSellHt,
        lineVat: calc.lineVat,
        lineTtc: calc.lineTtc,
      },
    });
  }

  const totals = calculateDocumentTotals(lineResults);
  return prisma.commercialAmendment.update({
    where: { id: amendmentId },
    data: {
      totalSellHt: totals.totalSellHt,
      totalVat: totals.totalVat,
      totalTtc: totals.totalTtc,
    },
  });
}

export async function acceptAmendment(
  orgId: string,
  amendmentId: string,
  actorUserId: string,
) {
  const amendment = await prisma.commercialAmendment.findFirst({
    where: { id: amendmentId, organizationId: orgId },
    select: { id: true, status: true },
  });
  if (!amendment) throw new Error("Avenant introuvable");
  if (amendment.status !== "DRAFT" && amendment.status !== "SENT") {
    throw new Error("Avenant déjà traité");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.commercialAmendment.update({
      where: { id: amendmentId },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    });
    await tx.commercialStatusEvent.create({
      data: {
        organizationId: orgId,
        entityType: "AMENDMENT",
        entityId: amendmentId,
        fromStatus: amendment.status,
        toStatus: "ACCEPTED",
        label: "Avenant accepté",
        actorUserId,
      },
    });
    return updated;
  });
}
