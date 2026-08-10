/**
 * MESSAGERIE-RECETTE-V1 — Garantie P0 écriture superviseur.
 * Run: node --import tsx scripts/test-messagerie-recette-v1-supervisor-send.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  assertChannelSendMembershipInvariant,
  ChannelSendMembershipError,
} from "../src/lib/messagerie/channel-send-guarantee";
import {
  evaluateForwardSafety,
} from "../src/lib/messagerie/forward-safety";
import {
  shouldAccumulateChannelUnread,
  shouldNotifyChannelMember,
} from "../src/lib/messagerie/channel-membership-policy";

function testInvariant() {
  assert.deepEqual(
    assertChannelSendMembershipInvariant({
      messageCreated: true,
      senderIsParticipant: true,
    }),
    { ok: true },
  );
  const bad = assertChannelSendMembershipInvariant({
    messageCreated: true,
    senderIsParticipant: false,
  });
  assert.equal(bad.ok, false);
  console.log("✓ invariant : message ⇒ auteur participant");
}

function testMembershipErrorCode() {
  const e = new ChannelSendMembershipError();
  assert.equal(e.code, "CHANNEL_MEMBERSHIP_REQUIRED");
  console.log("✓ code CHANNEL_MEMBERSHIP_REQUIRED");
}

function testRouteUsesTransactionalGuarantee() {
  const route = readFileSync(
    join(process.cwd(), "src/app/api/messages/route.ts"),
    "utf8",
  );
  assert.match(route, /createChannelMessageWithSenderMembership/);
  assert.match(route, /ChannelSendMembershipError/);
  assert.doesNotMatch(
    route,
    /await addChannelParticipant\(\{\s*channelId: resolvedChannelId,\s*userId: session\.user\.id/,
  );
  const guarantee = readFileSync(
    join(process.cwd(), "src/lib/messagerie/channel-send-guarantee.ts"),
    "utf8",
  );
  assert.match(guarantee, /\$transaction/);
  assert.match(guarantee, /projectChannelParticipant\.upsert/);
  assert.match(guarantee, /message\.create/);
  console.log("✓ POST /api/messages : join+send transactionnel (pas join seul avant create)");
}

function testSupervisorNotifyUnread() {
  assert.equal(
    shouldNotifyChannelMember({ isAuthor: false, membership: "supervisor_only" }),
    false,
  );
  assert.equal(
    shouldAccumulateChannelUnread({ membership: "supervisor_only" }),
    false,
  );
  console.log("✓ superviseur non participant : pas notif / pas unread");
}

function testForwardNamesOrg() {
  const r = evaluateForwardSafety("INTERNAL", "EXTERNAL", { destLabel: "Point.P" });
  assert.equal(r.ok, true);
  if (r.ok && r.needsConfirm) {
    assert.match(r.warning, /Point\.P/);
    assert.doesNotMatch(r.warning, /le fournisseur/i);
  }
  const client = evaluateForwardSafety("INTERNAL", "EXTERNAL", {
    destLabel: "ABC Promotion",
  });
  assert.equal(client.ok, true);
  if (client.ok && client.needsConfirm) {
    assert.match(client.warning, /ABC Promotion/);
  }
  console.log("✓ transfert interne→externe nomme l’organisation");
}

function testUiNoWindowConfirmParticipate() {
  const view = readFileSync(
    join(process.cwd(), "src/components/messagerie/MessagerieView.tsx"),
    "utf8",
  );
  assert.doesNotMatch(view, /window\.confirm/);
  assert.match(view, /Participer et envoyer/);
  assert.match(view, /CHANNEL_MEMBERSHIP_REQUIRED/);
  console.log("✓ UX Participer et envoyer (pas window.confirm)");
}

testInvariant();
testMembershipErrorCode();
testRouteUsesTransactionalGuarantee();
testSupervisorNotifyUnread();
testForwardNamesOrg();
testUiNoWindowConfirmParticipate();
console.log("\nTous les tests RECETTE-V1 P0 OK.");
