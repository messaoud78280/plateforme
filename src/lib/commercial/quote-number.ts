/**
 * Format de référence devis (extensible plus tard : préfixe custom, padding…).
 * Défaut : {PREFIX}-{ANNEE}-{COMPTEUR_4_CHIFFRES}
 */

export function padQuoteSeq(n: number): string {
  return String(n).padStart(4, "0");
}

export function formatQuoteNumber(
  prefix: string,
  seq: number,
  year: number = new Date().getFullYear(),
): string {
  const p = (prefix || "DEV").trim() || "DEV";
  return `${p}-${year}-${padQuoteSeq(seq)}`;
}

/** Affichage client : V1 invisible ; révisions → suffixe -R1, -R2… */
export function clientFacingQuoteNumber(
  number: string,
  versionNumber?: number | null,
): string {
  if (versionNumber != null && versionNumber > 1) {
    return `${number}-R${versionNumber - 1}`;
  }
  return number;
}

export function parseQuoteSeqInput(raw: unknown): number | null {
  if (raw === undefined || raw === null || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(String(raw).trim());
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) return null;
  return n;
}
