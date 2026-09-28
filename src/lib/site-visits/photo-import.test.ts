import assert from "node:assert/strict";
import {
  photoImportSummary,
  siteVisitPhotoSrc,
  snapshotPhotoFiles,
  unsupportedPhotoReason,
} from "./photo-import";

const jpg = siteVisitPhotoSrc("v1", {
  id: "m1",
  fileUrl: "storage://documents/orgs/o/site-visits/v1/a.jpg",
});
assert.equal(jpg, "/api/site-visits/v1/media?mediaId=m1");

const legacy = siteVisitPhotoSrc("v1", {
  id: "m1",
  fileUrl: "https://cdn.example/a.jpg",
});
assert.equal(legacy, "https://cdn.example/a.jpg");
assert.equal(siteVisitPhotoSrc("v1", { id: "m1", fileUrl: null }), null);

assert.equal(snapshotPhotoFiles(null).length, 0);
assert.equal(snapshotPhotoFiles([]).length, 0);

assert.match(
  unsupportedPhotoReason({ name: "IMG.HEIC", type: "" }) ?? "",
  /HEIC/,
);
assert.equal(unsupportedPhotoReason({ name: "a.jpg", type: "image/jpeg" }), null);
assert.match(
  unsupportedPhotoReason({ name: "note.pdf", type: "application/pdf" }) ?? "",
  /pas une image/,
);

assert.equal(photoImportSummary(3, 0), "3 photos ajoutées");
assert.equal(photoImportSummary(1, 0), "1 photo ajoutée");
assert.equal(photoImportSummary(2, 1), "2 photos ajoutées, 1 échec");
assert.equal(photoImportSummary(0, 1), "Import impossible");

console.log("photo-import.test.ts ok");
