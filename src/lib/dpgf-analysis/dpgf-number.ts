import type { DpgfAnalysisSheetLinks } from "./types";

export type ParsedDpgfNumber = {
  raw: string;
  major: number;
  suffix: string;
};

/** Résout le N° DPGF depuis links ou index ligne DCE — sans migration base. */
export function resolveNumeroDpgf(
  links: DpgfAnalysisSheetLinks | null | undefined,
  dceLineIndex: number | null | undefined,
): string | null {
  const fromLinks = links?.numeroDpgf?.trim();
  if (fromLinks) return fromLinks;
  if (dceLineIndex != null && dceLineIndex >= 0) return String(dceLineIndex);
  return null;
}

export function parseDpgfNumber(raw: string | null | undefined): ParsedDpgfNumber | null {
  if (!raw?.trim()) return null;
  const t = raw.trim().toUpperCase();
  const m = t.match(/^(\d+)(?:-([A-Z]))?$/);
  if (!m) return null;
  return { raw: raw.trim(), major: parseInt(m[1], 10), suffix: m[2] ?? "" };
}

export function compareDpgfNumbers(a: string | null | undefined, b: string | null | undefined): number {
  const pa = a ? parseDpgfNumber(a) : null;
  const pb = b ? parseDpgfNumber(b) : null;
  if (!pa && !pb) return 0;
  if (!pa) return 1;
  if (!pb) return -1;
  if (pa.major !== pb.major) return pa.major - pb.major;
  return pa.suffix.localeCompare(pb.suffix, "fr");
}

export function formatDpgfRange(numbers: (string | null | undefined)[]): string | null {
  const parsed = numbers.map((n) => parseDpgfNumber(n)).filter(Boolean) as ParsedDpgfNumber[];
  if (parsed.length === 0) return null;
  parsed.sort((a, b) => compareDpgfNumbers(a.raw, b.raw));
  const first = parsed[0].raw;
  const last = parsed[parsed.length - 1].raw;
  if (first === last) return first;
  return `${first} à ${last}`;
}

/** Détecte les numéros entiers manquants dans une séquence (101, 103 → 102 manquant). */
export function findMissingDpgfNumbers(numbers: (string | null | undefined)[]): string[] {
  const majors = numbers
    .map((n) => parseDpgfNumber(n))
    .filter((p): p is ParsedDpgfNumber => p != null && !p.suffix)
    .map((p) => p.major)
    .sort((a, b) => a - b);

  const unique = [...new Set(majors)];
  if (unique.length < 2) return [];

  const missing: string[] = [];
  for (let i = 1; i < unique.length; i++) {
    for (let n = unique[i - 1] + 1; n < unique[i]; n++) {
      missing.push(String(n));
    }
  }
  return missing;
}

export function countDuplicateDpgfNumbers(numbers: (string | null | undefined)[]): number {
  const seen = new Map<string, number>();
  let dupes = 0;
  for (const n of numbers) {
    const key = n?.trim().toUpperCase();
    if (!key) continue;
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    if (count === 2) dupes += 1;
  }
  return dupes;
}
