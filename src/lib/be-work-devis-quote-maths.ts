import { Prisma } from "@prisma/client";

/** TVA en pourcentage (ex. 20 pour 20 %). */
export function computeLineTotalsDecimal(
  quantity: Prisma.Decimal,
  unitPriceHT: Prisma.Decimal,
  vatRatePercent: Prisma.Decimal,
): { totalHT: Prisma.Decimal; totalVat: Prisma.Decimal; totalTTC: Prisma.Decimal } {
  const totalHT = quantity.mul(unitPriceHT);
  const totalVat = totalHT.mul(vatRatePercent).div(100);
  const totalTTC = totalHT.add(totalVat);
  return { totalHT, totalVat, totalTTC };
}

export function parseDecimalInput(raw: string, fallback: string): Prisma.Decimal {
  const t = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!t) return new Prisma.Decimal(fallback);
  try {
    return new Prisma.Decimal(t);
  } catch {
    return new Prisma.Decimal(fallback);
  }
}
