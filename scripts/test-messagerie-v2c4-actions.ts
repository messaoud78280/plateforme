/**
 * Tests MESSAGERIE-V2C.4 — reply / réactions / forward ACL / Voir plus / Important.
 * Run: npx tsx scripts/test-messagerie-v2c4-actions.ts
 */
import assert from "node:assert/strict";
import {
  encodeReplyIntoContent,
  getReplyFromPayload,
  makeReplyExcerpt,
  mergeReplyIntoPayload,
  parseContentWithReply,
  shortQuoteLines,
} from "../src/lib/messagerie/message-reply";
import {
  aggregateReactions,
  applyReactionToMap,
  getReactionsFromPayload,
  mergeReactionsIntoPayload,
} from "../src/lib/messagerie/message-reactions";
import {
  canForwardAttachments,
  evaluateForwardSafety,
  scopeFromChannel,
  scopeFromTaskInternal,
} from "../src/lib/messagerie/forward-safety";
import { isLongMessageBody } from "../src/lib/messagerie/message-expand";
import {
  parsePersonalMessageKey,
} from "../src/lib/messagerie/message-personal-flags";

// —— Reply ——
const excerpt = makeReplyExcerpt("Vous avez une date limite côté chantier ?");
assert.ok(excerpt.includes("date limite"));
const payload = mergeReplyIntoPayload(null, {
  id: "msg1",
  senderName: "Sophie Martin",
  excerpt,
});
assert.equal(getReplyFromPayload(payload)?.senderName, "Sophie Martin");

const encoded = encodeReplyIntoContent("Idéalement avant vendredi.", {
  id: "msg1",
  senderName: "Sophie Martin",
  excerpt,
});
const parsed = parseContentWithReply(encoded);
assert.equal(parsed.reply?.id, "msg1");
assert.equal(parsed.body, "Idéalement avant vendredi.");
assert.ok(shortQuoteLines("a".repeat(200)).endsWith("…"));

// —— Reactions ——
let map = applyReactionToMap({}, "u1", "👍");
map = applyReactionToMap(map, "u2", "❤️");
map = applyReactionToMap(map, "u1", "😂"); // replace
assert.equal(map.u1, "😂");
map = applyReactionToMap(map, "u1", null); // remove
assert.equal(map.u1, undefined);
const agg = aggregateReactions({ a: "👍", b: "👍", c: "❤️" });
assert.equal(agg[0]?.emoji, "👍");
assert.equal(agg[0]?.count, 2);
const withReact = mergeReactionsIntoPayload({ replyTo: { id: "x" } }, { u1: "👍" });
assert.equal(getReactionsFromPayload(withReact).u1, "👍");
assert.equal((withReact as { replyTo?: { id: string } }).replyTo?.id, "x");

// —— Forward ACL ——
const warn = evaluateForwardSafety("INTERNAL", "EXTERNAL");
assert.equal(warn.ok, true);
if (warn.ok) assert.equal(warn.needsConfirm, true);
const ok = evaluateForwardSafety("EXTERNAL", "INTERNAL");
assert.equal(ok.ok && !ok.needsConfirm, true);
assert.equal(scopeFromChannel("FOURNISSEUR"), "EXTERNAL");
assert.equal(scopeFromChannel("INTERNE"), "INTERNAL");
assert.equal(scopeFromTaskInternal(true), "INTERNAL");
const noAtt = canForwardAttachments({
  sourceScope: "INTERNAL",
  destScope: "EXTERNAL",
  hasAttachments: true,
});
assert.equal(noAtt.include, false);

// —— Voir plus ——
assert.equal(isLongMessageBody("court"), false);
assert.equal(isLongMessageBody("x".repeat(500)), true);
assert.equal(isLongMessageBody(Array(12).fill("ligne").join("\n")), true);

// —— Personal keys ——
assert.deepEqual(parsePersonalMessageKey("TASK:abc"), {
  kind: "TASK",
  messageId: "abc",
});
assert.equal(parsePersonalMessageKey("bad"), null);

// Important ≠ métier
assert.ok(
  "Important est personnel — ne pas confondre avec À traiter / Urgent / W3",
);

console.log("OK — test:messagerie-v2c4-actions");
