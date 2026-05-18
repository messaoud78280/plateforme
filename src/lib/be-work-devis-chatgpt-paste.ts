/**
 * Import JSON « ChatGPT / BeWork » : export famille + ouvrages avec fiche_mere + variantes.
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

const FICHE_MERE_DESIGNATION_KEYS = [
  "designation",
  "designation_amelioree",
  "designationAmelioree",
  "titre",
  "nom",
  "title",
  "name",
] as const;

const VARIANT_TECH_KEYS = [
  "volume_litres",
  "longueur_ml",
  "surface_m2",
  "profondeur_cm",
  "diametre_mm",
  "diametre_cuve_cm",
  "nombre_pompes",
  "puissance_kw",
  "debit_max_m3h",
  "hauteur_max_m",
  "sortie_mm",
  "alimentation",
  "capacite_eh",
  "materiau_cuve",
  "media_filtrant",
  "hauteur_m",
  "largeur_m",
  "type_prestation",
  "ouvrage",
  "volume_max_m3",
  "temps_pose",
] as const;

const PRIX_GRILLE_KEYS = [
  "pose_seule_41h",
  "pose_seule_56h",
  "fourniture_seule",
  "fourniture_pose_41h",
  "fourniture_pose_56h",
] as const;

/** Normalise pour comparaison de similarité (doublons fiche mère). */
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getFicheMereRecord(entry: Record<string, unknown>): Record<string, unknown> | null {
  for (const key of FICHE_MERE_KEYS) {
    const val = entry[key];
    if (isRecord(val)) return val;
  }
  const byLower = new Map<string, string>();
  for (const k of Object.keys(entry)) {
    byLower.set(k.toLowerCase(), k);
  }
  for (const key of FICHE_MERE_KEYS) {
    const actual = byLower.get(key.toLowerCase());
    if (!actual) continue;
    const val = entry[actual];
    if (isRecord(val)) return val;
  }
  return null;
}

/** Désignation fiche mère : objet imbriqué ou chaîne directe. */
export function getFicheMereDesignation(entry: Record<string, unknown>): string | null {
  const rec = getFicheMereRecord(entry);
  if (rec) {
    return pickPasteString(rec, FICHE_MERE_DESIGNATION_KEYS);
  }
  return pickPasteString(entry, FICHE_MERE_KEYS);
}

export function getVariantesArray(entry: Record<string, unknown>): unknown[] {
  for (const key of VARIANTES_KEYS) {
    const val = entry[key];
    if (Array.isArray(val)) return val;
  }
  const byLower = new Map<string, string>();
  for (const k of Object.keys(entry)) {
    byLower.set(k.toLowerCase(), k);
  }
  for (const key of VARIANTES_KEYS) {
    const actual = byLower.get(key.toLowerCase());
    if (!actual) continue;
    const val = entry[actual];
    if (Array.isArray(val)) return val;
  }
  return [];
}

export function hasVariantesArray(entry: Record<string, unknown>): boolean {
  return getVariantesArray(entry).length > 0;
}

export function isMotherVariantOuvrageEntry(obj: Record<string, unknown>): boolean {
  const designation = getFicheMereDesignation(obj);
  if (!designation) return false;
  return hasVariantesArray(obj);
}

export function getOuvragesFromRoot(root: Record<string, unknown>): Record<string, unknown>[] | null {
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

export type MotherVariantImportBundle = {
  motherIndex: number;
  values: StructuredPasteFormValues;
  pasteSource: Record<string, unknown>;
  priceEntries: Record<string, unknown>[];
  variantCount: number;
  ficheMere: string;
  variantCodes: string[];
  tags: string[];
  warnings: string[];
};

export type ParsedPasteMotherVariants = {
  mode: "motherVariants";
  detectedFormat: "fiche_mere_variantes" | "export_fiches_meres_variantes";
  pasteTypeLabel: string;
  famille: string | null;
  sousFamille: string | null;
  mothers: MotherVariantImportBundle[];
  totalVariantCount: number;
  allCodes: string[];
};

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

function extractPrixGrille(variante: Record<string, unknown>): {
  unitPriceHT: unknown;
  prixGrille: Record<string, number>;
} {
  const prix = variante.prix;
  const grille: Record<string, number> = {};

  if (isRecord(prix)) {
    for (const [k, val] of Object.entries(prix)) {
      if (typeof val === "number" && Number.isFinite(val)) grille[k] = val;
    }
    const unit =
      prix.fourniture_pose_41h ??
      prix.fourniture_pose_56h ??
      prix.fourniture_seule ??
      prix.pose_seule_41h ??
      prix.pose_seule_56h ??
      null;
    return { unitPriceHT: unit, prixGrille: grille };
  }

  for (const k of PRIX_GRILLE_KEYS) {
    if (variante[k] != null && typeof variante[k] === "number") {
      grille[k] = variante[k] as number;
    }
  }

  const unit =
    variante.prix_reference ??
    variante.prix_reference_ht ??
    variante.puHt ??
    variante.unitPriceHT;

  return { unitPriceHT: unit, prixGrille: grille };
}

function collectVariantCaracteristiques(v: Record<string, unknown>): Record<string, string | number | boolean> {
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
    "prix",
    "designation",
    "designation_originale",
    "designationOriginale",
    "designation_amelioree",
    "designationAmelioree",
    "libelle",
    "label",
    "unite",
    "unit",
    "tags",
    "etiquettes",
  ]);

  const out: Record<string, string | number | boolean> = {};
  const push = (k: string, val: unknown) => {
    if (val == null || val === "") return;
    if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
      out[k] = val;
    }
  };
  for (const key of VARIANT_TECH_KEYS) {
    push(key, v[key]);
  }
  for (const [k, val] of Object.entries(v)) {
    if (skip.has(k)) continue;
    if (VARIANT_TECH_KEYS.includes(k as (typeof VARIANT_TECH_KEYS)[number])) continue;
    push(k, val);
  }
  return out;
}

function collectVariantAttributeNotes(v: Record<string, unknown>): string {
  const chars = collectVariantCaracteristiques(v);
  const lines: string[] = [];
  for (const [k, val] of Object.entries(chars)) {
    const leaf = coerceLeaf(val);
    if (leaf !== null && leaf.trim()) lines.push(`${k}: ${leaf.trim()}`);
  }
  return lines.join("\n");
}

export type VariantPasteContext = {
  famille?: string | null;
  sousFamille?: string | null;
  categorie?: string | null;
  ficheMere: string;
  unite?: string | null;
  tags?: string[];
};

export function buildVariantDesignation(
  variante: Record<string, unknown>,
  ficheMere: string,
): string {
  const explicit = pickPasteString(variante, [
    "designation",
    "designation_amelioree",
    "designationAmelioree",
    "designation_originale",
    "designationOriginale",
    "designation_complete",
    "designationComplete",
    "libelle",
    "label",
    "designation_variante",
  ]);
  if (explicit) return explicit;

  const parts: string[] = [ficheMere];
  const vol = coerceLeaf(variante.volume_litres);
  if (vol) parts.push(`${vol} L`);
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
  prixGrille: Record<string, number>,
): PriceEntryImportMeta {
  const tagsRaw = variante.tags ?? variante.etiquettes;
  const variantTags = Array.isArray(tagsRaw)
    ? tagsRaw.map((t) => coerceLeaf(t)).filter((t): t is string => Boolean(t?.trim()))
    : [];

  const caracteristiques = collectVariantCaracteristiques(variante);
  const tempsPose = variante.temps_pose;
  const meta: PriceEntryImportMeta = {
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

  if (Object.keys(prixGrille).length > 0) meta.prixGrille = prixGrille;
  if (Object.keys(caracteristiques).length > 0) meta.caracteristiques = caracteristiques;
  if (typeof tempsPose === "number" && Number.isFinite(tempsPose)) meta.temps_pose = tempsPose;

  return meta;
}

function enrichPriceEntryRaw(
  raw: Record<string, unknown>,
  variante: Record<string, unknown>,
  ctx: VariantPasteContext,
  varianteIndex: number,
  subIndex = 0,
): Record<string, unknown> {
  const { unitPriceHT, prixGrille } = extractPrixGrille(variante);
  const variantDesignation = buildVariantDesignation(variante, ctx.ficheMere);
  const importMeta = buildVariantImportMeta(variante, ctx, prixGrille);
  const codeSource = importMeta.codeSource ?? `V${varianteIndex + 1}${subIndex > 0 ? `.${subIndex + 1}` : ""}`;

  return {
    ...raw,
    unitPriceHT: raw.unitPriceHT ?? unitPriceHT,
    sourceName: codeSource,
    variantDesignation,
    importMeta,
    sourceType: raw.sourceType ?? pickPasteString(variante, ["sourceType", "typeSource"]) ?? "estimation_interne",
    notes: [coerceLeaf(raw.notes), collectVariantAttributeNotes(variante)].filter(Boolean).join("\n") || undefined,
  };
}

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
    categorie: ctx?.categorie ?? null,
    unite: ctx?.unite ?? null,
    tags: ctx?.tags,
  };

  const nested = extractOrCoalescePriceEntriesFromPasteObject(variante);
  if (nested.length > 0) {
    return nested.map((pe, j) => enrichPriceEntryRaw(pe, variante, pasteCtx, varianteIndex, j));
  }

  const { unitPriceHT, prixGrille } = extractPrixGrille(variante);

  const entry: Record<string, unknown> = {
    unitPriceHT,
    quantity: variante.quantite_reference ?? variante.quantite ?? variante.quantity ?? 1,
    vatRate: variante.tva ?? variante.vatRate ?? 0.2,
  };

  if (Object.keys(prixGrille).length > 0 && !entry.unitPriceHT) {
    entry.notes = `Grille prix: ${Object.entries(prixGrille)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ")}`;
  }

  return [enrichPriceEntryRaw(entry, variante, pasteCtx, varianteIndex)];
}

function parseMotsCles(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((t) => coerceLeaf(t)).filter((t): t is string => Boolean(t?.trim()));
  }
  const s = coerceLeaf(raw);
  if (!s?.trim()) return [];
  return s
    .split(/[,;]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function mapMotherFromOuvrageEntry(
  entry: Record<string, unknown>,
  root: Record<string, unknown>,
  motherIndex: number,
): MotherVariantImportBundle {
  const warnings: string[] = [];
  const ficheRec = getFicheMereRecord(entry);
  const ficheMere = getFicheMereDesignation(entry) ?? `Fiche ${motherIndex + 1}`;

  const designation =
    (ficheRec && pickPasteString(ficheRec, ["description", "designation_complete", "designationComplete"])) ??
    pickPasteString(entry, ["designation_complete", "designationComplete", "fullDescription", "description"]) ??
    ficheMere;

  const famille =
    pickPasteString(root, ["famille", "family", "lot", "corpsEtat"]) ??
    (ficheRec && pickPasteString(ficheRec, ["famille", "lot"])) ??
    pickPasteString(entry, ["famille", "lot"]) ??
    "Non classé";

  const sousFamille =
    pickPasteString(root, ["sous_famille", "sousFamille", "subLot"]) ??
    (ficheRec && pickPasteString(ficheRec, ["sous_famille", "sousFamille", "subLot"])) ??
    pickPasteString(entry, ["sous_famille", "subLot"]);

  const categorie =
    (ficheRec && pickPasteString(ficheRec, ["categorie", "category"])) ??
    pickPasteString(entry, ["categorie", "category"]);

  const materiaux =
    (ficheRec && pickPasteString(ficheRec, ["materiaux", "materials", "materiau"])) ??
    pickPasteString(entry, ["materiaux", "materials"]);

  const motsClesRaw =
    (ficheRec && (ficheRec.mots_cles ?? ficheRec.motsCles ?? ficheRec.keywords)) ??
    entry.tags ??
    entry.etiquettes;

  const tags = parseMotsCles(motsClesRaw);

  let code =
    extractPasteWorkItemCode(entry) ??
    (ficheRec && extractPasteWorkItemCode(ficheRec)) ??
    extractPasteWorkItemCode(root) ??
    slugifyWorkItemCode(ficheMere, motherIndex);

  const unit =
    (ficheRec && pickPasteString(ficheRec, ["unite", "unit", "unite_principale", "unitePrincipale"])) ??
    pickPasteString(entry, ["unite_principale", "unitePrincipale", "unit", "unite"]) ??
    "u";

  const pasteObj: Record<string, unknown> = {
    code,
    lot: famille,
    subLot: sousFamille ?? categorie ?? undefined,
    family: famille,
    title: ficheMere,
    fullDescription: designation,
    unit,
    technicalReference: [materiaux, tags.length > 0 ? tags.join(", ") : null].filter(Boolean).join(" · ") || undefined,
    ...(ficheRec ?? {}),
    ...entry,
  };

  const { values, warnings: mapWarnings } = mapObjectToStructuredPasteFormValues(pasteObj);
  warnings.push(...mapWarnings);

  if (!values.code.trim()) {
    values.code = code;
  } else {
    code = values.code.trim();
  }

  const variantesList = getVariantesArray(entry);
  const priceEntries: Record<string, unknown>[] = [];
  const variantCodes: string[] = [];

  variantesList.forEach((item, vi) => {
    if (!isRecord(item)) {
      warnings.push(`Variante ${vi + 1} ignorée (pas un objet).`);
      return;
    }
    const vCode = pickPasteString(item, ["code", "code_variante", "ref", "reference"]);
    if (vCode) variantCodes.push(vCode);

    const mapped = mapVarianteToPriceEntryRaw(item, ficheMere, vi, pickPasteString(item, ["designation", "libelle"]), {
      famille,
      sousFamille,
      categorie,
      unite: unit,
      tags,
    });
    priceEntries.push(...mapped);
  });

  if (variantesList.length > 0 && priceEntries.length === 0) {
    warnings.push("Aucun prix exploitable dans les variantes (vérifiez le bloc « prix » ou prix_reference).");
  }

  return {
    motherIndex,
    values,
    pasteSource: entry,
    priceEntries,
    variantCount: variantesList.length,
    ficheMere,
    variantCodes,
    tags,
    warnings,
  };
}

function buildMotherVariantsResult(
  entries: Record<string, unknown>[],
  root: Record<string, unknown>,
  detectedFormat: ParsedPasteMotherVariants["detectedFormat"],
): ParsedPasteMotherVariants | null {
  const mothers: MotherVariantImportBundle[] = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (isMotherVariantOuvrageEntry(entry)) {
      mothers.push(mapMotherFromOuvrageEntry(entry, root, i));
    }
  }
  if (mothers.length === 0) return null;

  const totalVariantCount = mothers.reduce((s, m) => s + m.variantCount, 0);
  const allCodes = mothers.map((m) => m.values.code.trim()).filter(Boolean);

  const label =
    detectedFormat === "export_fiches_meres_variantes"
      ? "Export fiches mères + variantes détecté"
      : "Fiche mère + variantes détectée";

  return {
    mode: "motherVariants",
    detectedFormat,
    pasteTypeLabel: label,
    famille: pickPasteString(root, ["famille", "family", "lot"]),
    sousFamille: pickPasteString(root, ["sous_famille", "sousFamille", "subLot"]),
    mothers,
    totalVariantCount,
    allCodes,
  };
}

export function tryParseChatGptMotherVariantsExport(parsed: unknown): ParsedPasteMotherVariants | null {
  if (Array.isArray(parsed)) {
    if (!isArrayOfObjects(parsed)) return null;
    const withVariants = parsed.filter(isMotherVariantOuvrageEntry);
    if (withVariants.length === 0) return null;
    return buildMotherVariantsResult(parsed, {}, "export_fiches_meres_variantes");
  }

  if (!isRecord(parsed)) return null;

  if (isMotherVariantOuvrageEntry(parsed)) {
    return buildMotherVariantsResult([parsed], {}, "fiche_mere_variantes");
  }

  const ouvrages = getOuvragesFromRoot(parsed);
  if (ouvrages) {
    const withVariants = ouvrages.filter(isMotherVariantOuvrageEntry);
    if (withVariants.length === 0) return null;
    return buildMotherVariantsResult(ouvrages, parsed, "export_fiches_meres_variantes");
  }

  return null;
}

export function preservesMotherVariantStructure(parsed: unknown): boolean {
  return tryParseChatGptMotherVariantsExport(parsed) !== null;
}

export function countFichesMeresInParsed(parsed: unknown): number {
  const mv = tryParseChatGptMotherVariantsExport(parsed);
  if (mv) return mv.mothers.length;
  return 0;
}

export function countVariantesInParsed(parsed: unknown): number {
  const mv = tryParseChatGptMotherVariantsExport(parsed);
  if (mv) return mv.totalVariantCount;
  return 0;
}
