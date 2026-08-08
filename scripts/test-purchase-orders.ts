/**
 * Tests CDE-1 — commandes / totaux / statuts / permissions / numérotation
 * Exécuter : npm run test:purchase-orders
 */
import assert from "node:assert/strict";
import {
  actionsForPurchaseOrderStatus,
  canTransitionPurchaseOrder,
  PURCHASE_ORDER_STATUS_LABELS,
} from "../src/lib/purchase-orders/status";
import { computeOrderAmountHt, lineTotalHt } from "../src/lib/purchase-orders/totals";
import { isValidPurchaseOrderNumber } from "../src/lib/purchase-orders/numbering";
import {
  canListPurchaseOrders,
  isInternalPurchaseOrderActor,
  isSupplierPurchaseOrderActor,
} from "../src/lib/purchase-orders/access";

function testTotals() {
  assert.equal(lineTotalHt({ quantity: 40, unitPriceHt: 106.5 }), 4260);
  assert.equal(lineTotalHt({ quantity: 10, unitPriceHt: null }), null);

  const amount = computeOrderAmountHt(
    [
      { quantity: 40, unitPriceHt: 100 },
      { quantity: 12, unitPriceHt: 25 },
      { quantity: 80, unitPriceHt: null },
    ],
    { discountHt: 100, deliveryFeesHt: 50 },
  );
  // 4000 + 300 - 100 + 50 = 4250
  assert.equal(amount, 4250);

  assert.equal(computeOrderAmountHt([{ quantity: 5, unitPriceHt: null }]), null);
}

function testNumbering() {
  assert.equal(isValidPurchaseOrderNumber("BC-2026-0043"), true);
  assert.equal(isValidPurchaseOrderNumber("BC-2026-043"), true);
  assert.equal(isValidPurchaseOrderNumber("BC-26-043"), false);
  assert.equal(isValidPurchaseOrderNumber("CMD-2026-043"), false);
}

function testStatusTransitions() {
  assert.equal(canTransitionPurchaseOrder("BROUILLON", "A_VALIDER"), true);
  assert.equal(canTransitionPurchaseOrder("A_CONFIRMER", "CONFIRMEE"), true);
  assert.equal(canTransitionPurchaseOrder("CONFIRMEE", "PARTIELLEMENT_RECUE"), true);
  assert.equal(canTransitionPurchaseOrder("PARTIELLEMENT_RECUE", "RECUE"), true);
  assert.equal(canTransitionPurchaseOrder("RECUE", "BROUILLON"), false);
  assert.equal(canTransitionPurchaseOrder("CLOTUREE", "ANNULEE"), false);

  const actionsDraft = actionsForPurchaseOrderStatus("BROUILLON").map((a) => a.action);
  assert.ok(actionsDraft.includes("submit_validation"));
  assert.ok(actionsDraft.includes("cancel"));
  assert.ok(!actionsDraft.includes("receive"));

  const actionsConfirm = actionsForPurchaseOrderStatus("A_CONFIRMER").map((a) => a.action);
  assert.ok(actionsConfirm.includes("confirm_delivery"));
  assert.ok(!actionsConfirm.includes("validate"));

  assert.equal(PURCHASE_ORDER_STATUS_LABELS.A_CONFIRMER, "À confirmer");
  assert.equal(PURCHASE_ORDER_STATUS_LABELS.PARTIELLEMENT_RECUE, "Partiellement reçue");
}

function testPermissions() {
  assert.equal(canListPurchaseOrders({ id: "1", personType: "CLIENT_EXT" }), false);
  assert.equal(canListPurchaseOrders({ id: "1", permissionProfile: "CLIENT" }), false);
  assert.equal(canListPurchaseOrders({ id: "1", personType: "INTERNAL" }), true);
  assert.equal(canListPurchaseOrders({ id: "1", personType: "SUPPLIER" }), true);

  assert.equal(isInternalPurchaseOrderActor({ id: "1", personType: "INTERNAL" }), true);
  assert.equal(isInternalPurchaseOrderActor({ id: "1", personType: "SUPPLIER" }), false);
  assert.equal(isInternalPurchaseOrderActor({ id: "1", permissionProfile: "FOURNISSEUR" }), false);
  assert.equal(isInternalPurchaseOrderActor({ id: "1", personType: "CLIENT_EXT" }), false);

  assert.equal(isSupplierPurchaseOrderActor({ id: "1", personType: "SUPPLIER" }), true);
  assert.equal(isSupplierPurchaseOrderActor({ id: "1", personType: "INTERNAL" }), false);
}

function main() {
  testTotals();
  testNumbering();
  testStatusTransitions();
  testPermissions();
  console.log("OK — test:purchase-orders (CDE-1)");
}

main();
