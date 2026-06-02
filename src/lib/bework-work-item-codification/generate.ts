import { BEWORK_CODE_REGEX } from "@/lib/bework-work-item-codification/lexicon";

/** Préfixe sans variante : BW-GO-DEM-CLO */
export function buildCodificationPrefix(lotCode: string, familleCode: string, ouvrageCode: string): string {
  const lot = lotCode.trim().toUpperCase();
  const fam = familleCode.trim().toUpperCase();
  const ouv = ouvrageCode.trim().toUpperCase();
  if (!/^[A-Z]{2,3}$/.test(lot)) throw new Error(`Code lot invalide : ${lotCode}`);
  if (!/^[A-Z]{3}$/.test(fam)) throw new Error(`Code famille invalide : ${familleCode}`);
  if (!/^[A-Z]{3}$/.test(ouv)) throw new Error(`Code ouvrage invalide : ${ouvrageCode}`);
  return `BW-${lot}-${fam}-${ouv}`;
}

export function generateCodeBework(
  lotCode: string,
  familleCode: string,
  ouvrageCode: string,
  variantIndex: number,
): string {
  if (!Number.isInteger(variantIndex) || variantIndex < 1 || variantIndex > 999) {
    throw new Error(`Variante invalide : ${variantIndex} (1–999)`);
  }
  const prefix = buildCodificationPrefix(lotCode, familleCode, ouvrageCode);
  const num = String(variantIndex).padStart(3, "0");
  const code = `${prefix}-${num}`;
  if (!BEWORK_CODE_REGEX.test(code)) throw new Error(`Code généré invalide : ${code}`);
  return code;
}

export function parseVariantFromCodeBework(code: string): number | null {
  const m = /^BW-[A-Z]{2,3}-[A-Z]{3}-[A-Z]{3}-(\d{3})$/i.exec(code.trim());
  return m ? Number.parseInt(m[1], 10) : null;
}

export function maxVariantIndexForPrefix(existingCodes: Iterable<string>, prefix: string): number {
  const p = prefix.toUpperCase();
  let max = 0;
  for (const raw of existingCodes) {
    const c = raw.trim().toUpperCase();
    if (!c.startsWith(`${p}-`)) continue;
    const v = parseVariantFromCodeBework(c);
    if (v != null) max = Math.max(max, v);
  }
  return max;
}
