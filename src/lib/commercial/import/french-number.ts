/**
 * Normalisation monétaire / numérique française (import + éditeur commercial).
 */

/** Parse « 1 230,00 € », « 981,45 », « 10 % », « 12,50 » → number | null */
export function parseFrenchNumber(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  let s = String(raw)
    .replace(/\u00a0/g, " ")
    .replace(/\u202f/g, " ")
    .trim();
  if (!s) return null;

  const percent = /%\s*$/.test(s);
  s = s.replace(/%/g, "").replace(/€/gi, "").replace(/\s/g, "").trim();
  if (!s || s === "-" || s === "—") return null;

  // 1.234,56 (EU) vs 1,234.56 (US) — pour devis FR : virgule = décimale
  if (/,/.test(s) && /\./.test(s)) {
    // dernier séparateur = décimal
    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    if (lastComma > lastDot) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (/,/.test(s)) {
    s = s.replace(",", ".");
  }

  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return percent ? n : n;
}

/** Alias éditeur — même source de vérité que l’import. */
export function parseFrenchDecimal(raw: string | null | undefined): number | null {
  return parseFrenchNumber(raw);
}

/**
 * Autorise la frappe en cours : "", "12", "12,", "12,5", "-", ".", ","
 * (sans valider encore comme nombre final).
 */
export function isPartialFrenchDecimalInput(raw: string): boolean {
  const s = String(raw)
    .replace(/\u00a0/g, " ")
    .replace(/\u202f/g, " ")
    .replace(/\s/g, "")
    .trim();
  if (s === "") return true;
  return /^-?\d*[.,]?\d*$/.test(s);
}

/** Affichage saisie (sans séparateur de milliers — adapté aux inputs). */
export function formatFrenchDecimalInput(
  n: number,
  maxFractionDigits = 4,
): string {
  if (!Number.isFinite(n)) return "";
  return new Intl.NumberFormat("fr-FR", {
    useGrouping: false,
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  }).format(n);
}

export function formatMoneyFr(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

/** Tolérance monétaire (centimes). */
export function moneyClose(a: number, b: number, tol = 0.02): boolean {
  return Math.abs(a - b) <= tol;
}
