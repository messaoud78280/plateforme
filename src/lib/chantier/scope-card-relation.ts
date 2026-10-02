/**
 * Classification périmètre des cartes vue lot / ProjectScope.
 * Pure — aucune écriture DB. Les fallbacks techniques restent autorisés ;
 * seule la sémantique d’affichage change (global ≠ spécifique).
 */

import { d } from "@/lib/commercial/decimal";
import { fromCents, toCents } from "@/lib/commercial/money";

export type ScopeCardRelation =
  | "SCOPE_SPECIFIC"
  | "SECTION_SPECIFIC"
  | "GLOBAL_FALLBACK"
  | "ABSENT";

export type QuoteSectionAmount = {
  sectionId: string;
  title: string;
  sortOrder: number;
  totalSellHt: number;
  lineCount: number;
};

function normalizeLotLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Total HT section = somme des lineSellHt inclus (même logique document). */
export function sumSectionSellHt(
  lines: Array<{
    lineSellHt: unknown;
    isOptional?: boolean | null;
    kind?: string | null;
  }>,
): number {
  let sell = 0;
  for (const line of lines) {
    const kind = line.kind ?? "WORK";
    if (kind === "COMMENT" || kind === "SUBTOTAL") continue;
    if (line.isOptional) continue;
    sell += toCents(d(line.lineSellHt));
  }
  return fromCents(sell);
}

/**
 * Associe une section devis au scope via les conventions produit existantes :
 * 1) description « Lot créé depuis le devis … — section « TITLE » »
 * 2) normalizeLotLabel(name) === section.title (même règle que previewScopesFromQuoteSections)
 * 3) code section dérivé (L01…) === scope.code
 *
 * Pas de matching flou / mot-clé métier.
 */
export function matchQuoteSectionForScope(
  scope: { name: string; code: string; description?: string | null },
  sections: QuoteSectionAmount[],
): QuoteSectionAmount | null {
  if (sections.length === 0) return null;

  const fromDesc = scope.description?.match(
    /section\s+«\s*([^»]+?)\s*»/i,
  )?.[1];
  if (fromDesc) {
    const key = normalizeLotLabel(fromDesc);
    const hit = sections.find((s) => normalizeLotLabel(s.title) === key);
    if (hit) return hit;
  }

  const byName = normalizeLotLabel(scope.name);
  const nameHit = sections.find((s) => normalizeLotLabel(s.title) === byName);
  if (nameHit) return nameHit;

  const code = scope.code?.trim().toUpperCase() ?? "";
  if (code) {
    const strict = sections.find((s) => {
      const lotNum = s.title.match(/\blot\s*0*(\d+)\b/i);
      if (!lotNum?.[1]) return false;
      return `L${String(lotNum[1]).padStart(2, "0")}` === code;
    });
    if (strict) return strict;
  }

  return null;
}

export function classifyStudyRelation(input: {
  studyScopeId: string | null | undefined;
  currentScopeId: string;
  usedFallback: boolean;
}): ScopeCardRelation {
  if (input.studyScopeId == null && !input.usedFallback) {
    // study present but unscoped — treated as chantier-level
    return "GLOBAL_FALLBACK";
  }
  if (input.studyScopeId === input.currentScopeId) return "SCOPE_SPECIFIC";
  if (input.studyScopeId == null || input.usedFallback) return "GLOBAL_FALLBACK";
  return "GLOBAL_FALLBACK";
}

export function classifyPlanRelation(input: {
  planScopeId: string | null | undefined;
  currentScopeId: string;
  hasPlan: boolean;
}): ScopeCardRelation {
  if (!input.hasPlan) return "ABSENT";
  if (input.planScopeId === input.currentScopeId) return "SCOPE_SPECIFIC";
  return "GLOBAL_FALLBACK";
}

export function classifyQuoteRelation(input: {
  hasQuote: boolean;
  sectionMatched: boolean;
  quoteScopeId: string | null | undefined;
  currentScopeId: string;
}): ScopeCardRelation {
  if (!input.hasQuote) return "ABSENT";
  if (input.sectionMatched) return "SECTION_SPECIFIC";
  if (input.quoteScopeId === input.currentScopeId) return "SCOPE_SPECIFIC";
  return "GLOBAL_FALLBACK";
}

export function classifyFollowUpRelation(input: {
  hasScopeSpecific: boolean;
  hasGlobal: boolean;
}): ScopeCardRelation {
  if (input.hasScopeSpecific) return "SCOPE_SPECIFIC";
  if (input.hasGlobal) return "GLOBAL_FALLBACK";
  return "ABSENT";
}

export function relationBadgeLabel(relation: ScopeCardRelation): string | null {
  switch (relation) {
    case "GLOBAL_FALLBACK":
      return "Global chantier";
    case "SECTION_SPECIFIC":
      return "Section devis";
    case "SCOPE_SPECIFIC":
      return null;
    case "ABSENT":
      return null;
    default:
      return null;
  }
}

/**
 * Scope issu d’une section devis (lot), vs métier nommé.
 * Structurel : description de création, ou libellé « Lot NN — … », ou code Lnn
 * avec nom qui commence par « Lot ».
 */
export function isLotProjectScope(scope: {
  code: string;
  name: string;
  description?: string | null;
  referenceQuoteId?: string | null;
}): boolean {
  const desc = scope.description?.trim() ?? "";
  if (/Lot créé depuis le devis/i.test(desc) && /section\s+«/i.test(desc)) {
    return true;
  }
  const name = scope.name?.trim() ?? "";
  if (/^Lot\s+\d+/i.test(name)) return true;
  const code = scope.code?.trim().toUpperCase() ?? "";
  if (/^L\d{1,3}$/.test(code) && /^Lot\b/i.test(name)) return true;
  return false;
}
