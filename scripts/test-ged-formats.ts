/**
 * Tests GED — formats, suggestion rubrique, modes d’aperçu.
 * Exécution : npx tsx scripts/test-ged-formats.ts
 */
import assert from "node:assert/strict";
import {
  previewModeLabel,
  resolveGedPreviewMode,
  suggestFolderCode,
} from "../src/lib/ged/formats";

function run() {
  assert.equal(resolveGedPreviewMode("CCAP.pdf", "application/pdf"), "native");
  assert.equal(resolveGedPreviewMode("photo.jpg", "image/jpeg"), "native");
  assert.equal(resolveGedPreviewMode("memo.docx", "application/vnd.openxmlformats"), "converted");
  assert.equal(resolveGedPreviewMode("fondations.dwg"), "metadata_only");
  assert.equal(resolveGedPreviewMode("archive.zip"), "download_only");

  assert.ok(previewModeLabel("converted").includes("original"));
  assert.equal(suggestFolderCode({ filename: "x.pdf", category: "À classer" }), "00");
  assert.equal(suggestFolderCode({ filename: "CCAP.pdf", category: "Marché", documentType: "CCAP" }), "12");
  assert.equal(suggestFolderCode({ filename: "plan.dwg", category: "Plans" }), "03");
  assert.equal(suggestFolderCode({ filename: "facture.pdf", category: "Factures" }), "09");

  console.log("OK — test-ged-formats");
}

run();
