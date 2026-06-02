import { BEWORK_CODE_REGEX } from "@/lib/bework-work-item-codification/lexicon";
import { normalizeBeWorkMatchString } from "@/lib/bework-devis-family-codes";

export function normalizeCodificationHaystack(parts: (string | null | undefined)[]): string {
  return normalizeBeWorkMatchString(parts.filter(Boolean).join(" "));
}

/** Détecte la source d’import à partir du code et du contexte. */
export function inferImportSource(code: string, sourceCode: string | null): string | null {
  const c = (sourceCode ?? code).trim();
  if (/^\d+(\.\d+)+$/.test(c)) return "Artiprix";
  if (/^BW-MARTIN-/i.test(c)) return "Martin";
  if (/^BW-[A-Z]+-/i.test(c) && c.length > 12) return "BeWork";
  if (/^VRD-/i.test(c)) return "VRD interne";
  if (/^[A-Z]{2,4}-[A-Z]\d+/i.test(c)) return "Code interne";
  return null;
}

/** Chapitre Artiprix (ex. 1.11.1 → 1.11). */
export function artiprixChapterFromCode(code: string): string | null {
  const m = /^(\d+\.\d+)(?:\.\d+)?$/.exec(code.trim());
  return m?.[1] ?? null;
}

export function isLegacyStructuredCode(code: string): boolean {
  const c = code.trim();
  if (BEWORK_CODE_REGEX.test(c)) return false;
  if (/^\d+(\.\d+)+$/.test(c)) return true;
  if (/^BW-MARTIN-/i.test(c)) return true;
  if (/^BW-[A-Z]{3}-\d{3}$/i.test(c)) return true;
  if (/^BW-[A-Z]+-[A-Z]+/i.test(c) && c.length > 10) return true;
  if (/^[A-Z]{2,4}-[A-Z0-9]+$/i.test(c)) return true;
  return false;
}

export function isBeworkStructuredCode(code: string | null | undefined): boolean {
  if (!code?.trim()) return false;
  return BEWORK_CODE_REGEX.test(code.trim().toUpperCase());
}

export function codificationGroupKey(
  lotCode: string,
  familleCode: string,
  sousFamilleCode: string,
  normalizedDesignation: string,
): string {
  const stem = normalizedDesignation.slice(0, 72);
  return `${lotCode}|${familleCode}|${sousFamilleCode}|${stem}`;
}
