/**
 * Tests classification cartes vue lot — fixtures locales, aucune BDD.
 */
import assert from "node:assert/strict";
import {
  classifyFollowUpRelation,
  classifyPlanRelation,
  classifyQuoteRelation,
  classifyStudyRelation,
  isLotProjectScope,
  matchQuoteSectionForScope,
  sumSectionSellHt,
} from "./scope-card-relation";

// CAS 1 — entity scope-specific
assert.equal(
  classifyStudyRelation({
    studyScopeId: "scope-l01",
    currentScopeId: "scope-l01",
    usedFallback: false,
  }),
  "SCOPE_SPECIFIC",
);

// CAS 2 — global fallback
assert.equal(
  classifyStudyRelation({
    studyScopeId: null,
    currentScopeId: "scope-l01",
    usedFallback: true,
  }),
  "GLOBAL_FALLBACK",
);
assert.equal(
  classifyPlanRelation({
    planScopeId: null,
    currentScopeId: "scope-l01",
    hasPlan: true,
  }),
  "GLOBAL_FALLBACK",
);

// CAS 3 — quote multi-lots / section
const sections = [
  {
    sectionId: "sec-l01",
    title: "Lot 01 — Installation, protections et déposes",
    sortOrder: 0,
    totalSellHt: sumSectionSellHt([
      { lineSellHt: 1000, kind: "WORK", isOptional: false },
      { lineSellHt: 900, kind: "WORK", isOptional: false },
    ]),
    lineCount: 2,
  },
  {
    sectionId: "sec-l02",
    title: "Lot 02 — Cuisine",
    sortOrder: 1,
    totalSellHt: 7500,
    lineCount: 4,
  },
];
assert.equal(sections[0]!.totalSellHt, 1900);

const matched = matchQuoteSectionForScope(
  {
    code: "L01",
    name: "Lot 01 — Installation, protections et déposes",
    description:
      "Lot créé depuis le devis DEV-2026-0154 — section « Lot 01 — Installation, protections et déposes ».",
  },
  sections,
);
assert.equal(matched?.sectionId, "sec-l01");
assert.equal(matched?.totalSellHt, 1900);

assert.equal(
  classifyQuoteRelation({
    hasQuote: true,
    sectionMatched: true,
    quoteScopeId: "scope-l01",
    currentScopeId: "scope-l01",
  }),
  "SECTION_SPECIFIC",
);

// Montant lot ≠ total devis
const quoteTotal = 16793.35;
assert.notEqual(matched!.totalSellHt, quoteTotal);

// CAS 4 — suivi
assert.equal(
  classifyFollowUpRelation({ hasScopeSpecific: false, hasGlobal: true }),
  "GLOBAL_FALLBACK",
);
assert.notEqual(
  classifyFollowUpRelation({ hasScopeSpecific: false, hasGlobal: true }),
  "ABSENT",
);

assert.equal(
  isLotProjectScope({
    code: "L01",
    name: "Lot 01 — Installation, protections et déposes",
    description:
      "Lot créé depuis le devis DEV-2026-0154 — section « Lot 01 — Installation, protections et déposes ».",
  }),
  true,
);
assert.equal(
  isLotProjectScope({ code: "PLO", name: "Plomberie" }),
  false,
);

console.log("scope-card-relation.test.ts OK");
