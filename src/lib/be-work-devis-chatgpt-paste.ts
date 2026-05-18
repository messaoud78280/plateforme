/**
 * Import JSON « ChatGPT » : export famille + ouvrages avec fiche_mere + variantes.
 * Une fiche mère → un WorkItem ; chaque variante → PriceEntry(s) rattachée(s).
 */

import type { PriceEntryImportMeta } from "@/lib/be-work-devis-price-entry-import-meta";
import { extractOrCoalescePriceEntriesFromPasteObject } from "@/lib/be-work-devis-price-entry-paste";
import {
  emptyStructuredPasteFormValues,
  extractPasteWorkItemCode,
  mapObjectToStructuredPasteFormValues,
  type StructuredPasteFormValues,
} from "@/lib/be-work-devis-structured-paste";

function coerceLeaf(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return null;
}

function pickPasteString(obj: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      const leaf = coerceLeaf(obj[k]);
      if (leaf !== null && leaf.trim()) return leaf.trim();
    }
  }
  const byLower = new Map<string, string>();
  for (const key of Object.keys(obj)) {
    byLower.set(key.toLowerCase(), key);
  }
  for (const k of keys) {
    const actual = byLower.get(k.toLowerCase());
    if (actual) {
      const leaf = coerceLeaf(obj[actual]);
      if (leaf !== null && leaf.trim()) return leaf.trim();
    }
  }
  return null;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function isArrayOfObjects(v: unknown): v is Record<string, unknown>[] {
  return Array.isArray(v) && v.length > 0 && v.every(isRecord);
}

const FICHE_MERE_KEYS = ["fiche_mere", "ficheMere", "fiche_mère"] as const;
const VARIANTES_KEYS = ["variantes", "variants", "variantes_prix"] as const;
const OUVRAGES_KEYS = ["ouvrages", "workItems", "items"] as const;

export type MotherVariantImportBundle = {
  motherIndex: number;
  values: StructuredPasteFormValues;
  pasteSource: Record<string, unknown>;
  /** Prix observés (une entrée par variante, éventuellement plusieurs si grille de colonnes). */
  priceEntries: Record<string, unknown>[];
  variantCount: number;
  ficheMere: string;
  tags: string[];
  warnings: string[];
};

export type ParsedPasteMotherVariants = {
  mode: "motherVariants";
  pasteTypeLabel: string;
  famille: string | null;
  sousFamille: string | null;
  mothers: MotherVariantImportBundle[];
  totalVariantCount: number;
  allCodes: string[];
};

export function isMotherVariantOuvrageEntry(obj: Record<string, unknown>): boolean {
  const fiche = pickPasteString(obj, FICHE_MERE_KEYS);
  if (!fiche) return false;
  for (const key of VARIANTES_KEYS) {
    const val = obj[key];
    if (Array.isArray(val) && val.length > 0) return true;
  }
  return false;
}

function slugifyWorkItemCode(raw: string, index: number): string {
  const base = raw
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base.length >= 3 ? `BW-${base}` : `BW-IMPORT-${index + 1}`;
}

function collectVariantAttributeNotes(v: Record<string, unknown>): string {
  const skip = new Set([
    "code",
    "code_variante",
    "ref",
    "reference",
    "sourceName",
    "source",
    "unitPriceHT",
    "puHt",
    "prix_reference",
    "prix_reference_ht",
    "quantity",
    "quantite",
    "quantite_reference",
    "vatRate",
    "tva",
    "priceEntries",
  ]);
  const lines: string[] = [];
  for (const [k, val] of Object.entries(v)) {
    if (skip.has(k)) continue;
    const leaf = coerceLeaf(val);
    if (leaf !== null && leaf.trim()) lines.push(`${k}: ${leaf.trim()}`);
  }
  return lines.join("\n");
}

export type VariantPasteContext = {
  famille?: string | null;
  sousFamille?: string | null;
  ficheMere: string;
  unite?: string | null;
  tags?: string[];
};

/** Désignation complète lisible pour la fiche détail / tooltip. */
export function buildVariantDesignation(
  variante: Record<string, unknown>,
  ficheMere: string,
): string {
  const explicit = pickPasteString(variante, [
    "designation",
    "designation_complete",
    "designationComplete",
    "libelle",
    "label",
    "designation_variante",
  ]);
  if (explicit) return explicit;

  const parts: string[] = [ficheMere];
  const largeur = pickPasteString(variante, ["largeur_m", "largeur", "width"]);
  const profondeur = pickPasteString(variante, ["profondeur_m", "profondeur", "depth"]);
  const classe = pickPasteString(variante, ["classe_terre", "classeTerre", "classe"]);
  if (largeur) parts.push(`largeur ${largeur} m`);
  if (profondeur) parts.push(`profondeur ${profondeur} m`);
  if (classe) parts.push(`terre de classe ${classe}`);
  return parts.join(", ");
}

function buildVariantImportMeta(
  variante: Record<string, unknown>,
  ctx: VariantPasteContext,
): PriceEntryImportMeta {
  const tagsRaw = variante.tags ?? variante.etiquettes;
  const variantTags = Array.isArray(tagsRaw)
    ? tagsRaw.map((t) => coerceLeaf(t)).filter((t): t is string => Boolean(t?.trim()))
    : [];

  return {
    codeSource:
      pickPasteString(variante, ["code", "code_variante", "code_source", "ref", "reference"]) ?? undefined,
    famille: ctx.famille?.trim() || pickPasteString(variante, ["famille", "lot"]) || undefined,
    sousFamille: ctx.sousFamille?.trim() || pickPasteString(variante, ["sous_famille", "sousFamille"]) || undefined,
    ficheMere: ctx.ficheMere,
    unite:
      ctx.unite?.trim() ||
      pickPasteString(variante, ["unite", "unite_principale", "unit"]) ||
      undefined,
    largeur_m: pickPasteString(variante, ["largeur_m", "largeur"]) ?? undefined,
    profondeur_m: pickPasteString(variante, ["profondeur_m", "profondeur"]) ?? undefined,
    classe_terre: pickPasteString(variante, ["classe_terre", "classeTerre", "classe"]) ?? undefined,
    quantiteReference:
      pickPasteString(variante, ["quantite_reference", "quantite", "quantity"]) ?? undefined,
    tags: [...(ctx.tags ?? []), ...variantTags].length > 0 ? [...(ctx.tags ?? []), ...variantTags] : undefined,
    commentaire: pickPasteString(variante, ["commentaire", "comment", "notes"]) ?? undefined,
  };
}

function enrichPriceEntryRaw(
  raw: Record<string, unknown>,
  variante: Record<string, unknown>,
  ctx: VariantPasteContext,
  varianteIndex: number,
  subIndex = 0,
): Record<string, unknown> {
  const variantDesignation = buildVariantDesignation(variante, ctx.ficheMere);
  const importMeta = buildVariantImportMeta(variante, ctx);
  const codeSource = importMeta.codeSource ?? `V${varianteIndex + 1}${subIndex > 0 ? `.${subIndex + 1}` : ""}`;
  const shortSource = codeSource;

  return {
    ...raw,
    sourceName: shortSource,
    variantDesignation,
    importMeta,
    sourceType: raw.sourceType ?? pickPasteString(variante, ["sourceType", "typeSource"]) ?? "estimation_interne",
    notes: [coerceLeaf(raw.notes), collectVariantAttributeNotes(variante)].filter(Boolean).join("\n") || undefined,
  };
}

/** Transforme une variante ChatGPT en objet compatible `buildPriceEntryCreateFromPaste`. */
export function mapVarianteToPriceEntryRaw(
  variante: Record<string, unknown>,
  ficheMere: string,
  varianteIndex: number,
  _sourceLabel?: string | null,
  ctx?: Partial<VariantPasteContext>,
): Record<string, unknown>[] {
  const pasteCtx: VariantPasteContext = {
    ficheMere,
    famille: ctx?.famille ?? null,
    sousFamille: ctx?.sousFamille ?? null,
    unite: ctx?.unite ?? null,
    tags: ctx?.tags,
  };

  const nested = extractOrCoalescePriceEntriesFromPasteObject(variante);
  if (nested.length > 0) {
    return nested.map((pe, j) => enrichPriceEntryRaw(pe, variante, pasteCtx, varianteIndex, j));
  }

  const prixRef =
    variante.prix_reference ??
    variante.prix_reference_ht ??
    variante.prix_colonne_1 ??
    variante.prix_colonne_2 ??
    variante.puHt ??
    variante.unitPriceHT;

  const entry: Record<string, unknown> = {
    unitPriceHT: prixRef,
    quantity: variante.quantite_reference ?? variante.quantite ?? variante.quantity ?? 1,
    vatRate: variante.tva ?? variante.vatRate ?? 0.2,
  };

  const extraCols: string[] = [];
  for (let c = 1; c <= 6; c++) {
    const k = `prix_colonne_${c}`;
    if (variante[k] != null) extraCols.push(`${k}=${coerceLeaf(variante[k])}`);
  }
  if (extraCols.length > 0) {
    entry.notes = `Grille: ${extraCols.join(", ")}`;
  }

  return [enrichPriceEntryRaw(entry, variante, pasteCtx, varianteIndex)];
}

function mapMotherFromOuvrageEntry(
  entry: Record<string, unknown>,
  root: Record<string, unknown>,
  motherIndex: number,
): MotherVariantImportBundle {
  const warnings: string[] = [];
  const ficheMere = pickPasteString(entry, FICHE_MERE_KEYS) ?? `Fiche ${motherIndex + 1}`;
  const designation =
    pickPasteString(entry, ["designation_complete", "designationComplete", "fullDescription", "description"]) ??
    ficheMere;
  const famille =
    pickPasteString(root, ["famille", "family", "lot", "corpsEtat"]) ??
    pickPasteString(entry, ["famille", "lot"]) ??
    "Non classé";
  const sousFamille =
    pickPasteString(root, ["sous_famille", "sousFamille", "subLot"]) ?? pickPasteString(entry, ["sous_famille", "subLot"]);

  let code =
    extractPasteWorkItemCode(entry) ??
    extractPasteWorkItemCode(root) ??
    slugifyWorkItemCode(ficheMere, motherIndex);

  const tagsRaw = entry.tags ?? entry.etiquettes ?? entry.labels;
  const tags: string[] = Array.isArray(tagsRaw)
    ? tagsRaw.map((t) => coerceLeaf(t)).filter((t): t is string => Boolean(t?.trim()))
    : [];

  const unit =
    pickPasteString(entry, ["unite_principale", "unitePrincipale", "unit", "unite"]) ?? "u";

  const pasteObj: Record<string, unknown> = {
    code,
    lot: famille,
    subLot: sousFamille ?? undefined,
    family: famille,
    title: ficheMere,
    fullDescription: designation,
    unit,
    technicalReference: tags.length > 0 ? tags.join(", ") : undefined,
    ...entry,
  };

  const { values, warnings: mapWarnings } = mapObjectToStructuredPasteFormValues(pasteObj);
  warnings.push(...mapWarnings);

  if (!values.code.trim()) {
    values.code = code;
  } else {
    code = values.code.trim();
  }

  let variantesList: unknown[] = [];
  for (const key of VARIANTES_KEYS) {
    const val = entry[key];
    if (Array.isArray(val) && val.length > 0) {
      variantesList = val;
      break;
    }
  }

  const priceEntries: Record<string, unknown>[] = [];
  variantesList.forEach((item, vi) => {
    if (!isRecord(item)) {
      warnings.push(`Variante ${vi + 1} ignorée (pas un objet).`);
      return;
    }
    const mapped = mapVarianteToPriceEntryRaw(item, ficheMere, vi, pickPasteString(item, ["designation", "libelle"]), {
      famille,
      sousFamille,
      unite: unit,
      tags,
    });
    priceEntries.push(...mapped);
  });

  if (variantesList.length > 0 && priceEntries.length === 0) {
    warnings.push("Aucun prix exploitable dans les variantes (vérifiez prix_reference ou prix_colonne_*).");
  }

  return {
    motherIndex,
    values,
    pasteSource: entry,
    priceEntries,
    variantCount: variantesList.length,
    ficheMere,
    tags,
    warnings,
  };
}

function getOuvragesFromRoot(root: Record<string, unknown>): Record<string, unknown>[] | null {
  for (const key of OUVRAGES_KEYS) {
    const val = root[key];
    if (isArrayOfObjects(val)) return val;
  }
  const byLower = new Map<string, string>();
  for (const k of Object.keys(root)) {
    byLower.set(k.toLowerCase(), k);
  }
  for (const key of OUVRAGES_KEYS) {
    const actual = byLower.get(key.toLowerCase());
    if (!actual) continue;
    const val = root[actual];
    if (isArrayOfObjects(val)) return val;
  }
  return null;
}

function buildMotherVariantsResult(
  entries: Record<string, unknown>[],
  root: Record<string, unknown>,
): ParsedPasteMotherVariants | null {
  const mothers: MotherVariantImportBundle[] = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (isMotherVariantOuvrageEntry(entry)) {
      mothers.push(mapMotherFromOuvrageEntry(entry, root, i));
    } else if (extractPasteWorkItemCode(entry) || pickPasteString(entry, ["title", "fiche_mere", "ficheMere"])) {
      const bundle = mapMotherFromOuvrageEntry(
        {
          ...entry,
          variantes: entry.variantes ?? entry.variants ?? [],
        },
        root,
        i,
      );
      if (bundle.variantCount > 0) mothers.push(bundle);
    }
  }
  if (mothers.length === 0) return null;

  const totalVariantCount = mothers.reduce((s, m) => s + m.variantCount, 0);
  const allCodes = mothers.map((m) => m.values.code.trim()).filter(Boolean);

  return {
    mode: "motherVariants",
    pasteTypeLabel: "Fiches mères avec variantes (export ChatGPT)",
    famille: pickPasteString(root, ["famille", "family", "lot"]),
    sousFamille: pickPasteString(root, ["sous_famille", "sousFamille", "subLot"]),
    mothers,
    totalVariantCount,
    allCodes,
  };
}

/**
 * Détecte et parse un export `{ famille, ouvrages: [{ fiche_mere, variantes }] }`
 * sans écraser la fiche mère par la dernière variante.
 */
export function tryParseChatGptMotherVariantsExport(parsed: unknown): ParsedPasteMotherVariants | null {
  if (Array.isArray(parsed)) {
    if (!isArrayOfObjects(parsed)) return null;
    const withVariants = parsed.filter(isMotherVariantOuvrageEntry);
    if (withVariants.length === 0) return null;
    return buildMotherVariantsResult(parsed, {});
  }

  if (!isRecord(parsed)) return null;

  const ouvrages = getOuvragesFromRoot(parsed);
  if (ouvrages) {
    const withVariants = ouvrages.filter(isMotherVariantOuvrageEntry);
    if (withVariants.length === 0) return null;
    return buildMotherVariantsResult(ouvrages, parsed);
  }

  if (isMotherVariantOuvrageEntry(parsed)) {
    return buildMotherVariantsResult([parsed], {});
  }

  return null;
}

/** Indique si le JSON ne doit pas être « aplati » par le parseur générique. */
export function preservesMotherVariantStructure(parsed: unknown): boolean {
  return tryParseChatGptMotherVariantsExport(parsed) !== null;
}
