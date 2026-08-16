/**
 * GED-UI-3 — tests classification catégories (déterministe, sans DB).
 * npx tsx scripts/test-ged-ui3-categories.ts
 */
import assert from "node:assert/strict";
import {
  buildCategoryStats,
  formatCategoryCounts,
  inferHubCategory,
} from "../src/lib/ged/hub-categories";
import { classifyDocumentType } from "../src/lib/ged/classify-document";

function cat(opts: Parameters<typeof inferHubCategory>[0]) {
  return inferHubCategory(opts);
}

// SETRIM — fichiers cibles
assert.equal(
  cat({ name: "Fiche-technique-membrane-Soprema.pdf" }),
  "fiches_techniques",
);
assert.equal(cat({ name: "Fiche-technique-isolant.pdf" }), "fiches_techniques");
assert.equal(
  cat({ name: "DOE-Fiche-technique-etancheite.pdf" }),
  "doe",
);
assert.equal(cat({ name: "FAC-2026-014.pdf" }), "factures_situations");
assert.equal(cat({ name: "DEV-2026-014.pdf" }), "devis_avenants");

// Sources structurées > nom
assert.equal(
  cat({
    name: "Fiche-technique-membrane-Soprema.pdf",
    entityTypes: ["doe_item"],
  }),
  "doe",
);
assert.equal(
  cat({
    name: "random.pdf",
    documentType: "FICHE_TECHNIQUE",
  }),
  "fiches_techniques",
);
assert.equal(
  cat({
    name: "x.pdf",
    entityTypes: ["commercial_quote"],
  }),
  "devis_avenants",
);
assert.equal(
  cat({
    name: "x.pdf",
    entityTypes: ["commercial_invoice"],
  }),
  "factures_situations",
);
assert.equal(
  cat({
    name: "x.pdf",
    entityTypes: ["commercial_progress"],
  }),
  "factures_situations",
);
assert.equal(cat({ poKind: "BL", name: "livraison.pdf" }), "commandes_bl");
assert.equal(
  cat({ poKind: "FICHE_TECHNIQUE", name: "ft.pdf" }),
  "fiches_techniques",
);
assert.equal(cat({ folderCode: "03", name: "plan.pdf" }), "plans_techniques");
assert.equal(cat({ folderCode: "11", name: "piece.pdf" }), "doe");
assert.equal(cat({ folderCode: "13", name: "ppsps.pdf" }), "securite_methodes");
assert.equal(cat({ folderCode: "14", name: "pv.pdf" }), "qualite_controles");

// classifyDocumentType aligné DOE > fiche technique
assert.equal(
  classifyDocumentType({ filename: "DOE-Fiche-technique-etancheite.pdf" }).documentType,
  "DOE",
);
assert.equal(
  classifyDocumentType({ filename: "Fiche-technique-isolant.pdf" }).documentType,
  "FICHE_TECHNIQUE",
);

// Compteurs : disponibles ≠ à récupérer (pas de double comptage)
const stats = buildCategoryStats([
  { group: "fiches_techniques", title: "A", isExpectedMissing: false },
  { group: "fiches_techniques", title: "B", isExpectedMissing: false },
  { group: "fiches_techniques", title: "C", isExpectedMissing: true },
  { group: "factures_situations", title: "F1", isExpectedMissing: false },
  { group: "devis_avenants", title: "D1", isExpectedMissing: true },
]);
const ft = stats.find((s) => s.id === "fiches_techniques");
assert.ok(ft);
assert.equal(ft.availableCount, 2);
assert.equal(ft.missingCount, 1);
assert.equal(formatCategoryCounts(2, 1), "2 documents · 1 à récupérer");
assert.equal(formatCategoryCounts(0, 2), "2 à récupérer");
assert.equal(formatCategoryCounts(6, 0), "6 documents");

// Catégories vides absentes
assert.ok(!stats.some((s) => s.id === "photos"));

console.log("GED-UI-3 catégories : OK");
