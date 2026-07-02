import { normalizeCategory, normalizeLevel } from "./labels";
import { lotNameFromCode, normalizeLotCode } from "./lots";

/** Représentation normalisée d'un terme prêt à insérer en base. */
export type BtpDicoParsedTerm = {
  term: string;
  acronym: string | null;
  lotCode: string | null;
  lotName: string | null;
  family: string | null;
  category: string | null;
  shortDefinition: string;
  beginnerExplanation: string | null;
  usageExample: string | null;
  keywords: string[];
  synonyms: string[];
  vigilancePoints: string[];
  linkedDocuments: string[];
  level: string;
  source: string | null;
  status: string;
};

export type BtpDicoImportRow = {
  index: number;
  term: string;
  lotCode: string | null;
  acronym: string | null;
  category: string | null;
  valid: boolean;
  errors: string[];
  duplicateInFile: boolean;
  existsInDb: boolean;
  parsed: BtpDicoParsedTerm | null;
};

export type BtpDicoPreviewResult = {
  total: number;
  validCount: number;
  invalidCount: number;
  duplicateInFileCount: number;
  existsInDbCount: number;
  lots: string[];
  rows: BtpDicoImportRow[];
  structureErrors: string[];
  canImport: boolean;
};

export type BtpDicoDuplicateMode = "ignore" | "replace";

function toStr(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v.trim() || null;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return null;
}

function toStringArray(v: unknown): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) {
    return v.map((x) => toStr(x)).filter((x): x is string => !!x);
  }
  if (typeof v === "string") {
    return v
      .split(/[\n;,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/** Clé de doublon : terme + lot (insensible casse/espaces). */
export function dedupeKey(term: string, lotCode: string | null): string {
  return `${term.trim().toLowerCase()}::${lotCode ?? ""}`;
}

const FR_KEYS = {
  term: ["terme", "term"],
  acronym: ["acronyme", "acronym"],
  lot: ["lot", "lot_code", "lotCode"],
  family: ["famille", "family"],
  category: ["categorie", "catégorie", "category"],
  shortDefinition: ["definition_courte", "définition_courte", "short_definition", "definition", "définition"],
  beginnerExplanation: ["explication_pedagogique", "explication_pédagogique", "beginner_explanation", "explication"],
  usageExample: ["exemple_utilisation", "usage_example", "exemple"],
  keywords: ["mots_cles", "mots_clés", "keywords"],
  synonyms: ["synonymes", "synonyms"],
  vigilancePoints: ["points_vigilance", "points_de_vigilance", "vigilance_points"],
  linkedDocuments: ["documents_lies", "documents_liés", "linked_documents", "documents"],
  level: ["niveau", "level"],
  source: ["source"],
  status: ["statut", "status"],
} as const;

function pick(obj: Record<string, unknown>, keys: readonly string[]): unknown {
  for (const k of keys) {
    if (k in obj && obj[k] != null) return obj[k];
  }
  return undefined;
}

/** Parse une entrée brute vers un terme normalisé (sans valider). */
export function parseBtpDicoEntry(raw: unknown): { parsed: BtpDicoParsedTerm | null; errors: string[] } {
  const errors: string[] = [];
  if (typeof raw !== "object" || raw == null || Array.isArray(raw)) {
    return { parsed: null, errors: ["Entrée invalide (objet attendu)."] };
  }
  const obj = raw as Record<string, unknown>;

  const term = toStr(pick(obj, FR_KEYS.term));
  const shortDefinition = toStr(pick(obj, FR_KEYS.shortDefinition));

  if (!term) errors.push("Champ « terme » manquant.");
  if (!shortDefinition) errors.push("Champ « definition_courte » manquant.");

  const lotRaw = toStr(pick(obj, FR_KEYS.lot));
  const lotCode = normalizeLotCode(lotRaw);
  const lotName = lotCode ? lotNameFromCode(lotCode) : lotRaw;

  const parsed: BtpDicoParsedTerm = {
    term: term ?? "",
    acronym: toStr(pick(obj, FR_KEYS.acronym)),
    lotCode,
    lotName,
    family: toStr(pick(obj, FR_KEYS.family)),
    category: normalizeCategory(toStr(pick(obj, FR_KEYS.category))),
    shortDefinition: shortDefinition ?? "",
    beginnerExplanation: toStr(pick(obj, FR_KEYS.beginnerExplanation)),
    usageExample: toStr(pick(obj, FR_KEYS.usageExample)),
    keywords: toStringArray(pick(obj, FR_KEYS.keywords)),
    synonyms: toStringArray(pick(obj, FR_KEYS.synonyms)),
    vigilancePoints: toStringArray(pick(obj, FR_KEYS.vigilancePoints)),
    linkedDocuments: toStringArray(pick(obj, FR_KEYS.linkedDocuments)),
    level: normalizeLevel(toStr(pick(obj, FR_KEYS.level))),
    source: toStr(pick(obj, FR_KEYS.source)),
    status: toStr(pick(obj, FR_KEYS.status)) ?? "à vérifier",
  };

  return { parsed: errors.length === 0 ? parsed : null, errors };
}

/** Extrait le tableau d'entrées depuis plusieurs formats JSON acceptés. */
export function extractEntries(rawText: string): { entries: unknown[]; error: string | null } {
  const t = rawText.trim();
  if (!t) return { entries: [], error: "Aucune donnée JSON fournie." };
  let data: unknown;
  try {
    data = JSON.parse(t);
  } catch {
    return { entries: [], error: "JSON invalide — vérifiez la syntaxe." };
  }
  if (Array.isArray(data)) return { entries: data, error: null };
  if (typeof data === "object" && data != null) {
    const obj = data as Record<string, unknown>;
    for (const key of ["termes", "terms", "dico", "entries", "items"]) {
      if (Array.isArray(obj[key])) return { entries: obj[key] as unknown[], error: null };
    }
    return { entries: [data], error: null };
  }
  return { entries: [], error: "Format JSON non reconnu (tableau ou objet attendu)." };
}

/** Construit une prévisualisation d'import (validation + doublons). */
export function buildBtpDicoPreview(
  rawText: string,
  existingKeys: Set<string>,
): BtpDicoPreviewResult {
  const { entries, error } = extractEntries(rawText);
  if (error) {
    return {
      total: 0,
      validCount: 0,
      invalidCount: 0,
      duplicateInFileCount: 0,
      existsInDbCount: 0,
      lots: [],
      rows: [],
      structureErrors: [error],
      canImport: false,
    };
  }

  const seen = new Set<string>();
  const rows: BtpDicoImportRow[] = [];
  const lots = new Set<string>();

  entries.forEach((entry, i) => {
    const { parsed, errors } = parseBtpDicoEntry(entry);
    const term = parsed?.term ?? (typeof entry === "object" && entry ? String((entry as Record<string, unknown>).terme ?? "") : "");
    const lotCode = parsed?.lotCode ?? null;
    let duplicateInFile = false;
    let existsInDb = false;

    if (parsed) {
      const key = dedupeKey(parsed.term, parsed.lotCode);
      if (seen.has(key)) {
        duplicateInFile = true;
        errors.push("Doublon dans le fichier (terme + lot).");
      }
      seen.add(key);
      if (existingKeys.has(key)) existsInDb = true;
      if (parsed.lotCode) lots.add(parsed.lotCode);
    }

    rows.push({
      index: i + 1,
      term: term || "—",
      lotCode,
      acronym: parsed?.acronym ?? null,
      category: parsed?.category ?? null,
      valid: errors.length === 0,
      errors,
      duplicateInFile,
      existsInDb,
      parsed,
    });
  });

  const validCount = rows.filter((r) => r.valid).length;
  const invalidCount = rows.length - validCount;
  const duplicateInFileCount = rows.filter((r) => r.duplicateInFile).length;
  const existsInDbCount = rows.filter((r) => r.existsInDb).length;

  return {
    total: rows.length,
    validCount,
    invalidCount,
    duplicateInFileCount,
    existsInDbCount,
    lots: [...lots].sort(),
    rows,
    structureErrors: rows.length === 0 ? ["Aucune entrée trouvée dans le JSON."] : [],
    canImport: rows.length > 0 && invalidCount === 0,
  };
}

/** Sérialise un terme vers le format JSON pédagogique (export). */
export function btpDicoTermToJson(t: {
  term: string;
  acronym: string | null;
  lotCode: string | null;
  lotName: string | null;
  family: string | null;
  category: string | null;
  shortDefinition: string;
  beginnerExplanation: string | null;
  usageExample: string | null;
  keywords: string[];
  synonyms: string[];
  vigilancePoints: string[];
  linkedDocuments: string[];
  level: string;
  source: string | null;
  status: string;
}): Record<string, unknown> {
  const lot = t.lotCode ? `${t.lotCode} - ${t.lotName ?? ""}`.trim().replace(/-\s*$/, "").trim() : t.lotName ?? "";
  const out: Record<string, unknown> = {
    terme: t.term,
    acronyme: t.acronym ?? undefined,
    lot: lot || undefined,
    famille: t.family ?? undefined,
    categorie: t.category ?? undefined,
    definition_courte: t.shortDefinition,
    explication_pedagogique: t.beginnerExplanation ?? undefined,
    exemple_utilisation: t.usageExample ?? undefined,
    mots_cles: t.keywords.length ? t.keywords : undefined,
    synonymes: t.synonyms.length ? t.synonyms : undefined,
    points_vigilance: t.vigilancePoints.length ? t.vigilancePoints : undefined,
    documents_lies: t.linkedDocuments.length ? t.linkedDocuments : undefined,
    niveau: t.level,
    source: t.source ?? undefined,
    statut: t.status,
  };
  for (const k of Object.keys(out)) if (out[k] === undefined) delete out[k];
  return out;
}
