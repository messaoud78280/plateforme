/** Formatage PDF (espaces insécables → espaces imprimables). */

export function pdfSafe(raw: string): string {
  return raw.replace(/\u202f/g, " ").replace(/\u00a0/g, " ");
}

export function fmtEur(n: number): string {
  return pdfSafe(
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n),
  );
}

export function fmtDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Date longue type « 12 août 2026 » — en-tête devis. */
export function fmtDateLong(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function fmtQty(n: number): string {
  if (Number.isInteger(n)) {
    return pdfSafe(new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n));
  }
  return pdfSafe(
    new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n),
  );
}

export function fmtPct(n: number): string {
  return pdfSafe(
    new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(n),
  );
}

/** Ne retourne que les lignes non vides (jamais « undefined »). */
export function compactLines(parts: Array<string | null | undefined>): string[] {
  return parts.map((p) => (p ?? "").trim()).filter(Boolean);
}
