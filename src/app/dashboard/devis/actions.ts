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
import { normalizeText } from "@/lib/be-work-devis-chatgpt-paste";
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
import {
  normalizeWorkItemLotFields,
  workItemLotNeedsNormalization,
} from "@/lib/bework-devis-lot-normalize";
import {
  buildMergeClassificationPatch,
  resolveClassificationFromPaste,
} from "@/lib/be-work-devis-import-classification";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import type { CodificationMappingRule } from "@/lib/bework-work-item-codification/classify";
import {
  resolveArtiprixImportRow,
  type ResolvedArtiprixImport,
} from "@/lib/bework-artiprix-import";
import { prisma } from "@/lib/prisma";
import { resolveActiveWorkItemCatalogId } from "@/lib/work-item-catalog";
import {
  checkCatalogAllowsBulkWrite,
  requireCatalogAllowsBulkWrite,
} from "@/lib/work-item-catalog-policy";

function applyNormalizedLotFields(formData: FormData) {
  const normalized = normalizeWorkItemLotFields({
    lot: String(formData.get("lot") ?? "").trim(),
    subLot: emptyToNull(formData, "subLot"),
    family: emptyToNull(formData, "family"),
    familyCode: emptyToNull(formData, "familyCode"),
    title: String(formData.get("title") ?? "").trim() || null,
    itemType: String(formData.get("itemType") ?? "").trim() || null,
  });
  return normalized;
}

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
  const { lot, subLot, familyCode } = applyNormalizedLotFields(formData);
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

  await requireCatalogAllowsBulkWrite();

  const catalogId = await resolveActiveWorkItemCatalogId();

  await prisma.workItem.create({
    data: {
      catalogId,
      code,
      lot,
      subLot,
      family: emptyToNull(formData, "family"),
      familyCode,
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
      const pasteSource =
        typeof o.pasteSource === "object" && o.pasteSource !== null && !Array.isArray(o.pasteSource)
          ? (o.pasteSource as Record<string, unknown>)
          : undefined;
      return { values, priceEntries: pe, pasteSource };
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
export async function checkWorkItemCodesExist(
  codesInput: string[],
  catalogIdInput?: string,
): Promise<string[]> {
  await guard();
  const catalogId = await resolveActiveWorkItemCatalogId(catalogIdInput);
  const codes = [...new Set(codesInput.map((c) => c.trim()).filter(Boolean))].slice(0, 2000);
  if (codes.length === 0) return [];
  const found = await prisma.workItem.findMany({
    where: { catalogId, code: { in: codes } },
    select: { code: true },
  });
  return found.map((r) => r.code);
}

export type SimilarWorkItemMatch = {
  inputTitle: string;
  existingCode: string;
  existingTitle: string;
};

/** Fiches mères probablement déjà en bibliothèque (désignation normalisée + lot). */
export async function checkWorkItemsSimilarTitles(
  inputs: { title: string; lot?: string }[],
): Promise<SimilarWorkItemMatch[]> {
  await guard();
  const rows = inputs
    .map((i) => ({ title: i.title.trim(), lot: i.lot?.trim() ?? "" }))
    .filter((i) => i.title.length > 0)
    .slice(0, 200);
  if (rows.length === 0) return [];

  const catalogId = await resolveActiveWorkItemCatalogId();
  const candidates = await prisma.workItem.findMany({
    where: { catalogId, mergeStatus: { not: "merged" } },
    select: { code: true, title: true, lot: true },
    take: 5000,
  });

  const matches: SimilarWorkItemMatch[] = [];
  for (const input of rows) {
    const nTitle = normalizeText(input.title);
    const nLot = input.lot ? normalizeText(input.lot) : "";
    const hit = candidates.find((c) => {
      if (normalizeText(c.title) !== nTitle) return false;
      if (nLot && c.lot && normalizeText(c.lot) !== nLot) return false;
      return true;
    });
    if (hit) {
      matches.push({
        inputTitle: input.title,
        existingCode: hit.code,
        existingTitle: hit.title,
      });
    }
  }
  return matches;
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

  const catalogId = await resolveActiveWorkItemCatalogId();
  const codes = [...new Set(rows.map((r) => r.workItemCode.trim()).filter(Boolean))];
  const workItems =
    codes.length === 0
      ? []
      : await prisma.workItem.findMany({
          where: { catalogId, code: { in: codes } },
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
  const catalogId = await resolveActiveWorkItemCatalogId();
  const workItems = await prisma.workItem.findMany({
    where: { catalogId, code: { in: codes } },
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

async function loadCodificationMappingRules(): Promise<CodificationMappingRule[]> {
  try {
    const rows = await prisma.workItemCodificationMapping.findMany({
      where: { active: true },
      orderBy: [{ priority: "desc" }, { sourcePattern: "asc" }],
    });
    return rows.map((r) => ({
      sourcePattern: r.sourcePattern,
      matchType: r.matchType,
      lotCode: r.lotCode,
      familleCode: r.familleCode,
      ouvrageCode: r.ouvrageCode,
      sousFamilleCode: r.sousFamilleCode,
      sousFamilleNom: r.sousFamilleNom,
      priority: r.priority,
    }));
  } catch {
    return [];
  }
}

function mergeResolvedImportIntoCreateData(
  base: ReturnType<typeof buildWorkItemCreateDataFromPasteValues>,
  resolved: ResolvedArtiprixImport,
) {
  return {
    ...base,
    code: resolved.code,
    codeBework: resolved.codeBework,
    sourceCode: resolved.sourceCode,
    importSource: resolved.importSource,
    sourceLine: resolved.sourceLine,
    lotCode: resolved.lotCode,
    familleNom: resolved.familleNom,
    sousFamilleCode: resolved.sousFamilleCode,
    sousFamilleNom: resolved.sousFamilleNom,
    ouvrageCode: resolved.ouvrageCode,
    familyCode: resolved.familyCode ?? base.familyCode,
    normalizedDesignation: resolved.normalizedDesignation,
    designationSource: resolved.designationSource,
    codificationStatus: resolved.codificationStatus,
  };
}

function buildWorkItemCreateDataFromPasteValues(
  catalogId: string,
  v: StructuredPasteFormValues,
  pasteObj?: Record<string, unknown>,
) {
  const code = v.code.trim();
  const title = v.title.trim() || "Sans titre";
  const classification = resolveClassificationFromPaste(v, pasteObj);
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
  let statusRaw = v.status.trim();
  if (!isWorkItemStatus(statusRaw)) statusRaw = "brouillon";
  let qualityRaw = v.qualityLevel.trim();
  if (!isWorkItemQualityLevel(qualityRaw)) qualityRaw = "standard";

  return {
    catalogId,
    code,
    lot: classification.lot,
    subLot: classification.subLot,
    family: classification.family,
    familyCode: classification.familyCode,
    title,
    shortDescription: pasteStr(v.shortDescription),
    fullDescription,
    unit: classification.unit,
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

export type BulkImportPreviewRow = {
  index: number;
  pastedCode: string;
  resolvedCode: string;
  sourceCode: string;
  importSource: string | null;
  duplicateDb: boolean;
  duplicateBatch: boolean;
  error?: string;
};

/** Prévisualise les codes BeWork générés (Artiprix → BW-…) dans le catalogue actif. */
export async function previewBulkImportWorkItems(
  rowsInput: unknown,
): Promise<{ ok: true; rows: BulkImportPreviewRow[] } | { ok: false; error: string }> {
  await guard();
  const catalogId = await resolveActiveWorkItemCatalogId();
  const bundles = normalizeBulkImportRows(rowsInput);
  if (!bundles) return { ok: false, error: "Format invalide." };

  const mappingRules = await loadCodificationMappingRules();
  const existing = await prisma.workItem.findMany({
    where: { catalogId },
    select: { code: true, codeBework: true },
    take: 15000,
  });
  const dbCodeSet = new Set<string>();
  const usedCodes = new Set<string>();
  for (const row of existing) {
    if (row.code) dbCodeSet.add(row.code.trim().toUpperCase());
    if (row.codeBework) dbCodeSet.add(row.codeBework.trim().toUpperCase());
    if (row.code) usedCodes.add(row.code.trim().toUpperCase());
    if (row.codeBework) usedCodes.add(row.codeBework.trim().toUpperCase());
  }

  const seenInBatch = new Set<string>();
  const out: BulkImportPreviewRow[] = [];

  bundles.forEach((bundle, index) => {
    const pastedCode = bundle.values.code.trim();
    if (!pastedCode) {
      out.push({
        index,
        pastedCode: "",
        resolvedCode: "",
        sourceCode: "",
        importSource: null,
        duplicateDb: false,
        duplicateBatch: false,
        error: "Code manquant",
      });
      return;
    }

    const resolved = resolveArtiprixImportRow(
      bundle.values,
      bundle.pasteSource,
      usedCodes,
      mappingRules,
    );
    if ("error" in resolved) {
      out.push({
        index,
        pastedCode,
        resolvedCode: "",
        sourceCode: "",
        importSource: null,
        duplicateDb: false,
        duplicateBatch: false,
        error: resolved.error,
      });
      return;
    }

    const resolvedCode = resolved.code;
    const duplicateBatch = seenInBatch.has(resolvedCode.toUpperCase());
    if (!duplicateBatch) seenInBatch.add(resolvedCode.toUpperCase());

    out.push({
      index,
      pastedCode,
      resolvedCode,
      sourceCode: resolved.sourceCode,
      importSource: resolved.importSource,
      duplicateDb: dbCodeSet.has(resolvedCode.toUpperCase()),
      duplicateBatch,
    });
  });

  return { ok: true, rows: out };
}

/**
 * Import en masse depuis le collage JSON (sans redirection).
 * Ignore les codes déjà en base et les lignes sans code valide.
 * Crée les `PriceEntry` fournis dans chaque ligne (`priceEntries`).
 */
export async function importWorkItemsBulk(
  rowsInput: unknown,
  options?: { mergeDuplicates?: boolean; confirmHistoriqueImport?: boolean },
): Promise<
  | {
      ok: true;
      created: number;
      pricesCreated: number;
      mergedDuplicates: number;
      skippedDuplicate: number;
      skippedInvalid: number;
      skippedBatchDuplicate: number;
      errors: string[];
    }
  | { ok: false; error: string; requiresHistoriqueConfirmation?: boolean }
> {
  await guard();
  const writeCheck = await checkCatalogAllowsBulkWrite(undefined, {
    confirmHistoriqueImport: options?.confirmHistoriqueImport === true,
  });
  if (!writeCheck.ok) {
    return {
      ok: false,
      error: writeCheck.error,
      requiresHistoriqueConfirmation: writeCheck.requiresHistoriqueConfirmation,
    };
  }
  const catalogId = writeCheck.catalog.id;
  const mergeDuplicates = options?.mergeDuplicates === true;
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
  let mergedDuplicates = 0;
  let skippedDuplicate = 0;
  let skippedInvalid = 0;
  let skippedBatchDuplicate = 0;
  const seenInBatch = new Set<string>();
  const mappingRules = await loadCodificationMappingRules();
  const catalogCodes = await prisma.workItem.findMany({
    where: { catalogId },
    select: { code: true, codeBework: true },
    take: 15000,
  });
  const usedCodes = new Set<string>();
  for (const row of catalogCodes) {
    if (row.code) usedCodes.add(row.code.trim().toUpperCase());
    if (row.codeBework) usedCodes.add(row.codeBework.trim().toUpperCase());
  }

  async function attachPriceEntries(
    workItemId: string,
    code: string,
    lineLabel: string,
    priceEntries: Record<string, unknown>[],
  ) {
    for (let j = 0; j < priceEntries.length; j++) {
      const rawPe = priceEntries[j];
      const built = buildPriceEntryCreateFromPaste(workItemId, rawPe);
      if (!built.ok) {
        errors.push(`${lineLabel} (${code}), prix #${j + 1} : ${built.error}`);
        continue;
      }
      await prisma.priceEntry.create({ data: built.data });
      pricesCreated += 1;
    }
  }

  for (let i = 0; i < bundles.length; i++) {
    const bundle = bundles[i];
    const { values, priceEntries } = bundle;
    const pasteSource =
      bundle.pasteSource && typeof bundle.pasteSource === "object" && !Array.isArray(bundle.pasteSource)
        ? (bundle.pasteSource as Record<string, unknown>)
        : undefined;
    const pastedCode = values.code.trim();
    if (!pastedCode) {
      skippedInvalid += 1;
      errors.push(`Ligne ${i + 1} : code manquant.`);
      continue;
    }

    const resolved = resolveArtiprixImportRow(values, pasteSource, usedCodes, mappingRules);
    if ("error" in resolved) {
      skippedInvalid += 1;
      errors.push(`Ligne ${i + 1} (${pastedCode}) : ${resolved.error}`);
      continue;
    }

    const code = resolved.code;
    if (seenInBatch.has(code.toUpperCase())) {
      skippedBatchDuplicate += 1;
      errors.push(
        `Ligne ${i + 1} (${pastedCode} → ${code}) : doublon dans le collage (code déjà présent plus haut).`,
      );
      continue;
    }
    seenInBatch.add(code.toUpperCase());

    const existing = await prisma.workItem.findFirst({
      where: {
        catalogId,
        OR: [{ code }, { codeBework: code }],
      },
      select: {
        id: true,
        code: true,
        lot: true,
        subLot: true,
        family: true,
        familyCode: true,
        unit: true,
      },
    });
    if (existing) {
      if (mergeDuplicates) {
        const importedClassification = resolveClassificationFromPaste(values, pasteSource);
        const metaPatch = buildMergeClassificationPatch(existing, importedClassification);
        let merged = false;
        if (metaPatch) {
          await prisma.workItem.update({
            where: { id: existing.id },
            data: metaPatch,
          });
          merged = true;
        }
        if (priceEntries.length > 0) {
          await attachPriceEntries(existing.id, code, `Ligne ${i + 1}`, priceEntries);
          merged = true;
        }
        if (merged) mergedDuplicates += 1;
        else skippedDuplicate += 1;
      } else {
        skippedDuplicate += 1;
      }
      continue;
    }

    const base = buildWorkItemCreateDataFromPasteValues(catalogId, values, pasteSource);
    const data = mergeResolvedImportIntoCreateData(base, resolved);
    try {
      const workItem = await prisma.workItem.create({ data });
      created += 1;
      await attachPriceEntries(workItem.id, code, `Ligne ${i + 1}`, priceEntries);
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
    mergedDuplicates,
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
  const { lot, subLot, familyCode } = applyNormalizedLotFields(formData);
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
      subLot,
      family: emptyToNull(formData, "family"),
      familyCode,
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
  try {
    await prisma.workItem.delete({ where: { id } });
  } catch (e) {
    console.error("[deleteWorkItem]", id, e);
    redirect("/dashboard/devis/bibliotheque?error=delete_failed");
  }
  revalidatePath("/dashboard/devis/bibliotheque");
  revalidatePath("/dashboard/devis/recherche");
  revalidatePath("/dashboard/devis/prix");
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
  try {
    await prisma.workItem.deleteMany({ where: { id: { in: ids } } });
  } catch (e) {
    console.error("[bulkDeleteWorkItems]", e);
    return {
      ok: false,
      error: "Suppression impossible (liens devis ou trigger base). Réessayez ou contactez le support.",
    };
  }
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

/** Harmonise en masse les lots / sous-lots / familyCode de tous les ouvrages. */
export async function normalizeAllWorkItemLots(): Promise<
  { ok: true; workItemsUpdated: number; quoteLinesUpdated: number; distinctLots: number } | { ok: false; error: string }
> {
  await guard();

  try {
    const items = await prisma.workItem.findMany({
      select: {
        id: true,
        lot: true,
        subLot: true,
        family: true,
        familyCode: true,
        title: true,
        shortDescription: true,
        fullDescription: true,
        itemType: true,
      },
    });

    let workItemsUpdated = 0;
    let quoteLinesUpdated = 0;

    for (const item of items) {
      if (!workItemLotNeedsNormalization(item)) continue;

      const n = normalizeWorkItemLotFields(item);
      await prisma.workItem.update({
        where: { id: item.id },
        data: { lot: n.lot, subLot: n.subLot, familyCode: n.familyCode },
      });
      workItemsUpdated += 1;

      const ql = await prisma.quoteLine.updateMany({
        where: { workItemId: item.id },
        data: { lot: n.lot, family: n.subLot ?? undefined },
      });
      quoteLinesUpdated += ql.count;
    }

    const orphanLines = await prisma.quoteLine.findMany({
      where: { workItemId: null },
      select: { id: true, lot: true, family: true },
    });
    for (const line of orphanLines) {
      const n = normalizeWorkItemLotFields({ lot: line.lot, subLot: line.family });
      if (n.lot === line.lot && (n.subLot ?? null) === (line.family?.trim() || null)) continue;
      await prisma.quoteLine.update({
        where: { id: line.id },
        data: { lot: n.lot, family: n.subLot ?? undefined },
      });
      quoteLinesUpdated += 1;
    }

    const distinctLots = await prisma.workItem.findMany({
      select: { lot: true },
      distinct: ["lot"],
    });

    revalidatePath("/dashboard/devis/bibliotheque");
    revalidatePath("/dashboard/devis/recherche");
    revalidatePath("/dashboard/devis/prix");

    return {
      ok: true,
      workItemsUpdated,
      quoteLinesUpdated,
      distinctLots: distinctLots.length,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Harmonisation impossible.";
    return { ok: false, error: message };
  }
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
