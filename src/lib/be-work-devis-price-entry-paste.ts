import { Prisma } from "@prisma/client";
import { isBeWorkPriceDocSourceType } from "@/lib/be-work-devis-labels";

/** Extrait le tableau `priceEntries` d’un objet ouvrage collé (JSON). */
export function extractPriceEntriesFromPastedWorkItem(obj: Record<string, unknown>): Record<string, unknown>[] {
  const pe = obj.priceEntries;
  if (!Array.isArray(pe)) return [];
  return pe.filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x));
}

export function toPrismaDecimalUnknown(v: unknown): Prisma.Decimal | null {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) {
    return new Prisma.Decimal(String(v));
  }
  if (typeof v === "string" && v.trim()) {
    try {
      return new Prisma.Decimal(v.trim().replace(/\s/g, "").replace(",", "."));
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * TVA pour la base : le formulaire manuel utilise des pourcentages (ex. 20).
 * Les imports JSON peuvent envoyer un taux fractionnaire (ex. 0,2 pour 20 %).
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

export function parseDateObservedPaste(v: unknown): Date | undefined {
  if (v == null) return undefined;
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  if (typeof v === "string" && v.trim()) {
    const d = new Date(v.trim());
    if (!Number.isNaN(d.getTime())) return d;
  }
  return undefined;
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

function parseReliabilityPaste(v: unknown): number {
  const n = Number(v);
  if (Number.isInteger(n) && n >= 1 && n <= 5) return n;
  return 3;
}

export type PriceEntryPasteBuildResult =
  | { ok: true; data: Prisma.PriceEntryUncheckedCreateInput }
  | { ok: false; error: string };

/**
 * Construit les données Prisma pour une ligne `PriceEntry` importée depuis le JSON.
 * Ne recalcule pas les montants : reprend `unitPriceHT`, `vatRate`, `unitPriceTTC` tels qu’interprétés.
 */
export function buildPriceEntryCreateFromPaste(
  workItemId: string,
  raw: Record<string, unknown>,
): PriceEntryPasteBuildResult {
  const sourceName = strOrUndef(raw.sourceName);
  if (!sourceName) {
    return { ok: false, error: "sourceName manquant." };
  }

  const sourceTypeRaw = strOrUndef(raw.sourceType) ?? "devis";
  if (!isBeWorkPriceDocSourceType(sourceTypeRaw)) {
    return { ok: false, error: `sourceType invalide : ${sourceTypeRaw}` };
  }

  const unitPriceHT = toPrismaDecimalUnknown(raw.unitPriceHT);
  if (!unitPriceHT) {
    return { ok: false, error: "unitPriceHT manquant ou invalide." };
  }

  const unitPriceTTC = toPrismaDecimalUnknown(raw.unitPriceTTC);
  if (!unitPriceTTC) {
    return { ok: false, error: "unitPriceTTC manquant ou invalide." };
  }

  const vatRate = normalizeVatRateForDb(raw.vatRate) ?? new Prisma.Decimal("20");

  const quantity = toPrismaDecimalUnknown(raw.quantity);
  const totalHT = toPrismaDecimalUnknown(raw.totalHT);
  const totalTTC = toPrismaDecimalUnknown(raw.totalTTC);

  return {
    ok: true,
    data: {
      workItemId,
      priceSourceId: undefined,
      sourceName,
      sourceType: sourceTypeRaw,
      unitPriceHT,
      vatRate,
      unitPriceTTC,
      quantity: quantity ?? undefined,
      totalHT: totalHT ?? undefined,
      totalTTC: totalTTC ?? undefined,
      region: strOrUndef(raw.region),
      department: strOrUndef(raw.department),
      projectType: strOrUndef(raw.projectType),
      qualityLevel: strOrUndef(raw.qualityLevel),
      dateObserved: parseDateObservedPaste(raw.dateObserved),
      reliabilityScore: parseReliabilityPaste(raw.reliabilityScore),
      notes: strOrUndef(raw.notes),
    },
  };
}

/** Aperçu (1re ligne de prix) pour le tableau d’import — affichage sans altération des montants source. */
export function formatPasteMoneyPreview(v: unknown): string {
  if (v == null) return "—";
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
  if (v == null) return "—";
  if (typeof v === "number" && Number.isFinite(v)) {
    if (v > 0 && v <= 1) {
      return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 4 }).format(v * 100)} %`;
    }
    return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 4 }).format(v)} %`;
  }
  if (typeof v === "string" && v.trim()) return v.trim();
  return "—";
}

export function formatPasteQtyPreview(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "number" && Number.isFinite(v)) {
    return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 4 }).format(v);
  }
  if (typeof v === "string" && v.trim()) return v.trim();
  return "—";
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
  const qty = first.quantity ?? row.rootQuantity;
  return {
    qty: formatPasteQtyPreview(qty),
    puHt: formatPasteMoneyPreview(first.unitPriceHT),
    totalHt: formatPasteMoneyPreview(first.totalHT),
    tva: formatPasteVatPreview(first.vatRate),
    totalTtc: formatPasteMoneyPreview(first.totalTTC),
    source: typeof first.sourceName === "string" && first.sourceName.trim() ? first.sourceName.trim() : "—",
  };
}
