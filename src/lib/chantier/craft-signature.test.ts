/**
 * Tests signature métier — fixtures locales, aucune BDD.
 */
import assert from "node:assert/strict";
import {
  isLotScopeForSignature,
  resolveCraftKeyFromScope,
  resolveCraftsFromScopes,
  resolveLotsFromScopes,
  resolveSignatureDomainsFromScopes,
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

// Ordre déterministe même si insertion désordonnée
const shuffled = resolveCraftsFromScopes([
  { code: "L03", name: "Plomberie" },
  { code: "L01", name: "Terrassement" },
  { code: "L02", name: "Électricité" },
  { code: "L02b", name: "Courants forts" },
]);
assert.deepEqual(
  shuffled.map((c) => c.key),
  ["TER", "ELE", "PLO"],
);

assert.equal(
  resolveCraftKeyFromScope({ code: "L04", name: "Assainissement EP" }),
  "ASS",
);
assert.equal(resolveCraftKeyFromScope({ code: "VRD", name: "VRD / Réseaux" }), "VRD");
assert.equal(resolveCraftKeyFromScope({ code: "MAC", name: "Lot maçonnerie" }), "MAC");

// Lots issus de sections devis — pas de remap Démolition / Plomberie
const kitchenLots = [
  {
    code: "L01",
    name: "Lot 01 — Installation, protections et déposes",
    description:
      "Lot créé depuis le devis DEV-2026-0154 — section « Lot 01 — Installation, protections et déposes ».",
    status: "ACTIVE",
  },
  {
    code: "L02",
    name: "Lot 02 — Cuisine",
    description:
      "Lot créé depuis le devis DEV-2026-0154 — section « Lot 02 — Cuisine ».",
    status: "ACTIVE",
  },
  {
    code: "L03",
    name: "Lot 03 — Salle de bain",
    description:
      "Lot créé depuis le devis DEV-2026-0154 — section « Lot 03 — Salle de bain ».",
    status: "ACTIVE",
  },
  {
    code: "L04",
    name: "Lot 04 — Finitions et nettoyage",
    description:
      "Lot créé depuis le devis DEV-2026-0154 — section « Lot 04 — Finitions et nettoyage ».",
    status: "ACTIVE",
  },
];

assert.equal(isLotScopeForSignature(kitchenLots[0]!), true);
assert.equal(resolveCraftsFromScopes(kitchenLots).length, 0);
const lots = resolveLotsFromScopes(kitchenLots);
assert.equal(lots.length, 4);
assert.ok(lots.every((l) => l.key.startsWith("LOT:")));
assert.ok(lots.some((l) => l.label.includes("Lot 01")));
assert.ok(!lots.some((l) => l.label === "Démolition"));
assert.ok(!lots.some((l) => l.label === "Plomberie"));

const domains = resolveSignatureDomainsFromScopes(kitchenLots);
assert.equal(domains.crafts.length, 0);
assert.equal(domains.lots.length, 4);
assert.equal(domains.display.length, 4);

// Vrai scope métier continue de produire un badge métier
const mixed = resolveSignatureDomainsFromScopes([
  ...kitchenLots,
  { code: "ELE", name: "Électricité", status: "ACTIVE" },
]);
assert.ok(mixed.crafts.some((c) => c.key === "ELE"));
assert.equal(mixed.lots.length, 4);

console.log("craft-signature.test.ts OK");
