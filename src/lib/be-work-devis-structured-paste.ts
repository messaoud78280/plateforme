import { isWorkItemQualityLevel, isWorkItemStatus } from "@/lib/be-work-devis-labels";
import { extractPriceEntriesFromPastedWorkItem } from "@/lib/be-work-devis-price-entry-paste";
import { normalizeUnit } from "@/lib/be-work-devis-units";

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

/** Mappe un objet JSON vers les champs du formulaire ouvrage. */
export function mapObjectToStructuredPasteFormValues(obj: Record<string, unknown>): {
  values: StructuredPasteFormValues;
  warnings: string[];
} {
  const warnings: string[] = [];
  const values = emptyStructuredPasteFormValues();

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

  return { values, warnings };
}

function parseJsonFlexible(trimmed: string): unknown {
  const n = normalizeSmartQuotes(stripCodeFence(trimmed));
  try {
    return JSON.parse(stripTrailingCommas(n));
  } catch {
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

export type ParsedStructuredPaste = ParsedPasteSingle | ParsedPasteBulk;

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

  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      return { ok: false, error: "Le tableau JSON ne contient aucun ouvrage." };
    }
    let sawPricesOnly = false;
    let sawWorkItem = false;
    for (const entry of parsed) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        sawWorkItem = true;
        continue;
      }
      const rowObj = entry as Record<string, unknown>;
      if (extractWorkItemCodeFromPasteObject(rowObj)) sawPricesOnly = true;
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
    parsed.forEach((entry, index) => {
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
      const wic = extractWorkItemCodeFromPasteObject(rowObj);
      if (wic) {
        const priceEntries = extractPriceEntriesFromPastedWorkItem(rowObj);
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
      const priceEntries = extractPriceEntriesFromPastedWorkItem(rowObj);
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
  const wicSingle = extractWorkItemCodeFromPasteObject(singleObj);
  if (wicSingle) {
    const priceEntries = extractPriceEntriesFromPastedWorkItem(singleObj);
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
