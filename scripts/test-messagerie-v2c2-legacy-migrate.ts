/**
 * Tests unitaires helpers MESSAGERIE-V2C.2
 * Run: npx tsx scripts/test-messagerie-v2c2-legacy-migrate.ts
 */
import assert from "node:assert/strict";
import {
  applyMigratedAttachment,
  buildLegacyTargetPath,
  findLegacyAttachments,
  isAlreadyMigratedRef,
  isLegacyPublicMessagerieUrl,
} from "../src/lib/messagerie/legacy-media-migrate";

const publicUrl =
  "https://jaxgjtryrnlyelniisrf.supabase.co/storage/v1/object/public/documents/dm/user1/123-photo.jpg";

assert.equal(isLegacyPublicMessagerieUrl(publicUrl), true);
assert.equal(isLegacyPublicMessagerieUrl("storage://messagerie/v2c/u/a.jpg"), false);
assert.equal(isAlreadyMigratedRef("storage://messagerie/legacy/direct/id/x"), true);

const target = buildLegacyTargetPath({
  messageKind: "DIRECT",
  messageId: "msg1",
  legacyPath: "dm/user1/123-photo.jpg",
  fileName: "photo.jpg",
});
assert.ok(target.startsWith("legacy/direct/msg1/"));
assert.equal(
  buildLegacyTargetPath({
    messageKind: "DIRECT",
    messageId: "msg1",
    legacyPath: "dm/user1/123-photo.jpg",
  }),
  target,
  "chemin déterministe",
);

const hits = findLegacyAttachments([
  { name: "photo.jpg", fileUrl: publicUrl, fileSize: 10, mimeType: "image/jpeg" },
  {
    name: "ok.webm",
    fileUrl: "storage://messagerie/v2c/u/ok.webm",
    fileSize: 1,
    mimeType: "audio/webm",
  },
]);
assert.equal(hits.length, 1);
assert.equal(hits[0]!.legacyPath, "dm/user1/123-photo.jpg");

const migrated = applyMigratedAttachment(
  [
    { name: "photo.jpg", fileUrl: publicUrl, fileSize: 10, mimeType: "image/jpeg" },
  ],
  0,
  target,
);
assert.equal(migrated[0]!.fileUrl, `storage://messagerie/${target}`);
assert.equal(migrated[0]!.bucket, "messagerie");
assert.equal(migrated[0]!.storagePath, target);
assert.equal(isLegacyPublicMessagerieUrl(migrated[0]!.fileUrl), false);

const hits2 = findLegacyAttachments(migrated);
assert.equal(hits2.length, 0, "déjà migré → ignore");

console.log("OK — test:messagerie-v2c2-legacy-migrate");
