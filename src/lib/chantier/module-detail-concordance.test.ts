/**
 * Concordance inter-écrans : syncState fiche chantier === syncState détail module.
 * npx tsx src/lib/chantier/module-detail-concordance.test.ts
 */
import assert from "node:assert/strict";
import { buildQuoteDetailState } from "./quote-detail-state";
import { buildPlanningDetailState } from "./planning-detail-state";
import {
  evaluateQuoteCoreState,
  evaluatePlanningCoreState,
} from "./core-preparation-state";

const quoteCases = [
  {
    name: "VALIDATED A_JOUR",
    commercialStatus: "VALIDATED",
    hasMetreProvenance: true,
    currentStudyVersion: 4,
    transferStudyVersion: 4,
    hasSignificantQuantityDiffs: false as boolean | null,
  },
  {
    name: "VALIDATED stale",
    commercialStatus: "VALIDATED",
    hasMetreProvenance: true,
    currentStudyVersion: 4,
    transferStudyVersion: 1,
    hasSignificantQuantityDiffs: null as boolean | null,
  },
  {
    name: "DRAFT stale",
    commercialStatus: "DRAFT",
    hasMetreProvenance: true,
    currentStudyVersion: 4,
    transferStudyVersion: 3,
    hasSignificantQuantityDiffs: null as boolean | null,
  },
  {
    name: "ACCEPTED stale",
    commercialStatus: "ACCEPTED",
    hasMetreProvenance: true,
    currentStudyVersion: 5,
    transferStudyVersion: 2,
    hasSignificantQuantityDiffs: null as boolean | null,
  },
];

for (const c of quoteCases) {
  const core = evaluateQuoteCoreState({
    quote: { status: c.commercialStatus },
    hasMetreProvenance: c.hasMetreProvenance,
    currentStudyVersion: c.currentStudyVersion,
    transferStudyVersion: c.transferStudyVersion,
    hasSignificantQuantityDiffs: c.hasSignificantQuantityDiffs,
  });
  const detail = buildQuoteDetailState({
    commercialStatus: c.commercialStatus,
    hasMetreProvenance: c.hasMetreProvenance,
    currentStudyVersion: c.currentStudyVersion,
    transferStudyVersion: c.transferStudyVersion,
    hasSignificantQuantityDiffs: c.hasSignificantQuantityDiffs,
  });
  assert.equal(
    core.syncState,
    detail.syncState,
    `QUOTE ${c.name}: core.syncState !== detail.syncState`,
  );
  assert.equal(core.commercialStatus, detail.commercialStatus);
  console.log(`QUOTE ${c.name}: concordance syncState=${detail.syncState}`);
}

const planCases = [
  {
    name: "CURRENT A_JOUR",
    status: "CURRENT",
    studyVersionAtGeneration: 4 as number | null,
    currentStudyVersion: 4 as number | null,
  },
  {
    name: "CURRENT stale",
    status: "CURRENT",
    studyVersionAtGeneration: 1 as number | null,
    currentStudyVersion: 4 as number | null,
  },
  {
    name: "null generation",
    status: "CURRENT",
    studyVersionAtGeneration: null as number | null,
    currentStudyVersion: 4 as number | null,
  },
];

for (const c of planCases) {
  const core = evaluatePlanningCoreState({
    plan: {
      status: c.status,
      studyVersionAtGeneration: c.studyVersionAtGeneration,
    },
    currentStudyVersion: c.currentStudyVersion,
  });
  const detail = buildPlanningDetailState({
    status: c.status,
    studyVersionAtGeneration: c.studyVersionAtGeneration,
    currentStudyVersion: c.currentStudyVersion,
  });
  assert.equal(
    core.syncState,
    detail.syncState,
    `PLAN ${c.name}: core.syncState !== detail.syncState`,
  );
  console.log(`PLAN ${c.name}: concordance syncState=${detail.syncState}`);
}

console.log("\nmodule-detail-concordance: ALL PASS");
