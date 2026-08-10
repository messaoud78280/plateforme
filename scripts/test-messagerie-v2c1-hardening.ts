/**
 * Tests MESSAGERIE-V2C.1 / V2C.8 — stockage / refs / lecture historique audio.
 * Run: npx tsx scripts/test-messagerie-v2c1-hardening.ts
 */
import assert from "node:assert/strict";
import {
  buildMessagerieStorageRef,
  parseMessagerieStorageRef,
  isMessagerieMediaPath,
  MESSAGERIE_MEDIA_BUCKET,
  MESSAGERIE_MEDIA_MAX_BYTES,
} from "../src/lib/messagerie/media-storage";
import { formatMediaPreview, isAudioAttachment } from "../src/lib/messagerie/media-preview";

const ref = buildMessagerieStorageRef(MESSAGERIE_MEDIA_BUCKET, "v2c/user1/abc.webm");
assert.equal(ref, "storage://messagerie/v2c/user1/abc.webm");
const parsed = parseMessagerieStorageRef(ref);
assert.ok(parsed);
assert.equal(parsed!.bucket, "messagerie");
assert.equal(parsed!.path, "v2c/user1/abc.webm");
assert.ok(isMessagerieMediaPath(parsed!.bucket, parsed!.path));

const legacy = parseMessagerieStorageRef(
  "https://xxx.supabase.co/storage/v1/object/public/documents/dm/user/file.jpg",
);
assert.ok(legacy);
assert.equal(legacy!.bucket, "documents");
assert.ok(isMessagerieMediaPath(legacy!.bucket, legacy!.path));

assert.equal(MESSAGERIE_MEDIA_MAX_BYTES, 15 * 1024 * 1024);

/** Compat historique — anciens vocaux restent prévisualisables / détectables. */
const historicAudio = {
  name: "v.webm",
  fileUrl: ref,
  fileSize: 1,
  mimeType: "audio/webm",
  kind: "audio" as const,
  durationSec: 12,
};
assert.equal(isAudioAttachment(historicAudio), true);
assert.equal(formatMediaPreview("", [historicAudio]), "🎤 Message vocal (0:12)");

console.log("OK — test:messagerie-v2c1-hardening (lecture historique audio)");
