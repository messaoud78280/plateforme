import { Prisma } from "@prisma/client";

/** Parse une saisie manuelle (250, 250.00, 250,00) — vide → null. */
export function parseManualPriceHt(raw: string): Prisma.Decimal | null {
  const t = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!t) return null;
  try {
    const d = new Prisma.Decimal(t);
    if (d.isNegative()) throw new Error("Le prix manuel HT ne peut pas être négatif.");
    return d;
  } catch (e) {
    if (e instanceof Error && e.message.includes("négatif")) throw e;
    throw new Error("Prix manuel HT invalide — saisissez un montant (ex. 250, 250.00 ou 250,00).");
  }
}

/** Valeur initiale pour le champ de formulaire. */
export function formatManualPriceHtForInput(value: Prisma.Decimal | null | undefined): string {
  if (value == null) return "";
  return value.toFixed(2).replace(".", ",");
}

export function manualPriceHtToNumber(value: Prisma.Decimal | null | undefined): number | null {
  if (value == null) return null;
  return value.toNumber();
}

const MANUAL_PRICE_JSON_KEYS = ["prix_manuel_ht", "manualPriceHt", "manual_price_ht"] as const;

/** undefined = clé absente du JSON ; null = explicitement vide. */
export function readManualPriceFromJson(
  fiche: Record<string, unknown>,
  mere: Record<string, unknown>,
): Prisma.Decimal | null | undefined {
  for (const obj of [mere, fiche]) {
    for (const key of MANUAL_PRICE_JSON_KEYS) {
      if (!(key in obj)) continue;
      const v = obj[key];
      if (v == null || v === "") return null;
      if (typeof v === "number") return parseManualPriceHt(String(v));
      return parseManualPriceHt(String(v));
    }
  }
  return undefined;
}
