/**
 * MESSAGERIE-V2C.6C — Verrouillage règles participant / supervision.
 * Run: node --import tsx scripts/test-messagerie-channel-membership.ts
 */
import assert from "node:assert/strict";
import {
  shouldAccumulateChannelUnread,
  shouldAppearInDiscussionsInbox,
  shouldAppearInParChantier,
  shouldNotifyChannelMember,
  supervisorFirstSendJoinsAsParticipant,
} from "../src/lib/messagerie/channel-membership-policy";

function testNotify() {
  assert.equal(
    shouldNotifyChannelMember({ isAuthor: true, membership: "participant" }),
    false,
  );
  assert.equal(
    shouldNotifyChannelMember({ isAuthor: false, membership: "participant" }),
    true,
  );
  assert.equal(
    shouldNotifyChannelMember({ isAuthor: false, membership: "supervisor_only" }),
    false,
  );
  assert.equal(
    shouldNotifyChannelMember({ isAuthor: false, membership: "none" }),
    false,
  );
  console.log("✓ notifications = participants hors auteur");
}

function testUnread() {
  assert.equal(shouldAccumulateChannelUnread({ membership: "participant" }), true);
  assert.equal(shouldAccumulateChannelUnread({ membership: "supervisor_only" }), false);
  console.log("✓ unread = participants seulement");
}

function testDiscussionsVsParChantier() {
  assert.equal(shouldAppearInDiscussionsInbox({ membership: "participant" }), true);
  assert.equal(shouldAppearInDiscussionsInbox({ membership: "supervisor_only" }), false);
  assert.equal(shouldAppearInParChantier({ canView: true }), true);
  assert.equal(shouldAppearInParChantier({ canView: false }), false);
  console.log("✓ Discussions ≠ Par chantier (supervision)");
}

function testSupervisorWrite() {
  assert.equal(supervisorFirstSendJoinsAsParticipant(), true);
  console.log("✓ écriture superviseur → devient participant");
}

testNotify();
testUnread();
testDiscussionsVsParChantier();
testSupervisorWrite();
console.log("\nTous les tests membership canal OK.");
