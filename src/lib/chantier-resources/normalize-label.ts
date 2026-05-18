/** Normalisation de libellés ressources (recherche, similarité, alias, déduplication). */

const UNIT_ALIASES: Record<string, string> = {
  u: "u",
  unite: "u",
  unité: "u",
  piece: "u",
  pièce: "u",
  pcs: "u",
  m2: "m2",
  "m²": "m2",
  m3: "m3",
  "m³": "m3",
  ml: "ml",
  "m.l": "ml",
  "metre lineaire": "ml",
  "mètre linéaire": "ml",
  m: "m",
  kg: "kg",
  l: "l",
  h: "h",
  j: "j",
  jour: "j",
  forfait: "forfait",
};

export function normalizeResourceLabel(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[''`´]/g, "'")
    .replace(/[""«»]/g, " ")
    .replace(/\s*[x×]\s*/gi, "x")
    .replace(/[^\p{L}\p{N}\s./x\-+]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeOrderUnit(raw: string | null | undefined): string {
  if (!raw?.trim()) return "";
  const n = normalizeResourceLabel(raw).replace(/\./g, "");
  return UNIT_ALIASES[n] ?? n;
}

export type ParsedDimensions = {
  thicknessCm?: number;
  lengthMm?: number;
  widthMm?: number;
  heightMm?: number;
  rawTokens: string[];
};

const DIM_PATTERNS = [
  /(\d+)\s*[x×]\s*(\d+)\s*[x×]\s*(\d+)/i,
  /(\d{2,4})\s*[x×]\s*(\d{2,4})\s*[x×]\s*(\d{2,4})/i,
  /ep\.?\s*(\d+(?:[.,]\d+)?)\s*(?:cm|mm)?/i,
  /epaisseur\s*(\d+(?:[.,]\d+)?)\s*cm/i,
  /(\d+(?:[.,]\d+)?)\s*cm/i,
];

export function parseDimensionsFromLabel(label: string): ParsedDimensions {
  const rawTokens: string[] = [];
  const n = normalizeResourceLabel(label);

  for (const re of DIM_PATTERNS) {
    const m = re.exec(label) ?? re.exec(n);
    if (m) rawTokens.push(m[0]);
  }

  const triple = /(\d{2,4})\s*[x×]\s*(\d{2,4})\s*[x×]\s*(\d{2,4})/i.exec(label);
  if (triple) {
    const a = Number(triple[1]);
    const b = Number(triple[2]);
    const c = Number(triple[3]);
    const nums = [a, b, c].sort((x, y) => x - y);
    return {
      lengthMm: nums[2],
      widthMm: nums[1],
      heightMm: nums[0],
      thicknessCm: nums[0] <= 50 ? nums[0] : undefined,
      rawTokens,
    };
  }

  const ep = /ep\.?\s*(\d+(?:[.,]\d+)?)|epaisseur\s*(\d+(?:[.,]\d+)?)\s*cm|(\d+)\s*cm/i.exec(label);
  if (ep) {
    const v = Number((ep[1] ?? ep[2] ?? ep[3]).replace(",", "."));
    if (!Number.isNaN(v)) return { thicknessCm: v, rawTokens };
  }

  const lone = /\b(\d{2})\b/.exec(n);
  if (lone && /parpaing|bloc|agglo|creux|ep|laine/.test(n)) {
    return { thicknessCm: Number(lone[1]), rawTokens };
  }

  return { rawTokens };
}

export function tokenSet(label: string): Set<string> {
  const n = normalizeResourceLabel(label);
  return new Set(n.split(" ").filter((t) => t.length > 1));
}

export function buildDimensionSignature(label: string): string {
  const d = parseDimensionsFromLabel(label);
  const parts: string[] = [];
  if (d.thicknessCm != null) parts.push(`ep${d.thicknessCm}`);
  if (d.lengthMm != null && d.widthMm != null) {
    parts.push(`dim${d.lengthMm}x${d.widthMm}${d.heightMm != null ? `x${d.heightMm}` : ""}`);
  }
  return parts.join("|");
}

export function buildResourceGroupingKey(input: {
  shortName: string;
  resourceType: string;
  family: string;
  subFamily?: string | null;
  orderUnit?: string | null;
}): string {
  return [
    normalizeResourceLabel(input.shortName),
    input.resourceType,
    input.family,
    input.subFamily ?? "",
    normalizeOrderUnit(input.orderUnit),
    buildDimensionSignature(input.shortName),
  ].join("||");
}

export function buildResourceStrictFingerprint(input: {
  shortName: string;
  fullDescription: string;
  resourceType: string;
  family: string;
  subFamily?: string | null;
  orderUnit: string;
  status: string;
  confidenceLevel: string;
  mainCharacteristics?: string | null;
  siteUsage?: string | null;
  businessNotes?: string | null;
}): string {
  const normDesc = normalizeResourceLabel(input.fullDescription).slice(0, 500);
  const normChars = normalizeResourceLabel(input.mainCharacteristics ?? "");
  const normUsage = normalizeResourceLabel(input.siteUsage ?? "");
  const normNotes = normalizeResourceLabel(input.businessNotes ?? "");
  return [
    buildResourceGroupingKey(input),
    normDesc,
    input.status,
    input.confidenceLevel,
    normChars,
    normUsage,
    normNotes,
  ].join("##");
}

export function buildPriceObservationKey(amountHT: number, orderUnit: string, sourceName: string | null): string {
  const amt = Math.round(amountHT * 100) / 100;
  return `${amt}|${normalizeOrderUnit(orderUnit)}|${normalizeResourceLabel(sourceName ?? "")}`;
}
