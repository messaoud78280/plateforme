import assert from "node:assert/strict";
import {
  canonicalizeCatalogUrl,
  normalizeDesignation,
  normalizeGtin,
  normalizeManufacturerRef,
} from "./normalize";

assert.equal(normalizeDesignation("  Bloc  Béton  20cm "), "bloc beton 20cm");
assert.equal(normalizeManufacturerRef(" AB-12 "), "ab-12");
assert.equal(normalizeGtin("3661234567890"), "3661234567890");
assert.equal(normalizeGtin("abc"), null);
assert.equal(
  canonicalizeCatalogUrl("https://Shop.Example.com/p/1/?utm_source=x"),
  "https://shop.example.com/p/1",
);
console.log("catalog normalize tests OK");
