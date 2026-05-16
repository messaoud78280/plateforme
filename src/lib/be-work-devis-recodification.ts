import {
  BEWORK_DEVIS_FAMILY_LEXICON,
  generateBeWorkCode,
  suggestFamilyCodeFromLot,
} from "@/lib/bework-devis-family-codes";
import type { WorkItemStatus } from "@prisma/client";

const GENERIC_CODE_RE = /^BW-[A-Z]{3}-\d{3}$/;

/** Ouvrages issus de l’import type devis Martin (codes liés au devis client). */
export function isMartinImportCode(code: string): boolean {
  return /^BW-MARTIN-/i.test(code.trim());
}

/** Code BeWork canonique BW-XXX-NNN (3 lettres + 3 chiffres). */
export function isCanonicalBeWorkGenericCode(code: string): boolean {
  return GENERIC_CODE_RE.test(code.trim().toUpperCase());
}

/** Ex. BW-MARTIN-15-1 → 15.1 */
export function parseSourceLineFromMartinCode(code: string): string | null {
  const m = /^BW-MARTIN-(\d+)-(\d+)$/i.exec(code.trim());
  if (!m) return null;
  return `${m[1]}.${m[2]}`;
}

export type RecodeCandidateInput = {
  id: string;
  code: string;
  lot: string;
  family: string | null;
  title: string;
  status: WorkItemStatus;
  avgHt: number | null;
};

export type RecodeProposalRow = {
  id: string;
  currentCode: string;
  proposedNewCode: string;
  proposedSourceCode: string;
  proposedSourceLine: string | null;
  proposedFamilyCode: string;
  lot: string;
  family: string | null;
  title: string;
  status: WorkItemStatus;
  avgHt: number | null;
};

function maxSuffixForFamily(allCodes: Set<string>, family: string): number {
  const prefix = `BW-${family}-`;
  let max = 0;
  for (const c of allCodes) {
    const u = c.toUpperCase();
    if (!u.startsWith(prefix)) continue;
    const m = /^BW-[A-Z]{3}-(\d+)$/.exec(u);
    if (!m) continue;
    max = Math.max(max, Number.parseInt(m[1], 10));
  }
  return max;
}

/**
 * Propositions de recodification (ordre stable : lot, code).
 * `allWorkItemCodes` doit contenir tous les codes actuels en base (unicité).
 */
export function buildRecodificationProposals(
  candidates: RecodeCandidateInput[],
  allWorkItemCodes: Set<string>,
): RecodeProposalRow[] {
  const sorted = [...candidates].sort((a, b) => {
    const l = a.lot.localeCompare(b.lot, "fr", { sensitivity: "base" });
    if (l !== 0) return l;
    return a.code.localeCompare(b.code, "fr", { sensitivity: "base" });
  });

  const used = new Set(allWorkItemCodes);
  const counters = new Map<string, number>();
  for (const fam of BEWORK_DEVIS_FAMILY_LEXICON) {
    counters.set(fam.code.toUpperCase(), maxSuffixForFamily(used, fam.code.toUpperCase()));
  }

  const out: RecodeProposalRow[] = [];
  for (const c of sorted) {
    const fam = (suggestFamilyCodeFromLot(c.lot, c.family) ?? "GAR").toUpperCase();
    let n = (counters.get(fam) ?? 0) + 1;
    let nextCode = generateBeWorkCode(fam, n);
    while (used.has(nextCode)) {
      n += 1;
      nextCode = generateBeWorkCode(fam, n);
    }
    used.add(nextCode);
    counters.set(fam, n);

    out.push({
      id: c.id,
      currentCode: c.code,
      proposedNewCode: nextCode,
      proposedSourceCode: c.code,
      proposedSourceLine: parseSourceLineFromMartinCode(c.code),
      proposedFamilyCode: fam,
      lot: c.lot,
      family: c.family,
      title: c.title,
      status: c.status,
      avgHt: c.avgHt,
    });
  }
  return out;
}
