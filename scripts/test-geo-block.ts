/**
 * Tests unitaires blocage géographique.
 * Usage: npx tsx scripts/test-geo-block.ts
 */

import assert from "node:assert/strict";
import {
  detectCountryCode,
  isCountryBlocked,
  parseBlockedCountries,
  shouldSkipGeoBlock,
} from "../src/lib/geo-block";
import { NextRequest } from "next/server";

assert.deepEqual(parseBlockedCountries("MA"), ["MA"]);
assert.deepEqual(parseBlockedCountries("ma, dz , MA"), ["MA", "DZ"]);
assert.deepEqual(parseBlockedCountries(""), []);
assert.deepEqual(parseBlockedCountries(undefined), []);

assert.equal(shouldSkipGeoBlock("/robots.txt"), true);
assert.equal(shouldSkipGeoBlock("/sitemap.xml"), true);
assert.equal(shouldSkipGeoBlock("/_next/static/chunk.js"), true);
assert.equal(shouldSkipGeoBlock("/access-denied"), true);
assert.equal(shouldSkipGeoBlock("/"), false);
assert.equal(shouldSkipGeoBlock("/contact"), false);

const reqMa = new NextRequest("http://localhost:3000/", {
  headers: { "cf-ipcountry": "MA" },
});
assert.equal(detectCountryCode(reqMa), "MA");
assert.equal(isCountryBlocked("MA", ["MA"]), true);
assert.equal(isCountryBlocked("FR", ["MA"]), false);

const reqFr = new NextRequest("http://localhost:3000/", {
  headers: { "cf-ipcountry": "FR" },
});
assert.equal(detectCountryCode(reqFr), "FR");

console.log("✓ Tous les tests geo-block sont passés.");
