import { createHash } from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import { calculateLine, roundMoney } from "@/lib/commercial/money";
import {
  assertEditableVersion,
  recomputeAndSaveVersionTotals,
} from "@/lib/commercial/quotes";
import { previewQuotePatch } from "@/lib/commercial/chatgpt-patch/preview";
import type { BeworkQuotePatchV1 } from "@/lib/commercial/chatgpt-patch/types";

export type ApplyQuotePatchResult =
  | {
      ok: true;
      patchRecordId: string;
      summary: {
        added: number;
        updated: number;
        deleted: number;
        beforeHt: number;
        afterHt: number;
      };
    }
  | { ok: false; error: string; code?: string };

type SnapshotLine = {
  id: string;
  sectionId: string | null;
  kind: string;
  reference: string | null;
  designation: string;
  description: string | null;
  quantity: number;
  unit: string;
  unitCostHt: number;
  unitSellHt: number;
  discountPercent: number;
  vatRate: number;
  sortOrder: number;
  isOptional: boolean;
};

type SnapshotSection = {
  id: string;
  title: string;
  sortOrder: number;
};

type SnapshotPayload = {
  subject: string;
  clientNotes: string | null;
  internalNotes: string | null;
  paymentTerms: string | null;
  sections: SnapshotSection[];
  lines: SnapshotLine[];
};

function fingerprintFromSnapshot(s: SnapshotPayload): string {
  const payload = JSON.stringify({
    subject: s.subject,
    clientNotes: s.clientNotes,
    internalNotes: s.internalNotes,
    paymentTerms: s.paymentTerms,
    sections: s.sections.map((x) => ({ id: x.id, title: x.title, sortOrder: x.sortOrder })),
    lines: s.lines.map((l) => ({
      id: l.id,
      sectionId: l.sectionId,
      designation: l.designation,
      description: l.description,
      quantity: l.quantity,
      unit: l.unit,
      unitSellHt: l.unitSellHt,
      discountPercent: l.discountPercent,
      vatRate: l.vatRate,
      sortOrder: l.sortOrder,
    })),
  });
  return createHash("sha256").update(payload).digest("hex");
}

async function loadSnapshot(
  orgId: string,
  quoteId: string,
): Promise<{ quote: { id: string; number: string }; versionId: string; versionNumber: number; snapshot: SnapshotPayload }> {
  const quote = await assertEditableVersion(orgId, quoteId);
  const version = quote.currentVersion!;
  const [sections, lines] = await Promise.all([
    prisma.commercialQuoteSection.findMany({
      where: { versionId: version.id, organizationId: orgId },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.commercialQuoteLine.findMany({
      where: { versionId: version.id, organizationId: orgId },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const full = await prisma.commercialQuote.findFirstOrThrow({
    where: { id: quoteId, organizationId: orgId },
    select: {
      id: true,
      number: true,
      subject: true,
      clientNotes: true,
      internalNotes: true,
      paymentTerms: true,
    },
  });

  return {
    quote: { id: full.id, number: full.number },
    versionId: version.id,
    versionNumber: version.versionNumber,
    snapshot: {
      subject: full.subject,
      clientNotes: full.clientNotes,
      internalNotes: full.internalNotes,
      paymentTerms: full.paymentTerms,
      sections: sections.map((s) => ({
        id: s.id,
        title: s.title,
        sortOrder: s.sortOrder,
      })),
      lines: lines.map((l) => ({
        id: l.id,
        sectionId: l.sectionId,
        kind: l.kind,
        reference: l.reference,
        designation: l.designation,
        description: l.description,
        quantity: d(l.quantity),
        unit: l.unit,
        unitCostHt: d(l.unitCostHt),
        unitSellHt: d(l.unitSellHt),
        discountPercent: d(l.discountPercent),
        vatRate: d(l.vatRate),
        sortOrder: l.sortOrder,
        isOptional: l.isOptional,
      })),
    },
  };
}

function resolveLineId(
  lines: SnapshotLine[],
  itemId?: string | null,
  designationMatch?: string | null,
): string {
  if (itemId) {
    const byId = lines.find((l) => l.id === itemId);
    if (byId) return byId.id;
    const byRef = lines.find((l) => l.reference === itemId);
    if (byRef) return byRef.id;
    throw new Error(`Aucun poste trouvé pour item_id « ${itemId} ».`);
  }
  const needle = (designationMatch ?? "").trim().toLowerCase();
  const matches = lines.filter((l) => l.designation.trim().toLowerCase() === needle);
  if (matches.length === 0) {
    throw new Error(`Aucun poste correspondant à « ${designationMatch} ».`);
  }
  if (matches.length > 1) {
    throw new Error(
      "Impossible d’identifier précisément le poste à modifier. Fournissez un item_id.",
    );
  }
  return matches[0]!.id;
}

function resolveSectionId(
  sections: SnapshotSection[],
  sectionId?: string | null,
  titleMatch?: string | null,
): string {
  if (sectionId) {
    const s = sections.find((x) => x.id === sectionId);
    if (!s) throw new Error(`Section introuvable : ${sectionId}`);
    return s.id;
  }
  const needle = (titleMatch ?? "").trim().toLowerCase();
  const matches = sections.filter((s) => s.title.trim().toLowerCase() === needle);
  if (matches.length === 0) throw new Error(`Aucune section « ${titleMatch} ».`);
  if (matches.length > 1) {
    throw new Error("Plusieurs sections portent le même titre. Fournissez un section_id.");
  }
  return matches[0]!.id;
}

/** Applique un patch de façon atomique (transaction). */
export async function applyQuotePatch(input: {
  orgId: string;
  quoteId: string;
  patch: BeworkQuotePatchV1;
  userId?: string | null;
  forceVersionMismatch?: boolean;
}): Promise<ApplyQuotePatchResult> {
  const preview = await previewQuotePatch({
    orgId: input.orgId,
    quoteId: input.quoteId,
    patch: input.patch,
  });

  if (!preview.ok) {
    return {
      ok: false,
      error: preview.errors[0] ?? preview.blockedReason ?? "Patch non applicable.",
      code: preview.alreadyApplied
        ? "ALREADY_APPLIED"
        : preview.blockedReason
          ? "BLOCKED"
          : "INVALID",
    };
  }

  if (preview.versionMismatch && !input.forceVersionMismatch) {
    return {
      ok: false,
      error:
        preview.warnings[0] ??
        "Ce devis a été modifié depuis la génération de ce bloc. Vérifiez puis confirmez.",
      code: "VERSION_MISMATCH",
    };
  }

  try {
    const loaded = await loadSnapshot(input.orgId, input.quoteId);
    const workingSections = [...loaded.snapshot.sections];
    const workingLines = [...loaded.snapshot.lines];
    const sectionIdByTitle = new Map(
      workingSections.map((s) => [s.title.trim().toLowerCase(), s.id]),
    );

    let added = 0;
    let updated = 0;
    let deleted = 0;

    await prisma.$transaction(async (tx) => {
      for (const op of input.patch.operations) {
        if (op.op === "add_section") {
          const max = workingSections.reduce((m, s) => Math.max(m, s.sortOrder), -1);
          const created = await tx.commercialQuoteSection.create({
            data: {
              organizationId: input.orgId,
              versionId: loaded.versionId,
              title: op.title.trim(),
              sortOrder: max + 1,
            },
          });
          workingSections.push({
            id: created.id,
            title: created.title,
            sortOrder: created.sortOrder,
          });
          sectionIdByTitle.set(created.title.trim().toLowerCase(), created.id);
          added += 1;
          continue;
        }

        if (op.op === "update_section") {
          const id = resolveSectionId(workingSections, op.sectionId, op.titleMatch);
          await tx.commercialQuoteSection.update({
            where: { id },
            data: { title: op.title.trim() },
          });
          const s = workingSections.find((x) => x.id === id)!;
          sectionIdByTitle.delete(s.title.trim().toLowerCase());
          s.title = op.title.trim();
          sectionIdByTitle.set(s.title.toLowerCase(), id);
          updated += 1;
          continue;
        }

        if (op.op === "delete_section") {
          const id = resolveSectionId(workingSections, op.sectionId, op.titleMatch);
          await tx.commercialQuoteLine.deleteMany({
            where: { versionId: loaded.versionId, sectionId: id, organizationId: input.orgId },
          });
          await tx.commercialQuoteSection.delete({ where: { id } });
          for (let i = workingLines.length - 1; i >= 0; i--) {
            if (workingLines[i]!.sectionId === id) workingLines.splice(i, 1);
          }
          const idx = workingSections.findIndex((s) => s.id === id);
          if (idx >= 0) workingSections.splice(idx, 1);
          deleted += 1;
          continue;
        }

        if (op.op === "add_item") {
          let sectionId: string | null = null;
          if (op.sectionId) {
            sectionId = resolveSectionId(workingSections, op.sectionId, null);
          } else if (op.sectionTitle) {
            const existing = sectionIdByTitle.get(op.sectionTitle.trim().toLowerCase());
            if (!existing) {
              throw new Error(
                `Section « ${op.sectionTitle} » introuvable. Ajoutez add_section au patch.`,
              );
            }
            sectionId = existing;
          }

          let sortOrder =
            workingLines.reduce((m, l) => Math.max(m, l.sortOrder), -1) + 1;
          if (op.insertAfterItemId) {
            const after = workingLines.find(
              (l) => l.id === op.insertAfterItemId || l.reference === op.insertAfterItemId,
            );
            if (after) sortOrder = after.sortOrder + 1;
          } else if (op.insertBeforeItemId) {
            const before = workingLines.find(
              (l) =>
                l.id === op.insertBeforeItemId || l.reference === op.insertBeforeItemId,
            );
            if (before) sortOrder = Math.max(0, before.sortOrder);
          }

          const quoteVat = await tx.commercialQuote.findFirstOrThrow({
            where: { id: input.quoteId },
            select: { defaultVatRate: true },
          });
          const vatRate = op.item.vatRate ?? d(quoteVat.defaultVatRate);
          const calc = calculateLine({
            kind: "WORK",
            quantity: op.item.quantity,
            unitCostHt: 0,
            unitSellHt: op.item.unitPriceHt,
            discountPercent: op.item.discountPercent ?? 0,
            vatRate,
            isOptional: false,
          });

          const created = await tx.commercialQuoteLine.create({
            data: {
              organizationId: input.orgId,
              versionId: loaded.versionId,
              sectionId,
              kind: "WORK",
              reference: op.item.itemId ?? null,
              designation: op.item.designation,
              description: op.item.description ?? null,
              quantity: op.item.quantity,
              unit: op.item.unit,
              unitCostHt: 0,
              unitSellHt: op.item.unitPriceHt,
              discountPercent: op.item.discountPercent ?? 0,
              vatRate,
              lineCostHt: calc.lineCostHt,
              lineSellHt: calc.lineSellHt,
              lineVat: calc.lineVat,
              lineTtc: calc.lineTtc,
              marginAmount: calc.marginAmount,
              sortOrder,
              isOptional: false,
            },
          });

          workingLines.push({
            id: created.id,
            sectionId,
            kind: "WORK",
            reference: op.item.itemId ?? null,
            designation: op.item.designation,
            description: op.item.description ?? null,
            quantity: op.item.quantity,
            unit: op.item.unit,
            unitCostHt: 0,
            unitSellHt: op.item.unitPriceHt,
            discountPercent: op.item.discountPercent ?? 0,
            vatRate,
            sortOrder,
            isOptional: false,
          });
          added += 1;
          continue;
        }

        if (op.op === "update_item") {
          const id = resolveLineId(workingLines, op.itemId, op.designationMatch);
          const line = workingLines.find((l) => l.id === id)!;
          const next = {
            designation: op.changes.designation ?? line.designation,
            description:
              op.changes.description !== undefined
                ? op.changes.description
                : line.description,
            quantity: op.changes.quantity ?? line.quantity,
            unit: op.changes.unit ?? line.unit,
            unitSellHt: op.changes.unitPriceHt ?? line.unitSellHt,
            discountPercent: op.changes.discountPercent ?? line.discountPercent,
            vatRate: op.changes.vatRate ?? line.vatRate,
          };
          const calc = calculateLine({
            kind: line.kind as never,
            quantity: next.quantity,
            unitCostHt: line.unitCostHt,
            unitSellHt: next.unitSellHt,
            discountPercent: next.discountPercent,
            vatRate: next.vatRate,
            isOptional: line.isOptional,
          });
          await tx.commercialQuoteLine.update({
            where: { id },
            data: {
              designation: next.designation,
              description: next.description,
              quantity: next.quantity,
              unit: next.unit,
              unitSellHt: next.unitSellHt,
              discountPercent: next.discountPercent,
              vatRate: next.vatRate,
              lineCostHt: calc.lineCostHt,
              lineSellHt: calc.lineSellHt,
              lineVat: calc.lineVat,
              lineTtc: calc.lineTtc,
              marginAmount: calc.marginAmount,
            },
          });
          Object.assign(line, next);
          updated += 1;
          continue;
        }

        if (op.op === "delete_item") {
          const id = resolveLineId(workingLines, op.itemId, op.designationMatch);
          await tx.commercialQuoteLine.delete({ where: { id } });
          const idx = workingLines.findIndex((l) => l.id === id);
          if (idx >= 0) workingLines.splice(idx, 1);
          deleted += 1;
          continue;
        }

        if (op.op === "update_quote") {
          const data: Prisma.CommercialQuoteUpdateInput = {};
          if (op.changes.subject !== undefined) data.subject = op.changes.subject;
          if (op.changes.clientNotes !== undefined) {
            data.clientNotes = op.changes.clientNotes;
          }
          if (op.changes.internalNotes !== undefined) {
            data.internalNotes = op.changes.internalNotes;
          }
          if (op.changes.paymentTerms !== undefined) {
            data.paymentTerms = op.changes.paymentTerms;
          }
          await tx.commercialQuote.update({
            where: { id: input.quoteId },
            data,
          });
          updated += 1;
          continue;
        }

        if (op.op === "add_note") {
          const q = await tx.commercialQuote.findFirstOrThrow({
            where: { id: input.quoteId },
            select: { clientNotes: true, internalNotes: true },
          });
          if (op.target === "internal") {
            const next = [q.internalNotes?.trim(), op.content.trim()]
              .filter(Boolean)
              .join("\n\n");
            await tx.commercialQuote.update({
              where: { id: input.quoteId },
              data: { internalNotes: next },
            });
          } else {
            const next = [q.clientNotes?.trim(), op.content.trim()]
              .filter(Boolean)
              .join("\n\n");
            await tx.commercialQuote.update({
              where: { id: input.quoteId },
              data: { clientNotes: next },
            });
          }
          added += 1;
        }
      }

      /* Totaux recalculés BeWork */
      const allLines = await tx.commercialQuoteLine.findMany({
        where: { versionId: loaded.versionId, organizationId: input.orgId },
      });
      let totalCostHt = 0;
      let totalSellHt = 0;
      let totalVat = 0;
      let totalTtc = 0;
      let marginAmount = 0;
      for (const l of allLines) {
        if (l.isOptional) continue;
        totalCostHt += d(l.lineCostHt);
        totalSellHt += d(l.lineSellHt);
        totalVat += d(l.lineVat);
        totalTtc += d(l.lineTtc);
        marginAmount += d(l.marginAmount);
      }
      totalCostHt = roundMoney(totalCostHt, 2);
      totalSellHt = roundMoney(totalSellHt, 2);
      totalVat = roundMoney(totalVat, 2);
      totalTtc = roundMoney(totalTtc, 2);
      marginAmount = roundMoney(marginAmount, 2);
      const marginPercent =
        totalSellHt > 0 ? roundMoney((marginAmount / totalSellHt) * 100, 2) : 0;

      await tx.commercialQuoteVersion.update({
        where: { id: loaded.versionId },
        data: {
          totalCostHt,
          totalSellHt,
          totalVat,
          totalTtc,
          marginAmount,
          marginPercent,
        },
      });
      await tx.commercialQuote.update({
        where: { id: input.quoteId },
        data: {
          totalCostHt,
          totalSellHt,
          totalVat,
          totalTtc,
          marginAmount,
          marginPercent,
        },
      });

      const afterSnap = await loadSnapshotInTx(tx, input.orgId, input.quoteId, loaded.versionId);
      const fingerprintAfter = fingerprintFromSnapshot(afterSnap);

      await tx.commercialQuoteChatgptPatch.create({
        data: {
          organizationId: input.orgId,
          quoteId: input.quoteId,
          patchId: input.patch.patchId,
          versionNumber: loaded.versionNumber,
          status: "APPLIED",
          summaryJson: {
            added,
            updated,
            deleted,
            beforeHt: preview.totals.beforeHt,
            afterHt: preview.totals.afterHt,
            operationsCount: input.patch.operations.length,
          },
          snapshotBeforeJson: loaded.snapshot as unknown as Prisma.InputJsonValue,
          fingerprintAfter,
          appliedById: input.userId ?? null,
        },
      });
    });

    await recomputeAndSaveVersionTotals(input.orgId, loaded.versionId);

    const record = await prisma.commercialQuoteChatgptPatch.findUnique({
      where: {
        quoteId_patchId: { quoteId: input.quoteId, patchId: input.patch.patchId },
      },
      select: { id: true },
    });

    return {
      ok: true,
      patchRecordId: record!.id,
      summary: {
        added,
        updated,
        deleted,
        beforeHt: preview.totals.beforeHt,
        afterHt: preview.totals.afterHt,
      },
    };
  } catch (e) {
    console.error("[chatgpt-patch/apply]", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Impossible d’appliquer le patch.",
      code: "ERROR",
    };
  }
}

async function loadSnapshotInTx(
  tx: Prisma.TransactionClient,
  orgId: string,
  quoteId: string,
  versionId: string,
): Promise<SnapshotPayload> {
  const [full, sections, lines] = await Promise.all([
    tx.commercialQuote.findFirstOrThrow({
      where: { id: quoteId, organizationId: orgId },
      select: {
        subject: true,
        clientNotes: true,
        internalNotes: true,
        paymentTerms: true,
      },
    }),
    tx.commercialQuoteSection.findMany({
      where: { versionId, organizationId: orgId },
      orderBy: { sortOrder: "asc" },
    }),
    tx.commercialQuoteLine.findMany({
      where: { versionId, organizationId: orgId },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  return {
    subject: full.subject,
    clientNotes: full.clientNotes,
    internalNotes: full.internalNotes,
    paymentTerms: full.paymentTerms,
    sections: sections.map((s) => ({
      id: s.id,
      title: s.title,
      sortOrder: s.sortOrder,
    })),
    lines: lines.map((l) => ({
      id: l.id,
      sectionId: l.sectionId,
      kind: l.kind,
      reference: l.reference,
      designation: l.designation,
      description: l.description,
      quantity: d(l.quantity),
      unit: l.unit,
      unitCostHt: d(l.unitCostHt),
      unitSellHt: d(l.unitSellHt),
      discountPercent: d(l.discountPercent),
      vatRate: d(l.vatRate),
      sortOrder: l.sortOrder,
      isOptional: l.isOptional,
    })),
  };
}

/** Annule le dernier patch ChatGPT si aucune modification incompatible depuis. */
export async function undoLastQuotePatch(input: {
  orgId: string;
  quoteId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assertEditableVersion(input.orgId, input.quoteId);

    const last = await prisma.commercialQuoteChatgptPatch.findFirst({
      where: {
        quoteId: input.quoteId,
        organizationId: input.orgId,
        status: "APPLIED",
      },
      orderBy: { appliedAt: "desc" },
    });
    if (!last) {
      return { ok: false, error: "Aucune modification ChatGPT à annuler." };
    }

    const loaded = await loadSnapshot(input.orgId, input.quoteId);
    const currentFp = fingerprintFromSnapshot(loaded.snapshot);
    if (currentFp !== last.fingerprintAfter) {
      return {
        ok: false,
        error:
          "Le devis a été modifié manuellement depuis ce patch. L’annulation automatique est désactivée pour ne pas écraser votre travail.",
      };
    }

    const snap = last.snapshotBeforeJson as SnapshotPayload;

    await prisma.$transaction(async (tx) => {
      await tx.commercialQuoteLine.deleteMany({
        where: { versionId: loaded.versionId, organizationId: input.orgId },
      });
      await tx.commercialQuoteSection.deleteMany({
        where: { versionId: loaded.versionId, organizationId: input.orgId },
      });

      for (const s of snap.sections) {
        await tx.commercialQuoteSection.create({
          data: {
            id: s.id,
            organizationId: input.orgId,
            versionId: loaded.versionId,
            title: s.title,
            sortOrder: s.sortOrder,
          },
        });
      }
      for (const l of snap.lines) {
        const calc = calculateLine({
          kind: l.kind as never,
          quantity: l.quantity,
          unitCostHt: l.unitCostHt,
          unitSellHt: l.unitSellHt,
          discountPercent: l.discountPercent,
          vatRate: l.vatRate,
          isOptional: l.isOptional,
        });
        await tx.commercialQuoteLine.create({
          data: {
            id: l.id,
            organizationId: input.orgId,
            versionId: loaded.versionId,
            sectionId: l.sectionId,
            kind: l.kind as never,
            reference: l.reference,
            designation: l.designation,
            description: l.description,
            quantity: l.quantity,
            unit: l.unit,
            unitCostHt: l.unitCostHt,
            unitSellHt: l.unitSellHt,
            discountPercent: l.discountPercent,
            vatRate: l.vatRate,
            lineCostHt: calc.lineCostHt,
            lineSellHt: calc.lineSellHt,
            lineVat: calc.lineVat,
            lineTtc: calc.lineTtc,
            marginAmount: calc.marginAmount,
            sortOrder: l.sortOrder,
            isOptional: l.isOptional,
          },
        });
      }

      await tx.commercialQuote.update({
        where: { id: input.quoteId },
        data: {
          subject: snap.subject,
          clientNotes: snap.clientNotes,
          internalNotes: snap.internalNotes,
          paymentTerms: snap.paymentTerms,
        },
      });

      await tx.commercialQuoteChatgptPatch.update({
        where: { id: last.id },
        data: { status: "UNDONE", undoneAt: new Date() },
      });
    });

    await recomputeAndSaveVersionTotals(input.orgId, loaded.versionId);
    return { ok: true };
  } catch (e) {
    console.error("[chatgpt-patch/undo]", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Annulation impossible.",
    };
  }
}
