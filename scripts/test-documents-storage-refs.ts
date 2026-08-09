/**
 * Tests unitaires GED-V2A.2 — classify / convert documents refs.
 */
import assert from "node:assert/strict";
import {
  classifyDocumentsRef,
  normalizeIncomingDocumentsRef,
  toDocumentsStorageRef,
} from "../src/lib/storage/documents-ref-migrate";
import { extractStoragePathFromUrl, buildDocumentsStorageRef } from "../src/lib/storage/supabase-object";

function test() {
  const pub =
    "https://jaxgjtryrnlyelniisrf.supabase.co/storage/v1/object/public/documents/chantiers/abc/plan.pdf";
  const a = classifyDocumentsRef(pub);
  assert.equal(a.class, "B_PUBLIC_CONVERTIBLE");
  assert.equal(a.path, "chantiers/abc/plan.pdf");
  assert.equal(a.storageRef, "storage://documents/chantiers/abc/plan.pdf");
  assert.equal(toDocumentsStorageRef(pub), "storage://documents/chantiers/abc/plan.pdf");

  const already = "storage://documents/purchase-orders/x/bl/y.pdf";
  assert.equal(classifyDocumentsRef(already).class, "A_STORAGE_REF");
  assert.equal(toDocumentsStorageRef(already), null);

  const msg = "storage://messagerie/v2c/u/file.jpg";
  assert.equal(classifyDocumentsRef(msg).class, "C_EXTERNAL");
  assert.equal(toDocumentsStorageRef(msg), null);

  const ext = "https://example.com/file.pdf";
  assert.equal(classifyDocumentsRef(ext).class, "C_EXTERNAL");

  const empty = classifyDocumentsRef("");
  assert.equal(empty.class, "D_EMPTY");

  const raw = classifyDocumentsRef("chantiers/p1/01/file.pdf");
  assert.equal(raw.class, "E_RAW_PATH");
  assert.equal(raw.storageRef, "storage://documents/chantiers/p1/01/file.pdf");

  assert.equal(
    extractStoragePathFromUrl("storage://documents/a/b.pdf", "documents"),
    "a/b.pdf",
  );
  assert.equal(buildDocumentsStorageRef("a/b.pdf"), "storage://documents/a/b.pdf");

  // Round-trip public → storage → path
  const path = extractStoragePathFromUrl(pub, "documents");
  assert.equal(path, "chantiers/abc/plan.pdf");
  const ref = buildDocumentsStorageRef(path!);
  assert.equal(extractStoragePathFromUrl(ref, "documents"), path);

  assert.equal(normalizeIncomingDocumentsRef(pub), "storage://documents/chantiers/abc/plan.pdf");
  assert.equal(
    normalizeIncomingDocumentsRef("/demo-assets/placeholder-document.pdf"),
    "/demo-assets/placeholder-document.pdf",
  );

  console.log("✓ test-documents-storage-refs OK");
}

test();
