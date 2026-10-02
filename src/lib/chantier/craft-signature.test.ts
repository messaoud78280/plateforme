/**
 * Tests signature métier — fixtures locales, aucune BDD.
 */
import assert from "node:assert/strict";
import {
  resolveCraftKeyFromScope,
  resolveCraftsFromScopes,
} from "./craft-signature";

const crafts = resolveCraftsFromScopes([
  { code: "L01", name: "Terrassement" },
  { code: "L02", name: "Électricité" },
  { code: "L03", name: "Plomberie" },
  { code: "L02b", name: "Courants forts" },
]);
assert.deepEqual(
  crafts.map((c) => c.key),
  ["TER", "ELE", "PLO"],
);
assert.ok(crafts[0]?.accent);

assert.equal(
  resolveCraftKeyFromScope({ code: "L04", name: "Assainissement EP" }),
  "ASS",
);
assert.equal(resolveCraftKeyFromScope({ code: "VRD", name: "VRD / Réseaux" }), "VRD");
assert.equal(resolveCraftKeyFromScope({ code: "MAC", name: "Lot maçonnerie" }), "MAC");

console.log("craft-signature.test.ts OK");
