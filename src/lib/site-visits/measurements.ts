/**
 * VISITES-METRES-1 — Calculs déterministes d’avant-métré (pas de prix).
 */
import { roundMoney } from "@/lib/commercial/money";

export type MeasureType = "SURFACE" | "LENGTH" | "VOLUME" | "QUANTITY" | "FREE";

export type MeasureInput = {
  measureType: MeasureType;
  lengthM?: number | null;
  widthM?: number | null;
  heightM?: number | null;
  quantityValue?: number | null;
  /** Unité libre (FREE) ou forcée. */
  unit?: string | null;
};

export type MeasureResult = {
  computedQuantity: number;
  unit: string;
};

function n(v: number | null | undefined): number {
  if (v == null || !Number.isFinite(v)) return 0;
  return v;
}

/** Arrondi terrain à 4 décimales (quantités), via utilitaire monétaire existant. */
export function roundQty(value: number): number {
  return roundMoney(value, 4);
}

export function computeMeasurement(input: MeasureInput): MeasureResult {
  switch (input.measureType) {
    case "SURFACE": {
      const q = roundQty(n(input.lengthM) * n(input.widthM));
      return { computedQuantity: q, unit: "m²" };
    }
    case "LENGTH": {
      const q = roundQty(n(input.lengthM) || n(input.quantityValue));
      return { computedQuantity: q, unit: "ml" };
    }
    case "VOLUME": {
      const q = roundQty(n(input.lengthM) * n(input.widthM) * n(input.heightM));
      return { computedQuantity: q, unit: "m³" };
    }
    case "QUANTITY": {
      const q = roundQty(n(input.quantityValue));
      return { computedQuantity: q, unit: input.unit?.trim() || "U" };
    }
    case "FREE": {
      const q = roundQty(n(input.quantityValue));
      return { computedQuantity: q, unit: input.unit?.trim() || "U" };
    }
    default:
      return { computedQuantity: 0, unit: "U" };
  }
}

/** Compatibilité évidente relevé ↔ ouvrage (pas de conversion). */
export function unitsCompatible(measureUnit: string, workItemUnit: string): boolean {
  const a = normalizeUnit(measureUnit);
  const b = normalizeUnit(workItemUnit);
  if (!a || !b) return true;
  return a === b;
}

function normalizeUnit(u: string): string {
  const s = u.trim().toLowerCase().replace(/\s+/g, "");
  if (["m2", "m²", "m^2"].includes(s)) return "m2";
  if (["ml", "m.l", "mètrelinéaire", "metrelineaire", "m"].includes(s)) return "ml";
  if (["m3", "m³", "m^3"].includes(s)) return "m3";
  if (["u", "unité", "unite", "pce", "pc", "ens"].includes(s)) return "u";
  return s;
}

export function formatQuantityLabel(qty: number, unit: string): string {
  const q =
    Number.isInteger(qty) || Math.abs(qty - Math.round(qty)) < 1e-9
      ? String(Math.round(qty))
      : qty.toFixed(2).replace(/\.?0+$/, "");
  return `${q} ${unit}`;
}
