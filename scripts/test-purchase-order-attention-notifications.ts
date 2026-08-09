/**
 * Tests CDE-3B2 — épisodes PO, dedupe, rappel/escalade (now injecté, sans DB).
 * Exécuter : npx tsx scripts/test-purchase-order-attention-notifications.ts
 */
import assert from "node:assert/strict";
import {
  buildStagedAttentionDedupeKey,
  DEFAULT_ESCALATION_BY_LEVEL,
} from "../src/lib/follow-up/attention/escalation-policy";
import { evaluateAttentionEscalation } from "../src/lib/follow-up/attention/evaluate-escalation";
import {
  notificationTypeForPurchaseOrderAttentionLevel,
  shouldNotifyAttentionLevel,
} from "../src/lib/follow-up/attention/notify-policy";
import {
  computeReceivingSnapshot,
  evaluatePurchaseOrderAttention,
} from "../src/lib/purchase-orders/attention/evaluate";
import { purchaseOrderAttentionEpisodeKey } from "../src/lib/purchase-orders/attention/episode";
import { purchaseOrderAttentionActionUrl } from "../src/lib/purchase-orders/attention/sync-notifications";
import type { PurchaseOrderAttentionInput } from "../src/lib/purchase-orders/attention/types";

function atLocal(y: number, m: number, d: number, h = 12, min = 0) {
  return new Date(y, m, d, h, min, 0, 0);
}

const NOW = atLocal(2026, 7, 9, 12);
const LINE = "line-1";
const KARIM = "karim";
const MARC = "marc";
const PO = "po-043";

function baseOrder(
  overrides: Partial<PurchaseOrderAttentionInput> = {},
): PurchaseOrderAttentionInput {
  return {
    id: PO,
    number: "BC-2026-043",
    status: "A_CONFIRMER",
    subject: "Membrane EPDM",
    sharedWithSupplier: true,
    sharedWithSupplierAt: atLocal(2026, 7, 6, 10),
    sharedEventId: "evt_shared_1",
    requestedDeliveryAt: atLocal(2026, 7, 15, 7, 30),
    confirmedDeliveryAt: null,
    proposedDeliveryStatus: "NONE",
    supplierName: "Point.P",
    projectTitle: "Victor Hugo",
    responsibleId: KARIM,
    responsibleName: "Karim",
    requestedById: "sophie",
    lines: [{ id: LINE, designation: "EPDM", unit: "rouleaux", quantity: 40 }],
    receipts: [],
    receiptLines: [],
    ...overrides,
  };
}

function poKey(
  userId: string,
  code: string,
  level: string,
  episode: string,
  stage: "INITIAL" | "REMINDER_1" | "REMINDER_2" | "ESCALATION",
) {
  return buildStagedAttentionDedupeKey({
    userId,
    sheetId: PO,
    code,
    level,
    episode,
    stage,
    subjectType: "PURCHASE_ORDER",
  });
}

function testCodesRenamed() {
  const r = evaluatePurchaseOrderAttention(
    baseOrder({
      status: "CONFIRMEE",
      confirmedDeliveryAt: atLocal(2026, 7, 8, 8),
      requestedDeliveryAt: atLocal(2026, 7, 8, 8),
    }),
    { now: NOW },
  );
  assert.ok(r.attentionItems.some((i) => i.code === "DELIVERY_OVERDUE"));
  assert.ok(!r.attentionItems.some((i) => (i.code as string) === "DELIVERY_NOT_RECEIVED"));
}

function testEpisodeStableNoResponse() {
  const o = baseOrder();
  const snap = computeReceivingSnapshot(o);
  const a = purchaseOrderAttentionEpisodeKey(o, "SUPPLIER_NO_RESPONSE", snap);
  const b = purchaseOrderAttentionEpisodeKey(o, "SUPPLIER_NO_RESPONSE", snap);
  assert.equal(a, b);
  assert.equal(a, "evt_shared_1");
}

function testEpisodeDeliveryOverdueUsesConfirmed() {
  const o = baseOrder({
    status: "CONFIRMEE",
    confirmedDeliveryAt: atLocal(2026, 7, 8, 9),
  });
  const snap = computeReceivingSnapshot(o);
  const ep = purchaseOrderAttentionEpisodeKey(o, "DELIVERY_OVERDUE", snap);
  assert.match(ep, /^conf:t/);
}

function testEpisodePartialUsesReceiptId() {
  const o = baseOrder({
    status: "PARTIELLEMENT_RECUE",
    confirmedDeliveryAt: atLocal(2026, 7, 6, 9),
    receipts: [
      {
        id: "r-partial",
        receivedAt: atLocal(2026, 7, 6, 10),
        cancelledAt: null,
        status: "PARTIAL",
        deliveryNoteNumber: "X",
        hasBlDocument: true,
      },
    ],
    receiptLines: [
      {
        orderLineId: LINE,
        receiptId: "r-partial",
        receivedQty: 30,
        damagedQty: 0,
        refusedQty: 0,
      },
    ],
  });
  const snap = computeReceivingSnapshot(o);
  assert.equal(
    purchaseOrderAttentionEpisodeKey(o, "PARTIAL_RECEIPT_PENDING", snap),
    "receipt:r-partial",
  );
}

function testDedupeIncludesSubjectType() {
  const k = poKey(KARIM, "SUPPLIER_NO_RESPONSE", "IMPORTANT", "evt_shared_1", "INITIAL");
  assert.match(k, /^ATTENTION:PURCHASE_ORDER:/);
  assert.ok(k.includes(PO));
  assert.ok(k.includes("INITIAL"));
}

function testPrimaryOnlyNotifyLevel() {
  assert.equal(shouldNotifyAttentionLevel("A_SURVEILLER"), false);
  assert.equal(shouldNotifyAttentionLevel("IMPORTANT"), true);
  assert.equal(notificationTypeForPurchaseOrderAttentionLevel("CRITIQUE"), "PURCHASE_ORDER_CRITICAL");
  assert.equal(notificationTypeForPurchaseOrderAttentionLevel("URGENT"), "PURCHASE_ORDER_URGENT");
  assert.equal(
    notificationTypeForPurchaseOrderAttentionLevel("IMPORTANT"),
    "PURCHASE_ORDER_ATTENTION",
  );
}

function testReminderAndDedupeTwice() {
  const episode = "evt_shared_1";
  const initial = {
    dedupeKey: poKey(KARIM, "SUPPLIER_NO_RESPONSE", "IMPORTANT", episode, "INITIAL"),
    userId: KARIM,
    type: "PURCHASE_ORDER_ATTENTION",
    createdAt: atLocal(2026, 7, 6, 10),
  };
  const t0 = evaluateAttentionEscalation({
    sheetId: PO,
    sheetTitle: "Point.P — BC-2026-043",
    code: "SUPPLIER_NO_RESPONSE",
    level: "IMPORTANT",
    primaryReason: "Point.P n’a pas répondu.",
    statusEpisodeKey: episode,
    responsibleId: KARIM,
    escalateToId: MARC,
    existingNotifications: [initial],
    now: atLocal(2026, 7, 7, 12), // +26 h
    subjectType: "PURCHASE_ORDER",
  });
  assert.equal(t0.action, "REMIND");
  assert.equal(t0.notificationType, "PURCHASE_ORDER_REMINDER");
  assert.equal(
    t0.dedupeKey,
    poKey(KARIM, "SUPPLIER_NO_RESPONSE", "IMPORTANT", episode, "REMINDER_1"),
  );

  const again = evaluateAttentionEscalation({
    sheetId: PO,
    sheetTitle: "Point.P — BC-2026-043",
    code: "SUPPLIER_NO_RESPONSE",
    level: "IMPORTANT",
    primaryReason: "Point.P n’a pas répondu.",
    statusEpisodeKey: episode,
    responsibleId: KARIM,
    escalateToId: MARC,
    existingNotifications: [
      initial,
      {
        dedupeKey: t0.dedupeKey!,
        userId: KARIM,
        type: "PURCHASE_ORDER_REMINDER",
        createdAt: atLocal(2026, 7, 7, 12),
      },
    ],
    now: atLocal(2026, 7, 7, 13),
    subjectType: "PURCHASE_ORDER",
  });
  assert.equal(again.action, "NONE");
}

function testEscalation() {
  const episode = "evt_shared_1";
  const initialAt = atLocal(2026, 7, 6, 10);
  const hours = DEFAULT_ESCALATION_BY_LEVEL.IMPORTANT.escalateAfterHours;
  const plan = evaluateAttentionEscalation({
    sheetId: PO,
    sheetTitle: "Point.P — BC-2026-043",
    code: "SUPPLIER_NO_RESPONSE",
    level: "IMPORTANT",
    primaryReason: "Point.P n’a pas répondu.",
    statusEpisodeKey: episode,
    responsibleId: KARIM,
    escalateToId: MARC,
    responsibleName: "Karim",
    existingNotifications: [
      {
        dedupeKey: poKey(KARIM, "SUPPLIER_NO_RESPONSE", "IMPORTANT", episode, "INITIAL"),
        userId: KARIM,
        type: "PURCHASE_ORDER_ATTENTION",
        createdAt: initialAt,
      },
    ],
    now: new Date(initialAt.getTime() + (hours + 1) * 3600000),
    subjectType: "PURCHASE_ORDER",
  });
  assert.equal(plan.action, "ESCALATE");
  assert.equal(plan.recipientId, MARC);
  assert.equal(plan.notificationType, "PURCHASE_ORDER_ESCALATION");
}

function testAggravationSameEpisodeDifferentLevel() {
  const o = baseOrder({
    requestedDeliveryAt: atLocal(2026, 7, 10, 7, 30), // demain
    sharedWithSupplierAt: atLocal(2026, 7, 8, 12),
  });
  const r = evaluatePurchaseOrderAttention(o, { now: NOW });
  const item = r.attentionItems.find((i) => i.code === "DELIVERY_UNCONFIRMED");
  assert.ok(item);
  const snap = computeReceivingSnapshot(o);
  const ep = purchaseOrderAttentionEpisodeKey(o, "DELIVERY_UNCONFIRMED", snap);
  const kImportant = poKey(KARIM, "DELIVERY_UNCONFIRMED", "IMPORTANT", ep, "INITIAL");
  const kUrgent = poKey(KARIM, "DELIVERY_UNCONFIRMED", "URGENT", ep, "INITIAL");
  assert.notEqual(kImportant, kUrgent);
  assert.ok(kImportant.includes(ep) && kUrgent.includes(ep));
}

function testResolutionStops() {
  const open = evaluatePurchaseOrderAttention(
    baseOrder({
      status: "A_CONFIRMER",
      confirmedDeliveryAt: null,
      proposedDeliveryStatus: "NONE",
      sharedWithSupplierAt: atLocal(2026, 7, 6, 10),
      requestedDeliveryAt: atLocal(2026, 7, 20, 7, 30),
    }),
    { now: NOW },
  );
  assert.ok(open.attentionItems.some((i) => i.code === "SUPPLIER_NO_RESPONSE"));

  const closed = evaluatePurchaseOrderAttention(
    baseOrder({
      status: "CONFIRMEE",
      confirmedDeliveryAt: atLocal(2026, 7, 15, 9),
      proposedDeliveryStatus: "ACCEPTED",
    }),
    { now: NOW },
  );
  assert.ok(!closed.attentionItems.some((i) => i.code === "SUPPLIER_NO_RESPONSE"));
}

function testRecidiveNewEpisode() {
  const snap = computeReceivingSnapshot(baseOrder());
  const ep1 = purchaseOrderAttentionEpisodeKey(
    baseOrder({ sharedEventId: "evt_a", sharedWithSupplierAt: atLocal(2026, 7, 1) }),
    "SUPPLIER_NO_RESPONSE",
    snap,
  );
  const ep2 = purchaseOrderAttentionEpisodeKey(
    baseOrder({ sharedEventId: "evt_b", sharedWithSupplierAt: atLocal(2026, 7, 20) }),
    "SUPPLIER_NO_RESPONSE",
    snap,
  );
  assert.notEqual(ep1, ep2);
}

function testActionUrls() {
  assert.equal(
    purchaseOrderAttentionActionUrl(PO, "SUPPLIER_PROPOSAL_PENDING"),
    `/dashboard/commandes/${PO}?focus=proposition`,
  );
  assert.equal(
    purchaseOrderAttentionActionUrl(PO, "RECEIPT_ISSUE"),
    `/dashboard/commandes/${PO}/reception`,
  );
  assert.equal(purchaseOrderAttentionActionUrl(PO, "ORDER_NOT_SENT"), `/dashboard/commandes/${PO}`);
}

function testScenarioBc043Pipeline() {
  // T+48h no response → IMPORTANT notifyable
  const t48 = evaluatePurchaseOrderAttention(
    baseOrder({
      sharedWithSupplierAt: atLocal(2026, 7, 7, 12),
      sharedEventId: "share1",
      requestedDeliveryAt: atLocal(2026, 7, 20, 7, 30),
    }),
    { now: NOW },
  );
  assert.ok(t48.attentionItems.some((i) => i.code === "SUPPLIER_NO_RESPONSE"));
  assert.ok(shouldNotifyAttentionLevel(t48.effectiveUrgency));

  // Confirm → stop no-response
  const confirmed = evaluatePurchaseOrderAttention(
    baseOrder({
      status: "CONFIRMEE",
      confirmedDeliveryAt: atLocal(2026, 7, 9, 8),
      proposedDeliveryStatus: "ACCEPTED",
    }),
    { now: NOW },
  );
  assert.ok(!confirmed.attentionItems.some((i) => i.code === "SUPPLIER_NO_RESPONSE"));

  // Same day overdue delivery → DELIVERY_OVERDUE
  const overdue = evaluatePurchaseOrderAttention(
    baseOrder({
      status: "CONFIRMEE",
      confirmedDeliveryAt: atLocal(2026, 7, 9, 8),
      requestedDeliveryAt: atLocal(2026, 7, 9, 8),
    }),
    { now: NOW },
  );
  assert.ok(overdue.attentionItems.some((i) => i.code === "DELIVERY_OVERDUE"));

  // Partial 30/40 aged → PARTIAL_RECEIPT_PENDING
  const partial = evaluatePurchaseOrderAttention(
    baseOrder({
      status: "PARTIELLEMENT_RECUE",
      confirmedDeliveryAt: atLocal(2026, 7, 6, 9),
      receipts: [
        {
          id: "r1",
          receivedAt: atLocal(2026, 7, 6, 9, 12),
          cancelledAt: null,
          status: "PARTIAL",
          deliveryNoteNumber: "PP",
          hasBlDocument: true,
        },
      ],
      receiptLines: [
        {
          orderLineId: LINE,
          receiptId: "r1",
          receivedQty: 30,
          damagedQty: 0,
          refusedQty: 0,
        },
      ],
    }),
    { now: NOW },
  );
  assert.ok(partial.attentionItems.some((i) => i.code === "PARTIAL_RECEIPT_PENDING"));
  assert.ok(!partial.attentionItems.some((i) => i.code === "DELIVERY_OVERDUE"));
}

const tests: [string, () => void][] = [
  ["codes normalisés DELIVERY_OVERDUE", testCodesRenamed],
  ["épisode stable SUPPLIER_NO_RESPONSE", testEpisodeStableNoResponse],
  ["épisode DELIVERY_OVERDUE = confirmedAt", testEpisodeDeliveryOverdueUsesConfirmed],
  ["épisode PARTIAL = receiptId", testEpisodePartialUsesReceiptId],
  ["dedupeKey PURCHASE_ORDER", testDedupeIncludesSubjectType],
  ["seuil notification + types", testPrimaryOnlyNotifyLevel],
  ["rappel + double run sans doublon", testReminderAndDedupeTwice],
  ["escalade Marc", testEscalation],
  ["aggravation même épisode niveaux distincts", testAggravationSameEpisodeDifferentLevel],
  ["résolution stoppe le code", testResolutionStops],
  ["récidive nouvel épisode", testRecidiveNewEpisode],
  ["actionUrl contextuelle", testActionUrls],
  ["scénario BC-2026-043 pipeline", testScenarioBc043Pipeline],
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
console.log(`\nOK — test:purchase-order-attention-notifications (${tests.length})`);
