"use server";

import { revalidatePath } from "next/cache";
import { canManageBeWorkDico, requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { isBtpDicoCategory, normalizeCategory, normalizeLevel } from "@/lib/btp-dico/labels";
import {
  buildBtpDicoPreview,
  btpDicoTermToJson,
  dedupeKey,
  type BtpDicoDuplicateMode,
  type BtpDicoPreviewResult,
} from "@/lib/btp-dico/json-io";
import { lotNameFromCode, normalizeLotCode } from "@/lib/btp-dico/lots";
import { prisma } from "@/lib/prisma";
import { DOCUMENTS_BUCKET, extractStoragePathFromUrl } from "@/lib/storage/supabase-object";
import { createServiceRoleClient } from "@/lib/supabase";

const LIST_PATH = "/dashboard/devis/dico-btp";

function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function strList(form: FormData, key: string): string[] {
  const v = form.get(key);
  if (typeof v !== "string") return [];
  return v
    .split(/[\n;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseTermFromForm(form: FormData) {
  const term = str(form, "term");
  const shortDefinition = str(form, "shortDefinition");
  if (!term) throw new Error("Le terme est obligatoire.");
  if (!shortDefinition) throw new Error("La définition courte est obligatoire.");

  const lotCode = normalizeLotCode(str(form, "lotCode"));
  const categoryRaw = str(form, "category");

  return {
    term,
    acronym: str(form, "acronym") || null,
    lotCode,
    lotName: lotCode ? lotNameFromCode(lotCode) : null,
    family: str(form, "family") || null,
    category: categoryRaw ? (isBtpDicoCategory(categoryRaw) ? categoryRaw : normalizeCategory(categoryRaw)) : null,
    shortDefinition,
    beginnerExplanation: str(form, "beginnerExplanation") || null,
    usageExample: str(form, "usageExample") || null,
    keywords: strList(form, "keywords"),
    synonyms: strList(form, "synonyms"),
    vigilancePoints: strList(form, "vigilancePoints"),
    linkedDocuments: strList(form, "linkedDocuments"),
    level: normalizeLevel(str(form, "level")),
    source: str(form, "source") || null,
    status: str(form, "status") || "à vérifier",
  };
}

export async function createBtpDicoTerm(form: FormData): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const session = await requireBeWorkDevisSession();
  try {
    const data = parseTermFromForm(form);
    const created = await prisma.btpDictionaryTerm.create({
      data: { ...data, createdByUserId: session.user.id },
      select: { id: true },
    });
    revalidatePath(LIST_PATH);
    return { ok: true, id: created.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Création impossible." };
  }
}

export async function updateBtpDicoTerm(
  id: string,
  form: FormData,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  await requireBeWorkDevisSession();
  try {
    const data = parseTermFromForm(form);
    await prisma.btpDictionaryTerm.update({ where: { id }, data });
    revalidatePath(LIST_PATH);
    revalidatePath(`${LIST_PATH}/${id}`);
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Mise à jour impossible." };
  }
}

export async function deleteBtpDicoTerm(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireBeWorkDevisSession();
  try {
    await prisma.btpDictionaryTerm.delete({ where: { id } });
    revalidatePath(LIST_PATH);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Suppression impossible." };
  }
}

/** Enregistre / met à jour la note personnelle d'un terme (édition inline sur la fiche). */
export async function updateBtpDicoNote(
  id: string,
  note: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireBeWorkDevisSession();
  if (!canManageBeWorkDico(session.user.role)) {
    return { ok: false, error: "Réservé aux gérants." };
  }
  try {
    const trimmed = note.trim();
    await prisma.btpDictionaryTerm.update({
      where: { id },
      data: { personalNote: trimmed || null },
    });
    revalidatePath(`${LIST_PATH}/${id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Enregistrement impossible." };
  }
}

/** Retire l'image illustrative d'un terme (base + objet Storage best-effort). */
export async function removeBtpDicoImage(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireBeWorkDevisSession();
  if (!canManageBeWorkDico(session.user.role)) {
    return { ok: false, error: "Réservé aux gérants." };
  }
  try {
    const term = await prisma.btpDictionaryTerm.findUnique({ where: { id }, select: { imageUrl: true } });
    if (!term) return { ok: false, error: "Terme introuvable." };

    await prisma.btpDictionaryTerm.update({ where: { id }, data: { imageUrl: null } });

    if (term.imageUrl) {
      const supabase = createServiceRoleClient();
      const path = extractStoragePathFromUrl(term.imageUrl, DOCUMENTS_BUCKET);
      if (supabase && path) {
        await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
      }
    }

    revalidatePath(`${LIST_PATH}/${id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Suppression de l'image impossible." };
  }
}

async function existingKeySet(): Promise<Set<string>> {
  const rows = await prisma.btpDictionaryTerm.findMany({ select: { term: true, lotCode: true } });
  return new Set(rows.map((r) => dedupeKey(r.term, r.lotCode)));
}

export async function previewBtpDicoImport(
  rawText: string,
): Promise<{ ok: true; preview: BtpDicoPreviewResult } | { ok: false; error: string }> {
  await requireBeWorkDevisSession();
  try {
    const keys = await existingKeySet();
    return { ok: true, preview: buildBtpDicoPreview(rawText, keys) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Analyse impossible." };
  }
}

export async function importBtpDicoJson(
  rawText: string,
  duplicateMode: BtpDicoDuplicateMode,
): Promise<{ ok: true; imported: number; skipped: number; replaced: number } | { ok: false; error: string }> {
  const session = await requireBeWorkDevisSession();
  // Notes personnelles et images = enrichissements réservés aux gérants :
  // un import par un autre rôle ne doit ni les créer ni écraser celles existantes.
  const isManager = canManageBeWorkDico(session.user.role);
  try {
    const keys = await existingKeySet();
    const preview = buildBtpDicoPreview(rawText, keys);
    if (!preview.canImport) {
      return { ok: false, error: "Import bloqué : corrigez les entrées invalides ou en doublon dans le fichier." };
    }

    let imported = 0;
    let skipped = 0;
    let replaced = 0;

    for (const row of preview.rows) {
      if (!row.parsed) continue;
      if (row.existsInDb) {
        if (duplicateMode === "ignore") {
          skipped += 1;
          continue;
        }
        // replace : mettre à jour le terme existant (terme + lot)
        const existing = await prisma.btpDictionaryTerm.findFirst({
          where: { term: row.parsed.term, lotCode: row.parsed.lotCode },
          select: { id: true },
        });
        if (existing) {
          const { personalNote, imageUrl, ...rest } = row.parsed;
          const updateData = isManager ? { ...rest, personalNote, imageUrl } : rest;
          await prisma.btpDictionaryTerm.update({ where: { id: existing.id }, data: updateData });
          replaced += 1;
          continue;
        }
      }
      const { personalNote, imageUrl, ...rest } = row.parsed;
      const createData = isManager
        ? { ...rest, personalNote, imageUrl }
        : { ...rest, personalNote: null, imageUrl: null };
      await prisma.btpDictionaryTerm.create({
        data: { ...createData, createdByUserId: session.user.id },
      });
      imported += 1;
    }

    revalidatePath(LIST_PATH);
    return { ok: true, imported, skipped, replaced };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Import impossible." };
  }
}

export async function exportBtpDicoJson(
  lotCode?: string,
): Promise<{ ok: true; json: string; count: number } | { ok: false; error: string }> {
  await requireBeWorkDevisSession();
  try {
    const where = lotCode ? { lotCode: normalizeLotCode(lotCode) ?? lotCode } : {};
    const rows = await prisma.btpDictionaryTerm.findMany({
      where,
      orderBy: [{ lotCode: "asc" }, { term: "asc" }],
    });
    const json = JSON.stringify(rows.map(btpDicoTermToJson), null, 2);
    return { ok: true, json, count: rows.length };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Export impossible." };
  }
}
