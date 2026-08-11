import { prisma } from "@/lib/prisma";
import { calculateLine, calculateDocumentTotals } from "@/lib/commercial/money";
import { d } from "@/lib/commercial/decimal";
import { nextAmendmentNumber } from "@/lib/commercial/settings";
import type { CommercialAmendmentStatus } from "@prisma/client";

const ALLOWED_TRANSITIONS: Record<
  CommercialAmendmentStatus,
  CommercialAmendmentStatus[]
> = {
  DRAFT: ["TO_VALIDATE", "SENT", "ACCEPTED", "CANCELLED"],
  TO_VALIDATE: ["DRAFT", "SENT", "ACCEPTED", "REFUSED", "CANCELLED"],
  SENT: ["ACCEPTED", "REFUSED", "CANCELLED"],
  ACCEPTED: ["CANCELLED"],
  REFUSED: [],
  CANCELLED: [],
};

export async function listAmendments(orgId: string) {
  const rows = await prisma.commercialAmendment.findMany({
    where: { organizationId: orgId },
    orderBy: { updatedAt: "desc" },
    take: 80,
    include: {
      quote: {
        select: {
          id: true,
          number: true,
          subject: true,
          project: { select: { id: true, title: true } },
        },
      },
    },
  });
  return rows.map((a) => ({
    ...a,
    totalSellHt: d(a.totalSellHt),
    totalVat: d(a.totalVat),
    totalTtc: d(a.totalTtc),
  }));
}

export async function listAmendmentsForQuote(orgId: string, quoteId: string) {
  const rows = await prisma.commercialAmendment.findMany({
    where: { organizationId: orgId, quoteId },
    orderBy: { number: "asc" },
    include: { lines: { orderBy: { sortOrder: "asc" } } },
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

export async function updateAmendmentMeta(
  orgId: string,
  amendmentId: string,
  data: {
    subject?: string;
    clientNotes?: string | null;
    internalNotes?: string | null;
  },
) {
  const amendment = await prisma.commercialAmendment.findFirst({
    where: { id: amendmentId, organizationId: orgId },
    select: { id: true, status: true },
  });
  if (!amendment) throw new Error("Avenant introuvable");

  const lockedContractual = ["ACCEPTED", "REFUSED", "CANCELLED", "SENT"].includes(
    amendment.status,
  );
  const contractualTouched =
    data.subject !== undefined || data.clientNotes !== undefined;

  if (lockedContractual && contractualTouched) {
    throw new Error(
      "Avenant verrouillé — les données contractuelles ne sont plus modifiables",
    );
  }

  return prisma.commercialAmendment.update({
    where: { id: amendmentId },
    data: {
      ...(data.subject !== undefined && amendment.status === "DRAFT"
        ? { subject: data.subject.trim() }
        : {}),
      ...(data.clientNotes !== undefined && amendment.status === "DRAFT"
        ? { clientNotes: data.clientNotes }
        : {}),
      ...(data.internalNotes !== undefined ? { internalNotes: data.internalNotes } : {}),
    },
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
  if (amendment.status !== "DRAFT") {
    throw new Error("Avenant non modifiable — seules les lignes brouillon sont éditables");
  }

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
  if (amendment.status !== "DRAFT") {
    throw new Error("Totaux figés — avenant non brouillon");
  }

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

async function transitionAmendment(
  orgId: string,
  amendmentId: string,
  toStatus: CommercialAmendmentStatus,
  actorUserId: string,
  label: string,
) {
  const amendment = await prisma.commercialAmendment.findFirst({
    where: { id: amendmentId, organizationId: orgId },
    select: { id: true, status: true, totalSellHt: true },
  });
  if (!amendment) throw new Error("Avenant introuvable");

  if (amendment.status === toStatus) return amendment;

  const allowed = ALLOWED_TRANSITIONS[amendment.status] ?? [];
  if (!allowed.includes(toStatus)) {
    throw new Error(`Transition ${amendment.status} → ${toStatus} non autorisée`);
  }

  if (toStatus === "ACCEPTED" || toStatus === "SENT") {
    if (d(amendment.totalSellHt) === 0) {
      throw new Error("Ajoutez au moins une ligne avant d’envoyer ou d’accepter");
    }
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.commercialAmendment.update({
      where: { id: amendmentId },
      data: {
        status: toStatus,
        ...(toStatus === "ACCEPTED" ? { acceptedAt: new Date() } : {}),
      },
    });
    await tx.commercialStatusEvent.create({
      data: {
        organizationId: orgId,
        entityType: "AMENDMENT",
        entityId: amendmentId,
        fromStatus: amendment.status,
        toStatus,
        label,
        actorUserId,
      },
    });
    return updated;
  });
}

export async function sendAmendment(
  orgId: string,
  amendmentId: string,
  actorUserId: string,
) {
  return transitionAmendment(orgId, amendmentId, "SENT", actorUserId, "Avenant envoyé");
}

export async function submitAmendmentForValidation(
  orgId: string,
  amendmentId: string,
  actorUserId: string,
) {
  return transitionAmendment(
    orgId,
    amendmentId,
    "TO_VALIDATE",
    actorUserId,
    "Avenant soumis à validation",
  );
}

export async function reopenAmendmentDraft(
  orgId: string,
  amendmentId: string,
  actorUserId: string,
) {
  return transitionAmendment(
    orgId,
    amendmentId,
    "DRAFT",
    actorUserId,
    "Retour brouillon",
  );
}

export async function acceptAmendment(
  orgId: string,
  amendmentId: string,
  actorUserId: string,
) {
  return transitionAmendment(
    orgId,
    amendmentId,
    "ACCEPTED",
    actorUserId,
    "Avenant accepté",
  );
}

export async function refuseAmendment(
  orgId: string,
  amendmentId: string,
  actorUserId: string,
) {
  return transitionAmendment(
    orgId,
    amendmentId,
    "REFUSED",
    actorUserId,
    "Avenant refusé",
  );
}

export async function cancelAmendment(
  orgId: string,
  amendmentId: string,
  actorUserId: string,
) {
  return transitionAmendment(
    orgId,
    amendmentId,
    "CANCELLED",
    actorUserId,
    "Avenant annulé",
  );
}
