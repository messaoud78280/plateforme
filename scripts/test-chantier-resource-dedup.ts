/**
 * Tests unitaires déduplication ressources chantier (cas 1–5).
 * Usage: npx tsx scripts/test-chantier-resource-dedup.ts
 */

import assert from "node:assert/strict";
import {
  buildDuplicateCleanupPreview,
  canMergeByGrouping,
  findMatchingExistingResource,
  resourceToDedupRow,
  type ResourceRowForDedup,
} from "../src/lib/chantier-resources/deduplication";
import {
  buildPriceObservationKey,
  buildResourceGroupingKey,
  normalizeResourceLabel,
} from "../src/lib/chantier-resources/normalize-label";
import { collectClassificationFixes } from "../src/lib/chantier-resources/classification";
import { suggestTaxonomyFromText } from "../src/lib/chantier-resources/taxonomy";
import type { SiteResource } from "@prisma/client";

function row(partial: Partial<ResourceRowForDedup> & Pick<ResourceRowForDedup, "id" | "shortName">): ResourceRowForDedup {
  return {
    fullDescription: partial.shortName,
    resourceType: "materiaux",
    family: "divers-materiaux",
    subFamily: null,
    orderUnit: "u",
    status: "a_verifier",
    confidenceLevel: "moyen",
    mainCharacteristics: null,
    siteUsage: null,
    businessNotes: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-06-01"),
    aliasCount: 0,
    variantCount: 0,
    workItemLinkCount: 0,
    priceObservationCount: 0,
    ...partial,
  };
}

function siteResourceStub(partial: Partial<SiteResource> & { id: string; shortName: string }): SiteResource {
  return {
    id: partial.id,
    shortName: partial.shortName,
    fullDescription: partial.shortName,
    resourceType: partial.resourceType ?? "materiaux",
    family: partial.family ?? "divers-materiaux",
    subFamily: partial.subFamily ?? null,
    orderUnit: partial.orderUnit ?? "u",
    siteUsage: null,
    mainCharacteristics: null,
    characteristicsToVerify: null,
    businessNotes: null,
    confidenceLevel: "moyen",
    status: partial.status ?? "a_verifier",
    normalizedDesignation: null,
    mergedIntoId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Cas 1 : 10 lignes strictement identiques
{
  const label = "Attestation de garantie de livraison, identification";
  const rows = Array.from({ length: 10 }, (_, i) =>
    row({
      id: `att-${i}`,
      shortName: label,
      resourceType: "services",
      family: "documents-administratifs-chantier",
      subFamily: "garanties-attestations",
    }),
  );
  const preview = buildDuplicateCleanupPreview(rows, new Map());
  assert.ok(preview.strictDuplicatesRemovable >= 9, "Cas 1 : au moins 9 doublons stricts supprimables");
  console.log("✓ Cas 1 — doublons stricts identiques");
}

// Cas 2 : même désignation, 3 prix différents
{
  const label = "Baignoire d'angle 145 x 145 cm balnéo eau/air";
  const ids = ["b1", "b2", "b3"];
  const rows = ids.map((id) => row({ id, shortName: label }));
  const priceMap = new Map([
    ["b1", [{ amountHT: 850, orderUnit: "u", sourceName: "A", sourceWorkItemId: null, notes: null, observationKey: buildPriceObservationKey(850, "u", "A") }]],
    ["b2", [{ amountHT: 920, orderUnit: "u", sourceName: "B", sourceWorkItemId: null, notes: null, observationKey: buildPriceObservationKey(920, "u", "B") }]],
    ["b3", [{ amountHT: 1050, orderUnit: "u", sourceName: "C", sourceWorkItemId: null, notes: null, observationKey: buildPriceObservationKey(1050, "u", "C") }]],
  ]);
  const preview = buildDuplicateCleanupPreview(rows, priceMap);
  const g = preview.groups.find((x) => x.canonicalShortName.includes("Baignoire"));
  assert.ok(g, "Cas 2 : groupe de fusion trouvé");
  assert.equal(g!.priceObservationsToAdd.length, 3, "Cas 2 : 3 prix conservés");
  console.log("✓ Cas 2 — prix différents fusionnés");
}

// Cas 3 : même désignation, sources différentes
{
  const label = "Colle carrelage flexible";
  const rows = [row({ id: "c1", shortName: label }), row({ id: "c2", shortName: label })];
  const priceMap = new Map([
    ["c1", [{ amountHT: 12, orderUnit: "u", sourceName: "Source A", sourceWorkItemId: "w1", notes: null, observationKey: buildPriceObservationKey(12, "u", "Source A") }]],
    ["c2", [{ amountHT: 12, orderUnit: "u", sourceName: "Source B", sourceWorkItemId: "w2", notes: null, observationKey: buildPriceObservationKey(12, "u", "Source B") }]],
  ]);
  const preview = buildDuplicateCleanupPreview(rows, priceMap);
  assert.ok(preview.sourcesPreserved >= 2, "Cas 3 : sources conservées");
  console.log("✓ Cas 3 — sources différentes");
}

// Cas 4 : Béton C25/30 vs C30/37 — ne pas fusionner
{
  const a = row({ id: "beton1", shortName: "Béton C25/30" });
  const b = row({ id: "beton2", shortName: "Béton C30/37" });
  assert.equal(canMergeByGrouping([a, b]), false, "Cas 4 : pas de fusion");
  const gk1 = buildResourceGroupingKey(a);
  const gk2 = buildResourceGroupingKey(b);
  assert.notEqual(gk1, gk2, "Cas 4 : clés de regroupement distinctes");
  console.log("✓ Cas 4 — bétons distincts non fusionnés");
}

// Cas 5 : Laine de verre 100 mm vs 200 mm
{
  const a = row({ id: "l1", shortName: "Laine de verre 100 mm" });
  const b = row({ id: "l2", shortName: "Laine de verre 200 mm" });
  assert.equal(canMergeByGrouping([a, b]), false, "Cas 5 : pas de fusion");
  console.log("✓ Cas 5 — épaisseurs distinctes non fusionnées");
}

// Classification attestation
{
  const tax = suggestTaxonomyFromText("Attestation de garantie de livraison");
  assert.equal(tax.family, "documents-administratifs-chantier");
  assert.equal(tax.subFamily, "garanties-attestations");
  console.log("✓ Classification documents administratifs");
}

// Clôture « jointifs » — ne doit pas partir en carrelage / joints
{
  const tax = suggestTaxonomyFromText(
    "Clôture bois plus occultante en panneaux de châtaignier jointifs, posée sur lisses et pieux",
  );
  assert.equal(tax.family, "amenagements-exterieurs");
  assert.equal(tax.subFamily, "clotures-portails");
  assert.notEqual(tax.family, "carrelage");
  console.log("✓ Clôture bois — aménagements extérieurs (pas carrelage)");
}

// Alias seul avec « jointifs » + titre clôture
{
  const fixes = collectClassificationFixes([
    {
      id: "fence-1",
      shortName: "Clôture bois plus occultante en panneaux de c...",
      fullDescription: null,
      resourceType: "materiaux",
      family: "carrelage",
      subFamily: "joints",
      aliasLabels: [
        "Clôture bois plus occultante en panneaux de châtaignier jointifs, posée sur lisses et pieux",
      ],
    },
  ]);
  assert.equal(fixes.length, 1);
  assert.equal(fixes[0]?.suggestedFamily, "amenagements-exterieurs");
  console.log("✓ Recatégorisation fiche clôture mal classée en carrelage");
}

// Joint carrelage réel
{
  const tax = suggestTaxonomyFromText("Mortier de joint carrelage intérieur 5 kg");
  assert.equal(tax.family, "carrelage");
  assert.equal(tax.subFamily, "joints");
  console.log("✓ Joint carrelage — famille carrelage");
}

// Normalisation dimensions
{
  const a = normalizeResourceLabel("145 x 145 cm");
  const b = normalizeResourceLabel("145x145 cm");
  assert.equal(a, b);
  console.log("✓ Normalisation dimensions");
}

// findMatchingExistingResource
{
  const existing = [resourceToDedupRow(siteResourceStub({ id: "x1", shortName: "Parpaing 20 creux" }))];
  const match = findMatchingExistingResource(existing, {
    shortName: "Parpaing 20 creux",
    resourceType: "materiaux",
    family: "maconnerie",
    orderUnit: "u",
  });
  assert.ok(match?.id === "x1");
  console.log("✓ Détection ressource existante à l'extraction");
}

console.log("\nTous les tests déduplication ressources chantier sont passés.");
