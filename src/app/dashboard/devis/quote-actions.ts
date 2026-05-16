"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { QuoteDocumentStatus, QuoteDocumentType } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { prisma } from "@/lib/prisma";
import {
  defaultLegalDisclaimerForType,
  isQuoteDocumentStatus,
  isQuoteDocumentType,
} from "@/lib/be-work-devis-quote-labels";
import { computeLineTotalsDecimal, parseDecimalInput } from "@/lib/be-work-devis-quote-maths";
import { searchWorkItemsForQuotePicker } from "@/lib/be-work-devis-quote-picker";

async function guard() {
  await requireBeWorkDevisSession();
}

function newDocumentNumber(): string {
  return `BW-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;
}

export async function listQuoteProjectsForSelect() {
  await guard();
  return prisma.quoteProject.findMany({
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: { id: true, clientName: true, projectName: true },
  });
}

export async function listQuoteProjectsTable() {
  await guard();
  return prisma.quoteProject.findMany({
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      _count: { select: { documents: true } },
    },
  });
}

export async function listQuoteDocuments(projectId?: string) {
  await guard();
  return prisma.quoteDocument.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      project: {
        select: { id: true, clientName: true, projectName: true },
      },
    },
  });
}

function empty(formData: FormData, key: string): string | undefined {
  const v = String(formData.get(key) ?? "").trim();
  return v || undefined;
}

export async function createQuoteProject(formData: FormData) {
  await guard();
  const clientName = String(formData.get("clientName") ?? "").trim();
  const projectName = String(formData.get("projectName") ?? "").trim();
  if (!clientName || !projectName) throw new Error("Client et projet obligatoires.");

  await prisma.quoteProject.create({
    data: {
      clientName,
      clientEmail: empty(formData, "clientEmail"),
      clientPhone: empty(formData, "clientPhone"),
      projectName,
      projectAddress: empty(formData, "projectAddress"),
      projectCity: empty(formData, "projectCity"),
      projectDepartment: empty(formData, "projectDepartment"),
      projectType: empty(formData, "projectType"),
      notes: empty(formData, "notes"),
    },
  });
  revalidatePath("/dashboard/devis/projets");
  revalidatePath("/dashboard/devis/creer");
  redirect("/dashboard/devis/projets");
}

export async function createQuoteDocumentWizard(formData: FormData) {
  await guard();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const documentTypeRaw = String(formData.get("documentType") ?? "devis_estimatif").trim();
  if (!projectId || !title) throw new Error("Projet et titre obligatoires.");
  if (!isQuoteDocumentType(documentTypeRaw)) throw new Error("Type de document invalide.");

  const issueRaw = String(formData.get("issueDate") ?? "").trim();
  const issueDate = issueRaw ? new Date(issueRaw) : new Date();
  if (Number.isNaN(issueDate.getTime())) throw new Error("Date d’émission invalide.");

  const validityRaw = String(formData.get("validityDate") ?? "").trim();
  const validityDate = validityRaw ? new Date(validityRaw) : null;

  const doc = await prisma.quoteDocument.create({
    data: {
      projectId,
      documentNumber: newDocumentNumber(),
      documentType: documentTypeRaw,
      title,
      status: "brouillon",
      issueDate,
      validityDate: validityDate && !Number.isNaN(validityDate.getTime()) ? validityDate : undefined,
      globalVatRate: new Prisma.Decimal("20"),
      legalDisclaimer: defaultLegalDisclaimerForType(documentTypeRaw),
    },
  });
  revalidatePath("/dashboard/devis/documents");
  redirect(`/dashboard/devis/documents/${doc.id}/modifier`);
}

export async function searchWorkItemsForQuoteAction(q: string) {
  await guard();
  return searchWorkItemsForQuotePicker(q);
}

async function recalcDocumentTotalsTx(
  tx: Omit<
    import("@prisma/client").PrismaClient,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
  >,
  documentId: string,
) {
  const lines = await tx.quoteLine.findMany({ where: { documentId } });
  let sub = new Prisma.Decimal("0");
  let tv = new Prisma.Decimal("0");
  let tt = new Prisma.Decimal("0");
  for (const l of lines) {
    sub = sub.add(l.totalHT);
    tv = tv.add(l.totalVat);
    tt = tt.add(l.totalTTC);
  }
  await tx.quoteDocument.update({
    where: { id: documentId },
    data: { subtotalHT: sub, totalVat: tv, totalTTC: tt },
  });
}

async function recalcDocumentTotals(documentId: string) {
  await prisma.$transaction(async (tx) => {
    await recalcDocumentTotalsTx(tx, documentId);
  });
}

export async function addQuoteLinesFromWorkItems(documentId: string, workItemIds: string[]) {
  await guard();
  if (!workItemIds.length) return { ok: false as const, error: "Aucun ouvrage sélectionné." };

  const doc = await prisma.quoteDocument.findUnique({ where: { id: documentId } });
  if (!doc) return { ok: false as const, error: "Document introuvable." };

  const maxSort = await prisma.quoteLine.aggregate({
    where: { documentId },
    _max: { sortOrder: true },
  });
  let order = (maxSort._max.sortOrder ?? 0) + 1;

  const items = await prisma.workItem.findMany({
    where: { id: { in: workItemIds } },
  });
  const aggs = await prisma.priceEntry.groupBy({
    by: ["workItemId"],
    where: { workItemId: { in: items.map((i) => i.id) } },
    _avg: { unitPriceHT: true },
  });
  const avgMap = new Map(aggs.map((a) => [a.workItemId, a._avg.unitPriceHT]));

  const defaultVat = doc.globalVatRate;
  const qtyOne = new Prisma.Decimal("1");

  await prisma.$transaction(async (tx) => {
    for (const w of items) {
      const avg = avgMap.get(w.id);
      const unitPrice =
        avg != null ? new Prisma.Decimal(String(avg)) : new Prisma.Decimal("0");
      const totals = computeLineTotalsDecimal(qtyOne, unitPrice, defaultVat);
      await tx.quoteLine.create({
        data: {
          documentId,
          workItemId: w.id,
          lot: w.lot,
          family: w.family ?? undefined,
          code: w.code,
          title: w.title,
          description: w.fullDescription,
          unit: w.unit,
          quantity: qtyOne,
          unitPriceHT: unitPrice,
          vatRate: defaultVat,
          totalHT: totals.totalHT,
          totalVat: totals.totalVat,
          totalTTC: totals.totalTTC,
          includedItems: w.includedItems ?? undefined,
          excludedItems: w.excludedItems ?? undefined,
          vigilancePoints: w.vigilancePoints ?? undefined,
          sortOrder: order++,
        },
      });
    }
    await recalcDocumentTotalsTx(tx, documentId);
  });

  revalidatePath(`/dashboard/devis/documents/${documentId}/modifier`);
  revalidatePath(`/dashboard/devis/documents/${documentId}`);
  revalidatePath("/dashboard/devis/documents");
  return { ok: true as const };
}

export async function addQuoteLineFree(documentId: string) {
  await guard();
  const doc = await prisma.quoteDocument.findUnique({ where: { id: documentId } });
  if (!doc) throw new Error("Document introuvable.");
  const maxSort = await prisma.quoteLine.aggregate({
    where: { documentId },
    _max: { sortOrder: true },
  });
  const order = (maxSort._max.sortOrder ?? 0) + 1;
  const vat = doc.globalVatRate;
  const qty = new Prisma.Decimal("1");
  const pu = new Prisma.Decimal("0");
  const totals = computeLineTotalsDecimal(qty, pu, vat);
  await prisma.quoteLine.create({
    data: {
      documentId,
      lot: "Divers",
      title: "Nouvelle ligne",
      description: "—",
      unit: "forfait",
      quantity: qty,
      unitPriceHT: pu,
      vatRate: vat,
      totalHT: totals.totalHT,
      totalVat: totals.totalVat,
      totalTTC: totals.totalTTC,
      sortOrder: order,
    },
  });
  await recalcDocumentTotals(documentId);
  revalidatePath(`/dashboard/devis/documents/${documentId}/modifier`);
}

export type QuoteLineDraft = {
  id: string;
  workItemId?: string | null;
  lot: string;
  family?: string | null;
  code?: string | null;
  title: string;
  description: string;
  unit: string;
  quantity: string;
  unitPriceHT: string;
  vatRate: string;
  includedItems?: string | null;
  excludedItems?: string | null;
  vigilancePoints?: string | null;
  sortOrder: number;
};

export async function saveQuoteDocumentLines(documentId: string, lines: QuoteLineDraft[]) {
  await guard();
  const doc = await prisma.quoteDocument.findUnique({ where: { id: documentId } });
  if (!doc) return { ok: false as const, error: "Document introuvable." };

  await prisma.$transaction(async (tx) => {
    const existing = await tx.quoteLine.findMany({ where: { documentId }, select: { id: true } });
    const incomingRealIds = new Set(
      lines.map((l) => l.id).filter((id) => Boolean(id) && !id.startsWith("tmp-")),
    );
    for (const e of existing) {
      if (!incomingRealIds.has(e.id)) {
        await tx.quoteLine.delete({ where: { id: e.id } });
      }
    }

    for (const row of lines) {
      const qty = parseDecimalInput(row.quantity, "1");
      const pu = parseDecimalInput(row.unitPriceHT, "0");
      const vat = parseDecimalInput(row.vatRate, String(doc.globalVatRate));
      const totals = computeLineTotalsDecimal(qty, pu, vat);
      const base = {
        lot: row.lot.trim() || "—",
        family: row.family?.trim() || null,
        code: row.code?.trim() || null,
        title: row.title.trim() || "—",
        description: row.description.trim() || "—",
        unit: row.unit.trim() || "u",
        quantity: qty,
        unitPriceHT: pu,
        vatRate: vat,
        totalHT: totals.totalHT,
        totalVat: totals.totalVat,
        totalTTC: totals.totalTTC,
        includedItems: row.includedItems?.trim() || null,
        excludedItems: row.excludedItems?.trim() || null,
        vigilancePoints: row.vigilancePoints?.trim() || null,
        sortOrder: row.sortOrder,
        workItemId: row.workItemId?.trim() || null,
      };

      if (row.id && !row.id.startsWith("tmp-")) {
        await tx.quoteLine.update({
          where: { id: row.id },
          data: base,
        });
      } else {
        await tx.quoteLine.create({
          data: {
            documentId,
            ...base,
          },
        });
      }
    }
    await recalcDocumentTotalsTx(tx, documentId);
  });

  revalidatePath(`/dashboard/devis/documents/${documentId}/modifier`);
  revalidatePath(`/dashboard/devis/documents/${documentId}`);
  revalidatePath("/dashboard/devis/documents");
  return { ok: true as const };
}

export async function updateQuoteDocumentMeta(formData: FormData) {
  await guard();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Document manquant.");
  const title = String(formData.get("title") ?? "").trim();
  const documentTypeRaw = String(formData.get("documentType") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "").trim();
  if (!title) throw new Error("Titre obligatoire.");
  if (!isQuoteDocumentType(documentTypeRaw)) throw new Error("Type invalide.");
  if (!isQuoteDocumentStatus(statusRaw)) throw new Error("Statut invalide.");

  const issueRaw = String(formData.get("issueDate") ?? "").trim();
  const validityRaw = String(formData.get("validityDate") ?? "").trim();
  const issueDate = issueRaw ? new Date(issueRaw) : new Date();
  const validityDate = validityRaw ? new Date(validityRaw) : null;

  const globalVat = parseDecimalInput(String(formData.get("globalVatRate") ?? "20"), "20");

  await prisma.quoteDocument.update({
    where: { id },
    data: {
      title,
      documentType: documentTypeRaw as QuoteDocumentType,
      status: statusRaw as QuoteDocumentStatus,
      issueDate,
      validityDate: validityDate && !Number.isNaN(validityDate.getTime()) ? validityDate : null,
      globalVatRate: globalVat,
      notesClient: empty(formData, "notesClient"),
      internalNotes: empty(formData, "internalNotes"),
      legalDisclaimer: empty(formData, "legalDisclaimer"),
    },
  });
  revalidatePath(`/dashboard/devis/documents/${id}/modifier`);
  revalidatePath(`/dashboard/devis/documents/${id}`);
  revalidatePath("/dashboard/devis/documents");
}
