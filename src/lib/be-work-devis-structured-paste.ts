import { isWorkItemQualityLevel, isWorkItemStatus } from "@/lib/be-work-devis-labels";
import { extractPriceEntriesFromPastedWorkItem } from "@/lib/be-work-devis-price-entry-paste";
import { normalizeUnit } from "@/lib/be-work-devis-units";

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

export type ParsedPasteBulkRow = {
  index: number;
  values: StructuredPasteFormValues;
  warnings: string[];
  priceEntries: Record<string, unknown>[];
  rootQuantity?: unknown;
};

export type ParsedPasteBulk = {
  mode: "bulk";
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
    const rows: ParsedPasteBulkRow[] = [];
    parsed.forEach((entry, index) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        rows.push({
          index,
          values: emptyStructuredPasteFormValues(),
          warnings: ["Entrée ignorée : ce n’est pas un objet JSON."],
          priceEntries: [],
        });
        return;
      }
      const rowObj = entry as Record<string, unknown>;
      const { values, warnings } = mapObjectToStructuredPasteFormValues(rowObj);
      const priceEntries = extractPriceEntriesFromPastedWorkItem(rowObj);
      rows.push({
        index,
        values,
        warnings,
        priceEntries,
        rootQuantity: rowObj.quantity,
      });
    });
    return { ok: true, result: { mode: "bulk", rows } };
  }

  if (!parsed || typeof parsed !== "object") {
    return { ok: false, error: "Le contenu doit être un objet { … } ou un tableau [ … ] d’objets." };
  }

  const { values, warnings } = mapObjectToStructuredPasteFormValues(parsed as Record<string, unknown>);
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
    return {
      ok: false,
      error: "Ce collage est une liste d’ouvrages. Utilisez « Analyser le collage » pour la prévisualiser et l’importer.",
    };
  }
  return { ok: true, values: r.result.values, warnings: r.result.warnings };
}
