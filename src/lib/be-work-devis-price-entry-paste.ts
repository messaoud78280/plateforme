import type { BeWorkPriceDocSourceType } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { isBeWorkPriceDocSourceType } from "@/lib/be-work-devis-labels";

/** Extrait le tableau `priceEntries` d’un objet ouvrage collé (JSON). */
export function extractPriceEntriesFromPastedWorkItem(obj: Record<string, unknown>): Record<string, unknown>[] {
  const pe = obj.priceEntries;
  if (!Array.isArray(pe)) return [];
  return pe.filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x));
}

/** Nettoie une chaîne monétaire FR (ex. « 198,54 € », « 1 234,50 EUR »). */
function normalizeMoneyString(raw: string): string {
  let s = raw.trim();
  s = s.replace(/\u00a0/g, " ");
  s = s.replace(/€/gi, "").replace(/\beur\b/gi, "");
  s = s.replace(/\s/g, "");
  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    s = s.replace(",", ".");
  }
  return s;
}

export function toPrismaDecimalUnknown(v: unknown): Prisma.Decimal | null {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) {
    return new Prisma.Decimal(String(v));
  }
  if (typeof v === "string" && v.trim()) {
    try {
      const s = normalizeMoneyString(v);
      if (!s || !/^-?\d+(\.\d+)?$/.test(s)) return null;
      return new Prisma.Decimal(s);
    } catch {
      return null;
    }
  }
  return null;
}

const VAT_FIELD_KEYS = ["tva", "tvaRate", "tvaPercent", "tauxTva", "vatRate", "vatPercent"] as const;
const PU_HT_KEYS = [
  "unitPriceHT",
  "unitPriceHt",
  "puHt",
  "puHT",
  "prixUnitaireHt",
  "prixUnitaireHT",
  "prixHT",
  "prixHt",
  "montantUnitaireHT",
  "montantHT",
] as const;
const QTY_KEYS = ["quantity", "quantite", "qte"] as const;
const SOURCE_NAME_KEYS = ["sourceName", "source", "nomSource", "libelleSource", "sourceLabel"] as const;
const SOURCE_TYPE_KEYS = ["sourceType", "typeSource", "type"] as const;
const TOTAL_HT_KEYS = ["totalHT", "totalHt", "montantHT", "montantHt"] as const;
const TOTAL_TTC_KEYS = ["totalTTC", "totalTtc", "montantTTC", "montantTtc"] as const;
const PU_TTC_KEYS = ["unitPriceTTC", "unitPriceTtc", "puTtc", "prixUnitaireTTC", "prixUnitaireTtc"] as const;
const DATE_OBSERVED_KEYS = ["dateObserved", "dateObservee", "observedAt", "date"] as const;
const RELIABILITY_KEYS = ["reliabilityScore", "reliability", "fiability", "fiabilite"] as const;
const DEPARTMENT_KEYS = ["department", "departement"] as const;
const PROJECT_TYPE_KEYS = ["projectType", "typeProjet"] as const;
const QUALITY_KEYS = ["qualityLevel", "gamme", "range"] as const;

function pickRawField(raw: Record<string, unknown>, keys: readonly string[]): unknown {
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(raw, k)) {
      const v = raw[k];
      if (v != null && v !== "") return v;
    }
  }
  const byLower = new Map<string, string>();
  for (const k of Object.keys(raw)) {
    byLower.set(k.toLowerCase(), k);
  }
  for (const k of keys) {
    const actual = byLower.get(k.toLowerCase());
    if (actual) {
      const v = raw[actual];
      if (v != null && v !== "") return v;
    }
  }
  return undefined;
}

function rowLooksLikeFlatPriceEntry(obj: Record<string, unknown>): boolean {
  return (
    pickRawField(obj, PU_HT_KEYS) != null ||
    pickRawField(obj, TOTAL_HT_KEYS) != null ||
    pickRawField(obj, TOTAL_TTC_KEYS) != null ||
    pickRawField(obj, SOURCE_NAME_KEYS) != null
  );
}

/**
 * `priceEntries` imbriqué, ou à défaut champs prix au même niveau que `workItemCode`
 * (puHt, source, totalTtc… sur l’objet racine).
 */
export function extractOrCoalescePriceEntriesFromPasteObject(
  obj: Record<string, unknown>,
): Record<string, unknown>[] {
  const nested = extractPriceEntriesFromPastedWorkItem(obj);
  if (nested.length > 0) return nested;
  if (rowLooksLikeFlatPriceEntry(obj)) return [obj];
  return [];
}

function parsePositiveMoney(v: unknown): Prisma.Decimal | null {
  const d = toPrismaDecimalUnknown(v);
  if (!d) return null;
  const n = Number(d);
  if (Number.isNaN(n) || n <= 0) return null;
  return d;
}

function parseQuantityPaste(v: unknown): Prisma.Decimal {
  const d = parsePositiveMoney(v);
  return d ?? new Prisma.Decimal("1");
}

/**
 * TVA pour la base : le formulaire manuel utilise des pourcentages (ex. 20).
 * Les imports JSON peuvent envoyer un taux fractionnaire (ex. 0,2 pour 20 %).
 * Absent ou illisible → 20 % par défaut.
 */
export function normalizeVatRateForDb(v: unknown): Prisma.Decimal | null {
  const d = toPrismaDecimalUnknown(v);
  if (!d) return null;
  const n = Number(d);
  if (Number.isNaN(n) || n < 0) return null;
  if (n > 0 && n <= 1) {
    return new Prisma.Decimal(String(n * 100));
  }
  return d;
}

/** Parse TVA depuis collage JSON ; défaut 20 % si absent ou illisible. */
export function parseVatPercentFromPaste(v: unknown): Prisma.Decimal {
  if (v == null || (typeof v === "string" && !v.trim())) {
    return new Prisma.Decimal("20");
  }
  if (typeof v === "string") {
    const cleaned = v.trim().replace(/%/g, "").replace(/\s/g, "").replace(",", ".");
    if (!cleaned) return new Prisma.Decimal("20");
    const n = Number(cleaned);
    if (Number.isNaN(n) || n < 0) return new Prisma.Decimal("20");
    if (n > 0 && n <= 1) return new Prisma.Decimal(String(n * 100));
    return new Prisma.Decimal(String(n));
  }
  return normalizeVatRateForDb(v) ?? new Prisma.Decimal("20");
}

function htToTtc(ht: Prisma.Decimal, vatPercent: Prisma.Decimal): Prisma.Decimal {
  return ht.mul(vatPercent.div(100).add(1));
}

function normalizeSourceTypePaste(v: unknown): BeWorkPriceDocSourceType {
  const s = strOrUndef(v);
  if (!s) return "devis";
  const lower = s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
  if (isBeWorkPriceDocSourceType(lower)) return lower;
  if (lower.includes("devis")) return "devis";
  if (lower.includes("bpu")) return "bpu";
  if (lower.includes("dpgf")) return "dpgf";
  if (lower.includes("marche")) return "marche_public";
  if (lower.includes("estimation")) return "estimation_interne";
  return "devis";
}

function strOrUndef(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (typeof v === "string") {
    const t = v.trim();
    return t || undefined;
  }
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return undefined;
}

function parseDateObservedPaste(v: unknown): Date | undefined {
  if (v == null) return undefined;
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  if (typeof v === "string" && v.trim()) {
    const t = v.trim();
    const fr = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
    if (fr) {
      const day = Number(fr[1]);
      const month = Number(fr[2]);
      const year = Number(fr[3]);
      const dt = new Date(Date.UTC(year, month - 1, day));
      if (!Number.isNaN(dt.getTime())) return dt;
    }
    const iso = new Date(t);
    if (!Number.isNaN(iso.getTime())) return iso;
  }
  return undefined;
}

function parseReliabilityPaste(v: unknown): number {
  const n = Number(v);
  if (Number.isInteger(n) && n >= 1 && n <= 5) return n;
  return 3;
}

function mapQualityLevelPaste(v: unknown): string | undefined {
  const s = strOrUndef(v);
  if (!s) return undefined;
  const lower = s.toLowerCase();
  if (lower === "standard" || lower === "confort" || lower === "premium") return lower;
  return undefined;
}

export type PriceEntryPasteValidationCode = "source_manquante" | "prix_manquant";

export function priceEntryPasteValidationLabel(code: PriceEntryPasteValidationCode): string {
  const labels: Record<PriceEntryPasteValidationCode, string> = {
    source_manquante: "source manquante",
    prix_manquant: "prix manquant",
  };
  return labels[code];
}

export type NormalizedPriceEntryPaste = {
  sourceName: string;
  sourceType: BeWorkPriceDocSourceType;
  unitPriceHT: Prisma.Decimal;
  vatRate: Prisma.Decimal;
  unitPriceTTC: Prisma.Decimal;
  quantity: Prisma.Decimal;
  totalHT: Prisma.Decimal;
  totalTTC: Prisma.Decimal;
};

export type NormalizePriceEntryPasteResult =
  | { ok: true; data: NormalizedPriceEntryPaste }
  | { ok: false; code: PriceEntryPasteValidationCode; error: string };

/** Normalise un objet prix collé (alias de champs, calculs manquants, défauts). */
export function normalizePriceEntryPasteRaw(raw: Record<string, unknown>): NormalizePriceEntryPasteResult {
  const sourceName = strOrUndef(pickRawField(raw, SOURCE_NAME_KEYS));
  if (!sourceName) {
    return { ok: false, code: "source_manquante", error: "source manquante." };
  }

  const unitPriceHT = parsePositiveMoney(pickRawField(raw, PU_HT_KEYS));
  if (!unitPriceHT) {
    return { ok: false, code: "prix_manquant", error: "prix manquant ou invalide (PU HT requis et > 0)." };
  }

  const quantity = parseQuantityPaste(pickRawField(raw, QTY_KEYS));
  const vatRate = parseVatPercentFromPaste(pickRawField(raw, VAT_FIELD_KEYS));
  const sourceType = normalizeSourceTypePaste(pickRawField(raw, SOURCE_TYPE_KEYS));

  let totalHT = toPrismaDecimalUnknown(pickRawField(raw, TOTAL_HT_KEYS));
  if (!totalHT) {
    totalHT = unitPriceHT.mul(quantity);
  }

  let unitPriceTTC = toPrismaDecimalUnknown(pickRawField(raw, PU_TTC_KEYS));
  if (!unitPriceTTC) {
    unitPriceTTC = htToTtc(unitPriceHT, vatRate);
  }

  let totalTTC = toPrismaDecimalUnknown(pickRawField(raw, TOTAL_TTC_KEYS));
  if (!totalTTC) {
    totalTTC = htToTtc(totalHT, vatRate);
  }

  return {
    ok: true,
    data: {
      sourceName,
      sourceType,
      unitPriceHT,
      vatRate,
      unitPriceTTC,
      quantity,
      totalHT,
      totalTTC,
    },
  };
}

export type PriceEntryPasteBuildResult =
  | { ok: true; data: Prisma.PriceEntryUncheckedCreateInput }
  | { ok: false; error: string; code?: PriceEntryPasteValidationCode };

/**
 * Construit les données Prisma pour une ligne `PriceEntry` importée depuis le JSON.
 */
export function buildPriceEntryCreateFromPaste(
  workItemId: string,
  raw: Record<string, unknown>,
): PriceEntryPasteBuildResult {
  const norm = normalizePriceEntryPasteRaw(raw);
  if (!norm.ok) {
    return { ok: false, error: norm.error, code: norm.code };
  }

  const { sourceName, sourceType, unitPriceHT, vatRate, unitPriceTTC, quantity, totalHT, totalTTC } = norm.data;

  return {
    ok: true,
    data: {
      workItemId,
      priceSourceId: undefined,
      sourceName,
      sourceType,
      unitPriceHT,
      vatRate,
      unitPriceTTC,
      quantity,
      totalHT,
      totalTTC,
      region: strOrUndef(raw.region),
      department: strOrUndef(pickRawField(raw, DEPARTMENT_KEYS)),
      projectType: strOrUndef(pickRawField(raw, PROJECT_TYPE_KEYS)),
      qualityLevel: mapQualityLevelPaste(pickRawField(raw, QUALITY_KEYS)),
      dateObserved: parseDateObservedPaste(pickRawField(raw, DATE_OBSERVED_KEYS)),
      reliabilityScore: parseReliabilityPaste(pickRawField(raw, RELIABILITY_KEYS)),
      notes: strOrUndef(raw.notes),
    },
  };
}

/** Aperçu (1re ligne de prix) pour le tableau d’import. */
export function formatPasteMoneyPreview(v: unknown): string {
  if (v == null) return "—";
  if (v instanceof Prisma.Decimal) {
    const n = Number(v);
    if (!Number.isNaN(n)) {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      }).format(n);
    }
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(v);
  }
  if (typeof v === "string" && v.trim()) return v.trim();
  return "—";
}

export function formatPasteVatPreview(v: unknown): string {
  const d = v == null ? parseVatPercentFromPaste(undefined) : v instanceof Prisma.Decimal ? v : parseVatPercentFromPaste(v);
  const n = Number(d);
  if (!Number.isNaN(n)) {
    return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 4 }).format(n)} %`;
  }
  if (typeof v === "string" && v.trim()) return v.trim();
  return "—";
}

export function formatPasteQtyPreview(v: unknown): string {
  if (v == null) return "—";
  if (v instanceof Prisma.Decimal) {
    const n = Number(v);
    if (!Number.isNaN(n)) {
      return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 4 }).format(n);
    }
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 4 }).format(v);
  }
  if (typeof v === "string" && v.trim()) return v.trim();
  return "—";
}

/** Clé de dédoublonnage import : même ouvrage + sourceName + PU HT + quantité + total HT. */
export type PriceEntryDuplicateKey = {
  sourceName: string;
  unitPriceHT: Prisma.Decimal;
  quantity: Prisma.Decimal | null;
  totalHT: Prisma.Decimal | null;
};

/** Extrait une clé depuis le JSON collé (normalisation incluse). */
export function duplicateKeyFromPricePasteRaw(raw: Record<string, unknown>): PriceEntryDuplicateKey | null {
  const norm = normalizePriceEntryPasteRaw(raw);
  if (!norm.ok) return null;
  return {
    sourceName: norm.data.sourceName,
    unitPriceHT: norm.data.unitPriceHT,
    quantity: norm.data.quantity,
    totalHT: norm.data.totalHT,
  };
}

export function priceDuplicateKeyMatchesRow(
  key: PriceEntryDuplicateKey,
  row: {
    sourceName: string;
    unitPriceHT: Prisma.Decimal;
    quantity: Prisma.Decimal | null;
    totalHT: Prisma.Decimal | null;
  },
): boolean {
  if (row.sourceName !== key.sourceName) return false;
  if (!row.unitPriceHT.equals(key.unitPriceHT)) return false;
  const rq = row.quantity ?? null;
  const kq = key.quantity ?? null;
  if (rq === null && kq === null) {
    // continue
  } else if (rq === null || kq === null) {
    return false;
  } else if (!rq.equals(kq)) {
    return false;
  }
  const rth = row.totalHT ?? null;
  const kth = key.totalHT ?? null;
  if (rth === null && kth === null) return true;
  if (rth === null || kth === null) return false;
  return rth.equals(kth);
}

export function buildFirstPriceEntryPreviewCells(row: {
  priceEntries: Record<string, unknown>[];
  rootQuantity?: unknown;
}): {
  qty: string;
  puHt: string;
  totalHt: string;
  tva: string;
  totalTtc: string;
  source: string;
} {
  const first = row.priceEntries[0];
  if (!first) {
    return {
      qty: formatPasteQtyPreview(row.rootQuantity),
      puHt: "—",
      totalHt: "—",
      tva: "—",
      totalTtc: "—",
      source: "—",
    };
  }

  const norm = normalizePriceEntryPasteRaw(first);
  if (norm.ok) {
    const d = norm.data;
    return {
      qty: formatPasteQtyPreview(d.quantity),
      puHt: formatPasteMoneyPreview(d.unitPriceHT),
      totalHt: formatPasteMoneyPreview(d.totalHT),
      tva: formatPasteVatPreview(d.vatRate),
      totalTtc: formatPasteMoneyPreview(d.totalTTC),
      source: d.sourceName,
    };
  }

  const qty = pickRawField(first, QTY_KEYS) ?? row.rootQuantity;
  const source = strOrUndef(pickRawField(first, SOURCE_NAME_KEYS));
  return {
    qty: formatPasteQtyPreview(qty),
    puHt: formatPasteMoneyPreview(pickRawField(first, PU_HT_KEYS)),
    totalHt: formatPasteMoneyPreview(pickRawField(first, TOTAL_HT_KEYS)),
    tva: formatPasteVatPreview(pickRawField(first, VAT_FIELD_KEYS)),
    totalTtc: formatPasteMoneyPreview(pickRawField(first, TOTAL_TTC_KEYS)),
    source: source ?? "—",
  };
}

/** Regroupe les libellés d’erreur pour le statut de prévisualisation. */
export function summarizePricePasteInvalidReasons(reasons: string[]): string {
  if (reasons.length === 0) return "Données invalides";
  const counts = new Map<string, number>();
  for (const r of reasons) {
    counts.set(r, (counts.get(r) ?? 0) + 1);
  }
  const parts = [...counts.entries()].map(([label, n]) => (n > 1 ? `${n}× ${label}` : label));
  return parts.join(", ");
}

export function mapPriceEntryPasteBuildError(error: string, code?: PriceEntryPasteValidationCode): string {
  if (code) return priceEntryPasteValidationLabel(code);
  if (error.includes("source")) return "source manquante";
  if (error.includes("prix") || error.includes("PU HT")) return "prix manquant";
  if (error.includes("TVA")) return "TVA illisible";
  return error.replace(/\.$/, "");
}
