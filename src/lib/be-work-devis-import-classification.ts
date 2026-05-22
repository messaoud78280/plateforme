/**
 * Classification ouvrage à l’import / fusion doublons : détection des valeurs génériques
 * et application des métadonnées JSON (code_categorie, categorie, unite…).
 */

import type { WorkItem } from "@prisma/client";
import {
  DEFAULT_BEWORK_FAMILY_CODE,
  getBeWorkFamilyLabel,
  normalizeBeWorkMatchString,
  resolveFamilyCodeFromCodeCategorie,
} from "@/lib/bework-devis-family-codes";
import { normalizeWorkItemLotFields } from "@/lib/bework-devis-lot-normalize";
import {
  getFicheMereRecord,
  getVariantesArray,
} from "@/lib/be-work-devis-chatgpt-paste";
import { parsePriceEntryImportMeta } from "@/lib/be-work-devis-price-entry-import-meta";
import type { StructuredPasteFormValues } from "@/lib/be-work-devis-structured-paste";
import { normalizeUnit } from "@/lib/be-work-devis-units";

const CODE_CATEGORIE_KEYS = ["code_categorie", "codeCategorie", "code_category", "categorie_metier"] as const;
const CATEGORIE_LABEL_KEYS = ["categorie", "category"] as const;
const SOUS_CATEGORIE_KEYS = ["sous_categorie", "sousCategorie", "sous_categorie_metier", "sub_categorie"] as const;

export type WorkItemClassificationSnapshot = {
  lot: string;
  subLot: string | null;
  family: string | null;
  familyCode: string;
  unit: string;
};

function coerceLeaf(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return null;
}

function pickString(obj: Record<string, unknown> | undefined, keys: readonly string[]): string | null {
  if (!obj) return null;
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      const leaf = coerceLeaf(obj[k]);
      if (leaf?.trim()) return leaf.trim();
    }
  }
  const byLower = new Map<string, string>();
  for (const key of Object.keys(obj)) {
    byLower.set(key.toLowerCase(), key);
  }
  for (const k of keys) {
    const actual = byLower.get(k.toLowerCase());
    if (!actual) continue;
    const leaf = coerceLeaf(obj[actual]);
    if (leaf?.trim()) return leaf.trim();
  }
  return null;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** Unité depuis fiche_mere ou première variante du collage. */
export function extractUnitFromPasteObject(pasteObj?: Record<string, unknown>): string | null {
  if (!pasteObj) return null;
  const fiche = getFicheMereRecord(pasteObj);
  const fromFiche = pickString(fiche ?? undefined, ["unite", "unit", "unite_principale", "unitePrincipale"]);
  if (fromFiche) return fromFiche;
  const fromRoot = pickString(pasteObj, ["unite", "unit", "unite_principale", "unitePrincipale"]);
  if (fromRoot) return fromRoot;
  for (const v of getVariantesArray(pasteObj)) {
    if (!isRecord(v)) continue;
    const u = pickString(v, ["unite", "unit", "unite_principale"]);
    if (u) return u;
  }
  return null;
}

export function isGenericFamilyCode(code: string | null | undefined): boolean {
  const u = code?.trim().toUpperCase();
  return !u || u === DEFAULT_BEWORK_FAMILY_CODE;
}

export function isGenericLot(lot: string): boolean {
  const n = normalizeBeWorkMatchString(lot);
  if (!n) return true;
  return (n.includes("divers") && n.includes("classer")) || n === "non classe";
}

export function isGenericFamilyField(family: string | null | undefined): boolean {
  if (!family?.trim()) return true;
  const n = normalizeBeWorkMatchString(family);
  return n === "non classe" || n === "non classé";
}

/** Unité par défaut à l’import (U → unité) considérée comme générique si rien de plus précis. */
export function isGenericUnit(unit: string): boolean {
  if (!unit.trim()) return true;
  const canon = normalizeUnit(unit);
  return canon === "unité";
}

export function workItemHasGenericClassification(
  item: Pick<WorkItem, "familyCode" | "lot" | "family" | "unit">,
): boolean {
  return (
    isGenericFamilyCode(item.familyCode) ||
    isGenericLot(item.lot) ||
    isGenericFamilyField(item.family) ||
    isGenericUnit(item.unit)
  );
}

/**
 * Déduit lot / familyCode / famille / unité depuis le collage (aligné import création).
 */
export function resolveClassificationFromPaste(
  values: StructuredPasteFormValues,
  pasteObj?: Record<string, unknown>,
): WorkItemClassificationSnapshot {
  const codeCategorie =
    pickString(pasteObj, CODE_CATEGORIE_KEYS) ??
    (pasteObj && getFicheMereRecord(pasteObj)
      ? pickString(getFicheMereRecord(pasteObj)!, CODE_CATEGORIE_KEYS)
      : null);

  const categorieLabel = pickString(pasteObj, CATEGORIE_LABEL_KEYS);
  const sousCategorie = pickString(pasteObj, SOUS_CATEGORIE_KEYS);

  const familyHint =
    (typeof pasteObj?.familyCode === "string" ? pasteObj.familyCode : null) ??
    codeCategorie ??
    categorieLabel ??
    (values.lot.trim() || values.family.trim() || null);

  const hintedFamilyCode = resolveFamilyCodeFromCodeCategorie(familyHint);

  const lotInput =
    categorieLabel ??
    (values.lot.trim() ||
      (codeCategorie ? codeCategorie.replace(/_/g, " ") : "") ||
      "Non classé");

  const familyInput = sousCategorie ?? categorieLabel ?? (values.family.trim() || undefined);

  const { lot, subLot, familyCode } = normalizeWorkItemLotFields({
    lot: lotInput,
    subLot: values.subLot.trim() || sousCategorie || undefined,
    family: familyInput,
    familyCode: hintedFamilyCode ?? undefined,
    title: values.title.trim() || undefined,
    fullDescription: values.fullDescription.trim() || undefined,
    itemType: "ouvrage_technique",
  });

  const rawUnit = values.unit.trim() || extractUnitFromPasteObject(pasteObj) || "";
  const unit = normalizeUnit(rawUnit) ?? (rawUnit.trim() ? rawUnit.trim() : "m²");

  const family =
    sousCategorie ??
    categorieLabel ??
    (values.family.trim() || null) ??
    getBeWorkFamilyLabel(familyCode) ??
    null;

  return { lot, subLot, familyCode, family, unit };
}

export type MergeClassificationPatch = {
  lot?: string;
  subLot?: string | null;
  family?: string | null;
  familyCode?: string;
  unit?: string;
};

/**
 * Patch Prisma à appliquer sur une fiche existante si elle est encore générique
 * et que l’import apporte une classification plus précise.
 */
export function buildMergeClassificationPatch(
  existing: Pick<WorkItem, "familyCode" | "lot" | "family" | "unit" | "subLot">,
  imported: WorkItemClassificationSnapshot,
): MergeClassificationPatch | null {
  if (!workItemHasGenericClassification(existing)) {
    return null;
  }

  const patch: MergeClassificationPatch = {};

  if (isGenericFamilyCode(existing.familyCode) && !isGenericFamilyCode(imported.familyCode)) {
    patch.familyCode = imported.familyCode;
  }
  if (isGenericLot(existing.lot) && !isGenericLot(imported.lot)) {
    patch.lot = imported.lot;
  }
  if (isGenericFamilyField(existing.family) && imported.family && !isGenericFamilyField(imported.family)) {
    patch.family = imported.family;
  }
  if (isGenericUnit(existing.unit) && !isGenericUnit(imported.unit)) {
    patch.unit = imported.unit;
  }
  if (
    (!existing.subLot?.trim() || isGenericFamilyField(existing.subLot)) &&
    imported.subLot?.trim() &&
    !isGenericFamilyField(imported.subLot)
  ) {
    patch.subLot = imported.subLot;
  }

  return Object.keys(patch).length > 0 ? patch : null;
}

/** Infère une classification depuis les PriceEntry.importMeta (réparation rétroactive). */
export function inferClassificationFromPriceImportMeta(
  entries: { importMeta: unknown }[],
): WorkItemClassificationSnapshot | null {
  let categorieLabel: string | null = null;
  let sousFamille: string | null = null;
  let unite: string | null = null;

  for (const row of entries) {
    const meta = parsePriceEntryImportMeta(row.importMeta);
    if (!meta) continue;
    if (meta.famille?.trim() && !categorieLabel) categorieLabel = meta.famille.trim();
    if (meta.sousFamille?.trim()) sousFamille = meta.sousFamille.trim();
    if (meta.unite?.trim()) unite = meta.unite.trim();
  }

  if (!categorieLabel && !sousFamille && !unite) return null;

  const familyCode =
    resolveFamilyCodeFromCodeCategorie(categorieLabel ?? sousFamille) ?? DEFAULT_BEWORK_FAMILY_CODE;
  if (isGenericFamilyCode(familyCode) && !categorieLabel) return null;

  const { lot, subLot } = normalizeWorkItemLotFields({
    lot: categorieLabel ?? getBeWorkFamilyLabel(familyCode) ?? "Non classé",
    subLot: sousFamille ?? undefined,
    family: sousFamille ?? categorieLabel ?? undefined,
    familyCode,
    itemType: "ouvrage_technique",
  });

  const unit = unite ? (normalizeUnit(unite) ?? unite) : "unité";

  return {
    lot,
    subLot,
    familyCode,
    family: sousFamille ?? categorieLabel ?? getBeWorkFamilyLabel(familyCode),
    unit,
  };
}
