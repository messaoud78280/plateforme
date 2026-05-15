"use server";

import { Prisma, type WorkItemQualityLevel, type WorkItemStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  isBeWorkPriceDocSourceType,
  isWorkItemQualityLevel,
  isWorkItemStatus,
  WORK_ITEM_UNITS,
} from "@/lib/be-work-devis-labels";
import {
  mapObjectToStructuredPasteFormValues,
  type StructuredPasteFormValues,
} from "@/lib/be-work-devis-structured-paste";
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
  const unit = String(formData.get("unit") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "brouillon");
  const qualityRaw = String(formData.get("qualityLevel") ?? "standard");

  if (!code || !lot || !title || !fullDescription || !unit) {
    throw new Error("Champs obligatoires manquants.");
  }
  if (!isWorkItemStatus(statusRaw) || !isWorkItemQualityLevel(qualityRaw)) {
    throw new Error("Statut ou gamme invalide.");
  }

  await prisma.workItem.create({
    data: {
      code,
      lot,
      subLot: emptyToNull(formData, "subLot"),
      family: emptyToNull(formData, "family"),
      title,
      shortDescription: emptyToNull(formData, "shortDescription"),
      fullDescription,
      unit,
      qualityLevel: qualityRaw,
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
  redirect("/dashboard/devis/bibliotheque");
}

const BULK_IMPORT_MAX = 500;

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

function pasteStr(v: string): string | undefined {
  const t = v.trim();
  return t || undefined;
}

function buildWorkItemCreateDataFromPasteValues(v: StructuredPasteFormValues) {
  const code = v.code.trim();
  const lot = v.lot.trim() || "Non classé";
  const title = v.title.trim() || "Sans titre";
  const fullDescription = v.fullDescription.trim() || "À compléter.";
  let unit = v.unit.trim();
  if (!(WORK_ITEM_UNITS as readonly string[]).includes(unit)) {
    unit = "m²";
  }
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
  };
}

/**
 * Import en masse depuis le collage JSON (sans redirection).
 * Ignore les codes déjà en base et les lignes sans code valide.
 */
export async function importWorkItemsBulk(rowsInput: unknown): Promise<
  | {
      ok: true;
      created: number;
      skippedDuplicate: number;
      skippedInvalid: number;
      skippedBatchDuplicate: number;
      errors: string[];
    }
  | { ok: false; error: string }
> {
  await guard();
  if (!Array.isArray(rowsInput)) {
    return { ok: false, error: "Format invalide : attendu un tableau d’objets." };
  }
  if (rowsInput.length === 0) {
    return { ok: false, error: "Aucune ligne à importer." };
  }
  if (rowsInput.length > BULK_IMPORT_MAX) {
    return { ok: false, error: `Maximum ${BULK_IMPORT_MAX} ouvrages par import.` };
  }

  const errors: string[] = [];
  let created = 0;
  let skippedDuplicate = 0;
  let skippedInvalid = 0;
  let skippedBatchDuplicate = 0;
  const seenInBatch = new Set<string>();

  for (let i = 0; i < rowsInput.length; i++) {
    const raw = rowsInput[i];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      skippedInvalid += 1;
      errors.push(`Ligne ${i + 1} : objet attendu.`);
      continue;
    }
    const { values } = mapObjectToStructuredPasteFormValues(raw as Record<string, unknown>);
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

    const data = buildWorkItemCreateDataFromPasteValues(values);
    try {
      await prisma.workItem.create({ data });
      created += 1;
    } catch (e) {
      skippedInvalid += 1;
      const msg = e instanceof Error ? e.message : "Erreur inconnue.";
      errors.push(`Ligne ${i + 1} (${code}) : ${msg}`);
    }
  }

  revalidatePath("/dashboard/devis/bibliotheque");
  revalidatePath("/dashboard/devis/recherche");
  return {
    ok: true,
    created,
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
  const unit = String(formData.get("unit") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "brouillon");
  const qualityRaw = String(formData.get("qualityLevel") ?? "standard");

  if (!code || !lot || !title || !fullDescription || !unit) {
    throw new Error("Champs obligatoires manquants.");
  }
  if (!isWorkItemStatus(statusRaw) || !isWorkItemQualityLevel(qualityRaw)) {
    throw new Error("Statut ou gamme invalide.");
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
      title,
      shortDescription: emptyToNull(formData, "shortDescription"),
      fullDescription,
      unit,
      qualityLevel: qualityRaw,
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
