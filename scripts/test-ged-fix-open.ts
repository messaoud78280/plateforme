/**
 * GED-FIX-1 — ouverture / classification fichiers.
 * npx tsx scripts/test-ged-fix-open.ts
 */
import assert from "node:assert/strict";
import {
  canOpenGedFileUrl,
  isAppServedFileUrl,
  isDemoPlaceholderFileUrl,
  resolveDocumentsObjectPath,
} from "../src/lib/ged/file-openability";
import { isExpectedMissingDocument } from "../src/lib/ged/classify-document";
import { extractStoragePathFromUrl } from "../src/lib/storage/supabase-object";

assert.equal(isDemoPlaceholderFileUrl("/demo-assets/placeholder-document.pdf"), true);
assert.equal(canOpenGedFileUrl("/demo-assets/placeholder-document.pdf"), false);
assert.equal(
  isExpectedMissingDocument({
    name: "Fiche-technique-isolant.pdf",
    fileUrl: "/demo-assets/placeholder-document.pdf",
    status: "RECU",
  }),
  true,
);

assert.equal(
  isAppServedFileUrl("/api/commercial/quotes/abc/pdf"),
  true,
);
assert.equal(canOpenGedFileUrl("/api/commercial/invoices/xyz/pdf"), true);
assert.equal(
  isExpectedMissingDocument({
    name: "FAC-2026-014.pdf",
    fileUrl: "/api/commercial/invoices/gedv203_inv_014/pdf",
    status: "RECU",
  }),
  false,
);

assert.equal(
  isExpectedMissingDocument({
    name: "Situation",
    fileUrl: null,
    status: "RECU",
  }),
  true,
);

assert.equal(
  resolveDocumentsObjectPath("storage://documents/commercial/o/quotes/q/v.pdf"),
  "commercial/o/quotes/q/v.pdf",
);
assert.equal(
  extractStoragePathFromUrl("commercial/o/quotes/q/v.pdf", "documents"),
  "commercial/o/quotes/q/v.pdf",
);
assert.equal(resolveDocumentsObjectPath("/api/commercial/quotes/x/pdf"), null);

console.log("✅ test-ged-fix-open OK");
