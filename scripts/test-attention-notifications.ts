/**
 * Tests W3-C1 — politique + déduplication notifications attention
 * Exécuter : npx tsx scripts/test-attention-notifications.ts
 */
import assert from "node:assert/strict";
import {
  buildAttentionDedupeKey,
  shouldNotifyAttentionLevel,
  notificationTypeForAttentionLevel,
  ATTENTION_NOTIFY_MIN_LEVEL,
} from "../src/lib/follow-up/attention/notify-policy";

function testLevels() {
  assert.equal(ATTENTION_NOTIFY_MIN_LEVEL, "IMPORTANT");
  assert.equal(shouldNotifyAttentionLevel("NORMAL"), false);
  assert.equal(shouldNotifyAttentionLevel("A_SURVEILLER"), false);
  assert.equal(shouldNotifyAttentionLevel("IMPORTANT"), true);
  assert.equal(shouldNotifyAttentionLevel("URGENT"), true);
  assert.equal(shouldNotifyAttentionLevel("CRITIQUE"), true);
}

function testTypes() {
  assert.equal(notificationTypeForAttentionLevel("IMPORTANT"), "FOLLOWUP_ATTENTION");
  assert.equal(notificationTypeForAttentionLevel("URGENT"), "FOLLOWUP_URGENT");
  assert.equal(notificationTypeForAttentionLevel("CRITIQUE"), "FOLLOWUP_CRITICAL");
}

function testDedupeIdentity() {
  const a = buildAttentionDedupeKey({
    userId: "julie",
    sheetId: "alpha",
    code: "BILLING_PENDING",
    level: "URGENT",
  });
  const same = buildAttentionDedupeKey({
    userId: "julie",
    sheetId: "alpha",
    code: "BILLING_PENDING",
    level: "URGENT",
  });
  const worse = buildAttentionDedupeKey({
    userId: "julie",
    sheetId: "alpha",
    code: "BILLING_PENDING",
    level: "CRITIQUE",
  });
  const otherUser = buildAttentionDedupeKey({
    userId: "marc",
    sheetId: "alpha",
    code: "BILLING_PENDING",
    level: "URGENT",
  });

  assert.equal(a, same);
  assert.notEqual(a, worse); // aggravation = nouvelle notif possible
  assert.notEqual(a, otherUser);
  assert.match(a, /^ATTENTION:julie:alpha:BILLING_PENDING:URGENT$/);
}

function testExternalNeverInKeyPolicy() {
  // La politique destinataire est testée via resolveAttentionRecipient en intégration ;
  // ici on vérifie que la clé inclut toujours le destinataire (isolation).
  const julie = buildAttentionDedupeKey({
    userId: "julie",
    sheetId: "s1",
    code: "STEP_OVERDUE",
    level: "IMPORTANT",
  });
  const sophie = buildAttentionDedupeKey({
    userId: "sophie-ext",
    sheetId: "s1",
    code: "STEP_OVERDUE",
    level: "IMPORTANT",
  });
  assert.notEqual(julie, sophie);
}

const tests: [string, () => void][] = [
  ["niveaux notifiés", testLevels],
  ["types Notification", testTypes],
  ["identité / aggravation", testDedupeIdentity],
  ["isolation destinataire", testExternalNeverInKeyPolicy],
];

let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    failed += 1;
    console.error(`✗ ${name}`);
    console.error(e);
  }
}
if (failed) process.exit(1);
console.log(`\n${tests.length} tests OK`);
