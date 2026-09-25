/**
 * Passerelle Métré → Devis : prévisualisation, création brouillon, détection d'écarts.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createQuote, addSection, upsertLine } from "@/lib/commercial/quotes";
import { d } from "@/lib/commercial/decimal";
import { computeStudy } from "@/lib/preparation/engine/compute";
import { getPrepStudyView, PrepError } from "@/lib/preparation/service";
import {
  buildQuoteDescriptionFromPrepLine,
  isPrepLineTransferable,
} from "@/lib/preparation/quote-bridge/description";
import {
  DEMO_QUOTE_PREFIX,
  ensureDemoWatermark,
} from "@/lib/preparation/quote-bridge/demo-guards";
import { DEMO_WATERMARK, ROLE_LABELS, type LineRole, type PrepLineDTO } from "@/lib/preparation/types";
import { displayUnit, formatQty } from "@/lib/preparation/units";
import { formatQuoteNumber } from "@/lib/commercial/quote-number";
import { inputParamsOf } from "@/lib/preparation/engine/compute";

export type PrepQuotePreviewLine = {
  code: string;
  lot: string;
  lotLabel: string;
  designation: string;
  descriptionPreview: string;
  quantity: number;
  unit: string;
  role: LineRole;
  roleLabel: string;
  transferable: boolean;
  selectedByDefault: boolean;
  statusLabel: string;
  blockedReason: string | null;
};

export type PrepQuotePreview = {
  studyId: string;
  studyTitle: string;
  studyVersion: number;
  projectId: string;
  projectTitle: string;
  isDemonstration: boolean;
  watermark: string | null;
  transferable: PrepQuotePreviewLine[];
  excluded: PrepQuotePreviewLine[];
  existingQuotes: Array<{
    id: string;
    number: string;
    subject: string;
    status: string;
    isDemonstration: boolean;
    href: string;
    createdAt: string;
  }>;
};

export type PrepQuoteCommitResult = {
  action: "created" | "idempotent";
  quoteId: string;
  quoteNumber: string;
  href: string;
  transferId: string;
  lineCount: number;
  isDemonstration: boolean;
};

export type PrepQuoteDiff = {
  linkId: string;
  studyLineCode: string;
  quoteLineId: string;
  quoteId: string;
  quoteNumber: string;
  fields: Array<{
    field: "quantity" | "designation" | "description" | "unit";
    label: string;
    before: string | number | null;
    after: string | number | null;
    financialImpactHt: number | null;
  }>;
};

async function nextDemoQuoteNumber(orgId: string, tx: Prisma.TransactionClient): Promise<string> {
  const settings = await tx.commercialOrgSettings.upsert({
    where: { organizationId: orgId },
    create: { organizationId: orgId },
    update: {},
  });
  const year = new Date().getFullYear();
  let seq = settings.nextDemoQuoteSeq;
  for (let attempt = 0; attempt < 1000; attempt++) {
    const candidate = formatQuoteNumber(DEMO_QUOTE_PREFIX, seq, year);
    const existing = await tx.commercialQuote.findFirst({
      where: { organizationId: orgId, number: candidate },
      select: { id: true },
    });
    if (!existing) {
      await tx.commercialOrgSettings.update({
        where: { organizationId: orgId },
        data: { nextDemoQuoteSeq: seq + 1 },
      });
      return candidate;
    }
    seq += 1;
  }
  throw new PrepError("Impossible d'allouer un numéro de devis de démonstration unique");
}

function lineStatusLabel(line: PrepLineDTO, qty: number | null, error: string | null): string {
  if (error) return "Erreur de calcul";
  if (qty === null || qty === undefined) return "Quantité absente";
  if (line.validatedQuantity !== null) return "Quantité validée";
  if (line.role === "indicator") return "Indicateur technique";
  if (line.role === "logistics") return "Logistique chiffrable";
  return "Quantité théorique";
}

function resolveTransferQty(line: PrepLineDTO, computed: number | null, error: string | null): {
  qty: number | null;
  blocked: string | null;
} {
  if (!isPrepLineTransferable(line.role)) {
    return { qty: null, blocked: "Indicateur technique — non transférable au devis" };
  }
  if (error) return { qty: null, blocked: `Calcul en erreur : ${error}` };
  if (line.validatedQuantity !== null) return { qty: line.validatedQuantity, blocked: null };
  if (computed === null || computed === undefined) {
    return { qty: null, blocked: "Quantité absente" };
  }
  return { qty: computed, blocked: null };
}

export async function previewPrepToQuote(input: {
  orgId: string;
  studyId: string;
}): Promise<PrepQuotePreview> {
  const study = await getPrepStudyView(input.orgId, input.studyId);
  if (!study) throw new PrepError("Étude introuvable", 404);

  const engine = computeStudy({ params: study.params, lines: study.lines });
  const lotLabels = new Map(study.lots.map((l) => [l.code, l.label]));
  const paramByKey = new Map(study.params.map((p) => [p.key, p]));

  const transferable: PrepQuotePreviewLine[] = [];
  const excluded: PrepQuotePreviewLine[] = [];

  for (const line of study.lines) {
    const node = engine.nodes.get(line.code);
    const { qty, blocked } = resolveTransferQty(line, node?.value ?? null, node?.error ?? null);
    const transferableLine = isPrepLineTransferable(line.role) && !blocked && qty !== null;

    const chars =
      line.formula
        ? inputParamsOf(engine, line.code)
            .map((k) => paramByKey.get(k))
            .filter((p): p is NonNullable<typeof p> => !!p && p.value !== null)
            .slice(0, 6)
            .map((p) => ({ label: p.label, value: `${formatQty(p.value)} ${displayUnit(p.unit)}` }))
        : [];

    const descriptionPreview = buildQuoteDescriptionFromPrepLine(line, {
      quantity: qty,
      characteristics: chars,
    }).slice(0, 400);

    const row: PrepQuotePreviewLine = {
      code: line.code,
      lot: line.lot,
      lotLabel: lotLabels.get(line.lot) ?? line.lot,
      designation: line.designation,
      descriptionPreview,
      quantity: qty ?? 0,
      unit: line.unit,
      role: line.role,
      roleLabel: ROLE_LABELS[line.role],
      transferable: transferableLine,
      selectedByDefault: transferableLine,
      statusLabel: lineStatusLabel(line, qty, node?.error ?? null),
      blockedReason: blocked,
    };
    if (transferableLine) transferable.push(row);
    else excluded.push(row);
  }

  const existing = await prisma.commercialQuote.findMany({
    where: { organizationId: input.orgId, sourcePrepStudyId: study.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      number: true,
      subject: true,
      status: true,
      isDemonstration: true,
      createdAt: true,
    },
  });

  return {
    studyId: study.id,
    studyTitle: study.title,
    studyVersion: study.version,
    projectId: study.project.id,
    projectTitle: study.project.title,
    isDemonstration: study.mode === "DEMONSTRATION",
    watermark: study.mode === "DEMONSTRATION" ? DEMO_WATERMARK : null,
    transferable,
    excluded,
    existingQuotes: existing.map((q) => ({
      id: q.id,
      number: q.number,
      subject: q.subject,
      status: q.status,
      isDemonstration: q.isDemonstration,
      href: `/dashboard/devis-facturation/devis/${q.id}`,
      createdAt: q.createdAt.toISOString(),
    })),
  };
}

export async function commitPrepToQuote(input: {
  orgId: string;
  studyId: string;
  userId: string;
  selectedCodes: string[];
  idempotencyKey: string;
  subject?: string | null;
}): Promise<PrepQuoteCommitResult> {
  const key = input.idempotencyKey.trim();
  if (!key || key.length < 8) throw new PrepError("Clé d'idempotence manquante ou trop courte");
  if (!input.selectedCodes.length) throw new PrepError("Sélectionnez au moins une prestation");
  if (input.selectedCodes.length > 2000) throw new PrepError("Trop de lignes sélectionnées");

  const existingTransfer = await prisma.prepQuoteTransfer.findUnique({
    where: {
      organizationId_idempotencyKey: { organizationId: input.orgId, idempotencyKey: key },
    },
    include: { quote: { select: { id: true, number: true, isDemonstration: true } } },
  });
  if (existingTransfer) {
    return {
      action: "idempotent",
      quoteId: existingTransfer.quoteId,
      quoteNumber: existingTransfer.quote.number,
      href: `/dashboard/devis-facturation/devis/${existingTransfer.quoteId}`,
      transferId: existingTransfer.id,
      lineCount: input.selectedCodes.length,
      isDemonstration: existingTransfer.quote.isDemonstration,
    };
  }

  const study = await getPrepStudyView(input.orgId, input.studyId);
  if (!study) throw new PrepError("Étude introuvable", 404);

  const engine = computeStudy({ params: study.params, lines: study.lines });
  const paramByKey = new Map(study.params.map((p) => [p.key, p]));
  const selected = new Set(input.selectedCodes);
  const linesToTransfer: Array<{
    line: PrepLineDTO;
    qty: number;
    description: string;
  }> = [];

  for (const line of study.lines) {
    if (!selected.has(line.code)) continue;
    const node = engine.nodes.get(line.code);
    const { qty, blocked } = resolveTransferQty(line, node?.value ?? null, node?.error ?? null);
    if (blocked || qty === null) {
      throw new PrepError(`${line.code} : ${blocked ?? "non transférable"}`);
    }
    const chars = line.formula
      ? inputParamsOf(engine, line.code)
          .map((k) => paramByKey.get(k))
          .filter((p): p is NonNullable<typeof p> => !!p && p.value !== null)
          .slice(0, 8)
          .map((p) => ({ label: p.label, value: `${formatQty(p.value)} ${displayUnit(p.unit)}` }))
      : [];
    linesToTransfer.push({
      line,
      qty,
      description: buildQuoteDescriptionFromPrepLine(line, { quantity: qty, characteristics: chars }),
    });
  }
  if (!linesToTransfer.length) throw new PrepError("Aucune prestation transférable dans la sélection");

  const isDemonstration = study.mode === "DEMONSTRATION";
  const subject =
    (input.subject?.trim() ||
      (isDemonstration
        ? `${DEMO_WATERMARK} — ${study.title}`
        : `Devis depuis métré — ${study.title}`)).slice(0, 500);

  const clientNotes = isDemonstration
    ? ensureDemoWatermark(
        "Devis de démonstration généré depuis BeWork Métré. Non contractuel — ne pas envoyer à un client réel ni facturer.",
      )
    : `Généré depuis l'étude de métré « ${study.title} ».`;

  const internalNotes = [
    `Transfert Métré → Devis`,
    `Étude : ${study.title} (${study.id})`,
    `Version métré : ${study.version}`,
    `Lignes : ${linesToTransfer.map((l) => l.line.code).join(", ")}`,
    isDemonstration ? DEMO_WATERMARK : null,
  ]
    .filter(Boolean)
    .join("\n");

  // Création hors transaction Prisma nested createQuote (qui a sa propre tx),
  // puis enregistrement des liens. Idempotence gérée en tête + unique key.
  let quoteNumber: string | undefined;
  if (isDemonstration) {
    quoteNumber = await prisma.$transaction((tx) => nextDemoQuoteNumber(input.orgId, tx));
  }

  const quote = await createQuote({
    orgId: input.orgId,
    userId: input.userId,
    subject,
    projectId: study.project.id,
    clientExternalOrgId: null,
    clientSnapshotJson: { name: "Client à préciser" },
    clientNotes,
    internalNotes,
    isDemonstration,
    sourcePrepStudyId: study.id,
    numberOverride: quoteNumber,
    skipDefaultSection: true,
  });

  const lotOrder = study.lots.map((l) => l.code);
  const byLot = new Map<string, typeof linesToTransfer>();
  for (const item of linesToTransfer) {
    const list = byLot.get(item.line.lot) ?? [];
    list.push(item);
    byLot.set(item.line.lot, list);
  }

  const sectionIds = new Map<string, string>();
  for (const lot of lotOrder) {
    const items = byLot.get(lot);
    if (!items?.length) continue;
    const label = study.lots.find((l) => l.code === lot)?.label ?? lot;
    const section = await addSection(input.orgId, quote.id, `${lot} — ${label}`);
    sectionIds.set(lot, section.id);
  }
  for (const [lot, items] of byLot) {
    if (sectionIds.has(lot)) continue;
    const section = await addSection(input.orgId, quote.id, lot);
    sectionIds.set(lot, section.id);
  }

  const createdLinks: Array<{
    code: string;
    quoteLineId: string;
    qty: number;
    unit: string;
    designation: string;
    description: string;
  }> = [];

  for (const lot of [...lotOrder, ...[...byLot.keys()].filter((l) => !lotOrder.includes(l))]) {
    const items = byLot.get(lot);
    if (!items) continue;
    const sectionId = sectionIds.get(lot)!;
    for (const item of items) {
      const line = await upsertLine(input.orgId, quote.id, {
        sectionId,
        kind: "WORK",
        reference: item.line.code,
        designation: item.line.designation,
        description: item.description,
        quantity: item.qty,
        unit: displayUnit(item.line.unit) || item.line.unit,
        unitSellHt: 0,
        unitCostHt: 0,
      });
      createdLinks.push({
        code: item.line.code,
        quoteLineId: line.id,
        qty: item.qty,
        unit: item.line.unit,
        designation: item.line.designation,
        description: item.description,
      });
    }
  }

  try {
    const transfer = await prisma.prepQuoteTransfer.create({
      data: {
        organizationId: input.orgId,
        studyId: study.id,
        quoteId: quote.id,
        idempotencyKey: key,
        studyVersion: study.version,
        isDemonstration,
        createdById: input.userId,
        summaryJson: {
          codes: createdLinks.map((l) => l.code),
          lineCount: createdLinks.length,
        },
        links: {
          create: createdLinks.map((l) => ({
            organizationId: input.orgId,
            studyId: study.id,
            studyLineCode: l.code,
            quoteId: quote.id,
            quoteLineId: l.quoteLineId,
            quantityAtTransfer: l.qty,
            unitAtTransfer: l.unit,
            designationAtTransfer: l.designation,
            descriptionAtTransfer: l.description,
          })),
        },
      },
    });

    await prisma.prepStudyEvent.create({
      data: {
        studyId: study.id,
        organizationId: input.orgId,
        kind: "TRANSFER_TO_QUOTE",
        detailJson: {
          quoteId: quote.id,
          quoteNumber: quote.number,
          transferId: transfer.id,
          lineCount: createdLinks.length,
          isDemonstration,
        },
        actorUserId: input.userId,
      },
    });

    return {
      action: "created",
      quoteId: quote.id,
      quoteNumber: quote.number,
      href: `/dashboard/devis-facturation/devis/${quote.id}`,
      transferId: transfer.id,
      lineCount: createdLinks.length,
      isDemonstration,
    };
  } catch (e) {
    // Race idempotence : un autre commit a gagné
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const again = await prisma.prepQuoteTransfer.findUnique({
        where: {
          organizationId_idempotencyKey: { organizationId: input.orgId, idempotencyKey: key },
        },
        include: { quote: { select: { id: true, number: true, isDemonstration: true } } },
      });
      if (again) {
        return {
          action: "idempotent",
          quoteId: again.quoteId,
          quoteNumber: again.quote.number,
          href: `/dashboard/devis-facturation/devis/${again.quoteId}`,
          transferId: again.id,
          lineCount: createdLinks.length,
          isDemonstration: again.quote.isDemonstration,
        };
      }
    }
    throw e;
  }
}

export async function listPrepQuoteDiffs(input: {
  orgId: string;
  studyId: string;
  quoteId?: string | null;
}): Promise<PrepQuoteDiff[]> {
  const study = await getPrepStudyView(input.orgId, input.studyId);
  if (!study) throw new PrepError("Étude introuvable", 404);
  const engine = computeStudy({ params: study.params, lines: study.lines });
  const lineByCode = new Map(study.lines.map((l) => [l.code, l]));

  const links = await prisma.prepQuoteLink.findMany({
    where: {
      organizationId: input.orgId,
      studyId: input.studyId,
      ...(input.quoteId ? { quoteId: input.quoteId } : {}),
    },
    include: {
      quote: { select: { id: true, number: true, currentVersionId: true } },
    },
  });

  const diffs: PrepQuoteDiff[] = [];
  for (const link of links) {
    if (!link.quote.currentVersionId) continue;
    const qLine = await prisma.commercialQuoteLine.findFirst({
      where: {
        id: link.quoteLineId,
        organizationId: input.orgId,
        versionId: link.quote.currentVersionId,
      },
    });
    if (!qLine) continue;
    const prep = lineByCode.get(link.studyLineCode);
    if (!prep) continue;
    const node = engine.nodes.get(prep.code);
    const { qty } = resolveTransferQty(prep, node?.value ?? null, node?.error ?? null);
    const fields: PrepQuoteDiff["fields"] = [];

    const currentQty = qty;
    const quoteQty = d(qLine.quantity);
    if (currentQty !== null && Math.abs(currentQty - quoteQty) > 1e-9) {
      const pu = d(qLine.unitSellHt);
      fields.push({
        field: "quantity",
        label: "Quantité",
        before: quoteQty,
        after: currentQty,
        financialImpactHt: Math.round((currentQty - quoteQty) * pu * 100) / 100,
      });
    }
    if (prep.designation !== qLine.designation && prep.designation !== link.designationAtTransfer) {
      // also if designation changed from transfer snapshot
    }
    if (prep.designation.trim() !== qLine.designation.trim()) {
      fields.push({
        field: "designation",
        label: "Désignation",
        before: qLine.designation,
        after: prep.designation,
        financialImpactHt: null,
      });
    }
    const unitDisp = displayUnit(prep.unit) || prep.unit;
    if (unitDisp !== qLine.unit) {
      fields.push({
        field: "unit",
        label: "Unité",
        before: qLine.unit,
        after: unitDisp,
        financialImpactHt: null,
      });
    }
    // Description : comparer à l'empreinte de transfert (évite le bruit si l'utilisateur a édité le devis)
    if (
      prep.description &&
      link.descriptionAtTransfer &&
      prep.description.trim() !== (link.descriptionAtTransfer ?? "").trim() &&
      (qLine.description ?? "").includes(`Réf. métré : ${prep.code}`)
    ) {
      fields.push({
        field: "description",
        label: "Description technique",
        before: "(version devis)",
        after: "(mise à jour métré disponible)",
        financialImpactHt: null,
      });
    }

    if (fields.length) {
      diffs.push({
        linkId: link.id,
        studyLineCode: link.studyLineCode,
        quoteLineId: link.quoteLineId,
        quoteId: link.quoteId,
        quoteNumber: link.quote.number,
        fields,
      });
    }
  }
  return diffs;
}

export async function applyPrepQuoteQuantitySync(input: {
  orgId: string;
  userId: string;
  linkId: string;
  applyQuantity: boolean;
  applyDesignation: boolean;
  applyUnit: boolean;
  applyDescription: boolean;
}): Promise<{ ok: true }> {
  const link = await prisma.prepQuoteLink.findFirst({
    where: { id: input.linkId, organizationId: input.orgId },
    include: { quote: { select: { id: true, currentVersionId: true, status: true } } },
  });
  if (!link) throw new PrepError("Liaison introuvable", 404);
  if (!link.quote.currentVersionId) throw new PrepError("Version de devis introuvable");
  if (["SENT", "VIEWED", "ACCEPTED"].includes(link.quote.status)) {
    throw new PrepError(
      "Devis verrouillé ou émis : créez une nouvelle version ou un avenant pour synchroniser.",
      409,
    );
  }

  const study = await getPrepStudyView(input.orgId, link.studyId);
  if (!study) throw new PrepError("Étude introuvable", 404);
  const prep = study.lines.find((l) => l.code === link.studyLineCode);
  if (!prep) throw new PrepError(`Ligne métré ${link.studyLineCode} introuvable`);
  const engine = computeStudy({ params: study.params, lines: study.lines });
  const node = engine.nodes.get(prep.code);
  const { qty, blocked } = resolveTransferQty(prep, node?.value ?? null, node?.error ?? null);

  const qLine = await prisma.commercialQuoteLine.findFirst({
    where: {
      id: link.quoteLineId,
      organizationId: input.orgId,
      versionId: link.quote.currentVersionId,
    },
  });
  if (!qLine) throw new PrepError("Ligne de devis introuvable", 404);

  const patch: {
    quantity?: number;
    designation?: string;
    unit?: string;
    description?: string | null;
  } = {
    // conserver les prix existants
    designation: qLine.designation,
    quantity: d(qLine.quantity),
    unit: qLine.unit,
    description: qLine.description,
  };

  if (input.applyQuantity) {
    if (blocked || qty === null) throw new PrepError(blocked ?? "Quantité indisponible");
    patch.quantity = qty;
  }
  if (input.applyDesignation) patch.designation = prep.designation;
  if (input.applyUnit) patch.unit = displayUnit(prep.unit) || prep.unit;
  if (input.applyDescription) {
    const paramByKey = new Map(study.params.map((p) => [p.key, p]));
    const chars = prep.formula
      ? inputParamsOf(engine, prep.code)
          .map((k) => paramByKey.get(k))
          .filter((p): p is NonNullable<typeof p> => !!p && p.value !== null)
          .slice(0, 8)
          .map((p) => ({ label: p.label, value: `${formatQty(p.value)} ${displayUnit(p.unit)}` }))
      : [];
    patch.description = buildQuoteDescriptionFromPrepLine(prep, {
      quantity: qty ?? d(qLine.quantity),
      characteristics: chars,
    });
  }

  await upsertLine(input.orgId, link.quoteId, {
    lineId: qLine.id,
    sectionId: qLine.sectionId,
    kind: qLine.kind,
    reference: qLine.reference ?? prep.code,
    designation: patch.designation!,
    description: patch.description,
    quantity: patch.quantity,
    unit: patch.unit,
    unitSellHt: d(qLine.unitSellHt),
    unitCostHt: d(qLine.unitCostHt),
    discountPercent: d(qLine.discountPercent),
    vatRate: d(qLine.vatRate),
  });

  await prisma.prepQuoteLink.update({
    where: { id: link.id },
    data: {
      quantityAtTransfer: patch.quantity ?? link.quantityAtTransfer,
      unitAtTransfer: patch.unit ?? link.unitAtTransfer,
      designationAtTransfer: patch.designation ?? link.designationAtTransfer,
      descriptionAtTransfer: patch.description ?? link.descriptionAtTransfer,
    },
  });

  await prisma.prepStudyEvent.create({
    data: {
      studyId: link.studyId,
      organizationId: input.orgId,
      kind: "SYNC_QUOTE_LINE",
      detailJson: {
        linkId: link.id,
        quoteId: link.quoteId,
        code: link.studyLineCode,
        applyQuantity: input.applyQuantity,
        applyDesignation: input.applyDesignation,
        applyUnit: input.applyUnit,
        applyDescription: input.applyDescription,
      },
      actorUserId: input.userId,
    },
  });

  return { ok: true };
}
