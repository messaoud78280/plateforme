/**
 * Smoke unitaire — résolution plan source (sans BDD).
 */
import assert from "node:assert/strict";
import {
  normalizePrepSources,
  planSourceDisplayTitle,
  primaryPrepSource,
} from "../src/lib/preparation/plan-source";

const raw = [
  {
    id: "SRC-C01",
    filename: "plan de fondation.pdf",
    planNumber: "C-01",
    title: "Plan Niveau Fondations",
    revision: null,
    scale: "1:50",
    page: 1,
    isRaster: true,
    legibility: "partielle",
    note: "test",
  },
];

const sources = normalizePrepSources(raw);
assert.equal(sources.length, 1);
assert.equal(sources[0]!.chantierFileId, null);
assert.equal(sources[0]!.planNumber, "C-01");

const primary = primaryPrepSource(raw);
assert.ok(primary);
assert.equal(planSourceDisplayTitle(primary!), "Plan d'exécution C-01");

const withFile = normalizePrepSources([
  { ...raw[0], chantierFileId: "file-abc", revision: "R1" },
]);
assert.equal(withFile[0]!.chantierFileId, "file-abc");
assert.equal(withFile[0]!.revision, "R1");

console.log("OK plan-source unit");
