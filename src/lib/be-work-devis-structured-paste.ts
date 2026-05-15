import { WORK_ITEM_UNITS, isWorkItemQualityLevel, isWorkItemStatus } from "@/lib/be-work-devis-labels";

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

function isWorkItemUnit(v: string): boolean {
  return (WORK_ITEM_UNITS as readonly string[]).includes(v);
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

/**
 * Interprète un bloc collé (JSON strict ou légèrement assoupli).
 * Ne persiste rien : uniquement des valeurs pour préremplissage.
 */
export function parseStructuredWorkItemPaste(raw: string):
  | { ok: true; values: StructuredPasteFormValues; warnings: string[] }
  | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Collez d’abord un bloc de données (JSON ou pseudo-JSON)." };
  }

  let slice: string;
  try {
    slice = extractBalancedObject(normalizeSmartQuotes(stripCodeFence(trimmed)));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Format invalide.";
    return { ok: false, error: msg };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripTrailingCommas(slice));
  } catch (e) {
    const hint = e instanceof Error ? e.message : "Erreur de syntaxe.";
    return {
      ok: false,
      error: `Impossible de lire le JSON. ${hint} Vérifiez les guillemets, les virgules et les accolades.`,
    };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "Le contenu doit être un objet JSON { … }, pas un tableau ou une valeur simple." };
  }

  const obj = parsed as Record<string, unknown>;
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
      if (!leaf.trim()) {
        values.unit = "";
      } else if (isWorkItemUnit(leaf.trim())) {
        values.unit = leaf.trim();
      } else {
        warnings.push(`Unité « ${leaf} » non reconnue — choisissez une unité dans la liste.`);
        values.unit = "";
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

  return { ok: true, values, warnings };
}
