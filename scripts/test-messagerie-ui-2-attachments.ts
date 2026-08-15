/**
 * MESSAGERIE-UI-2 — menu pièces jointes : visible = opérationnel.
 * Run: npx tsx scripts/test-messagerie-ui-2-attachments.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  MESSAGERIE_DOC_ACCEPT,
  MESSAGERIE_PHOTO_ACCEPT,
  pickMessageriePhotoFiles,
} from "../src/components/messagerie/MessagerieAttachMenu";
import { MESSAGERIE_MEDIA_BUCKET } from "../src/lib/messagerie/media-storage";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

function testMenuSource() {
  const files = [
    "src/components/messagerie/MessagerieAttachMenu.tsx",
    "src/components/messagerie/MessagerieMissionsView.tsx",
    "src/components/messagerie/MessagerieView.tsx",
  ];
  for (const f of files) {
    const src = read(f);
    assert.doesNotMatch(src, /Caméra/);
    assert.doesNotMatch(src, /capture=/);
    assert.doesNotMatch(src, /Photos et vidéos/);
  }
  const menu = read("src/components/messagerie/MessagerieAttachMenu.tsx");
  assert.match(menu, />\s*Photos\s*</);
  assert.match(menu, />\s*Document\s*</);
  assert.match(menu, /aria-label="Joindre une photo ou un document"/);
  assert.match(menu, /aria-expanded/);
  assert.match(menu, /Escape/);
  assert.match(menu, /role="menu"/);
  console.log("✓ menu + : Photos + Document, pas de caméra / vidéo");
}

function testAcceptMatchesUpload() {
  const upload = read("src/app/api/messages/direct/upload/route.ts");
  assert.match(upload, /image\/jpeg/);
  assert.match(upload, /application\/pdf/);
  assert.doesNotMatch(upload, /"video\//);
  assert.match(MESSAGERIE_PHOTO_ACCEPT, /image\/jpeg/);
  assert.match(MESSAGERIE_PHOTO_ACCEPT, /image\/png/);
  assert.match(MESSAGERIE_DOC_ACCEPT, /\.pdf/);
  assert.doesNotMatch(MESSAGERIE_DOC_ACCEPT, /mp4/);
  assert.doesNotMatch(MESSAGERIE_PHOTO_ACCEPT, /video/);
  console.log("✓ accept picker = formats réellement uploadables");
}

function testPhotoFilter() {
  const jpg = new File([new Uint8Array([1, 2, 3])], "mur.jpg", { type: "image/jpeg" });
  const mp4 = new File([new Uint8Array([1, 2, 3])], "clip.mp4", { type: "video/mp4" });
  const pdf = new File([new Uint8Array([1, 2, 3])], "devis.pdf", { type: "application/pdf" });
  const empty = new File([], "vide.jpg", { type: "image/jpeg" });
  const picked = pickMessageriePhotoFiles([jpg, mp4, pdf, empty]);
  assert.equal(picked.length, 1);
  assert.equal(picked[0]?.name, "mur.jpg");
  assert.deepEqual(pickMessageriePhotoFiles(null), []);
  console.log("✓ filtre Photos : images seules, vidéos exclues");
}

function testStorageAndGedUnchanged() {
  const upload = read("src/app/api/messages/direct/upload/route.ts");
  assert.match(upload, /MESSAGERIE_MEDIA_BUCKET/);
  assert.equal(MESSAGERIE_MEDIA_BUCKET, "messagerie");
  const ingest = read("src/lib/ged/ingest-message-durable.ts");
  assert.match(ingest, /attachments/);
  console.log("✓ bucket messagerie + GED existante inchangés");
}

function testViewsWireMenu() {
  const missions = read("src/components/messagerie/MessagerieMissionsView.tsx");
  const view = read("src/components/messagerie/MessagerieView.tsx");
  assert.match(missions, /MessagerieAttachMenu/);
  assert.match(view, /MessagerieAttachMenu/);
  assert.match(missions, /pickMessageriePhotoFiles/);
  assert.match(view, /pickMessageriePhotoFiles/);
  console.log("✓ composers branchés sur le menu unique");
}

testMenuSource();
testAcceptMatchesUpload();
testPhotoFilter();
testStorageAndGedUnchanged();
testViewsWireMenu();
console.log("OK — test:messagerie-ui-2-attachments");
