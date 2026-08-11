import type { CommercialLineKind, CommercialQuoteStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateDocumentTotals, calculateLine, roundMoney } from "@/lib/commercial/money";
import { d } from "@/lib/commercial/decimal";
import { ensureCommercialOrgSettings, nextQuoteNumber } from "@/lib/commercial/settings";

const EDITABLE_STATUSES: CommercialQuoteStatus[] = ["DRAFT", "TO_VALIDATE", "VALIDATED"];

const ALLOWED_TRANSITIONS: Record<CommercialQuoteStatus, CommercialQuoteStatus[]> = {
  DRAFT: ["TO_VALIDATE", "VALIDATED", "SENT", "CANCELLED"],
  TO_VALIDATE: ["DRAFT", "VALIDATED", "SENT", "CANCELLED"],
  VALIDATED: ["DRAFT", "SENT", "CANCELLED"],
  SENT: ["VIEWED", "ACCEPTED", "REFUSED", "EXPIRED", "CANCELLED"],
  VIEWED: ["ACCEPTED", "REFUSED", "EXPIRED", "CANCELLED"],
  ACCEPTED: ["CANCELLED"],
  REFUSED: [],
  EXPIRED: [],
  CANCELLED: [],
};

type Snapshot = Prisma.InputJsonValue;

/** Champs contractuels (B) — bloqués si SENT / ACCEPTED / etc. */
export const QUOTE_CONTRACTUAL_META_KEYS = [
  "subject",
  "clientExternalOrgId",
  "siteAddressSnapshot",
  "validityDate",
  "paymentTerms",
  "clientNotes",
  "depositPercent",
  "depositAmountHt",
] as const;

const META_LOCKED_STATUSES: CommercialQuoteStatus[] = [
  "SENT",
  "VIEWED",
  "ACCEPTED",
  "REFUSED",
  "EXPIRED",
  "CANCELLED",
];

export function assertQuoteMetaUpdateAllowed(
  status: CommercialQuoteStatus | string,
  data: Record<string, unknown>,
): { ok: true } | { ok: false; error: string } {
  const locked = META_LOCKED_STATUSES.includes(status as CommercialQuoteStatus);
  if (!locked) return { ok: true };
  const contractualTouched = QUOTE_CONTRACTUAL_META_KEYS.some(
    (k) => data[k] !== undefined,
  );
  if (contractualTouched) {
    return {
      ok: false,
      error:
        "Document verrouillé — créez une nouvelle version pour modifier les données contractuelles",
    };
  }
  return { ok: true };
}

async function buildIssuerSnapshot(orgId: string): Promise<Snapshot> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      name: true,
      siret: true,
      owner: {
        select: {
          company: true,
          name: true,
          phone: true,
          email: true,
          billingAddressLine1: true,
          billingAddressLine2: true,
          billingCity: true,
          billingPostalCode: true,
          billingCountry: true,
          formeJuridique: true,
        },
      },
    },
  });
  const owner = org?.owner;
  return {
    name: org?.name ?? owner?.company ?? "Entreprise",
    siret: org?.siret ?? null,
    formeJuridique: owner?.formeJuridique ?? null,
    email: owner?.email ?? null,
    phone: owner?.phone ?? null,
    addressLine1: owner?.billingAddressLine1 ?? null,
    addressLine2: owner?.billingAddressLine2 ?? null,
    city: owner?.billingCity ?? null,
    postalCode: owner?.billingPostalCode ?? null,
    country: owner?.billingCountry ?? "France",
  } as Prisma.InputJsonValue;
}

async function buildClientSnapshot(clientExternalOrgId: string | null): Promise<Snapshot | null> {
  if (!clientExternalOrgId) return null;
  const client = await prisma.externalOrganization.findUnique({
    where: { id: clientExternalOrgId },
    select: {
      name: true,
      tradeName: true,
      siret: true,
      address: true,
      city: true,
      zipCode: true,
      phone: true,
      email: true,
      type: true,
    },
  });
  if (!client) return null;
  return {
    name: client.name,
    tradeName: client.tradeName,
    siret: client.siret,
    address: client.address,
    city: client.city,
    zipCode: client.zipCode,
    phone: client.phone,
    email: client.email,
    type: client.type,
  } as Prisma.InputJsonValue;
}

export async function createQuote(input: {
  orgId: string;
  userId: string;
  subject: string;
  clientExternalOrgId?: string | null;
  projectId?: string | null;
  responsibleId?: string | null;
  siteAddressSnapshot?: string | null;
  validityDate?: Date | null;
  paymentTerms?: string | null;
  internalNotes?: string | null;
  clientNotes?: string | null;
  depositPercent?: number | null;
}) {
  const settings = await ensureCommercialOrgSettings(input.orgId);
  const subject = input.subject.trim();
  if (!subject) throw new Error("Objet du devis requis");

  if (input.clientExternalOrgId) {
    const client = await prisma.externalOrganization.findFirst({
      where: {
        id: input.clientExternalOrgId,
        hostOrganizationId: input.orgId,
        type: { in: ["CLIENT_EXT", "CLIENT"] },
      },
      select: { id: true },
    });
    if (!client) throw new Error("Client introuvable");
  }

  if (input.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: input.projectId, organizationId: input.orgId },
      select: { id: true },
    });
    if (!project) throw new Error("Chantier introuvable");
  }

  const issuerSnapshotJson = await buildIssuerSnapshot(input.orgId);
  const clientSnapshotJson = await buildClientSnapshot(input.clientExternalOrgId ?? null);

  return prisma.$transaction(async (tx) => {
    const number = await nextQuoteNumber(input.orgId, tx);
    const quote = await tx.commercialQuote.create({
      data: {
        organizationId: input.orgId,
        number,
        subject,
        status: "DRAFT",
        currency: settings.defaultCurrency,
        projectId: input.projectId ?? null,
        clientExternalOrgId: input.clientExternalOrgId ?? null,
        clientSnapshotJson: clientSnapshotJson ?? undefined,
        issuerSnapshotJson,
        siteAddressSnapshot: input.siteAddressSnapshot ?? null,
        issueDate: new Date(),
        validityDate: input.validityDate ?? null,
        responsibleId: input.responsibleId ?? null,
        createdById: input.userId,
        internalNotes: input.internalNotes ?? null,
        clientNotes: input.clientNotes ?? null,
        paymentTerms: input.paymentTerms ?? settings.defaultPaymentTerms,
        depositPercent: input.depositPercent ?? null,
        defaultVatRate: settings.defaultVatRate,
      },
    });

    const version = await tx.commercialQuoteVersion.create({
      data: {
        organizationId: input.orgId,
        quoteId: quote.id,
        versionNumber: 1,
        label: "V1",
        lockState: "DRAFT",
        clientSnapshotJson: clientSnapshotJson ?? undefined,
        issuerSnapshotJson,
        paymentTerms: quote.paymentTerms,
        clientNotes: quote.clientNotes,
      },
    });

    await tx.commercialQuoteSection.create({
      data: {
        organizationId: input.orgId,
        versionId: version.id,
        title: "Ouvrages",
        sortOrder: 0,
      },
    });

    await tx.commercialQuote.update({
      where: { id: quote.id },
      data: { currentVersionId: version.id },
    });

    await tx.commercialStatusEvent.create({
      data: {
        organizationId: input.orgId,
        entityType: "QUOTE",
        entityId: quote.id,
        fromStatus: null,
        toStatus: "DRAFT",
        label: "Création du devis",
        actorUserId: input.userId,
      },
    });

    return tx.commercialQuote.findUniqueOrThrow({ where: { id: quote.id } });
  });
}

export async function listQuotes(orgId: string) {
  const rows = await prisma.commercialQuote.findMany({
    where: { organizationId: orgId },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      number: true,
      subject: true,
      status: true,
      issueDate: true,
      validityDate: true,
      totalSellHt: true,
      totalTtc: true,
      marginPercent: true,
      updatedAt: true,
      clientExternalOrg: { select: { id: true, name: true, tradeName: true } },
      project: { select: { id: true, title: true } },
      responsible: { select: { id: true, name: true } },
    },
  });
  return rows.map((r) => ({
    ...r,
    totalSellHt: d(r.totalSellHt),
    totalTtc: d(r.totalTtc),
    marginPercent: d(r.marginPercent),
  }));
}

export async function getQuoteDetail(orgId: string, id: string) {
  const quote = await prisma.commercialQuote.findFirst({
    where: { id, organizationId: orgId },
    include: {
      clientExternalOrg: {
        select: { id: true, name: true, tradeName: true, email: true, phone: true },
      },
      project: { select: { id: true, title: true } },
      responsible: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      currentVersion: {
        include: {
          sections: { orderBy: { sortOrder: "asc" } },
          lines: { orderBy: { sortOrder: "asc" } },
        },
      },
      versions: {
        orderBy: { versionNumber: "desc" },
        select: {
          id: true,
          versionNumber: true,
          label: true,
          lockState: true,
          issuedAt: true,
          totalSellHt: true,
          totalTtc: true,
        },
      },
    },
  });
  if (!quote) return null;

  const version = quote.currentVersion;
  return {
    ...quote,
    totalCostHt: d(quote.totalCostHt),
    totalSellHt: d(quote.totalSellHt),
    totalVat: d(quote.totalVat),
    totalTtc: d(quote.totalTtc),
    marginAmount: d(quote.marginAmount),
    marginPercent: d(quote.marginPercent),
    depositPercent: quote.depositPercent != null ? d(quote.depositPercent) : null,
    depositAmountHt: quote.depositAmountHt != null ? d(quote.depositAmountHt) : null,
    defaultVatRate: d(quote.defaultVatRate),
    currentVersion: version
      ? {
          ...version,
          totalCostHt: d(version.totalCostHt),
          totalSellHt: d(version.totalSellHt),
          totalVat: d(version.totalVat),
          totalTtc: d(version.totalTtc),
          marginAmount: d(version.marginAmount),
          marginPercent: d(version.marginPercent),
          lines: version.lines.map((l) => ({
            ...l,
            quantity: d(l.quantity),
            unitCostHt: d(l.unitCostHt),
            unitSellHt: d(l.unitSellHt),
            discountPercent: d(l.discountPercent),
            vatRate: d(l.vatRate),
            lineCostHt: d(l.lineCostHt),
            lineSellHt: d(l.lineSellHt),
            lineVat: d(l.lineVat),
            lineTtc: d(l.lineTtc),
            marginAmount: d(l.marginAmount),
          })),
        }
      : null,
    versions: quote.versions.map((v) => ({
      ...v,
      totalSellHt: d(v.totalSellHt),
      totalTtc: d(v.totalTtc),
    })),
  };
}

export async function updateQuoteMeta(
  orgId: string,
  id: string,
  data: {
    subject?: string;
    clientExternalOrgId?: string | null;
    projectId?: string | null;
    responsibleId?: string | null;
    siteAddressSnapshot?: string | null;
    validityDate?: Date | null;
    paymentTerms?: string | null;
    internalNotes?: string | null;
    clientNotes?: string | null;
    depositPercent?: number | null;
    depositAmountHt?: number | null;
  },
) {
  const quote = await prisma.commercialQuote.findFirst({
    where: { id, organizationId: orgId },
    select: { id: true, status: true, currentVersionId: true },
  });
  if (!quote) throw new Error("Devis introuvable");

  const guard = assertQuoteMetaUpdateAllowed(quote.status, data);
  if (!guard.ok) throw new Error(guard.error);

  if (data.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: data.projectId, organizationId: orgId },
      select: { id: true },
    });
    if (!project) throw new Error("Chantier introuvable ou hors organisation");
  }

  let clientSnapshotJson: Snapshot | null | undefined;
  if (data.clientExternalOrgId !== undefined) {
    if (data.clientExternalOrgId) {
      const client = await prisma.externalOrganization.findFirst({
        where: {
          id: data.clientExternalOrgId,
          hostOrganizationId: orgId,
          type: { in: ["CLIENT_EXT", "CLIENT"] },
        },
        select: { id: true },
      });
      if (!client) throw new Error("Client introuvable");
    }
    clientSnapshotJson = await buildClientSnapshot(data.clientExternalOrgId);
  }

  const updated = await prisma.commercialQuote.update({
    where: { id },
    data: {
      ...(data.subject !== undefined ? { subject: data.subject.trim() } : {}),
      ...(data.clientExternalOrgId !== undefined
        ? {
            clientExternalOrgId: data.clientExternalOrgId,
            clientSnapshotJson: clientSnapshotJson ?? undefined,
          }
        : {}),
      ...(data.projectId !== undefined ? { projectId: data.projectId } : {}),
      ...(data.responsibleId !== undefined ? { responsibleId: data.responsibleId } : {}),
      ...(data.siteAddressSnapshot !== undefined
        ? { siteAddressSnapshot: data.siteAddressSnapshot }
        : {}),
      ...(data.validityDate !== undefined ? { validityDate: data.validityDate } : {}),
      ...(data.paymentTerms !== undefined ? { paymentTerms: data.paymentTerms } : {}),
      ...(data.internalNotes !== undefined ? { internalNotes: data.internalNotes } : {}),
      ...(data.clientNotes !== undefined ? { clientNotes: data.clientNotes } : {}),
      ...(data.depositPercent !== undefined ? { depositPercent: data.depositPercent } : {}),
      ...(data.depositAmountHt !== undefined ? { depositAmountHt: data.depositAmountHt } : {}),
    } as Prisma.CommercialQuoteUncheckedUpdateInput,
  });

  if (quote.currentVersionId && data.clientNotes !== undefined) {
    await prisma.commercialQuoteVersion.update({
      where: { id: quote.currentVersionId },
      data: { clientNotes: data.clientNotes },
    });
  }
  if (quote.currentVersionId && data.paymentTerms !== undefined) {
    await prisma.commercialQuoteVersion.update({
      where: { id: quote.currentVersionId },
      data: { paymentTerms: data.paymentTerms },
    });
  }
  if (quote.currentVersionId && clientSnapshotJson !== undefined) {
    await prisma.commercialQuoteVersion.update({
      where: { id: quote.currentVersionId },
      data: { clientSnapshotJson: clientSnapshotJson ?? undefined },
    });
  }

  return updated;
}

async function assertEditableVersion(orgId: string, quoteId: string) {
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: quoteId, organizationId: orgId },
    include: { currentVersion: true },
  });
  if (!quote) throw new Error("Devis introuvable");
  if (!EDITABLE_STATUSES.includes(quote.status)) {
    throw new Error(
      "Devis non modifiable dans cet état — créer une nouvelle version après envoi",
    );
  }
  if (!quote.currentVersion) throw new Error("Version courante manquante");
  if (quote.currentVersion.lockState !== "DRAFT") {
    throw new Error("Version verrouillée — créer une nouvelle version");
  }
  return quote;
}

export async function recomputeAndSaveVersionTotals(orgId: string, versionId: string) {
  const version = await prisma.commercialQuoteVersion.findFirst({
    where: { id: versionId, organizationId: orgId },
    include: { lines: true, quote: { select: { id: true, currentVersionId: true } } },
  });
  if (!version) throw new Error("Version introuvable");

  const lineResults = version.lines.map((l) =>
    calculateLine({
      kind: l.kind,
      quantity: d(l.quantity),
      unitCostHt: d(l.unitCostHt),
      unitSellHt: d(l.unitSellHt),
      discountPercent: d(l.discountPercent),
      vatRate: d(l.vatRate),
      isOptional: l.isOptional || l.kind === "OPTION",
    }),
  );

  for (let i = 0; i < version.lines.length; i++) {
    const line = version.lines[i];
    const calc = lineResults[i];
    await prisma.commercialQuoteLine.update({
      where: { id: line.id },
      data: {
        lineCostHt: calc.lineCostHt,
        lineSellHt: calc.lineSellHt,
        lineVat: calc.lineVat,
        lineTtc: calc.lineTtc,
        marginAmount: calc.marginAmount,
      },
    });
  }

  const totals = calculateDocumentTotals(lineResults);
  await prisma.commercialQuoteVersion.update({
    where: { id: versionId },
    data: {
      totalCostHt: totals.totalCostHt,
      totalSellHt: totals.totalSellHt,
      totalVat: totals.totalVat,
      totalTtc: totals.totalTtc,
      marginAmount: totals.marginAmount,
      marginPercent: totals.marginPercent,
    },
  });

  if (version.quote.currentVersionId === versionId) {
    await prisma.commercialQuote.update({
      where: { id: version.quote.id },
      data: {
        totalCostHt: totals.totalCostHt,
        totalSellHt: totals.totalSellHt,
        totalVat: totals.totalVat,
        totalTtc: totals.totalTtc,
        marginAmount: totals.marginAmount,
        marginPercent: totals.marginPercent,
      },
    });
  }

  return totals;
}

export async function upsertLine(
  orgId: string,
  quoteId: string,
  input: {
    lineId?: string;
    sectionId?: string | null;
    kind?: CommercialLineKind;
    reference?: string | null;
    designation: string;
    description?: string | null;
    quantity?: number;
    unit?: string;
    unitCostHt?: number;
    unitSellHt?: number;
    discountPercent?: number;
    vatRate?: number;
    commercialWorkItemId?: string | null;
    compositionSnapshotJson?: Prisma.InputJsonValue | null;
    sortOrder?: number;
    isOptional?: boolean;
  },
) {
  const quote = await assertEditableVersion(orgId, quoteId);
  const versionId = quote.currentVersion!.id;
  const designation = input.designation.trim();
  if (!designation) throw new Error("Désignation requise");

  const kind = input.kind ?? "WORK";
  const quantity = input.quantity ?? 1;
  const unitCostHt = input.unitCostHt ?? 0;
  const unitSellHt = input.unitSellHt ?? 0;
  const discountPercent = input.discountPercent ?? 0;
  const vatRate = input.vatRate ?? d(quote.defaultVatRate);
  const isOptional = input.isOptional ?? kind === "OPTION";
  const calc = calculateLine({
    kind,
    quantity,
    unitCostHt,
    unitSellHt,
    discountPercent,
    vatRate,
    isOptional,
  });

  const baseFields = {
    kind,
    reference: input.reference ?? null,
    designation,
    description: input.description ?? null,
    quantity,
    unit: input.unit ?? "U",
    unitCostHt,
    unitSellHt,
    discountPercent,
    vatRate,
    lineCostHt: calc.lineCostHt,
    lineSellHt: calc.lineSellHt,
    lineVat: calc.lineVat,
    lineTtc: calc.lineTtc,
    marginAmount: calc.marginAmount,
    isOptional,
  };

  let lineId = input.lineId;
  if (lineId) {
    const existing = await prisma.commercialQuoteLine.findFirst({
      where: { id: lineId, organizationId: orgId, versionId },
      select: { id: true },
    });
    if (!existing) throw new Error("Ligne introuvable");
    await prisma.commercialQuoteLine.update({
      where: { id: lineId },
      data: {
        ...baseFields,
        ...(input.sectionId !== undefined ? { sectionId: input.sectionId } : {}),
        ...(input.commercialWorkItemId !== undefined
          ? { commercialWorkItemId: input.commercialWorkItemId }
          : {}),
        ...(input.compositionSnapshotJson !== undefined
          ? {
              compositionSnapshotJson:
                input.compositionSnapshotJson === null
                  ? Prisma.JsonNull
                  : input.compositionSnapshotJson,
            }
          : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      },
    });
  } else {
    const max = await prisma.commercialQuoteLine.aggregate({
      where: { versionId },
      _max: { sortOrder: true },
    });
    const created = await prisma.commercialQuoteLine.create({
      data: {
        organizationId: orgId,
        versionId,
        sectionId: input.sectionId ?? null,
        commercialWorkItemId: input.commercialWorkItemId ?? null,
        sortOrder: input.sortOrder ?? (max._max.sortOrder ?? -1) + 1,
        ...baseFields,
        ...(input.compositionSnapshotJson != null
          ? { compositionSnapshotJson: input.compositionSnapshotJson }
          : {}),
      },
    });
    lineId = created.id;
  }

  await recomputeAndSaveVersionTotals(orgId, versionId);
  return prisma.commercialQuoteLine.findUniqueOrThrow({ where: { id: lineId } });
}

/** Ajoute une ligne depuis la bibliothèque avec snapshot figé. */
export async function addLineFromWorkItem(
  orgId: string,
  quoteId: string,
  input: {
    workItemId: string;
    quantity: number;
    sectionId?: string | null;
  },
) {
  const { buildCompositionSnapshot, getWorkItem } = await import(
    "@/lib/commercial/library"
  );
  const wi = await getWorkItem(orgId, input.workItemId);
  if (!wi) throw new Error("Ouvrage introuvable dans cette organisation");
  const snapshot = buildCompositionSnapshot({
    id: wi.id,
    name: wi.name,
    reference: wi.reference,
    saleUnit: wi.saleUnit,
    kind: wi.kind,
    feesPercent: wi.feesPercent,
    feesAmountHt: wi.feesAmountHt,
    sellMode: wi.sellMode,
    marginPercent: wi.marginPercent,
    unitCostHt: wi.unitCostHt,
    unitSellHt: wi.unitSellHt,
    components: wi.components.map((c) => ({
      name: c.name,
      type: c.type,
      quantityPerUnit: c.quantityPerUnit,
      unit: c.unit,
      unitCostHt: c.unitCostHt,
      lineCostHt: c.lineCostHt,
      lossPercent: c.lossPercent,
      comment: c.comment,
      materialId: c.materialId,
      laborId: c.laborId,
      equipmentId: c.equipmentId,
    })),
  });
  return upsertLine(orgId, quoteId, {
    designation: wi.name,
    description: wi.description,
    reference: wi.reference,
    quantity: input.quantity > 0 ? input.quantity : 1,
    unit: wi.saleUnit,
    unitCostHt: snapshot.unitCostHt,
    unitSellHt: snapshot.unitSellHt,
    commercialWorkItemId: wi.id,
    sectionId: input.sectionId,
    compositionSnapshotJson: snapshot as unknown as Prisma.InputJsonValue,
  });
}

/**
 * Met à jour le sous-détail d’UNE ligne de devis (snapshot local).
 * N’altère pas l’ouvrage bibliothèque sauf si pushToLibrary=true.
 */
export async function updateLineCompositionSnapshot(
  orgId: string,
  quoteId: string,
  lineId: string,
  snapshot: {
    components: Array<{
      name: string;
      type: string;
      quantityPerUnit: number;
      unit: string;
      unitCostHt: number;
      lossPercent?: number;
      comment?: string | null;
    }>;
    feesPercent?: number;
    feesAmountHt?: number;
    sellMode?: "MARGIN" | "FIXED_SELL";
    marginPercent?: number;
    unitSellHt?: number;
  },
  opts?: { pushToLibrary?: boolean },
) {
  const { calculateWorkItemCosting } = await import("@/lib/commercial/money");
  const quote = await assertEditableVersion(orgId, quoteId);
  const versionId = quote.currentVersion!.id;
  const line = await prisma.commercialQuoteLine.findFirst({
    where: { id: lineId, organizationId: orgId, versionId },
  });
  if (!line) throw new Error("Ligne introuvable");

  const costing = calculateWorkItemCosting({
    components: snapshot.components.map((c) => ({
      type: c.type,
      quantityPerUnit: c.quantityPerUnit,
      unitCostHt: c.unitCostHt,
      lossPercent: c.lossPercent ?? 0,
    })),
    feesPercent: snapshot.feesPercent ?? 0,
    feesAmountHt: snapshot.feesAmountHt ?? 0,
    sellMode: snapshot.sellMode ?? "MARGIN",
    marginPercent: snapshot.marginPercent,
    unitSellHt: snapshot.unitSellHt,
  });

  const compositionSnapshotJson = {
    ...(typeof line.compositionSnapshotJson === "object" &&
    line.compositionSnapshotJson !== null
      ? (line.compositionSnapshotJson as Record<string, unknown>)
      : {}),
    feesPercent: snapshot.feesPercent ?? 0,
    feesAmountHt: snapshot.feesAmountHt ?? 0,
    sellMode: snapshot.sellMode ?? "MARGIN",
    marginPercent: costing.marquePercent,
    unitCostHt: costing.costPriceHt,
    unitSellHt: costing.unitSellHt,
    snappedAt: new Date().toISOString(),
    components: snapshot.components.map((c) => ({
      ...c,
      lossPercent: c.lossPercent ?? 0,
      lineCostHt: roundMoney(
        (c.quantityPerUnit || 0) *
          (1 + (c.lossPercent ?? 0) / 100) *
          (c.unitCostHt || 0),
        4,
      ),
    })),
    breakdown: {
      materialsHt: costing.materialsHt,
      laborHt: costing.laborHt,
      equipmentHt: costing.equipmentHt,
      subcontractHt: costing.subcontractHt,
      otherHt: costing.otherHt,
      dryCostHt: costing.dryCostHt,
      feesHt: costing.feesHt,
      costPriceHt: costing.costPriceHt,
      marquePercent: costing.marquePercent,
      markupPercent: costing.markupPercent,
      sellCoefficient: costing.sellCoefficient,
    },
  };

  await upsertLine(orgId, quoteId, {
    lineId,
    designation: line.designation,
    description: line.description,
    reference: line.reference,
    quantity: d(line.quantity),
    unit: line.unit,
    unitCostHt: costing.costPriceHt,
    unitSellHt: costing.unitSellHt,
    discountPercent: d(line.discountPercent),
    vatRate: d(line.vatRate),
    commercialWorkItemId: line.commercialWorkItemId,
    compositionSnapshotJson: compositionSnapshotJson as Prisma.InputJsonValue,
    sectionId: line.sectionId,
    kind: line.kind,
    isOptional: line.isOptional,
  });

  if (opts?.pushToLibrary && line.commercialWorkItemId) {
    const { upsertWorkItemComponent, deleteWorkItemComponent, updateWorkItem, getWorkItem } =
      await import("@/lib/commercial/library");
    const wi = await getWorkItem(orgId, line.commercialWorkItemId);
    if (wi) {
      for (const c of wi.components) {
        const componentId = (c as { id: string }).id;
        await deleteWorkItemComponent(orgId, wi.id, componentId);
      }
      for (const [i, c] of snapshot.components.entries()) {
        await upsertWorkItemComponent(orgId, wi.id, {
          name: c.name,
          type: c.type as "MATERIAL" | "LABOR" | "EQUIPMENT" | "SUBCONTRACT" | "OTHER",
          quantityPerUnit: c.quantityPerUnit,
          unit: c.unit,
          unitCostHt: c.unitCostHt,
          lossPercent: c.lossPercent ?? 0,
          comment: c.comment ?? null,
          sortOrder: i,
        });
      }
      await updateWorkItem(orgId, wi.id, {
        feesPercent: snapshot.feesPercent ?? 0,
        feesAmountHt: snapshot.feesAmountHt ?? 0,
        sellMode: snapshot.sellMode ?? "MARGIN",
        marginPercent: costing.marquePercent,
        unitSellHt: costing.unitSellHt,
        kind: "COMPOSITE",
      });
    }
  }

  return prisma.commercialQuoteLine.findUniqueOrThrow({ where: { id: lineId } });
}

export async function addSection(orgId: string, quoteId: string, title: string) {
  const quote = await assertEditableVersion(orgId, quoteId);
  const versionId = quote.currentVersion!.id;
  const max = await prisma.commercialQuoteSection.aggregate({
    where: { versionId },
    _max: { sortOrder: true },
  });
  return prisma.commercialQuoteSection.create({
    data: {
      organizationId: orgId,
      versionId,
      title: title.trim() || "Section",
      sortOrder: (max._max.sortOrder ?? -1) + 1,
    },
  });
}

export async function deleteLine(orgId: string, quoteId: string, lineId: string) {
  const quote = await assertEditableVersion(orgId, quoteId);
  const versionId = quote.currentVersion!.id;
  const line = await prisma.commercialQuoteLine.findFirst({
    where: { id: lineId, organizationId: orgId, versionId },
    select: { id: true },
  });
  if (!line) throw new Error("Ligne introuvable");
  await prisma.commercialQuoteLine.delete({ where: { id: lineId } });
  await recomputeAndSaveVersionTotals(orgId, versionId);
}

export async function reorderLines(
  orgId: string,
  quoteId: string,
  orderedLineIds: string[],
) {
  const quote = await assertEditableVersion(orgId, quoteId);
  const versionId = quote.currentVersion!.id;
  await prisma.$transaction(
    orderedLineIds.map((id, index) =>
      prisma.commercialQuoteLine.updateMany({
        where: { id, organizationId: orgId, versionId },
        data: { sortOrder: index },
      }),
    ),
  );
}

/** Crée une nouvelle version brouillon en copiant sections + lignes. */
export async function newVersion(orgId: string, quoteId: string, userId?: string) {
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: quoteId, organizationId: orgId },
    include: {
      currentVersion: {
        include: {
          sections: { orderBy: { sortOrder: "asc" } },
          lines: { orderBy: { sortOrder: "asc" } },
        },
      },
      versions: { orderBy: { versionNumber: "desc" }, take: 1 },
    },
  });
  if (!quote?.currentVersion) throw new Error("Devis introuvable");

  const nextNum = (quote.versions[0]?.versionNumber ?? 0) + 1;

  return prisma.$transaction(async (tx) => {
    const version = await tx.commercialQuoteVersion.create({
      data: {
        organizationId: orgId,
        quoteId,
        versionNumber: nextNum,
        label: `V${nextNum}`,
        lockState: "DRAFT",
        clientSnapshotJson: quote.currentVersion!.clientSnapshotJson ?? undefined,
        issuerSnapshotJson: quote.currentVersion!.issuerSnapshotJson ?? undefined,
        paymentTerms: quote.paymentTerms,
        clientNotes: quote.clientNotes,
      },
    });

    const sectionMap = new Map<string, string>();
    for (const s of quote.currentVersion!.sections) {
      const created = await tx.commercialQuoteSection.create({
        data: {
          organizationId: orgId,
          versionId: version.id,
          title: s.title,
          sortOrder: s.sortOrder,
        },
      });
      sectionMap.set(s.id, created.id);
    }

    for (const l of quote.currentVersion!.lines) {
      await tx.commercialQuoteLine.create({
        data: {
          organizationId: orgId,
          versionId: version.id,
          sectionId: l.sectionId ? sectionMap.get(l.sectionId) ?? null : null,
          kind: l.kind,
          reference: l.reference,
          designation: l.designation,
          description: l.description,
          quantity: l.quantity,
          unit: l.unit,
          unitCostHt: l.unitCostHt,
          unitSellHt: l.unitSellHt,
          discountPercent: l.discountPercent,
          vatRate: l.vatRate,
          lineCostHt: l.lineCostHt,
          lineSellHt: l.lineSellHt,
          lineVat: l.lineVat,
          lineTtc: l.lineTtc,
          marginAmount: l.marginAmount,
          commercialWorkItemId: l.commercialWorkItemId,
          sortOrder: l.sortOrder,
          isOptional: l.isOptional,
        },
      });
    }

    await tx.commercialQuote.update({
      where: { id: quoteId },
      data: {
        currentVersionId: version.id,
        status: "DRAFT",
        totalCostHt: quote.currentVersion!.totalCostHt,
        totalSellHt: quote.currentVersion!.totalSellHt,
        totalVat: quote.currentVersion!.totalVat,
        totalTtc: quote.currentVersion!.totalTtc,
        marginAmount: quote.currentVersion!.marginAmount,
        marginPercent: quote.currentVersion!.marginPercent,
      },
    });

    await tx.commercialStatusEvent.create({
      data: {
        organizationId: orgId,
        entityType: "QUOTE",
        entityId: quoteId,
        fromStatus: quote.status,
        toStatus: "DRAFT",
        label: `Nouvelle version V${nextNum}`,
        actorUserId: userId ?? null,
      },
    });

    return version;
  });
}

export async function transitionQuoteStatus(
  orgId: string,
  quoteId: string,
  toStatus: CommercialQuoteStatus,
  actorUserId: string,
) {
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: quoteId, organizationId: orgId },
    include: { currentVersion: true },
  });
  if (!quote) throw new Error("Devis introuvable");

  /** Double clic ACCEPTED : idempotent, pas de second acceptedAt. */
  if (toStatus === "ACCEPTED" && quote.status === "ACCEPTED") {
    return quote;
  }

  const allowed = ALLOWED_TRANSITIONS[quote.status] ?? [];
  if (!allowed.includes(toStatus)) {
    throw new Error(`Transition ${quote.status} → ${toStatus} non autorisée`);
  }

  const issuerSnapshotJson =
    (quote.issuerSnapshotJson as Snapshot | null) ?? (await buildIssuerSnapshot(orgId));
  const clientSnapshotJson =
    (quote.clientSnapshotJson as Snapshot | null) ??
    (await buildClientSnapshot(quote.clientExternalOrgId));

  return prisma.$transaction(async (tx) => {
    const data: Prisma.CommercialQuoteUpdateInput = { status: toStatus };

    if (toStatus === "SENT") {
      data.sentAt = new Date();
      data.issuerSnapshotJson = issuerSnapshotJson;
      data.clientSnapshotJson = clientSnapshotJson ?? undefined;
      if (quote.currentVersionId) {
        await tx.commercialQuoteVersion.update({
          where: { id: quote.currentVersionId },
          data: {
            lockState: "ISSUED",
            issuedAt: new Date(),
            issuerSnapshotJson,
            clientSnapshotJson: clientSnapshotJson ?? undefined,
            paymentTerms: quote.paymentTerms,
            clientNotes: quote.clientNotes,
          },
        });
      }
    }

    if (toStatus === "ACCEPTED") {
      data.acceptedAt = new Date();
      data.acceptedVersionId = quote.currentVersionId;
      if (quote.currentVersionId) {
        await tx.commercialQuoteVersion.update({
          where: { id: quote.currentVersionId },
          data: { lockState: "ACCEPTED_SNAPSHOT" },
        });
      }
    }

    const updated = await tx.commercialQuote.update({
      where: { id: quoteId },
      data,
    });

    await tx.commercialStatusEvent.create({
      data: {
        organizationId: orgId,
        entityType: "QUOTE",
        entityId: quoteId,
        fromStatus: quote.status,
        toStatus,
        label: `Statut → ${toStatus}`,
        actorUserId,
      },
    });

    return updated;
  });
}

export function isQuoteEditable(status: CommercialQuoteStatus, lockState?: string | null) {
  return EDITABLE_STATUSES.includes(status) && (lockState ?? "DRAFT") === "DRAFT";
}
