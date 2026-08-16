/**
 * MESSAGERIE-FIX — Photos & Document opérationnels.
 * Run: npx tsx scripts/test-messagerie-fix-attachments.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  MESSAGERIE_DOC_ACCEPT,
  MESSAGERIE_PHOTO_ACCEPT,
  pickMessagerieDocFiles,
  pickMessageriePhotoFiles,
} from "../src/components/messagerie/MessagerieAttachMenu";
import { MESSAGERIE_MEDIA_BUCKET } from "../src/lib/messagerie/media-storage";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

function testPickerTrigger() {
  const menu = read("src/components/messagerie/MessagerieAttachMenu.tsx");
  assert.match(menu, /input\.click\(\)/);
  assert.match(menu, /triggerFileInput/);
  assert.match(menu, />\s*Photos\s*</);
  assert.match(menu, />\s*Document\s*</);
  assert.doesNotMatch(menu, /htmlFor=\{photoInputId\}/);
  assert.doesNotMatch(menu, /Caméra/);
  assert.doesNotMatch(menu, /capture=/);
  console.log("✓ menu + déclenche le picker via input.click (pas de label démonté)");
}

function testAcceptAndFilters() {
  assert.match(MESSAGERIE_PHOTO_ACCEPT, /image\/jpeg/);
  assert.match(MESSAGERIE_PHOTO_ACCEPT, /image\/webp/);
  assert.match(MESSAGERIE_DOC_ACCEPT, /\.pdf/);
  assert.doesNotMatch(MESSAGERIE_PHOTO_ACCEPT, /video/);
  const jpg = new File([new Uint8Array([1])], "a.jpg", { type: "image/jpeg" });
  const pdf = new File([new Uint8Array([1])], "b.pdf", { type: "application/pdf" });
  const mp4 = new File([new Uint8Array([1])], "c.mp4", { type: "video/mp4" });
  assert.equal(pickMessageriePhotoFiles([jpg, pdf, mp4]).length, 1);
  assert.equal(pickMessagerieDocFiles([jpg, pdf, mp4]).length, 1);
  assert.equal(pickMessagerieDocFiles([pdf])[0]?.name, "b.pdf");
  console.log("✓ accept + filtres photos/docs");
}

function testComposerPreviewAndUpload() {
  const view = read("src/components/messagerie/MessagerieView.tsx");
  const missions = read("src/components/messagerie/MessagerieMissionsView.tsx");
  for (const src of [view, missions]) {
    assert.match(src, /MessagerieComposerAttachments/);
    assert.match(src, /\/api\/messages\/direct\/upload/);
    assert.match(src, /Impossible d’envoyer ce fichier/);
    assert.match(src, /pickMessagerieDocFiles/);
    assert.doesNotMatch(src, /setPhotoPreview/);
    assert.doesNotMatch(src, /Caméra/);
  }
  assert.match(read("src/components/messagerie/MessagerieComposerAttachments.tsx"), /miniature|previewUrls|Retirer/);
  console.log("✓ preview composer + upload existant + erreur propre");
}

function testAclGedUnchanged() {
  assert.equal(MESSAGERIE_MEDIA_BUCKET, "messagerie");
  const acl = read("src/lib/messagerie/media-acl.ts");
  assert.match(acl, /organizationId|attachmentsJson/);
  const ingest = read("src/lib/ged/ingest-message-durable.ts");
  assert.match(ingest, /attachments/);
  console.log("✓ ACL + GED existants conservés");
}

function testSecureDisplay() {
  const secure = read("src/components/messagerie/MessagerieSecureMedia.tsx");
  assert.match(secure, /MessagerieSecureImage/);
  assert.match(secure, /MessagerieSecureFile/);
  assert.match(secure, /resolveSignedUrl|\/api\/messagerie\/media/);
  console.log("✓ affichage message : image + document via signed URL");
}

testPickerTrigger();
testAcceptAndFilters();
testComposerPreviewAndUpload();
testAclGedUnchanged();
testSecureDisplay();
console.log("OK — test:messagerie-fix-attachments");
