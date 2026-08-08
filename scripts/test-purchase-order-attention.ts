/**
 * Tests CDE-3B1 — evaluatePurchaseOrderAttention
 * Exécuter : npm run test:purchase-order-attention
 */
import assert from "node:assert/strict";
import {
  evaluatePurchaseOrderAttention,
  computeReceivingSnapshot,
} from "../src/lib/purchase-orders/attention/evaluate";
import { DEFAULT_PURCHASE_ORDER_ATTENTION_POLICY } from "../src/lib/purchase-orders/attention/policy";
import type { PurchaseOrderAttentionInput } from "../src/lib/purchase-orders/attention/types";
import {
  buildPurchaseOrderAttentionCard,
  filterAttentionCards,
  attentionCodeToCategory,
} from "../src/lib/a-traiter/attention-board";
import { serializeAttentionResult } from "../src/lib/follow-up/attention/evaluate";

function atLocal(y: number, m: number, d: number, h = 12, min = 0) {
  return new Date(y, m, d, h, min, 0, 0);
}

const NOW = atLocal(2026, 7, 9, 12); // 9 août 2026
const LINE_ID = "line-1";

function baseOrder(
  overrides: Partial<PurchaseOrderAttentionInput> = {},
): PurchaseOrderAttentionInput {
  return {
    id: "po-1",
    number: "BC-2026-043",
    status: "CONFIRMEE",
    subject: "40 rouleaux membrane EPDM",
    sharedWithSupplier: true,
    sharedWithSupplierAt: atLocal(2026, 7, 1, 10),
    requestedDeliveryAt: atLocal(2026, 7, 15, 7, 30),
    confirmedDeliveryAt: atLocal(2026, 7, 15, 9),
    proposedDeliveryStatus: "ACCEPTED",
    supplierName: "Point.P",
    projectTitle: "Résidence Victor Hugo",
    responsibleId: "karim",
    responsibleName: "Karim Benali",
    requestedById: "sophie",
    requestedByName: "Sophie",
    lines: [
      { id: LINE_ID, designation: "Membrane EPDM", unit: "rouleaux", quantity: 40 },
    ],
    receipts: [],
    receiptLines: [],
    ...overrides,
  };
}

function evalOrder(o: PurchaseOrderAttentionInput, now = NOW) {
  return evaluatePurchaseOrderAttention(o, {
    now,
    policy: DEFAULT_PURCHASE_ORDER_ATTENTION_POLICY,
  });
}

function testA_normalHealthy() {
  const r = evalOrder(baseOrder());
  assert.equal(r.effectiveUrgency, "NORMAL");
  assert.equal(r.attentionItems.length, 0);
}

function testB_sharedRecentNoAlert() {
  const r = evalOrder(
    baseOrder({
      status: "A_CONFIRMER",
      confirmedDeliveryAt: null,
      proposedDeliveryStatus: "NONE",
      requestedDeliveryAt: atLocal(2026, 7, 20, 7, 30),
      sharedWithSupplierAt: atLocal(2026, 7, 8, 12), // 24 h
    }),
  );
  assert.ok(!r.attentionItems.some((i) => i.code === "SUPPLIER_NO_RESPONSE"));
}

function testC_supplierNoResponse() {
  const r = evalOrder(
    baseOrder({
      status: "A_CONFIRMER",
      confirmedDeliveryAt: null,
      proposedDeliveryStatus: "NONE",
      requestedDeliveryAt: atLocal(2026, 7, 20, 7, 30),
      sharedWithSupplierAt: atLocal(2026, 7, 6, 12), // 72 h
    }),
  );
  assert.ok(r.attentionItems.some((i) => i.code === "SUPPLIER_NO_RESPONSE"));
  assert.ok(r.effectiveUrgency !== "NORMAL");
}

function testD_deliveryFarUnconfirmedNormal() {
  const r = evalOrder(
    baseOrder({
      status: "A_CONFIRMER",
      confirmedDeliveryAt: null,
      proposedDeliveryStatus: "NONE",
      requestedDeliveryAt: atLocal(2026, 7, 20, 7, 30),
      sharedWithSupplierAt: atLocal(2026, 7, 8, 18),
    }),
  );
  assert.ok(!r.attentionItems.some((i) => i.code === "DELIVERY_UNCONFIRMED"));
}

function testE_deliveryTomorrowUnconfirmed() {
  const r = evalOrder(
    baseOrder({
      status: "A_CONFIRMER",
      confirmedDeliveryAt: null,
      proposedDeliveryStatus: "NONE",
      requestedDeliveryAt: atLocal(2026, 7, 10, 7, 30),
      sharedWithSupplierAt: atLocal(2026, 7, 8, 18),
    }),
  );
  const item = r.attentionItems.find((i) => i.code === "DELIVERY_UNCONFIRMED");
  assert.ok(item);
  assert.equal(item!.level, "IMPORTANT");
}

function testF_deliveryOverdueUnconfirmed() {
  const r = evalOrder(
    baseOrder({
      status: "A_CONFIRMER",
      confirmedDeliveryAt: null,
      proposedDeliveryStatus: "NONE",
      requestedDeliveryAt: atLocal(2026, 7, 7, 7, 30),
      sharedWithSupplierAt: atLocal(2026, 7, 1),
    }),
  );
  const item = r.attentionItems.find((i) => i.code === "DELIVERY_UNCONFIRMED");
  assert.ok(item);
  assert.equal(item!.level, "CRITIQUE");
}

function testG_confirmedFutureNormal() {
  const r = evalOrder(
    baseOrder({
      confirmedDeliveryAt: atLocal(2026, 7, 14, 9),
      requestedDeliveryAt: atLocal(2026, 7, 14, 7, 30),
    }),
  );
  assert.equal(r.effectiveUrgency, "NORMAL");
}

function testH_deliveryNotReceived() {
  const r = evalOrder(
    baseOrder({
      confirmedDeliveryAt: atLocal(2026, 7, 9, 8), // 4 h ago
      requestedDeliveryAt: atLocal(2026, 7, 9, 8),
      receipts: [],
      receiptLines: [],
    }),
  );
  assert.ok(r.attentionItems.some((i) => i.code === "DELIVERY_NOT_RECEIVED"));
}

function testI_partialJustReceivedNoAlert() {
  const r = evalOrder(
    baseOrder({
      status: "PARTIELLEMENT_RECUE",
      confirmedDeliveryAt: atLocal(2026, 7, 9, 9),
      receipts: [
        {
          id: "r1",
          receivedAt: atLocal(2026, 7, 9, 9, 12),
          cancelledAt: null,
          status: "PARTIAL",
          deliveryNoteNumber: "PP-1",
          hasBlDocument: true,
        },
      ],
      receiptLines: [
        {
          orderLineId: LINE_ID,
          receiptId: "r1",
          receivedQty: 30,
          damagedQty: 0,
          refusedQty: 0,
        },
      ],
    }),
  );
  assert.ok(!r.attentionItems.some((i) => i.code === "PARTIAL_DELIVERY_PENDING"));
}

function testJ_partialAged() {
  const r = evalOrder(
    baseOrder({
      status: "PARTIELLEMENT_RECUE",
      confirmedDeliveryAt: atLocal(2026, 7, 6, 9),
      receipts: [
        {
          id: "r1",
          receivedAt: atLocal(2026, 7, 6, 9, 12),
          cancelledAt: null,
          status: "PARTIAL",
          deliveryNoteNumber: "PP-1",
          hasBlDocument: true,
        },
      ],
      receiptLines: [
        {
          orderLineId: LINE_ID,
          receiptId: "r1",
          receivedQty: 30,
          damagedQty: 0,
          refusedQty: 0,
        },
      ],
    }),
  );
  const item = r.attentionItems.find((i) => i.code === "PARTIAL_DELIVERY_PENDING");
  assert.ok(item);
  assert.match(item!.reason, /10/);
}

function testK_receiptIssue() {
  const r = evalOrder(
    baseOrder({
      status: "PARTIELLEMENT_RECUE",
      confirmedDeliveryAt: atLocal(2026, 7, 9, 9),
      receipts: [
        {
          id: "r1",
          receivedAt: atLocal(2026, 7, 9, 9, 15),
          cancelledAt: null,
          status: "WITH_ISSUES",
          deliveryNoteNumber: "PP-2",
          hasBlDocument: true,
        },
      ],
      receiptLines: [
        {
          orderLineId: LINE_ID,
          receiptId: "r1",
          receivedQty: 40,
          damagedQty: 3,
          refusedQty: 0,
        },
      ],
    }),
  );
  assert.ok(r.attentionItems.some((i) => i.code === "RECEIPT_ISSUE"));
  const snap = computeReceivingSnapshot(
    baseOrder({
      receipts: [
        {
          id: "r1",
          receivedAt: atLocal(2026, 7, 9, 9, 15),
          status: "WITH_ISSUES",
          hasBlDocument: true,
        },
      ],
      receiptLines: [
        {
          orderLineId: LINE_ID,
          receiptId: "r1",
          receivedQty: 40,
          damagedQty: 3,
          refusedQty: 0,
        },
      ],
    }),
  );
  assert.equal(snap.totalReceivedConforming, 37);
  assert.equal(snap.totalRemaining, 3);
}

function testL_blMissingRecentOk() {
  const r = evalOrder(
    baseOrder({
      status: "RECUE",
      confirmedDeliveryAt: atLocal(2026, 7, 9, 9),
      receipts: [
        {
          id: "r1",
          receivedAt: atLocal(2026, 7, 9, 11),
          cancelledAt: null,
          status: "COMPLETE",
          deliveryNoteNumber: null,
          hasBlDocument: false,
        },
      ],
      receiptLines: [
        {
          orderLineId: LINE_ID,
          receiptId: "r1",
          receivedQty: 40,
          damagedQty: 0,
          refusedQty: 0,
        },
      ],
    }),
  );
  assert.ok(!r.attentionItems.some((i) => i.code === "DELIVERY_NOTE_MISSING"));
}

function testM_blMissingAged() {
  const r = evalOrder(
    baseOrder({
      status: "RECUE",
      confirmedDeliveryAt: atLocal(2026, 7, 7, 9),
      receipts: [
        {
          id: "r1",
          receivedAt: atLocal(2026, 7, 7, 10),
          cancelledAt: null,
          status: "COMPLETE",
          deliveryNoteNumber: null,
          hasBlDocument: false,
        },
      ],
      receiptLines: [
        {
          orderLineId: LINE_ID,
          receiptId: "r1",
          receivedQty: 40,
          damagedQty: 0,
          refusedQty: 0,
        },
      ],
    }),
  );
  assert.ok(r.attentionItems.some((i) => i.code === "DELIVERY_NOTE_MISSING"));
}

function testN_multipleProblemsPrimary() {
  const r = evalOrder(
    baseOrder({
      status: "PARTIELLEMENT_RECUE",
      confirmedDeliveryAt: atLocal(2026, 7, 6, 9),
      receipts: [
        {
          id: "r1",
          receivedAt: atLocal(2026, 7, 6, 9, 12),
          cancelledAt: null,
          status: "WITH_ISSUES",
          deliveryNoteNumber: null,
          hasBlDocument: false,
        },
      ],
      receiptLines: [
        {
          orderLineId: LINE_ID,
          receiptId: "r1",
          receivedQty: 30,
          damagedQty: 3,
          refusedQty: 0,
        },
      ],
    }),
  );
  assert.ok(r.attentionItems.length >= 2);
  assert.ok(r.primaryReason);
  assert.equal(
    r.attentionItems[0]!.level,
    r.effectiveUrgency === "NORMAL" ? r.attentionItems[0]!.level : r.effectiveUrgency,
  );
}

function testO_supplierRefused() {
  const r = evalOrder(
    baseOrder({
      status: "REFUSEE",
      confirmedDeliveryAt: null,
      supplierRefuseReason: "Stock indisponible",
      proposedDeliveryStatus: "NONE",
    }),
  );
  const item = r.attentionItems.find((i) => i.code === "SUPPLIER_REFUSED");
  assert.ok(item);
  assert.equal(item!.level, "URGENT");
  assert.match(item!.reason, /Stock indisponible/);
}

function testP_noDataNoFalsePositive() {
  const r = evalOrder(
    baseOrder({
      status: "VALIDEE",
      sharedWithSupplier: false,
      sharedWithSupplierAt: null,
      requestedDeliveryAt: null,
      confirmedDeliveryAt: null,
      proposedDeliveryStatus: "NONE",
      receipts: [],
      receiptLines: [],
    }),
  );
  assert.equal(r.effectiveUrgency, "NORMAL");
  assert.equal(r.attentionItems.length, 0);
}

function testBoardCardAndSearch() {
  const attention = serializeAttentionResult(
    evalOrder(
      baseOrder({
        status: "A_CONFIRMER",
        confirmedDeliveryAt: null,
        proposedDeliveryStatus: "NONE",
        requestedDeliveryAt: atLocal(2026, 7, 10, 7, 30),
        sharedWithSupplierAt: atLocal(2026, 7, 8, 18),
      }),
    ),
  );
  const card = buildPurchaseOrderAttentionCard({
    order: {
      id: "po-1",
      number: "BC-2026-043",
      subject: "40 rouleaux membrane EPDM",
      supplierName: "Point.P",
      projectTitle: "Résidence Victor Hugo",
      status: "A_CONFIRMER",
      responsibleId: "karim",
      responsibleName: "Karim Benali",
      lineDesignations: ["Membrane EPDM"],
    },
    attention,
  });
  assert.ok(card);
  assert.equal(card!.subjectType, "PURCHASE_ORDER");
  assert.equal(card!.actionUrl, "/dashboard/commandes/po-1");
  assert.equal(attentionCodeToCategory("SUPPLIER_NO_RESPONSE"), "COMMANDE");
  assert.equal(attentionCodeToCategory("RECEIPT_ISSUE"), "RECEPTION");

  const found = filterAttentionCards([card!], { q: "epdm" });
  assert.equal(found.length, 1);
  const found2 = filterAttentionCards([card!], { q: "victor" });
  assert.equal(found2.length, 1);
  const normal = buildPurchaseOrderAttentionCard({
    order: {
      id: "po-ok",
      number: "BC-2026-099",
      subject: "OK",
      status: "CONFIRMEE",
    },
    attention: serializeAttentionResult(evalOrder(baseOrder({ id: "po-ok", number: "BC-2026-099" }))),
  });
  assert.equal(normal, null);
}

function testCancelledReceiptIgnored() {
  const snap = computeReceivingSnapshot(
    baseOrder({
      receipts: [
        {
          id: "r1",
          receivedAt: atLocal(2026, 7, 6),
          cancelledAt: atLocal(2026, 7, 7),
          status: "CANCELLED",
          hasBlDocument: false,
        },
      ],
      receiptLines: [
        {
          orderLineId: LINE_ID,
          receiptId: "r1",
          receivedQty: 30,
          damagedQty: 0,
          refusedQty: 0,
        },
      ],
    }),
  );
  assert.equal(snap.totalReceivedConforming, 0);
  assert.equal(snap.activeReceiptCount, 0);
}

const tests: [string, () => void][] = [
  ["A normale → NORMAL", testA_normalHealthy],
  ["B partagée récente → pas sans réponse", testB_sharedRecentNoAlert],
  ["C partagée > 48 h → SUPPLIER_NO_RESPONSE", testC_supplierNoResponse],
  ["D livraison lointaine → pas unconfirmed", testD_deliveryFarUnconfirmedNormal],
  ["E demain non confirmée → IMPORTANT", testE_deliveryTomorrowUnconfirmed],
  ["F demandée dépassée → CRITIQUE", testF_deliveryOverdueUnconfirmed],
  ["G confirmée future → NORMAL", testG_confirmedFutureNormal],
  ["H passée sans réception → DELIVERY_NOT_RECEIVED", testH_deliveryNotReceived],
  ["I 30/40 récent → pas PARTIAL pending", testI_partialJustReceivedNoAlert],
  ["J 30/40 ancien → PARTIAL_DELIVERY_PENDING", testJ_partialAged],
  ["K endommagés → RECEIPT_ISSUE", testK_receiptIssue],
  ["L BL absent récent → ok", testL_blMissingRecentOk],
  ["M BL absent après délai → DELIVERY_NOTE_MISSING", testM_blMissingAged],
  ["N plusieurs problèmes → primary max", testN_multipleProblemsPrimary],
  ["O refus fournisseur → SUPPLIER_REFUSED", testO_supplierRefused],
  ["P aucune donnée → aucun faux positif", testP_noDataNoFalsePositive],
  ["carte À traiter + recherche", testBoardCardAndSearch],
  ["réception annulée ignorée", testCancelledReceiptIgnored],
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
console.log(`\nOK — test:purchase-order-attention (${tests.length})`);
