/**
 * Heuristiques génériques d’exclusion / zones pour devis PDF.
 * Pas de parser “Henrri-only” : indices de labels + structure.
 */

/** Mentions légales / footers — jamais des lignes d’ouvrage. */
export const LEGAL_OR_FOOTER_RE =
  /CLAUSE\s+DE\s+R[EÉ]SERVE\s+DE\s+PROPRI[EÉ]T[EÉ]|P[eé]nalit[eé]\s+de\s+retard|Escompte\s+pour\s+r[eè]glement|Indemnit[eé]\s+forfaitaire|Fait\s+avec\s+\w+|logiciel\s+de\s+facturation|article\s+L\s*441|Page\s+\d+\s*\/\s*\d+|Bon\s+pour\s+[Aa]ccord|N[°º]\s*TVA\s+Intracommunautaire|N[°º]\s*SIRET|Code\s+NAF/i;

export const TABLE_HEADER_RE =
  /^R[eé]f[eé]rence\s*[\t ].*D[eé]signation\s*[\t ].*Quantit/i;

export const PAGE_BREAK_RE = /^<<<PAGE>>>$/;

/** Ligne de montants tabulaire : qté | PU € | col milieu | HT € */
export const MONEY_ROW_RE =
  /^(\d+(?:[.,]\d+)?)\s*\t\s*([0-9\s\u00a0\u202f]+[.,]\d{2})\s*€?\s*\t\s*([0-9\s\u00a0\u202f]+[.,]?\d*)\s*\t\s*([0-9\s\u00a0\u202f]+[.,]\d{2})\s*€?\s*$/;

/** Variante sans tab (espaces). */
export const MONEY_ROW_SPACES_RE =
  /^(\d+(?:[.,]\d+)?)\s+([0-9\s\u00a0\u202f]+[.,]\d{2})\s*€\s+([0-9\s\u00a0\u202f]+[.,]?\d*)\s+([0-9\s\u00a0\u202f]+[.,]\d{2})\s*€\s*$/;

export function isTableHeaderLine(line: string): boolean {
  const n = line.replace(/\s+/g, " ").trim();
  return TABLE_HEADER_RE.test(n) || /^R[eé]f[eé]rence\tD[eé]signation\tQuantit/i.test(line);
}

export function isLegalOrFooterLine(line: string): boolean {
  return LEGAL_OR_FOOTER_RE.test(line);
}

/** Zone signature / bon pour accord — dates à ignorer pour l’émission. */
export function stripSignatureZone(text: string): string {
  return text.replace(
    /Bon\s+pour\s+[Aa]ccord[\s\S]{0,400}$/i,
    "",
  );
}

/** Retire blocs juridiques longs (conservés hors parsing lignes). */
export function stripLegalBlocks(text: string): string {
  let out = text;
  out = out.replace(
    /CLAUSE\s+DE\s+R[EÉ]SERVE\s+DE\s+PROPRI[EÉ]T[EÉ]\s*:[\s\S]*?(?=Page\s+\d+\s*\/\s*\d+|Monsieur\s+|Madame\s+|DEVIS\s+N|Total\s+HT|<<<PAGE>>>|$)/gi,
    "\n",
  );
  out = out.replace(/P[eé]nalit[eé]\s+de\s+retard\s*:[\s\S]*?(?=Page\s+\d+|Monsieur\s+|<<<PAGE>>>|$)/gi, "\n");
  out = out.replace(/Le\s+montant\s+de\s+l['']indemnit[eé]\s+forfaitaire[\s\S]*?(?=Page\s+\d+|Monsieur\s+|<<<PAGE>>>|$)/gi, "\n");
  out = out.replace(/Fait\s+avec\s+[^\n]+/gi, "\n");
  return out;
}

export function normalizeImportLine(line: string): string {
  return line.replace(/\u0000/g, "").replace(/\r/g, "").trimEnd();
}
