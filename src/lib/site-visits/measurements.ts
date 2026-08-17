/**
 * VISITES-METRES-2 — Calculs déterministes d’avant-métré (pas de prix).
 */
import { roundMoney } from "@/lib/commercial/money";

export type MeasureType = "SURFACE" | "WALL" | "LENGTH" | "VOLUME" | "QUANTITY" | "FREE";

export type MeasureDeduction = {
  label?: string | null;
  lengthM?: number | null;
  widthM?: number | null;
  quantity?: number | null;
};

export type MeasureInput = {
  measureType: MeasureType;
  lengthM?: number | null;
  widthM?: number | null;
  heightM?: number | null;
  quantityValue?: number | null;
  unit?: string | null;
  multiplier?: number | null;
  coefficient?: number | null;
  wastePercent?: number | null;
  deductions?: MeasureDeduction[] | null;
};

export type MeasureResult = {
  computedQuantity: number;
  grossQuantity: number;
  deductionTotal: number;
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

export function computeDeductionTotal(deductions?: MeasureDeduction[] | null): number {
  if (!deductions?.length) return 0;
  let sum = 0;
  for (const d0 of deductions) {
    const qty = n(d0.quantity) || 1;
    const area = n(d0.lengthM) * n(d0.widthM);
    sum += (area > 0 ? area : n(d0.lengthM)) * qty;
  }
  return roundQty(sum);
}

export function computeMeasurement(input: MeasureInput): MeasureResult {
  let unit = "U";
  let base = 0;
  switch (input.measureType) {
    case "SURFACE": {
      base = n(input.lengthM) * n(input.widthM);
      unit = "m²";
      break;
    }
    case "WALL": {
      base = n(input.lengthM) * n(input.heightM);
      unit = "m²";
      break;
    }
    case "LENGTH": {
      const len = n(input.lengthM) || n(input.quantityValue);
      const qty = n(input.quantityValue) > 0 && n(input.lengthM) > 0 ? n(input.quantityValue) : 1;
      base = n(input.lengthM) > 0 ? len * (n(input.quantityValue) > 0 ? qty : 1) : len;
      unit = "ml";
      break;
    }
    case "VOLUME": {
      base = n(input.lengthM) * n(input.widthM) * n(input.heightM);
      unit = "m³";
      break;
    }
    case "QUANTITY":
    case "FREE": {
      base = n(input.quantityValue);
      unit = input.unit?.trim() || "U";
      break;
    }
    default:
      base = 0;
      unit = input.unit?.trim() || "U";
  }

  const multiplier = n(input.multiplier) || 1;
  const coefficient = n(input.coefficient) || 1;
  const waste = n(input.wastePercent);
  const gross = roundQty(base * multiplier * coefficient * (1 + waste / 100));
  const deductionTotal =
    input.measureType === "SURFACE" || input.measureType === "WALL" || input.measureType === "LENGTH"
      ? computeDeductionTotal(input.deductions)
      : 0;
  const computedQuantity = roundQty(Math.max(0, gross - deductionTotal));
  return { computedQuantity, grossQuantity: gross, deductionTotal, unit };
}

/** Compatibilité évidente relevé ↔ ouvrage (pas de conversion). */
export function unitsCompatible(measureUnit: string, workItemUnit: string): boolean {
  const a = normalizeUnit(measureUnit);
  const b = normalizeUnit(workItemUnit);
  if (!a || !b) return true;
  return a === b;
}

export function normalizeUnit(u: string): string {
  const s = u.trim().toLowerCase().replace(/\s+/g, "");
  if (["m2", "m²", "m^2"].includes(s)) return "m2";
  if (["ml", "m.l", "mètrelinéaire", "metrelineaire", "m"].includes(s)) return "ml";
  if (["m3", "m³", "m^3"].includes(s)) return "m3";
  if (["u", "unité", "unite", "pce", "pc", "ens"].includes(s)) return "u";
  if (["h", "heure", "heures"].includes(s)) return "h";
  if (["jour", "j", "jr"].includes(s)) return "jour";
  if (["kg"].includes(s)) return "kg";
  if (["t", "tonne", "tonnes"].includes(s)) return "t";
  if (["forfait", "fft"].includes(s)) return "forfait";
  return s;
}

export function formatQuantityLabel(qty: number, unit: string): string {
  const q =
    Number.isInteger(qty) || Math.abs(qty - Math.round(qty)) < 1e-9
      ? String(Math.round(qty))
      : qty.toFixed(2).replace(/\.?0+$/, "").replace(".", ",");
  return `${q} ${unit}`;
}

export const MEASURE_UNITS = ["m²", "ml", "m³", "U", "kg", "t", "h", "jour", "forfait"] as const;
