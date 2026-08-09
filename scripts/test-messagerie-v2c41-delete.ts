/**
 * Tests MESSAGERIE-V2C.4.1 — action Supprimer (menu + soft-delete helpers).
 * Run: npx tsx scripts/test-messagerie-v2c41-delete.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  deletedMessageLabel,
  deletedReplyExcerpt,
  isSoftDeleted,
  maybeRedactReplyExcerpt,
  redactSoftDeletedMessage,
} from "../src/lib/messagerie/message-delete";

const root = join(__dirname, "..");
function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

// Helpers
assert.equal(deletedMessageLabel({ deletedAt: null }, "u1"), null);
assert.equal(
  deletedMessageLabel({ deletedAt: "2026-01-01", deletedById: "u1" }, "u1"),
  "Vous avez supprimé ce message",
);
assert.equal(
  deletedMessageLabel({ deletedAt: "2026-01-01", deletedById: "u2" }, "u1"),
  "Message supprimé",
);
assert.ok(isSoftDeleted({ deletedAt: new Date() }));
assert.equal(deletedReplyExcerpt(), "Message supprimé");

const redacted = redactSoftDeletedMessage({
  id: "m1",
  content: "secret",
  attachmentsJson: [{ name: "a.pdf" }],
  deletedAt: "2026-01-01",
  deletedById: "u1",
  payloadJson: {
    replyTo: { id: "r1", senderName: "Sophie", excerpt: "visible" },
    reactions: { u1: "👍" },
  },
});
assert.equal(redacted.content, "");
assert.equal(redacted.attachmentsJson, null);
assert.equal(
  (redacted.payloadJson as { replyTo: { excerpt: string } }).replyTo.excerpt,
  "Message supprimé",
);

const reply = maybeRedactReplyExcerpt(
  { id: "gone", senderName: "A", excerpt: "hello" },
  new Set(["gone"]),
);
assert.equal(reply?.excerpt, "Message supprimé");

// Menu : Supprimer présent, danger, avant Sélectionner
const menu = read("src/components/messagerie/MessageContextMenu.tsx");
assert.ok(menu.includes('id: "delete"'));
assert.ok(menu.includes("Supprimer"));
assert.ok(menu.includes("danger: true"));
const delIdx = menu.indexOf('id: "delete"');
const selIdx = menu.indexOf('id: "select"');
assert.ok(delIdx > 0 && selIdx > delIdx);

// Capabilities activées (plus de delete: false forcé)
const missions = read("src/components/messagerie/MessagerieMissionsView.tsx");
assert.ok(missions.includes("delete: !m.deletedAt"));
assert.ok(missions.includes("MessageDeleteDialog"));
assert.ok(missions.includes("/api/messages/delete"));
assert.ok(missions.includes('confirmDelete("everyone")') || missions.includes('confirmDelete("me")'));

const view = read("src/components/messagerie/MessagerieView.tsx");
assert.ok(view.includes("delete: !m.deletedAt"));
assert.ok(view.includes("MessageDeleteDialog"));

// API + schéma
const api = read("src/app/api/messages/delete/route.ts");
assert.ok(api.includes('mode === "me"'));
assert.ok(api.includes('mode === "everyone"') || api.includes("everyone"));
assert.ok(api.includes("messageUserHide"));
assert.ok(api.includes("Seul l’auteur peut supprimer pour tous") || api.includes("auteur"));
assert.ok(api.includes("deleted_everyone"));

const schema = read("prisma/schema.prisma");
assert.ok(schema.includes("model MessageUserHide"));
assert.ok(schema.includes("deletedAt"));
assert.ok(schema.includes("deletedById"));

const sql = read("prisma/migrations/add-messagerie-v2c41-delete.sql");
assert.ok(sql.includes("MessageUserHide"));
assert.ok(sql.includes("deletedAt"));

// Broadcast op
const broadcast = read("src/lib/messagerie/broadcast.ts");
assert.ok(broadcast.includes("deleted_everyone"));

console.log("OK — test:messagerie-v2c41-delete");
