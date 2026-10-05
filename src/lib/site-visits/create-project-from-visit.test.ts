/**
 * Helpers création chantier depuis visite.
 * Usage: node --import tsx src/lib/site-visits/create-project-from-visit.test.ts
 */
import assert from "node:assert/strict";
import {
  proposeProjectTitle,
  splitVisitAddress,
} from "./create-project-from-visit";

assert.equal(
  proposeProjectTitle({
    clientName: "ROCKMAN",
    lots: ["Maçonnerie"],
  }),
  "Travaux de maçonnerie — ROCKMAN",
);

assert.equal(
  proposeProjectTitle({
    clientName: "ROCKMAN",
    lots: ["Maçonnerie", "Terrassement"],
  }),
  "Maçonnerie / Terrassement — ROCKMAN",
);

assert.ok(
  proposeProjectTitle({
    clientName: "ROCKMAN",
    lots: [],
    clientNeed: "Rénovation façade",
  }).includes("ROCKMAN"),
);

const split = splitVisitAddress({
  siteAddress: "34 boulevard Kennedy, 75006 Paris",
});
assert.equal(split.zipCode, "75006");
assert.equal(split.city, "Paris");
assert.ok(split.addressLine.toLowerCase().includes("kennedy"));

const fromPrep = splitVisitAddress({
  siteAddress: "34 boulevard Kennedy, 75006 Paris",
  prepZip: "75006",
  prepCity: "Paris",
});
assert.equal(fromPrep.zipCode, "75006");
assert.equal(fromPrep.city, "Paris");

console.log("create-project-from-visit.test.ts OK");
