/**
 * Tests MESSAGERIE-V2C.1 — stockage / refs / MIME.
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
import { formatMediaPreview } from "../src/lib/messagerie/media-preview";

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

assert.equal(
  formatMediaPreview("", [
    {
      name: "v.webm",
      fileUrl: ref,
      fileSize: 1,
      mimeType: "audio/webm",
      durationSec: 12,
    },
  ]),
  "🎤 Message vocal (0:12)",
);

/** MIME candidates — même ordre que useVoiceRecorder */
function pickMimeType(isSupported: (t: string) => boolean): string | undefined {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];
  return candidates.find((t) => isSupported(t));
}
assert.equal(
  pickMimeType((t) => t === "audio/webm;codecs=opus"),
  "audio/webm;codecs=opus",
);
assert.equal(
  pickMimeType((t) => t === "audio/mp4"),
  "audio/mp4",
);
assert.equal(pickMimeType(() => false), undefined);

console.log("OK — test:messagerie-v2c1-hardening");
