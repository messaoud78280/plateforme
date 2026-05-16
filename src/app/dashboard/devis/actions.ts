"use server";

import { Prisma, type WorkItemItemType, type WorkItemQualityLevel, type WorkItemStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  isBeWorkPriceDocSourceType,
  isWorkItemItemType,
  isWorkItemQualityLevel,
  isWorkItemStatus,
} from "@/lib/be-work-devis-labels";
import { isWorkItemUnit, normalizeUnit } from "@/lib/be-work-devis-units";
import {
  buildFirstPriceEntryPreviewCells,
  buildPriceEntryCreateFromPaste,
  duplicateKeyFromPricePasteRaw,
  extractOrCoalescePriceEntriesFromPasteObject,
  extractPriceEntriesFromPastedWorkItem,
  mapPriceEntryPasteBuildError,
  priceDuplicateKeyMatchesRow,
  summarizePricePasteInvalidReasons,
} from "@/lib/be-work-devis-price-entry-paste";
import {
  emptyStructuredPasteFormValues,
  mapObjectToStructuredPasteFormValues,
  type StructuredPasteFormValues,
} from "@/lib/be-work-devis-structured-paste";
import {
  generateFullDescriptionFromTitle,
  isIncompleteDescriptionText,
  resolveImportedFullDescription,
} from "@/lib/be-work-devis-work-item-description";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { prisma } from "@/lib/prisma";

function parseMoney(raw: string): Prisma.Decimal | null {
  const s = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  if (Number.isNaN(n) || n < 0) return null;
  return new Prisma.Decimal(s);
}

function parseVatPercent(raw: string): Prisma.Decimal {
  const s = raw.trim().replace(",", ".");
  const n = Number(s);
  if (Number.isNaN(n) || n < 0) return new Prisma.Decimal("20");
  return new Prisma.Decimal(s);
}

function htToTtc(ht: Prisma.Decimal, vatPercent: Prisma.Decimal): Prisma.Decimal {
  const rate = vatPercent.div(100).add(1);
  return ht.mul(rate);
}

async function guard() {
  await requireBeWorkDevisSession();
}

export async function createWorkItem(formData: FormData) {
  await guard();
  const code = String(formData.get("code") ?? "").trim();
  const lot = String(formData.get("lot") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const fullDescription = String(formData.get("fullDescription") ?? "").trim();
  const unitRaw = String(formData.get("unit") ?? "").trim();
  const unit = normalizeUnit(unitRaw) ?? unitRaw;
  const statusRaw = String(formData.get("status") ?? "brouillon");
  const qualityRaw = String(formData.get("qualityLevel") ?? "standard");
  const itemTypeRaw = String(formData.get("itemType") ?? "ouvrage_technique");

  if (!code || !lot || !title || !fullDescription || !unitRaw) {
    throw new Error("Champs obligatoires manquants.");
  }
  if (
    !isWorkItemUnit(unit) ||
    !isWorkItemStatus(statusRaw) ||
    !isWorkItemQualityLevel(qualityRaw) ||
    !isWorkItemItemType(itemTypeRaw)
  ) {
    throw new Error("Statut, gamme, unité ou type d’ouvrage invalide.");
  }

  await prisma.workItem.create({
    data: {
      code,
      lot,
      subLot: emptyToNull(formData, "subLot"),
      family: emptyToNull(formData, "family"),
      familyCode: emptyToNull(formData, "familyCode"),
      sourceCode: emptyToNull(formData, "sourceCode"),
      sourceLine: emptyToNull(formData, "sourceLine"),
      title,
      shortDescription: emptyToNull(formData, "shortDescription"),
      fullDescription,
      unit,
      qualityLevel: qualityRaw,
      itemType: itemTypeRaw as WorkItemItemType,
      technicalReference: emptyToNull(formData, "technicalReference"),
      includedItems: emptyToNull(formData, "includedItems"),
      excludedItems: emptyToNull(formData, "excludedItems"),
      vigilancePoints: emptyToNull(formData, "vigilancePoints"),
      clientQuestions: emptyToNull(formData, "clientQuestions"),
      companyQuestions: emptyToNull(formData, "companyQuestions"),
      internalNotes: emptyToNull(formData, "internalNotes"),
      status: statusRaw,
    },
  });

  revalidatePath("/dashboard/devis/bibliotheque");
  revalidatePath("/dashboard/devis/bibliotheque/recodification");
  redirect("/dashboard/devis/bibliotheque");
}

const BULK_IMPORT_MAX = 500;

export type BulkImportWorkItemPayload = {
  values: StructuredPasteFormValues;
  priceEntries: Record<string, unknown>[];
  /** Objet JSON source (pour résolution désignation / type matériaux). */
  pasteSource?: Record<string, unknown>;
};

function normalizeBulkImportRows(rowsInput: unknown): BulkImportWorkItemPayload[] | null {
  if (!Array.isArray(rowsInput)) return null;
  return rowsInput.map((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      return { values: emptyStructuredPasteFormValues(), priceEntries: [] };
    }
    const o = row as Record<string, unknown>;
    if ("values" in o && o.values && typeof o.values === "object" && !Array.isArray(o.values)) {
      const values = o.values as StructuredPasteFormValues;
      const pe = Array.isArray(o.priceEntries)
        ? (o.priceEntries as unknown[]).filter(
            (x): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x),
          )
        : [];
      return { values, priceEntries: pe, pasteSource: o };
    }
    const { values } = mapObjectToStructuredPasteFormValues(o);
    return {
      values,
      priceEntries: extractOrCoalescePriceEntriesFromPasteObject(o),
      pasteSource: o,
    };
  });
}

/** Codes déjà présents en base (comparaison exacte sur le champ `code`). */
export async function checkWorkItemCodesExist(codesInput: string[]): Promise<string[]> {
  await guard();
  const codes = [...new Set(codesInput.map((c) => c.trim()).filter(Boolean))].slice(0, 2000);
  if (codes.length === 0) return [];
  const found = await prisma.workItem.findMany({
    where: { code: { in: codes } },
    select: { code: true },
  });
  return found.map((r) => r.code);
}

export type PreviewObservedPricePasteInputRow = {
  index: number;
  workItemCode: string;
  priceEntries: Record<string, unknown>[];
};

export type PricePastePreviewCells = {
  qty: string;
  puHt: string;
  totalHt: string;
  tva: string;
  totalTtc: string;
  source: string;
};

export type PreviewObservedPricePasteResultRow = {
  index: number;
  workItemCode: string;
  title: string | null;
  found: boolean;
  statutLabel: string;
  pricesTotal: number;
  importablePriceCount: number;
  duplicatePriceCount: number;
  invalidPriceCount: number;
  preview: PricePastePreviewCells;
};

/**
 * Prévisualisation côté serveur : résolution ouvrage par code + comptage doublons (même sourceName, PU HT, qté, total HT).
 */
export async function previewObservedPricesPaste(
  rowsInput: unknown,
): Promise<{ ok: true; rows: PreviewObservedPricePasteResultRow[] } | { ok: false; error: string }> {
  await guard();
  if (!Array.isArray(rowsInput)) {
    return { ok: false, error: "Format invalide : attendu un tableau de lignes prix." };
  }
  if (rowsInput.length === 0) {
    return { ok: false, error: "Aucune ligne à prévisualiser." };
  }
  if (rowsInput.length > BULK_IMPORT_MAX) {
    return { ok: false, error: `Maximum ${BULK_IMPORT_MAX} lignes par import.` };
  }

  const rows: PreviewObservedPricePasteInputRow[] = [];
  for (let i = 0; i < rowsInput.length; i++) {
    const raw = rowsInput[i];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return { ok: false, error: `Ligne ${i + 1} : format invalide.` };
    }
    const o = raw as Record<string, unknown>;
    const idx = typeof o.index === "number" && Number.isInteger(o.index) ? o.index : i;
    const code = String(o.workItemCode ?? "").trim();
    const pe = extractOrCoalescePriceEntriesFromPasteObject(o);
    rows.push({ index: idx, workItemCode: code, priceEntries: pe });
  }

  const codes = [...new Set(rows.map((r) => r.workItemCode.trim()).filter(Boolean))];
  const workItems =
    codes.length === 0
      ? []
      : await prisma.workItem.findMany({
          where: { code: { in: codes } },
          select: { id: true, code: true, title: true },
        });
  const byCode = new Map(workItems.map((w) => [w.code, w]));
  const ids = workItems.map((w) => w.id);
  const existingPrices =
    ids.length === 0
      ? []
      : await prisma.priceEntry.findMany({
          where: { workItemId: { in: ids } },
          select: {
            workItemId: true,
            sourceName: true,
            unitPriceHT: true,
            quantity: true,
            totalHT: true,
          },
        });
  const pricesByWorkItem = new Map<string, typeof existingPrices>();
  for (const p of existingPrices) {
    const arr = pricesByWorkItem.get(p.workItemId) ?? [];
    arr.push(p);
    pricesByWorkItem.set(p.workItemId, arr);
  }

  const out: PreviewObservedPricePasteResultRow[] = rows.map((r) => {
    const code = r.workItemCode.trim();
    const wi = code ? byCode.get(code) : undefined;
    const found = Boolean(wi);
    const pricesTotal = r.priceEntries.length;
    let importablePriceCount = 0;
    let duplicatePriceCount = 0;
    let invalidPriceCount = 0;

    const preview = buildFirstPriceEntryPreviewCells({ priceEntries: r.priceEntries });

    if (!code || !wi) {
      invalidPriceCount = pricesTotal;
      return {
        index: r.index,
        workItemCode: code || "—",
        title: null,
        found: false,
        statutLabel: "code ouvrage introuvable",
        pricesTotal,
        importablePriceCount: 0,
        duplicatePriceCount: 0,
        invalidPriceCount,
        preview,
      };
    }

    const existingList = pricesByWorkItem.get(wi.id) ?? [];
    const invalidReasons: string[] = [];

    for (const rawPe of r.priceEntries) {
      const built = buildPriceEntryCreateFromPaste(wi.id, rawPe);
      if (!built.ok) {
        invalidPriceCount += 1;
        invalidReasons.push(mapPriceEntryPasteBuildError(built.error, built.code));
        continue;
      }
      const key = duplicateKeyFromPricePasteRaw(rawPe);
      if (!key) {
        invalidPriceCount += 1;
        invalidReasons.push("prix manquant");
        continue;
      }
      const dup = existingList.some((row) => priceDuplicateKeyMatchesRow(key, row));
      if (dup) duplicatePriceCount += 1;
      else importablePriceCount += 1;
    }

    let statutLabel = "OK";
    if (pricesTotal === 0) {
      statutLabel = "—";
    } else if (importablePriceCount === 0 && duplicatePriceCount > 0 && invalidPriceCount === 0) {
      statutLabel =
        duplicatePriceCount > 1
          ? `${duplicatePriceCount}× doublon déjà existant`
          : "doublon déjà existant";
    } else if (importablePriceCount === 0 && duplicatePriceCount > 0 && invalidPriceCount > 0) {
      statutLabel = `${summarizePricePasteInvalidReasons(invalidReasons)} ; ${duplicatePriceCount}× doublon déjà existant`;
    } else if (importablePriceCount === 0 && duplicatePriceCount === 0 && invalidPriceCount > 0) {
      statutLabel = summarizePricePasteInvalidReasons(invalidReasons);
    } else if (duplicatePriceCount > 0 && importablePriceCount > 0) {
      statutLabel = `OK — ${importablePriceCount} importable(s), ${duplicatePriceCount}× doublon déjà existant`;
    } else if (invalidPriceCount > 0 && importablePriceCount > 0 && duplicatePriceCount === 0) {
      statutLabel = `OK — ${importablePriceCount} importable(s) ; ${summarizePricePasteInvalidReasons(invalidReasons)}`;
    } else if (invalidPriceCount > 0 && importablePriceCount > 0 && duplicatePriceCount > 0) {
      statutLabel = `OK — ${importablePriceCount} importable(s), ${duplicatePriceCount}× doublon ; ${summarizePricePasteInvalidReasons(invalidReasons)}`;
    }

    return {
      index: r.index,
      workItemCode: code,
      title: wi.title,
      found: true,
      statutLabel,
      pricesTotal,
      importablePriceCount,
      duplicatePriceCount,
      invalidPriceCount,
      preview,
    };
  });

  return { ok: true, rows: out };
}

export type ObservedPricesImportRow = {
  workItemCode: string;
  priceEntries: Record<string, unknown>[];
};

/**
 * Crée des `PriceEntry` sur des ouvrages existants (collage `workItemCode` + `priceEntries`).
 * Ne modifie pas les fiches ouvrage. Ignore doublons (même sourceName, PU HT, qté, total HT) et ouvrages inconnus.
 */
export async function importObservedPricesForWorkItems(rowsInput: unknown): Promise<
  | { ok: true; added: number; ignored: number; errors: string[] }
  | { ok: false; error: string }
> {
  await guard();
  if (!Array.isArray(rowsInput)) {
    return { ok: false, error: "Format invalide : attendu un tableau de lignes prix." };
  }
  if (rowsInput.length === 0) {
    return { ok: false, error: "Aucune ligne à importer." };
  }
  if (rowsInput.length > BULK_IMPORT_MAX) {
    return { ok: false, error: `Maximum ${BULK_IMPORT_MAX} lignes par import.` };
  }

  const rows: ObservedPricesImportRow[] = [];
  for (let i = 0; i < rowsInput.length; i++) {
    const raw = rowsInput[i];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return { ok: false, error: `Ligne ${i + 1} : format invalide.` };
    }
    const o = raw as Record<string, unknown>;
    const code = String(o.workItemCode ?? "").trim();
    const pe = extractOrCoalescePriceEntriesFromPasteObject(o);
    rows.push({ workItemCode: code, priceEntries: pe });
  }

  const codes = [...new Set(rows.map((r) => r.workItemCode.trim()).filter(Boolean))];
  const workItems = await prisma.workItem.findMany({
    where: { code: { in: codes } },
    select: { id: true, code: true },
  });
  const byCode = new Map(workItems.map((w) => [w.code, w]));
  const ids = workItems.map((w) => w.id);
  const existingPrices =
    ids.length === 0
      ? []
      : await prisma.priceEntry.findMany({
          where: { workItemId: { in: ids } },
          select: {
            workItemId: true,
            sourceName: true,
            unitPriceHT: true,
            quantity: true,
            totalHT: true,
          },
        });
  const pricesByWorkItem = new Map<string, typeof existingPrices>();
  for (const p of existingPrices) {
    const arr = pricesByWorkItem.get(p.workItemId) ?? [];
    arr.push(p);
    pricesByWorkItem.set(p.workItemId, arr);
  }

  const errors: string[] = [];
  let added = 0;
  let ignored = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const code = row.workItemCode.trim();
    if (!code) {
      ignored += row.priceEntries.length;
      errors.push(`Ligne ${i + 1} : workItemCode manquant.`);
      continue;
    }
    const wi = byCode.get(code);
    if (!wi) {
      ignored += row.priceEntries.length;
      errors.push(`Ligne ${i + 1} (${code}) : ouvrage introuvable.`);
      continue;
    }

    const existingList = pricesByWorkItem.get(wi.id) ?? [];

    for (let j = 0; j < row.priceEntries.length; j++) {
      const rawPe = row.priceEntries[j];
      const built = buildPriceEntryCreateFromPaste(wi.id, rawPe);
      if (!built.ok) {
        ignored += 1;
        errors.push(
          `Ligne ${i + 1} (${code}), prix #${j + 1} : ${mapPriceEntryPasteBuildError(built.error, built.code)}.`,
        );
        continue;
      }
      const key = duplicateKeyFromPricePasteRaw(rawPe);
      if (!key) {
        ignored += 1;
        errors.push(`Ligne ${i + 1} (${code}), prix #${j + 1} : prix manquant.`);
        continue;
      }
      const dupDb = existingList.some((er) => priceDuplicateKeyMatchesRow(key, er));
      if (dupDb) {
        ignored += 1;
        continue;
      }
      try {
        await prisma.priceEntry.create({ data: built.data });
        added += 1;
        existingList.push({
          workItemId: wi.id,
          sourceName: key.sourceName,
          unitPriceHT: key.unitPriceHT,
          quantity: key.quantity,
          totalHT: key.totalHT,
        });
      } catch (e) {
        ignored += 1;
        const msg = e instanceof Error ? e.message : "Erreur inconnue.";
        errors.push(`Ligne ${i + 1} (${code}), prix #${j + 1} : ${msg}`);
      }
    }
  }

  revalidatePath("/dashboard/devis/bibliotheque");
  revalidatePath("/dashboard/devis/recherche");
  revalidatePath("/dashboard/devis/prix");
  for (const id of ids) {
    revalidatePath(`/dashboard/devis/bibliotheque/${id}`);
  }

  return { ok: true, added, ignored, errors: errors.slice(0, 40) };
}

function pasteStr(v: string): string | undefined {
  const t = v.trim();
  return t || undefined;
}

function buildWorkItemCreateDataFromPasteValues(
  v: StructuredPasteFormValues,
  pasteObj?: Record<string, unknown>,
) {
  const code = v.code.trim();
  const lot = v.lot.trim() || "Non classé";
  const title = v.title.trim() || "Sans titre";
  let fullDescription = v.fullDescription.trim();
  if (isIncompleteDescriptionText(fullDescription)) {
    if (pasteObj) {
      fullDescription = resolveImportedFullDescription(pasteObj, { titleHint: title });
    } else if (title !== "Sans titre") {
      fullDescription = generateFullDescriptionFromTitle(title, false);
    } else {
      fullDescription = "À compléter.";
    }
  }
  const rawUnit = v.unit.trim();
  const unit = normalizeUnit(rawUnit) ?? "m²";
  let statusRaw = v.status.trim();
  if (!isWorkItemStatus(statusRaw)) statusRaw = "brouillon";
  let qualityRaw = v.qualityLevel.trim();
  if (!isWorkItemQualityLevel(qualityRaw)) qualityRaw = "standard";

  return {
    code,
    lot,
    subLot: pasteStr(v.subLot),
    family: pasteStr(v.family),
    title,
    shortDescription: pasteStr(v.shortDescription),
    fullDescription,
    unit,
    qualityLevel: qualityRaw as WorkItemQualityLevel,
    technicalReference: pasteStr(v.technicalReference),
    includedItems: pasteStr(v.includedItems),
    excludedItems: pasteStr(v.excludedItems),
    vigilancePoints: pasteStr(v.vigilancePoints),
    clientQuestions: pasteStr(v.clientQuestions),
    companyQuestions: pasteStr(v.companyQuestions),
    internalNotes: pasteStr(v.internalNotes),
    status: statusRaw as WorkItemStatus,
    itemType: "ouvrage_technique" as WorkItemItemType,
  };
}

/**
 * Import en masse depuis le collage JSON (sans redirection).
 * Ignore les codes déjà en base et les lignes sans code valide.
 * Crée les `PriceEntry` fournis dans chaque ligne (`priceEntries`).
 */
export async function importWorkItemsBulk(rowsInput: unknown): Promise<
  | {
      ok: true;
      created: number;
      pricesCreated: number;
      skippedDuplicate: number;
      skippedInvalid: number;
      skippedBatchDuplicate: number;
      errors: string[];
    }
  | { ok: false; error: string }
> {
  await guard();
  const bundles = normalizeBulkImportRows(rowsInput);
  if (!bundles) {
    return { ok: false, error: "Format invalide : attendu un tableau d’objets." };
  }
  if (bundles.length === 0) {
    return { ok: false, error: "Aucune ligne à importer." };
  }
  if (bundles.length > BULK_IMPORT_MAX) {
    return { ok: false, error: `Maximum ${BULK_IMPORT_MAX} ouvrages par import.` };
  }

  const errors: string[] = [];
  let created = 0;
  let pricesCreated = 0;
  let skippedDuplicate = 0;
  let skippedInvalid = 0;
  let skippedBatchDuplicate = 0;
  const seenInBatch = new Set<string>();

  for (let i = 0; i < bundles.length; i++) {
    const bundle = bundles[i];
    const { values, priceEntries } = bundle;
    const code = values.code.trim();
    if (!code) {
      skippedInvalid += 1;
      errors.push(`Ligne ${i + 1} : code BeWork manquant.`);
      continue;
    }
    if (seenInBatch.has(code)) {
      skippedBatchDuplicate += 1;
      errors.push(`Ligne ${i + 1} (${code}) : doublon dans le collage (code déjà présent plus haut).`);
      continue;
    }
    seenInBatch.add(code);

    const existing = await prisma.workItem.findUnique({ where: { code } });
    if (existing) {
      skippedDuplicate += 1;
      continue;
    }

    const data = buildWorkItemCreateDataFromPasteValues(values, bundle.pasteSource);
    try {
      const workItem = await prisma.workItem.create({ data });
      created += 1;

      for (let j = 0; j < priceEntries.length; j++) {
        const rawPe = priceEntries[j];
        const built = buildPriceEntryCreateFromPaste(workItem.id, rawPe);
        if (!built.ok) {
          errors.push(`Ligne ${i + 1} (${code}), prix #${j + 1} : ${built.error}`);
          continue;
        }
        await prisma.priceEntry.create({ data: built.data });
        pricesCreated += 1;
      }
    } catch (e) {
      skippedInvalid += 1;
      const msg = e instanceof Error ? e.message : "Erreur inconnue.";
      errors.push(`Ligne ${i + 1} (${code}) : ${msg}`);
    }
  }

  revalidatePath("/dashboard/devis/bibliotheque");
  revalidatePath("/dashboard/devis/recherche");
  revalidatePath("/dashboard/devis/prix");
  return {
    ok: true,
    created,
    pricesCreated,
    skippedDuplicate,
    skippedInvalid,
    skippedBatchDuplicate,
    errors: errors.slice(0, 40),
  };
}

export async function updateWorkItem(formData: FormData) {
  await guard();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Identifiant manquant.");

  const code = String(formData.get("code") ?? "").trim();
  const lot = String(formData.get("lot") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const fullDescription = String(formData.get("fullDescription") ?? "").trim();
  const unitRaw = String(formData.get("unit") ?? "").trim();
  const unit = normalizeUnit(unitRaw) ?? unitRaw;
  const statusRaw = String(formData.get("status") ?? "brouillon");
  const qualityRaw = String(formData.get("qualityLevel") ?? "standard");
  const itemTypeRaw = String(formData.get("itemType") ?? "ouvrage_technique");

  if (!code || !lot || !title || !fullDescription || !unitRaw) {
    throw new Error("Champs obligatoires manquants.");
  }
  if (
    !isWorkItemUnit(unit) ||
    !isWorkItemStatus(statusRaw) ||
    !isWorkItemQualityLevel(qualityRaw) ||
    !isWorkItemItemType(itemTypeRaw)
  ) {
    throw new Error("Statut, gamme, unité ou type d’ouvrage invalide.");
  }

  const existing = await prisma.workItem.findUnique({ where: { id } });
  if (!existing) throw new Error("Ouvrage introuvable.");

  await prisma.workItem.update({
    where: { id },
    data: {
      code,
      lot,
      subLot: emptyToNull(formData, "subLot"),
      family: emptyToNull(formData, "family"),
      familyCode: emptyToNull(formData, "familyCode"),
      sourceCode: emptyToNull(formData, "sourceCode"),
      sourceLine: emptyToNull(formData, "sourceLine"),
      title,
      shortDescription: emptyToNull(formData, "shortDescription"),
      fullDescription,
      unit,
      qualityLevel: qualityRaw,
      itemType: itemTypeRaw as WorkItemItemType,
      technicalReference: emptyToNull(formData, "technicalReference"),
      includedItems: emptyToNull(formData, "includedItems"),
      excludedItems: emptyToNull(formData, "excludedItems"),
      vigilancePoints: emptyToNull(formData, "vigilancePoints"),
      clientQuestions: emptyToNull(formData, "clientQuestions"),
      companyQuestions: emptyToNull(formData, "companyQuestions"),
      internalNotes: emptyToNull(formData, "internalNotes"),
      status: statusRaw,
    },
  });

  revalidatePath("/dashboard/devis/bibliotheque");
  revalidatePath("/dashboard/devis/bibliotheque/recodification");
  revalidatePath(`/dashboard/devis/bibliotheque/${id}`);
  redirect(`/dashboard/devis/bibliotheque/${id}`);
}

export async function deleteWorkItem(formData: FormData) {
  await guard();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Identifiant manquant.");
  await prisma.workItem.delete({ where: { id } });
  revalidatePath("/dashboard/devis/bibliotheque");
  redirect("/dashboard/devis/bibliotheque");
}

const BULK_BIB_MAX = 500;

export async function bulkSetWorkItemsStatus(
  ids: string[],
  status: WorkItemStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await guard();
  if (!ids.length) return { ok: false, error: "Aucun ouvrage sélectionné." };
  if (ids.length > BULK_BIB_MAX) return { ok: false, error: `Maximum ${BULK_BIB_MAX} ouvrages par action.` };
  if (!isWorkItemStatus(status)) return { ok: false, error: "Statut invalide." };
  await prisma.workItem.updateMany({
    where: { id: { in: ids } },
    data: { status },
  });
  revalidatePath("/dashboard/devis/bibliotheque");
  revalidatePath("/dashboard/devis/recherche");
  revalidatePath("/dashboard/devis/prix");
  return { ok: true };
}

export async function bulkDeleteWorkItems(ids: string[]): Promise<{ ok: true } | { ok: false; error: string }> {
  await guard();
  if (!ids.length) return { ok: false, error: "Aucun ouvrage sélectionné." };
  if (ids.length > BULK_BIB_MAX) return { ok: false, error: `Maximum ${BULK_BIB_MAX} ouvrages par action.` };
  await prisma.workItem.deleteMany({ where: { id: { in: ids } } });
  revalidatePath("/dashboard/devis/bibliotheque");
  revalidatePath("/dashboard/devis/recherche");
  revalidatePath("/dashboard/devis/prix");
  return { ok: true };
}

export async function createPriceEntry(formData: FormData) {
  await guard();
  const workItemId = String(formData.get("workItemId") ?? "").trim();
  if (!workItemId) throw new Error("Ouvrage manquant.");

  const sourceName = String(formData.get("sourceName") ?? "").trim();
  const sourceTypeRaw = String(formData.get("sourceType") ?? "devis");
  const ht = parseMoney(String(formData.get("unitPriceHT") ?? ""));
  const vatPercent = parseVatPercent(String(formData.get("vatRate") ?? "20"));

  if (!sourceName || !ht || !isBeWorkPriceDocSourceType(sourceTypeRaw)) {
    throw new Error("Source ou prix HT invalide.");
  }

  const ttc = htToTtc(ht, vatPercent);

  const reliabilityRaw = Number(String(formData.get("reliabilityScore") ?? "3"));
  const reliabilityScore =
    Number.isInteger(reliabilityRaw) && reliabilityRaw >= 1 && reliabilityRaw <= 5 ? reliabilityRaw : 3;

  const priceSourceId = emptyToNull(formData, "priceSourceId");

  const qtyRaw = String(formData.get("quantity") ?? "").trim();
  let quantity: Prisma.Decimal | undefined;
  if (qtyRaw) {
    const q = parseMoney(qtyRaw);
    if (!q) throw new Error("Quantité invalide.");
    quantity = q;
  }

  await prisma.priceEntry.create({
    data: {
      workItemId,
      priceSourceId: priceSourceId ?? undefined,
      sourceName,
      sourceType: sourceTypeRaw,
      unitPriceHT: ht,
      vatRate: vatPercent,
      unitPriceTTC: ttc,
      quantity,
      region: emptyToNull(formData, "region"),
      department: emptyToNull(formData, "department"),
      projectType: emptyToNull(formData, "projectType"),
      qualityLevel: emptyToNull(formData, "qualityLevel"),
      dateObserved: parseDate(formData.get("dateObserved")),
      reliabilityScore,
      notes: emptyToNull(formData, "notes"),
    },
  });

  revalidatePath(`/dashboard/devis/bibliotheque/${workItemId}`);
  revalidatePath("/dashboard/devis/prix");
  redirect(`/dashboard/devis/bibliotheque/${workItemId}`);
}

export async function deletePriceEntry(formData: FormData) {
  await guard();
  const id = String(formData.get("id") ?? "").trim();
  const workItemId = String(formData.get("workItemId") ?? "").trim();
  if (!id || !workItemId) throw new Error("Paramètres manquants.");
  await prisma.priceEntry.delete({ where: { id } });
  revalidatePath(`/dashboard/devis/bibliotheque/${workItemId}`);
  revalidatePath("/dashboard/devis/prix");
  redirect(`/dashboard/devis/bibliotheque/${workItemId}`);
}

export async function createPriceSource(formData: FormData) {
  await guard();
  const name = String(formData.get("name") ?? "").trim();
  const sourceTypeRaw = String(formData.get("sourceType") ?? "devis");
  if (!name || !isBeWorkPriceDocSourceType(sourceTypeRaw)) {
    throw new Error("Nom ou type de source invalide.");
  }

  await prisma.priceSource.create({
    data: {
      name,
      sourceType: sourceTypeRaw,
      clientName: emptyToNull(formData, "clientName"),
      projectName: emptyToNull(formData, "projectName"),
      projectLocation: emptyToNull(formData, "projectLocation"),
      department: emptyToNull(formData, "department"),
      dateDocument: parseDate(formData.get("dateDocument")),
      notes: emptyToNull(formData, "notes"),
    },
  });

  revalidatePath("/dashboard/devis/sources");
  redirect("/dashboard/devis/sources");
}

export async function deletePriceSource(formData: FormData) {
  await guard();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Identifiant manquant.");
  await prisma.priceSource.delete({ where: { id } });
  revalidatePath("/dashboard/devis/sources");
  revalidatePath("/dashboard/devis/prix");
  redirect("/dashboard/devis/sources");
}

function emptyToNull(formData: FormData, key: string): string | undefined {
  const v = String(formData.get(key) ?? "").trim();
  return v || undefined;
}

function parseDate(v: FormDataEntryValue | null): Date | undefined {
  if (!v || typeof v !== "string") return undefined;
  const s = v.trim();
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}
