/**
 * Tests unitaires classification familles BeWork Devis.
 * Usage : npx tsx scripts/test-bework-family-codes.ts
 */
import assert from "node:assert/strict";
import {
  DEFAULT_BEWORK_FAMILY_CODE,
  suggestFamilyCodeFromWorkItem,
} from "../src/lib/bework-devis-family-codes";

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

test("portail coulissant → MEX (pas GAR)", () => {
  const code = suggestFamilyCodeFromWorkItem({
    lot: "Garanties / Assurances / Frais contractuels",
    subLot: "Portails et portillons",
    title: "Portails coulissants en acier",
    itemType: "ouvrage_technique",
  });
  assert.equal(code, "MEX");
});

test("attestation garantie → GAR", () => {
  const code = suggestFamilyCodeFromWorkItem({
    lot: "Garanties",
    title: "Attestation de garantie décennale",
    itemType: "garantie_assurance",
  });
  assert.equal(code, "GAR");
});

test("ouvrage technique sans signal → repli DIV", () => {
  const code =
    suggestFamilyCodeFromWorkItem({
      lot: "Divers chantier",
      title: "Prestation diverse",
      itemType: "ouvrage_technique",
    }) ?? DEFAULT_BEWORK_FAMILY_CODE;
  assert.equal(code, DEFAULT_BEWORK_FAMILY_CODE);
});

test("terrassement explicite → TER", () => {
  const code = suggestFamilyCodeFromWorkItem({
    lot: "Terrassement",
    title: "Décapage terre végétale",
    itemType: "ouvrage_technique",
  });
  assert.equal(code, "TER");
});

console.log("\nTous les tests familles BeWork OK.\n");
