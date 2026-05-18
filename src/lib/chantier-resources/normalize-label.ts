/** Normalisation de libellés ressources (recherche, similarité, alias). */

export function normalizeResourceLabel(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[''`´]/g, "'")
    .replace(/[""«»]/g, " ")
    .replace(/[^\p{L}\p{N}\s./x×\-+]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
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
  if (lone && /parpaing|bloc|agglo|creux|ep/.test(n)) {
    return { thicknessCm: Number(lone[1]), rawTokens };
  }

  return { rawTokens };
}

export function tokenSet(label: string): Set<string> {
  const n = normalizeResourceLabel(label);
  return new Set(n.split(" ").filter((t) => t.length > 1));
}
