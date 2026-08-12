/** Couleurs PDF devis — accent entreprise + teintes. */
export type Rgb = [number, number, number];

export const DEFAULT_BRAND: Rgb = [30, 58, 95];
export const SLATE: Rgb = [71, 85, 105];
export const INK: Rgb = [15, 23, 42];
export const MUTED: Rgb = [148, 163, 184];
export const RULE: Rgb = [226, 232, 240];
export const WHITE: Rgb = [255, 255, 255];

export function parseHexColor(hex: string | null | undefined, fallback: Rgb = DEFAULT_BRAND): Rgb {
  if (!hex?.trim()) return fallback;
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return fallback;
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Teinte très claire (≈ 6–8 %) pour fonds de chapitre. */
export function tint(rgb: Rgb, amount = 0.92): Rgb {
  return [
    Math.round(rgb[0] + (255 - rgb[0]) * amount),
    Math.round(rgb[1] + (255 - rgb[1]) * amount),
    Math.round(rgb[2] + (255 - rgb[2]) * amount),
  ];
}
