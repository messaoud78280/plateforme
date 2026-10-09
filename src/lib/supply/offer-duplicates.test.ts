/**
 * Tests anti-doublons SupplyOffer — données isolées.
 */
import assert from "node:assert/strict";
import {
  canonicalizeOfferUrl,
  findSupplyOfferDuplicateCandidates,
  normalizeProductRef,
} from "./offer-duplicates";

{
  assert.equal(normalizeProductRef("  AB-12  "), "ab-12");
  assert.equal(normalizeProductRef(""), null);
  assert.equal(
    canonicalizeOfferUrl("https://Shop.Example.com/p/1/?utm_source=x"),
    "https://shop.example.com/p/1",
  );
  console.log("normalize helpers OK");
}

{
  const base = {
    id: "a",
    supplierExternalOrgId: "sup1",
    productLabel: "Bloc",
    productRef: "REF-1",
    sourceUrl: "https://example.com/p/1",
    unitPrice: 1,
    archivedAt: null as string | null,
  };
  const dups = findSupplyOfferDuplicateCandidates({
    candidates: [base, { ...base, id: "b", productRef: "OTHER" }],
    input: {
      supplierExternalOrgId: "sup1",
      productRef: "ref-1",
      sourceUrl: null,
    },
  });
  assert.equal(dups.length, 1);
  assert.equal(dups[0].id, "a");
  assert.ok(dups[0].matchReasons.some((r) => r.includes("référence")));
  console.log("ref match OK");
}

{
  const dups = findSupplyOfferDuplicateCandidates({
    candidates: [
      {
        id: "c1",
        supplierExternalOrgId: "chausson",
        productLabel: "Parpaing",
        productRef: null,
        sourceUrl: null,
        unitPrice: null,
        archivedAt: null,
      },
    ],
    input: {
      supplierExternalOrgId: "chausson",
      productRef: null,
      sourceUrl: null,
    },
  });
  assert.equal(dups.length, 1, "même fournisseur sans identité → avertissement");
  console.log("weak supplier match OK");
}

{
  const dups = findSupplyOfferDuplicateCandidates({
    candidates: [
      {
        id: "x",
        supplierExternalOrgId: "a",
        productLabel: "Bloc 20",
        productRef: null,
        sourceUrl: null,
        unitPrice: null,
        archivedAt: null,
      },
    ],
    input: {
      supplierExternalOrgId: "b",
      productRef: null,
      sourceUrl: null,
    },
  });
  assert.equal(dups.length, 0, "fournisseurs différents → pas de match");
  console.log("no false positive on label OK");
}

console.log("offer-duplicates tests OK");
