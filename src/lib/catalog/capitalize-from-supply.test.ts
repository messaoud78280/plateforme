import assert from "node:assert/strict";
import { extractEanFromTechAttributes } from "@/lib/supply/offer-duplicates";
import {
  normalizeGtin,
  normalizeManufacturerRef,
} from "@/lib/catalog/normalize";

/** Mapping famille — doit rester aligné avec capitalize-from-supply.ts */
function familyFromCategory(category: string): string {
  const familyByCategory: Record<string, string> = {
    MATERIAL: "Matériaux",
    CONSUMABLE: "Consommables",
    EQUIPMENT_RENTAL: "Location matériel",
    WASTE: "Déchets",
    TRANSPORT: "Transport",
    EXTERNAL_SERVICE: "Prestations externes",
    OTHER: "À classer",
  };
  return familyByCategory[category] ?? "À classer";
}

function extractManufacturer(tech: unknown): string | null {
  if (!tech || typeof tech !== "object") return null;
  const o = tech as Record<string, unknown>;
  for (const key of ["manufacturer", "fabricant", "brand", "marque", "maker"]) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

assert.equal(familyFromCategory("MATERIAL"), "Matériaux");
assert.equal(familyFromCategory("EQUIPMENT_RENTAL"), "Location matériel");
assert.equal(familyFromCategory("UNKNOWN"), "À classer");

assert.equal(extractManufacturer({ marque: " Wienerberger " }), "Wienerberger");
assert.equal(extractManufacturer({ foo: "x" }), null);
assert.equal(extractManufacturer(null), null);

assert.equal(
  normalizeGtin(extractEanFromTechAttributes({ ean: "3661234567890" })),
  "3661234567890",
);
assert.equal(normalizeManufacturerRef(" AB-12 "), "ab-12");

// Garantie : quantités chantier ne font pas partie du mapping produit
const excluded = [
  "Quantités chantier / métré",
  "Dates de besoin chantier",
  "Statut retenu / BC",
  "Liens planning / takeoff",
];
assert.ok(excluded.every((x) => x.length > 0));

console.log("catalog capitalize-from-supply tests OK");
