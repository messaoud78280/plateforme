/**
 * Helpers canoniques rendement — aucune I/O.
 * node --import tsx --test src/lib/preparation/schedule/productivity.test.ts
 */
import assert from "node:assert/strict";
import {
  formatProductivityDisplay,
  hasProductivity,
  isMissingProductivity,
  isProductivityExpected,
} from "./productivity";

assert.equal(hasProductivity(null), false);
assert.equal(hasProductivity(0), false);
assert.equal(hasProductivity(-1), false);
assert.equal(hasProductivity(12), true);
assert.equal(hasProductivity(6.5), true);

assert.equal(
  isProductivityExpected({ durationMode: "fixed", kind: "work" }),
  false,
);
assert.equal(
  isProductivityExpected({ durationMode: "manual", kind: "work" }),
  false,
);
assert.equal(
  isProductivityExpected({ durationMode: "computed", kind: "work" }),
  true,
);
assert.equal(
  isProductivityExpected({ durationMode: "computed", kind: "control" }),
  false,
);

assert.equal(
  isMissingProductivity({
    rateValue: null,
    durationMode: "computed",
    kind: "work",
  }),
  true,
);
assert.equal(
  isMissingProductivity({
    rateValue: 12,
    durationMode: "computed",
    kind: "work",
  }),
  false,
);
assert.equal(
  isMissingProductivity({
    rateValue: null,
    durationMode: "fixed",
    kind: "work",
  }),
  false,
);

assert.equal(
  formatProductivityDisplay({
    rateValue: 12,
    quantityUnit: "U",
    durationMode: "computed",
    kind: "work",
  }),
  "12 U/j",
);
assert.equal(
  formatProductivityDisplay({
    rateValue: 6,
    rateUnit: null,
    quantityUnit: "U",
    durationMode: "manual",
    kind: "work",
  }),
  "6 U/j",
);
assert.equal(
  formatProductivityDisplay({
    rateValue: null,
    durationMode: "computed",
    kind: "work",
  }),
  "Rendement à renseigner",
);
assert.equal(
  formatProductivityDisplay({
    rateValue: null,
    durationMode: "fixed",
    kind: "work",
  }),
  "—",
);

console.log("OK productivity helpers");
