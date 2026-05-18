import {
  isMotherVariantOuvrageEntry,
  preservesMotherVariantStructure,
  tryParseChatGptMotherVariantsExport,
  type ParsedPasteMotherVariants,
} from "@/lib/be-work-devis-chatgpt-paste";
import { isWorkItemQualityLevel, isWorkItemStatus } from "@/lib/be-work-devis-labels";
import { extractOrCoalescePriceEntriesFromPasteObject } from "@/lib/be-work-devis-price-entry-paste";
import { applyResolvedDescriptionsToPasteValues } from "@/lib/be-work-devis-work-item-description";
import { normalizeUnit } from "@/lib/be-work-devis-units";

export type { MotherVariantImportBundle, ParsedPasteMotherVariants } from "@/lib/be-work-devis-chatgpt-paste";

const PASTE_WORK_ITEM_CODE_KEYS = ["code", "codeOuvrage", "codeBeWork", "reference", "ref"] as const;
const PASTE_TITLE_KEYS = ["title", "name", "designation", "libelle", "label"] as const;
const PASTE_LOT_KEYS = ["lot", "corpsEtat", "corps_etat", "trade", "famille"] as const;
const PASTE_UNIT_KEYS = ["unit", "unite", "u"] as const;

/** Conteneurs fréquents autour d’un tableau d’ouvrages (export IA, scripts, etc.). */
const PASTE_BULK_ARRAY_KEYS = [
  "workItems",
  "workitems",
  "ouvrages",
  "items",
  "rows",
  "data",
  "results",
  "entries",
  "liste",
  "bibliotheque",
  "library",
  "records",
  "lignes",
] as const;

/** Code ouvrage existant pour un collage « prix seuls » (JSON `workItemCode`). */
export function extractWorkItemCodeFromPasteObject(obj: Record<string, unknown>): string | null {
  const v = obj.workItemCode;
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) {
    const s = String(v);
    if (s.trim()) return s.trim();
  }
  return null;
}

/** Clés reconnues depuis un collage JSON / pseudo-JSON (alignées sur le formulaire ouvrage). */
export const STRUCTURED_PASTE_FIELD_KEYS = [
  "code",
  "lot",
  "subLot",
  "family",
  "title",
  "shortDescription",
  "fullDescription",
  "unit",
  "qualityLevel",
  "technicalReference",
  "includedItems",
  "excludedItems",
  "vigilancePoints",
  "clientQuestions",
  "companyQuestions",
  "internalNotes",
  "status",
] as const;

export type StructuredPasteFieldKey = (typeof STRUCTURED_PASTE_FIELD_KEYS)[number];

export type StructuredPasteFormValues = Record<StructuredPasteFieldKey, string>;

export function emptyStructuredPasteFormValues(): StructuredPasteFormValues {
  return Object.fromEntries(STRUCTURED_PASTE_FIELD_KEYS.map((k) => [k, ""])) as StructuredPasteFormValues;
}

function stripCodeFence(raw: string): string {
  let t = raw.trim();
  const fence = /^```(?:json)?\s*\r?\n?([\s\S]*?)\r?\n?```$/im.exec(t);
  if (fence) t = fence[1].trim();
  return t;
}

function extractBalancedObject(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error("Aucun objet JSON détecté (accolades { … } introuvables).");
  }
  return text.slice(start, end + 1);
}

function extractBalancedArray(text: string): string {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end <= start) {
    throw new Error("Aucun tableau JSON détecté (crochets [ … ] introuvables).");
  }
  return text.slice(start, end + 1);
}

/** Supprime les virgules finales avant } ou ] (tolère un peu de pseudo-JSON). */
function stripTrailingCommas(json: string): string {
  let prev = "";
  let cur = json;
  let guard = 0;
  while (cur !== prev && guard < 12) {
    prev = cur;
    cur = cur.replace(/,\s*([}\]])/g, "$1");
    guard += 1;
  }
  return cur;
}

function normalizeSmartQuotes(s: string): string {
  return s.replace(/[\u201c\u201d\u00ab\u00bb]/g, '"').replace(/[\u2018\u2019]/g, "'");
}

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
  for (const k of Object.keys(obj)) {
    byLower.set(k.toLowerCase(), k);
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

/** Code BeWork d’un ouvrage (création / import bibliothèque). */
export function extractPasteWorkItemCode(obj: Record<string, unknown>): string | null {
  return pickPasteString(obj, PASTE_WORK_ITEM_CODE_KEYS);
}

function looksLikeSingleWorkItemRoot(obj: Record<string, unknown>): boolean {
  if (extractPasteWorkItemCode(obj)) return true;
  if (pickPasteString(obj, PASTE_TITLE_KEYS)) return true;
  if (pickPasteString(obj, PASTE_LOT_KEYS)) return true;
  return false;
}

function isArrayOfObjects(v: unknown): v is Record<string, unknown>[] {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    v.every((e) => e !== null && typeof e === "object" && !Array.isArray(e))
  );
}

/**
 * Déplie les exports du type `{ "ouvrages": [ … ] }` ou `{ "data": { "workItems": [ … ] } }`.
 */
export function unwrapStructuredPasteRoot(parsed: unknown, depth = 0): unknown {
  if (depth > 5) return parsed;
  if (Array.isArray(parsed)) return parsed;
  if (!parsed || typeof parsed !== "object") return parsed;

  const obj = parsed as Record<string, unknown>;
  if (looksLikeSingleWorkItemRoot(obj)) return parsed;

  for (const key of PASTE_BULK_ARRAY_KEYS) {
    const direct = obj[key];
    if (isArrayOfObjects(direct)) {
      return unwrapStructuredPasteRoot(direct, depth + 1);
    }
  }

  const byLower = new Map<string, string>();
  for (const k of Object.keys(obj)) {
    byLower.set(k.toLowerCase(), k);
  }
  for (const key of PASTE_BULK_ARRAY_KEYS) {
    const actual = byLower.get(key.toLowerCase());
    if (!actual) continue;
    const val = obj[actual];
    if (isArrayOfObjects(val)) {
      return unwrapStructuredPasteRoot(val, depth + 1);
    }
  }

  for (const val of Object.values(obj)) {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const inner = unwrapStructuredPasteRoot(val, depth + 1);
      if (Array.isArray(inner)) return inner;
    }
  }

  const arrayProps = Object.values(obj).filter(isArrayOfObjects);
  if (arrayProps.length === 1) {
    return unwrapStructuredPasteRoot(arrayProps[0], depth + 1);
  }

  return parsed;
}

/** Bloc « prix seuls » : workItemCode sans fiche ouvrage complète dans la même ligne. */
export function rowIsPricesOnlyPaste(obj: Record<string, unknown>): boolean {
  const targetCode = extractWorkItemCodeFromPasteObject(obj);
  if (!targetCode) return false;
  if (extractPasteWorkItemCode(obj)) return false;
  if (pickPasteString(obj, PASTE_TITLE_KEYS) || pickPasteString(obj, PASTE_LOT_KEYS)) return false;
  return true;
}

function flattenBulkPasteEntries(entries: unknown[]): unknown[] {
  const flat: unknown[] = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      flat.push(entry);
      continue;
    }
    const rowObj = entry as Record<string, unknown>;
    if (isMotherVariantOuvrageEntry(rowObj)) {
      flat.push(entry);
      continue;
    }
    if (looksLikeSingleWorkItemRoot(rowObj)) {
      flat.push(entry);
      continue;
    }
    let nested: unknown[] | null = null;
    for (const key of PASTE_BULK_ARRAY_KEYS) {
      const val = rowObj[key];
      if (isArrayOfObjects(val)) {
        nested = val;
        break;
      }
    }
    if (!nested) {
      const arrays = Object.values(rowObj).filter(isArrayOfObjects);
      if (arrays.length === 1) nested = arrays[0];
    }
    if (nested) flat.push(...nested);
    else flat.push(entry);
  }
  return flat;
}

/** Mappe un objet JSON vers les champs du formulaire ouvrage. */
export function mapObjectToStructuredPasteFormValues(obj: Record<string, unknown>): {
  values: StructuredPasteFormValues;
  warnings: string[];
} {
  const warnings: string[] = [];
  const values = emptyStructuredPasteFormValues();

  const codeAlias = extractPasteWorkItemCode(obj);
  if (codeAlias) values.code = codeAlias;

  const lotAlias = pickPasteString(obj, PASTE_LOT_KEYS);
  if (lotAlias && !String(obj.lot ?? "").trim()) values.lot = lotAlias;

  const unitAlias = pickPasteString(obj, PASTE_UNIT_KEYS);
  if (unitAlias && !String(obj.unit ?? "").trim()) values.unit = unitAlias;

  const titleAlias = pickPasteString(obj, PASTE_TITLE_KEYS);
  if (titleAlias && !String(obj.title ?? "").trim()) values.title = titleAlias;

  for (const key of STRUCTURED_PASTE_FIELD_KEYS) {
    if (!(key in obj)) continue;
    const leaf = coerceLeaf(obj[key]);
    if (leaf === null) {
      warnings.push(`Champ « ${key} » ignoré (type non pris en charge).`);
      continue;
    }

    if (key === "unit") {
      const trimmed = leaf.trim();
      if (!trimmed) {
        values.unit = "";
      } else {
        const nu = normalizeUnit(trimmed);
        if (nu) {
          values.unit = nu;
        } else {
          warnings.push(
            `Unité « ${leaf} » non reconnue après normalisation — à l’import, m² sera utilisé si vous ne corrigez pas le champ.`,
          );
          values.unit = "";
        }
      }
      continue;
    }

    if (key === "qualityLevel") {
      const q = leaf.trim();
      if (!q) {
        values.qualityLevel = "";
      } else if (isWorkItemQualityLevel(q)) {
        values.qualityLevel = q;
      } else {
        warnings.push(`Gamme « ${q} » non reconnue (standard, confort, premium).`);
        values.qualityLevel = "";
      }
      continue;
    }

    if (key === "status") {
      const s = leaf.trim();
      if (!s) {
        values.status = "";
      } else if (isWorkItemStatus(s)) {
        values.status = s;
      } else {
        warnings.push(`Statut « ${s} » non reconnu.`);
        values.status = "";
      }
      continue;
    }

    values[key] = leaf;
  }

  applyResolvedDescriptionsToPasteValues(obj, values);

  return { values, warnings };
}

function parseJsonFlexible(trimmed: string): unknown {
  const n = normalizeSmartQuotes(stripCodeFence(trimmed));
  const attempts = [n, stripTrailingCommas(n)];
  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate);
    } catch {
      /* essai suivant */
    }
  }
  const arrStart = n.indexOf("[");
  const objStart = n.indexOf("{");
  if (arrStart !== -1 && (objStart === -1 || arrStart < objStart)) {
    const slice = extractBalancedArray(n);
    return JSON.parse(stripTrailingCommas(slice));
  }
  if (objStart !== -1) {
    const slice = extractBalancedObject(n);
    return JSON.parse(stripTrailingCommas(slice));
  }
  throw new Error("Impossible d’extraire un objet ou un tableau JSON valide.");
}

export type ParsedPasteSingle = {
  mode: "single";
  values: StructuredPasteFormValues;
  warnings: string[];
};

export type PasteBulkRowKind = "workItem" | "pricesOnly";

export type ParsedPasteBulkRow = {
  index: number;
  rowKind: PasteBulkRowKind;
  values: StructuredPasteFormValues;
  /** Si `rowKind === "pricesOnly"` : code BeWork de l’ouvrage cible (champ JSON `workItemCode`). */
  workItemCode?: string;
  warnings: string[];
  priceEntries: Record<string, unknown>[];
  rootQuantity?: unknown;
};

export type ParsedPasteBulk = {
  mode: "bulk";
  /** `pricesOnly` : tableau de `{ workItemCode, priceEntries }` pour enrichir des ouvrages déjà en base. */
  bulkKind: "workItems" | "pricesOnly";
  rows: ParsedPasteBulkRow[];
};

export type ParsedStructuredPaste = ParsedPasteSingle | ParsedPasteBulk | ParsedPasteMotherVariants;

export type StructuredPasteKind =
  | "single"
  | "workItemsList"
  | "pricesOnly"
  | "motherWithVariants";

export function describeStructuredPasteKind(result: ParsedStructuredPaste): StructuredPasteKind {
  if (result.mode === "single") return "single";
  if (result.mode === "motherVariants") return "motherWithVariants";
  if (result.bulkKind === "pricesOnly") return "pricesOnly";
  return "workItemsList";
}

export function parseStructuredPasteBlock(raw: string):
  | { ok: true; result: ParsedStructuredPaste }
  | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Collez d’abord un bloc de données (JSON ou pseudo-JSON)." };
  }

  let parsed: unknown;
  try {
    parsed = parseJsonFlexible(trimmed);
  } catch (e) {
    const hint = e instanceof Error ? e.message : "Erreur de syntaxe.";
    return {
      ok: false,
      error: `Impossible de lire le JSON. ${hint} Vérifiez les guillemets, les virgules, les crochets et les accolades.`,
    };
  }

  const motherExport = tryParseChatGptMotherVariantsExport(parsed);
  if (motherExport) {
    return { ok: true, result: motherExport };
  }

  if (!preservesMotherVariantStructure(parsed)) {
    parsed = unwrapStructuredPasteRoot(parsed);
    const motherAfterUnwrap = tryParseChatGptMotherVariantsExport(parsed);
    if (motherAfterUnwrap) {
      return { ok: true, result: motherAfterUnwrap };
    }
  }

  if (Array.isArray(parsed)) {
    const entries = flattenBulkPasteEntries(parsed);
    if (entries.length === 0) {
      return { ok: false, error: "Le tableau JSON ne contient aucun ouvrage." };
    }
    let sawPricesOnly = false;
    let sawWorkItem = false;
    for (const entry of entries) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        sawWorkItem = true;
        continue;
      }
      const rowObj = entry as Record<string, unknown>;
      if (rowIsPricesOnlyPaste(rowObj)) sawPricesOnly = true;
      else sawWorkItem = true;
    }
    if (sawPricesOnly && sawWorkItem) {
      return {
        ok: false,
        error:
          "Ne mélangez pas dans un même tableau des ouvrages complets (champ « code ») et des blocs « prix seuls » (champ « workItemCode »). Collez deux imports séparés.",
      };
    }
    const bulkKind: ParsedPasteBulk["bulkKind"] = sawPricesOnly ? "pricesOnly" : "workItems";
    const rows: ParsedPasteBulkRow[] = [];
    entries.forEach((entry, index) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        rows.push({
          index,
          rowKind: "workItem",
          values: emptyStructuredPasteFormValues(),
          warnings: ["Entrée ignorée : ce n’est pas un objet JSON."],
          priceEntries: [],
        });
        return;
      }
      const rowObj = entry as Record<string, unknown>;
      if (rowIsPricesOnlyPaste(rowObj)) {
        const wic = extractWorkItemCodeFromPasteObject(rowObj)!;
        const priceEntries = extractOrCoalescePriceEntriesFromPasteObject(rowObj);
        const warnings: string[] = [];
        if (priceEntries.length === 0) {
          warnings.push("Aucune entrée dans priceEntries.");
        }
        rows.push({
          index,
          rowKind: "pricesOnly",
          workItemCode: wic,
          values: emptyStructuredPasteFormValues(),
          warnings,
          priceEntries,
        });
        return;
      }
      const { values, warnings } = mapObjectToStructuredPasteFormValues(rowObj);
      const priceEntries = extractOrCoalescePriceEntriesFromPasteObject(rowObj);
      rows.push({
        index,
        rowKind: "workItem",
        values,
        warnings,
        priceEntries,
        rootQuantity: rowObj.quantity,
      });
    });
    return { ok: true, result: { mode: "bulk", bulkKind, rows } };
  }

  if (!parsed || typeof parsed !== "object") {
    return { ok: false, error: "Le contenu doit être un objet { … } ou un tableau [ … ] d’objets." };
  }

  const singleObj = parsed as Record<string, unknown>;

  if (rowIsPricesOnlyPaste(singleObj)) {
    const wicSingle = extractWorkItemCodeFromPasteObject(singleObj)!;
    const priceEntries = extractOrCoalescePriceEntriesFromPasteObject(singleObj);
    const warnings: string[] = [];
    if (priceEntries.length === 0) {
      warnings.push("Aucune entrée dans priceEntries.");
    }
    return {
      ok: true,
      result: {
        mode: "bulk",
        bulkKind: "pricesOnly",
        rows: [
          {
            index: 0,
            rowKind: "pricesOnly",
            workItemCode: wicSingle,
            values: emptyStructuredPasteFormValues(),
            warnings,
            priceEntries,
          },
        ],
      },
    };
  }

  const { values, warnings } = mapObjectToStructuredPasteFormValues(singleObj);
  return { ok: true, result: { mode: "single", values, warnings } };
}

/**
 * @deprecated Préférer parseStructuredPasteBlock (objet ou tableau).
 * Interprète un bloc collé comme un seul objet.
 */
export function parseStructuredWorkItemPaste(raw: string):
  | { ok: true; values: StructuredPasteFormValues; warnings: string[] }
  | { ok: false; error: string } {
  const r = parseStructuredPasteBlock(raw);
  if (!r.ok) return r;
  if (r.result.mode === "motherVariants") {
    return {
      ok: false,
      error:
        "Ce collage contient des fiches mères avec variantes. Utilisez « Analyser le collage » pour la prévisualiser et importer toute la famille.",
    };
  }
  if (r.result.mode === "bulk") {
    if (r.result.bulkKind === "pricesOnly") {
      return {
        ok: false,
        error:
          "Ce collage ajoute des prix sur des ouvrages existants (champ « workItemCode »). Utilisez « Analyser le collage » pour la prévisualiser et importer les prix observés.",
      };
    }
    return {
      ok: false,
      error: "Ce collage est une liste d’ouvrages. Utilisez « Analyser le collage » pour la prévisualiser et l’importer.",
    };
  }
  return { ok: true, values: r.result.values, warnings: r.result.warnings };
}
