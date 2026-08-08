/**
 * Tests CDE-1 + CDE-2A — commandes / fournisseur / permissions
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
import {
  REFUSE_REASONS,
  supplierActionsForStatus,
} from "../src/lib/purchase-orders/supplier-ui";
import { sanitizeOrderForSupplier } from "../src/lib/purchase-orders/supplier-collaboration";
import { resolveDeliverySchedule } from "../src/lib/purchase-orders/sync-delivery";

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

function testSupplierCollaborationUi() {
  const open = supplierActionsForStatus("A_CONFIRMER", "NONE");
  assert.equal(open.canConfirm, true);
  assert.equal(open.canPropose, true);
  assert.equal(open.canRefuse, true);

  const pending = supplierActionsForStatus("A_CONFIRMER", "PENDING");
  assert.equal(pending.canConfirm, false);
  assert.equal(pending.proposalPending, true);
  assert.equal(pending.canPropose, true);

  const refusedProp = supplierActionsForStatus("A_CONFIRMER", "REFUSED");
  assert.equal(refusedProp.proposalRefused, true);
  assert.equal(refusedProp.canConfirm, true);

  assert.ok(REFUSE_REASONS.some((r) => r.key === "STOCK"));

  const share = actionsForPurchaseOrderStatus("BROUILLON").find((a) => a.action === "send_supplier");
  assert.ok(share);
  assert.equal(share.label, "Partager avec le fournisseur");
  assert.equal(share.next, "A_CONFIRMER");

  const sanitized = sanitizeOrderForSupplier({
    id: "1",
    number: "BC-2026-043",
    internalNotes: "marge 12%",
    validator: { id: "x" },
    discountHt: 100,
    subject: "Membrane",
  });
  assert.equal(sanitized.subject, "Membrane");
  assert.equal("internalNotes" in sanitized, false);
  assert.equal("validator" in sanitized, false);
  assert.equal("discountHt" in sanitized, false);
}

function testDeliveryScheduleSync() {
  const requested = new Date(2026, 7, 11, 7, 30);
  const confirmed = new Date(2026, 7, 11, 9, 0);
  const proposed = new Date(2026, 7, 11, 10, 30);

  const pending = resolveDeliverySchedule({
    status: "A_CONFIRMER",
    requestedDeliveryAt: requested,
    confirmedDeliveryAt: null,
    proposedDeliveryAt: proposed,
    proposedDeliveryStatus: "PENDING",
  });
  assert.equal(pending.action, "upsert");
  assert.equal(pending.startAt?.getTime(), requested.getTime());
  assert.equal(pending.agendaStatus, "PLANIFIE");
  assert.equal(pending.visualLabel, "PROPOSITION");

  const afterConfirm = resolveDeliverySchedule({
    status: "CONFIRMEE",
    requestedDeliveryAt: requested,
    confirmedDeliveryAt: confirmed,
    proposedDeliveryAt: null,
    proposedDeliveryStatus: "NONE",
  });
  assert.equal(afterConfirm.startAt?.getTime(), confirmed.getTime());
  assert.equal(afterConfirm.agendaStatus, "CONFIRME");

  // Proposition après confirmation : agenda reste sur confirmée
  const proposeAfter = resolveDeliverySchedule({
    status: "CONFIRMEE",
    requestedDeliveryAt: requested,
    confirmedDeliveryAt: confirmed,
    proposedDeliveryAt: proposed,
    proposedDeliveryStatus: "PENDING",
  });
  assert.equal(proposeAfter.startAt?.getTime(), confirmed.getTime());
  assert.equal(proposeAfter.agendaStatus, "CONFIRME");

  const refused = resolveDeliverySchedule({
    status: "REFUSEE",
    requestedDeliveryAt: requested,
    confirmedDeliveryAt: null,
    proposedDeliveryAt: null,
    proposedDeliveryStatus: "NONE",
  });
  assert.equal(refused.action, "cancel");

  const cancelled = resolveDeliverySchedule({
    status: "ANNULEE",
    requestedDeliveryAt: requested,
    confirmedDeliveryAt: confirmed,
    proposedDeliveryAt: null,
    proposedDeliveryStatus: "NONE",
  });
  assert.equal(cancelled.action, "cancel");
}

function main() {
  testTotals();
  testNumbering();
  testStatusTransitions();
  testPermissions();
  testSupplierCollaborationUi();
  testDeliveryScheduleSync();
  console.log("OK — test:purchase-orders (CDE-1 + CDE-2A + CDE-2B)");
}

main();
