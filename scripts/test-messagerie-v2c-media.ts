/**
 * Tests unitaires MESSAGERIE-V2C — aperçus média + suggestions.
 * Run: npx tsx scripts/test-messagerie-v2c-media.ts
 */
import assert from "node:assert/strict";
import { formatMediaPreview } from "../src/lib/messagerie/media-preview";
import { suggestBeworkActions } from "../src/lib/messagerie/bework-actions";

assert.equal(
  formatMediaPreview("", [{ name: "v.webm", fileUrl: "x", fileSize: 1, mimeType: "audio/webm", durationSec: 18 }]),
  "🎤 Message vocal (0:18)",
);
assert.equal(
  formatMediaPreview("", [
    { name: "a.jpg", fileUrl: "x", fileSize: 1, mimeType: "image/jpeg" },
    { name: "b.jpg", fileUrl: "x", fileSize: 1, mimeType: "image/jpeg" },
  ]),
  "📷 2 photos",
);
assert.equal(
  formatMediaPreview("", [{ name: "a.jpg", fileUrl: "x", fileSize: 1, mimeType: "image/jpeg" }]),
  "📷 Photo",
);

const mediaActions = suggestBeworkActions("🎤 Message vocal", { media: true });
assert.ok(mediaActions.some((a) => a.id === "reserve" && a.preferred));
assert.ok(mediaActions.some((a) => a.id === "tache"));

const textActions = suggestBeworkActions("Il y a une réserve côté cour");
assert.ok(textActions[0]?.id === "reserve");

console.log("OK — test:messagerie-v2c-media");
